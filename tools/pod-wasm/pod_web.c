// Pod's screen in the browser: the firmware's own display code (pod_display.c, pod_gfx.c,
// pod_fonts.c, tjpgd) compiled to wasm, driven by a small stand-in for the rest of the Pod.
//
// What is real: every pixel, the touch zones, the home screen, library list, Poster Now
// Playing, volume overlay, seek bar and messages. What is simulated: the SD card and the
// iPhone (a short made-up library and placeholder album art), playback time and the restart
// when you go home. JS calls pod_frame() every animation frame and pod_touch() on pointer events.
#include "pod_display_step.c"   // pod_display.c with core1_main() made steppable (transform.py)

#define EXPORT(name) __attribute__((export_name(#name)))

// ------------------------------------------------------------------ hardware stand-ins
uint64_t host_now_us;
static bool touch_down;
static int touch_x, touch_y;
static uint16_t screen[GFX_W * GFX_H];   // what the ILI9341 would be showing, big-endian RGB565
static uint32_t screen_seq;              // bumped on every blit so JS knows when to re-upload

const uint16_t *pod_wallpaper(void) { return NULL; }   // no photo installed: the generated home art
void ili9341_init(void) {}
void ili9341_blit_be(int x, int y, int w, int h, const uint16_t *fb, int stride) {
    for (int r = 0; r < h; r++) memcpy(&screen[(y + r) * GFX_W + x], &fb[(y + r) * stride + x], (size_t)w * 2);
    screen_seq++;
}
void xpt2046_init(void) {}
bool xpt2046_irq_active(void) { return touch_down; }
bool xpt2046_read(xpt2046_raw_t *o) {
    if (!touch_down) return false;
    o->x = (uint16_t)touch_x; o->y = (uint16_t)touch_y; o->z = 1000;
    return true;
}

// ------------------------------------------------------------------ placeholder album art
#define ART_SLOTS 4
static uint8_t art_store[ART_SLOTS][POD_ART_MAX_BYTES];
static size_t art_len[ART_SLOTS];

// ------------------------------------------------------------------ the made-up library
typedef struct { const char *dir, *file, *title, *artist; uint32_t len_ms; int art; } track_t;
static const track_t tracks[] = {
    {"", "Marine Drive at 2 AM.mp3", "Marine Drive at 2 AM", "Harbour Lights", 214000, 0},
    {"", "Monsoon Window.mp3", "Monsoon Window", "Velvet Ghats", 242000, 1},
    {"", "Local Train.mp3", "Local Train", "Tin Roof Radio", 178000, 2},
    {"", "Solder Smoke.mp3", "Solder Smoke", "Signal Bench", 201000, 3},
    {"", "Night Shift.wav", "Night Shift", "Harbour Lights", 227000, 0},
    {"Lo-fi", "Rain on Perfboard.mp3", "Rain on Perfboard", "Signal Bench", 156000, 3},
    {"Lo-fi", "Breadboard Blues.mp3", "Breadboard Blues", "Tin Roof Radio", 189000, 2},
    {"Lo-fi", "Quiet Hostel.mp3", "Quiet Hostel", "Velvet Ghats", 171000, 1},
    {"Road trip", "Ghat Roads.mp3", "Ghat Roads", "Velvet Ghats", 263000, 1},
    {"Road trip", "Highway 48.mp3", "Highway 48", "Harbour Lights", 238000, 0},
};
#define N_TRACKS (int)(sizeof tracks / sizeof tracks[0])
static const char *folders[] = {"Lo-fi", "Road trip"};
static const int phone_queue[] = {1, 0, 9, 2};   // what the "iPhone" plays, in order

// ------------------------------------------------------------------ the rest of the Pod
enum { MODE_HOME, MODE_PHONE, MODE_SD } mode;
static int home_pressed = -1;
static int playing = -1;          // track index, -1 = none
static bool is_playing;
static uint32_t pos_base_ms, pos_base_at;
static int volume = 60;
static char browse_dir[32];
static bool showing_now;
static int scrub_dir;
static uint32_t next_scrub_ms, next_push_ms, connect_at_ms, home_at_ms;
static int phone_i;

static uint32_t now_ms(void) { return (uint32_t)(host_now_us / 1000); }
static uint32_t position_ms(void) {
    uint32_t p = pos_base_ms + (is_playing ? now_ms() - pos_base_at : 0);
    return playing >= 0 && p > tracks[playing].len_ms ? tracks[playing].len_ms : p;
}
static void push_progress(void) {
    if (playing >= 0) pod_display_set_progress(position_ms(), tracks[playing].len_ms, is_playing);
    next_push_ms = now_ms() + 5000;
}
static void seek_to(uint32_t ms) { pos_base_ms = ms; pos_base_at = now_ms(); push_progress(); }
static void set_playing(bool p) { pos_base_ms = position_ms(); pos_base_at = now_ms(); is_playing = p; pod_display_set_playing(p); push_progress(); }

static void load_track(int i) {
    const track_t *t = &tracks[i];
    playing = i;
    pod_display_set_title((const uint8_t *)t->title, strlen(t->title));
    pod_display_set_artist((const uint8_t *)t->artist, strlen(t->artist));
    pod_display_set_album((const uint8_t *)"", 0);
    if (art_len[t->art]) pod_display_set_art(art_store[t->art], art_len[t->art]);
    else pod_display_clear_art();
    pos_base_ms = 0; pos_base_at = now_ms(); is_playing = true;
    pod_display_set_playing(true);
    push_progress();
}

// ---- SD mode, after sd_player.c
static int list_highlight_for(const char *dir) {
    if (playing < 0 || strcmp(dir, tracks[playing].dir)) return -1;
    static char name[64];
    for (int i = 0; pod_display_list_get(i, name, sizeof name, NULL); i++)
        if (!strcmp(name, tracks[playing].file)) return i;
    return -1;
}
static void show_folder(const char *dir) {
    if (dir != browse_dir) strcpy(browse_dir, dir);
    pod_display_list_begin(browse_dir[0] ? browse_dir : "SD card", browse_dir[0] != 0);
    if (!browse_dir[0])
        for (int i = 0; i < 2; i++) pod_display_list_add(folders[i], true);
    for (int i = 0; i < N_TRACKS; i++)
        if (!strcmp(tracks[i].dir, browse_dir)) pod_display_list_add(tracks[i].file, false);
    pod_display_list_sort();
    pod_display_list_end(list_highlight_for(browse_dir));
    showing_now = false;
}
static int find_track(const char *dir, const char *file) {
    for (int i = 0; i < N_TRACKS; i++)
        if (!strcmp(tracks[i].dir, dir) && !strcmp(tracks[i].file, file)) return i;
    return -1;
}
// Next / previous file in the playing track's folder, in library (A-Z) order.
static int neighbour(int from, int dir) {
    int best = -1;
    for (int i = 0; i < N_TRACKS; i++) {
        if (i == from || strcmp(tracks[i].dir, tracks[from].dir)) continue;
        int c = strcasecmp(tracks[i].file, tracks[from].file);
        if (dir > 0 ? c > 0 && (best < 0 || strcasecmp(tracks[i].file, tracks[best].file) < 0)
                    : c < 0 && (best < 0 || strcasecmp(tracks[i].file, tracks[best].file) > 0)) best = i;
    }
    return best;
}
static void skip_track(int dir, bool user) {
    if (playing < 0) return;
    if (dir < 0 && position_ms() > 3000) { seek_to(0); return; }   // like an iPod: first restart the song
    int n = neighbour(playing, dir);
    if (n >= 0) {
        load_track(n);
        if (!showing_now) pod_display_show_list(list_highlight_for(browse_dir));
        return;
    }
    if (dir < 0) { seek_to(0); return; }
    pos_base_ms = 0; pos_base_at = now_ms(); is_playing = false;   // end of the folder
    pod_display_set_playing(false);
    push_progress();
    if (!user) pod_display_toast("End of folder");
}

static void go_home(void) { home_at_ms = now_ms() + 700; }   // the real Pod reboots here

static void reset_to_home(void) {
    // What a reboot does to pod_display.c's state, then pod_display_boot()'s defaults.
    memset(&mbox, 0, sizeof mbox);
    mbox_dirty = 0;
    cmdq_r = cmdq_w;
    mbox_vol_req = -1;
    sd_mode = false;
    ov_visible = false;
    toast_until_ms = 0;
    has_art = false;
    base = IDLE_BASE;
    list_n = list_used = 0;
    list_scroll = 0;
    playing = -1; is_playing = false; browse_dir[0] = 0; showing_now = false; scrub_dir = 0;
    home_at_ms = 0;
    mbox.volume = -1;
    mbox.battery = 72;
    mbox.list_highlight = -1;
    mbox.screen = SCREEN_NOW;
    strcpy(mbox.status, "Pod");
    strcpy(mbox.title, "Waiting for phone");
    strcpy(mbox.artist, "Pair \xE2\x80\x9CPod\xE2\x80\x9D in Bluetooth settings");
    memcpy(&cur, &mbox, sizeof cur);
    mode = MODE_HOME;
    home_pressed = -1;
    render_home(-1);
    blit_all();
}

static void start_source(pod_source_t src) {
    if (src == POD_SOURCE_SD) pod_display_set_sd_mode(true);
    pod_display_start();
    if (src == POD_SOURCE_SD) {
        mode = MODE_SD;
        pod_display_set_volume(volume);
        show_folder("");
    } else {
        mode = MODE_PHONE;
        connect_at_ms = now_ms() + 1400;   // the iPhone reconnects on its own
        phone_i = 0;
    }
}

static void handle_input(void) {
    int v = pod_display_take_volume();
    if (v >= 0) { volume = v; pod_display_set_volume(v); }
    pod_cmd_t c;
    while ((c = pod_display_take_command()) != POD_CMD_NONE) {
        switch (c) {
            case POD_CMD_PLAYPAUSE: if (playing >= 0) set_playing(!is_playing); break;
            case POD_CMD_NEXT:
                if (mode == MODE_SD) skip_track(+1, true);
                else if (playing >= 0) { phone_i = (phone_i + 1) % 4; load_track(phone_queue[phone_i]); }
                break;
            case POD_CMD_PREV:
                if (mode == MODE_SD) skip_track(-1, true);
                else if (playing >= 0) {
                    if (position_ms() > 3000) seek_to(0);
                    else { phone_i = (phone_i + 3) % 4; load_track(phone_queue[phone_i]); }
                }
                break;
            case POD_CMD_FF_START:  scrub_dir = +1; next_scrub_ms = 0; break;
            case POD_CMD_REW_START: scrub_dir = -1; next_scrub_ms = 0; break;
            case POD_CMD_SEEK_STOP: scrub_dir = 0; break;
            case POD_CMD_SEEK:
                if (playing >= 0) seek_to((uint32_t)((uint64_t)tracks[playing].len_ms * (uint32_t)pod_display_take_seek() / 1000));
                break;
            case POD_CMD_LIST_SELECT: {
                static char name[64];
                bool is_dir;
                if (!pod_display_list_get(pod_display_take_list_index(), name, sizeof name, &is_dir)) break;
                if (is_dir) show_folder(name);
                else {
                    int t = find_track(browse_dir, name);
                    if (t >= 0) { load_track(t); pod_display_show_now_playing(); showing_now = true; }
                }
                break;
            }
            case POD_CMD_NOW_PLAYING:
                if (playing >= 0) { pod_display_show_now_playing(); showing_now = true; }
                break;
            case POD_CMD_BACK:
                if (showing_now) show_folder(browse_dir);
                else if (browse_dir[0]) show_folder("");
                else go_home();
                break;
            case POD_CMD_HOME: go_home(); break;
            default: break;
        }
    }
    uint32_t now = now_ms();
    if (scrub_dir && playing >= 0 && now >= next_scrub_ms) {   // press-and-hold: 5 s every 250 ms
        int64_t t = (int64_t)position_ms() + scrub_dir * 5000;
        seek_to(t < 0 ? 0 : (uint32_t)t);
        next_scrub_ms = now + 250;
    }
}

static void tick_player(void) {
    uint32_t now = now_ms();
    if (mode == MODE_PHONE && connect_at_ms && now >= connect_at_ms) {
        connect_at_ms = 0;
        pod_display_set_status("Connected");
        pod_display_set_volume(volume);
        load_track(phone_queue[phone_i]);
    }
    if (playing >= 0 && is_playing && position_ms() >= tracks[playing].len_ms) {
        if (mode == MODE_SD) skip_track(+1, false);
        else { phone_i = (phone_i + 1) % 4; load_track(phone_queue[phone_i]); }
    }
    if (playing >= 0 && now >= next_push_ms) push_progress();
}

// ------------------------------------------------------------------ exports
EXPORT(pod_art_slot) uint8_t *pod_art_slot(int i) { return art_store[i]; }
EXPORT(pod_art_set) void pod_art_set(int i, int len) { art_len[i] = (size_t)len; }
EXPORT(pod_screen) uint16_t *pod_screen(void) { return screen; }
EXPORT(pod_screen_seq) uint32_t pod_screen_seq(void) { return screen_seq; }

EXPORT(pod_init) void pod_init(double t_ms) {
    host_now_us = (uint64_t)(t_ms * 1000);
    mutex_init(&mbox_lock);
    mutex_init(&list_lock);
    cal.swap_xy = 0; cal.ax_l = 20; cal.ax_r = 220; cal.ay_t = 20; cal.ay_b = 300;   // touch in screen pixels
    reset_to_home();
}

EXPORT(pod_touch) void pod_touch(int x, int y, int down) {
    touch_down = down != 0;
    if (down) { touch_x = x; touch_y = y; }
}

EXPORT(pod_frame) void pod_frame(double t_ms) {
    host_now_us = (uint64_t)(t_ms * 1000);
    if (mode == MODE_HOME) {   // pod_display_home(), one poll per frame
        int p = -1;
        if (touch_down && touch_y >= HOME_TILE_Y - 6 && touch_y < HOME_TILE_Y + HOME_TILE_H + 6)
            for (int t = 0; t < 2; t++)
                if (touch_x >= home_tile_x[t] - 4 && touch_x < home_tile_x[t] + HOME_TILE_W + 4) p = t;
        if (touch_down && p != home_pressed) { home_pressed = p; render_home(p); blit_all(); }
        else if (!touch_down && home_pressed >= 0) {
            int was = home_pressed;
            home_pressed = -1;
            start_source(was == 0 ? POD_SOURCE_PHONE : POD_SOURCE_SD);
        }
        return;
    }
    if (home_at_ms && now_ms() >= home_at_ms) { reset_to_home(); return; }
    handle_input();
    tick_player();
    core1_step();
}

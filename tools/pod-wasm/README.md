# Pod screen for the web

`public/pod/pod.wasm` is the Pod's real display code from the
[iPOD repo](https://github.com/saumyahindocha/iPOD) (`sdk/common/pod_display.c`, `pod_gfx.c`,
`pod_fonts.c`, `pod_logo.c` and the tjpgd JPEG decoder) compiled to WebAssembly, so the screen on
the site's 3D Pod looks and behaves exactly like the device: home picker, SD library, Poster Now
Playing, volume overlay, seek bar, toasts.

- `transform.py` makes `core1_main()`'s endless loop callable once per frame. Nothing else in the
  firmware is changed.
- `pod_web.c` stands in for the rest of the Pod: the touch controller and display driver, a short
  made-up SD library and "iPhone" queue (no real songs), playback time, and the restart when you go
  home. It follows `sd_player.c` and the Bluetooth sink's command handling.
- `libc/` is the handful of C library functions the display code uses.
- `make_covers.py` draws the four placeholder album covers in `public/pod/`.
- `src/pod/podEngine.ts` loads the wasm in the browser and copies its framebuffer to a canvas.

Rebuild after the firmware's UI changes (needs clang and wasm-ld, LLVM 15 or newer):

```sh
tools/pod-wasm/build.sh ../iPOD
```

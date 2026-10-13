/*
  Pod's real screen, running in the browser. public/pod/pod.wasm is the iPOD firmware's own
  display code (pod_display.c, pod_gfx.c, fonts, JPEG decoder) compiled for the web by
  tools/pod-wasm/build.sh; this wrapper feeds it time and touches and copies its 240×320
  RGB565 framebuffer into a canvas.
*/

type PodExports = {
  memory: WebAssembly.Memory;
  pod_init(t: number): void;
  pod_frame(t: number): void;
  pod_touch(x: number, y: number, down: number): void;
  pod_screen(): number;
  pod_screen_seq(): number;
  pod_art_slot(i: number): number;
  pod_art_set(i: number, len: number): void;
};

export const POD_W = 240;
export const POD_H = 320;
const COVERS = 4;

let wasm: Promise<WebAssembly.Module> | null = null;
let covers: Promise<Uint8Array[]> | null = null;

export class PodEngine {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: ImageData;
  private w: PodExports;
  private seq = -1;
  // A quick tap can start and end between two animation frames (or between the firmware's
  // 20 ms touch polls), so a lift is held back until the press has been seen.
  private frames = 0;
  private downAt = { frame: 0, t: 0 };
  private liftPending = false;
  private held = false;

  private constructor(w: PodExports, art: Uint8Array[]) {
    this.w = w;
    const mem = new Uint8Array(w.memory.buffer);
    art.forEach((a, i) => {
      mem.set(a, w.pod_art_slot(i));
      w.pod_art_set(i, a.length);
    });
    w.pod_init(performance.now());
    this.canvas = document.createElement("canvas");
    this.canvas.width = POD_W;
    this.canvas.height = POD_H;
    this.ctx = this.canvas.getContext("2d")!;
    this.img = this.ctx.createImageData(POD_W, POD_H);
  }

  static async create(): Promise<PodEngine> {
    wasm ??= WebAssembly.compileStreaming(fetch("/pod/pod.wasm"));
    covers ??= Promise.all(
      Array.from({ length: COVERS }, (_, i) =>
        fetch(`/pod/cover-${i}.jpg`)
          .then((r) => r.arrayBuffer())
          .then((b) => new Uint8Array(b)),
      ),
    );
    const [mod, art] = await Promise.all([wasm, covers]);
    const inst = await WebAssembly.instantiate(mod, {});
    return new PodEngine(inst.exports as unknown as PodExports, art);
  }

  /** Advance the Pod to `now` (ms). Returns true when the screen changed. */
  frame(now: number): boolean {
    this.w.pod_frame(now);
    this.frames++;
    if (this.liftPending && this.frames - this.downAt.frame >= 2 && now - this.downAt.t >= 45) {
      this.liftPending = false;
      this.w.pod_touch(0, 0, 0);
    }
    const s = this.w.pod_screen_seq();
    if (s === this.seq) return false;
    this.seq = s;
    const px = new Uint16Array(this.w.memory.buffer, this.w.pod_screen(), POD_W * POD_H);
    const d = this.img.data;
    for (let i = 0, j = 0; i < px.length; i++, j += 4) {
      const be = px[i];
      const v = ((be & 0xff) << 8) | (be >> 8);
      d[j] = ((v >> 11) & 31) * 8.226;
      d[j + 1] = ((v >> 5) & 63) * 4.048;
      d[j + 2] = (v & 31) * 8.226;
      d[j + 3] = 255;
    }
    this.ctx.putImageData(this.img, 0, 0);
    return true;
  }

  /** Touch in screen pixels (0..239, 0..319), like the Pod's XPT2046 after calibration. */
  touch(x: number, y: number, down: boolean) {
    if (!down) {
      this.held = false;
      this.liftPending = true; // released on a later frame
      return;
    }
    if (!this.held && !this.liftPending) this.downAt = { frame: this.frames, t: performance.now() };
    this.held = true;
    this.liftPending = false;
    this.w.pod_touch(
      Math.round(Math.min(POD_W - 1, Math.max(0, x))),
      Math.round(Math.min(POD_H - 1, Math.max(0, y))),
      down ? 1 : 0,
    );
  }
}

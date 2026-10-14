// Renders the still that the home-page hero shows before its 3D bench loads.
// Usage: build and serve the site, then: node tools/bench-poster/render.mjs http://localhost:4173/
// Re-run whenever src/three/BenchScene.tsx changes how the bench looks.
import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.argv[2], { waitUntil: "networkidle" });
await p.mouse.move(30, 880);
await p.mouse.move(32, 882);
await p.waitForTimeout(6000);
await p.addStyleTag({
  content: `html,body{background:transparent!important} .mat-edges::before,.mat-edges::after,.vignette,.lamp,.loupe{display:none!important} img[src*="bench-poster"],[data-bench-labels],[data-hint]{display:none!important}`,
});
const box = p
  .locator("canvas")
  .first()
  .locator('xpath=ancestor::div[contains(@class,"size-full")][1]');
await p.waitForTimeout(500);
const buf = await box.screenshot({ omitBackground: true });
const meta = await sharp(buf).metadata();
await sharp(buf)
  .webp({ quality: 74, alphaQuality: 80 })
  .toFile(new URL("../../public/media/bench-poster.webp", import.meta.url).pathname);
console.log(meta.width, meta.height);
await b.close();

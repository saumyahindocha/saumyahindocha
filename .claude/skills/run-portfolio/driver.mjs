// Screenshot a running copy of the site at phone (390 px) and desktop (1440 px) width.
// Usage: node .claude/skills/run-portfolio/driver.mjs <url> <out-dir> [css-selector]
// With a selector, also saves a phone-width shot of just that element.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const [, , url = "http://localhost:3000/", out = "shots", selector] = process.argv;
mkdirSync(out, { recursive: true });
// Use the pre-installed Chromium; the bundled headless shell may not be downloaded.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage({ viewport });
  // Reduced motion shows below-the-fold content at once instead of waiting for scroll reveals.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${out}/${name}-fold.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  if (selector && name === "mobile") {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${out}/element.png` });
  }
  await page.close();
}
await browser.close();
console.log(`saved to ${out}/`);

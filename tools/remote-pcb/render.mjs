// Renders the NIDS remote PCB Gerbers (self-balancing-bot/hardware/remote-pcb/gerbers)
// to top and bottom PNGs for the 3D board on the NIDS page.
// Usage: node tools/remote-pcb/render.mjs ../self-balancing-bot/hardware/remote-pcb/gerbers
import fs from "node:fs";
import path from "node:path";
import pcbStackup from "pcb-stackup";
import sharp from "sharp";

const dir = process.argv[2];
if (!dir) throw new Error("pass the gerbers folder");
const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(G[A-Z]{2}|DRL)$/i.test(f) && !/GDD|GDL|GTP|GBP/i.test(f));
const layers = files.map((f) => ({ filename: f, gerber: fs.createReadStream(path.join(dir, f)) }));
const out = path.resolve("public/media/nids-self-balancing-robot");

const stack = await pcbStackup(layers, {
  color: { fr4: "#5b4a1e", cu: "#c9a45c", cf: "#d8b46a", sm: "rgba(14, 80, 50, 0.86)", ss: "#f2efe6", sp: "#9a9a9a", out: "#000" },
});
const { width, height, units } = stack.top;
console.log(`board ${width} × ${height} ${units}`);
for (const side of ["top", "bottom"]) {
  const svg = Buffer.from(stack[side].svg);
  const file = path.join(out, `remote-pcb-${side}.png`);
  await sharp(svg, { density: 400, limitInputPixels: false }).resize({ width: 1024 }).png({ compressionLevel: 9 }).toFile(file);
  console.log(file, fs.statSync(file).size);
}
fs.writeFileSync(
  path.join(out, "remote-pcb.json"),
  JSON.stringify({ width, height, units }, null, 2) + "\n",
);

// Splits a Schematica ("Alpha") .schematic into horizontal slices small
// enough to import, keeping block metadata, the SchematicaMapping and every
// tile entity (microblocks, chests...) with its coordinates rebased.
//
// The empty border around the build is cropped first; every slice keeps the
// same x/z extent, so slice N goes exactly `height` blocks above slice N-1 at
// the same corner.
//
// usage: node tools/split-schematic.mjs <in.schematic> [--max-bytes 1500000] [--out dir]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { basename, join } from "node:path";
import { decode, encode, short, byteArray, list, TAG } from "../library/src/core/nbt.js";

const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith("--"));
const opt = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args[i + 1]; };
const maxBytes = Number(opt("--max-bytes", 1_500_000));
const stem = basename(input).replace(/\.schematic$/, "").replace(/^[0-9a-f]{8}-/, "");
const outDir = opt("--out", join("out", stem + "-split"));

const { name: rootName, value: s } = decode(gunzipSync(readFileSync(input)));
if (s.Materials !== "Alpha") throw new Error(`unsupported Materials ${s.Materials}`);
const W = s.Width.value, H = s.Height.value, L = s.Length.value, N = W * H * L;
const blocks = s.Blocks.value, data = s.Data.value;
const add = s.AddBlocks?.value;
const addPerCell = add && add.length === N; // one byte per block (Schematica)
if (add && !addPerCell && add.length) throw new Error("nibble-packed AddBlocks not supported");
const idx = (x, y, z) => (y * L + z) * W + x;

// Crop to the blocks actually present.
let x0 = W, x1 = -1, y0 = H, y1 = -1, z0 = L, z1 = -1;
for (let i = 0; i < N; i++) {
  if (!blocks[i] && !(addPerCell && add[i])) continue;
  const x = i % W, z = Math.floor(i / W) % L, y = Math.floor(i / (W * L));
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
}
const w = x1 - x0 + 1, l = z1 - z0 + 1;

const tileEntities = s.TileEntities?.value ?? [];
const teSize = te => encode("t", te).length;
const teByY = new Map();
for (const te of tileEntities) {
  const y = te.y.value;
  if (!teByY.has(y)) teByY.set(y, []);
  teByY.get(y).push(te);
}

// Greedy slices: grow each slice a layer at a time while the uncompressed
// NBT stays under maxBytes (3 bytes per position plus its tile entities).
const layerBytes = y => 3 * w * l + (teByY.get(y) ?? []).reduce((a, te) => a + teSize(te), 0);
const slices = [];
for (let y = y0; y <= y1;) {
  let top = y, bytes = layerBytes(y) + 512;
  while (top + 1 <= y1 && bytes + layerBytes(top + 1) <= maxBytes) bytes += layerBytes(++top);
  if (bytes > maxBytes) console.warn(`layer ${y} alone is ${bytes} bytes (over --max-bytes)`);
  slices.push([y, top]);
  y = top + 1;
}

mkdirSync(outDir, { recursive: true });
const summary = [];
slices.forEach(([ya, yb], n) => {
  const h = yb - ya + 1, M = w * h * l;
  const b = new Uint8Array(M), d = new Uint8Array(M), a = new Uint8Array(M);
  for (let y = ya; y <= yb; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const i = idx(x, y, z), j = ((y - ya) * l + (z - z0)) * w + (x - x0);
    b[j] = blocks[i]; d[j] = data[i]; if (addPerCell) a[j] = add[i];
  }
  const tes = [];
  for (let y = ya; y <= yb; y++) for (const te of teByY.get(y) ?? []) {
    const c = { ...te };
    c.x = { ...te.x, value: te.x.value - x0 };
    c.y = { ...te.y, value: te.y.value - ya };
    c.z = { ...te.z, value: te.z.value - z0 };
    tes.push(c);
  }
  const piece = {
    ...s,
    Width: short(w), Height: short(h), Length: short(l),
    Blocks: byteArray(b), Data: byteArray(d),
    ...(add ? { AddBlocks: byteArray(a) } : {}),
    Entities: list(TAG.Compound, []),
    TileEntities: list(TAG.Compound, tes),
  };
  const raw = encode(rootName, piece);
  const file = `${stem}_part${String(n + 1).padStart(2, "0")}_y${ya - y0}.schematic`;
  writeFileSync(join(outDir, file), gzipSync(raw));
  summary.push({ file, yOffset: ya - y0, height: h, bytes: raw.length, tileEntities: tes.length });
});

console.log(`${input}: ${W}x${H}x${L}, cropped to ${w}x${y1 - y0 + 1}x${l} (x ${x0}-${x1}, y ${y0}-${y1}, z ${z0}-${z1})`);
console.log(`${slices.length} slices, max ${maxBytes} bytes uncompressed each, written to ${outDir}`);
for (const p of summary) console.log(`  ${p.file}  +${p.yOffset} up, ${p.height} tall, ${(p.bytes / 1e6).toFixed(2)} MB, ${p.tileEntities} tile entities`);
writeFileSync(join(outDir, "README.txt"), [
  `${stem}: split from ${W}x${H}x${L} into ${slices.length} slices of ${w} x ? x ${l}.`,
  `Cropped origin = original (${x0}, ${y0}, ${z0}). Every slice has the same x/z corner;`,
  `place each one the listed number of blocks above slice 1.`, "",
  ...summary.map(p => `${p.file}\t+${p.yOffset} blocks up\t${p.height} tall\t${p.tileEntities} tile entities`),
].join("\n") + "\n");

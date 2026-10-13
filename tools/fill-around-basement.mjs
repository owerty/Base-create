// Makes a WorldEdit schematic that fills the space around a build's basement
// with ground: stone, with grass on the top layer. Same footprint and origin
// as the source schematic, so it pastes from the same spot.
//
// "Outside" is decided in plan view: a column is outside if it can be reached
// from the edge of the schematic without crossing any block the build has in
// the basement layers (so gaps such as windows never let the fill leak in).
//
// usage: node tools/fill-around-basement.mjs <in.schematic> <topLayer> [out.schematic]
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { decode, encode, short, byteArray, list, TAG } from "../library/src/core/nbt.js";

const [input, topArg, output] = process.argv.slice(2);
const top = Number(topArg);
const { value: s } = decode(gunzipSync(readFileSync(input)));
const W = s.Width.value, L = s.Length.value, H = top + 1;
const src = s.Blocks.value, srcAdd = s.AddBlocks?.value;
const solidAt = i => src[i] !== 0 || (srcAdd && srcAdd.length === src.length && srcAdd[i] !== 0);

// Plan-view footprint of the basement layers.
const footprint = new Uint8Array(W * L);
for (let y = 0; y <= top; y++)
  for (let z = 0; z < L; z++)
    for (let x = 0; x < W; x++) if (solidAt((y * L + z) * W + x)) footprint[z * W + x] = 1;

// Flood fill from the border through empty columns.
const outside = new Uint8Array(W * L);
const queue = [];
const push = (x, z) => {
  if (x < 0 || z < 0 || x >= W || z >= L) return;
  const k = z * W + x;
  if (outside[k] || footprint[k]) return;
  outside[k] = 1; queue.push(k);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, L - 1); }
for (let z = 0; z < L; z++) { push(0, z); push(W - 1, z); }
while (queue.length) {
  const k = queue.pop(), x = k % W, z = (k / W) | 0;
  push(x + 1, z); push(x - 1, z); push(x, z + 1); push(x, z - 1);
}

const STONE = 1, GRASS = 2;
const blocks = new Uint8Array(W * H * L);
let columns = 0;
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  if (!outside[z * W + x]) continue;
  columns++;
  for (let y = 0; y <= top; y++) blocks[(y * L + z) * W + x] = y === top ? GRASS : STONE;
}

const mapping = { "minecraft:air": short(0), "minecraft:stone": short(STONE), "minecraft:grass": short(GRASS) };
const raw = encode("Schematic", {
  Width: short(W), Height: short(H), Length: short(L),
  Materials: "Alpha",
  Blocks: byteArray(blocks),
  Data: byteArray(new Uint8Array(blocks.length)),
  BlockMapping: mapping,        // read by worldedit-gtnh
  SchematicaMapping: mapping,   // read by Schematica
  Entities: list(TAG.Compound, []),
  TileEntities: list(TAG.Compound, []),
});
writeFileSync(output, gzipSync(raw));
const inside = W * L - columns - footprint.reduce((a, b) => a + b, 0);
console.log(`${output}: ${W}x${H}x${L}, ${columns} outside columns filled (${columns * top} stone + ${columns} grass), ` +
  `footprint ${footprint.reduce((a, b) => a + b, 0)} columns, ${inside} enclosed empty columns left alone`);

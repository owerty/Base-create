// Converts a Schematica .schematic into one worldedit-gtnh imports with the
// right blocks.
//
// Both use the MCEdit "Alpha" layout, but they disagree on two fields:
//   - Block names: Schematica stores registry name -> file id in
//     SchematicaMapping. worldedit-gtnh's SchematicReader only reads
//     BlockMapping (same shape); without it, the file's ids are taken as this
//     world's numeric ids, which puts the wrong blocks down for every mod block.
//   - AddBlocks: Schematica writes one byte per block; WorldEdit reads the
//     MCEdit nibble array (two blocks per byte).
// Everything else (Blocks, Data, TileEntities with schematic-relative x/y/z,
// Entities) is shared. WEOrigin/WEOffset are left out, so //paste puts the
// schematic's low north-west corner at your feet.
//
// usage: node tools/schematica-to-worldedit.mjs <in.schematic> [out.schematic]
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { decode, encode, byteArray } from "../library/src/core/nbt.js";

const [input, output = input.replace(/\.schematic$/, "") + "_worldedit.schematic"] = process.argv.slice(2);
const { name: rootName, value: s } = decode(gunzipSync(readFileSync(input)));
if (s.Materials !== "Alpha") throw new Error(`unsupported Materials ${s.Materials}`);
if (!s.SchematicaMapping) throw new Error("no SchematicaMapping: not a Schematica file (or already converted)");

const n = s.Blocks.value.length;
const out = { ...s };

// Block names -> file ids, under the key WorldEdit reads.
out.BlockMapping = s.SchematicaMapping;

// Per-block AddBlocks -> MCEdit nibbles: even index in the low nibble, odd
// index in the high nibble (SchematicReader.combineBlockIds).
const add = s.AddBlocks?.value;
if (add && add.length === n) {
  let any = false;
  const nib = new Uint8Array((n + 1) >> 1);
  for (let i = 0; i < n; i++) {
    const hi = add[i] & 0x0f;
    if (hi) any = true;
    nib[i >> 1] |= (i & 1) ? hi << 4 : hi;
  }
  if (any) out.AddBlocks = byteArray(nib);
  else delete out.AddBlocks; // every id fits in Blocks
}

const raw = encode(rootName, out);
writeFileSync(output, gzipSync(raw));
const names = Object.keys(s.SchematicaMapping).length;
console.log(`${input} -> ${output}`);
console.log(`  ${s.Width.value}x${s.Height.value}x${s.Length.value}, ${names} block types mapped, ` +
  `${s.TileEntities?.value.length ?? 0} tile entities, AddBlocks ${out.AddBlocks ? "nibble-packed" : "not needed"}`);

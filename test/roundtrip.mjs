// Round-trip checks: NBT encode/decode, and the hut schematic read back
// block for block with the same rules Schematica's reader applies.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { encode, decode, byte, short, int, long, float, double, byteArray, intArray, list, TAG } from "../library/src/core/nbt.js";
import { Structure } from "../library/src/core/schematic.js";
import { edgeSlot, cornerSlot, edgeBox, materialName, part } from "../library/src/core/microblocks.js";

let fail = 0;
const check = (label, cond) => { console.log(`${cond ? "OK  " : "FAIL"} ${label}`); if (!cond) fail++; };

// NBT: every tag type survives a round trip.
{
  const doc = {
    b: byte(-5), s: short(-300), i: int(70000), l: long(-1n << 40n), f: float(1.5), d: double(-2.25),
    ba: byteArray(new Int8Array([1, -1, 127])), str: "héllo", ia: intArray([1, -2, 3]),
    li: list(TAG.Short, [1, 2, 3]), empty: list(TAG.Compound, []), nested: { deep: { x: short(7) } },
  };
  const { name, value } = decode(encode("root", doc));
  check("nbt: root name", name === "root");
  check("nbt: scalars", value.b.value === -5 && value.s.value === -300 && value.i.value === 70000
    && value.l.value === -1n << 40n && value.f.value === 1.5 && value.d.value === -2.25);
  check("nbt: byte array", [...value.ba.value].join() === "1,-1,127");
  check("nbt: string (utf-8)", value.str === "héllo");
  check("nbt: int array", [...value.ia.value].join() === "1,-2,3");
  check("nbt: list", value.li.elementType === TAG.Short && value.li.value.join() === "1,2,3");
  check("nbt: empty compound list", value.empty.elementType === TAG.Compound && value.empty.value.length === 0);
  check("nbt: nested compound", value.nested.deep.x.value === 7);
}

// Hut file: header fields Schematica reads, and every block back.
{
  const raw = gunzipSync(readFileSync(new URL("../out/m1-hut.schematic", import.meta.url)));
  const { name, value: s } = decode(raw);
  check("hut: root named Schematic", name === "Schematic");
  check("hut: Materials = Alpha", s.Materials === "Alpha");
  check("hut: size 5x7x5", s.Width.value === 5 && s.Height.value === 7 && s.Length.value === 5);
  const n = 5 * 7 * 5;
  check("hut: Blocks/Data/AddBlocks lengths", s.Blocks.value.length === n && s.Data.value.length === n && s.AddBlocks.value.length === n);
  check("hut: AddBlocks all zero", s.AddBlocks.value.every(b => b === 0));
  const mapping = Object.fromEntries(Object.entries(s.SchematicaMapping).map(([k, v]) => [k, v.value]));
  check("hut: air mapped to 0", mapping["minecraft:air"] === 0);
  const used = new Set(s.Blocks.value);
  check("hut: every block id used has a mapping", [...used].every(id => Object.values(mapping).includes(id)));
  check("hut: no Data value over 15", s.Data.value.every(d => d >= 0 && d <= 15));

  const st = Structure.fromNBT(raw);
  const at = (x, y, z) => { const b = st.get(x, y, z); return `${b.name}@${b.meta}`; };
  check("hut: floor spruce planks", at(0, 0, 0) === "minecraft:planks@1");
  check("hut: GT casing in floor", at(2, 0, 2) === "gregtech:gt.blockcasings@0");
  check("hut: vertical log corner", at(4, 2, 4) === "minecraft:log@0");
  check("hut: door lower faces north (3)", at(2, 1, 4) === "minecraft:wooden_door@3");
  check("hut: door upper (8)", at(2, 2, 4) === "minecraft:wooden_door@8");
  check("hut: east-west lintel (4)", at(2, 3, 4) === "minecraft:log@4");
  check("hut: north-south lintel (8)", at(0, 3, 2) === "minecraft:log@8");
  check("hut: floor torch (5)", at(1, 1, 1) === "minecraft:torch@5");
  check("hut: wall torch on north wall (3)", at(3, 2, 1) === "minecraft:torch@3");
  check("hut: upside-down stair east (4)", at(3, 3, 2) === "minecraft:stone_brick_stairs@4");
  check("hut: top stone brick slab (13)", at(1, 3, 3) === "minecraft:stone_slab@13");
  check("hut: roof north edge tall side south (2)", at(2, 4, 0) === "minecraft:stone_brick_stairs@2");
  check("hut: roof south edge tall side north (3)", at(2, 4, 4) === "minecraft:stone_brick_stairs@3");
  check("hut: roof west edge tall side east (0)", at(0, 4, 2) === "minecraft:stone_brick_stairs@0");
  check("hut: roof east edge tall side west (1)", at(4, 4, 2) === "minecraft:stone_brick_stairs@1");
  check("hut: cap slab (5)", at(2, 6, 2) === "minecraft:stone_slab@5");
  check("hut: inside is air", at(2, 1, 2) === "minecraft:air@0");
}

// Microblocks: rebuild the strip outline saved by Schematica in GTNH 2.9
// (fixtures/strips-sample.schematic: white Lapis Caelestis strips along the
// inside edges of a black glass wall) from edge names, and compare.
{
  const sample = Structure.fromNBT(gunzipSync(readFileSync(new URL("./fixtures/strips-sample.schematic", import.meta.url))));
  const mine = new Structure(5, 7, 12);
  const LAPIS = "ExtraUtilities:greenscreen";
  const strip = edge => part("edge", edgeSlot(edge), 1, LAPIS, 0);
  mine.fill([0, 0, 11], [4, 6, 11], { name: "minecraft:stained_glass", meta: 15 });
  for (let y = 0; y <= 4; y++) mine.setParts(0, y, 0, y === 0 ? [strip("bottom-west"), strip("north-west")] : [strip("north-west")]);
  mine.setParts(0, 5, 0, [part("corner", cornerSlot("bottom-north-west"), 1, LAPIS, 0)]);
  for (let z = 1; z <= 9; z++) mine.setParts(0, 0, z, [strip("bottom-west")]);
  for (let y = 0; y <= 6; y++) mine.setParts(0, y, 10, y === 0 ? [strip("bottom-south"), strip("south-west"), strip("bottom-west")] : [strip("south-west")]);
  for (let x = 1; x <= 4; x++) mine.setParts(x, 0, 10, [strip("bottom-south")]);

  const norm = st => {
    const out = [];
    for (let y = 0; y < st.height; y++) for (let z = 0; z < st.length; z++) for (let x = 0; x < st.width; x++) {
      const b = st.get(x, y, z);
      if (b.name === "minecraft:air") continue;
      const parts = st.getParts(x, y, z).map(p => `${p.id}/${p.material}/${p.shape}`).sort().join(",");
      out.push(`${x},${y},${z} ${b.name}@${b.meta} ${parts}`);
    }
    return out.join("\n");
  };
  check("strips: sample decodes 26 multipart blocks", [...sample.parts.keys()].length === 26);
  check("strips: rebuilt from edge names = sample, part for part", norm(mine) === norm(sample));
  const again = Structure.fromNBT(mine.toNBT());
  check("strips: our TileEntities read back", norm(again) === norm(mine));
  check("strips: black lapis material name", materialName(LAPIS, 15) === "tile.extrautils:greenscreen_15");
  check("strips: default material name is the registry name", materialName("minecraft:stonebrick", 0) === "minecraft:stonebrick"
    && materialName("chisel:marble", 3) === "chisel:marble_3");
  check("strips: all 12 edges distinct", new Set(["north-west", "south-west", "north-east", "south-east", "bottom-west", "bottom-east",
    "top-west", "top-east", "bottom-north", "bottom-south", "top-north", "top-south"].map(edgeSlot)).size === 12);
  const [x0, y0, z0, x1, y1, z1] = edgeBox(edgeSlot("bottom-south"), 1);
  check("strips: bottom-south box hugs y=0 and z=1, full along x", x0 === 0 && x1 === 1 && y0 === 0 && y1 === 0.125 && z0 === 0.875 && z1 === 1);
}

// WorldEdit flavour: names under BlockMapping (worldedit-gtnh's SchematicReader), no per-block AddBlocks.
{
  const st = new Structure(3, 2, 2);
  st.set(0, 0, 0, { name: "chisel:marble", meta: 3 });
  st.set(2, 1, 1, "minecraft:stonebrick");
  st.setParts(1, 0, 1, [part("edge", edgeSlot("bottom-north"), 1, "minecraft:stonebrick", 0)]);
  const { value: we } = decode(st.toNBT({ worldedit: true }));
  const { value: sc } = decode(st.toNBT());
  check("worldedit: BlockMapping matches SchematicaMapping", JSON.stringify(we.BlockMapping) === JSON.stringify(we.SchematicaMapping)
    && we.BlockMapping["chisel:marble"].value === sc.SchematicaMapping["chisel:marble"].value);
  check("worldedit: no AddBlocks (ids fit in Blocks); Schematica file keeps its per-block AddBlocks", !("AddBlocks" in we) && sc.AddBlocks.value.length === 12);
  check("worldedit: tile entities and blocks identical to the Schematica file",
    JSON.stringify(we.TileEntities) === JSON.stringify(sc.TileEntities) && Buffer.compare(Buffer.from(we.Blocks.value), Buffer.from(sc.Blocks.value)) === 0);
  const back = Structure.fromNBT(st.toNBT({ worldedit: true }));
  check("worldedit: reads back", back.get(0, 0, 0).name === "chisel:marble" && back.get(0, 0, 0).meta === 3 && back.getParts(1, 0, 1).length === 1);
}

process.exit(fail ? 1 : 0);

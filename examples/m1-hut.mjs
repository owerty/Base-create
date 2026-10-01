// M1 test build: a 5x5 stone brick hut that exercises every metadata rule
// the building library depends on. Load it in Schematica and check each
// item on the list printed below.
import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { Structure } from "../library/src/core/schematic.js";
import { stairs, pillar, slab, door, torch, STONE_SLAB } from "../library/src/core/blocks.js";

const s = new Structure(5, 7, 5); // x: west->east, y: up, z: north->south

const BRICK = "minecraft:stonebrick";
const STAIR = "minecraft:stone_brick_stairs";

// Floor: spruce planks (planks meta 1), with a GT ULV machine casing in the
// middle to prove modded block names remap correctly.
s.fill([0, 0, 0], [4, 0, 4], { name: "minecraft:planks", meta: 1 });
s.set(2, 0, 2, { name: "gregtech:gt.blockcasings", meta: 0 });

// Walls y=1..3, oak log corner posts (vertical).
for (let y = 1; y <= 3; y++) {
  for (let i = 0; i <= 4; i++) {
    s.set(i, y, 0, BRICK); s.set(i, y, 4, BRICK);
    s.set(0, y, i, BRICK); s.set(4, y, i, BRICK);
  }
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) s.set(x, y, z, pillar("minecraft:log", { axis: "y" }));
}

// Door in the south wall, entered walking north.
const [lower, upper] = door("minecraft:wooden_door", { facing: "north" });
s.set(2, 1, 4, lower); s.set(2, 2, 4, upper);
// Horizontal logs as lintels: east-west over the door, north-south on the west wall.
s.set(2, 3, 4, pillar("minecraft:log", { axis: "x" }));
s.set(0, 3, 2, pillar("minecraft:log", { axis: "z" }));

// Glass pane windows on the north, east and west walls.
s.set(2, 2, 0, "minecraft:glass_pane");
s.set(4, 2, 2, "minecraft:glass_pane");
s.set(0, 2, 2, "minecraft:glass_pane");

// Inside: a floor torch, a wall torch on the north wall, an upside-down
// stair under the east window, and a top slab.
s.set(1, 1, 1, torch("minecraft:torch", { on: "floor" }));
s.set(3, 2, 1, torch("minecraft:torch", { on: "north" }));
s.set(3, 3, 2, stairs(STAIR, { facing: "east", upsideDown: true }));
s.set(1, 3, 3, slab("minecraft:stone_slab", { type: STONE_SLAB.stonebrick, top: true }));

// Pyramid roof: each ring of stairs has its tall side toward the middle,
// so all four facings appear.
function ring(y, lo, hi) {
  for (let x = lo; x <= hi; x++) {
    s.set(x, y, lo, stairs(STAIR, { facing: "south" }));
    s.set(x, y, hi, stairs(STAIR, { facing: "north" }));
  }
  for (let z = lo + 1; z < hi; z++) {
    s.set(lo, y, z, stairs(STAIR, { facing: "east" }));
    s.set(hi, y, z, stairs(STAIR, { facing: "west" }));
  }
}
ring(4, 0, 4);
s.fill([1, 4, 1], [3, 4, 3], BRICK);
ring(5, 1, 3);
s.set(2, 5, 2, BRICK);
s.set(2, 6, 2, slab("minecraft:stone_slab", { type: STONE_SLAB.stonebrick }));

mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
const file = new URL("../out/m1-hut.schematic", import.meta.url);
writeFileSync(file, gzipSync(s.toNBT()));
console.log(`wrote ${file.pathname}`);
console.log("materials:");
for (const [key, n] of s.materials()) console.log(`  ${String(n).padStart(3)}  ${key}`);

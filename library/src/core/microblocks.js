// Forge Multipart microblocks (GTNH 2.9: ForgeMultipart 1.7.x). Strips and
// corners are parts inside a "ForgeMultipart:block" whose tile entity lists
// them; Schematica keeps that tile entity, so the hologram shows the parts
// (its printer cannot place them, and its material list skips them).
//
// Saved form, as written by Forge Multipart and read back by Schematica:
//   { id: "savedMultipart", x, y, z, parts: [{ id: "mcr_edge", material, shape }] }
// shape = size << 4 | slot, size in eighths of a block.
//
// Slots come from EdgeMicroClass / CornerMicroClass and CodeChickenLib's
// AxisCycle (cycle 1: (x,y,z) -> (z,x,y), cycle 2: (x,y,z) -> (y,z,x)):
//   edge   slot = axisGroup << 2 | bits; the base bar runs along y at low x
//          and low z, bit 1 mirrors x and bit 0 mirrors z, then the group's
//          cycle turns it to run along y (0), z (1) or x (2);
//   corner slot bits: 4 = high x, 1 = high y, 2 = high z.
// Checked against a strip outline saved by Schematica in GTNH 2.9.

export const MULTIPART_BLOCK = "ForgeMultipart:block";

const SIDE = {
  west: ["x", 0], east: ["x", 1], down: ["y", 0], bottom: ["y", 0], up: ["y", 1], top: ["y", 1], north: ["z", 0], south: ["z", 1],
};

// Parse "bottom-south", "north-west", "top-east-south"... into { x, y, z } (0 low, 1 high, undefined unset).
function sides(spec, want) {
  const out = {};
  for (const word of String(spec).toLowerCase().split(/[-\s_]+/).filter(Boolean)) {
    const s = SIDE[word];
    if (!s) throw new Error(`"${word}" in "${spec}" is not a side (north, south, east, west, top, bottom)`);
    if (out[s[0]] !== undefined) throw new Error(`"${spec}" names two sides on the same axis`);
    out[s[0]] = s[1];
  }
  if (Object.keys(out).length !== want) throw new Error(`"${spec}" must name ${want} sides on different axes`);
  return out;
}

/** Edge slot 0..11 for an edge named by its two sides, e.g. "bottom-south". */
export function edgeSlot(edge) {
  const s = sides(edge, 2);
  if (s.y === undefined) return (s.x << 1) | s.z;          // vertical: bit 1 east, bit 0 south
  if (s.x === undefined) return 8 | (s.z << 1) | s.y;      // runs along x: bit 1 south, bit 0 top
  return 4 | (s.y << 1) | s.x;                             // runs along z: bit 1 top, bit 0 east
}

/** Corner slot 0..7 for a corner named by its three sides, e.g. "bottom-north-west". */
export function cornerSlot(corner) {
  const s = sides(corner, 3);
  return (s.x << 2) | (s.z << 1) | s.y;
}

/** The axis an edge slot runs along. */
export const edgeAxis = slot => ["y", "z", "x"][slot >> 2];

/** Box [x0, y0, z0, x1, y1, z1] (0..1) of an edge part, thickness size/8. */
export function edgeBox(slot, size) {
  const d = size / 8;
  const lo = () => [0, d], hi = () => [1 - d, 1];
  const a = (slot & 2) ? hi() : lo(); // the base bar's x range
  const c = (slot & 1) ? hi() : lo(); // the base bar's z range
  const full = [0, 1];
  let x, y, z;
  switch (slot >> 2) {
    case 0: [x, y, z] = [a, full, c]; break;
    case 1: [x, y, z] = [c, a, full]; break;
    default: [x, y, z] = [full, c, a]; break;
  }
  return [x[0], y[0], z[0], x[1], y[1], z[1]];
}

/** Box of a corner part, size/8 on each side. */
export function cornerBox(slot, size) {
  const d = size / 8;
  const r = high => (high ? [1 - d, 1] : [0, d]);
  const x = r(slot & 4), y = r(slot & 1), z = r(slot & 2);
  return [x[0], y[0], z[0], x[1], y[1], z[1]];
}

// Blocks whose mod registers its own microblock material name. Everything
// else uses Forge Multipart's default: the registry name.
const MATERIAL_BASE = {
  // Extra Utilities RegisterMicroMaterials: unlocalized name, all 16 colours.
  "ExtraUtilities:greenscreen": "tile.extrautils:greenscreen",
};

/** Forge Multipart material name for a block variant: base name, plus "_<meta>" when meta > 0. */
export function materialName(registryName, meta) {
  const base = MATERIAL_BASE[registryName] ?? registryName;
  return meta > 0 ? `${base}_${meta}` : base;
}

/** True when the material name is confirmed for this pack (not just the default rule). */
export const materialVerified = registryName => registryName in MATERIAL_BASE;

/**
 * One saved part. kind "edge" (strip 1, post 2, pillar 4) or "corner"
 * (nook 1, corner 2, notch 4); size in eighths.
 */
export function part(kind, slot, size, registryName, meta) {
  return { id: kind === "edge" ? "mcr_edge" : "mcr_cnr", material: materialName(registryName, meta), shape: (size << 4) | slot };
}

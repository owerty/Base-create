// ArchitectureCraft shape blocks (GTNH 2.9: ArchitectureCraft 1.12.17). Every
// shape is one block, ArchitectureCraft:shape (shapeSE for the glowing
// variants), always meta 0; its tile entity says which shape it is, what it
// is made of and how it is turned.
//
// Saved form, as written by TileShape.writeToNBT / TileArchitecture.writeToNBT:
//   { id: "gcewing.shape", x, y, z, Shape: int, BaseName: string, BaseData: int,
//     side?: byte, turn?: byte, offsetX?: byte (sixteenths), Name2?: string, Data2?: int, Disconnected?: int }
// side and turn are left out when 0, offsetX and Disconnected when 0, Name2/Data2 without a second material.
import { byte, int } from "./nbt.js";

export const SHAPE_BLOCK = "ArchitectureCraft:shape";
export const SHAPE_BLOCK_GLOW = "ArchitectureCraft:shapeSE";
export const SHAPE_TILE = "gcewing.shape";

/**
 * Tile entity NBT for one shape. `base` and `secondary` are { name, meta } of the material blocks;
 * offsetX is in blocks (stored in sixteenths).
 */
export function shapeTile({ shape, side = 0, turn = 0, offsetX = 0, base, secondary, disconnected = 0 }) {
  const t = { id: SHAPE_TILE, Shape: int(shape), BaseName: base.name, BaseData: int(base.meta) };
  if (side) t.side = byte(side);
  if (turn) t.turn = byte(turn);
  const off = Math.trunc(16 * offsetX);
  if (off) t.offsetX = byte(off);
  if (secondary) { t.Name2 = secondary.name; t.Data2 = int(secondary.meta); }
  if (disconnected) t.Disconnected = int(disconnected);
  return t;
}

/** The fields of a shape tile entity read back from a schematic, or null for any other tile entity. */
export function readShapeTile(t) {
  if (!t || t.id !== SHAPE_TILE) return null;
  const v = f => (t[f] === undefined ? 0 : typeof t[f] === "object" ? t[f].value : t[f]);
  return {
    shape: v("Shape"), side: v("side"), turn: v("turn"), offsetX: (((v("offsetX") << 24) >> 24) / 16),
    base: { name: t.BaseName, meta: v("BaseData") },
    secondary: t.Name2 ? { name: t.Name2, meta: v("Data2") } : undefined,
    disconnected: v("Disconnected"),
  };
}

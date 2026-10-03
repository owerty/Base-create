// Placement components. Each one records blocks into the enclosing
// <Structure> and renders nothing itself. Later components overwrite earlier
// ones, so a <Fill> followed by <Air> carves a hole, and a <Window> placed
// after a wall replaces the wall blocks it covers.
import { usePlace, usePlacePart, usePlaceShape } from "./Structure";
import type { Facing, Vec3 } from "./model";
// @ts-ignore - plain JS shared with the Node tools
import { edgeSlot, cornerSlot } from "./core/microblocks.js";

/** A block reference: "registry:name@meta", e.g. "minecraft:stonebrick@0" or "chisel:marble@3". */
export type BlockRef = string;

function* range(from: Vec3, to: Vec3): Generator<Vec3> {
  const [x0, x1] = [Math.min(from[0], to[0]), Math.max(from[0], to[0])];
  const [y0, y1] = [Math.min(from[1], to[1]), Math.max(from[1], to[1])];
  const [z0, z1] = [Math.min(from[2], to[2]), Math.max(from[2], to[2])];
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) yield [x, y, z];
}

export interface BlockProps {
  block: BlockRef;
  at: Vec3;
  /** Raw world metadata, overriding the shape's direction rules. Rarely needed. */
  meta?: number;
}

/** One block at `at` ([x, y, z]; x west→east, y up, z north→south). */
export function Block({ block, at, meta }: BlockProps) {
  usePlace()(at, block, { meta });
  return null;
}

export interface FillProps {
  block: BlockRef;
  /** One corner, inclusive. */
  from: Vec3;
  /** Opposite corner, inclusive. */
  to: Vec3;
}

/** A solid box of one block, corners inclusive. */
export function Fill({ block, from, to }: FillProps) {
  const place = usePlace();
  for (const p of range(from, to)) place(p, block);
  return null;
}

/** Clears a box back to air (corners inclusive). */
export function Air({ from, to = from }: { from: Vec3; to?: Vec3 }) {
  const place = usePlace();
  for (const p of range(from, to)) place(p, "minecraft:air");
  return null;
}

export interface HollowProps extends FillProps {
  /** Leave the floor layer out. */
  noFloor?: boolean;
  /** Leave the ceiling layer out. */
  noCeiling?: boolean;
}

/** The shell of a box: four walls plus floor and ceiling unless turned off. */
export function Hollow({ block, from, to, noFloor, noCeiling }: HollowProps) {
  const place = usePlace();
  const lo: Vec3 = [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.min(from[2], to[2])];
  const hi: Vec3 = [Math.max(from[0], to[0]), Math.max(from[1], to[1]), Math.max(from[2], to[2])];
  for (const [x, y, z] of range(lo, hi)) {
    const wall = x === lo[0] || x === hi[0] || z === lo[2] || z === hi[2];
    const floor = y === lo[1] && !noFloor, ceil = y === hi[1] && !noCeiling;
    if (wall || floor || ceil) place([x, y, z], block);
  }
  return null;
}

export interface StairsProps {
  block: BlockRef;
  at: Vec3;
  /** End of a straight run (inclusive), all with the same facing. */
  to?: Vec3;
  /** The side the tall back of the step is on — the direction you walk to go up. */
  facing: Facing;
  /** Hang the step from the ceiling (tall part at the bottom). */
  upsideDown?: boolean;
}

/** Stairs, one or a straight run. For roofs, `facing` points toward the ridge. */
export function Stairs({ block, at, to = at, facing, upsideDown }: StairsProps) {
  const place = usePlace();
  for (const p of range(at, to)) place(p, block, { facing, upsideDown });
  return null;
}

export interface SlabProps {
  block: BlockRef;
  at: Vec3;
  to?: Vec3;
  /** Upper half of the block space instead of the lower half. */
  top?: boolean;
}

/** Half-height slabs, one or a box of them. */
export function Slab({ block, at, to = at, top }: SlabProps) {
  const place = usePlace();
  for (const p of range(at, to)) place(p, block, { top });
  return null;
}

export interface PillarProps {
  block: BlockRef;
  at: Vec3;
  to?: Vec3;
  /** Direction the log/pillar runs. Default "y" (upright). */
  axis?: "x" | "y" | "z";
}

/** Logs and pillar blocks along an axis: posts, beams, lintels. */
export function Pillar({ block, at, to = at, axis = "y" }: PillarProps) {
  const place = usePlace();
  for (const p of range(at, to)) place(p, block, { axis });
  return null;
}

export interface DoorProps {
  block: BlockRef;
  /** Position of the lower half; the upper half goes directly above. */
  at: Vec3;
  /** Direction you face walking in through the door. */
  facing: Facing;
  hingeRight?: boolean;
}

/** A two-block-tall door. */
export function Door({ block, at, facing, hingeRight }: DoorProps) {
  usePlace()(at, block, { facing, hingeRight });
  return null;
}

export interface TorchProps {
  block?: BlockRef;
  at: Vec3;
  /** Where the supporting block is: "floor" or the wall's direction from the torch. */
  on?: "floor" | Facing;
}

/** A torch (or any torch-shaped light) on the floor or a wall. */
export function Torch({ block = "minecraft:torch@0", at, on = "floor" }: TorchProps) {
  usePlace()(at, block, { on });
  return null;
}

type Horizontal = "north" | "south" | "east" | "west";
/**
 * One of a block's 12 edges, named by the two faces that meet there:
 * "bottom-south" runs east-west along the bottom of the south face,
 * "north-west" is the vertical edge where the north and west faces meet.
 */
export type Edge =
  | `${"bottom" | "top"}-${Horizontal}`
  | `${"north" | "south"}-${"west" | "east"}`;
/** One of a block's 8 corners, e.g. "bottom-north-west". */
export type CornerName = `${"bottom" | "top"}-${"north" | "south"}-${"west" | "east"}`;

export interface StripProps {
  /** Material: a full block, e.g. "ExtraUtilities:greenscreen@0" (white Lapis Caelestis). */
  block: BlockRef;
  at: Vec3;
  /** End of a run (inclusive); every block space in the box gets the same strip. */
  to?: Vec3;
  /** Which edge of each block space the strip sits on. */
  edge: Edge;
  /** Thickness in eighths: 1 strip (default), 2 post, 4 pillar. */
  size?: 1 | 2 | 4;
}

/**
 * Forge Multipart strips along a block edge, e.g. outlining the inside
 * edges of a glass wall. Several strips can share one block space; a strip
 * replaces a full block in its space. The player's Schematica build prints
 * them; stock Schematica only shows them in the hologram.
 */
export function Strip({ block, at, to = at, edge, size = 1 }: StripProps) {
  const p = usePlacePart();
  let slot: number;
  try { slot = edgeSlot(edge); } catch (e) { p.problem(`Strip: ${(e as Error).message}`); return null; }
  for (const q of range(at, to)) p.place(q, block, "edge", slot, size);
  return null;
}

export interface CornerProps {
  block: BlockRef;
  at: Vec3;
  to?: Vec3;
  /** Which corner of each block space. */
  corner: CornerName;
  /** Size in eighths: 1 nook (default), 2 corner, 4 notch. */
  size?: 1 | 2 | 4;
}

/** Forge Multipart corner pieces (nook, corner, notch), e.g. to cap where strips meet. Printed like strips. */
export function Corner({ block, at, to = at, corner, size = 1 }: CornerProps) {
  const p = usePlacePart();
  let slot: number;
  try { slot = cornerSlot(corner); } catch (e) { p.problem(`Corner: ${(e as Error).message}`); return null; }
  for (const q of range(at, to)) p.place(q, block, "corner", slot, size);
  return null;
}

/** An ArchitectureCraft shape (core/architecture.js SHAPES), lowerCamel. */
export type ShapeKey =
  | "roofTile"
  | "roofOuterCorner"
  | "roofInnerCorner"
  | "roofRidge"
  | "roofSmartRidge"
  | "roofValley"
  | "roofSmartValley"
  | "roofOverhang"
  | "roofOverhangOuterCorner"
  | "roofOverhangInnerCorner"
  | "cylinder"
  | "cylinderHalf"
  | "cylinderQuarter"
  | "cylinderLargeQuarter"
  | "anticylinderLargeQuarter"
  | "pillar"
  | "post"
  | "pole"
  | "bevelledOuterCorner"
  | "bevelledInnerCorner"
  | "pillarBase"
  | "doricCapital"
  | "ionicCapital"
  | "corinthianCapital"
  | "doricTriglyph"
  | "doricTriglyphCorner"
  | "doricMetope"
  | "architrave"
  | "architraveCorner"
  | "windowFrame"
  | "windowCorner"
  | "windowMullion"
  | "sphereFull"
  | "sphereHalf"
  | "sphereQuarter"
  | "sphereEighth"
  | "sphereEighthLarge"
  | "sphereEighthLargeRev"
  | "roofOverhangGableLH"
  | "roofOverhangGableRH"
  | "roofOverhangGableEndLH"
  | "roofOverhangGableEndRH"
  | "roofOverhangRidge"
  | "roofOverhangValley"
  | "corniceLH"
  | "corniceRH"
  | "corniceEndLH"
  | "corniceEndRH"
  | "corniceRidge"
  | "corniceValley"
  | "corniceBottom"
  | "archD1"
  | "archD2"
  | "archD3A"
  | "archD3B"
  | "archD3C"
  | "archD4A"
  | "archD4B"
  | "archD4C"
  | "banisterPlainBottom"
  | "banisterPlain"
  | "banisterPlainTop"
  | "balustradeFancy"
  | "balustradeFancyCorner"
  | "balustradeFancyWithNewel"
  | "balustradeFancyNewel"
  | "balustradePlain"
  | "balustradePlainOuterCorner"
  | "balustradePlainWithNewel"
  | "banisterPlainEnd"
  | "banisterFancyNewelTall"
  | "balustradePlainInnerCorner"
  | "balustradePlainEnd"
  | "banisterFancyBottom"
  | "banisterFancy"
  | "banisterFancyTop"
  | "banisterFancyEnd"
  | "banisterPlainInnerCorner"
  | "slab"
  | "stairs"
  | "stairsOuterCorner"
  | "stairsInnerCorner"
  | "slopeTileA1"
  | "slopeTileA2"
  | "slopeTileB1"
  | "slopeTileB2"
  | "slopeTileB3"
  | "slopeTileC1"
  | "slopeTileC2"
  | "slopeTileC3"
  | "slopeTileC4"
  | "slopeTileA1SE"
  | "slopeTileA2SE"
  | "slopeTileB1SE"
  | "slopeTileB2SE"
  | "slopeTileB3SE"
  | "slopeTileC1SE"
  | "slopeTileC2SE"
  | "slopeTileC3SE"
  | "slopeTileC4SE"
  | "roofTileSE"
  | "squareSE"
  | "slabSE"
  | "angledRoofRidge"
  | "doubleRoofTile";

export interface ArchShapeProps {
  /** Which shape, e.g. "roofTile", "roofOuterCorner", "roofRidge", "stairs", "windowFrame", "archD2", "cylinder". */
  shape: ShapeKey;
  /** Material: a normal opaque block, glass or a slab, e.g. "minecraft:planks@1". The sawbench cuts shapes from it. */
  block: BlockRef;
  at: Vec3;
  /** End of a run (inclusive); every block space in the box gets the same shape. */
  to?: Vec3;
  /**
   * Two-sided shapes: the side the back is on (uphill for roof tiles, slopes,
   * stairs and banisters; the wall for cornices and overhangs). Corner shapes:
   * the corner between facing and the next direction clockwise (north = the
   * north-east corner). Ridges and valleys: either side across the ridge line
   * (a ridge running east-west takes "north" or "south"). Windows: the glass
   * lies across facing. Round and four-way shapes ignore it. Default "north".
   */
  facing?: Facing;
  /** Turn the shape over (hanging eaves, ceiling corners). Not windows. */
  upsideDown?: boolean;
  /** Window glass: a glass pane, e.g. "minecraft:glass_pane@0" or "minecraft:stained_glass_pane@15". Roofs and some models take cladding: any block. */
  secondary?: BlockRef;
  /** Banisters and balustrade ends: shift sideways, in blocks (the mod uses ±0.375). */
  offsetX?: number;
  /** Put the shape on the glowing block (Glow brush / sawbench glow page). */
  glow?: boolean;
  /** Connections cut with the chisel: bits 1 down, 2 up, 4 north, 8 south, 16 west, 32 east. */
  disconnected?: number;
  /** Raw tile entity orientation, overriding facing / upsideDown. */
  side?: number;
  turn?: number;
}

/**
 * ArchitectureCraft shapes: roofs, slopes, cornices, columns, arches,
 * windows, banisters and more, each cut at the sawbench from one material.
 * Roof shapes join their neighbours like in game (ridges and valleys sit a
 * level above the tiles they meet).
 */
export function ArchShape({ shape, block, at, to = at, facing, upsideDown, secondary, offsetX, glow, disconnected, side, turn }: ArchShapeProps) {
  const p = usePlaceShape();
  for (const q of range(at, to)) p.place(q, block, { shape, facing, upsideDown, secondary, offsetX, glow, disconnected, side, turn });
  return null;
}

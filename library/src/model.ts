// Turns the placement ops the components emit into a block grid, applying
// each shape's direction rules (vanilla 1.7.10 placement code; see
// core/blocks.js), and converts the grid into a .schematic.
import { AIR, blockKey, lookup, type CatalogBlock } from "./catalog";
// @ts-ignore - plain JS shared with the Node tools
import { Structure as SchematicWriter } from "./core/schematic.js";
// @ts-ignore - plain JS shared with the Node tools
import { part as savedPart } from "./core/microblocks.js";

export type Vec3 = [number, number, number];
export type Facing = "north" | "south" | "east" | "west";

/** One placed block. `key` is the catalog key of the item variant. */
export interface Cell {
  key: string;
  block?: CatalogBlock;
  /** Metadata actually written to the world (direction bits included). */
  meta: number;
  /** Render hints derived from the placement. */
  facing?: Facing;
  upsideDown?: boolean;
  top?: boolean;
  axis?: "x" | "y" | "z";
  doorHalf?: "lower" | "upper";
  on?: "floor" | Facing;
}

/** A Forge Multipart microblock: several can share one block space. */
export interface Part {
  kind: "edge" | "corner";
  /** Forge Multipart slot (core/microblocks.js). */
  slot: number;
  /** Thickness in eighths of a block: 1, 2 or 4. */
  size: number;
  /** Catalog key of the material block. */
  key: string;
  block?: CatalogBlock;
}

export type Op = { at: Vec3; cell: Cell } | { at: Vec3; part: Part };

const PART_NAME: Record<Part["kind"], Record<number, string>> = {
  edge: { 1: "strip", 2: "post", 4: "pillar" },
  corner: { 1: "nook", 2: "corner", 4: "notch" },
};
const partName = (p: Part) => PART_NAME[p.kind][p.size] ?? `${p.kind} ${p.size}/8`;

/** A microblock part of `ref`; microblocks are cut from full blocks only. */
export function partFor(ref: string, kind: Part["kind"], slot: number, size: number): { part: Part; problem?: string } {
  const key = blockKey(ref);
  const block = lookup(key);
  if (!block) return { part: { kind, slot, size, key }, problem: `unknown block "${ref}"` };
  const problem = block.shape === "cube" ? undefined : `${ref} is a ${block.shape}; microblocks are cut from full blocks`;
  return { part: { kind, slot, size, key, block }, problem };
}

export interface Problem {
  message: string;
}

const STAIR: Record<Facing, number> = { east: 0, west: 1, south: 2, north: 3 };
const AXIS = { y: 0, x: 4, z: 8 } as const;
const DOOR: Record<Facing, number> = { east: 0, south: 1, west: 2, north: 3 };
const TORCH = { west: 1, east: 2, north: 3, south: 4, floor: 5 } as const;

export interface PlaceOptions {
  facing?: Facing;
  upsideDown?: boolean;
  top?: boolean;
  axis?: "x" | "y" | "z";
  hingeRight?: boolean;
  on?: "floor" | Facing;
  meta?: number;
}

/** Cells for one placement of `ref` (two for a door: lower then upper). */
export function cellsFor(ref: string, opts: PlaceOptions = {}): { cells: Cell[]; problem?: string } {
  const key = blockKey(ref);
  if (key === AIR) return { cells: [{ key, meta: 0 }] };
  const block = lookup(key);
  if (!block) return { cells: [{ key, meta: 0 }], problem: `unknown block "${ref}"` };
  const base = block.meta;
  if (opts.meta !== undefined) return { cells: [{ key, block, meta: opts.meta }] };
  switch (block.shape) {
    case "stairs": {
      // Bits 0-2 are direction; Chisel keeps a second texture variant in bit 8.
      const facing = opts.facing ?? "north";
      return { cells: [{ key, block, facing, upsideDown: !!opts.upsideDown, meta: (base & 8) | STAIR[facing] | (opts.upsideDown ? 4 : 0) }] };
    }
    case "slab":
      return { cells: [{ key, block, top: !!opts.top, meta: (base & 7) | (opts.top ? 8 : 0) }] };
    case "pillar": {
      const axis = opts.axis ?? "y";
      return { cells: [{ key, block, axis, meta: (base & 3) | AXIS[axis] }] };
    }
    case "door": {
      const facing = opts.facing ?? "north";
      return {
        cells: [
          { key, block, facing, doorHalf: "lower", meta: DOOR[facing] },
          { key, block, facing, doorHalf: "upper", meta: 8 | (opts.hingeRight ? 1 : 0) },
        ],
      };
    }
    case "torch": {
      const on = opts.on ?? "floor";
      return { cells: [{ key, block, on, meta: TORCH[on] }] };
    }
    default:
      return { cells: [{ key, block, meta: base }] };
  }
}

export class Grid {
  readonly size: Vec3;
  private cells = new Map<number, Cell>();
  private parts = new Map<number, Part[]>();
  problems: Problem[] = [];

  constructor(size: Vec3) {
    this.size = size;
  }

  private idx([x, y, z]: Vec3) {
    return (y * this.size[2] + z) * this.size[0] + x;
  }

  inBounds([x, y, z]: Vec3) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.size[0] && y < this.size[1] && z < this.size[2];
  }

  set(at: Vec3, cell: Cell) {
    if (!this.inBounds(at)) {
      this.problems.push({ message: `${cell.key} at [${at}] is outside the ${this.size.join("x")} structure` });
      return;
    }
    const i = this.idx(at);
    this.parts.delete(i);
    if (cell.key === AIR) this.cells.delete(i);
    else this.cells.set(i, cell);
  }

  /** Add a microblock part; it replaces a full block there, or a part in the same slot. */
  addPart(at: Vec3, part: Part) {
    if (!this.inBounds(at)) {
      this.problems.push({ message: `${part.key} ${partName(part)} at [${at}] is outside the ${this.size.join("x")} structure` });
      return;
    }
    const i = this.idx(at);
    this.cells.delete(i);
    const list = (this.parts.get(i) ?? []).filter(p => !(p.kind === part.kind && p.slot === part.slot));
    list.push(part);
    this.parts.set(i, list);
  }

  partsAt(at: Vec3): Part[] {
    return this.inBounds(at) ? this.parts.get(this.idx(at)) ?? [] : [];
  }

  private pos(i: number): Vec3 {
    const [w, , l] = this.size;
    return [i % w, Math.floor(i / (w * l)), Math.floor(i / w) % l];
  }

  /** Every block space holding microblock parts. */
  *partEntries(): Generator<[Vec3, Part[]]> {
    for (const [i, list] of this.parts) yield [this.pos(i), list];
  }

  get(at: Vec3): Cell | undefined {
    return this.inBounds(at) ? this.cells.get(this.idx(at)) : undefined;
  }

  *entries(): Generator<[Vec3, Cell]> {
    for (const [i, cell] of this.cells) yield [this.pos(i), cell];
  }

  /** Full blocks placed (block spaces holding microblocks not included). */
  get count() {
    return this.cells.size;
  }

  /** Microblock parts placed. */
  get partCount() {
    let n = 0;
    for (const list of this.parts.values()) n += list.length;
    return n;
  }

  /**
   * Item counts for the build, doors counted once. Microblocks are listed
   * per material and shape ("White Lapis Caelestis strip"); `icon` is the
   * catalog key to draw a swatch from.
   */
  materials(): { key: string; icon: string; display: string; count: number; microblock?: boolean }[] {
    const counts = new Map<string, { key: string; icon: string; display: string; count: number; microblock?: boolean }>();
    for (const [, c] of this.entries()) {
      if (c.doorHalf === "upper") continue;
      const e = counts.get(c.key) ?? { key: c.key, icon: c.key, display: c.block?.display ?? c.key, count: 0 };
      e.count++;
      counts.set(c.key, e);
    }
    for (const list of this.parts.values()) for (const p of list) {
      const key = `${p.key} ${partName(p)}`;
      const e = counts.get(key) ?? { key, icon: p.key, display: `${p.block?.display ?? p.key} ${partName(p)}`, count: 0, microblock: true };
      e.count++;
      counts.set(key, e);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }

  /** Gzipped .schematic bytes (Schematica "Alpha" format). */
  async toSchematic(): Promise<Uint8Array> {
    const w = new SchematicWriter(this.size[0], this.size[1], this.size[2]);
    for (const [[x, y, z], c] of this.entries()) {
      const name = c.block?.name ?? c.key.replace(/@\d+$/, "");
      w.set(x, y, z, { name, meta: c.meta });
    }
    for (const [[x, y, z], list] of this.partEntries()) w.setParts(x, y, z, list.map(savedPartOf));
    const raw: Uint8Array = w.toNBT();
    const stream = new Blob([raw as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /**
   * Compact JSON blueprint: [x, y, z, registry name, meta] per block, and
   * [x, y, z, [[part id, material, shape], ...]] per microblock space.
   */
  toBlueprint(name: string) {
    const blocks: [number, number, number, string, number][] = [];
    for (const [[x, y, z], c] of this.entries()) blocks.push([x, y, z, c.block?.name ?? c.key.replace(/@\d+$/, ""), c.meta]);
    const parts: [number, number, number, [string, string, number][]][] = [];
    for (const [[x, y, z], list] of this.partEntries())
      parts.push([x, y, z, list.map(savedPartOf).map((p: { id: string; material: string; shape: number }) => [p.id, p.material, p.shape])]);
    return { format: "gtnh-blueprint/1", name, size: this.size, blocks, ...(parts.length ? { parts } : {}) };
  }
}

function savedPartOf(p: Part) {
  const at = p.key.lastIndexOf("@");
  const name = p.block?.name ?? p.key.slice(0, at);
  const meta = p.block?.meta ?? Number(p.key.slice(at + 1));
  return savedPart(p.kind, p.slot, p.size, name, meta);
}

export function buildGrid(size: Vec3, ops: Op[]): Grid {
  const g = new Grid(size);
  for (const op of ops) {
    if ("part" in op) g.addPart(op.at, op.part);
    else g.set(op.at, op.cell);
  }
  return g;
}

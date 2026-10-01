// Direction-aware metadata for vanilla 1.7.10 block families, taken from the
// 1.7.10 placement code (BlockStairs.onBlockPlacedBy, ItemDoor.placeDoorBlock,
// BlockTorch.onBlockPlaced, BlockRotatedPillar.onBlockPlaced). Directions are
// world directions: north = -z, south = +z, west = -x, east = +x.

// Stairs: `facing` is the side the tall back of the step is on, i.e. the
// direction you walk to go up. Meta 0..3 = east, west, south, north; +4 flips
// the stair upside down.
const STAIR_FACING = { east: 0, west: 1, south: 2, north: 3 };
export function stairs(name, { facing, upsideDown = false }) {
  const m = STAIR_FACING[facing];
  if (m === undefined) throw new Error(`stairs facing ${facing}`);
  return { name, meta: m | (upsideDown ? 4 : 0) };
}

// Logs and other pillars (BlockRotatedPillar): low 2 bits = wood type,
// axis bits 0 = vertical, 4 = east-west, 8 = north-south.
const AXIS = { y: 0, x: 4, z: 8 };
export function pillar(name, { type = 0, axis = "y" } = {}) {
  if (AXIS[axis] === undefined) throw new Error(`pillar axis ${axis}`);
  return { name, meta: (type & 3) | AXIS[axis] };
}

// Vanilla stone slabs (minecraft:stone_slab): 0 stone, 1 sandstone, 3 cobble,
// 4 brick, 5 stone brick, 6 nether brick, 7 quartz. top = upper half.
// Wooden slabs (minecraft:wooden_slab) use the plank type 0..5.
export const STONE_SLAB = { stone: 0, sandstone: 1, cobblestone: 3, brick: 4, stonebrick: 5, nether_brick: 6, quartz: 7 };
export function slab(name, { type = 0, top = false } = {}) {
  return { name, meta: (type & 7) | (top ? 8 : 0) };
}

// Doors: two blocks. `facing` is the direction a player walking through
// from outside looks (ItemDoor: 0 east, 1 south, 2 west, 3 north). The upper
// half is 8, +1 when the hinge is on the right.
const DOOR_FACING = { east: 0, south: 1, west: 2, north: 3 };
export function door(name, { facing, hingeRight = false }) {
  const m = DOOR_FACING[facing];
  if (m === undefined) throw new Error(`door facing ${facing}`);
  return [{ name, meta: m }, { name, meta: 8 | (hingeRight ? 1 : 0) }];
}

// Torches: `on` is where the supporting block is relative to the torch.
// 1 = block to the west (torch on its east face), 2 = east, 3 = north,
// 4 = south, 5 = floor.
const TORCH_ON = { west: 1, east: 2, north: 3, south: 4, floor: 5 };
export function torch(name = "minecraft:torch", { on = "floor" } = {}) {
  const m = TORCH_ON[on];
  if (m === undefined) throw new Error(`torch on ${on}`);
  return { name, meta: m };
}

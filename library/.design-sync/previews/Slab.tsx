import { Structure, Fill, Slab } from "gtnh-blueprint";

/** Bottom slabs (default, west) and top slabs (east), with a full plank row between for scale. */
export function BottomAndTop() {
  return (
    <Structure name="Slab halves" size={[7, 2, 3]} viewHeight={240}>
      <Fill block="minecraft:planks@1" from={[3, 0, 0]} to={[3, 0, 2]} />
      <Slab block="minecraft:stone_slab@5" at={[0, 0, 0]} to={[2, 0, 2]} />
      <Slab block="minecraft:stone_slab@5" at={[4, 0, 0]} to={[6, 0, 2]} top />
    </Structure>
  );
}

/** A slab path through a lawn and a quartz slab trim on top of a wall. */
export function PathAndTrim() {
  return (
    <Structure name="Garden path" size={[9, 4, 5]} viewHeight={260}>
      <Fill block="minecraft:grass@0" from={[0, 0, 0]} to={[8, 0, 4]} />
      <Slab block="minecraft:stone_slab@0" at={[0, 1, 2]} to={[8, 1, 2]} />
      <Fill block="minecraft:quartz_block@0" from={[0, 1, 0]} to={[8, 2, 0]} />
      <Slab block="minecraft:stone_slab@7" at={[0, 3, 0]} to={[8, 3, 0]} />
    </Structure>
  );
}

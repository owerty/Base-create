import { Fragment } from "react";
import { Structure, Fill, Stairs, Slab } from "gtnh-blueprint";

/** Gable roof recipe: two stair rows per step, facing toward the ridge, capped with slabs. */
export function GableRoof() {
  const ROOF = "minecraft:spruce_stairs@0";
  return (
    <Structure name="Gable roof" size={[9, 5, 7]} viewHeight={260}>
      <Fill block="minecraft:planks@1" from={[0, 0, 0]} to={[8, 0, 6]} />
      {[0, 1, 2].map(k => (
        <Fragment key={k}>
          <Stairs block={ROOF} at={[0, 1 + k, k]} to={[8, 1 + k, k]} facing="south" />
          <Stairs block={ROOF} at={[0, 1 + k, 6 - k]} to={[8, 1 + k, 6 - k]} facing="north" />
        </Fragment>
      ))}
      <Slab block="minecraft:wooden_slab@1" at={[0, 4, 3]} to={[8, 4, 3]} />
    </Structure>
  );
}

/** A straight staircase climbing east. */
export function Staircase() {
  return (
    <Structure name="Stone staircase" size={[5, 5, 3]} viewHeight={240}>
      {[0, 1, 2, 3, 4].map(i => (
        <Fragment key={i}>
          {i > 0 && <Fill block="minecraft:stonebrick@0" from={[i, 0, 0]} to={[i, i - 1, 2]} />}
          <Stairs block="minecraft:stone_brick_stairs@0" at={[i, i, 0]} to={[i, i, 2]} facing="east" />
        </Fragment>
      ))}
    </Structure>
  );
}

/** Upside-down stairs as eaves and an arch over a doorway. */
export function UpsideDownArch() {
  return (
    <Structure name="Quartz arch" size={[5, 4, 1]} viewHeight={240}>
      <Fill block="minecraft:quartz_block@0" from={[0, 0, 0]} to={[0, 3, 0]} />
      <Fill block="minecraft:quartz_block@0" from={[4, 0, 0]} to={[4, 3, 0]} />
      <Fill block="minecraft:quartz_block@0" from={[1, 3, 0]} to={[3, 3, 0]} />
      <Stairs block="minecraft:quartz_stairs@0" at={[1, 2, 0]} facing="west" upsideDown />
      <Stairs block="minecraft:quartz_stairs@0" at={[3, 2, 0]} facing="east" upsideDown />
    </Structure>
  );
}

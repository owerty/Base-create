import { Structure, Fill } from "gtnh-blueprint";

/** A solid foundation slab of cobblestone. */
export function Foundation() {
  return (
    <Structure name="Cobblestone foundation" size={[9, 1, 7]} viewHeight={240}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[8, 0, 6]} />
    </Structure>
  );
}

/** Stacked fills: later fills overwrite earlier ones, so a stripe of brick replaces stone. */
export function LayeredWall() {
  return (
    <Structure name="Banded wall" size={[9, 5, 1]} viewHeight={240}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[8, 4, 0]} />
      <Fill block="minecraft:brick_block@0" from={[0, 2, 0]} to={[8, 2, 0]} />
      <Fill block="minecraft:glass_pane@0" from={[2, 3, 0]} to={[6, 3, 0]} />
    </Structure>
  );
}

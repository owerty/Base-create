import { Structure, Fill, Air, Door } from "gtnh-blueprint";

/** A wooden and an iron door set into a brick wall; `at` is the lower half. */
export function WoodAndIron() {
  return (
    <Structure name="Doors" size={[7, 4, 1]} viewHeight={240}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[6, 0, 0]} />
      <Fill block="minecraft:brick_block@0" from={[0, 1, 0]} to={[6, 3, 0]} />
      <Door block="minecraft:wooden_door@0" at={[2, 1, 0]} facing="north" />
      <Door block="minecraft:iron_door@0" at={[4, 1, 0]} facing="north" hingeRight />
    </Structure>
  );
}

/** A small hut with its door on the south wall, walked into heading north. */
export function HutEntrance() {
  return (
    <Structure name="Hut entrance" size={[5, 4, 5]} viewHeight={260}>
      <Fill block="minecraft:planks@0" from={[0, 0, 0]} to={[4, 0, 4]} />
      <Fill block="minecraft:stonebrick@0" from={[0, 1, 0]} to={[4, 3, 4]} />
      <Air from={[1, 1, 1]} to={[3, 3, 3]} />
      <Door block="minecraft:wooden_door@0" at={[2, 1, 4]} facing="north" />
    </Structure>
  );
}

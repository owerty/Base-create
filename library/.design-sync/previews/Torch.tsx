import { Structure, Fill, Torch } from "gtnh-blueprint";

/** Floor torches and wall torches; `on` names the side the supporting wall is on. */
export function FloorAndWall() {
  return (
    <Structure name="Torch placement" size={[7, 4, 3]} viewHeight={240}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[6, 0, 2]} />
      <Fill block="minecraft:stonebrick@0" from={[0, 1, 0]} to={[6, 3, 0]} />
      <Torch at={[1, 2, 1]} on="north" />
      <Torch at={[5, 2, 1]} on="north" />
      <Torch at={[3, 1, 2]} />
    </Structure>
  );
}

/** Wall sconces along a long west wall, plus floor torches on a walkway. */
export function WallSconces() {
  return (
    <Structure name="Wall sconces" size={[4, 4, 9]} viewHeight={260}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[3, 0, 8]} />
      <Fill block="minecraft:cobblestone@0" from={[0, 1, 0]} to={[0, 3, 8]} />
      <Torch at={[1, 2, 1]} on="west" />
      <Torch at={[1, 2, 4]} on="west" />
      <Torch at={[1, 2, 7]} on="west" />
      <Torch at={[3, 1, 2]} />
      <Torch at={[3, 1, 6]} />
    </Structure>
  );
}

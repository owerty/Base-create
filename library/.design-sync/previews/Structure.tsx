import { Fragment } from "react";
import { Structure, Fill, Hollow, Pillar, Stairs, Slab, Block, Door, Torch } from "gtnh-blueprint";

const PLANKS = "minecraft:planks@1";
const LOG = "minecraft:log@1";
const ROOF = "minecraft:stone_brick_stairs@0";

/** The README / demo spruce cottage: foundation, walls, posts, windows, door, gable roof. */
export function SpruceCottage() {
  const rows = [0, 1, 2, 3];
  return (
    <Structure name="Spruce cottage" size={[11, 10, 9]} viewHeight={360}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[10, 0, 8]} />
      <Hollow block={PLANKS} from={[0, 1, 0]} to={[10, 4, 8]} noFloor noCeiling />
      {[[0, 0], [10, 0], [0, 8], [10, 8]].map(([x, z]) => (
        <Pillar key={`${x},${z}`} block={LOG} at={[x, 1, z]} to={[x, 4, z]} />
      ))}
      <Pillar block={LOG} axis="x" at={[0, 4, 0]} to={[10, 4, 0]} />
      <Pillar block={LOG} axis="x" at={[0, 4, 8]} to={[10, 4, 8]} />
      {[2, 3, 7, 8].map(x => <Block key={`n${x}`} block="minecraft:glass_pane@0" at={[x, 2, 0]} />)}
      {[2, 3, 7, 8].map(x => <Block key={`s${x}`} block="minecraft:glass_pane@0" at={[x, 2, 8]} />)}
      <Door block="minecraft:wooden_door@0" at={[5, 1, 8]} facing="north" />
      <Torch at={[5, 3, 1]} on="north" />
      {rows.map(k => (
        <Fragment key={k}>
          <Stairs block={ROOF} at={[0, 5 + k, k]} to={[10, 5 + k, k]} facing="south" />
          <Stairs block={ROOF} at={[0, 5 + k, 8 - k]} to={[10, 5 + k, 8 - k]} facing="north" />
          {k < 3 && <Fill block={PLANKS} from={[0, 5 + k, k + 1]} to={[0, 5 + k, 7 - k]} />}
          {k < 3 && <Fill block={PLANKS} from={[10, 5 + k, k + 1]} to={[10, 5 + k, 7 - k]} />}
        </Fragment>
      ))}
      <Slab block="minecraft:stone_slab@5" at={[0, 9, 4]} to={[10, 9, 4]} />
      <Block block="minecraft:stonebrick@0" at={[0, 8, 4]} />
      <Block block="minecraft:stonebrick@0" at={[10, 8, 4]} />
    </Structure>
  );
}

/** A compact marble tower with the material list hidden. */
export function MarbleTowerNoMaterials() {
  return (
    <Structure name="Marble watchtower" size={[5, 9, 5]} viewHeight={320} hideMaterials>
      <Fill block="chisel:marble@0" from={[0, 0, 0]} to={[4, 0, 4]} />
      <Hollow block="chisel:marble@0" from={[0, 1, 0]} to={[4, 6, 4]} noFloor noCeiling />
      {[[0, 0], [4, 0], [0, 4], [4, 4]].map(([x, z]) => (
        <Pillar key={`${x},${z}`} block="chisel:marble_pillar@0" at={[x, 1, z]} to={[x, 6, z]} />
      ))}
      <Fill block="minecraft:glass_pane@0" from={[1, 4, 0]} to={[3, 5, 0]} />
      <Fill block="minecraft:glass_pane@0" from={[1, 4, 4]} to={[3, 5, 4]} />
      <Slab block="minecraft:stone_slab@7" at={[0, 7, 0]} to={[4, 7, 4]} />
      <Torch at={[2, 8, 2]} />
    </Structure>
  );
}

/** An unknown block reference: shown as a magenta cube and listed in the warning box. */
export function UnknownBlockWarning() {
  return (
    <Structure name="Typo check" size={[5, 3, 5]} viewHeight={220}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[4, 0, 4]} />
      <Block block="minecraft:stonebrik@0" at={[2, 1, 2]} />
    </Structure>
  );
}

/** The README-header quick start: foundation, walls, post, window, door, two stair rows and a slab roof. */
export function QuickStart() {
  return (
    <Structure name="Spruce cottage (quick start)" size={[11, 10, 9]} viewHeight={420}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[10, 0, 8]} />
      <Hollow block="minecraft:planks@1" from={[0, 1, 0]} to={[10, 4, 8]} noFloor noCeiling />
      <Pillar block="minecraft:log@1" at={[0, 1, 0]} to={[0, 4, 0]} />
      <Block block="minecraft:glass_pane@0" at={[3, 2, 0]} />
      <Door block="minecraft:wooden_door@0" at={[5, 1, 8]} facing="north" />
      <Stairs block="minecraft:stone_brick_stairs@0" at={[0, 5, 0]} to={[10, 5, 0]} facing="south" />
      <Stairs block="minecraft:stone_brick_stairs@0" at={[0, 5, 8]} to={[10, 5, 8]} facing="north" />
      <Slab block="minecraft:stone_slab@5" at={[0, 6, 1]} to={[10, 6, 7]} />
    </Structure>
  );
}

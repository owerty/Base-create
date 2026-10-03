import { Structure, Fill, Hollow, Air, ArchShape } from "gtnh-blueprint";

const R = "minecraft:brick_block@0";

/** Brick gable roof with a ridge over a spruce house, and a glazed window. */
export function GableHouse() {
  return (
    <Structure name="Gable roof" size={[7, 8, 7]} viewHeight={320}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[6, 0, 6]} />
      <Hollow block="minecraft:planks@1" from={[0, 1, 0]} to={[6, 3, 6]} noFloor noCeiling />
      <Fill block="minecraft:planks@1" from={[0, 4, 1]} to={[0, 4, 5]} />
      <Fill block="minecraft:planks@1" from={[6, 4, 1]} to={[6, 4, 5]} />
      <Fill block="minecraft:planks@1" from={[0, 5, 2]} to={[0, 6, 4]} />
      <Fill block="minecraft:planks@1" from={[6, 5, 2]} to={[6, 6, 4]} />
      <Air from={[2, 1, 6]} to={[4, 2, 6]} />
      <ArchShape shape="windowFrame" block="minecraft:planks@0" secondary="minecraft:glass_pane@0" at={[2, 1, 6]} to={[4, 2, 6]} facing="south" />
      <ArchShape shape="roofTile" block={R} at={[0, 4, 0]} to={[6, 4, 0]} facing="south" />
      <ArchShape shape="roofTile" block={R} at={[0, 5, 1]} to={[6, 5, 1]} facing="south" />
      <ArchShape shape="roofTile" block={R} at={[0, 6, 2]} to={[6, 6, 2]} facing="south" />
      <ArchShape shape="roofTile" block={R} at={[0, 4, 6]} to={[6, 4, 6]} facing="north" />
      <ArchShape shape="roofTile" block={R} at={[0, 5, 5]} to={[6, 5, 5]} facing="north" />
      <ArchShape shape="roofTile" block={R} at={[0, 6, 4]} to={[6, 6, 4]} facing="north" />
      <ArchShape shape="roofRidge" block={R} at={[0, 7, 3]} to={[6, 7, 3]} facing="south" />
    </Structure>
  );
}

/** Quartz colonnade: pillar bases, round pillars, capitals and an arch between them. */
export function Colonnade() {
  const Q = "minecraft:quartz_block@0";
  return (
    <Structure name="Colonnade" size={[4, 5, 1]} viewHeight={300}>
      <ArchShape shape="pillarBase" block={Q} at={[0, 0, 0]} />
      <ArchShape shape="pillarBase" block={Q} at={[3, 0, 0]} />
      <ArchShape shape="pillar" block={Q} at={[0, 1, 0]} to={[0, 2, 0]} />
      <ArchShape shape="pillar" block={Q} at={[3, 1, 0]} to={[3, 2, 0]} />
      <ArchShape shape="doricCapital" block={Q} at={[0, 3, 0]} />
      <ArchShape shape="doricCapital" block={Q} at={[3, 3, 0]} />
      <ArchShape shape="archD2" block={Q} at={[1, 3, 0]} facing="west" />
      <ArchShape shape="archD2" block={Q} at={[2, 3, 0]} facing="east" />
      <Fill block={Q} from={[0, 4, 0]} to={[3, 4, 0]} />
    </Structure>
  );
}

/** Roof tile, outer and inner corners, hip ridge and stairs on a stone pad. */
export function RoofPieces() {
  return (
    <Structure name="Roof pieces" size={[5, 2, 3]} viewHeight={260}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[4, 0, 2]} />
      <ArchShape shape="roofTile" block={R} at={[0, 1, 0]} facing="north" />
      <ArchShape shape="roofOuterCorner" block={R} at={[2, 1, 0]} facing="north" />
      <ArchShape shape="roofInnerCorner" block={R} at={[4, 1, 0]} facing="north" />
      <ArchShape shape="roofSmartRidge" block={R} at={[1, 1, 2]} />
      <ArchShape shape="stairs" block="minecraft:planks@1" at={[3, 1, 2]} facing="north" />
    </Structure>
  );
}

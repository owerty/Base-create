import { Fragment } from "react";
import { createRoot } from "react-dom/client";
import { Structure, Fill, Hollow, Pillar, Stairs, Slab, Block, Door, Torch, Palette } from "../src/index";

const PLANKS = "minecraft:planks@1";
const LOG = "minecraft:log@1";
const ROOF = "minecraft:stone_brick_stairs@0";

function Cottage() {
  const rows = [0, 1, 2, 3];
  return (
    <Structure name="Spruce cottage" size={[11, 10, 9]}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[10, 0, 8]} />
      <Hollow block={PLANKS} from={[0, 1, 0]} to={[10, 4, 8]} noFloor noCeiling />
      {[[0, 0], [10, 0], [0, 8], [10, 8]].map(([x, z]) => (
        <Pillar key={`${x},${z}`} block={LOG} at={[x, 1, z]} to={[x, 4, z]} />
      ))}
      <Pillar block={LOG} axis="x" at={[0, 4, 0]} to={[10, 4, 0]} />
      <Pillar block={LOG} axis="x" at={[0, 4, 8]} to={[10, 4, 8]} />
      {[2, 3, 7, 8].map(x => <Block key={x} block="minecraft:glass_pane@0" at={[x, 2, 0]} />)}
      {[2, 3, 7, 8].map(x => <Block key={x} block="minecraft:glass_pane@0" at={[x, 2, 8]} />)}
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

createRoot(document.getElementById("root")!).render(
  <div style={{ display: "grid", gap: 20, padding: 20, background: "#0e1014", minHeight: "100vh" }}>
    <Cottage />
    <Palette query="marble" limit={24} />
  </div>,
);

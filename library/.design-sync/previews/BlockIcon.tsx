import { BlockIcon } from "gtnh-blueprint";

const ROW = ["minecraft:stonebrick@0", "minecraft:planks@1", "minecraft:log@1", "chisel:marble@0", "minecraft:brick_block@0", "minecraft:quartz_block@0", "minecraft:glass@0", "minecraft:glowstone@0"];

/** The default 16px swatches, as used in the material list. */
export function DefaultSize() {
  return <div style={{ display: "flex", gap: 6, padding: 12, background: "#15171c", borderRadius: 8 }}>{ROW.map(b => <BlockIcon key={b} block={b} />)}</div>;
}

/** Larger swatches with labels. */
export function LabelledLarge() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: 12, background: "#15171c", borderRadius: 8, color: "#e6e8eb", font: "12px ui-sans-serif, system-ui, sans-serif" }}>
      {ROW.map(b => (
        <div key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BlockIcon block={b} size={32} />
          <span>{b}</span>
        </div>
      ))}
    </div>
  );
}

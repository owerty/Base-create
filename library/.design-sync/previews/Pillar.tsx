import { Structure, Fill, Pillar } from "gtnh-blueprint";

/** Timber frame: upright log posts (axis "y") joined by beams along x and z. */
export function TimberFrame() {
  const LOG = "minecraft:log@0";
  return (
    <Structure name="Oak timber frame" size={[7, 5, 5]} viewHeight={260}>
      <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[6, 0, 4]} />
      {[[0, 0], [6, 0], [0, 4], [6, 4]].map(([x, z]) => (
        <Pillar key={`${x},${z}`} block={LOG} at={[x, 1, z]} to={[x, 4, z]} />
      ))}
      <Pillar block={LOG} axis="x" at={[1, 4, 0]} to={[5, 4, 0]} />
      <Pillar block={LOG} axis="x" at={[1, 4, 4]} to={[5, 4, 4]} />
      <Pillar block={LOG} axis="z" at={[0, 4, 1]} to={[0, 4, 3]} />
      <Pillar block={LOG} axis="z" at={[6, 4, 1]} to={[6, 4, 3]} />
    </Structure>
  );
}

/** Quartz pillars as columns of a portico. */
export function QuartzColumns() {
  return (
    <Structure name="Portico" size={[9, 6, 3]} viewHeight={260}>
      <Fill block="minecraft:quartz_block@0" from={[0, 0, 0]} to={[8, 0, 2]} />
      {[0, 2, 4, 6, 8].map(x => <Pillar key={x} block="minecraft:quartz_block@2" at={[x, 1, 2]} to={[x, 4, 2]} />)}
      <Fill block="minecraft:quartz_block@1" from={[0, 5, 0]} to={[8, 5, 2]} />
    </Structure>
  );
}

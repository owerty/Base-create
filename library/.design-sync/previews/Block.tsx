import { Structure, Fill, Block } from "gtnh-blueprint";

/** Single blocks placed one at a time: a chisel-marble checkerboard on a stone floor. */
export function Checkerboard() {
  const cells: [number, number][] = [];
  for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) if ((x + z) % 2 === 0) cells.push([x, z]);
  return (
    <Structure name="Checkerboard floor" size={[6, 2, 6]} viewHeight={260}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[5, 0, 5]} />
      {cells.map(([x, z]) => <Block key={`${x},${z}`} block="chisel:marble@0" at={[x, 0, z]} />)}
      <Block block="minecraft:glowstone@0" at={[0, 1, 0]} />
      <Block block="minecraft:redstone_lamp@0" at={[5, 1, 5]} />
    </Structure>
  );
}

/** Panes and fences placed with <Block> connect to their neighbours on their own. */
export function PanesAndFences() {
  return (
    <Structure name="Fenced garden" size={[7, 3, 5]} viewHeight={260}>
      <Fill block="minecraft:grass@0" from={[0, 0, 0]} to={[6, 0, 4]} />
      {[0, 1, 2, 3, 4, 5, 6].map(x => <Block key={`n${x}`} block="minecraft:fence@0" at={[x, 1, 0]} />)}
      {[0, 1, 2, 3, 4, 5, 6].map(x => <Block key={`s${x}`} block="minecraft:fence@0" at={[x, 1, 4]} />)}
      {[1, 2, 3].map(z => <Block key={`w${z}`} block="minecraft:fence@0" at={[0, 1, z]} />)}
      {[1, 2, 3].map(z => <Block key={`e${z}`} block="minecraft:fence@0" at={[6, 1, z]} />)}
      {[2, 3, 4].map(x => <Block key={`g${x}`} block="minecraft:glass_pane@0" at={[x, 1, 2]} />)}
    </Structure>
  );
}

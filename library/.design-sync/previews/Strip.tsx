import { Structure, Fill, Strip, Corner } from "gtnh-blueprint";

const LAPIS = "ExtraUtilities:greenscreen@0";

/** Black glass wall outlined on the room side with white Lapis Caelestis strips. */
export function GlassOutline() {
  return (
    <Structure name="Outlined glass wall" size={[7, 5, 3]} viewHeight={300}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[6, 0, 2]} />
      <Fill block="minecraft:stained_glass@15" from={[0, 1, 0]} to={[6, 4, 0]} />
      <Strip block={LAPIS} at={[0, 1, 1]} to={[6, 1, 1]} edge="bottom-north" />
      <Strip block={LAPIS} at={[0, 4, 1]} to={[6, 4, 1]} edge="top-north" />
      <Strip block={LAPIS} at={[0, 1, 1]} to={[0, 4, 1]} edge="north-west" />
      <Strip block={LAPIS} at={[6, 1, 1]} to={[6, 4, 1]} edge="north-east" />
      <Strip block={LAPIS} at={[3, 1, 1]} to={[3, 4, 1]} edge="north-west" />
    </Structure>
  );
}

/** Strip, post and pillar (size 1, 2, 4) on the same edge, with a nook capping the strip. */
export function Sizes() {
  return (
    <Structure name="Strip sizes" size={[5, 3, 2]} viewHeight={260}>
      <Fill block="minecraft:quartz_block@0" from={[0, 0, 0]} to={[4, 0, 0]} />
      <Strip block="minecraft:planks@5" at={[0, 1, 0]} edge="bottom-north" />
      <Corner block="minecraft:planks@5" at={[1, 1, 0]} corner="bottom-north-west" />
      <Strip block="minecraft:planks@5" at={[2, 1, 0]} edge="bottom-north" size={2} />
      <Strip block="minecraft:planks@5" at={[4, 1, 0]} edge="bottom-north" size={4} />
    </Structure>
  );
}

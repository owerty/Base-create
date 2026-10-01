import { Structure, Fill, Corner } from "gtnh-blueprint";

/** Corner pieces (size 2, black Lapis Caelestis) studding the four outer corners of a quartz platform. */
export function PlatformStuds() {
  const STUD = "ExtraUtilities:greenscreen@15";
  return (
    <Structure name="Corner studs" size={[3, 2, 3]} viewHeight={260}>
      <Fill block="minecraft:quartz_block@0" from={[0, 0, 0]} to={[2, 0, 2]} />
      <Corner block={STUD} at={[0, 1, 0]} corner="bottom-north-west" size={2} />
      <Corner block={STUD} at={[2, 1, 0]} corner="bottom-north-east" size={2} />
      <Corner block={STUD} at={[0, 1, 2]} corner="bottom-south-west" size={2} />
      <Corner block={STUD} at={[2, 1, 2]} corner="bottom-south-east" size={2} />
    </Structure>
  );
}

/** Nook, corner and notch (size 1, 2, 4) side by side. */
export function Sizes() {
  return (
    <Structure name="Corner sizes" size={[5, 2, 1]} viewHeight={220}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[4, 0, 0]} />
      <Corner block="minecraft:brick_block@0" at={[0, 1, 0]} corner="bottom-north-west" />
      <Corner block="minecraft:brick_block@0" at={[2, 1, 0]} corner="bottom-north-west" size={2} />
      <Corner block="minecraft:brick_block@0" at={[4, 1, 0]} corner="bottom-north-west" size={4} />
    </Structure>
  );
}

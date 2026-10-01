import { Structure, Fill, Air } from "gtnh-blueprint";

/** Carve a doorway and a window hole out of a solid wall. */
export function CarvedOpenings() {
  return (
    <Structure name="Wall with openings" size={[9, 5, 1]} viewHeight={240}>
      <Fill block="minecraft:sandstone@2" from={[0, 0, 0]} to={[8, 4, 0]} />
      <Air from={[2, 0, 0]} to={[3, 2, 0]} />
      <Air from={[5, 2, 0]} to={[7, 3, 0]} />
    </Structure>
  );
}

/** A single-block Air (no `to`) knocks out one block. */
export function SingleHole() {
  return (
    <Structure name="Arrow slit" size={[5, 4, 1]} viewHeight={220}>
      <Fill block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[4, 3, 0]} />
      <Air from={[2, 2, 0]} />
    </Structure>
  );
}

import { Structure, Hollow } from "gtnh-blueprint";

/** A closed box shell: walls, floor and ceiling. */
export function ClosedRoom() {
  return (
    <Structure name="Stone brick room" size={[7, 5, 7]} viewHeight={260}>
      <Hollow block="minecraft:stonebrick@0" from={[0, 0, 0]} to={[6, 4, 6]} />
    </Structure>
  );
}

/** Walls only: noFloor and noCeiling leave the top and bottom open. */
export function WallsOnly() {
  return (
    <Structure name="Plank walls" size={[9, 4, 7]} viewHeight={260}>
      <Hollow block="minecraft:planks@1" from={[0, 0, 0]} to={[8, 3, 6]} noFloor noCeiling />
    </Structure>
  );
}

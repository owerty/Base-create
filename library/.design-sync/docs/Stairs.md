---
category: Placement
---
Stairs inside a `<Structure>`: one at `at`, or a straight run to `to`, all with the same `facing`. `facing` is the side the tall back of the step is on (the direction you walk to go up); for roofs it points toward the ridge. `upsideDown` hangs the step from the ceiling for eaves, arches and window hoods.

Gable roof, ridge along x, building `W` wide and `L` long, walls up to `y = top`: for each `k` while `k < L/2`

```tsx
<Stairs block="minecraft:spruce_stairs@0" at={[0, top + 1 + k, k]} to={[W - 1, top + 1 + k, k]} facing="south" />
<Stairs block="minecraft:spruce_stairs@0" at={[0, top + 1 + k, L - 1 - k]} to={[W - 1, top + 1 + k, L - 1 - k]} facing="north" />
```

Fill the triangular gable ends with wall blocks and cap an odd-length roof with a `Slab` run along the ridge. Ridge along z: rows along z, `facing="east"` on the west slope, `facing="west"` on the east slope.

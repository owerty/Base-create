---
category: Placement
---
Half-height slabs inside a `<Structure>`: one at `at` or a box to `to`. Bottom half by default; `top` puts them in the upper half (thin ceilings, floor trims, ridge caps). Use slab block refs, e.g. `minecraft:stone_slab@5` (stone brick), `@7` (quartz), `minecraft:wooden_slab@N`.

```tsx
<Slab block="minecraft:stone_slab@5" at={[0, 9, 4]} to={[10, 9, 4]} />
<Slab block="minecraft:wooden_slab@1" at={[1, 3, 1]} to={[5, 3, 5]} top />
```

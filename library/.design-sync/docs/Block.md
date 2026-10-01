---
category: Placement
---
Places one block at `at` (`[x, y, z]`) inside a `<Structure>`. Use it for single details (a lamp, a chiseled accent) and for panes, fences and walls, which connect to their neighbours automatically.

`block` is `"registry:name@meta"` (e.g. `"minecraft:stonebrick@3"`, `"chisel:marble@1"`); meta is the item variant, never direction bits. Use `Stairs`, `Slab`, `Pillar`, `Door` and `Torch` for those shapes instead - they compute direction metadata. `meta` overrides the raw world metadata and is rarely needed.

```tsx
<Block block="minecraft:glass_pane@0" at={[3, 2, 0]} />
<Block block="minecraft:glowstone@0" at={[5, 4, 5]} />
```

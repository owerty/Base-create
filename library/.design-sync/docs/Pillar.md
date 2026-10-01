---
category: Placement
---
Logs and pillar blocks along an axis inside a `<Structure>`: posts (`axis="y"`, the default), or beams and lintels (`axis="x"` / `"z"`). One at `at` or a straight run to `to`. Use for `minecraft:log@N`, `minecraft:log2@N`, `minecraft:quartz_block@2`, `chisel:marble_pillar@0`.

```tsx
<Pillar block="minecraft:log@1" at={[0, 1, 0]} to={[0, 4, 0]} />
<Pillar block="minecraft:log@1" axis="x" at={[0, 4, 0]} to={[10, 4, 0]} />
```

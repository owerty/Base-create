---
category: Placement
---
Clears blocks back to air inside a `<Structure>`: one block at `from`, or the inclusive box `from`..`to`. Place it after the wall it cuts into (later components win) to carve doorways, window holes and interiors.

```tsx
<Fill block="minecraft:stonebrick@0" from={[0, 1, 0]} to={[8, 4, 0]} />
<Air from={[3, 1, 0]} to={[4, 3, 0]} />
```

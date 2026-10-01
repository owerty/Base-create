---
category: Placement
---
A two-block-tall door inside a `<Structure>`. `at` is the lower half (the upper half goes directly above); `facing` is the direction you face walking in; `hingeRight` flips the hinge. Leave or carve a 1x2 gap in the wall for it (place it after the wall).

```tsx
<Door block="minecraft:wooden_door@0" at={[5, 1, 8]} facing="north" />
<Door block="minecraft:iron_door@0" at={[2, 1, 0]} facing="south" hingeRight />
```

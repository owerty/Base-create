---
category: Placement
---
Forge Multipart corner pieces inside a `<Structure>`: a small cube in one corner of each block space, e.g. to cap where strips end or meet. `corner` names three faces, e.g. `"bottom-north-west"` or `"top-south-east"`. `size` is 1 nook (default), 2 corner or 4 notch, in eighths. Like `<Strip>`, it shares the block space with other microblocks, and the player places it by hand in game.

```tsx
<Corner block="ExtraUtilities:greenscreen@0" at={[0, 5, 1]} corner="bottom-north-west" />
```

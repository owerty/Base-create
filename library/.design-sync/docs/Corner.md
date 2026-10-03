---
category: Placement
---
Forge Multipart corner pieces (nooks, corners, notches) inside a `<Structure>`: a small cube in one corner of each block space, e.g. to cap where strips end or meet. `corner` names three faces, e.g. `"bottom-north-west"` or `"top-south-east"`. `size` is 1 nook (default), 2 corner or 4 notch, in eighths. Like `<Strip>`, it shares the block space with other microblocks; the player's Schematica build prints it like strips. Use `size={1}` (the default) when asked for nooks.

```tsx
<Corner block="ExtraUtilities:greenscreen@0" at={[0, 5, 1]} corner="bottom-north-west" />
```

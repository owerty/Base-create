---
category: Placement
---
Forge Multipart strips along one edge of each block space, inside a `<Structure>`. Use them for trim: outlining the inside edges of glass walls and windows, picture-frame lines, thin railings. `block` is the material (any full block, e.g. `"ExtraUtilities:greenscreen@0"` white Lapis Caelestis, `@15` black). Several strips (and corners) can share one block space, so place them in the **air next to** what they trim, after it; a strip replaces a full block in its space.

- `edge` names the edge by the two faces that meet there. Horizontal: `"bottom-north"`, `"bottom-south"`, `"bottom-west"`, `"bottom-east"`, `"top-north"`, `"top-south"`, `"top-west"`, `"top-east"`. Vertical: `"north-west"`, `"north-east"`, `"south-west"`, `"south-east"`.
- `at`/`to` give a run (inclusive). Every block space in it gets the same edge, so a run along x uses a horizontal edge like `"bottom-north"`.
- `size`: 1 strip (default), 2 post, 4 pillar, in eighths of a block.
- In game, Schematica shows strips in the hologram, but its printer and material list skip them. The Structure's own material list counts them, and the player places them by hand.

Window outline: glass wall at `z = 0`, room to the south, strips on the room side (`z = 1`):

```tsx
const LAPIS = "ExtraUtilities:greenscreen@0";
<Fill block="minecraft:stained_glass@15" from={[0, 0, 0]} to={[4, 4, 0]} />
<Strip block={LAPIS} at={[0, 0, 1]} to={[4, 0, 1]} edge="bottom-north" />
<Strip block={LAPIS} at={[0, 4, 1]} to={[4, 4, 1]} edge="top-north" />
<Strip block={LAPIS} at={[0, 0, 1]} to={[0, 4, 1]} edge="north-west" />
<Strip block={LAPIS} at={[4, 0, 1]} to={[4, 4, 1]} edge="north-east" />
```

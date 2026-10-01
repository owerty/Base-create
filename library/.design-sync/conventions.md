## Building with gtnh-blueprint (read first)

This library designs **Minecraft buildings for GT New Horizons 2.9** and exports Schematica `.schematic` files. It is not a UI kit: there are no CSS classes, tokens or theme to apply. Components either draw a 3D build (`Structure`) or are standalone catalog widgets (`Palette`, `BlockIcon`). Every component styles itself inline (dark panel, `#15171c`); add only your own page layout around them.

### The one rule: placement components go inside `<Structure>`

`Block`, `Fill`, `Air`, `Hollow`, `Stairs`, `Slab`, `Pillar`, `Door` and `Torch` render nothing themselves. They record blocks into the nearest `<Structure>` and **throw ("Block components must be inside a <Structure>") anywhere else**. `Structure` needs `name` and `size={[width, height, length]}`.

- Coordinates are `[x, y, z]`, 0-based, inside `size`: x west→east, y up, z north→south; `y = 0` is the foundation layer.
- Children apply **in order; later ones overwrite earlier ones**. Build big shapes first (foundation `Fill`, walls `Hollow ... noFloor noCeiling`), then openings (`Air`), windows, doors, trim, roof.
- `block` is `"registry:name@meta"` (e.g. `"minecraft:stonebrick@0"`, `"chisel:marble@1"`). Meta is the item variant only; never add direction bits. Use `Stairs` (`facing`, `upsideDown`), `Slab` (`top`), `Pillar` (`axis`), `Door` (`facing`, `hingeRight`) and `Torch` (`on`) for shaped blocks; panes, fences and walls go in `Block`/`Fill` and connect on their own.
- Unknown references show as a magenta cube plus a warning box. Look up real references with the `<Palette>` widget, or `window.GtnhBlueprint.search(...)` / `lookup(ref)` / `BLOCKS` (6,360 variants).
- Size the view with `viewHeight` (default 520 px). Use `hideMaterials` for compact layouts. Each `Structure` owns a WebGL canvas, so keep a page to a handful.

### Where the truth lives

- `components/placement/<Name>/<Name>.prompt.md`: semantics and examples per component (the `Stairs` doc has the gable-roof recipe).
- `components/<group>/<Name>/<Name>.d.ts`: exact props.

### Example

```jsx
const { Structure, Fill, Hollow, Pillar, Block, Door, Stairs, Slab } = window.GtnhBlueprint;

<div style={{ display: "grid", gap: 16, padding: 16 }}>
  <Structure name="Spruce cottage" size={[11, 10, 9]} viewHeight={420}>
    <Fill block="minecraft:cobblestone@0" from={[0, 0, 0]} to={[10, 0, 8]} />
    <Hollow block="minecraft:planks@1" from={[0, 1, 0]} to={[10, 4, 8]} noFloor noCeiling />
    <Pillar block="minecraft:log@1" at={[0, 1, 0]} to={[0, 4, 0]} />
    <Block block="minecraft:glass_pane@0" at={[3, 2, 0]} />
    <Door block="minecraft:wooden_door@0" at={[5, 1, 8]} facing="north" />
    <Stairs block="minecraft:stone_brick_stairs@0" at={[0, 5, 0]} to={[10, 5, 0]} facing="south" />
    <Stairs block="minecraft:stone_brick_stairs@0" at={[0, 5, 8]} to={[10, 5, 8]} facing="north" />
    <Slab block="minecraft:stone_slab@5" at={[0, 6, 1]} to={[10, 6, 7]} />
  </Structure>
</div>
```

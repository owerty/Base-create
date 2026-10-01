# GTNH Blueprint

Design buildings in Claude Design, print them in GTNH 2.9 with Schematica.

Scope: buildings and decoration (walls, roofs, windows, trim, lighting).
Machines, hatches and multiblocks are out of scope.

```
prompt -> Claude Design (block component library) -> .schematic -> Schematica -> hologram / printer
```

## Parts

1. **Block dump** (client mod or command, run in a 2.9 instance): registry
   name + meta, display name, per-face textures, a direction rule per block
   family, and style tags (`stone-light`, `trim-dark`, `glass-clear`, `roof`...).
2. **Component library**, uploaded with `/design-sync`: `<Structure>` (3D
   view, layer slider, material list, export), `<Block>`, `<Fill>`,
   `<Hollow>`, `<Stairs facing upsideDown>`, `<Slab top>`, `<Pillar axis>`,
   then building-level `<Floor>`, `<Walls>`, `<Roof style overhang>`,
   `<Window>`, `<Door>`, `<Trim>`, `<Repeat>`.
3. **Converter page** on philipxjm.github.io: paste a copied blueprint, get a
   `.schematic`; also opens existing schematics. Fallback for when Claude
   Design's preview blocks downloads.
4. **Checks**: round-trip tests plus in-game spot checks.

## File format (verified against Schematica 1.12.6-GTNH bytecode)

- Gzipped NBT, root compound `Schematic`, `Materials: "Alpha"`.
- `Width`/`Height`/`Length` shorts; index = `(y * Length + z) * Width + x`.
- `Blocks` (low byte of id), `Data` (meta 0..15), `AddBlocks`.
- `SchematicaMapping`: registry name -> short id used in `Blocks`. Schematica
  remaps by name on load, so the ids in the file are local and the file
  works in any world.
- We assign local ids 1..255 (0 = air) and write `AddBlocks` as all zeros
  with one byte per block. That is valid for both read paths: the standard
  one reads it as a nibble array, the `useSchematicplusFormat` one as a full
  byte array. Cap: 255 distinct block types per schematic.
- `Icon` is optional (falls back to the default icon). `TileEntities` and
  `Entities` are written as empty lists.

## Direction metadata (vanilla 1.7.10 placement code)

| Family | Meta |
|---|---|
| Stairs | tall side east 0, west 1, south 2, north 3; +4 upside down |
| Logs / pillars | wood type in bits 0-1; axis y 0, x 4, z 8 |
| Stone slab | stone 0, sandstone 1, cobble 3, brick 4, stone brick 5, nether brick 6, quartz 7; +8 top |
| Door | lower: walking-in direction east 0, south 1, west 2, north 3; upper 8 (+1 hinge right) |
| Torch | support to the west 1, east 2, north 3, south 4, floor 5 |

Modded families need checking against the dump; most mod stairs copy vanilla.

## Milestones

- **M1** (done, confirmed in game 2026-09-30): `.schematic` writer + a 5x5 test hut
  (`examples/m1-hut.mjs` -> `out/m1-hut.schematic`). Exercises every rule in
  the table above plus one modded block (`gregtech:gt.blockcasings` meta 0).
  Read back by our decoder and by Minecraft 1.7.10's `CompressedStreamTools`.
- **M2** (built, awaiting `/design-sync` upload): `dumper/` BlueprintDump
  client mod (`/blueprintdump` -> `blueprint-dump.zip`; 12,241 variants,
  8,552 textures from 2.9.0-beta-3), `library/` React package:
  `scripts/build-catalog.mjs` keeps 6,360 building variants and packs a
  16px atlas; components `Structure`, `Block`, `Fill`, `Air`, `Hollow`,
  `Stairs`, `Slab`, `Pillar`, `Door`, `Torch`, `Palette`; three.js viewer;
  in-page Export .schematic (verified with MC's NBT reader). Agent guide in
  `library/README.md`. Dump and atlas contain pack textures: keep the repo
  private or strip them before publishing.
- **M3**: building components, in-design export button, converter page.
- **M4**: wider palette (Chisel, Carpenter's Blocks), style presets.
  Microblocks done early (2026-09-30): `<Strip>` / `<Corner>` write Forge
  Multipart parts into the schematic's TileEntities; Schematica shows them in
  the hologram, but its printer and material list skip them (checked in game).

## Risks

- Printer speed on servers; test with a slow print speed.
- Printer handling of modded stairs and door top halves; fall back to
  hand-placing whatever it gets wrong.
- Whether Claude Design's agent reasons well in 3D coordinates; the M2 test
  answers this. The export and Schematica side work without Claude Design.

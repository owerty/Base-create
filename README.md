# GTNH Blueprint

A design system for [Claude Design](https://claude.ai/design) that builds
GregTech: New Horizons 2.9 buildings out of real pack blocks, and exports them
as schematics you can print in game.

You describe a building, and Claude Design's agent builds it from these
components. It draws the result in 3D with the pack's own textures, lists the
materials, and exports a `.schematic` for Schematica or WorldEdit.

![A marble cottage with an ArchitectureCraft brick roof and glazed windows, in the Structure viewer](https://philipxjm.github.io/gtnh-blueprint/img/cottage.jpg)

Screenshots and a walkthrough: **https://philipxjm.github.io/gtnh-blueprint/**

## What's in it

- **6,360 building blocks** dumped from GTNH 2.9.0-beta-3, including stone,
  wood, glass, chisel variants, stairs, slabs, logs, fences, panes, doors and
  torches. Direction metadata is handled for you.
- **Forge Multipart microblocks:** `<Strip>` (strips, posts and pillars) and
  `<Corner>` (nooks, corners and notches).
- **All 106 ArchitectureCraft shapes:** `<ArchShape>` covers roof tiles,
  ridges, valleys, slopes, cornices, columns, capitals, arches, windows with
  glass, banisters and balustrades. They're drawn the way the mod draws them,
  including roof pieces that join their neighbours.
- **`<Structure>`:** the 3D view, with a layer slider, an optional grid, a
  material list (with sawbench recipes for shapes), and three buttons:
  **Export .schematic** (Schematica), **Export WorldEdit**
  (`//schem load` + `//paste`) and **Copy blueprint** (JSON).

## Set it up in your own Claude Design

You need [Claude Code](https://claude.com/claude-code) signed in with a
claude.ai account that has Claude Design, plus Node 22 and git.

```sh
git clone https://github.com/philipxjm/gtnh-blueprint.git
cd gtnh-blueprint/library
npm ci
npm run build
```

1. Open `library/.design-sync/config.json` and **delete the `"projectId"`
   line**. It points at my Claude Design project, which you can't access.
   Without it, the sync creates a fresh project for you.
2. Start Claude Code in `library/` (`claude`) and run **`/design-sync`**.
   If it asks you to sign in to Claude Design, run `/design-login` first.
3. The sync builds the components, checks every preview card, then asks you
   to confirm creating a project (call it what you like, e.g. "GTNH
   Blueprint") and to approve the upload. The first run can take a while.
4. In Claude Design, start a new design and pick that design system. Then
   prompt it, e.g.:
   > A two-storey marble villa, 13x9, ArchitectureCraft brick gable roof
   > with a ridge, dark-oak window frames with glass, black glass windows on
   > the ground floor outlined in white Lapis Caelestis strips.

## Getting it into the game

- **Schematica:** Export .schematic, put the file in `.minecraft/schematics/`,
  then load it with Schematica. GTNH ships Schematica, and it shows the whole
  build as a hologram. Stock Schematica's printer places normal blocks only:
  it skips microblocks, and ArchitectureCraft shapes need to be placed and
  turned by hand.
- **WorldEdit:** Export WorldEdit, put the file in the server's
  `config/worldedit/schematics/`, then run `//schem load <name>_worldedit`
  and `//paste`. The build's low north-west corner goes at your feet.
- **Matter Manipulator:** a fork that imports `.schematic` files as the copy
  source, working on a server with stock clients, is at
  [philipxjm/MatterManipulator](https://github.com/philipxjm/MatterManipulator/tree/schematic-import).

## Repo layout

| Path | What |
|---|---|
| `library/` | The React component library (`src/`), its build, and `.design-sync/` (config, component docs and preview cards for Claude Design) |
| `library/src/generated/` | Block catalog, texture atlas and ArchitectureCraft models generated from the pack |
| `dumper/` | BlueprintDump, a client mod: `/blueprintdump` writes every block, its metadata and textures to `blueprint-dump.zip` |
| `tools/` | Node scripts: Schematica → WorldEdit converter, splitting large schematics into slices, filling ground around a basement |
| `test/` | Round-trip tests for the schematic writer, microblocks and ArchitectureCraft (`npm test` at the root) |
| `examples/` | A small test hut written straight to a schematic |

### Another pack version

The catalog is GTNH 2.9.0-beta-3. For another version:

1. Build `dumper/` (`./gradlew build`) and drop the jar into that instance.
2. Run `/blueprintdump` in a world and unzip `blueprint-dump.zip`.
3. Run `node scripts/build-catalog.mjs <dump dir>` in `library/`.
4. For ArchitectureCraft, run `node scripts/build-architecture.mjs`, then
   `npm run build` and `/design-sync` again.

## Textures

The texture atlas and block data in `library/src/generated/` come from the
mods in GT New Horizons and belong to their authors under each mod's own
licence. They're included so the design system renders blocks as they look
in game. This project isn't affiliated with the GTNH team or any mod author.

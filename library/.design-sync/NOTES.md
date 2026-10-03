# design-sync notes (gtnh-blueprint)

- Config home is `library/` (the package), not the repo root. Run everything from `library/`.
- Build: `npm run build` (esbuild -> `dist/index.js`, then `tsc` -> `dist/types`). Converter entry: `--entry ./dist/index.js --node-modules ./node_modules`.
- No Storybook. Package shape; all 12 components have authored previews in `.design-sync/previews/`.
- Groups come from frontmatter `category` in `.design-sync/docs/<Name>.md` (Structure / Placement / Catalog). Those docs are also the `.prompt.md` bodies, so keep them in step with the README when the API changes.
- `dtsPropsFor` is set for every component that takes a `Vec3`: the extractor emits a bare `Vec3` with no definition, so the props are hand-written with `[number, number, number]`. **If a prop is added or renamed in `src/components.tsx` / `src/Structure.tsx`, update `dtsPropsFor` too**; it does not track source.
- All cards use `cardMode: "column"`: a `Structure` panel is wider than a grid cell.
- Placement components throw outside `<Structure>`, so every placement preview is a full `Structure` composition.
- The 3D camera looks from above south-east (+x, +z). Details on north/west-facing interior walls are visible; anything inside a closed box or behind an east/south wall is hidden. Keep this in mind when authoring previews (the first Torch "Corridor" preview hid its torches this way).
- WebGL: `src/Viewer.tsx` draws on demand and holds a WebGL context only while on screen, with at most 8 live per page; parked viewers show a still snapshot. Before 2026-09-30 every viewer kept its own context and redrew every frame, so the review page (23 viewers) lost contexts past Chrome's limit of 16 and ran slowly. If renders go missing again, check the console for "Too many active WebGL contexts".
- Playwright: the machine's cached chromium is build 1217, which matches `playwright@1.59.1`. Install that into `.ds-sync/`.
- Gotcha: `pkill -f package-validate` from a shell also kills the shell itself (its own command line matches). Use the task id or a pid instead.
- The first validate run stalled after 6 screenshots while the cards were still floor cards; once authored previews existed it ran clean. If it hangs again, load each `ds-bundle/components/*/*/*.html` in playwright one at a time with a 20s timeout to find the culprit.

- Microblocks (`Strip`, `Corner`, added 2026-09-30): format and edge numbering live in `src/core/microblocks.js`, derived from Forge Multipart's EdgeMicroClass/CornerMicroClass and CodeChickenCore's AxisCycle (decompiled from the GTNH dev jars in `~/.gradle/caches`). `test/fixtures/strips-sample.schematic` is a strip outline saved in game by Schematica, and `npm test` rebuilds it part for part. In game, the hologram shows microblocks, but the printer and Schematica's material list skip them (confirmed by the user).
- Microblock material names: only `ExtraUtilities:greenscreen` is confirmed (Extra Utilities registers unlocalized name + `_meta`). Every other block uses Forge Multipart's default (registry name + `_meta`), which is unchecked per mod. Add confirmed overrides to `MATERIAL_BASE` in `src/core/microblocks.js`.
- Catalog tints: `scripts/build-catalog.mjs` applies the dumped colour multiplier to every block that has a non-white one (52 blocks: coloured Lapis Caelestis, Botania unstable blocks, modded grasses...). Before this, only leaves and grass were tinted, so every Lapis Caelestis colour rendered white.

## Known render warns

- `[CSS_RUNTIME]`: expected. The library styles itself inline, and there is no stylesheet, tokens or fonts (system UI font stack).

## Re-sync risks

- `dtsPropsFor.Strip` / `.Corner` spell out the `Edge` / `CornerName` unions by hand; keep them in step with `src/components.tsx`.

- `dtsPropsFor` bodies are hand copies of the TS interfaces and go stale silently when props change.
- `.design-sync/docs/*.md` duplicate parts of `library/README.md` (roof recipe, palette refs).
- Previews use real catalog references (`minecraft:*`, `chisel:*`). A catalog regeneration (`npm run catalog`) that drops a block turns that cell magenta. `Structure/UnknownBlockWarning` is magenta on purpose (`stonebrik` typo).
- The bundle is ~6.6 MB because the texture atlas and catalog are inlined as data.
- `dtsPropsFor.ArchShape` spells out the 105-entry `ShapeKey` union by hand (generated from `src/components.tsx`); regenerate it when `scripts/build-architecture.mjs` changes the shape table.
- `src/generated/architecture.json` comes from `node scripts/build-architecture.mjs` (reads ~/fun/ArchitectureCraft at tag 1.12.17, or the dev jar in the Gradle cache).

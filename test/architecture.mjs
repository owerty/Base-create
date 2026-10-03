// ArchitectureCraft geometry: every shape draws inside its block (bar the
// shapes the mod lets overhang), rotations keep the geometry, orientation
// follows the documented convention, and roofs/windows react to neighbours.
import { Structure } from "../library/src/core/schematic.js";
import { shapeTile, readShapeTile, SHAPE_BLOCK } from "../library/src/core/architecture-nbt.js";
import { SHAPES, shapeById, shapeByKey, shapeTriangles, orientShape, shapeBounds } from "../library/src/core/architecture.js";

let fail = 0;
const check = (label, cond) => { console.log(`${cond ? "OK  " : "FAIL"} ${label}`); if (!cond) fail++; };

const id = key => shapeByKey(key).id;
const te = (key, extra = {}) => ({ shape: id(key), side: 0, turn: 0, offsetX: 0, secondary: false, ...extra });
const ys = tris => tris.flatMap(t => t.p);

// Shapes whose models reach outside the block in the mod itself (overhangs,
// cornices and gables hang below or past it; banisters and newels rise into
// the block above; a few models are 1/256 oversize).
const OVERHANG = new Set([
  "PillarBase", "DoricCapital", "IonicCapital", "CorinthianCapital", "ArchitraveCorner",
  "RoofOverhangGableLH", "RoofOverhangGableRH", "RoofOverhangRidge", "RoofOverhangValley",
  "CorniceLH", "CorniceRH", "CorniceRidge",
  "BanisterPlainBottom", "BanisterPlain", "BanisterPlainTop", "BanisterPlainEnd",
  "BanisterFancyBottom", "BanisterFancy", "BanisterFancyTop", "BanisterFancyEnd",
  "BalustradeFancyCorner", "BalustradeFancyWithNewel", "BalustradeFancyNewel", "BanisterFancyNewelTall",
  "BalustradePlainOuterCorner", "BanisterPlainInnerCorner",
]);

// Table.
{
  check("shapes: 106 entries, ids unique", SHAPES.length === 106 && new Set(SHAPES.map(s => s.id)).size === 106);
  check("shapes: lookup by key and enum name", shapeByKey("roofTile").id === 0 && shapeByKey("RoofSmartRidge").id === 4 && shapeById(91).name === "Stairs");
  check("shapes: glow page is the SE shapes", SHAPES.filter(s => s.glow).length === 12 && shapeByKey("slabSE").glow);
  check("shapes: sawbench counts", shapeByKey("roofTile").materialUsed === 1 && shapeByKey("roofTile").itemsProduced === 2 && shapeByKey("stairs").materialUsed === 3);
  check("shapes: windows take glass, roofs cladding", shapeByKey("windowFrame").secondary === "glass" && shapeByKey("roofTile").secondary === "cladding" && shapeByKey("cylinder").secondary === null);
  check("shapes: cladding sheet is not placeable", shapeByKey("claddingSheet").placeable === false);
}

// Every shape, every orientation.
{
  const empty = [], outside = [], counts = [];
  for (const s of SHAPES) {
    const base = shapeTriangles({ shape: s.id, side: 0, turn: 0, secondary: true });
    if (!base.length) empty.push(s.name);
    for (let side = 0; side < 6; side++) for (let turn = 0; turn < 4; turn++) {
      const tris = shapeTriangles({ shape: s.id, side, turn, secondary: true });
      if (tris.length !== base.length) counts.push(`${s.name} ${side}/${turn}`);
      if (!OVERHANG.has(s.name) && ys(tris).some(p => p.some(c => c < -1e-6 || c > 1 + 1e-6))) outside.push(`${s.name} ${side}/${turn}`);
    }
  }
  check(`geometry: every shape draws something${empty.length ? " (" + empty + ")" : ""}`, !empty.length);
  check(`geometry: inside the block except known overhangs${outside.length ? " (" + outside.slice(0, 5) + ")" : ""}`, !outside.length);
  check(`geometry: rotations keep the triangle count${counts.length ? " (" + counts.slice(0, 5) + ")" : ""}`, !counts.length);
  const uvs = SHAPES.flatMap(s => shapeTriangles({ shape: s.id, side: 0, turn: 0, secondary: true })).flatMap(t => t.uv);
  check("geometry: texture coordinates within the tile (1/256 slack)", uvs.every(q => q.every(c => c > -0.005 && c < 1.005)));
}

// Orientation convention: side 0 turn 0 Roof Tile rises toward the south.
{
  const pts = ys(shapeTriangles(te("roofTile")));
  check("roof tile: high edge (y = 1) on the south side (z = 1)", pts.filter(p => p[1] > 0.999).every(p => p[2] > 0.999));
  check("roof tile: low edge (y = 0, z = 0) present", pts.some(p => p[1] < 1e-6 && p[2] < 1e-6));
  const rises = facing => { const o = orientShape("roofTile", facing); const top = ys(shapeTriangles(te("roofTile", o))).filter(p => p[1] > 0.999); return top; };
  check("orient: roof tile facing north rises north", rises("north").every(p => p[2] < 1e-6));
  check("orient: roof tile facing east rises east", rises("east").every(p => p[0] > 0.999));
  check("orient: roof tile facing west rises west", rises("west").every(p => p[0] < 1e-6));
  check("orient: turns are 0 south, 1 east, 2 north, 3 west", ["south", "east", "north", "west"].every((f, i) => orientShape("roofTile", f).turn === i));
  // Upside down: the slope's high side hangs at the top, back toward facing.
  const o = orientShape("roofTile", "north", true);
  const hung = ys(shapeTriangles(te("roofTile", o)));
  check("orient: upside-down roof tile has its full face on top and back to the north", o.side === 1 && hung.filter(p => p[1] < 1e-6).every(p => p[2] < 1e-6));
  // Outer corner: peak in the corner between facing and clockwise.
  const peak = facing => ys(shapeTriangles(te("roofOuterCorner", orientShape("roofOuterCorner", facing)))).filter(p => p[1] > 0.999);
  check("orient: outer corner facing north peaks in the north-east corner", peak("north").every(p => p[0] > 0.999 && p[2] < 1e-6));
  check("orient: outer corner facing west peaks in the north-west corner", peak("west").every(p => p[0] < 1e-6 && p[2] < 1e-6));
  check("orient: four-way shapes ignore facing", orientShape("cylinder", "east").turn === 0);
  check("orient: windows never go upside down", orientShape("windowFrame", "north", true).side === 0);
  check("orient: arches open downward at side 0", orientShape("archD1", "north").side === 0);
}

// Neighbours.
{
  const alone = shapeTriangles(te("roofSmartRidge"));
  const at = (dx, dy, dz, n) => (x, y, z) => (x === dx && y === dy && z === dz ? n : null);
  const joined = shapeTriangles(te("roofSmartRidge"), at(1, 0, 0, te("roofSmartRidge")));
  check("smart ridge: alone is a pyramid (4 hips + base)", alone.length === 6);
  check("smart ridge: a ridge to the east replaces the east hip with a ridge join", joined.length === 7 && JSON.stringify(joined) !== JSON.stringify(alone));
  const cut = shapeTriangles(te("roofSmartRidge", { disconnected: 1 << 5 }), at(1, 0, 0, te("roofSmartRidge")));
  check("smart ridge: a chiselled connection is ignored", cut.length === alone.length);
  check("smart ridge: a solid block is not a ridge", shapeTriangles(te("roofSmartRidge"), at(1, 0, 0, { solid: true })).length === 6);

  const win = te("windowFrame", { secondary: true });
  const single = shapeTriangles(win);
  const pair = shapeTriangles(win, at(1, 0, 0, win));
  check("window: glass drawn as the second material", single.some(t => t.tex === 2) && shapeTriangles(te("windowFrame")).every(t => t.tex === 0));
  // The east frame bar runs the full height at x > 7/8; a joined neighbour removes it.
  const eastBar = tris => tris.some(t => t.p.every(q => q[0] > 0.85) && t.p.some(q => q[1] < 0.3) && t.p.some(q => q[1] > 0.7));
  check("window: a window beside it drops the frame on that side", eastBar(single) && !eastBar(pair));
  const valley = shapeTriangles(te("roofTile"), at(0, 0, 1, te("roofValley")));
  check("roof tile: a valley behind it reshapes the slope", valley.length !== shapeTriangles(te("roofTile")).length);
  const clad = shapeTriangles(te("roofTile", { secondary: true }));
  check("roof tile: cladding covers the slope only", clad.some(t => t.tex === 2) && clad.some(t => t.tex === 0));
}

// Banister offset moves the model sideways.
{
  const b = shapeBounds(te("banisterPlain", { offsetX: 6 / 16 }));
  check("banister: offsetX 6/16 shifts it to the east side", Math.abs((b[0] + b[3]) / 2 - (0.5 + 6 / 16)) < 1e-6);
}

// Shapes save as the tile entity TileShape writes, and read back.
{
  const st = new Structure(2, 1, 1);
  st.setTile(0, 0, 0, { name: SHAPE_BLOCK, meta: 0 }, shapeTile({
    shape: 30, side: 0, turn: 1, base: { name: "minecraft:planks", meta: 0 }, secondary: { name: "minecraft:glass_pane", meta: 0 },
  }));
  st.setTile(1, 0, 0, { name: SHAPE_BLOCK, meta: 0 }, shapeTile({ shape: 71, turn: 3, offsetX: -6 / 16, disconnected: 4, base: { name: "minecraft:planks", meta: 2 } }));
  const back = Structure.fromNBT(st.toNBT());
  const a = readShapeTile(back.getTile(0, 0, 0)), b = readShapeTile(back.getTile(1, 0, 0));
  check("save: window keeps shape, turn and glass", a.shape === 30 && a.turn === 1 && a.side === 0 && a.secondary?.name === "minecraft:glass_pane");
  check("save: banister keeps its negative offset and cut connection", b.offsetX === -6 / 16 && b.disconnected === 4 && b.base.meta === 2);
  check("save: zero side/turn are left out like TileShape does", !("side" in st.getTile(0, 0, 0)) && st.getTile(0, 0, 0).turn.value === 1);
}

console.log(fail ? `\n${fail} failed` : "\nall passed");
process.exit(fail ? 1 : 0);

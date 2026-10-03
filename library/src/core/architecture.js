// ArchitectureCraft shapes (GTNH 2.9: ArchitectureCraft 1.12.17): the shape
// table and the geometry the mod draws for each placed shape, ported from
// RenderRoof, RenderWindow, ObjJsonModel and RenderTargetBase so the viewer
// shows what the game shows. The .objson models and the table come from
// scripts/build-architecture.mjs (src/generated/architecture.json).
//
// A placed shape is one block (ArchitectureCraft:shape, or :shapeSE for the
// glow page) whose tile entity "gcewing.shape" saves Shape (id), BaseName /
// BaseData (material), side, turn, offsetX (sixteenths, banisters), Name2 /
// Data2 (second material: glass pane for windows, cladding for roofs and
// models with a cladding face) and Disconnected (connections the chisel cut).
//
// Orientation: the mod rotates each shape about the block centre by
// sideTurn(side, turn) = sideRotation[side] * rotY(90 * turn), with
//   side 0 = upright, 1 = upside down (rotX 180), 2..5 = lying on N/S/W/E;
//   rotY(90) takes local +z (south) to +x (east).
// Every shape is modelled with its back (the high, wall-side part) toward
// local +z, and corner shapes with their corner at local (-x, +z). So at
// side 0, turn 0 a Roof Tile rises toward the south (low edge on the north
// side, high edge on the south), and each turn swings that 90 degrees
// clockwise seen from above:
//   side 0: turn 0 rises south, 1 east, 2 north, 3 west;
//   side 1: turn 0 back faces north, 1 east, 2 south, 3 west.
//
// orientShape(shape, facing, upsideDown) maps the user-facing direction to
// side and turn, matching <Stairs>:
//   - roofs, slopes, stairs, banisters, cornices, overhangs, arches, capitals
//     and other two-sided shapes: `facing` is the side the back is on, which
//     for roof tiles, slopes, stairs and banisters is uphill (the way you walk
//     to go up); for cornices and overhangs the wall they hang from; for
//     balustrades the edge the rail runs along; for arches the pier side;
//   - corner shapes (unilateral: roof/stairs/bevelled corners, quarter
//     cylinders and spheres, corner balustrades, newels...): the shape sits in
//     the corner between `facing` and the next direction clockwise seen from
//     above, so facing north = the north-east corner, east = south-east,
//     south = south-west, west = north-west. For an outer roof corner that is
//     the corner its peak is in; for an inner corner, the corner its two high
//     edges meet in;
//   - windows: the glass lies across `facing` (a window facing north is a
//     pane in the east-west plane);
//   - round, square and other four-way shapes ignore `facing`.
// `upsideDown` turns the shape over (side 1) where the mod allows it (not
// windows). Arches open downward at side 0 like everything else; their
// placeUnderneath flag only means the player clicks the underside of the
// block above to place them that way (clicking a top face gives side 1).
//
// Directions in `disconnected` and neighbour lookups use the 1.7.10
// EnumFacing ordinals: 0 down, 1 up, 2 north (-z), 3 south (+z), 4 west (-x,
// which 1.7.10 calls EAST), 5 east (+x, called WEST).
import data from "../generated/architecture.json" with { type: "json" };

export const SHAPE_BLOCK = "ArchitectureCraft:shape";
export const SHAPE_BLOCK_GLOW = "ArchitectureCraft:shapeSE";
export const SHAPE_TILE_ENTITY = "gcewing.shape";

const lowerFirst = s => s[0].toLowerCase() + s.slice(1);

// Models with a face in texture slot 2 or 3 take a second material (cladding).
const takesCladding = name => !!name && data.models[name].faces.some(f => f.t >= 2);

/** One entry per ArchitectureCraft Shape enum value. */
export const SHAPES = data.shapes.map(s => {
  const kind = s.name === "CladdingSheet" ? "cladding" : s.kind;
  return Object.freeze({
    id: s.id,
    name: s.name,
    key: lowerFirst(s.name),
    title: s.title,
    kind,
    model: s.model,
    window: s.window, // "plain" | "corner" | "mullion" for windows
    symmetry: s.symmetry,
    flags: { placeUnderneath: s.flag === "placeUnderneath", placeOffset: s.flag === "placeOffset" },
    glow: s.name.endsWith("SE"),
    occlusionMask: s.occlusionMask,
    materialUsed: s.materialUsed,
    itemsProduced: s.itemsProduced,
    // What a second material does: glass pane in a window, or cladding over a
    // roof's slope / a model's cladding faces.
    secondary: kind === "window" ? "glass" : kind === "roof" || takesCladding(s.model) ? "cladding" : null,
    // The sawbench turns the Cladding sheet into a cladding item, not a block.
    placeable: kind !== "cladding",
    // Banisters sit 6/16 off centre, toward whichever side of the stair you click.
    placementOffset: s.flag === "placeOffset" ? 6 / 16 : 0,
  });
});

const BY_ID = new Map(SHAPES.map(s => [s.id, s]));
const BY_KEY = new Map(SHAPES.map(s => [s.key, s]));
for (const s of SHAPES) BY_KEY.set(s.name, s);

export const shapeById = id => BY_ID.get(id);
/** By key ("roofTile") or enum name ("RoofTile"). */
export const shapeByKey = key => BY_KEY.get(key);

/** Short notes on what `facing` means, per kind of shape (for docs). */
export const SHAPE_FACING_NOTES = {
  bilateral: "facing = the side the back is on: uphill for roof tiles, slopes, stairs and banisters; the wall for cornices and overhangs; the edge the rail runs along for balustrades; the pier side for arches",
  unilateral: "the shape sits in the corner between facing and the next direction clockwise (north = north-east corner, east = south-east, south = south-west, west = north-west)",
  quadrilateral: "facing is ignored",
  none: "facing is ignored",
  window: "the glass lies across facing (facing north = a pane in the east-west plane)",
};

// ---------------------------------------------------------------- maths
// Matrix3 / Trans3 as in the mod: rows of a 3x3, rot(deg, i, j).

function rot(deg, i, j) {
  const a = (deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
  const r = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  r[i][i] = c; r[i][j] = -s; r[j][i] = s; r[j][j] = c;
  return r;
}
const rotX = d => rot(d, 1, 2), rotY = d => rot(d, 2, 0), rotZ = d => rot(d, 0, 1);
function mul(m, n) {
  const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i][j] = m[i][0] * n[0][j] + m[i][1] * n[1][j] + m[i][2] * n[2][j];
  // Snap the 1e-17 noise sin/cos leave, so directions compare exactly.
  for (const row of r) for (let j = 0; j < 3; j++) if (Math.abs(row[j]) < 1e-12) row[j] = 0; else if (Math.abs(Math.abs(row[j]) - 1) < 1e-12) row[j] = Math.sign(row[j]);
  return r;
}
const mv = (m, [x, y, z]) => [x * m[0][0] + y * m[0][1] + z * m[0][2], x * m[1][0] + y * m[1][1] + z * m[1][2], x * m[2][0] + y * m[2][1] + z * m[2][2]];
const imv = (m, [x, y, z]) => [x * m[0][0] + y * m[1][0] + z * m[2][0], x * m[0][1] + y * m[1][1] + z * m[2][1], x * m[0][2] + y * m[1][2] + z * m[2][2]];
const IDENT = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const SIDE_ROT = [IDENT, rotX(180), rotX(90), mul(rotX(-90), rotY(180)), mul(rotZ(-90), rotY(90)), mul(rotZ(90), rotY(-90))];
const TURN_ROT = [0, 90, 180, 270].map(rotY);
const SIDE_TURN = SIDE_ROT.map(s => TURN_ROT.map(t => mul(s, t)));

class Trans {
  constructor(o, m) { this.o = o; this.m = m; }
  p(v) { const r = mv(this.m, v); return [this.o[0] + r[0], this.o[1] + r[1], this.o[2] + r[2]]; }
  v(v) { return mv(this.m, v); }
  iv(v) { return imv(this.m, v); }
  rotate(m) { return new Trans(this.o, mul(this.m, m)); }
  t(other) { const r = mv(this.m, other.o); return new Trans([this.o[0] + r[0], this.o[1] + r[1], this.o[2] + r[2]], mul(this.m, other.m)); }
  translate(x, y, z) { return new Trans(this.p([x, y, z]), this.m); }
}

// 1.7.10 EnumFacing.
const DIR = [[0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]];
const D = { DOWN: 0, UP: 1, NORTH: 2, SOUTH: 3, WEST: 4, EAST: 5 };
// Vector3.facing: 45-degree normals lean to up/down.
function facingOf([dx, dy, dz]) {
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  if (ay >= ax && ay >= az) return dy < 0 ? D.DOWN : D.UP;
  if (ax >= az) return dx > 0 ? D.EAST : D.WEST;
  return dz < 0 ? D.NORTH : D.SOUTH;
}
const opposite = f => f ^ 1;

function localRotation(te) {
  return SIDE_TURN[te.side & 7]?.[te.turn & 3] ?? IDENT;
}

/** The mod's TileShape.localToGlobalTransformation, about the block centre, in 0..1 block space. */
function transformFor(te) {
  return new Trans([0.5, 0.5, 0.5], localRotation(te)).translate(te.offsetX ?? 0, 0, 0);
}

// ---------------------------------------------------------------- neighbours
// A placed shape plus where it is relative to the shape being drawn, so
// window code can ask a neighbour about its own neighbours.

class Placed {
  constructor(te, at, look) { this.te = te; this.at = at; this.look = look; this.shape = shapeById(te.shape); this.rot = localRotation(te); }
  connectionEnabled(dir) { return ((this.te.disconnected ?? 0) & (1 << dir)) === 0; }
  neighbour(dir) {
    const d = DIR[dir];
    const n = this.look(this.at[0] + d[0], this.at[1] + d[1], this.at[2] + d[2]);
    return n && !n.solid && n.shape !== undefined && shapeById(n.shape) ? new Placed(n, [this.at[0] + d[0], this.at[1] + d[1], this.at[2] + d[2]], this.look) : null;
  }
  /** TileShape.getConnectedNeighbourGlobal. */
  connected(dir) {
    if (!this.connectionEnabled(dir)) return null;
    const n = this.neighbour(dir);
    return n && n.connectionEnabled(opposite(dir)) ? n : null;
  }
  localFace(globalDir) { return facingOf(imv(this.rot, DIR[globalDir])); }
  globalFace(localDir) { return facingOf(mv(this.rot, DIR[localDir])); }
}

// ---------------------------------------------------------------- output

const EPS = 1e-9;
function cross(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
}
const unit = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const round = v => Math.round(v * 1e6) / 1e6;

// RenderTargetBase.addProjectedVertex: texture coordinates from the vertex's
// position in the block, seen from the face its normal points to. (Hodgepodge's
// optional bottom-face mirror fix is off here, as in the rest of the viewer.)
function projectedUV(p, n) {
  const [x, y, z] = p;
  switch (facingOf(n)) {
    case D.UP: case D.DOWN: return [x, z];
    case D.NORTH: return [1 - x, 1 - y];
    case D.SOUTH: return [x, 1 - y];
    case D.WEST: return [z, 1 - y];
    default: return [1 - z, 1 - y];
  }
}

// Projected coordinates of parts outside the block run past the tile; shift a
// triangle back by whole tiles when it fits inside one.
function wrapUV(uv) {
  for (const k of [0, 1]) {
    const lo = Math.min(uv[0][k], uv[1][k], uv[2][k]), hi = Math.max(uv[0][k], uv[1][k], uv[2][k]);
    if (lo >= -EPS && hi <= 1 + EPS) continue;
    const shift = Math.floor(lo + 1e-6);
    if (hi - shift <= 1 + 1e-6) for (const c of uv) c[k] -= shift;
  }
  return uv;
}

class Out {
  constructor() { this.tris = []; }
  // verts: [{ p, n, uv, projected }], tex 0 | 2
  tri(a, b, c, tex) {
    const g = cross(a.p, b.p, c.p);
    if (Math.hypot(g[0], g[1], g[2]) < EPS) return; // the mod draws a few zero-area triangles
    const uv = wrapUV([a, b, c].map(v => (v.projected ? projectedUV(v.p, v.n) : [v.uv[0], v.uv[1]])));
    const n = unit([a.n[0] + b.n[0] + c.n[0], a.n[1] + b.n[1] + c.n[1], a.n[2] + b.n[2] + c.n[2]]);
    this.tris.push({ p: [a.p, b.p, c.p].map(q => q.map(round)), uv: uv.map(q => q.map(round)), tex, n: n.map(round) });
  }
}

// ObjJsonModel.render. slots: per texture slot, null (skipped) or { tex, projected }.
function renderModel(out, name, t, slots) {
  const model = data.models[name];
  if (!model) return;
  for (const f of model.faces) {
    const slot = slots[Math.min(f.t, slots.length - 1)];
    if (!slot) continue;
    const verts = f.v.map(c => ({ p: t.p([c[0], c[1], c[2]]), n: t.v([c[3], c[4], c[5]]), uv: [c[6], c[7]], projected: slot.projected }));
    for (let i = 0; i < f.i.length; i += 3) out.tri(verts[f.i[i]], verts[f.i[i + 1]], verts[f.i[i + 2]], slot.tex);
  }
}

// ShapeRenderDispatch.renderShapeTE: textures[0..3] = base, base projected,
// secondary, secondary projected; most kinds fall back to the base when there
// is no second material, windows draw nothing there (no glass).
function textureSlots(shape, te) {
  const base = { tex: 0, projected: false }, baseP = { tex: 0, projected: true };
  let sec = null, secP = null;
  if (te.secondary) { sec = { tex: 2, projected: false }; secP = { tex: 2, projected: true }; }
  else if (shape.kind !== "window") { sec = base; secP = baseP; }
  return [base, baseP, sec, secP];
}

// ---------------------------------------------------------------- roofs (RenderRoof)

const RIDGE = ["RoofRidge", "RoofSmartRidge"];
const RIDGE_OR_SLOPE = ["RoofRidge", "RoofSmartRidge", "RoofTile", "RoofOuterCorner", "RoofInnerCorner"];
const VALLEY = ["RoofValley", "RoofSmartValley"];
const VALLEY_OR_SLOPE = ["RoofValley", "RoofSmartValley", "RoofTile", "RoofInnerCorner"];

const S2 = 0.707;
const N_PXPY = [S2, S2, 0], N_NXPY = [-S2, S2, 0], N_PYPZ = [0, S2, S2], N_PYNZ = [0, S2, -S2];

function renderRoof(out, self, t, te) {
  const secondary = !!te.secondary;
  let normal = null, outer = false, poly = [];
  const begin = (n, isOuter) => { normal = t.v(n); outer = isOuter; };
  const outerFace = n => begin(n, true), innerFace = n => begin(n, false);
  const v = (x, y, z, u, vv) => poly.push({ p: t.p([x - 0.5, y - 0.5, z - 0.5]), n: normal, uv: [u, vv], projected: outer });
  const end = () => {
    // Outer faces: base, projected (textures[1]); inner faces (the slope): textures[2].
    const tex = outer ? 0 : secondary ? 2 : 0;
    if (poly.length === 3) out.tri(poly[0], poly[1], poly[2], tex);
    else if (poly.length === 4) { out.tri(poly[0], poly[1], poly[2], tex); out.tri(poly[0], poly[2], poly[3], tex); }
    poly = [];
  };
  const tri = (...vs) => { for (const a of vs) v(...a); end(); };

  const has = (dx, dy, dz, names) => {
    const dir = facingOf(t.v([dx, dy, dz]));
    const n = self.connected(dir);
    return !!n && names.includes(n.shape.name);
  };
  const ridgeAt = (x, y, z) => has(x, y, z, RIDGE), ridgeOrSlopeAt = (x, y, z) => has(x, y, z, RIDGE_OR_SLOPE);
  const valleyAt = (x, y, z) => has(x, y, z, VALLEY), valleyOrSlopeAt = (x, y, z) => has(x, y, z, VALLEY_OR_SLOPE);

  const posX = () => outerFace([1, 0, 0]), negX = () => outerFace([-1, 0, 0]);
  const posZ = () => outerFace([0, 0, 1]), negZ = () => outerFace([0, 0, -1]), bottom = () => outerFace([0, -1, 0]);
  const posXSlope = () => innerFace(N_PXPY), negXSlope = () => innerFace(N_NXPY);
  const posZSlope = () => innerFace(N_PYPZ), negZSlope = () => innerFace(N_PYNZ);

  const leftQuad = () => { posX(); tri([1, 1, 1, 0, 0], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1], [1, 1, 0, 1, 0]); };
  const rightQuad = () => { negX(); tri([0, 1, 0, 0, 0], [0, 0, 0, 0, 1], [0, 0, 1, 1, 1], [0, 1, 1, 1, 0]); };
  const frontQuad = () => { negZ(); tri([1, 1, 0, 0, 0], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1], [0, 1, 0, 1, 0]); };
  const backQuad = () => { posZ(); tri([0, 1, 1, 0, 0], [0, 0, 1, 0, 1], [1, 0, 1, 1, 1], [1, 1, 1, 1, 0]); };
  const bottomQuad = () => { bottom(); tri([0, 0, 1, 0, 0], [0, 0, 0, 0, 1], [1, 0, 0, 1, 1], [1, 0, 1, 1, 0]); };
  const leftTriangle = () => { posX(); tri([1, 1, 1, 0, 0], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]); };
  const rightTriangle = () => { negX(); tri([0, 1, 1, 1, 0], [0, 0, 0, 0, 1], [0, 0, 1, 1, 1]); };
  const ridgeLeftFace = () => { posX(); tri([1, 0.5, 0.5, 0.5, 0.5], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]); };
  const ridgeRightFace = () => { negX(); tri([0, 0.5, 0.5, 0.5, 0.5], [0, 0, 0, 0, 1], [0, 0, 1, 1, 1]); };
  const ridgeBackSlope = () => { posZSlope(); tri([0, 0.5, 0.5, 0, 0.5], [0, 0, 1, 0, 1], [1, 0, 1, 1, 1], [1, 0.5, 0.5, 1, 0.5]); };

  const connectRidgeLeft = () => {
    negZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0.5, 0.5, 0, 0.5], [1, 0, 0, 0, 1]);
    posZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0, 1, 1, 1], [1, 0.5, 0.5, 1, 0.5]);
  };
  const connectRidgeRight = () => {
    negZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0, 0, 1, 1], [0, 0.5, 0.5, 1, 0.5]);
    posZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0.5, 0.5, 0, 0.5], [0, 0, 1, 0, 1]);
  };
  const connectRidgeFront = () => {
    posXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0, 0, 1, 1], [0.5, 0.5, 0, 1, 0.5]);
    negXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0, 0, 0.5], [0, 0, 0, 0, 1]);
  };
  const connectRidgeBack = () => {
    posXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 1, 0, 0.5], [1, 0, 1, 0, 1]);
    negXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0, 1, 1, 1], [0.5, 0.5, 1, 1, 0.5]);
  };
  const ridgeLeft = () => {
    if (ridgeOrSlopeAt(1, 0, 0)) connectRidgeLeft();
    else { posXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]); }
  };
  const ridgeRight = () => {
    if (ridgeOrSlopeAt(-1, 0, 0)) connectRidgeRight();
    else { negXSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0, 0, 0, 1], [0, 0, 1, 1, 1]); }
  };
  const ridgeFront = fill => {
    if (ridgeOrSlopeAt(0, 0, -1)) connectRidgeFront();
    else if (fill) { negZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1]); }
  };
  const ridgeBack = fill => {
    if (ridgeOrSlopeAt(0, 0, 1)) connectRidgeBack();
    else if (fill) { posZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0, 1, 0, 1], [1, 0, 1, 1, 1]); }
  };

  const valleyEndLeft = () => {
    posX();
    tri([1, 1, 1, 0, 0], [1, 0, 1, 0, 1], [1, 0.5, 0.5, 0.5, 0.5]);
    tri([1, 0, 1, 0, 1], [1, 0, 0, 1, 1], [1, 0.5, 0.5, 0.5, 0.5]);
    tri([1, 0, 0, 1, 1], [1, 1, 0, 1, 0], [1, 0.5, 0.5, 0.5, 0.5]);
  };
  const valleyEndRight = () => {
    negX();
    tri([0, 0, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0.5, 0.5, 0.5, 0.5]);
    tri([0, 0, 0, 0, 1], [0, 0, 1, 1, 1], [0, 0.5, 0.5, 0.5, 0.5]);
    tri([0, 1, 0, 0, 0], [0, 0, 0, 0, 1], [0, 0.5, 0.5, 0.5, 0.5]);
  };
  const valleyEndFront = () => {
    negZ();
    tri([1, 1, 0, 0, 0], [1, 0, 0, 0, 1], [0.5, 0.5, 0, 0.5, 0.5]);
    tri([1, 0, 0, 0, 1], [1, 0, 0, 1, 1], [0.5, 0.5, 0, 0.5, 0.5]); // zero-area in the mod too
    tri([0, 0, 0, 1, 1], [0, 1, 0, 1, 0], [0.5, 0.5, 0, 0.5, 0.5]);
  };
  const valleyEndBack = () => {
    posZ();
    tri([0, 1, 1, 0, 0], [0, 0, 1, 0, 1], [0.5, 0.5, 1, 0.5, 0.5]);
    tri([0, 0, 1, 0, 1], [1, 0, 1, 1, 1], [0.5, 0.5, 1, 0.5, 0.5]);
    tri([1, 0, 1, 1, 1], [1, 1, 1, 1, 0], [0.5, 0.5, 1, 0.5, 0.5]);
  };
  const connectValleyLeft = () => {
    posZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 0.5, 0.5, 1, 0.5], [1, 1, 0, 1, 0]);
    negZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [1, 1, 1, 0, 0], [1, 0.5, 0.5, 0, 0.5]);
    valleyEndLeft();
  };
  const connectValleyRight = () => {
    posZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 1, 0, 0, 0], [0, 0.5, 0.5, 0, 0.5]);
    negZSlope(); tri([0.5, 0.5, 0.5, 0.5, 0.5], [0, 0.5, 0.5, 1, 0.5], [0, 1, 1, 1, 0]);
    valleyEndRight();
  };
  const connectValleyFront = () => {
    posXSlope(); tri([0, 1, 0, 1, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0, 1, 0.5]);
    negXSlope(); tri([1, 1, 0, 0, 0], [0.5, 0.5, 0, 0, 0.5], [0.5, 0.5, 0.5, 0.5, 0.5]);
    valleyEndFront();
  };
  const connectValleyBack = () => {
    posXSlope(); tri([0, 1, 1, 0, 0], [0.5, 0.5, 1, 0, 0.5], [0.5, 0.5, 0.5, 0.5, 0.5]);
    negXSlope(); tri([1, 1, 1, 1, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 1, 1, 0.5]);
    valleyEndBack();
  };
  const terminateValleyLeft = () => { negXSlope(); tri([1, 1, 0, 0, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [1, 1, 1, 1, 0]); leftQuad(); };
  const terminateValleyRight = () => { posXSlope(); tri([0, 1, 1, 0, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [0, 1, 0, 1, 0]); rightQuad(); };
  const terminateValleyFront = () => { posZSlope(); tri([0, 1, 0, 0, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [1, 1, 0, 1, 0]); frontQuad(); };
  const terminateValleyBack = () => { negZSlope(); tri([1, 1, 1, 0, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [0, 1, 1, 1, 0]); backQuad(); };
  const smartValleyLeft = () => (valleyOrSlopeAt(1, 0, 0) ? connectValleyLeft() : terminateValleyLeft());
  const smartValleyRight = () => (valleyOrSlopeAt(-1, 0, 0) ? connectValleyRight() : terminateValleyRight());
  const smartValleyFront = () => (valleyOrSlopeAt(0, 0, -1) ? connectValleyFront() : terminateValleyFront());
  const smartValleyBack = () => (valleyOrSlopeAt(0, 0, 1) ? connectValleyBack() : terminateValleyBack());

  // Variable slopes (Slope A/B/C): a slope from height `start` at z = 1 to `end` at z = 0.
  const variableSlope = (start, end_) => {
    const dy = end_ - start, inv = 1 / Math.sqrt(1 + dy * dy);
    innerFace([0, inv, inv * dy]);
    tri([1, start, 1, 0, 0], [1, end_, 0, 0, 1], [0, end_, 0, 1, 1], [0, start, 1, 1, 0]);
  };
  const variableTriangleLeft = (o, h) => { posX(); tri([1, o + h, 1, 0, 0], [1, o, 1, 0, 1 - h], [1, o, 0, 1, 1 - h]); };
  const variableTriangleRight = (o, h) => { negX(); tri([0, o + h, 1, 1, 0], [0, o, 0, 0, 1 - h], [0, o, 1, 1, 1 - h]); };
  const variableFaceLeft = (o, h) => { negX(); tri([0, o + h, 0, 0, 1 - h], [0, o, 0, 0, 1], [0, o, 1, 1, 1], [0, o + h, 1, 1, 1 - h]); };
  const variableFaceRight = (o, h) => { posX(); tri([1, o + h, 1, 0, 1 - h], [1, o, 1, 0, 1], [1, o, 0, 1, 1], [1, o + h, 0, 1, 1 - h]); };
  const variableFrontFace = h => { negZ(); tri([1, h, 0, 0, 1 - h], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1], [0, h, 0, 1, 1 - h]); };
  const variableBackFace = h => { posZ(); tri([0, h, 1, 0, 1 - h], [0, 0, 1, 0, 1], [1, 0, 1, 1, 1], [1, h, 1, 1, 1 - h]); };
  // One piece of a long slope: the slope from `start` (z = 1) down to `end_` (z = 0) over walls
  // `sides` high, side triangles `h` high, and a back wall `back` high (1 = full).
  const slopePiece = (start, end_, sides, h, back) => {
    variableSlope(start, end_);
    if (sides > 0) { variableFaceLeft(0, sides); variableFaceRight(0, sides); variableFrontFace(sides); }
    variableTriangleLeft(sides, h);
    variableTriangleRight(sides, h);
    bottomQuad();
    if (back === 1) backQuad(); else variableBackFace(back);
  };

  switch (self.shape.name.replace(/SE$/, "")) {
    case "RoofTile": {
      const valley = valleyAt(0, 0, 1);
      negZSlope();
      if (valley) {
        tri([1, 1, 1, 0, 0], [1, 0, 0, 0, 1], [0.5, 0.5, 0.5, 0.5, 0.5]);
        tri([1, 0, 0, 0, 1], [0, 0, 0, 1, 1], [0.5, 0.5, 0.5, 0.5, 0.5]);
        tri([0, 0, 0, 1, 1], [0, 1, 1, 1, 0], [0.5, 0.5, 0.5, 0.5, 0.5]);
        connectValleyBack();
      } else tri([1, 1, 1, 0, 0], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1], [0, 1, 1, 1, 0]);
      leftTriangle(); rightTriangle(); bottomQuad();
      if (!valley) backQuad();
      if (ridgeAt(0, 0, -1)) connectRidgeFront();
      break;
    }
    case "SlopeTileA1": slopePiece(1, 0.5, 0.5, 0.5, 1); break;
    case "SlopeTileA2": slopePiece(0.5, 0, 0, 0.5, 0.5); break;
    case "SlopeTileB1": slopePiece(1, 0.66666, 0.66666, 0.33333, 1); break;
    case "SlopeTileB2": slopePiece(0.66666, 0.33333, 0.33333, 0.33333, 0.66666); break;
    case "SlopeTileB3": slopePiece(0.33333, 0, 0, 0.33333, 0.33333); break;
    case "SlopeTileC1": slopePiece(1, 0.75, 0.75, 0.25, 1); break;
    case "SlopeTileC2": slopePiece(0.75, 0.5, 0.5, 0.25, 0.75); break;
    case "SlopeTileC3": slopePiece(0.5, 0.25, 0.25, 0.25, 0.5); break;
    case "SlopeTileC4": slopePiece(0.25, 0, 0, 0.25, 0.25); break;
    case "RoofOuterCorner":
      negZSlope(); tri([0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1]);
      posXSlope(); tri([0, 1, 1, 0, 0], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]);
      posZ(); tri([0, 1, 1, 0, 0], [0, 0, 1, 0, 1], [1, 0, 1, 1, 1]);
      rightTriangle(); bottomQuad();
      if (ridgeAt(0, 0, -1)) connectRidgeFront();
      if (ridgeAt(1, 0, 0)) connectRidgeLeft();
      break;
    case "RoofInnerCorner":
      posXSlope(); tri([0, 1, 0, 1, 0], [0.5, 0.5, 0.5, 0.5, 0.5], [1, 0, 0, 1, 1]);
      negZSlope(); tri([1, 1, 1, 0, 0], [1, 0, 0, 0, 1], [0.5, 0.5, 0.5, 0.5, 0.5]);
      negZ(); tri([0, 1, 0, 1, 0], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1]);
      leftTriangle(); bottomQuad();
      if (valleyAt(0, 0, 1)) connectValleyBack(); else terminateValleyBack();
      if (valleyAt(-1, 0, 0)) connectValleyRight(); else terminateValleyRight();
      break;
    case "RoofRidge":
      negZSlope(); tri([1, 0.5, 0.5, 0, 0.5], [1, 0, 0, 0, 1], [0, 0, 0, 1, 1], [0, 0.5, 0.5, 1, 0.5]);
      ridgeBackSlope(); ridgeFront(false); ridgeBack(false);
      ridgeLeftFace(); ridgeRightFace(); bottomQuad();
      break;
    case "RoofSmartRidge":
      ridgeLeft(); ridgeRight(); ridgeBack(true); ridgeFront(true);
      bottomQuad();
      break;
    case "RoofValley":
      connectValleyLeft(); connectValleyRight(); smartValleyFront(); smartValleyBack();
      bottomQuad();
      break;
    case "RoofSmartValley":
      smartValleyLeft(); smartValleyRight(); smartValleyFront(); smartValleyBack();
      bottomQuad();
      break;
  }
}

// ---------------------------------------------------------------- windows (Window*, RenderWindow)

const FRAME = { None: 0, Plain: 1, Corner: 2 };
const WINDOW_KINDS = {
  plain: {
    frameSides: [D.DOWN, D.EAST, D.UP, D.WEST],
    frameKinds: [FRAME.Plain, FRAME.Plain, FRAME.None, FRAME.None, FRAME.Plain, FRAME.Plain],
    frameOrient: [D.EAST, D.EAST, null, null, D.UP, D.UP],
    frameTrans: [IDENT, rotZ(90), rotZ(180), rotZ(270)],
    models: {
      centre: null, centreEnd: null,
      side: Array(4).fill("frame_side"), end0: Array(4).fill("frame_end0"), end1: Array(4).fill("frame_end1"),
      glass: "glass", glassEdge: Array(4).fill("glass_edge"),
    },
  },
  corner: {
    frameSides: [D.DOWN, D.SOUTH, D.UP, D.WEST],
    frameKinds: [FRAME.Corner, FRAME.Corner, FRAME.None, FRAME.Plain, FRAME.Plain, FRAME.None],
    frameOrient: [D.EAST, D.EAST, null, D.UP, D.UP, null],
    frameTrans: [IDENT, mul(rotY(-90), rotZ(90)), mul(rotY(-90), rotZ(180)), rotZ(270)],
    models: {
      centre: "corner_centre", centreEnd: ["corner_centre_end0", null, "corner_centre_end2", null],
      side: ["corner_topbot", "frame_side", "corner_topbot", "frame_side"],
      end0: Array(4).fill("frame_end0"),
      end1: ["corner_topbot_end1", "frame_end1", "corner_topbot_end1", "frame_end1"],
      glass: "corner_glass", glassEdge: ["corner_glass_edge", "glass_edge", "corner_glass_edge", "glass_edge"],
    },
  },
};
WINDOW_KINDS.mullion = {
  ...WINDOW_KINDS.plain,
  models: {
    centre: "mullion_centre", centreEnd: ["mullion_centre_end0", null, "mullion_centre_end2", null],
    side: ["mullion_topbot", "frame_side", "mullion_topbot", "frame_side"],
    end0: Array(4).fill("frame_end0"), end1: Array(4).fill("frame_end1"),
    glass: "glass", glassEdge: ["mullion_glass_edge", "glass_edge", "mullion_glass_edge", "glass_edge"],
  },
};

const axesEqual = (a, b) => (a & 6) === (b & 6);

/** Window.getConnectedWindowGlobal. */
function connectedWindow(p, globalDir) {
  const kind = WINDOW_KINDS[p.shape.window];
  const thisLocal = p.localFace(globalDir);
  const thisFrame = kind.frameKinds[thisLocal];
  if (thisFrame === FRAME.None) return null;
  const thisOrient = kind.frameOrient[thisLocal];
  const n = p.connected(globalDir);
  if (!n || n.shape.kind !== "window") return null;
  const other = WINDOW_KINDS[n.shape.window];
  const otherLocal = n.localFace(opposite(globalDir));
  const otherFrame = other.frameKinds[otherLocal];
  if (otherFrame === FRAME.None || otherFrame !== thisFrame) return null;
  const o1 = p.globalFace(thisOrient), o2 = n.globalFace(other.frameOrient[otherLocal]);
  return (thisFrame === FRAME.Plain ? axesEqual(o1, o2) : o1 === o2) ? n : null;
}

function renderWindow(out, self, t, slots, te) {
  const kind = WINDOW_KINDS[self.shape.window];
  const m = kind.models;
  const model = (tr, name) => name && renderModel(out, "window_" + name, tr, slots);
  // RenderWindow.getFrameFlags.
  const frame = [0, 1, 2, 3].map(() => [false, false, false, false]);
  const gdir = kind.frameSides.map(s => facingOf(t.v(DIR[s])));
  for (let i = 0; i < 4; i++) {
    const n = connectedWindow(self, gdir[i]);
    if (!n) frame[i][1] = true;
    else {
      const j = (i - 1) & 3, k = (i + 1) & 3;
      if (!connectedWindow(n, gdir[j])) frame[j][2] = true;
      if (!connectedWindow(n, gdir[k])) frame[k][0] = true;
      if (n.te.secondary) frame[i][3] = true;
    }
  }
  const glass = !!te.secondary;
  model(t, m.centre);
  for (let i = 0; i < 4; i++) {
    const j = (i - 1) & 3, k = (i + 1) & 3;
    const ts = t.rotate(kind.frameTrans[i]);
    if (frame[i][1]) model(ts, m.side[i]);
    else if (m.centreEnd) model(t, m.centreEnd[i]);
    if ((frame[i][1] && !frame[j][1]) || (frame[i][0] && frame[j][2])) model(ts, m.end0[i]);
    if ((frame[i][1] && !frame[k][1]) || (frame[i][2] && frame[k][0])) model(ts, m.end1[i]);
    if (glass && !frame[i][1] && !frame[i][3]) model(ts, m.glassEdge[i]);
  }
  if (glass) model(t, m.glass);
}

// ---------------------------------------------------------------- entry points

/**
 * Triangles for one placed shape, in block space (0..1, +x east, +y up,
 * +z south), counter-clockwise when seen from the front.
 *
 * te: { shape: id, side, turn, offsetX (blocks), secondary: bool, disconnected }
 * neighbour(dx, dy, dz): a te for a shape at that offset, { solid: true }, or null.
 *
 * Each triangle: { p: [[x,y,z] x3], uv: [[u,v] x3] (0..1 in the material's
 * tile, v down), tex: 0 base material | 2 second material, n: normal }.
 * Shade like the mod: 0.6 nx^2 + 0.8 nz^2 + (ny > 0 ? 1 : 0.5) ny^2.
 *
 * @typedef {{ shape: number, side?: number, turn?: number, offsetX?: number, secondary?: boolean, disconnected?: number }} ShapeTE
 * @typedef {{ p: number[][], uv: number[][], tex: 0 | 2, n: number[] }} ShapeTriangle
 * @param {ShapeTE | { solid?: boolean, shape?: number } | null | undefined} te
 * @param {(dx: number, dy: number, dz: number) => (ShapeTE | { solid: true } | { solid?: boolean, shape?: number } | null | undefined)} [neighbour]
 * @returns {ShapeTriangle[]}
 */
export function shapeTriangles(te, neighbour = () => null) {
  const shape = te && te.shape !== undefined ? shapeById(te.shape) : undefined;
  if (!shape) return [];
  const out = new Out();
  const t = transformFor(te);
  const self = new Placed(te, [0, 0, 0], neighbour);
  const slots = textureSlots(shape, te);
  switch (shape.kind) {
    case "roof": renderRoof(out, self, t, te); break;
    case "window": renderWindow(out, self, t, slots, te); break;
    default: renderModel(out, shape.model, t, slots); break;
  }
  return out.tris;
}

/** Union of the shape's model bounds (or its triangles), in block space. */
export function shapeBounds(te) {
  const shape = shapeById(te.shape);
  if (!shape) return [0, 0, 0, 1, 1, 1];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const tri of shapeTriangles(te)) for (const p of tri.p) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
  return lo[0] === Infinity ? [0, 0, 0, 1, 1, 1] : [...lo, ...hi];
}

const FACING_DIR = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
const CLOCKWISE = { north: "east", east: "south", south: "west", west: "north" };

/**
 * Side and turn for a shape placed with its back toward `facing` (corner
 * shapes: in the corner between facing and the next direction clockwise),
 * optionally hung upside down. See the header for the convention.
 */
export function orientShape(shape, facing = "north", upsideDown = false) {
  if (typeof shape === "number") shape = shapeById(shape);
  else if (typeof shape === "string") shape = shapeByKey(shape);
  if (!shape) throw new Error("unknown shape");
  const side = upsideDown && shape.kind !== "window" ? 1 : 0;
  if (shape.symmetry === "quadrilateral" || shape.symmetry === "none") return { side, turn: 0 };
  const f = FACING_DIR[facing];
  if (!f) throw new Error(`facing "${facing}" must be north, south, east or west`);
  // Local reference: back (+z), or for corners the corner diagonal (-x, +z).
  const unilateral = shape.symmetry === "unilateral";
  const want = unilateral ? [f[0] + FACING_DIR[CLOCKWISE[facing]][0], 0, f[2] + FACING_DIR[CLOCKWISE[facing]][2]] : f;
  const local = unilateral ? [-1, 0, 1] : [0, 0, 1];
  for (let turn = 0; turn < 4; turn++) {
    const g = mv(SIDE_TURN[side][turn], local);
    if (Math.abs(g[0] - want[0]) < 1e-6 && Math.abs(g[2] - want[2]) < 1e-6) return { side, turn };
  }
  throw new Error("no orientation"); // unreachable
}

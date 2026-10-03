// Builds src/generated/architecture.json from ArchitectureCraft (GTNH 1.12.17,
// the pack's version): the shape table, parsed from Shape.java, and every
// .objson model the shapes and window renderer use.
//
//   node scripts/build-architecture.mjs [path to ArchitectureCraft-1.12.17-dev.jar or source checkout]
//
// Without an argument it looks for ~/fun/ArchitectureCraft, then the dev jar in
// the Gradle cache.
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../src/generated/architecture.json");

function findSource() {
  const arg = process.argv[2];
  if (arg) return arg;
  const checkout = join(homedir(), "fun/ArchitectureCraft");
  if (existsSync(join(checkout, "src/main/resources"))) return checkout;
  const cache = join(homedir(), ".gradle/caches/modules-2/files-2.1/com.github.GTNewHorizons/ArchitectureCraft/1.12.17");
  for (const d of existsSync(cache) ? readdirSync(cache) : []) {
    const jar = join(cache, d, "ArchitectureCraft-1.12.17-dev.jar");
    if (existsSync(jar)) return jar;
  }
  throw new Error("ArchitectureCraft 1.12.17 not found; pass a jar or a source checkout");
}

// The model folder and Shape.java of a jar or a checkout.
function openSource(src) {
  if (src.endsWith(".jar")) {
    const dir = mkdtempSync(join(tmpdir(), "ac-"));
    execFileSync("unzip", ["-qo", src, "assets/architecturecraft/models/shape/*", "-d", dir]);
    return {
      models: join(dir, "assets/architecturecraft/models/shape"),
      shapeJava: null, // the dev jar has classes only; fall back to the table below
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  }
  return {
    models: join(src, "src/main/resources/assets/architecturecraft/models/shape"),
    shapeJava: join(src, "src/main/java/gcewing/architecture/common/shape/Shape.java"),
    cleanup: () => {},
  };
}

const r = x => Math.round(x * 1e4) / 1e4;
const rn = x => Math.round(x * 1e3) / 1e3;

// Window parts RenderWindow.init loads as "window_<name>".
const WINDOW_PARTS = [
  "frame_side", "frame_end0", "frame_end1", "glass", "glass_edge",
  "corner_centre", "corner_centre_end0", "corner_centre_end2", "corner_topbot", "corner_topbot_end1",
  "corner_glass", "corner_glass_edge",
  "mullion_centre", "mullion_centre_end0", "mullion_centre_end2", "mullion_topbot", "mullion_glass_edge",
].map(n => "window_" + n);

function compactModel(m) {
  return {
    bounds: m.bounds.map(r),
    boxes: (m.boxes ?? []).map(b => b.map(r)),
    // Each face: texture slot (0 base, 1 base projected, 2 secondary, 3 secondary projected),
    // vertices [x, y, z, nx, ny, nz, u, v] (centred on the block, -0.5..0.5), triangles as index triples.
    faces: m.faces.map(f => ({ t: f.texture, v: f.vertices.map(v => v.map((c, k) => (k >= 3 && k < 6 ? rn(c) : r(c)))), i: f.triangles.flat() })),
  };
}

// Shape enum: Name(id, "Title", Kind, Symmetry, used, made, occlusion[, flags]).
function parseShapes(java) {
  const body = java.slice(java.indexOf("public enum Shape {"), java.indexOf("public int id;"));
  const re = /(\w+)\(\s*(\d+),\s*"([^"]*)",\s*(Roof|Model\(\s*"([\w]+)"(?:,\s*(\w+))?\s*\)|Banister\(\s*"([\w]+)"\s*\)|PlainWindow|CornerWindow|MullionWindow),\s*(\w+),\s*(\d+),\s*(\d+),\s*(0x[0-9a-fA-F]+|\d+)(?:,\s*ShapeFlags\.(\w+))?\s*\)/g;
  const shapes = [];
  for (const m of body.matchAll(re)) {
    const [, name, id, title, kindSrc, model, profile, banister, symmetry, used, made, occ, flag] = m;
    let kind;
    if (kindSrc === "Roof") kind = "roof";
    else if (kindSrc.startsWith("Model")) kind = "model";
    else if (kindSrc.startsWith("Banister")) kind = "banister";
    else kind = "window";
    shapes.push({
      id: +id, name, title, kind,
      model: model ?? banister ?? undefined,
      window: kind === "window" ? kindSrc.replace("Window", "").toLowerCase() : undefined,
      profile: kind === "banister" ? "tbOffset" : profile ?? undefined,
      symmetry: symmetry.toLowerCase(),
      materialUsed: +used, itemsProduced: +made, occlusionMask: Number(occ),
      flag: flag ?? undefined,
    });
  }
  return shapes;
}

const src = findSource();
const s = openSource(src);
try {
  let shapes;
  if (s.shapeJava && existsSync(s.shapeJava)) {
    shapes = parseShapes(readFileSync(s.shapeJava, "utf8"));
  } else {
    // Built from a jar: keep the table from the previous build.
    shapes = JSON.parse(readFileSync(out, "utf8")).shapes;
  }
  if (shapes.length < 100) throw new Error(`parsed only ${shapes.length} shapes`);
  // Only the models something renders.
  const models = {};
  for (const name of [...new Set([...shapes.map(sh => sh.model).filter(Boolean), ...WINDOW_PARTS])].sort()) {
    const file = join(s.models, name + ".objson");
    if (!existsSync(file)) throw new Error(`no model ${name}`);
    models[name] = compactModel(JSON.parse(readFileSync(file, "utf8")));
  }
  writeFileSync(out, JSON.stringify({ source: "ArchitectureCraft 1.12.17 (GTNH)", shapes, models }));
  console.log(`wrote ${out}: ${shapes.length} shapes, ${Object.keys(models).length} models`);
} finally {
  s.cleanup();
}

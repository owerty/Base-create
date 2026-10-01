import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ATLAS } from "./catalog";
import { buildMeshes } from "./mesh";
import type { Grid } from "./model";

let atlasTexture: THREE.Texture | null = null;
let atlasLoaded = false;
const atlasWaiters = new Set<() => void>();
/** The shared block atlas; `onReady` runs once it has loaded (if it hasn't yet). */
function atlas(onReady: () => void) {
  if (!atlasTexture) {
    atlasTexture = new THREE.TextureLoader().load(ATLAS.url, () => {
      atlasLoaded = true;
      atlasWaiters.forEach(f => f());
      atlasWaiters.clear();
    });
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;
    atlasTexture.generateMipmaps = false;
    atlasTexture.flipY = false;
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
  }
  if (!atlasLoaded) atlasWaiters.add(onReady);
  return atlasTexture;
}

// Browsers keep only ~16 WebGL contexts per page and drop the oldest beyond
// that, so a viewer holds a context only while it is on screen, and at most
// MAX_LIVE viewers hold one at a time. A viewer without a context shows a
// still snapshot of its last frame; clicking it (or scrolling back) restores
// the live view.
const MAX_LIVE = 8;
interface Live { release(): void }
const live: Live[] = [];
function claim(v: Live) {
  const i = live.indexOf(v);
  if (i >= 0) live.splice(i, 1);
  live.push(v);
  while (live.length > MAX_LIVE) live.shift()!.release();
}
function drop(v: Live) {
  const i = live.indexOf(v);
  if (i >= 0) live.splice(i, 1);
}

export interface ViewerProps {
  grid: Grid;
  /** Highest layer shown (y), for looking inside. */
  maxY: number;
  height: number;
  background?: string;
  /** Draw the footprint grid and the bounding box. */
  showGrid?: boolean;
}

/** Orbitable 3D view of a grid, rendered with the pack's own textures. */
export function Viewer({ grid, maxY, height, background = "#1d2026", showGrid = false }: ViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<{ group: THREE.Group; invalidate(): void } | null>(null);

  // Scene and camera live for the whole mount; the WebGL renderer comes and goes.
  useEffect(() => {
    const el = host.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    const group = new THREE.Group();
    scene.add(group);

    const [w, h, l] = grid.size;
    const r = Math.max(w, h, l);
    const target = new THREE.Vector3(w / 2, h / 3, l / 2);
    camera.position.set(w / 2 + r * 1.1, h / 2 + r * 0.9, l / 2 + r * 1.3);
    camera.lookAt(target);

    const snap = document.createElement("img");
    snap.draggable = false;
    snap.alt = "";
    Object.assign(snap.style, { display: "none", width: "100%", height: "100%", cursor: "grab" });
    el.appendChild(snap);

    let gl: { renderer: THREE.WebGLRenderer; controls: OrbitControls } | null = null;
    let frame = 0;
    let visible = false;

    const fit = () => {
      const cw = el.clientWidth || 600, ch = el.clientHeight || height;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      gl?.renderer.setSize(cw, ch);
    };
    // Draw on demand: once per change, and on while damping is still settling.
    const draw = () => {
      frame = 0;
      if (!gl) return;
      const moving = gl.controls.update();
      gl.renderer.render(scene, camera);
      if (moving) frame = requestAnimationFrame(draw);
    };
    const requestRender = () => {
      if (gl && !frame) frame = requestAnimationFrame(draw);
    };

    const handle: Live = { release: () => release(true) };
    const acquire = () => {
      if (gl) return claim(handle);
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.display = "block";
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.copy(target);
      controls.addEventListener("change", requestRender);
      controls.addEventListener("start", () => claim(handle));
      el.insertBefore(renderer.domElement, snap);
      snap.style.display = "none";
      gl = { renderer, controls };
      fit();
      claim(handle);
      requestRender();
    };
    const release = (keepSnapshot: boolean) => {
      drop(handle);
      if (!gl) return;
      cancelAnimationFrame(frame);
      frame = 0;
      const { renderer, controls } = gl;
      if (keepSnapshot) {
        renderer.render(scene, camera);
        snap.src = renderer.domElement.toDataURL();
        snap.style.display = "block";
      }
      target.copy(controls.target);
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      gl = null;
    };
    snap.addEventListener("pointerdown", acquire);

    const ro = new ResizeObserver(() => { fit(); requestRender(); });
    ro.observe(el);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") acquire();
    else {
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) acquire();
        else release(true);
      }, { rootMargin: "200px" });
      io.observe(el);
    }

    view.current = {
      group,
      // The build changed: redraw, or drop a now-stale snapshot until the view is live again.
      invalidate: () => {
        if (gl) requestRender();
        else if (visible) acquire();
        else snap.style.display = "none";
      },
    };
    return () => {
      io?.disconnect();
      ro.disconnect();
      release(false);
      snap.remove();
      for (const child of group.children) (child as THREE.Mesh).geometry?.dispose();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geometry, whenever the build or the layer cut changes.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    for (const child of [...v.group.children]) {
      v.group.remove(child);
      const m = child as THREE.Mesh;
      m.geometry?.dispose();
    }
    const { solid, blend, missing } = buildMeshes(grid, maxY);
    const map = atlas(v.invalidate);
    v.group.add(new THREE.Mesh(solid, new THREE.MeshBasicMaterial({ map, vertexColors: true, alphaTest: 0.5 })));
    const glass = new THREE.Mesh(blend, new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false }));
    glass.renderOrder = 1;
    v.group.add(glass);
    v.group.add(new THREE.Mesh(missing, new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: false })));
    // Footprint grid and bounding box, when asked for.
    if (showGrid) {
      const [w, h, l] = grid.size;
      const floor = new THREE.GridHelper(Math.max(w, l), Math.max(w, l), 0x5a6270, 0x353a44);
      floor.position.set(w / 2, 0.001, l / 2);
      floor.scale.set(w / Math.max(w, l), 1, l / Math.max(w, l));
      v.group.add(floor);
      const bounds = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, l)),
        new THREE.LineBasicMaterial({ color: 0x5a6270, transparent: true, opacity: 0.5 }));
      bounds.position.set(w / 2, h / 2, l / 2);
      v.group.add(bounds);
    }
    v.invalidate();
  }, [grid, maxY, showGrid]);

  return <div ref={host} style={{ width: "100%", height, overflow: "hidden", borderRadius: 6 }} />;
}

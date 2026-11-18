import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ORDER, RAD } from '../../engine/board';
import type { Dart } from '../../engine/match';

/** The 3D board and darts. Units are millimetres; the board face is at z = 0, facing +z, y up. */

import type { CameraName, DartDesign } from './options';

export type { CameraName, DartDesign };

export interface BoardScene {
  sync(darts: Dart[], animateNewest: boolean): void;
  setCamera(name: CameraName, instant?: boolean): void;
  setDesign(design: DartDesign): void;
  /** What the dynamic camera frames: a point on the board and how much around it (radius, mm). */
  setFocus(x: number, y: number, r: number, ms?: number): void;
  dispose(): void;
}

const D2R = Math.PI / 180;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface CamSpec {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}
const FIXED: Record<Exclude<CameraName, 'dynamic'>, CamSpec> = {
  straight: { pos: new THREE.Vector3(0, -30, 1240), look: new THREE.Vector3(0, 0, 0), fov: 21.5 },
  angled: { pos: new THREE.Vector3(-640, -170, 1000), look: new THREE.Vector3(18, 0, 0), fov: 23.5 },
  side: { pos: new THREE.Vector3(-1010, -40, 470), look: new THREE.Vector3(40, 0, 30), fov: 25 },
  low: { pos: new THREE.Vector3(60, -720, 960), look: new THREE.Vector3(0, 18, 0), fov: 23.5 },
  high: { pos: new THREE.Vector3(-40, 760, 930), look: new THREE.Vector3(0, -15, 0), fov: 23.5 },
  // From the oche, 2.37 m back, at a thrower's eye height (a little below the bull) and just right of centre.
  oche: { pos: new THREE.Vector3(140, -130, 2370), look: new THREE.Vector3(0, 0, 0), fov: 17 },
};
/** The dynamic camera: frames a circle of radius r around (fx, fy), from a little below and left. */
const DYN_FOV = 17;
const dynamicSpec = (fx: number, fy: number, r: number): CamSpec => {
  if (r >= 240) return FIXED.straight; // the whole board: the straight-on board camera
  const d = Math.max(380, r / Math.tan((DYN_FOV / 2) * (Math.PI / 180)));
  const k = d / 560;
  return {
    pos: new THREE.Vector3(fx * 0.92 - 40 * k, fy * 0.92 - 70 * k, d),
    look: new THREE.Vector3(fx, fy, 20),
    fov: DYN_FOV,
  };
};

export async function createBoardScene(host: HTMLElement): Promise<BoardScene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090c11);
  const pmrem = keep(new THREE.PMREMGenerator(renderer));
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  keep(envRT);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(21.5, 1, 50, 6000);

  // ---- Light ----
  // A warm stage spot from above left (casts the darts' shadows), a cool fill from the right,
  // a soft frontal fill so the blacks hold detail, and a rim light from above and behind that
  // picks out the board's edge against the surround.
  scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a140e, 0.55));
  const key = new THREE.SpotLight(0xfff1dc, 3.2, 0, 0.34, 0.8, 0);
  key.position.set(-380, 620, 1250);
  key.target.position.set(0, -10, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 600;
  key.shadow.camera.far = 2600;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.6;
  key.shadow.radius = 5;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5);
  fill.position.set(700, -150, 900);
  scene.add(fill);
  const front = new THREE.DirectionalLight(0xfff6ea, 0.35);
  front.position.set(0, 120, 1500);
  scene.add(front);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(0, 900, -260);
  scene.add(rim);
  // A soft pool of light on the wall behind the board, so the surround stands out from the dark.
  const wash = new THREE.SpotLight(0xc9d6ff, 1.4, 0, 0.55, 1, 0);
  wash.position.set(0, 300, 900);
  wash.target.position.set(0, 60, -50);
  scene.add(wash, wash.target);

  // ---- Textures ----
  await document.fonts.load('600 26px "Barlow Condensed"').catch(() => undefined);
  const noiseTile = makeNoiseTile(256);
  const bumpTex = keep(new THREE.CanvasTexture(noiseTile));
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(9, 9);
  const foamTex = keep(new THREE.CanvasTexture(noiseTile));
  foamTex.wrapS = foamTex.wrapT = THREE.RepeatWrapping;
  foamTex.repeat.set(5, 5);
  const faceTex = keep(new THREE.CanvasTexture(drawBoardFace(noiseTile)));
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(keep(g), keep(m));

  // ---- Wall, surround, board ----
  const wall = mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 1 }));
  wall.position.z = -48;
  wall.receiveShadow = true;
  scene.add(wall);

  // The surround is a charcoal foam, a clear step lighter than the board's black number ring.
  const surround = mesh(
    new THREE.RingGeometry(226, 335, 160, 1),
    new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.92, bumpMap: foamTex, bumpScale: 1.6 }),
  );
  surround.position.z = -10;
  surround.receiveShadow = true;
  scene.add(surround);
  const surroundEdge = mesh(new THREE.TorusGeometry(335, 7, 16, 200), new THREE.MeshStandardMaterial({ color: 0x3a3f49, roughness: 0.5 }));
  surroundEdge.position.z = -10;
  scene.add(surroundEdge);

  // The board's own edge: the side catches the rim light, and a thin metal band rings the face.
  const side = mesh(new THREE.CylinderGeometry(226, 226, 38, 160, 1, true), new THREE.MeshStandardMaterial({ color: 0x3b3b3e, roughness: 0.55 }));
  side.rotation.x = Math.PI / 2;
  side.position.z = -19;
  scene.add(side);
  const band = mesh(new THREE.TorusGeometry(226, 1.8, 10, 220), new THREE.MeshStandardMaterial({ color: 0xb9bec6, metalness: 1, roughness: 0.3 }));
  band.position.z = -0.5;
  scene.add(band);

  const face = mesh(
    new THREE.CircleGeometry(226, 256),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.95, metalness: 0, bumpMap: bumpTex, bumpScale: 2.2 }),
  );
  face.receiveShadow = true;
  scene.add(face);

  // ---- The wire spider ----
  const wireMat = keep(new THREE.MeshStandardMaterial({ color: 0xd5dae0, metalness: 1, roughness: 0.22 }));
  for (const r of [RAD.bull, RAD.outerBull, RAD.trebleIn, RAD.trebleOut, RAD.doubleIn, RAD.doubleOut]) {
    const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(r, r < 20 ? 0.6 : 0.7, 8, Math.max(64, Math.round(r * 2)))), wireMat);
    ring.position.z = 0.5;
    ring.castShadow = true;
    scene.add(ring);
  }
  const radialGeo = keep(new THREE.CylinderGeometry(0.55, 0.55, RAD.doubleOut - RAD.outerBull, 6));
  const mid = (RAD.outerBull + RAD.doubleOut) / 2;
  for (let i = 0; i < 20; i++) {
    const a = (90 - 18 * i + 9) * D2R;
    const w = new THREE.Mesh(radialGeo, wireMat);
    w.position.set(mid * Math.cos(a), mid * Math.sin(a), 0.5);
    w.rotation.z = a - Math.PI / 2;
    w.castShadow = true;
    scene.add(w);
  }

  // ---- Darts ----
  const dartsGroup = new THREE.Group();
  scene.add(dartsGroup);
  let design: DartDesign = 'silver';
  const live = new Map<number, { built: BuiltDart; dart: Dart }>();
  const flightTex = [keep(makeFlightTexture('#ff6a45', '#7a1d0c')), keep(makeFlightTexture('#35c3dd', '#0d4d5a'))];

  function placeDart(d: Dart, animate: boolean) {
    const built = buildDart(design, flightTex[d.p], d.p);
    const rnd = (k: number) => {
      const v = Math.sin((d.id * 9301 + 49297) * (k + 1)) * 43758.5453;
      return v - Math.floor(v);
    };
    const pitch = (7 + rnd(1) * 10) * D2R;
    const yaw = (rnd(2) * 14 - 7) * D2R;
    built.outer.position.set(d.x, d.y, 0);
    built.outer.rotation.set(-pitch, yaw, 0, 'YXZ');
    built.spin.rotation.y = rnd(3) * Math.PI * 2;
    dartsGroup.add(built.outer);
    live.set(d.id, { built, dart: d });
    if (animate && !reduceMotion()) {
      const t0 = performance.now();
      const baseX = built.outer.rotation.x;
      built.outer.position.z = 700;
      animate_((t) => {
        if (!live.has(d.id)) return false;
        const k = Math.min(1, (t - t0) / 150);
        built.outer.position.z = 700 * (1 - k) * (1 - k);
        if (k < 1) return true;
        const w = (t - t0 - 150) / 1000;
        built.outer.rotation.x = baseX + 0.06 * Math.exp(-w / 0.09) * Math.sin(w * 70);
        if (w > 0.45) {
          built.outer.rotation.x = baseX;
          return false;
        }
        return true;
      });
    }
  }
  function removeDart(id: number) {
    const v = live.get(id);
    if (!v) return;
    dartsGroup.remove(v.built.outer);
    v.built.dispose();
    live.delete(id);
  }

  // ---- Cameras ----
  let camName: CameraName = 'dynamic';
  let focus = { x: 0, y: 103, r: 75 };
  const camLook = FIXED.straight.look.clone();
  camera.position.copy(FIXED.straight.pos);
  camera.lookAt(camLook);
  const specFor = (name: CameraName): CamSpec => (name === 'dynamic' ? dynamicSpec(focus.x, focus.y, focus.r) : FIXED[name]);
  let camAnim: ((t: number) => boolean) | null = null;
  function moveCamera(instant: boolean, ms = 650) {
    const to = specFor(camName);
    if (instant || reduceMotion()) {
      camera.position.copy(to.pos);
      camLook.copy(to.look);
      camera.fov = to.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(camLook);
      kick();
      return;
    }
    const fromPos = camera.position.clone();
    const fromLook = camLook.clone();
    const fromFov = camera.fov;
    const t0 = performance.now();
    if (camAnim) anims.delete(camAnim);
    camAnim = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(fromPos, to.pos, e);
      camLook.lerpVectors(fromLook, to.look, e);
      camera.fov = fromFov + (to.fov - fromFov) * e;
      camera.updateProjectionMatrix();
      camera.lookAt(camLook);
      return k < 1;
    };
    animate_(camAnim);
  }

  // ---- Rendering on demand ----
  const anims = new Set<(t: number) => boolean>();
  let running = false;
  let disposed = false;
  function animate_(fn: (t: number) => boolean) {
    anims.add(fn);
    kick();
  }
  function frame(t: number) {
    if (disposed) return;
    for (const fn of [...anims]) if (!fn(t)) anims.delete(fn);
    renderer.render(scene, camera);
    if (anims.size) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (!running && !disposed) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    kick();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    sync(darts, animateNewest) {
      const ids = new Set(darts.map((d) => d.id));
      for (const id of [...live.keys()]) if (!ids.has(id)) removeDart(id);
      darts.forEach((d, i) => {
        if (!live.has(d.id)) placeDart(d, animateNewest && i === darts.length - 1);
      });
      host.dataset.darts = String(live.size);
      kick();
    },
    setCamera(name, instant = false) {
      if (name === camName && !instant) return;
      camName = name;
      moveCamera(instant);
    },
    setDesign(next) {
      if (next === design) return;
      design = next;
      const darts = [...live.values()].map((v) => v.dart);
      for (const d of darts) removeDart(d.id);
      darts.forEach((d) => placeDart(d, false));
      kick();
    },
    setFocus(x, y, r, ms = 420) {
      if (Math.abs(x - focus.x) < 0.5 && Math.abs(y - focus.y) < 0.5 && Math.abs(r - focus.r) < 0.5) return;
      focus = { x, y, r };
      if (camName === 'dynamic') moveCamera(false, ms);
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      for (const id of [...live.keys()]) removeDart(id);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// ===== Board face texture: beds, sisal speckle, numbers =====
function drawBoardFace(noiseTile: HTMLCanvasElement): HTMLCanvasElement {
  const S = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const k = S / (2 * 226);
  g.translate(S / 2, S / 2);
  g.scale(k, k);
  const outer = g.createRadialGradient(0, 0, 170, 0, 0, 226);
  outer.addColorStop(0, '#141414');
  outer.addColorStop(1, '#0b0b0b');
  g.fillStyle = outer;
  g.beginPath();
  g.arc(0, 0, 226, 0, Math.PI * 2);
  g.fill();
  const bed = (r1: number, r2: number, a1: number, a2: number, col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(0, 0, r2, -a1, -a2, false);
    g.arc(0, 0, r1, -a2, -a1, true);
    g.closePath();
    g.fill();
  };
  ORDER.forEach((_, i) => {
    const c0 = (90 - 18 * i) * D2R;
    const a1 = c0 + 9 * D2R;
    const a2 = c0 - 9 * D2R;
    const dark = i % 2 === 0;
    const single = dark ? '#151515' : '#d8c497';
    const ring = dark ? '#b3241d' : '#11683a';
    bed(RAD.outerBull, RAD.trebleIn, a1, a2, single);
    bed(RAD.trebleIn, RAD.trebleOut, a1, a2, ring);
    bed(RAD.trebleOut, RAD.doubleIn, a1, a2, single);
    bed(RAD.doubleIn, RAD.doubleOut, a1, a2, ring);
  });
  g.fillStyle = '#11683a';
  g.beginPath();
  g.arc(0, 0, RAD.outerBull, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#b3241d';
  g.beginPath();
  g.arc(0, 0, RAD.bull, 0, Math.PI * 2);
  g.fill();

  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.beginPath();
  g.arc(S / 2, S / 2, 170 * k, 0, Math.PI * 2);
  g.clip();
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.8;
  g.fillStyle = g.createPattern(noiseTile, 'repeat')!;
  g.fillRect(0, 0, S, S);
  g.restore();

  g.fillStyle = '#f1f1ee';
  g.font = '600 26px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  ORDER.forEach((n, i) => {
    const a = (90 - 18 * i) * D2R;
    g.fillText(String(n), 197 * Math.cos(a), -197 * Math.sin(a) + 1);
  });
  return c;
}

function makeNoiseTile(n: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const img = g.createImageData(n, n);
  let s = 1234567;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < n * n; i++) {
    const v = 110 + r() * 90;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.lineWidth = 0.8;
  for (let i = 0; i < 1400; i++) {
    const x = r() * n;
    const y = r() * n;
    const a = r() * Math.PI * 2;
    const l = 2 + r() * 5;
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
}

function makeFlightTexture(base: string, edge: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 128, 256);
  grad.addColorStop(0, base);
  grad.addColorStop(1, edge);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(255,255,255,.9)';
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(20, 150);
  g.lineTo(80, 200);
  g.lineTo(20, 250);
  g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.55)';
  g.lineWidth = 10;
  g.strokeRect(0, 0, 128, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ===== A dart, built along +Y (tip at y = -32), then turned to point out of the board =====
interface BuiltDart {
  outer: THREE.Group;
  spin: THREE.Group;
  dispose(): void;
}

function barrelProfile(design: DartDesign): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const add = (r: number, y: number) => pts.push(new THREE.Vector2(r, y));
  add(0, 0);
  add(2.4, 0);
  if (design === 'silver') {
    add(3.2, 4);
    add(3.55, 9);
    for (let y = 11; y < 40; y += 2.3) {
      add(3.6, y);
      add(3.1, y + 0.45);
      add(3.1, y + 1.05);
      add(3.6, y + 1.5);
    }
    add(3.5, 43);
    add(2.9, 48);
  } else {
    add(3.0, 3);
    add(3.45, 8);
    for (let y = 10; y < 42; y += 4.2) {
      add(3.45, y);
      add(3.0, y + 1.1);
      add(3.45, y + 2.2);
    }
    add(3.3, 45);
    add(2.7, 49);
  }
  add(2.2, 50);
  add(0, 50);
  return pts;
}

function buildDart(design: DartDesign, flightTexture: THREE.Texture, p: number): BuiltDart {
  const owned: { dispose(): void }[] = [];
  const mat = (o: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial(o);
    owned.push(m);
    return m;
  };
  const geo = <T extends THREE.BufferGeometry>(g: T): T => {
    owned.push(g);
    return g;
  };
  const steel = mat({ color: 0xc4cad1, metalness: 1, roughness: 0.25 });
  const barrelMat =
    design === 'silver' ? mat({ color: 0xbfc4ca, metalness: 1, roughness: 0.32 }) : mat({ color: 0x232529, metalness: 0.85, roughness: 0.38 });
  const shaftMat =
    design === 'silver'
      ? mat({ color: 0x15171a, metalness: 0.2, roughness: 0.45 })
      : mat({ color: p === 0 ? 0xd2492c : 0x2a9fb6, metalness: 0.75, roughness: 0.3 });
  const flightMat = mat({ map: flightTexture, roughness: 0.55, metalness: 0, side: THREE.DoubleSide });

  const spin = new THREE.Group();
  const point = new THREE.Mesh(geo(new THREE.CylinderGeometry(1.15, 0.22, 32, 16)), steel);
  point.position.y = -16;
  const barrel = new THREE.Mesh(geo(new THREE.LatheGeometry(barrelProfile(design), 36)), barrelMat);
  const shaft = new THREE.Mesh(geo(new THREE.CylinderGeometry(2.05, 2.3, 34, 20)), shaftMat);
  shaft.position.y = 67;
  const collar = new THREE.Mesh(geo(new THREE.CylinderGeometry(2.55, 2.55, 3, 20)), design === 'silver' ? steel : barrelMat);
  collar.position.y = 52;
  spin.add(point, barrel, shaft, collar);
  if (design === 'black') {
    const ringGeo = geo(new THREE.TorusGeometry(3.25, 0.35, 8, 36));
    for (const y of [12.2, 20.6, 29, 37.4]) {
      const r = new THREE.Mesh(ringGeo, steel);
      r.rotation.x = Math.PI / 2;
      r.position.y = y;
      spin.add(r);
    }
  }

  const s = new THREE.Shape();
  if (design === 'silver') {
    s.moveTo(0.8, 0);
    s.lineTo(4.5, 5);
    s.lineTo(17, 27);
    s.lineTo(18, 36);
    s.lineTo(15, 40);
    s.lineTo(0.8, 40);
  } else {
    s.moveTo(0.8, 0);
    s.lineTo(3.5, 7);
    s.lineTo(13, 30);
    s.lineTo(13.5, 40);
    s.lineTo(0.8, 40);
  }
  s.closePath();
  const wingGeo = geo(new THREE.ShapeGeometry(s));
  const uv = wingGeo.attributes.uv;
  const pos = wingGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 18, pos.getY(i) / 40);
  for (let k = 0; k < 4; k++) {
    const w = new THREE.Mesh(wingGeo, flightMat);
    w.position.y = 82;
    w.rotation.y = (k * Math.PI) / 2;
    spin.add(w);
  }
  spin.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  const axis = new THREE.Group();
  axis.rotation.x = Math.PI / 2;
  axis.position.z = 32 - 14;
  axis.add(spin);
  const outer = new THREE.Group();
  outer.add(axis);
  return { outer, spin, dispose: () => owned.forEach((d) => d.dispose()) };
}

// Film 32 world: a farmhouse porch at sunset and the lamp-lit living room, in the claude-animated-shorts look
// (two-tone painted materials, ink lines, flat ink cartoon cards lit by the scene, sun disc + halo, lens blur).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { ctex, rep, planksHD, grassHD, roofHD, cloudHD, jit } from "../bridge/paint";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx, SU } from "../bridge/cast";
import { Pen, bodyFront, bodySide, fxContact, mix, FrontOpts, SideOpts, Outfit } from "./toon2";
import { DAD, SON, BOY } from "./people";
import { FPS, IN, PORCH_Y, Light, camAt, shotAt, sonWalk, seg, smooth, clamp01, V3 } from "./story2";

// ---------------- light presets ----------------
const LAMP: LightPreset = {
  ...LIGHTS.golden, az: -55, el: 24,
  lit: [1.5, 1.05, 0.66], shade: [0.3, 0.24, 0.38], lift: [0.04, 0.04, 0.1], lambert: 0.45, sideK: 0.8, term: 0.12,
  charTint: [1.0, 0.84, 0.66], charShade: 0.84, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.8, 0.8, 0.98],
  actorShadow: true, fog: "#2a2436", fogNear: 400, fogFar: 900, sunCol: "#ffb36b", sunI: 4.5, bias: -0.0008, normalBias: 0.02,
};
const PRESET: Record<Light, LightPreset> = { golden: LIGHTS.golden, lamp: LAMP };
// world-space sun direction per shot (toward the light)
const SUN: Record<number, THREE.Vector3> = {
  1: V(-0.62, 0.2, 0.76).normalize(),    // low sun over the yard, left of camera: the house front glows, long shadows run right
  2: V(-0.75, 0.22, 0.62).normalize(),    // warm key from the left on both faces
  3: V(0.55, 0.42, 0.72).normalize(),     // the table lamp at screen right, in front of the sofa
  4: V(0.62, 0.4, 0.68).normalize(),
};

// ---------------- painted textures ----------------
const siding = () => ctex("siding32", 1024, 1024, (g, r) => {
  const rows = 16, h = 1024 / rows;
  for (let i = 0; i < rows; i++) {
    g.fillStyle = jit(r, "#f1e6d2", 0.03, 3, 0.1); g.fillRect(0, i * h, 1024, h);
    const gr = g.createLinearGradient(0, i * h, 0, (i + 1) * h); gr.addColorStop(0, "rgba(255,255,255,0.12)"); gr.addColorStop(0.85, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(60,40,40,0.35)");
    g.fillStyle = gr; g.fillRect(0, i * h, 1024, h);
    g.fillStyle = "rgba(40,30,40,0.75)"; g.fillRect(0, (i + 1) * h - 4, 1024, 4);
    for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(150,120,90,0.12)"; g.lineWidth = 2; g.beginPath(); const y = i * h + 8 + r() * (h - 16); g.moveTo(r() * 1024, y); g.lineTo(r() * 1024, y + r() * 3); g.stroke(); }
    if (r() < 0.5) { g.fillStyle = "rgba(40,30,40,0.6)"; g.fillRect(Math.floor(r() * 1024), i * h, 4, h); }
  }
});
const wallpaper = () => ctex("wallpaper32", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9b98a"; g.fillRect(0, 0, 1024, 1024);
  for (let x = 0; x < 1024; x += 128) { g.fillStyle = "#cfa978"; g.fillRect(x, 0, 52, 1024); g.fillStyle = "rgba(255,240,210,0.25)"; g.fillRect(x + 60, 0, 6, 1024); }
  for (let y = 40; y < 1024; y += 120) for (let x = 90; x < 1024; x += 128) { g.fillStyle = "#b98d63"; g.beginPath(); g.ellipse(x + (y % 240 ? 0 : 64), y, 7, 11, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,60,40,${0.04 * r()})`; g.fillRect(r() * 1024, r() * 1024, 3, 3); }
});
const fabric = (key: string, col: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2); }
});
const rugTex = () => ctex("rug32", 1024, 640, (g) => {
  g.fillStyle = "#8f3b34"; g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = "#e3c27a"; g.lineWidth = 18; g.strokeRect(40, 40, 944, 560); g.lineWidth = 6; g.strokeRect(80, 80, 864, 480);
  g.fillStyle = "#2f4a6a"; g.beginPath(); g.ellipse(512, 320, 210, 130, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#e3c27a"; g.lineWidth = 8; g.beginPath(); g.ellipse(512, 320, 170, 100, 0, 0, Math.PI * 2); g.stroke();
});
const gravel = () => ctex("gravel32", 512, 512, (g, r) => {
  g.fillStyle = "#cdb48e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) { g.fillStyle = jit(r, "#a88d6a", 0.2, 6, 0.2); g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const field = () => ctex("field32", 512, 512, (g, r) => {
  g.fillStyle = "#d8b25a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) { g.fillStyle = y % 32 ? "rgba(255,230,150,0.25)" : "rgba(150,100,40,0.18)"; g.fillRect(0, y, 512, 8); }
  for (let i = 0; i < 600; i++) { g.fillStyle = "rgba(120,80,30,0.15)"; g.fillRect(r() * 512, r() * 512, 2, 6); }
});
/** framed picture on the living-room wall: Dad with the son as a little boy on his shoulders (our own drawing) */
const memoryPic = () => ctex("memory32", 600, 760, (g) => {
  g.fillStyle = "#f3e7cc"; g.fillRect(0, 0, 600, 760);
  const sky = g.createLinearGradient(0, 0, 0, 760); sky.addColorStop(0, "#9fd0f0"); sky.addColorStop(1, "#f6e2b8"); g.fillStyle = sky; g.fillRect(30, 30, 540, 700);
  g.fillStyle = "#7cbf5a"; g.fillRect(30, 560, 540, 170);
  g.save(); g.translate(130, 150); g.scale(0.55, 0.55);
  bodyFront(new Pen(g), { ...DAD, hair: "#5a4030", moustache: "#5a4030", glasses: false }, { mode: "stand", expr: "laugh", seed: 3, handL: [240, 330], handR: [360, 330] });
  g.restore(); g.save(); g.translate(205, 15); g.scale(0.36, 0.36);
  bodyFront(new Pen(g), BOY, { mode: "sit", expr: "laugh", seed: 8, handL: [180, 500], handR: [420, 500] });
  g.restore();
});
const discTex = () => ctex("sunDisc32", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo32", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128, a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** hand-drawn name tag with a little arrow pointing down at the character (opening shot: who is who) */
const nameTag = (p: Pen, text: string) => {
  const g = p.g; g.font = "88px Playfair"; const w = g.measureText(text).width + 90, x0 = 300 - w / 2;
  p.poly([[x0, 40], [x0 + w, 34], [x0 + w + 6, 150], [x0 - 4, 156]], "#fff6e2", 9);
  g.fillStyle = "#241726"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 300, 98);
  p.stroke([[300, 168], [296, 210], [300, 252]], 10); p.stroke([[278, 228], [300, 256], [322, 228]], 10);
};
/** "..." thought bubble that fades (alpha baked per step) */
const bubble = (p: Pen, a: number) => {
  const g = p.g; g.globalAlpha = a;
  p.ell(200, 120, 170, 95, "#ffffff", 9); p.ell(70, 245, 26, 20, "#ffffff", 7); p.ell(30, 290, 14, 11, "#ffffff", 6);
  for (const x of [130, 200, 270]) p.dot(x, 120, 17);
  g.globalAlpha = 1;
};

const emissive = (col: string, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) }); return m; };
const tile = (t: THREE.Texture, x: number, y: number) => rep(t, x, y);

export class World2 {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
  private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private clouds: THREE.Mesh[] = [];
  private porch = new THREE.Group(); private living = new THREE.Group();
  private lampGlow: THREE.Mesh; private winGlow: THREE.Mesh[] = [];

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0)); vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud));
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 - 0.9 + i * 0.32, d = 520;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], transparent: true, depthWrite: false, fog: false }));
      const w = 110 + (i % 3) * 40; m.position.set(Math.cos(a) * d, 60 + (i % 3) * 30, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    R.add(this.porch, this.living);
    this.buildPorch(); this.buildLiving();
    this.lampGlow = this.living.getObjectByName("lampShade") as THREE.Mesh;
  }

  private buildPorch() {
    const b = new Batch(), P = PORCH_Y;
    const sid = lam("siding32", () => ({ map: tile(siding(), 1, 1) }));
    const deck = lam("deck32", () => ({ map: tile(planksHD(), 1, 1), color: "#e0c7a6" }));
    const trim = lam("trim32", () => ({ color: "#f6efe2" }));
    const roof = lam("roof32", () => ({ map: tile(roofHD("#7a4e4a"), 1, 1) }));
    const grass = lam("grass32", () => ({ map: tile(grassHD(), 1, 1), color: "#e8d9a0" }));
    const grav = lam("gravel32", () => ({ map: tile(gravel(), 1, 1) }));
    const fld = lam("field32", () => ({ map: tile(field(), 1, 1) }));
    const door = lam("door32", () => ({ color: "#5b7a6a" }));
    const wood = lam("wood32", () => ({ color: "#8a5f3e" }));
    const car = lam("car32", () => ({ color: "#9aa7b8" })), carDark = lam("carDark32", () => ({ color: "#2c3140" })), tyre = lam("tyre32", () => ({ color: "#26232b" }));
    const leaf = [lam("leafA32", () => ({ color: "#6f9a46" })), lam("leafB32", () => ({ color: "#5f8a40" })), lam("leafC32", () => ({ color: "#86a84e" }))];
    const hill = lam("hill32", () => ({ color: "#7d9a55" }));
    // ground
    b.add(boxGeo(V(-300, -0.2, -300), V(300, 0, 300), 4), grass);
    b.add(boxGeo(V(-60, -0.15, -140), V(60, 0.01, -14), 6), fld);
    b.add(boxGeo(V(3.6, 0, -1), V(5.8, 0.02, 30), 2), grav);
    // house body (front wall at z = -3), gable roof
    b.add(boxGeo(V(-5, 0, -11), V(5, 5.6, -3), 2.2), sid);
    const gable = new THREE.BufferGeometry(); gable.setAttribute("position", new THREE.Float32BufferAttribute([-5, 5.6, -3, 5, 5.6, -3, 0, 8.2, -3], 3)); gable.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 4.5, 0, 2.25, 1.2], 2)); gable.computeVertexNormals();
    b.add(gable, sid);
    for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(6.4, 0.18, 9.2); const m = new THREE.Matrix4().compose(V(s * 2.6, 6.95, -7), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -s * 0.48)), V(1, 1, 1)); b.add(g, roof, m); }
    // porch: floor, posts, roof, railing, steps
    b.add(boxGeo(V(-4.6, 0, -3), V(4.6, P, 0.1), 1.2), deck);
    b.add(boxGeo(V(-4.6, P - 0.06, 0.1), V(4.6, P, 0.2)), trim);
    for (const x of [-4.4, -1.35, 1.35, 4.4]) b.add(boxGeo(V(x - 0.09, P, -0.15), V(x + 0.09, 3.25, 0.03)), trim);
    b.add(boxGeo(V(-4.8, 3.25, -3), V(4.8, 3.42, 0.35)), trim);
    { const g = new THREE.BoxGeometry(9.8, 0.12, 3.8); b.add(g, roof, new THREE.Matrix4().compose(V(0, 3.62, -1.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.16, 0, 0)), V(1, 1, 1))); }
    for (const [x0, x1] of [[-4.4, -1.35], [1.35, 4.4]]) {
      b.add(boxGeo(V(x0, P + 0.85, -0.1), V(x1, P + 0.92, -0.02)), trim); b.add(boxGeo(V(x0, P + 0.12, -0.1), V(x1, P + 0.17, -0.02)), trim);
      for (let x = x0 + 0.15; x < x1 - 0.05; x += 0.16) b.add(boxGeo(V(x - 0.02, P + 0.17, -0.08), V(x + 0.02, P + 0.85, -0.04)), trim);
    }
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(-1.2, P - 0.17 * (k + 1), 0.2 + 0.3 * k), V(1.2, P - 0.17 * k, 0.5 + 0.3 * k), 1.2), deck);
    // windows (warm light inside) + door
    for (const x of [-3.0, 3.0]) {
      b.add(boxGeo(V(x - 0.75, P + 0.75, -3.04), V(x + 0.75, P + 2.35, -2.96)), trim);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.4), emissive("#ffc477", 1.4)); gl.position.set(x, P + 1.55, -2.95); gl.layers.set(NOINK); this.porch.add(gl); this.winGlow.push(gl);
      b.add(boxGeo(V(x - 0.03, P + 0.8, -2.95), V(x + 0.03, P + 2.3, -2.9)), trim); b.add(boxGeo(V(x - 0.7, P + 1.52, -2.95), V(x + 0.7, P + 1.58, -2.9)), trim);
    }
    b.add(boxGeo(V(-0.55, P, -3.05), V(0.55, P + 2.25, -2.95)), door); b.add(boxGeo(V(-0.65, P + 2.25, -3.06), V(0.65, P + 2.38, -2.93)), trim);
    // rocking chair + a flower pot
    b.add(boxGeo(V(-3.25, P + 0.42, -2.3), V(-2.65, P + 0.48, -1.75)), wood); b.add(boxGeo(V(-3.25, P + 0.48, -2.32), V(-2.65, P + 1.25, -2.25)), wood);
    for (const x of [-3.22, -2.68]) { b.add(boxGeo(V(x - 0.03, P, -2.3), V(x + 0.03, P + 0.45, -2.25)), wood); b.add(boxGeo(V(x - 0.03, P, -1.8), V(x + 0.03, P + 0.45, -1.75)), wood); b.add(boxGeo(V(x - 0.03, P, -2.45), V(x + 0.03, P + 0.04, -1.6)), wood); }
    b.add(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 14), lam("pot32", () => ({ color: "#c0673f" })), new THREE.Matrix4().makeTranslation(3.6, P + 0.2, -0.6));
    b.add(new THREE.SphereGeometry(0.32, 14, 10), leaf[0], new THREE.Matrix4().makeTranslation(3.6, P + 0.62, -0.6));
    // son's car on the gravel
    const C = new THREE.Matrix4().makeTranslation(5.2, 0, 7.8);
    const carGeo: [THREE.BufferGeometry, THREE.Material][] = [
      [boxGeo(V(-0.9, 0.32, -2.1), V(0.9, 0.95, 2.1)), car], [boxGeo(V(-0.8, 0.95, -1.1), V(0.8, 1.5, 0.9)), car],
      [boxGeo(V(-0.81, 1.0, -1.0), V(0.81, 1.42, 0.8)), carDark],
    ];
    for (const [g, m] of carGeo) b.add(g, m, C);
    for (const [x, z] of [[-0.9, -1.35], [0.9, -1.35], [-0.9, 1.35], [0.9, 1.35]]) { const t = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18); t.rotateZ(Math.PI / 2); b.add(t, tyre, new THREE.Matrix4().makeTranslation(5.2 + x, 0.34, 7.8 + z)); }
    // trees, hedge, fence
    const tree = (x: number, z: number, s: number, i: number) => {
      b.add(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.4 * s, 8), wood, new THREE.Matrix4().makeTranslation(x, 1.2 * s, z));
      for (const [dx, dy, dz, r] of [[0, 3.0, 0, 1.3], [0.8, 2.6, 0.2, 0.9], [-0.8, 2.7, -0.1, 0.95], [0.1, 3.7, -0.2, 0.9]]) b.add(new THREE.SphereGeometry(r * s, 16, 12), leaf[(i + dx * 3) & 3 % 3] ?? leaf[0], new THREE.Matrix4().makeTranslation(x + dx * s, dy * s, z + dz * s));
    };
    tree(-7.5, -2, 1.5, 0); tree(8.5, -5, 1.3, 1); tree(-12, 6, 1.2, 2); tree(14, 10, 1.4, 0); tree(-20, -18, 1.6, 1); tree(22, -22, 1.7, 2);
    for (let x = -14; x <= 14; x += 2.0) { if (x > 3 && x < 7) continue; b.add(boxGeo(V(x - 0.05, 0, 13.9), V(x + 0.05, 1.0, 14.0)), trim); }
    b.add(boxGeo(V(-14, 0.75, 13.92), V(3, 0.82, 13.98)), trim); b.add(boxGeo(V(7, 0.75, 13.92), V(14, 0.82, 13.98)), trim);
    for (let i = 0; i < 9; i++) { const a = -2.4 + i * 0.6, d = 160; b.add(new THREE.SphereGeometry(40 + (i % 3) * 14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hill, new THREE.Matrix4().makeTranslation(Math.cos(a) * d * 1.3, -14, -Math.abs(Math.sin(a)) * d - 40)); }
    b.build(this.porch);
  }

  private buildLiving() {
    const b = new Batch(), [ox] = IN, G = this.living;
    const wall = lam("wallpaper32", () => ({ map: tile(wallpaper(), 1, 1) }));
    const floor = lam("floor32", () => ({ map: tile(planksHD(), 1, 1), color: "#a77c58" }));
    const sofa = lam("sofa32", () => ({ map: tile(fabric("sofaF", "#4f7a78"), 1, 1) })), sofaD = lam("sofaD32", () => ({ map: tile(fabric("sofaD", "#3f6462"), 1, 1) }));
    const wood = lam("woodIn32", () => ({ color: "#6e4a32" })), trim = lam("trimIn32", () => ({ color: "#efe3cf" })), ceil = lam("ceil32", () => ({ color: "#e9dcc6" }));
    const rug = lam("rug32", () => ({ map: rugTex() })), shadeM = lam("lampBase32", () => ({ color: "#c9b48a" }));
    b.add(boxGeo(V(ox - 4, -0.1, -4), V(ox + 4, 0, 4), 1.4), floor);
    b.add(boxGeo(V(ox - 4, 0, -1.9), V(ox + 4, 3, -1.75), 1.6), wall);
    b.add(boxGeo(V(ox - 3.2, 0, -1.9), V(ox - 3.05, 3, 4), 1.6), wall); b.add(boxGeo(V(ox + 3.05, 0, -1.9), V(ox + 3.2, 3, 4), 1.6), wall);
    b.add(boxGeo(V(ox - 4, 3, -2), V(ox + 4, 3.1, 4)), ceil);
    b.add(boxGeo(V(ox - 4, 0, -1.76), V(ox + 4, 0.14, -1.7)), trim);
    // rug, sofa (seat .45), coffee table
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), rug); rg.rotation.x = -Math.PI / 2; rg.position.set(ox, 0.006, 0.35); rg.receiveShadow = true; G.add(rg);
    b.add(boxGeo(V(ox - 1.25, 0.08, -1.7), V(ox + 1.25, 0.42, -0.62)), sofaD);
    b.add(boxGeo(V(ox - 1.2, 0.42, -1.55), V(ox + 1.2, 0.52, -0.66), 0.8), sofa);
    b.add(boxGeo(V(ox - 1.25, 0.42, -1.75), V(ox + 1.25, 1.12, -1.38)), sofaD);
    for (const s of [-1, 1]) b.add(boxGeo(V(ox + s * 1.25 - 0.17, 0.08, -1.75), V(ox + s * 1.25 + 0.17, 0.72, -0.6)), sofaD);
    for (const [x, z] of [[-1.15, -0.7], [1.15, -0.7], [-1.15, -1.65], [1.15, -1.65]]) b.add(boxGeo(V(ox + x - 0.04, 0, z - 0.04), V(ox + x + 0.04, 0.08, z + 0.04)), wood);
    b.add(boxGeo(V(ox - 0.75, 0.38, 0.55), V(ox + 0.75, 0.44, 1.15)), wood);
    for (const [x, z] of [[-0.68, 0.62], [0.68, 0.62], [-0.68, 1.08], [0.68, 1.08]]) b.add(boxGeo(V(ox + x - 0.03, 0, z - 0.03), V(ox + x + 0.03, 0.38, z + 0.03)), wood);
    b.add(boxGeo(V(ox - 0.2, 0.44, 0.75), V(ox + 0.05, 0.48, 0.92)), lam("book32", () => ({ color: "#7a3a3a" })));
    // side table + lamp at screen right
    b.add(boxGeo(V(ox + 1.45, 0, -1.55), V(ox + 1.95, 0.58, -1.05)), wood);
    b.add(new THREE.CylinderGeometry(0.07, 0.1, 0.32, 14), shadeM, new THREE.Matrix4().makeTranslation(ox + 1.7, 0.74, -1.3));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.3, 24, 1, true), emissive("#ffd49a", 1.9)); shade.name = "lampShade"; shade.position.set(ox + 1.7, 1.03, -1.3); shade.layers.set(NOINK); G.add(shade);
    // window (dusk blue) on the left wall, curtains
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), emissive("#3c5688", 1.0)); win.position.set(ox - 3.04, 1.65, -0.5); win.rotation.y = Math.PI / 2; win.layers.set(NOINK); G.add(win);
    b.add(boxGeo(V(ox - 3.05, 0.9, -1.27), V(ox - 3.0, 2.4, -1.15)), trim); b.add(boxGeo(V(ox - 3.05, 0.9, 0.15), V(ox - 3.0, 2.4, 0.27)), trim);
    b.add(boxGeo(V(ox - 3.05, 0.9, -1.25), V(ox - 3.0, 0.98, 0.25)), trim); b.add(boxGeo(V(ox - 3.05, 2.32, -1.25), V(ox - 3.0, 2.4, 0.25)), trim);
    for (const z of [-1.55, 0.55]) b.add(boxGeo(V(ox - 3.04, 0.6, z - 0.25), V(ox - 2.96, 2.6, z + 0.25)), lam("curtain32", () => ({ map: tile(fabric("curt", "#9a5a4a"), 1, 1) })));
    // pictures over the sofa: the memory (Dad + little boy on his shoulders) and two small frames; a wall clock
    const frame = lam("frame32", () => ({ color: "#4a3022" }));
    b.add(boxGeo(V(ox - 0.42, 1.45, -1.75), V(ox + 0.42, 2.5, -1.7)), frame);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.92), new THREE.MeshLambertMaterial({ map: memoryPic() })); pic.position.set(ox, 1.975, -1.69); G.add(pic);
    for (const x of [-1.0, 0.9]) { b.add(boxGeo(V(ox + x - 0.2, 1.7, -1.75), V(ox + x + 0.2, 2.15, -1.71)), frame); b.add(boxGeo(V(ox + x - 0.16, 1.74, -1.71), V(ox + x + 0.16, 2.11, -1.7)), lam("photoW32", () => ({ color: "#d9c7a5" }))); }
    b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 28), frame, new THREE.Matrix4().compose(V(ox + 2.2, 2.25, -1.72), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)));
    b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 28), trim, new THREE.Matrix4().compose(V(ox + 2.2, 2.25, -1.69), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)));
    // bookshelf at the left
    b.add(boxGeo(V(ox - 2.8, 0, -1.7), V(ox - 1.8, 2.0, -1.35)), wood);
    const bookC = ["#b5523f", "#3f6fb5", "#d9a441", "#5d7a3a", "#7b5ac9"];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) b.add(boxGeo(V(ox - 2.72 + k * 0.12, 0.12 + r * 0.48, -1.38), V(ox - 2.63 + k * 0.12, 0.42 + r * 0.48 - ((k * 7 + r) % 3) * 0.04, -1.34)), lam("bk" + ((k + r) % 5), () => ({ color: bookC[(k + r) % 5] })));
    b.build(G);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = shotAt(f), t = f / FPS, lt = (f - s.a) / FPS, Lp = PRESET[s.light];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    this.porch.visible = s.place === "porch"; this.living.visible = s.place === "living";
    // light rig: sun (or lamp) as a far directional light toward SUN[id]
    const dir = SUN[s.id];
    this.hemi.color.set(Lp.sky); this.hemi.groundColor.set(Lp.ground); this.hemi.intensity = Lp.hemiI;
    this.sun.color.set(Lp.sunCol); this.sun.intensity = Lp.sunI;
    const Rr = s.place === "porch" ? THREE.MathUtils.clamp(dist * 1.2 + 6, 10, 30) : 6;
    this.sun.position.copy(focus).addScaledVector(dir, s.place === "porch" ? 120 : 12); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix();
    this.sun.shadow.bias = Lp.bias; this.sun.shadow.normalBias = Lp.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...Lp.lit); TONE.uShadeCol.value.set(...Lp.shade); TONE.uShadeLift.value.set(...Lp.lift);
    TONE.uLambert.value = Lp.lambert; TONE.uSideK.value = Lp.sideK; TONE.uTerm.value = Lp.term; TONE.uBounce.value.set(...LOOK.golden.bounce); TONE.uSat.value = LOOK.golden.sat;
    CHAR.uCharTint.value.set(...Lp.charTint); CHAR.uCharShade.value = Lp.charShade; CHAR.uGrad.value = Lp.charGrad; CHAR.uBodyGrad.value = Lp.bodyGrad; CHAR.uSideTint.value.set(...Lp.sideTint);
    // sky, fog, sun disc
    const K = LOOK.golden, su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.sky.visible = s.place === "porch";
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar; scene.fog = this.fog; scene.background = s.place === "porch" ? null : new THREE.Color("#120e18");
    const showSun = s.place === "porch";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    for (const m of this.clouds) { m.visible = showSun; m.lookAt(cam.position.x, m.position.y, cam.position.z); }
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(dir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.8)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(Lp.sunDisc).multiplyScalar(1.3);
    }
    // the lamp breathes a little (a real bulb), windows glow
    if (this.lampGlow) (this.lampGlow.material as THREE.MeshBasicMaterial).color.set("#ffd49a").multiplyScalar(1.85 + 0.05 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
    // ---- cast ----
    const places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; mirror?: boolean; yaw?: number; size: [number, number, number]; scale?: number }[] = [];
    const fxl: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number }[] = [];
    const tierOf = (x: number, y: number, z: number): [number, number, number] => { const d = cam.position.distanceTo(V(x, y + 1, z)); return d < 2.2 ? [1800, 3000, 3] : d < 5 ? [1080, 1800, 1.8] : [600, 1000, 1]; };
    const q = (v: number, n = 60) => Math.round(v * n) / n;
    const lid = (seed: number) => { const fr = f + Math.round(seed * 37); const k = fr % Math.round(55 + 30 * ((seed * 13) % 1)); return k < 4 ? [0.5, 1, 1, 0.5][k] : 0; };
    const front = (o: Outfit, ok: string, x: number, y: number, z: number, fo: FrontOpts, seed: number) => {
      const fo2 = { ...fo, seed, light: -2.2 }, key = `F|${ok}|${JSON.stringify(fo2, (_k, v) => (typeof v === "number" ? q(v) : v))}`;
      places.push({ key, draw: (p) => bodyFront(p, o, fo2), x, y, z, size: tierOf(x, y, z) });
    };
    const side = (o: Outfit, ok: string, x: number, y: number, z: number, so: SideOpts, seed: number, mirror: boolean, yaw?: number) => {
      const so2 = { ...so, seed, light: -2.2 }, key = `S|${ok}|${JSON.stringify(so2, (_k, v) => (typeof v === "number" ? q(v) : v))}`;
      places.push({ key, draw: (p) => bodySide(p, o, so2), x, y, z, mirror, yaw, size: tierOf(x, y, z) });
    };
    const contact = (x: number, y: number, z: number, w = 0.55) => fxl.push({ key: "blob|contact|#5a4a6a", cw: 128, ch: 128, draw: (p) => fxContact(p, "#5a4a6a"), x, y: y + 0.015, z, w, h: w * 0.75, flat: true });
    if (s.id === 1) {
      // Dad on the porch top step waving; the son walks up from the car, looking at his phone, then up at Dad
      const wave = q(Math.sin(t * 7.5), 20), arrive = smooth(seg(t, 2.4, 3.1));
      front(DAD, "dad", 0.15, PORCH_Y, -0.25, { mode: "stand", expr: t < 1.5 ? "hopeful" : "warm", wave, blink: lid(0.3), facing: 0 }, 3);
      contact(0.15, PORCH_Y, -0.25);
      const p = sonWalk(t), walking = t < 3.15, ph = (t * 1.6) % 1;
      side(SON, "son", p[0], p[1], p[2], { mode: walking ? "walk" : "stand", phase: q(ph, 30), stride: 0.75, expr: "neutral", hold: "phone", screenK: 0.5, lookY: walking ? 1.2 * (1 - arrive) : 0, blink: lid(0.7) }, 6, true);
      contact(p[0], 0, p[2]);
      // name tags pop in (overshoot) and fade before the walk ends
      const pop = (t0: number) => { const u = seg(t, t0, t0 + 0.35); return u <= 0 ? 0 : (u < 1 ? smooth(u) * (1 + 0.25 * Math.sin(u * Math.PI)) : 1) * (1 - seg(t, 2.9, 3.2)); };
      const kd = q(pop(0.35), 20), ks = q(pop(0.95), 20);
      const ds = (x: number, y: number, z: number) => cam.position.distanceTo(V(x, y, z)) * 0.13;
      if (kd > 0) { const k2 = ds(0.15, 2.9, -0.25) * kd; fxl.push({ key: "tagDad", cw: 600, ch: 270, draw: (pp) => nameTag(pp, "Dad"), x: 0.15, y: PORCH_Y + 2.45, z: -0.25, w: 1.0 * k2, h: 0.45 * k2 }); }
      if (ks > 0) { const k2 = ds(p[0], 2.4, p[2]) * ks; fxl.push({ key: "tagSon", cw: 600, ch: 270, draw: (pp) => nameTag(pp, "His son"), x: p[0], y: 2.35, z: p[2], w: 1.0 * k2, h: 0.45 * k2 }); }
    } else if (s.id === 2) {
      // the hug: side-on, Dad (left, facing right) wraps both arms around his son; the son holds his phone
      const k = smooth(seg(lt, 0.0, 0.9)), pat = 0.92 + 0.08 * Math.max(0, Math.sin(lt * 9)) * seg(lt, 1.2, 1.4);
      side(DAD, "dad", -0.17, PORCH_Y, -0.58, { mode: "hug", pose: q(k * pat, 30), expr: k > 0.6 ? "tender" : "warm", blink: k > 0.6 ? 0 : lid(0.3) }, 3, false, 0);
      side(SON, "son", 0.2, PORCH_Y, -0.66, { mode: "hug", pose: q(k * 0.55, 30), expr: "neutral", hold: "phone", screenK: q(0.35 + 0.25 * Math.sin(lt * 2), 10), lookY: 0.6, blink: lid(0.7) }, 6, true, 0);
      contact(0.0, PORCH_Y, -0.6, 0.9);
    } else if (s.id === 3) {
      // couch: the son types, lit by his screen; Dad leans in with his old phone held out
      const [ox] = IN, ask = smooth(seg(lt, 0.5, 1.4)), typ = (n: number) => q(Math.max(0, Math.sin(t * 15 + n)) * 6, 3);
      front(SON, "son", ox - 0.42, 0.33, -0.88, { mode: "sit", expr: "numb", lookY: 1.5, lap: "laptop", handL: [262, 805 - typ(1)], handR: [338, 805 - typ(2)], glow: "#9cc8ff", glowK: 0.7, blink: lid(0.7) }, 6);
      const hand: [number, number] = [q(330 - 220 * ask, 2), q(840 - 200 * ask, 2)];
      front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: -1, expr: ask > 0.5 ? "hopeful" : "warm", handR: hand, holdR: "phone", screenK: 0.25, tilt: -6 * ask, blink: lid(0.3) }, 3);
    } else {
      // Dad close: he waits... the phone comes down, the shoulders drop, the smile goes; the "..." fades
      const [ox] = IN, down = smooth(seg(lt, 1.0, 2.6)), slump = smooth(seg(lt, 1.6, 3.0)), typ = (n: number) => q(Math.max(0, Math.sin(t * 15 + n)) * 6, 3);
      front(SON, "son", ox - 0.42, 0.33, -0.88, { mode: "sit", expr: "numb", lookY: 1.5, lap: "laptop", handL: [262, 805 - typ(1)], handR: [338, 805 - typ(2)], glow: "#9cc8ff", glowK: 0.7, blink: lid(0.7) }, 6);
      const hand: [number, number] = [q(110 + 220 * down, 2), q(640 + 200 * down, 2)];
      const expr = down < 0.3 ? "hopeful" : slump < 0.5 ? "warm" : "hurt";
      front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: -1, expr, handR: hand, holdR: "phone", screenK: 0.25, tilt: -6 * (1 - down), slump, lookY: 1.4 * slump, blink: lid(0.3) }, 3);
      const a = q(Math.max(0, 1 - seg(lt, 0.4, 2.4)) * (lt > 0.15 ? 1 : 0), 15);
      if (a > 0) fxl.push({ key: `bubble${a}`, cw: 400, ch: 320, draw: (p) => bubble(p, a), x: ox + 0.78, y: 1.6 + 0.05 * (1 - a), z: -0.75, w: 0.34, h: 0.27, soft: true });
    }
    // ---- bind cards + effects ----
    let ai = 0;
    const used: Actor[] = [];
    for (const p of places) {
      const a = this.actor(ai++), [w, h, k] = p.size;
      a.r = this.pool.req(p.key, w, h, k, p.draw); a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      const sc2 = p.scale ?? 1; a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2); a.mesh.castShadow = Lp.actorShadow; used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of fxl) {
      const e = this.fx(fi++); e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1); fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush(); for (const a of used) a.bind(); for (const e of fused) e.bind();
    return focus;
  }
}
export { SU, mix, clamp01 };

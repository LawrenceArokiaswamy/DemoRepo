// Film 32 world (full film): porch at sunset / morning / rain, the living room by lamp and at night, an office.
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
import { FPS, IN, OF, PORCH_Y, Light, camAt, shotAt, sonWalk, seg, smooth, clamp01, V3 } from "./story3";

// ---------------- light presets ----------------
const LAMP: LightPreset = {
  ...LIGHTS.golden, az: -55, el: 24,
  lit: [1.5, 1.05, 0.66], shade: [0.3, 0.24, 0.38], lift: [0.04, 0.04, 0.1], lambert: 0.45, sideK: 0.8, term: 0.12,
  charTint: [1.0, 0.84, 0.66], charShade: 0.84, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.8, 0.8, 0.98],
  actorShadow: true, fog: "#2a2436", fogNear: 400, fogFar: 900, sunCol: "#ffb36b", sunI: 4.5, bias: -0.0008, normalBias: 0.02,
};
const NIGHT: LightPreset = { ...LAMP, lit: [1.2, 0.85, 0.56], shade: [0.2, 0.2, 0.36], lift: [0.03, 0.04, 0.12], charTint: [0.92, 0.8, 0.7], sunI: 3.2 };
const MORNING: LightPreset = { ...LIGHTS.day, az: 30, el: 22, lit: [1.45, 1.38, 1.25], shade: [0.42, 0.44, 0.58], lift: [0.05, 0.06, 0.12], fogNear: 30, fogFar: 260, fog: "#d4dcea" };
const OFFICE: LightPreset = { ...LIGHTS.day, lit: [1.2, 1.25, 1.35], shade: [0.38, 0.42, 0.55], lift: [0.04, 0.05, 0.1], charTint: [0.9, 0.93, 1.0], actorShadow: true, fogNear: 400, fogFar: 900 };
const RAIN: LightPreset = { ...LIGHTS.day, lit: [0.85, 0.88, 0.95], shade: [0.42, 0.45, 0.56], lift: [0.05, 0.06, 0.1], lambert: 0.2, charTint: [0.85, 0.88, 0.95], fog: "#8d95a3", fogNear: 12, fogFar: 120 };
const PRESET: Record<Light, LightPreset> = { golden: LIGHTS.golden, lamp: LAMP, night: NIGHT, morning: MORNING, office: OFFICE, rain: RAIN };
const SKY: Record<string, { c: string[]; e: number[] }> = {
  golden: LOOK.golden.sky, morning: LOOK.day.sky,
  rain: { c: ["#9aa1ad", "#8e96a3", "#848c9a", "#7a8292", "#6e7686"], e: [0, 4, 10, 20, 40] },
};
// world-space sun direction per shot (toward the light)
const SUN: Record<number, THREE.Vector3> = {
  1: V(-0.62, 0.2, 0.76).normalize(), 2: V(-0.75, 0.22, 0.62).normalize(),
  3: V(0.55, 0.42, 0.72).normalize(), 4: V(0.55, 0.42, 0.72).normalize(), 5: V(0.62, 0.4, 0.68).normalize(),
  6: V(0.7, 0.35, 0.6).normalize(), 7: V(0.6, 0.38, 0.7).normalize(),
  8: V(-0.3, 0.45, 0.85).normalize(), 9: V(-0.25, 0.5, 0.83).normalize(),
  10: V(0, 1, 0), 11: V(0, 1, 0), 12: V(-0.5, 0.5, 0.7).normalize(),
  13: V(0.2, 0.9, 0.4).normalize(), 14: V(0.6, 0.35, 0.7).normalize(), 15: V(0, 1, 0), 16: V(0.55, 0.35, 0.75).normalize(),
  17: V(-0.55, 0.22, 0.8).normalize(), 18: V(-0.5, 0.22, 0.83).normalize(), 19: V(-0.6, 0.2, 0.77).normalize(),
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
/** Dad's reading glasses lying on a cushion (flat card) */
const glassesFx = (p: Pen) => { for (const x of [70, 170]) p.ell(x, 60, 42, 34, "rgba(200,225,240,0.35)", 7); p.stroke([[110, 52], [130, 52]], 7); p.stroke([[28, 50], [4, 20]], 6); p.stroke([[212, 50], [236, 20]], 6); };
const phoneFx = (p: Pen) => { p.poly([[10, 10], [110, 10], [110, 200], [10, 200]], "#2a2d36", 8); p.poly([[22, 26], [98, 26], [98, 180], [22, 180]], "#25324a", 0); };
/** patchwork quilt pulled over the sleeping son */
const quilt = (p: Pen) => {
  const cols = ["#c46b4e", "#e3c27a", "#6f8fb0", "#9bb07a", "#d9a0a0"]; let i = 0;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) { p.poly([[20 + x * 80, 20 + y * 70], [100 + x * 80, 20 + y * 70], [100 + x * 80, 90 + y * 70], [20 + x * 80, 90 + y * 70]], cols[(i++ * 3 + y) % 5], 0); }
  p.poly([[20, 20], [580, 20], [580, 370], [20, 370]], null, 10);
};
/** Dad's red flannel draped over the rocking chair */
const shirtFx = (p: Pen) => {
  p.poly([[60, 30], [240, 30], [300, 120], [250, 140], [230, 100], [230, 330], [70, 330], [70, 100], [50, 140], [0, 120]], "#b9473c", 9);
  const g = p.g; g.save(); p.clip([[60, 30], [240, 30], [300, 120], [250, 140], [230, 100], [230, 330], [70, 330], [70, 100], [50, 140], [0, 120]], () => {
    g.globalAlpha = 0.3; for (let k = 0; k < 16; k++) { p.stroke([[k * 22, 0], [k * 22, 340]], 6, "#3a2a4a"); p.stroke([[0, k * 22], [320, k * 22]], 6, "#3a2a4a"); } g.globalAlpha = 1; }); g.restore();
};
/** one rain streak */
const streak = (p: Pen) => { p.stroke([[16, 4], [10, 120]], 8, "rgba(255,255,255,1)"); };
/** camera flash burst */
const flashFx = (p: Pen, a: number) => { const g = p.g, gr = g.createRadialGradient(200, 200, 0, 200, 200, 200); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.35, `rgba(255,250,235,${a * 0.6})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 400, 400); };
/** office window: a painted city by day */
const cityTex = () => ctex("city32", 1024, 640, (g, r) => {
  const sk = g.createLinearGradient(0, 0, 0, 640); sk.addColorStop(0, "#9fc1e8"); sk.addColorStop(1, "#dfe8f2"); g.fillStyle = sk; g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 26; i++) { const x = i * 42 - 10 + r() * 20, w = 50 + r() * 60, h = 180 + r() * 380; g.fillStyle = jit(r, "#8e9db3", 0.12, 4, 0.2); g.fillRect(x, 640 - h, w, h);
    g.fillStyle = "rgba(230,240,255,0.55)"; for (let y = 640 - h + 14; y < 630; y += 22) for (let xx = x + 8; xx < x + w - 8; xx += 14) if (r() < 0.6) g.fillRect(xx, y, 7, 10); }
});
/** "..." thought bubble that fades (alpha baked per step) */
const bubble = (p: Pen, a: number) => {
  const g = p.g; g.globalAlpha = a;
  p.ell(200, 120, 170, 95, "#ffffff", 9); p.ell(70, 245, 26, 20, "#ffffff", 7); p.ell(30, 290, 14, 11, "#ffffff", 6);
  for (const x of [130, 200, 270]) p.dot(x, 120, 17);
  g.globalAlpha = 1;
};

const emissive = (col: string, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) }); return m; };
const tile = (t: THREE.Texture, x: number, y: number) => rep(t, x, y);

export class World3 {
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
  private lampGlow: THREE.Mesh; private winGlow: THREE.Mesh[] = []; private car = new THREE.Group(); private office = new THREE.Group();

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
    R.add(this.porch, this.living, this.office);
    this.buildPorch(); this.buildLiving(); this.buildOffice();
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
    const cb = new Batch();
    for (const [g, m] of [[boxGeo(V(-0.9, 0.32, -2.1), V(0.9, 0.95, 2.1)), car], [boxGeo(V(-0.8, 0.95, -1.1), V(0.8, 1.5, 0.9)), car], [boxGeo(V(-0.81, 1.0, -1.0), V(0.81, 1.42, 0.8)), carDark],
      [boxGeo(V(-0.7, 0.55, 2.1), V(-0.4, 0.75, 2.14)), lam("tail32", () => ({ color: "#ff5a4a" }))], [boxGeo(V(0.4, 0.55, 2.1), V(0.7, 0.75, 2.14)), lam("tail32", () => ({ color: "#ff5a4a" }))]] as [THREE.BufferGeometry, THREE.Material][]) cb.add(g, m);
    for (const [x, z] of [[-0.9, -1.35], [0.9, -1.35], [-0.9, 1.35], [0.9, 1.35]]) { const t = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18); t.rotateZ(Math.PI / 2); cb.add(t, tyre, new THREE.Matrix4().makeTranslation(x, 0.34, z)); }
    cb.build(this.car); this.car.position.set(5.2, 0, 7.8); this.porch.add(this.car);
    const boot = lam("boot32", () => ({ color: "#6b4a32" }));
    for (const dx of [0, 0.16]) { b.add(boxGeo(V(-2.45 + dx, P, -1.95), V(-2.33 + dx, P + 0.26, -1.82)), boot); b.add(boxGeo(V(-2.45 + dx, P, -1.82), V(-2.33 + dx, P + 0.09, -1.62)), boot); }
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

  private buildOffice() {
    const b = new Batch(), [ox] = OF, G = this.office;
    const wall = lam("offWall32", () => ({ color: "#c7ccd6" })), floor = lam("offFloor32", () => ({ map: tile(fabric("carpet", "#7d8696"), 1, 1) }));
    const desk = lam("desk32", () => ({ color: "#e9e6e0" })), deskLeg = lam("deskLeg32", () => ({ color: "#5d6270" })), frameM = lam("offFrame32", () => ({ color: "#4a505c" }));
    b.add(boxGeo(V(ox - 4, -0.1, -4), V(ox + 4, 0, 4), 1.2), floor);
    b.add(boxGeo(V(ox - 4, 0, -1.8), V(ox + 4, 0.7, -1.65)), wall); b.add(boxGeo(V(ox - 4, 2.6, -1.8), V(ox + 4, 3.2, -1.65)), wall);
    for (let x = -3.5; x <= 3.5; x += 1.2) b.add(boxGeo(V(ox + x - 0.04, 0.7, -1.76), V(ox + x + 0.04, 2.6, -1.68)), frameM);
    const city = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.9), new THREE.MeshBasicMaterial({ map: cityTex() })); city.position.set(ox, 1.65, -1.78); city.layers.set(NOINK); G.add(city);
    b.add(boxGeo(V(ox - 0.9, 0.72, -0.4), V(ox + 0.9, 0.78, 0.25)), desk);
    b.add(boxGeo(V(ox - 0.9, 0.0, 0.2), V(ox + 0.9, 0.72, 0.25)), desk);
    for (const x of [-0.85, 0.85]) b.add(boxGeo(V(ox + x - 0.03, 0, -0.38), V(ox + x + 0.03, 0.72, 0.2)), deskLeg);
    b.add(boxGeo(V(ox + 0.35, 0.78, -0.3), V(ox + 0.8, 1.12, -0.26)), deskLeg);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.29), emissive("#9cc8ff", 1.2)); scr.position.set(ox + 0.575, 0.95, -0.255); scr.layers.set(NOINK); G.add(scr);
    b.add(boxGeo(V(ox + 0.55, 0.78, -0.28), V(ox + 0.6, 0.79, -0.2)), deskLeg);
    b.add(boxGeo(V(ox - 0.7, 0.78, -0.2), V(ox - 0.45, 0.88, 0.0)), lam("mug32", () => ({ color: "#f2f2f2" })));
    b.build(G);
  }

  /** shots 3-19 (1-2 are staged inline above) */
  private stage(id: number, lt: number, t: number, f: number, front: any, side: any, fxl: any[], contact: any, q: (v: number, n?: number) => number, lid: (s: number) => number, cam: THREE.PerspectiveCamera) {
    const [ox] = IN, typ = (n: number) => q(Math.max(0, Math.sin(t * 15 + n)) * 6, 3);
    const SONT = { mode: "sit", expr: "numb", lookY: 1.5, lap: "laptop", handL: [262, 805 - typ(1)], handR: [338, 805 - typ(2)], glow: "#9cc8ff", glowK: 0.7, blink: lid(0.7) };
    const SUIT: Outfit = { ...SON, jacket: "#2b2e36", pants: "#23262e", boots: "#1e1e22" };
    const OLD: Outfit = { ...SON, jacket: DAD.jacket, plaid: DAD.plaid, pants: "#3f4a5e", boots: "#6b4a32" };
    const ease = smooth;
    switch (id) {
      case 3: { // couch: the son types, lit by his screen; Dad leans in with his old phone held out
        const ask = ease(seg(lt, 0.5, 1.4));
        front(SON, "son", ox - 0.42, 0.33, -0.88, SONT, 6);
        front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: -1, expr: ask > 0.5 ? "hopeful" : "warm", handR: [q(330 - 220 * ask, 2), q(840 - 200 * ask, 2)], holdR: "phone", screenK: 0.25, tilt: -6 * ask, blink: lid(0.3) }, 3);
        break;
      }
      case 4: { // the son takes it without looking, taps twice, hands it back; "Right... okay."
        const take = ease(seg(lt, 0.3, 0.8)), back = ease(seg(lt, 2.0, 2.5)), hold = take * (1 - back);
        const tap = lt > 0.9 && lt < 1.9 ? q(Math.max(0, Math.sin((lt - 0.9) * 2 * Math.PI * 2)) * 10, 2) : 0;
        front(SON, "son", ox - 0.42, 0.33, -0.88, { ...SONT, handR: hold > 0.05 ? [q(338 + 170 * hold, 2), q(805 - 150 * hold + tap, 2)] : [338, 805 - typ(2)], holdR: hold > 0.5 ? "phone" : null, screenK: 0.4, expr: lt > 1.9 && lt < 2.6 ? "stern" : "numb" }, 6);
        const dHand: [number, number] = hold > 0.5 ? [200, 720] : back > 0.5 ? [q(110 + 220 * back, 2), q(640 + 200 * back, 2)] : [110, 640];
        const hurt = ease(seg(lt, 2.4, 3.2));
        front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: -1, expr: hurt > 0.5 ? "hurt" : "hopeful", handR: dHand, holdR: hold > 0.5 ? null : "phone", screenK: 0.25, tilt: -5 * (1 - hurt), slump: 0.4 * hurt, lookY: hurt, blink: lid(0.3) }, 3);
        break;
      }
      case 5: { // Dad close: he waits... the phone in his lap, the shoulders drop, the smile goes; the "..." fades
        const slump = ease(seg(lt, 0.4, 2.6));
        front(SON, "son", ox - 0.42, 0.33, -0.88, SONT, 6);
        front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: -1, expr: slump < 0.35 ? "warm" : "hurt", handR: [330, 840], holdR: "phone", screenK: 0.25, slump: 0.4 + 0.6 * slump, lookY: 0.8 + 0.8 * slump, blink: lid(0.3) }, 3);
        const a = q(Math.max(0, 1 - seg(lt, 0.3, 2.4)), 15);
        if (a > 0) fxl.push({ key: `bubble${a}`, cw: 400, ch: 320, draw: (p: Pen) => bubble(p, a), x: ox + 0.78, y: 1.6 + 0.05 * (1 - a), z: -0.75, w: 0.34, h: 0.27, soft: true });
        break;
      }
      case 6: { // late night: the son asleep at the far end; Dad alone under the lamp, phone close, one slow finger
        front(SON, "son", ox - 0.42, 0.33, -0.88, { mode: "sit", expr: "numb", blink: 1, headTilt: 16, lap: "laptop", handL: [262, 815], handR: [338, 815] }, 6);
        const poke = q(Math.max(0, Math.sin(lt * 2.6)) * 14, 2);
        front(DAD, "dad", ox + 0.42, 0.33, -0.9, { mode: "sit", facing: 0, expr: lt > 2.6 ? "hurt" : "numb", handR: [330, 700], holdR: "phone", screenK: 0.7, handL: [282, 690 - poke], lookY: 1.2, glow: "#cfe0ff", glowK: 0.3, slump: 0.3, blink: lid(0.3) }, 3);
        break;
      }
      case 7: { // he covers his sleeping son with a quilt, then takes a photo (flash) and smiles
        front(SON, "son", ox - 0.42, 0.33, -0.88, { mode: "sit", expr: "numb", blink: 1, headTilt: 16, lap: "laptop", handL: [262, 815], handR: [338, 815] }, 6);
        const cover = ease(seg(lt, 0.3, 1.5)), raise = ease(seg(lt, 1.9, 2.5)), flash = seg(lt, 2.75, 3.15);
        const hl: [number, number] | null = cover < 1 && lt < 1.7 ? [q(180 - 60 * cover, 2), q(640 + 120 * cover, 2)] : null;
        front(DAD, "dad", ox + 0.18, 0, -0.32, { mode: "stand", facing: -1, expr: lt > 3.0 ? "tender" : "warm", handL: hl, handR: raise > 0.05 ? [q(400 - 60 * raise, 2), q(640 - 220 * raise, 2)] : null, holdR: "phone", screenK: 0.4, lookY: lt < 1.8 ? 1.0 : 0.2, blink: lid(0.3) }, 3);
        contact(ox + 0.18, 0, -0.32);
        fxl.push({ key: "quilt", cw: 600, ch: 390, draw: quilt, x: ox - 0.42, y: 0.55 + 0.32 * cover, z: -0.7, w: 0.95, h: 0.62 * (0.25 + 0.75 * cover) });
        if (flash > 0 && flash < 1) { const a = q(Math.sin(flash * Math.PI), 10); fxl.push({ key: `flash${a}`, cw: 400, ch: 400, draw: (p: Pen) => flashFx(p, a), x: ox - 0.05, y: 1.45, z: -0.25, w: 1.8, h: 1.8, soft: true }); }
        break;
      }
      case 8: { // morning by the car: "Stay one more day?" / "Can't, Dad. Big week."
        const reply = lt > 2.3;
        front(SON, "son", 3.95, 0, 6.5, { mode: "stand", expr: reply ? "numb" : "neutral", holdR: "phone", handR: [390, 640], lookY: reply ? 0.4 : 1.2, blink: lid(0.7) }, 6);
        front(DAD, "dad", 3.05, 0, 6.1, { mode: "stand", facing: 1, expr: reply ? "hurt" : "hopeful", slump: reply ? 0.3 : 0, blink: lid(0.3) }, 3);
        contact(3.95, 0, 6.5); contact(3.05, 0, 6.1);
        break;
      }
      case 9: { // the car pulls away; Dad on the porch step waves, then raises his phone for one more photo
        const raise = ease(seg(lt, 1.6, 2.2));
        front(DAD, "dad", 0.3, PORCH_Y, 0.05, { mode: "stand", expr: lt > 2.6 ? "hurt" : "warm", wave: raise < 0.5 ? q(Math.sin(t * 7), 20) : undefined, handR: raise >= 0.5 ? [420, 430] : null, holdR: raise >= 0.5 ? "phone" : null, screenK: 0.4, blink: lid(0.3) }, 3);
        contact(0.3, PORCH_Y, 0.05);
        break;
      }
      case 12: { // office: the texts. His face falls; the phone slowly comes down
        const fall = ease(seg(lt, 0.8, 1.6)), low = ease(seg(lt, 2.6, 3.9));
        const expr = lt < 0.8 ? "numb" : lt < 1.7 ? "shock" : "sad";
        front(SON, "son", OF[0], 0.3, -0.62, { mode: "sit", expr, handR: [330, q(650 + 120 * low, 2)], handL: [270, q(660 + 120 * low, 2)], holdR: "phone", screenK: 0.8, glow: "#cfe6ff", glowK: 0.55 * (1 - low * 0.5), lookY: 1.2 * (1 - fall * 0.4) + 0.6 * low, slump: 0.5 * low, tear: lt > 3.0 ? q(seg(lt, 3.0, 4.0), 20) : 0, blink: lt < 1.7 ? lid(0.7) : 0 }, 6);
        break;
      }
      case 13: { // rain: Dad's empty rocking chair, his flannel on the back, his boots
        fxl.push({ key: "shirt", cw: 320, ch: 340, draw: shirtFx, x: -2.95, y: PORCH_Y + 1.0, z: -2.2, w: 0.5, h: 0.54 });
        this.rain(t, cam, fxl, q);
        break;
      }
      case 14: { // night, alone: Dad's glasses and phone on the cushion where he sat; the son reaches for them
        const reach = ease(seg(lt, 1.6, 2.8)), lift = ease(seg(lt, 2.8, 3.6));
        front(SUIT, "suit", ox - 0.3, 0.33, -0.88, { mode: "sit", expr: "numb", slump: 0.6, lookY: 1.4, handR: reach > 0.05 ? [q(338 + 110 * reach * (1 - lift), 2), q(840 - 200 * lift, 2)] : null, holdR: lift > 0.3 ? "phone" : null, screenK: 0.15, blink: lid(0.7) }, 6);
        fxl.push({ key: "glasses", cw: 240, ch: 120, draw: glassesFx, x: ox + 0.5, y: 0.535, z: -1.0, w: 0.26, h: 0.13, flat: true, rot: 0.3 });
        if (lift < 0.3) fxl.push({ key: "phoneFlat", cw: 120, ch: 210, draw: phoneFx, x: ox + 0.3, y: 0.535, z: -0.95, w: 0.08, h: 0.15, flat: true, rot: -0.4 });
        break;
      }
      case 16: { // he breaks down: the phone pressed to his chest, shoulders shaking, tears
        const shake = q(Math.sin(t * 9) * 1.6 * seg(lt, 0.4, 1.0), 4);
        front(SUIT, "suit", ox, 0.33, -0.88, { mode: "sit", expr: "cry", tear: q((lt * 0.8) % 1, 10), slump: 0.7, tilt: shake, handL: [272, 600], handR: [330, 600], holdR: "phone", screenK: 0.15, lookY: 0.6 }, 6);
        fxl.push({ key: "glasses", cw: 240, ch: 120, draw: glassesFx, x: ox + 0.55, y: 0.535, z: -1.0, w: 0.26, h: 0.13, flat: true, rot: 0.3 });
        break;
      }
      case 17: { // years later: he sits in Dad's rocking chair in Dad's flannel; his little boy runs up with a phone
        const look = lt > 3.4;
        front(OLD, "old", -2.95, PORCH_Y + 0.3, -1.66, look ? { mode: "sit", expr: "warm", lap: "laptop", handL: [262, 805], handR: [338, 805], facing: 1, blink: lid(0.7) } : { ...SONT, glow: undefined, glowK: 0 }, 6);
        const run = ease(seg(lt, 0.2, 2.4)), x = -4.25 + 0.7 * run, z = -0.9 - 0.85 * run;
        side(BOY, "boy", x, PORCH_Y, z, { mode: run < 1 ? "walk" : "stand", phase: q((t * 2.4) % 1, 30), stride: 0.6, expr: "grin", hold: "phone", screenK: 0.6, blink: lid(0.5) }, 8, false);
        contact(x, PORCH_Y, z, 0.4);
        break;
      }
      case 18: { // he closes the laptop, pulls the boy onto his lap and shows him slowly
        const close = ease(seg(lt, 0.2, 0.7)), climb = ease(seg(lt, 0.7, 1.6));
        const point = q(Math.max(0, Math.sin(lt * 1.6)) * 12, 2);
        front(OLD, "old", -2.95, PORCH_Y + 0.3, -1.66, { mode: "sit", expr: lt > 2.2 ? "tender" : "warm", lap: close < 0.5 ? "laptop" : null, handL: climb > 0.5 ? [255, 790] : [262, 805], handR: climb > 0.5 ? [q(345 + point * 0.4, 2), q(700 + point, 2)] : [338, 805], lookY: 0.9, blink: lid(0.7) }, 6);
        if (climb > 0) {
          const bx = -3.05 - 0.5 * (1 - climb), by = PORCH_Y + 0.3 + 0.06 * climb;
          front(BOY, "boy", bx, by, -1.6, { mode: "sit", expr: lt > 3.4 ? "laugh" : "grin", handR: [360, 640], holdR: "phone", screenK: 0.6, glow: "#cfe6ff", glowK: 0.25, lookY: 1.0, blink: lid(0.5) }, 8, 0.6);
        } else side(BOY, "boy", -3.55, PORCH_Y, -1.75, { mode: "stand", expr: "grin", hold: "phone", screenK: 0.6 }, 8, false);
        break;
      }
      case 19: { // last wide: the two of them in the rocking chair at sunset
        front(OLD, "old", -2.95, PORCH_Y + 0.3, -1.66, { mode: "sit", expr: "tender", handL: [255, 790], handR: [345, 700], lookY: 0.9 }, 6);
        front(BOY, "boy", -3.05, PORCH_Y + 0.36, -1.6, { mode: "sit", expr: "laugh", handR: [360, 640], holdR: "phone", screenK: 0.6, lookY: 1.0 }, 8, 0.6);
        break;
      }
    }
  }
  private rain(t: number, cam: THREE.PerspectiveCamera, fxl: any[], q: (v: number, n?: number) => number) {
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), fwd = V(0, 0, 0); cam.getWorldDirection(fwd);
    for (let i = 0; i < 140; i++) {
      const h1 = Math.sin(i * 127.1) * 43758.5453 % 1, h2 = Math.sin(i * 311.7) * 12345.678 % 1, d = 2.2 + Math.abs(h2) * 6;
      const y = 3.2 - (((t * 7 + Math.abs(h1) * 9) % 4.2)), p = cam.position.clone().addScaledVector(fwd, d).addScaledVector(right, (h1) * d * 0.6);
      fxl.push({ key: "streak", cw: 32, ch: 128, draw: streak, x: p.x, y, z: p.z, w: 0.02 * (1 + d * 0.15), h: 0.32 * (1 + d * 0.1), soft: true, rot: 0.08 });
    }
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, keepCam = false) {
    const s = shotAt(f), t = f / FPS, lt = (f - s.a) / FPS, Lp = PRESET[s.light];
    const c = camAt(f);
    if (!keepCam) { cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    this.porch.visible = s.place === "porch"; this.living.visible = s.place === "living"; this.office.visible = s.place === "office";
    // light rig: sun (or lamp) as a far directional light toward SUN[id]
    const dir = SUN[s.id];
    this.hemi.color.set(Lp.sky); this.hemi.groundColor.set(Lp.ground); this.hemi.intensity = Lp.hemiI;
    this.sun.color.set(Lp.sunCol); this.sun.intensity = Lp.sunI;
    const Rr = s.place === "porch" ? THREE.MathUtils.clamp(dist * 1.2 + 6, 10, s.id === 9 ? 40 : 30) : 6;
    this.sun.position.copy(focus).addScaledVector(dir, s.place === "porch" ? 120 : 12); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix();
    this.sun.shadow.bias = Lp.bias; this.sun.shadow.normalBias = Lp.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...Lp.lit); TONE.uShadeCol.value.set(...Lp.shade); TONE.uShadeLift.value.set(...Lp.lift);
    TONE.uLambert.value = Lp.lambert; TONE.uSideK.value = Lp.sideK; TONE.uTerm.value = Lp.term; TONE.uBounce.value.set(...LOOK.golden.bounce); TONE.uSat.value = LOOK.golden.sat;
    CHAR.uCharTint.value.set(...Lp.charTint); CHAR.uCharShade.value = Lp.charShade; CHAR.uGrad.value = Lp.charGrad; CHAR.uBodyGrad.value = Lp.bodyGrad; CHAR.uSideTint.value.set(...Lp.sideTint);
    // sky, fog, sun disc
    const K = SKY[s.light] ?? LOOK.golden.sky, su = this.skyMat.uniforms;
    K.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.sky.visible = s.place === "porch";
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar; scene.fog = this.fog; scene.background = s.place === "porch" ? null : new THREE.Color(s.place === "office" ? "#cfd6e2" : "#120e18");
    const showSun = s.place === "porch" && s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    for (const m of this.clouds) { m.visible = s.place === "porch" && s.light !== "rain"; m.lookAt(cam.position.x, m.position.y, cam.position.z); }
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(dir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.8)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(Lp.sunDisc).multiplyScalar(1.3);
    }
    // the lamp breathes a little (a real bulb), windows glow
    if (this.lampGlow) (this.lampGlow.material as THREE.MeshBasicMaterial).color.set("#ffd49a").multiplyScalar((s.light === "night" ? 1.25 : 1.85) + 0.05 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
    for (const w of this.winGlow) (w.material as THREE.MeshBasicMaterial).color.set(s.light === "golden" ? "#ffc477" : "#8a8f99").multiplyScalar(s.light === "golden" ? 1.4 : 0.6);
    if (s.id === 9) { const k = seg(lt, 0.6, 4.0); this.car.position.set(5.2, 0, 7.8 + 26 * k ** 1.6); } else this.car.position.set(5.2, 0, 7.8);
    this.car.visible = s.id <= 9;
    // ---- cast ----
    const places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; mirror?: boolean; yaw?: number; size: [number, number, number]; scale?: number }[] = [];
    const fxl: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number }[] = [];
    const tierOf = (x: number, y: number, z: number): [number, number, number] => { const d = cam.position.distanceTo(V(x, y + 1, z)); return d < 2.2 ? [1800, 3000, 3] : d < 5 ? [1080, 1800, 1.8] : [600, 1000, 1]; };
    const q = (v: number, n = 60) => Math.round(v * n) / n;
    const lid = (seed: number) => { const fr = f + Math.round(seed * 37); const k = fr % Math.round(55 + 30 * ((seed * 13) % 1)); return k < 4 ? [0.5, 1, 1, 0.5][k] : 0; };
    const front = (o: Outfit, ok: string, x: number, y: number, z: number, fo: FrontOpts, seed: number, scale = 1) => {
      const fo2 = { ...fo, seed, light: -2.2 }, key = `F|${ok}|${JSON.stringify(fo2, (_k, v) => (typeof v === "number" ? q(v) : v))}`;
      places.push({ key, draw: (p) => bodyFront(p, o, fo2), x, y, z, size: tierOf(x, y, z), scale });
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
      const pop = (t0: number) => { const u = seg(t, t0, t0 + 0.35); return u <= 0 ? 0 : (u < 1 ? smooth(u) * (1 + 0.25 * Math.sin(u * Math.PI)) : 1) * (1 - seg(t, 2.15, 2.5)); };
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
    } else if (s.place === "living" || s.place === "office" || s.place === "porch") this.stage(s.id, lt, t, f, front, side, fxl, contact, q, lid, cam);
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

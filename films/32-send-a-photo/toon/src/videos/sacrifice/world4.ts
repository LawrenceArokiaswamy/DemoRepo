// Film 33 world: a kitchen with the dinner table, the street with the shoe store and the guard booth, a campus lawn,
// and the living room (Mom's sofa, the lamp, Dad's wardrobe, the front door). Same look as film 32 (two-tone painted
// materials, ink lines, flat ink cartoon cards lit by the scene, sun disc + halo, lens blur).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { ctex, rep, planksHD, grassHD, cloudHD, jit } from "../bridge/paint";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, bodySide, fxContact, FrontOpts, SideOpts, Outfit } from "../sendphoto/toon2";
import { DAD, YDAD, GUARD, MOM, OLDMOM, KID, KIDNEW, KIDJACKET, TEEN, SON, GRAD, FRIEND1, FRIEND2, SUIT } from "./people4";
import * as PR from "./props4";
import { FPS, IN, KI, ST, CA, Light, camAt, shotAt, seg, smooth, V3 } from "./story4";

// ---------------- light presets ----------------
const LAMP: LightPreset = {
  ...LIGHTS.golden, az: -55, el: 24,
  lit: [1.5, 1.05, 0.66], shade: [0.3, 0.24, 0.38], lift: [0.04, 0.04, 0.1], lambert: 0.45, sideK: 0.8, term: 0.12,
  charTint: [1.0, 0.84, 0.66], charShade: 0.84, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.8, 0.8, 0.98],
  actorShadow: true, fog: "#2a2436", fogNear: 400, fogFar: 900, sunCol: "#ffb36b", sunI: 4.5, bias: -0.0008, normalBias: 0.02,
};
const NIGHT: LightPreset = { ...LAMP, lit: [1.2, 0.85, 0.56], shade: [0.2, 0.2, 0.36], lift: [0.03, 0.04, 0.12], charTint: [0.92, 0.8, 0.7], sunI: 3.2 };
const MORNING: LightPreset = { ...LIGHTS.day, az: 30, el: 22, lit: [1.45, 1.38, 1.25], shade: [0.42, 0.44, 0.58], lift: [0.05, 0.06, 0.12], fogNear: 30, fogFar: 260, fog: "#d4dcea", actorShadow: true };
const RAIN: LightPreset = { ...LIGHTS.day, lit: [0.7, 0.78, 0.98], shade: [0.26, 0.3, 0.46], lift: [0.04, 0.05, 0.12], lambert: 0.25, charTint: [0.78, 0.84, 1.0], fog: "#3a4560", fogNear: 6, fogFar: 60, actorShadow: false };
const STREET: LightPreset = { ...NIGHT, lit: [1.35, 1.0, 0.7], shade: [0.16, 0.18, 0.32], lift: [0.03, 0.04, 0.12], fog: "#1c2236", fogNear: 10, fogFar: 80 };
const PRESET: Record<Light, LightPreset> = { golden: LIGHTS.golden, lamp: LAMP, night: NIGHT, morning: MORNING, rain: RAIN, street: STREET };
const SKY: Record<string, { c: string[]; e: number[] }> = {
  golden: LOOK.golden.sky, morning: LOOK.day.sky,
  rain: { c: ["#3c4660", "#384158", "#323a50", "#2c3448", "#262d40"], e: [0, 4, 10, 20, 40] },
  street: { c: ["#2a2f4a", "#232842", "#1d2238", "#171b2f", "#121526"], e: [0, 4, 10, 20, 40] },
};
const SUN: Record<number, THREE.Vector3> = {
  1: V(-0.4, 0.5, 0.75).normalize(), 2: V(-0.55, 0.25, 0.8).normalize(), 3: V(-0.5, 0.25, 0.83).normalize(), 4: V(0.3, 0.8, 0.5).normalize(),
  5: V(0.6, 0.4, 0.7).normalize(), 6: V(0.6, 0.4, 0.7).normalize(), 7: V(0.0, 0.85, 0.5).normalize(), 8: V(0.2, 0.8, 0.55).normalize(),
  9: V(-0.2, 0.7, 0.7).normalize(), 10: V(-0.5, 0.45, 0.75).normalize(), 11: V(-0.6, 0.22, 0.77).normalize(), 12: V(-0.6, 0.22, 0.77).normalize(),
  15: V(-0.7, 0.45, 0.55).normalize(), 16: V(-0.3, 0.85, 0.4).normalize(), 17: V(-0.3, 0.85, 0.4).normalize(),
  18: V(0.55, 0.4, 0.73).normalize(), 19: V(0.55, 0.4, 0.73).normalize(), 20: V(0.45, 0.45, 0.77).normalize(),
};

// ---------------- painted textures ----------------
const wallpaper = () => ctex("wallpaper33", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9b98a"; g.fillRect(0, 0, 1024, 1024);
  for (let x = 0; x < 1024; x += 128) { g.fillStyle = "#cfa978"; g.fillRect(x, 0, 52, 1024); g.fillStyle = "rgba(255,240,210,0.25)"; g.fillRect(x + 60, 0, 6, 1024); }
  for (let y = 40; y < 1024; y += 120) for (let x = 90; x < 1024; x += 128) { g.fillStyle = "#b98d63"; g.beginPath(); g.ellipse(x + (y % 240 ? 0 : 64), y, 7, 11, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,60,40,${0.04 * r()})`; g.fillRect(r() * 1024, r() * 1024, 3, 3); }
});
const fabric = (key: string, col: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2); }
});
const rugTex = () => ctex("rug33", 1024, 640, (g) => {
  g.fillStyle = "#8f3b34"; g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = "#e3c27a"; g.lineWidth = 18; g.strokeRect(40, 40, 944, 560); g.lineWidth = 6; g.strokeRect(80, 80, 864, 480);
  g.fillStyle = "#2f4a6a"; g.beginPath(); g.ellipse(512, 320, 210, 130, 0, 0, Math.PI * 2); g.fill();
});
const tiles = () => ctex("tiles33", 512, 512, (g, r) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? jit(r, "#e9e2d2", 0.02, 3, 0.05) : jit(r, "#c9d6d2", 0.02, 3, 0.05); g.fillRect(x * 64, y * 64, 64, 64); }
  g.strokeStyle = "rgba(80,70,60,0.35)"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
});
const kitchenWall = () => ctex("kwall33", 512, 512, (g, r) => {
  g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(120,90,50,${0.05 * r()})`; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const brick = (key: string, col: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = "#7a6a62"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) { g.fillStyle = jit(r, col, 0.06, 6, 0.15); g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); }
});
const asphalt = () => ctex("asph33", 512, 512, (g, r) => { g.fillStyle = "#4a4c55"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const pavement = () => ctex("pave33", 512, 512, (g, r) => {
  g.fillStyle = "#bdb8ae"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(70,60,60,0.4)"; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(60,50,40,${0.06 * r()})`; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
/** shop window interior: warm shelves of shoes */
const shopInside = () => ctex("shop33", 1024, 640, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, "#fff1d6"); gr.addColorStop(1, "#f2c98e"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 640);
  for (const y of [190, 380]) { g.fillStyle = "#a26b3c"; g.fillRect(0, y, 1024, 18); for (let x = 30; x < 1000; x += 120) { if (y === 380 && x > 300 && x < 720) continue; g.fillStyle = jit(r, "#5c7fb0", 0.3, 40, 0.2); g.beginPath(); g.ellipse(x + 40, y - 18, 44, 18, 0, 0, Math.PI * 2); g.fill(); } }
  g.fillStyle = "#e9d2ad"; g.fillRect(300, 470, 420, 170);
});
const memoryPic = () => ctex("memory33", 600, 760, (g) => {
  g.fillStyle = "#f3e7cc"; g.fillRect(0, 0, 600, 760);
  const sky = g.createLinearGradient(0, 0, 0, 760); sky.addColorStop(0, "#9fd0f0"); sky.addColorStop(1, "#f6e2b8"); g.fillStyle = sky; g.fillRect(30, 30, 540, 700);
  g.fillStyle = "#7cbf5a"; g.fillRect(30, 560, 540, 170);
  g.save(); g.translate(40, 170); g.scale(0.5, 0.5); bodyFront(new Pen(g), YDAD, { mode: "stand", expr: "laugh", seed: 3 }); g.restore();
  g.save(); g.translate(300, 170); g.scale(0.5, 0.5); bodyFront(new Pen(g), { ...MOM, hair: "#5a3b2a" }, { mode: "stand", expr: "laugh", seed: 5 }); g.restore();
  g.save(); g.translate(185, 330); g.scale(0.38, 0.38); bodyFront(new Pen(g), KID, { mode: "stand", expr: "laugh", seed: 8 }); g.restore();
});
const discTex = () => ctex("sunDisc33", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const haloTex = () => ctex("sunHalo33", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128, a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const cardTex = (key: string, w: number, h: number, draw: (p: Pen) => void) => ctex(key, w, h, (g) => { g.clearRect(0, 0, w, h); draw(new Pen(g)); });
const emissive = (col: string, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) });
const tile = (t: THREE.Texture, x: number, y: number) => rep(t, x, y);
const signMesh = (G: THREE.Group, tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry = 0, glow = 1) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: new THREE.Color(glow, glow, glow) }));
  m.position.set(x, y, z); m.rotation.y = ry; m.layers.set(NOINK); G.add(m); return m;
};

type FxItem = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number; yaw?: number };

export class World4 {
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
  private living = new THREE.Group(); private kitchen = new THREE.Group(); private street = new THREE.Group(); private campus = new THREE.Group();
  private lampGlow!: THREE.Mesh; private boothGlow!: THREE.Mesh; private shopGlow!: THREE.Mesh; private pendant!: THREE.Mesh; private kWin!: THREE.Mesh; private lWin!: THREE.Mesh;

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
    R.add(this.living, this.kitchen, this.street, this.campus);
    this.buildLiving(); this.buildKitchen(); this.buildStreet(); this.buildCampus();
  }

  // ---------------- living room: sofa, lamp, bookshelf, family picture; Dad's wardrobe (right wall), front door ----------------
  private buildLiving() {
    const b = new Batch(), [ox] = IN, G = this.living;
    const wall = lam("wallpaper33", () => ({ map: tile(wallpaper(), 1, 1) }));
    const floor = lam("floor33", () => ({ map: tile(planksHD(), 1, 1), color: "#a77c58" }));
    const sofa = lam("sofa33", () => ({ map: tile(fabric("sofaF33", "#4f7a78"), 1, 1) })), sofaD = lam("sofaD33", () => ({ map: tile(fabric("sofaD33", "#3f6462"), 1, 1) }));
    const wood = lam("woodIn33", () => ({ color: "#6e4a32" })), trim = lam("trimIn33", () => ({ color: "#efe3cf" })), ceil = lam("ceil33", () => ({ color: "#e9dcc6" }));
    const rug = lam("rug33", () => ({ map: rugTex() })), shadeM = lam("lampBase33", () => ({ color: "#c9b48a" }));
    b.add(boxGeo(V(ox - 4, -0.1, -4), V(ox + 4, 0, 4), 1.4), floor);
    b.add(boxGeo(V(ox - 4, 0, -1.9), V(ox + 4, 3, -1.75), 1.6), wall);
    b.add(boxGeo(V(ox - 3.2, 0, -1.9), V(ox - 3.05, 3, 4), 1.6), wall); b.add(boxGeo(V(ox + 3.05, 0, -1.9), V(ox + 3.2, 3, 4), 1.6), wall);
    b.add(boxGeo(V(ox - 4, 3, -2), V(ox + 4, 3.1, 4)), ceil);
    b.add(boxGeo(V(ox - 4, 0, -1.76), V(ox + 4, 0.14, -1.7)), trim);
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), rug); rg.rotation.x = -Math.PI / 2; rg.position.set(ox, 0.006, 0.35); rg.receiveShadow = true; G.add(rg);
    b.add(boxGeo(V(ox - 1.25, 0.08, -1.7), V(ox + 1.25, 0.42, -0.62)), sofaD);
    b.add(boxGeo(V(ox - 1.2, 0.42, -1.55), V(ox + 1.2, 0.52, -0.66), 0.8), sofa);
    b.add(boxGeo(V(ox - 1.25, 0.42, -1.75), V(ox + 1.25, 1.12, -1.38)), sofaD);
    for (const s of [-1, 1]) b.add(boxGeo(V(ox + s * 1.25 - 0.17, 0.08, -1.75), V(ox + s * 1.25 + 0.17, 0.72, -0.6)), sofaD);
    // side table + lamp
    b.add(boxGeo(V(ox + 1.45, 0, -1.55), V(ox + 1.95, 0.58, -1.05)), wood);
    b.add(new THREE.CylinderGeometry(0.07, 0.1, 0.32, 14), shadeM, new THREE.Matrix4().makeTranslation(ox + 1.7, 0.74, -1.3));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.3, 24, 1, true), emissive("#ffd49a", 1.9)); shade.position.set(ox + 1.7, 1.03, -1.3); shade.layers.set(NOINK); G.add(shade); this.lampGlow = shade;
    // window (left wall), curtains
    this.lWin = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), emissive("#3c5688", 1.0)); this.lWin.position.set(ox - 3.04, 1.65, -0.5); this.lWin.rotation.y = Math.PI / 2; this.lWin.layers.set(NOINK); G.add(this.lWin);
    b.add(boxGeo(V(ox - 3.05, 0.9, -1.27), V(ox - 3.0, 2.4, -1.15)), trim); b.add(boxGeo(V(ox - 3.05, 0.9, 0.15), V(ox - 3.0, 2.4, 0.27)), trim);
    b.add(boxGeo(V(ox - 3.05, 0.9, -1.25), V(ox - 3.0, 0.98, 0.25)), trim); b.add(boxGeo(V(ox - 3.05, 2.32, -1.25), V(ox - 3.0, 2.4, 0.25)), trim);
    for (const z of [-1.55, 0.55]) b.add(boxGeo(V(ox - 3.04, 0.6, z - 0.25), V(ox - 2.96, 2.6, z + 0.25)), lam("curtain33", () => ({ map: tile(fabric("curt33", "#9a5a4a"), 1, 1) })));
    // family picture over the sofa (Dad, Mom and the little boy, laughing), two small frames
    const frame = lam("frame33", () => ({ color: "#4a3022" }));
    b.add(boxGeo(V(ox - 0.42, 1.45, -1.75), V(ox + 0.42, 2.5, -1.7)), frame);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.92), new THREE.MeshLambertMaterial({ map: memoryPic() })); pic.position.set(ox, 1.975, -1.69); G.add(pic);
    for (const x of [-1.0, 0.9]) { b.add(boxGeo(V(ox + x - 0.2, 1.7, -1.75), V(ox + x + 0.2, 2.15, -1.71)), frame); b.add(boxGeo(V(ox + x - 0.16, 1.74, -1.71), V(ox + x + 0.16, 2.11, -1.7)), lam("photoW33", () => ({ color: "#d9c7a5" }))); }
    // bookshelf at the left
    b.add(boxGeo(V(ox - 2.8, 0, -1.7), V(ox - 1.8, 2.0, -1.35)), wood);
    const bookC = ["#b5523f", "#3f6fb5", "#d9a441", "#5d7a3a", "#7b5ac9"];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) b.add(boxGeo(V(ox - 2.72 + k * 0.12, 0.12 + r * 0.48, -1.38), V(ox - 2.63 + k * 0.12, 0.42 + r * 0.48 - ((k * 7 + r) % 3) * 0.04, -1.34)), lam("bk33" + ((k + r) % 5), () => ({ color: bookC[(k + r) % 5] })));
    // Dad's wardrobe on the right wall, doors open: rod, shelf (the old shoebox, his cracked phone)
    const wd = lam("wardrobe33", () => ({ color: "#7a5236" })), wdIn = lam("wardIn33", () => ({ color: "#4a3324" }));
    b.add(boxGeo(V(ox + 2.45, 0, -0.55), V(ox + 3.05, 2.1, -0.5)), wd); b.add(boxGeo(V(ox + 2.45, 0, 0.7), V(ox + 3.05, 2.1, 0.75)), wd);
    b.add(boxGeo(V(ox + 2.45, 2.05, -0.55), V(ox + 3.05, 2.12, 0.75)), wd); b.add(boxGeo(V(ox + 2.45, 0, -0.55), V(ox + 3.05, 0.08, 0.75)), wd);
    b.add(boxGeo(V(ox + 3.0, 0, -0.5), V(ox + 3.05, 2.05, 0.7)), wdIn);
    b.add(boxGeo(V(ox + 2.5, 1.62, -0.5), V(ox + 3.0, 1.66, 0.7)), wd); // shelf
    b.add(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8), lam("rod33", () => ({ color: "#9a9a9a" })), new THREE.Matrix4().compose(V(ox + 2.75, 1.5, 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)));
    for (const [z, a] of [[-0.55, -0.9], [0.75, 0.9]] as const) b.add(new THREE.BoxGeometry(0.04, 2.0, 0.62), wd, new THREE.Matrix4().compose(V(ox + 2.45 - Math.sin(Math.abs(a)) * 0.31, 1.05, z + Math.sign(a) * Math.cos(Math.abs(a)) * 0.31), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), V(1, 1, 1)));
    b.add(boxGeo(V(ox + 2.6, 1.66, 0.25), V(ox + 2.95, 1.8, 0.62)), lam("shoebox33", () => ({ color: "#e07a2e" })));
    // the front door (right wall, near the camera side)
    b.add(boxGeo(V(ox + 3.0, 0, 1.3), V(ox + 3.04, 2.1, 2.2)), lam("door33", () => ({ color: "#5b7a6a" }))); b.add(boxGeo(V(ox + 2.98, 0, 1.24), V(ox + 3.04, 2.18, 1.3)), trim); b.add(boxGeo(V(ox + 2.98, 0, 2.2), V(ox + 3.04, 2.18, 2.26)), trim);
    b.add(new THREE.SphereGeometry(0.035, 10, 8), lam("knob33", () => ({ color: "#d9b45a" })), new THREE.Matrix4().makeTranslation(ox + 2.97, 1.0, 2.05));
    // a low stool in front of the wardrobe (the shoebox and the envelope are opened on it)
    b.add(boxGeo(V(ox + 1.7, 0.0, 0.85), V(ox + 2.2, 0.58, 1.25)), wood);
    b.build(G);
  }

  // ---------------- kitchen: tiles, cabinets, fridge, window, pendant lamp, table with three chairs ----------------
  private buildKitchen() {
    const b = new Batch(), [ox] = KI, G = this.kitchen;
    const fl = lam("ktiles33", () => ({ map: tile(tiles(), 1, 1) })), wall = lam("kwallM33", () => ({ map: tile(kitchenWall(), 1, 1) }));
    const cab = lam("cab33", () => ({ color: "#7aa08a" })), top = lam("ktop33", () => ({ color: "#e9e2d2" })), wood = lam("kwood33", () => ({ color: "#9a6a42" })), white = lam("kwhite33", () => ({ color: "#f1efe9" }));
    b.add(boxGeo(V(ox - 4, -0.1, -4), V(ox + 4, 0, 4), 1.2), fl);
    b.add(boxGeo(V(ox - 4, 0, -2.0), V(ox + 4, 3, -1.85), 1.4), wall);
    b.add(boxGeo(V(ox - 3.2, 0, -2), V(ox - 3.05, 3, 4), 1.4), wall); b.add(boxGeo(V(ox + 3.05, 0, -2), V(ox + 3.2, 3, 4), 1.4), wall);
    // counter + upper cabinets + fridge
    b.add(boxGeo(V(ox - 2.9, 0, -1.85), V(ox + 0.6, 0.86, -1.3)), cab); b.add(boxGeo(V(ox - 2.95, 0.86, -1.88), V(ox + 0.65, 0.92, -1.26)), top);
    for (let x = -2.8; x < 0.6; x += 0.6) b.add(boxGeo(V(ox + x + 0.05, 0.1, -1.29), V(ox + x + 0.52, 0.8, -1.27)), lam("cabF33", () => ({ color: "#8bb39b" })));
    b.add(boxGeo(V(ox - 2.9, 1.6, -1.85), V(ox - 0.9, 2.3, -1.5)), cab);
    b.add(boxGeo(V(ox + 1.0, 0, -1.85), V(ox + 1.8, 2.0, -1.2)), white); b.add(boxGeo(V(ox + 1.02, 1.25, -1.2), V(ox + 1.78, 1.27, -1.18)), lam("fridgeL33", () => ({ color: "#b9b9b9" })));
    b.add(boxGeo(V(ox + 1.65, 1.35, -1.2), V(ox + 1.69, 1.8, -1.15)), lam("fridgeH33", () => ({ color: "#9a9a9a" })));
    // window over the counter
    this.kWin = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), emissive("#bfe0ff", 1.2)); this.kWin.position.set(ox + 0.0, 1.55, -1.84); this.kWin.layers.set(NOINK); G.add(this.kWin);
    b.add(boxGeo(V(ox - 0.6, 1.12, -1.86), V(ox + 0.6, 1.17, -1.8)), white); b.add(boxGeo(V(ox - 0.6, 1.93, -1.86), V(ox + 0.6, 1.98, -1.8)), white);
    b.add(boxGeo(V(ox - 0.03, 1.15, -1.85), V(ox + 0.03, 1.95, -1.8)), white);
    // pots + kettle
    b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16), lam("pot33", () => ({ color: "#c0673f" })), new THREE.Matrix4().makeTranslation(ox - 1.8, 1.0, -1.55));
    b.add(new THREE.SphereGeometry(0.11, 14, 10), lam("kettle33", () => ({ color: "#d9d4c6" })), new THREE.Matrix4().makeTranslation(ox - 1.2, 1.02, -1.55));
    // the dinner table (top at 0.76) and three chairs
    b.add(boxGeo(V(ox - 0.95, 0.72, -1.0), V(ox + 0.95, 0.77, 0.05)), wood);
    for (const [x, z] of [[-0.88, -0.93], [0.88, -0.93], [-0.88, -0.02], [0.88, -0.02]]) b.add(boxGeo(V(ox + x - 0.04, 0, z - 0.04), V(ox + x + 0.04, 0.72, z + 0.04)), wood);
    const cloth = lam("cloth33", () => ({ map: tile(fabric("clothF33", "#e8d9b8"), 1, 1) }));
    b.add(boxGeo(V(ox - 0.7, 0.77, -0.95), V(ox + 0.7, 0.775, -0.05)), cloth);
    for (const x of [-0.62, 0, 0.62]) { b.add(boxGeo(V(ox + x - 0.22, 0.42, -1.45), V(ox + x + 0.22, 0.47, -1.05)), wood); b.add(boxGeo(V(ox + x - 0.22, 0.47, -1.47), V(ox + x + 0.22, 1.15, -1.43)), wood); }
    // pendant lamp over the table
    b.add(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 6), lam("cord33", () => ({ color: "#2a2a2a" })), new THREE.Matrix4().makeTranslation(ox, 2.5, -0.5));
    this.pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.28, 0.22, 24, 1, true), emissive("#ffd49a", 1.6)); this.pendant.position.set(ox, 1.9, -0.5); this.pendant.layers.set(NOINK); G.add(this.pendant);
    b.build(G);
  }

  // ---------------- street: the shoe store (window with the sneakers), neighbours, lamp posts; the guard booth at +7 ----------------
  private buildStreet() {
    const b = new Batch(), [ox] = ST, G = this.street;
    const road = lam("road33", () => ({ map: tile(asphalt(), 1, 1) })), pave = lam("pave33", () => ({ map: tile(pavement(), 1, 1) }));
    const brickR = lam("brickR33", () => ({ map: tile(brick("brR33", "#b0584a"), 1, 1) })), brickB = lam("brickB33", () => ({ map: tile(brick("brB33", "#8a8fb0"), 1, 1) })), brickY = lam("brickY33", () => ({ map: tile(brick("brY33", "#c9a25a"), 1, 1) }));
    const trim = lam("strim33", () => ({ color: "#efe7da" })), dark = lam("sdark33", () => ({ color: "#2c2f38" })), awn = lam("awn33", () => ({ color: "#a8323a" }));
    b.add(boxGeo(V(ox - 30, -0.1, 1.6), V(ox + 30, 0, 30), 2), road);
    b.add(boxGeo(V(ox - 30, -0.1, -2), V(ox + 30, 0.08, 1.6), 1.4), pave);
    b.add(boxGeo(V(ox - 30, 0, 1.55), V(ox + 30, 0.1, 1.65)), trim);
    // the shoe store (x -2..2) + neighbours
    b.add(boxGeo(V(ox - 2.2, 0, -1.2), V(ox + 2.2, 4.4, -0.6), 2), brickR);
    b.add(boxGeo(V(ox - 6.4, 0, -1.4), V(ox - 2.2, 5.2, -0.7), 2), brickB); b.add(boxGeo(V(ox + 2.2, 0, -1.4), V(ox + 5.6, 4.8, -0.7), 2), brickY);
    b.add(boxGeo(V(ox + 5.6, 0, -1.4), V(ox + 11, 3.2, -0.8), 2), brickB);
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9), new THREE.MeshBasicMaterial({ map: shopInside() })); inside.position.set(ox, 1.45, -0.59); inside.layers.set(NOINK); G.add(inside); this.shopGlow = inside;
    b.add(boxGeo(V(ox - 1.7, 0.42, -0.6), V(ox + 1.7, 0.5, -0.5)), trim); b.add(boxGeo(V(ox - 1.7, 2.4, -0.6), V(ox + 1.7, 2.48, -0.5)), trim);
    for (const x of [-1.7, 1.7]) b.add(boxGeo(V(ox + x - 0.05, 0.42, -0.6), V(ox + x + 0.05, 2.48, -0.5)), trim);
    b.add(boxGeo(V(ox - 1.9, 2.75, -0.6), V(ox + 1.9, 2.82, 0.3)), awn);
    signMesh(G, cardTex("shopSign33", 800, 180, PR.shopSignFx), 1.9, 0.43, ox, 3.4, -0.58);
    // display shelf behind the glass: the sneakers on it are an Fx card (bright), the tag hangs next to them
    b.add(boxGeo(V(ox - 0.95, 1.18, -0.59), V(ox + 0.95, 1.22, -0.5)), trim);
    // lamp posts
    for (const x of [-4.2, 3.6, 9.5]) { b.add(boxGeo(V(ox + x - 0.05, 0, 1.2), V(ox + x + 0.05, 3.2, 1.3)), dark); }
    // guard booth at +7: walls, roof, open front with a counter, a sign; barrier arm
    const bx = ox + 7.0, booth = lam("booth33", () => ({ color: "#d6d0c2" }));
    b.add(boxGeo(V(bx - 0.75, 0, -0.75), V(bx + 0.75, 2.4, -0.7)), booth);
    b.add(boxGeo(V(bx - 0.8, 0, -0.75), V(bx - 0.75, 2.4, 0.45)), booth); b.add(boxGeo(V(bx + 0.75, 0, -0.75), V(bx + 0.8, 2.4, 0.45)), booth);
    b.add(boxGeo(V(bx - 0.9, 2.4, -0.85), V(bx + 0.9, 2.52, 0.55)), dark);
    b.add(boxGeo(V(bx - 0.8, 0, 0.4), V(bx + 0.8, 0.95, 0.45)), booth); b.add(boxGeo(V(bx - 0.8, 0.95, 0.3), V(bx + 0.8, 1.0, 0.5)), trim);
    signMesh(G, cardTex("secSign33", 600, 140, PR.securitySignFx), 1.3, 0.3, bx, 2.25, 0.47);
    signMesh(G, cardTex("clock33", 400, 160, PR.clockFx), 0.42, 0.17, bx - 0.45, 1.75, -0.69);
    b.add(boxGeo(V(bx + 0.85, 0, 0.9), V(bx + 1.0, 1.0, 1.05)), lam("barP33", () => ({ color: "#e0b63a" })));
    for (let k = 0; k < 5; k++) b.add(boxGeo(V(bx + 1.0 + k * 0.5, 0.9, 0.94), V(bx + 1.5 + k * 0.5, 0.98, 1.01)), lam(k % 2 ? "barW33" : "barR33", () => ({ color: k % 2 ? "#f4f1ea" : "#c23b2c" })));
    this.boothGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), emissive("#ffd49a", 2.2)); this.boothGlow.position.set(bx + 0.3, 2.25, -0.2); this.boothGlow.layers.set(NOINK); G.add(this.boothGlow);
    b.build(G);
  }

  // ---------------- campus lawn: a columned hall, the banner, rows of chairs, trees ----------------
  private buildCampus() {
    const b = new Batch(), [ox] = CA, G = this.campus;
    const grass = lam("cgrass33", () => ({ map: tile(grassHD(), 1, 1), color: "#e8d9a0" })), stone = lam("stone33", () => ({ color: "#e9dfcc" })), brk = lam("cbrick33", () => ({ map: tile(brick("cbr33", "#a8584a"), 1, 1) }));
    const chair = lam("chair33", () => ({ color: "#f4f1ea" })), wood = lam("cwood33", () => ({ color: "#8a5f3e" }));
    const leaf = [lam("cleafA33", () => ({ color: "#6f9a46" })), lam("cleafB33", () => ({ color: "#5f8a40" }))];
    b.add(boxGeo(V(ox - 200, -0.2, -200), V(ox + 200, 0, 200), 4), grass);
    b.add(boxGeo(V(ox - 9, 0, -14), V(ox + 9, 7, -10), 2), brk);
    b.add(boxGeo(V(ox - 9.4, 7, -14.4), V(ox + 9.4, 7.6, -9.6)), stone);
    for (let x = -7.5; x <= 7.5; x += 2.5) b.add(new THREE.CylinderGeometry(0.32, 0.36, 6.8, 16), stone, new THREE.Matrix4().makeTranslation(ox + x, 3.4, -9.4));
    b.add(boxGeo(V(ox - 9, 0, -9.8), V(ox + 9, 0.3, -8.6)), stone);
    signMesh(G, cardTex("banner33", 1200, 250, PR.bannerFx), 7.2, 1.5, ox, 5.3, -9.0, 0, 1.0);
    for (let r = 0; r < 3; r++) for (let k = -6; k <= 6; k++) { if (Math.abs(k) < 1) continue; const x = ox + k * 0.7, z = -4 - r * 0.9; b.add(boxGeo(V(x - 0.22, 0.45, z - 0.2), V(x + 0.22, 0.5, z + 0.2)), chair); b.add(boxGeo(V(x - 0.22, 0.5, z - 0.22), V(x + 0.22, 0.95, z - 0.18)), chair); }
    const tree = (x: number, z: number, s: number, i: number) => {
      b.add(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.4 * s, 8), wood, new THREE.Matrix4().makeTranslation(x, 1.2 * s, z));
      for (const [dx, dy, dz, r] of [[0, 3.0, 0, 1.3], [0.8, 2.6, 0.2, 0.9], [-0.8, 2.7, -0.1, 0.95], [0.1, 3.7, -0.2, 0.9]]) b.add(new THREE.SphereGeometry(r * s, 16, 12), leaf[i % 2], new THREE.Matrix4().makeTranslation(x + dx * s, dy * s, z + dz * s));
    };
    tree(ox - 6, -2, 1.4, 0); tree(ox + 6.5, -3, 1.3, 1); tree(ox - 12, -6, 1.6, 1); tree(ox + 12, -7, 1.5, 0);
    b.build(G);
  }

  // ---------------- staging: what each shot shows ----------------
  private stage(id: number, lt: number, t: number, front: any, side: any, fxl: FxItem[], contact: any, q: (v: number, n?: number) => number, lid: (s: number) => number, cam: THREE.PerspectiveCamera) {
    const ease = smooth, [ix] = IN, [kx] = KI, [sx] = ST, [cx] = CA;
    switch (id) {
      case 1: { // the hook: Dad's feet shuffle across the kitchen floor in taped slippers
        const x = kx - 1.05 + 1.5 * (lt / 5), ph = q((lt * 0.9) % 1, 12);
        fxl.push({ key: `feet${ph}`, cw: 600, ch: 400, draw: (p) => PR.feetFx(p, ph), x, y: 0.24, z: -0.2, w: 0.72, h: 0.48 });
        break;
      }
      case 2: { // the boy at the shop window pointing at the sneakers; Dad beside him, looking at the price tag
        const look = lt > 1.6;
        front(KID, "kid", sx - 0.45, 0.08, 0.05, { mode: "stand", expr: "laugh", handR: [q(470 + 10 * Math.sin(t * 9), 2), 330], facing: 1, blink: lid(0.5) }, 8);
        front(YDAD, "ydad", sx + 0.4, 0.08, 0.15, { mode: "stand", facing: -1, expr: look ? "nervous" : "warm", lookY: look ? -0.6 : 0, blink: lid(0.3) }, 3);
        contact(sx - 0.45, 0.08, 0.05, 0.4); contact(sx + 0.4, 0.08, 0.15);
        this.shopDisplay(fxl, sx);
        break;
      }
      case 3: { // Dad close: he counts his crumpled bills, then smiles, "Only the best for you."
        const n = Math.min(4, 1 + Math.floor(lt * 1.6)), smile = lt > 1.7;
        front(YDAD, "ydad", sx + 0.55, 0.08, 0.15, { mode: "stand", facing: 0, expr: smile ? "tender" : "nervous", lookY: smile ? 0 : 1.2, handR: [360, 560], handL: [250, 570], blink: lid(0.3) }, 3);
        fxl.push({ key: `bills${n}`, cw: 320, ch: 260, draw: (p) => PR.billsFx(p, n), x: sx + 0.55, y: 1.0, z: 0.42, w: 0.3, h: 0.24 });
        this.shopDisplay(fxl, sx);
        break;
      }
      case 4: { // night rain: the boy skips home in his new sneakers under Dad's umbrella; Dad walks in the rain, slippers wet
        const k = lt / 3, x0 = sx - 3.0 + 2.6 * k;
        side(KIDNEW, "kidn", x0 + 0.45, 0.08, 0.9, { mode: "walk", phase: q((t * 2.2) % 1, 30), stride: 0.7, expr: "grin", blink: lid(0.5) }, 8, false);
        side({ ...YDAD }, "ydads", x0 - 0.05, 0.08, 1.0, { mode: "walk", phase: q((t * 1.6) % 1, 30), stride: 0.5, expr: "warm", blink: lid(0.3) }, 3, false);
        fxl.push({ key: "umbrella", cw: 600, ch: 400, draw: PR.umbrellaFx, x: x0 + 0.38, y: 1.45, z: 0.88, w: 0.95, h: 0.63 });
        this.rain(t, cam, fxl);
        break;
      }
      case 5: { // night: Mom on the sofa mending her old cardigan; the brand-new jacket (tag on) hangs on the lamp side
        const k = q((lt * 0.7) % 1, 16);
        front(MOM, "mom", ix + 0.45, 0.33, -0.9, { mode: "sit", facing: 0, expr: "warm", lookY: 1.3, handL: [250, 760], handR: [q(330 + 25 * Math.sin(lt * 4), 2), 740], blink: lid(0.4) }, 5);
        fxl.push({ key: `cardigan${k}`, cw: 500, ch: 400, draw: (p) => PR.cardiganFx(p, k), x: ix + 0.45, y: 0.5, z: -0.55, w: 0.44, h: 0.35 });
        fxl.push({ key: "jacket", cw: 400, ch: 440, draw: PR.jacketFx, x: ix + 1.12, y: 0.98, z: -0.85, w: 0.42, h: 0.46 });
        break;
      }
      case 6: { // Mom close: she holds up the cardigan with the hole and smiles; behind her, the boy spins in his new jacket
        front(MOM, "mom", ix + 0.45, 0.33, -0.9, { mode: "sit", facing: -1, expr: lt > 0.8 ? "tender" : "warm", lookY: lt > 0.8 ? 0 : 1, handL: [150, 600], handR: [370, 760], blink: lid(0.4) }, 5);
        fxl.push({ key: "cardigan0", cw: 500, ch: 400, draw: (p) => PR.cardiganFx(p, 0), x: ix + 0.13, y: 0.92, z: -0.75, w: 0.36, h: 0.29 });
        front(KIDJACKET, "kidj", ix - 0.3, 0, -1.2, { mode: "stand", expr: "laugh", wave: q(Math.sin(t * 8), 20), blink: lid(0.5) }, 8);
        contact(ix - 0.3, 0, -1.2, 0.4);
        break;
      }
      case 7: { // dinner: one piece of chicken. Mom lifts it off her plate and puts it on the boy's; Dad eats plain rice
        const move = ease(seg(lt, 1.0, 2.4));
        front(YDAD, "ydad", kx - 0.62, 0.42, -1.25, { mode: "sit", expr: "warm", lookY: 1.2, handR: [330, q(600 + 30 * Math.max(0, Math.sin(lt * 5)), 2)], blink: lid(0.3) }, 3);
        front(KID, "kid", kx, 0.5, -1.25, { mode: "sit", expr: move > 0.9 ? "laugh" : "grin", lookY: 0.8, blink: lid(0.5) }, 8);
        front(MOM, "mom", kx + 0.62, 0.42, -1.25, { mode: "sit", expr: "warm", lookY: 0.9, handL: move > 0.02 && move < 0.98 ? [q(250 - 260 * move, 2), 620] : [250, 700], blink: lid(0.4) }, 5);
        this.plates(fxl, kx, move);
        break;
      }
      case 8: { // Mom close: "Eat, I'm not hungry." Her own plate holds only rice; her stomach rumbles
        front(MOM, "mom", kx + 0.62, 0.42, -1.25, { mode: "sit", expr: lt > 1.8 ? "hurt" : "tender", lookY: lt > 1.8 ? 1.3 : 0.2, blink: lid(0.4) }, 5);
        front(KID, "kid", kx, 0.5, -1.25, { mode: "sit", expr: "laugh", lookY: 1.0, blink: lid(0.5) }, 8);
        this.plates(fxl, kx, 1);
        if (lt > 2.0 && lt < 3.4) { const a = q(Math.sin(seg(lt, 2.0, 3.4) * Math.PI), 8); if (a > 0) fxl.push({ key: `growl${a}`, cw: 200, ch: 200, draw: PR.growlFx, x: kx + 0.92, y: 1.05, z: -1.0, w: 0.2 * (0.6 + 0.4 * a), h: 0.2 * (0.6 + 0.4 * a), soft: true }); }
        break;
      }
      case 9: { // 2:47 AM: Dad in a guard's uniform in the booth, fighting sleep, his cracked taped phone in his hand
        const nod = lt > 1.2 && lt < 2.2 ? seg(lt, 1.2, 1.7) * (1 - seg(lt, 1.9, 2.2)) : 0;
        front(GUARD, "guard", sx + 7.0, 0.62, -0.2, { mode: "sit", facing: 0, expr: nod > 0.3 ? "numb" : "warm", headTilt: 14 * nod, blink: nod > 0.3 ? 1 : lid(0.3), handR: [360, 470], handL: [280, 500], holdR: "phone", cracked: true, screenK: 0.6, lookY: 1.0, glow: "#cfe6ff", glowK: 0.25 }, 3);
        break;
      }
      case 10: { // morning: Dad (still in uniform) holds out a laptop box; the teen grabs it, eyes only on the box. "Finally."
        const give = ease(seg(lt, 0.6, 1.6)), grab = lt > 1.6;
        front(TEEN, "teen", ix - 0.45, 0.33, -0.88, { mode: "sit", expr: grab ? "grin" : "numb", lookY: grab ? 1.1 : 1.4, handL: grab ? [250, 600] : null, handR: grab ? [350, 600] : null, holdR: grab ? null : "phone", screenK: 0.6, blink: lid(0.7) }, 6);
        front(GUARD, "guard", ix + 0.3, 0, -0.3, { mode: "stand", facing: -1, expr: lt > 3.2 ? "tender" : "hopeful", handL: grab ? null : [q(240 - 120 * give, 2), q(560 - 40 * give, 2)], handR: [370, 600], holdR: "phone", cracked: true, blink: lid(0.3) }, 3);
        contact(ix + 0.3, 0, -0.3);
        const bxp = grab ? ix - 0.45 : ix + 0.3 - 0.45 * give;
        fxl.push({ key: "laptopBox", cw: 400, ch: 300, draw: PR.laptopBoxFx, x: bxp, y: grab ? 0.82 : 1.05, z: grab ? -0.6 : -0.3, w: 0.42, h: 0.32 });
        break;
      }
      case 11: { // graduation: the son in his gown with two friends; his parents (old clothes) come close; he waves them off
        const wave = lt > 1.2, step = ease(seg(lt, 2.0, 3.6));
        front(FRIEND1, "fr1", cx - 1.05, 0, -0.2, { mode: "stand", expr: "grin", blink: lid(0.2) }, 11);
        front(GRAD, "grad", cx - 0.35, 0, -0.1, { mode: "stand", facing: 1, expr: wave ? "stern" : "grin", handR: wave ? [q(470 + 12 * Math.sin(t * 10), 2), 450] : null, blink: lid(0.7) }, 6);
        front(FRIEND2, "fr2", cx + 0.25, 0, -0.25, { mode: "stand", expr: "laugh", blink: lid(0.9) }, 12);
        front(DAD, "dad", cx + 0.95 + 0.6 * step, 0, 0.0, { mode: "stand", facing: -1, expr: wave ? "hurt" : "hopeful", blink: lid(0.3) }, 3);
        front(MOM, "mom", cx + 1.45 + 0.6 * step, 0, 0.05, { mode: "stand", facing: -1, expr: wave ? "hurt" : "tender", blink: lid(0.4) }, 5);
        for (const x of [-1.05, -0.35, 0.25]) contact(cx + x, 0, -0.15, 0.45);
        contact(cx + 0.95 + 0.6 * step, 0, 0); contact(cx + 1.45 + 0.6 * step, 0, 0.05);
        break;
      }
      case 12: { // the parents off to the side: Mom smooths her old dress, Dad's hand on her shoulder; the photo flash behind
        front(DAD, "dad", cx + 1.3, 0, 0.3, { mode: "stand", facing: 0, expr: lt > 1.5 ? "tender" : "hurt", handL: [200, 520], blink: lid(0.3) }, 3);
        front(MOM, "mom", cx + 1.8, 0, 0.35, { mode: "stand", facing: 0, expr: lt > 2.2 ? "tender" : "sad", lookY: lt < 2.2 ? 1.2 : 0, handL: [q(250 + 20 * Math.sin(lt * 5), 2), 660], handR: [q(350 - 20 * Math.sin(lt * 5), 2), 660], blink: lid(0.4) }, 5);
        contact(cx + 1.3, 0, 0.3); contact(cx + 1.8, 0, 0.35);
        for (const [x, o, sd, k] of [[-0.9, FRIEND1, 11, "fr1"], [-0.25, GRAD, 6, "grad"], [0.35, FRIEND2, 12, "fr2"]] as const) { front(o, k, cx + x, 0, -1.6, { mode: "stand", expr: "laugh" }, sd); contact(cx + x, 0, -1.6, 0.45); }
        const fl = seg(lt, 2.6, 3.0); if (fl > 0 && fl < 1) { const a = q(Math.sin(fl * Math.PI), 10); fxl.push({ key: `flash${a}`, cw: 400, ch: 400, draw: (p) => PR.flashFx(p, a), x: cx - 0.2, y: 1.4, z: -1.0, w: 2.2, h: 2.2, soft: true }); }
        break;
      }
      case 15: { // after the funeral: the son opens Dad's wardrobe. The patched flannel, the taped slippers, the old shoebox
        front(SUIT, "suit", ix + 2.15, 0, 1.0, { mode: "stand", facing: 1, expr: "sad", lookY: 0.3, handR: [q(470 + 20 * seg(lt, 0.4, 1.4), 2), 520], blink: lid(0.7) }, 6);
        contact(ix + 2.15, 0, 1.0);
        fxl.push({ key: "patched", cw: 400, ch: 480, draw: PR.patchedShirtFx, x: ix + 2.85, y: 1.12, z: 0.0, w: 0.52, h: 0.62, yaw: -Math.PI / 2 });
        fxl.push({ key: "tapedPair", cw: 560, ch: 260, draw: PR.tapedPairFx, x: ix + 2.7, y: 0.18, z: -0.15, w: 0.44, h: 0.2, yaw: -Math.PI / 2 + 0.5 });
        break;
      }
      case 16: { // the shoebox, opened on the stool: the receipt "$89.99, paid cash" and the photo of the boy in his new sneakers
        fxl.push({ key: "shoebox", cw: 800, ch: 520, draw: (p) => PR.shoeboxFx(p, KIDNEW), x: ix + 1.95, y: 0.6, z: 1.05, w: 0.48, h: 0.31, flat: true });
        break;
      }
      case 17: { // the envelope: "For my son", stuffed with every bill he ever sent; a tear lands on it
        const open = ease(seg(lt, 0.4, 1.6));
        fxl.push({ key: `env${q(open, 10)}`, cw: 800, ch: 560, draw: (p) => PR.envelopeFx(p, q(open, 10)), x: ix + 1.95, y: 0.6, z: 1.05, w: 0.48, h: 0.34, flat: true });
        if (lt > 2.4) { const dy = Math.max(0, 1 - seg(lt, 2.4, 2.9)); fxl.push({ key: "tear", cw: 60, ch: 64, draw: PR.tearFx, x: ix + 1.87, y: 0.62 + 0.5 * dy, z: 1.0, w: 0.035, h: 0.04 }); }
        break;
      }
      case 18: { // Mom's house: Mom (grey now) in the same mended cardigan; her son kneels and slips new slippers on her feet
        const put = ease(seg(lt, 1.0, 2.6));
        front(OLDMOM, "oldmom", ix + 0.4, 0.33, -0.9, { mode: "sit", facing: -1, expr: put > 0.6 ? "cry" : "hopeful", tear: put > 0.7 ? q((lt * 0.8) % 1, 10) : 0, lookY: 1.2, blink: lid(0.4) }, 5);
        front(SON, "son", ix - 0.2, -0.22, -0.5, { mode: "sit", facing: 1, expr: "tender", lookY: 1.4, handL: [q(380, 2), q(840 - 60 * (1 - put), 2)], handR: [q(470, 2), q(850 - 60 * (1 - put), 2)], blink: lid(0.7) }, 6, 1);
        fxl.push({ key: "newSlippers", cw: 480, ch: 220, draw: PR.newSlippersFx, x: ix + 0.4 - 0.3 * (1 - put), y: 0.06 + 0.15 * (1 - put), z: -0.55, w: 0.42, h: 0.19 });
        break;
      }
      case 19: { // close: he holds her hands. "I know, Mom. That's why."
        front(OLDMOM, "oldmom", ix + 0.4, 0.33, -0.9, { mode: "sit", facing: -1, expr: lt > 2.6 ? "tender" : "cry", tear: q((lt * 0.8) % 1, 10), lookY: 0.5, handL: [140, 700], handR: [230, 700], blink: lid(0.4) }, 5);
        front(SON, "son", ix - 0.2, -0.22, -0.5, { mode: "sit", facing: 1, expr: "tender", tear: lt > 1.5 ? q((lt * 0.7) % 1, 10) : 0, lookY: -0.4, handL: [440, 600], handR: [500, 610], blink: lid(0.7) }, 6, 1);
        fxl.push({ key: "newSlippers", cw: 480, ch: 220, draw: PR.newSlippersFx, x: ix + 0.4, y: 0.06, z: -0.55, w: 0.42, h: 0.19 });
        break;
      }
      case 20: { // end: Dad's taped slippers by the front door; the camera rises to Mom and her son together on the sofa
        fxl.push({ key: "tapedPair", cw: 560, ch: 260, draw: PR.tapedPairFx, x: ix + 2.6, y: 0.1, z: 1.65, w: 0.42, h: 0.2, yaw: -0.9 });
        front(OLDMOM, "oldmom", ix + 0.5, 0.33, -0.9, { mode: "sit", facing: -1, expr: "tender", handL: [250, 720] }, 5);
        front(SON, "son", ix - 0.05, 0.33, -0.88, { mode: "sit", facing: 1, expr: "tender", handR: [380, 700] }, 6);
        fxl.push({ key: "newSlippers", cw: 480, ch: 220, draw: PR.newSlippersFx, x: ix + 0.5, y: 0.06, z: -0.55, w: 0.42, h: 0.19 });
        break;
      }
    }
  }
  private shopDisplay(fxl: FxItem[], sx: number) {
    fxl.push({ key: "sneakers", cw: 580, ch: 260, draw: PR.sneakerPairFx, x: sx - 0.25, y: 1.42, z: -0.52, w: 0.78, h: 0.35 });
    fxl.push({ key: "tag", cw: 300, ch: 190, draw: (p) => PR.priceTagFx(p), x: sx + 0.3, y: 1.3, z: -0.5, w: 0.34, h: 0.22 });
  }
  private plates(fxl: FxItem[], kx: number, move: number) {
    const y = 0.785;
    fxl.push({ key: "plateRice", cw: 300, ch: 200, draw: (p) => PR.plateFx(p, true, false), x: kx - 0.62, y, z: -0.55, w: 0.36, h: 0.24, flat: true });
    fxl.push({ key: move >= 1 ? "plateKidC" : "plateKid", cw: 300, ch: 200, draw: (p) => PR.plateFx(p, true, move >= 1), x: kx, y, z: -0.55, w: 0.36, h: 0.24, flat: true });
    fxl.push({ key: move <= 0 ? "plateMomC" : "plateRice", cw: 300, ch: 200, draw: (p) => PR.plateFx(p, true, move <= 0), x: kx + 0.62, y: y + 0.001, z: -0.55, w: 0.36, h: 0.24, flat: true });
    if (move > 0 && move < 1) { const x = kx + 0.66 - 0.62 * move, lift = Math.sin(move * Math.PI) * 0.25; fxl.push({ key: "chicken", cw: 200, ch: 120, draw: PR.chickenFx, x, y: y + 0.06 + lift, z: -0.55, w: 0.16, h: 0.1 }); }
  }
  private rain(t: number, cam: THREE.PerspectiveCamera, fxl: FxItem[]) {
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), fwd = V(0, 0, 0); cam.getWorldDirection(fwd);
    for (let i = 0; i < 160; i++) {
      const h1 = Math.sin(i * 127.1) * 43758.5453 % 1, h2 = Math.sin(i * 311.7) * 12345.678 % 1, d = 1.8 + Math.abs(h2) * 6;
      const y = 3.2 - (((t * 7 + Math.abs(h1) * 9) % 4.2)), p = cam.position.clone().addScaledVector(fwd, d).addScaledVector(right, h1 * d * 0.6);
      fxl.push({ key: "streak", cw: 32, ch: 128, draw: PR.streak, x: p.x, y, z: p.z, w: 0.02 * (1 + d * 0.15), h: 0.32 * (1 + d * 0.1), soft: true, rot: 0.08 });
    }
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = shotAt(f), t = f / FPS, lt = (f - s.a) / FPS, Lp = PRESET[s.light];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    const outdoor = s.place === "street" || s.place === "campus";
    this.living.visible = s.place === "living"; this.kitchen.visible = s.place === "kitchen"; this.street.visible = s.place === "street"; this.campus.visible = s.place === "campus";
    const dir = SUN[s.id] ?? V(0, 1, 0);
    this.hemi.color.set(Lp.sky); this.hemi.groundColor.set(Lp.ground); this.hemi.intensity = Lp.hemiI;
    this.sun.color.set(Lp.sunCol); this.sun.intensity = Lp.sunI;
    const Rr = outdoor ? THREE.MathUtils.clamp(dist * 1.2 + 6, 10, 30) : 6;
    this.sun.position.copy(focus).addScaledVector(dir, outdoor ? 120 : 12); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix();
    this.sun.shadow.bias = Lp.bias; this.sun.shadow.normalBias = Lp.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...Lp.lit); TONE.uShadeCol.value.set(...Lp.shade); TONE.uShadeLift.value.set(...Lp.lift);
    TONE.uLambert.value = Lp.lambert; TONE.uSideK.value = Lp.sideK; TONE.uTerm.value = Lp.term; TONE.uBounce.value.set(...LOOK.golden.bounce); TONE.uSat.value = LOOK.golden.sat;
    CHAR.uCharTint.value.set(...Lp.charTint); CHAR.uCharShade.value = Lp.charShade; CHAR.uGrad.value = Lp.charGrad; CHAR.uBodyGrad.value = Lp.bodyGrad; CHAR.uSideTint.value.set(...Lp.sideTint);
    const K = SKY[s.light] ?? LOOK.golden.sky, su = this.skyMat.uniforms;
    K.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.sky.visible = outdoor;
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar; scene.fog = this.fog;
    scene.background = outdoor ? null : new THREE.Color("#120e18");
    const showSun = outdoor && s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    for (const m of this.clouds) { m.visible = outdoor && s.light === "golden"; m.lookAt(cam.position.x, m.position.y, cam.position.z); }
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(dir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.8)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(Lp.sunDisc).multiplyScalar(1.3);
    }
    const night = s.light === "night" || s.light === "lamp";
    (this.lampGlow.material as THREE.MeshBasicMaterial).color.set("#ffd49a").multiplyScalar((s.light === "night" ? 1.25 : s.light === "morning" ? 0.6 : 1.85) + 0.05 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
    (this.lWin.material as THREE.MeshBasicMaterial).color.set(s.light === "morning" ? "#cfe6ff" : "#3c5688").multiplyScalar(s.light === "morning" ? 1.3 : 1.0);
    (this.kWin.material as THREE.MeshBasicMaterial).color.set(night ? "#2a3a66" : "#cfe6ff").multiplyScalar(night ? 0.8 : 1.3);
    (this.pendant.material as THREE.MeshBasicMaterial).color.set("#ffd49a").multiplyScalar(night ? 1.9 : 0.5);
    (this.shopGlow.material as THREE.MeshBasicMaterial).color.setScalar(s.light === "rain" || s.light === "street" ? 0.55 : 1.0);
    (this.boothGlow.material as THREE.MeshBasicMaterial).color.set("#ffd49a").multiplyScalar(s.light === "street" ? 2.4 : 0.3);
    // ---- cast ----
    const places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; mirror?: boolean; yaw?: number; size: [number, number, number]; scale?: number }[] = [];
    const fxl: FxItem[] = [];
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
    if (s.place !== "ui") this.stage(s.id, lt, t, front, side, fxl, contact, q, lid, cam);
    // ---- bind cards + effects ----
    let ai = 0; const used: Actor[] = [];
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
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.yaw !== undefined) e.mesh.rotation.set(0, p.yaw, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1); fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush(); for (const a of used) a.bind(); for (const e of fused) e.bind();
    return focus;
  }
}

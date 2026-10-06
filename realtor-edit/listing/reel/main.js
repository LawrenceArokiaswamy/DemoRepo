// 31 Carnegie Dr listing reel: photos rebuilt as depth meshes (gimbal/FPV moves), Kling clips, whip transitions,
// in-room 3D text, before/after staging reveals, map fly-in, VO-synced kinetic type and captions.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeMap } from './map.js';

const DUR = 57.5, WHIP = 0.24;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const EASE = { eout: (x) => 1 - Math.pow(1 - x, 3), ein: (x) => x * x * x, eio: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)), lin: (x) => x };
const $ = (s) => document.querySelector(s);
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/* ---------- shot list (times pinned to the voiceover) ---------- */
const SANS = '900 SIZE "Inter Tight"', SERIF = 'italic 400 SIZE "Instrument Serif"';
const SHOTS = [
  { kind: 'video', t0: 0, t1: 4.45, el: '#w1' },
  { kind: 'depth', t0: 4.45, t1: 7.6, photo: '001', near: 7, far: 60, ease: 'expo', p0: [0, 0, 0], p1: [0, 0.5, -1.4], a0: [0.47, 0.52], a1: [0.47, 0.5], z0: 1.18, z1: 1.45,
    t3: { lines: ['31 Carnegie'], font: SERIF, h: 0.95, uv: [0.47, 0.72], mul: 0.78, lift: 2.4, tin: 0.25 } },
  { kind: 'depth', t0: 7.6, t1: 12.05, photo: '016', near: 1.2, far: 14, ease: 'eout', p0: [0, 0, 0.1], p1: [0.06, -0.08, -0.55], a0: [0.63, 0.55], a1: [0.63, 0.5], z0: 1.06, z1: 1.45,
    t3: { lines: ['3,088', 'SQ FT'], font: SANS, h: 0.9, uv: [0.63, 0.76], floor: true, tin: 0.35 } },
  { kind: 'reveal', t0: 12.05, t1: 15.45, photo: '026', after: '026s', near: 1.6, far: 9, ease: 'eio', p0: [-0.05, 0, 0], p1: [0.1, 0.05, -0.3], a0: [0.38, 0.5], a1: [0.46, 0.48], z0: 1.14, z1: 1.26, wipe: [0.75, 2.1] },
  { kind: 'reveal', t0: 15.45, t1: 18.9, photo: '024', after: '024s', near: 1.8, far: 11, ease: 'eio', p0: [0, 0, 0], p1: [0.12, 0, -0.3], a0: [0.40, 0.5], a1: [0.48, 0.5], z0: 1.16, z1: 1.26, wipe: [0.6, 1.9] },
  { kind: 'video', t0: 18.9, t1: 21.0, el: '#w2' },
  { kind: 'depth', t0: 21.0, t1: 24.3, photo: '033', near: 1.6, far: 9, ease: 'eio', p0: [-0.15, 0, 0], p1: [0.2, 0, -0.4], a0: [0.5, 0.5], a1: [0.62, 0.5], z0: 1.1, z1: 1.3,
    t3: { lines: ['KITCHEN'], font: SANS, h: 0.72, uv: [0.5, 0.515], mul: 0.84, lift: 0, rise: true, tin: 0.3 } },
  { kind: 'depth', t0: 24.3, t1: 25.3, photo: '037', near: 0.8, far: 4, ease: 'eout', p0: [0, 0, 0], p1: [0, -0.02, -0.18], a0: [0.6, 0.55], a1: [0.6, 0.58], z0: 1.1, z1: 1.35 },
  { kind: 'depth', t0: 25.3, t1: 27.05, photo: '042', near: 0.9, far: 4.5, ease: 'eout', p0: [0, 0, 0], p1: [0.05, 0, -0.25], a0: [0.62, 0.5], a1: [0.58, 0.5], z0: 1.08, z1: 1.32 },
  { kind: 'video', t0: 27.05, t1: 30.0, el: '#w3' },
  { kind: 'depth', t0: 30.0, t1: 32.75, photo: '053', near: 1.3, far: 8, ease: 'eout', p0: [0, 0, 0], p1: [0.05, -0.05, -0.45], a0: [0.52, 0.5], a1: [0.55, 0.5], z0: 1.08, z1: 1.36,
    t3: { lines: ['SPA', 'ENSUITE'], font: SANS, h: 0.5, uv: [0.54, 0.78], floor: true, tin: 0.3 } },
  { kind: 'reveal', t0: 32.75, t1: 35.3, photo: '056', after: '056s', near: 1.6, far: 9, ease: 'eio', p0: [0, 0, 0], p1: [0.1, 0, -0.25], a0: [0.5, 0.52], a1: [0.56, 0.52], z0: 1.12, z1: 1.24, wipe: [0.45, 1.6] },
  { kind: 'depth', t0: 35.3, t1: 36.75, photo: '069', near: 1.0, far: 5, ease: 'eout', p0: [0, 0, 0], p1: [0.04, 0, -0.25], a0: [0.45, 0.55], a1: [0.45, 0.55], z0: 1.08, z1: 1.3 },
  { kind: 'map', t0: 36.75, t1: 46.5 },
  { kind: 'depth', t0: 46.5, t1: 48.6, photo: '009', near: 4, far: 40, ease: 'eout', p0: [0, 0, 0], p1: [0, 0.2, -1.2], a0: [0.5, 0.45], a1: [0.52, 0.42], z0: 1.1, z1: 1.32 },
  { kind: 'depth', t0: 48.6, t1: 50.7, photo: '005', near: 3, far: 14, ease: 'expo', p0: [0, -0.1, 0], p1: [0, 0.25, -1.3], a0: [0.45, 0.6], a1: [0.45, 0.42], z0: 1.12, z1: 1.5 },
  { kind: 'depth', t0: 50.7, t1: 57.5, photo: '001', near: 7, far: 60, ease: 'eout', p0: [0, 0.2, -0.3], p1: [0, 0.45, -0.9], a0: [0.47, 0.45], a1: [0.47, 0.42], z0: 1.2, z1: 1.3, end: true },
];

/* ---------- big kinetic keywords (VO-synced) ---------- */
const KW = [
  { t: 2.0, d: 0.75, html: 'SPACE', cls: 'sans', size: 250, top: 620 },
  { t: 2.75, d: 1.7, html: 'or <span class="g">location?</span>', cls: 'serif', size: 190, top: 860 },
  { t: 5.95, d: 1.6, html: 'gives you <span class="g">both.</span>', cls: 'serif', size: 140, top: 360 },
  { t: 10.2, d: 1.8, html: 'SEVEN OAKS · OAKVILLE', cls: 'small', size: 40, top: 270 },
  { t: 12.25, d: 1.7, html: 'Soaring <span class="g">ceilings</span>', cls: 'serif', size: 140, top: 400 },
  { t: 14.0, d: 1.35, html: '<span class="g">Hardwood</span> throughout', cls: 'serif', size: 125, top: 400 },
  { t: 16.95, d: 1.9, html: 'built around <span class="g">the fire</span>', cls: 'serif', size: 125, top: 400 },
  { t: 22.25, d: 2.0, html: 'big enough for<br/><span class="g">everyone\'s opinions</span>', cls: 'serif', size: 104, top: 330 },
  { t: 24.35, d: 0.9, html: 'GAS COOKTOP', cls: 'small', size: 40, top: 300 },
  { t: 25.15, d: 1.85, html: 'WALK-IN<br/><span class="g">PANTRY</span>', cls: 'sans', size: 150, top: 560 },
  { t: 28.55, d: 1.45, html: 'Primary <span class="g">retreat</span>', cls: 'serif', size: 150, top: 380 },
  { t: 32.95, d: 1.4, html: '<span class="g">4</span> BEDROOMS', cls: 'sans', size: 140, top: 400 },
  { t: 34.4, d: 2.3, html: '2ND-FLOOR<br/><span class="g">LAUNDRY</span>', cls: 'sans', size: 120, top: 380 },
  { t: 47.45, d: 1.15, html: 'Some homes<br/><span class="g">knock quietly</span>', cls: 'serif', size: 120, top: 380 },
  { t: 49.0, d: 1.65, html: 'This one<br/><span class="g">won\'t wait.</span>', cls: 'serif', size: 150, top: 380 },
];
const kwEls = KW.map((k) => { const e = document.createElement('div'); e.className = 'k ' + k.cls; e.innerHTML = k.html; e.style.fontSize = k.size + 'px'; e.style.top = k.top + 'px'; e.style.lineHeight = '0.95'; $('#kw').appendChild(e); return e; });
function renderKW(t) {
  KW.forEach((k, i) => { const e = kwEls[i], a = prog(t, k.t, k.t + 0.22), o = prog(t, k.t + k.d - 0.2, k.t + k.d);
    if (t < k.t - 0.01 || t > k.t + k.d + 0.01) { e.style.opacity = 0; return; }
    const s = 1.35 - 0.35 * EASE.eout(a); e.style.opacity = (a * (1 - o)).toFixed(3);
    e.style.transform = `translateY(${(-30 * o).toFixed(1)}px) scale(${s.toFixed(3)})`; e.style.filter = `blur(${(10 * (1 - a) + 8 * o).toFixed(1)}px)`; });
}

/* ---------- captions (VO words, 1–3 word punches) ---------- */
const KEY = /^(space|location|both|carnegie|square|feet|oakville's|seven|oaks|ceilings|hardwood|fire|kitchen|island|pantry|primary|retreat|spa|bedrooms|laundry|parks|schools|hospital|403|407|qew|wait|nayaki)$/i;
const words = []; window.WORDS.forEach((w, i, a) => { if (w.w.startsWith(',') && words.length) { words[words.length - 1].w += w.w; words[words.length - 1].e = w.e; } else if (w.w.startsWith('-') && words.length) { words[words.length - 1].w += w.w; words[words.length - 1].e = w.e; } else words.push({ ...w }); });
const phrases = []; let cur = [];
words.forEach((w, i) => { cur.push(w); const n = words[i + 1]; if (/[.,?]$/.test(w.w) || cur.length >= 3 || !n || n.l !== w.l || n.s - w.e > 0.35) { phrases.push(cur); cur = []; } });
let capKey = -1;
function renderCaptions(t) {
  const el = $('#cap'); let pi = -1; for (let i = 0; i < phrases.length; i++) if (t >= phrases[i][0].s - 0.05) pi = i;
  const kwOn = KW.some((k) => t >= k.t - 0.05 && t <= k.t + k.d);
  const ph = phrases[pi], live = ph && t <= ph[ph.length - 1].e + 0.3 && t < 50.7 && !kwOn;
  if (!live) { if (capKey !== -1) { el.innerHTML = ''; capKey = -1; } return; }
  if (pi !== capKey) { capKey = pi; el.innerHTML = ph.map((w) => `<span class="w${KEY.test(w.w.replace(/[.,?]+$/, '')) ? ' k' : ''}">${w.w.replace(/[,]$/, '')}</span>`).join(' '); }
  ph.forEach((w, j) => { const e = el.children[j]; if (!e) return; const lt = t - w.s, p = clamp((lt + 0.05) / 0.14);
    e.style.opacity = lt < -0.05 ? 0 : clamp((lt + 0.05) / 0.06); e.style.transform = `translateY(${((1 - p) * 16).toFixed(1)}px) scale(${(1 + 0.4 * (1 - p)).toFixed(3)})`; });
}

/* ---------- photo -> depth mesh ---------- */
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
function depthSampler(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  return (u, v) => { const x = clamp(u) * (W - 1), y = clamp(v) * (H - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const s = (xx, yy) => d[(yy * W + xx) * 4] / 255; return (s(x0, y0) * (1 - fx) + s(x1, y0) * fx) * (1 - fy) + (s(x0, y1) * (1 - fx) + s(x1, y1) * fx) * fy; };
}
function photoMesh(photo, depthImg, near, far, hfov = 92) {
  const D = depthSampler(depthImg), tx = Math.tan((hfov * Math.PI) / 360), ty = tx / (photo.width / photo.height);
  const P = (u, v) => { const inv = 1 / far + D(u, v) * (1 / near - 1 / far), z = 1 / inv; return new THREE.Vector3((2 * u - 1) * tx * z, (1 - 2 * v) * ty * z, -z); };
  const SX = 320, SY = Math.round(SX / (photo.width / photo.height)), pos = new Float32Array((SX + 1) * (SY + 1) * 3), uv = new Float32Array((SX + 1) * (SY + 1) * 2), idx = [];
  for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) { const k = j * (SX + 1) + i, u = i / SX, v = j / SY, p = P(u, v); pos.set([p.x, p.y, p.z], k * 3); uv.set([u, 1 - v], k * 2); }
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = new THREE.Texture(photo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
  return { mesh, P, vfov: (2 * Math.atan(ty) * 180) / Math.PI };
}
function textPlane(lines, font, height) {
  const size = 220, c = document.createElement('canvas'), g = c.getContext('2d'); g.font = font.replace('SIZE', size + 'px');
  const w = Math.max(...lines.map((l) => g.measureText(l).width)); c.width = Math.ceil(w + size * 0.6); c.height = Math.ceil(size * 1.1 * lines.length + size * 0.4);
  g.font = font.replace('SIZE', size + 'px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.04;
  lines.forEach((l, i) => g.fillText(l, c.width / 2, size * 0.2 + size * 1.1 * (i + 0.5)));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry((height * c.width) / c.height, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 3; return m;
}

/* ---------- post ---------- */
const POST = { uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 }, uFrame: { value: 0 }, uDark: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uBlur,uFrame,uDark; varying vec2 vUv;
    float r(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.71)*43758.5453); }
    void main(){ vec3 c=vec3(0.); float n=0.; for(int i=-12;i<=12;i++){ float w=1.-abs(float(i))/13.; c+=texture2D(tDiffuse,vUv+vec2(float(i)*uBlur/12.,0.)).rgb*w; n+=w; } c/=n;
      c=pow(c,vec3(1.04)); c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.08); c*=vec3(1.02,1.0,.97);
      vec2 q=vUv-.5; c*=1.-dot(q,q)*.55; c*=1.-uDark; c+=(r(vUv*vec2(1080.,1920.))-.5)*.018; gl_FragColor=vec4(c,1.); }` };

/* ---------- timeline ---------- */
const clock = { t: 0 }; const master = gsap.timeline({ paused: true });
master.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = master;

let ready = false, renderer, composer, post, cam, scene, MAP;
async function init() {
  await Promise.all(['800 80px "Inter Tight"', '900 80px "Inter Tight"', '600 40px "Inter Tight"', '500 40px "Inter Tight"', 'italic 400 80px "Instrument Serif"', '400 80px "Instrument Serif"'].map((f) => document.fonts.load(f)));
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  cam = new THREE.PerspectiveCamera(60, 1080 / 1920, 0.05, 400);
  const cache = {}; const img = (p) => (cache[p] = cache[p] || loadImg('assets/' + p));
  for (const s of SHOTS) {
    if (s.kind !== 'depth' && s.kind !== 'reveal') continue;
    const [ph, dp] = await Promise.all([img(`photos/${s.photo}.jpg`), img(`depth/${s.photo}.png`)]);
    s.g = new THREE.Group(); const pm = photoMesh(ph, dp, s.near, s.far); s.g.add(pm.mesh); s.P = pm.P; s.vfov = pm.vfov;
    if (s.kind === 'reveal') {
      const [pa, da] = await Promise.all([img(`photos/${s.after}.jpg`), img(`depth/${s.after}.png`)]); const am = photoMesh(pa, da, s.near, s.far);
      const m = am.mesh.material; m.depthTest = false; am.mesh.renderOrder = 1; s.uP = { value: 0 };
      m.onBeforeCompile = (sh) => { sh.uniforms.uP = s.uP; sh.fragmentShader = 'uniform float uP;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float ed = vMapUv.x - uP; if (ed > 0.0) discard; diffuseColor.rgb += vec3(1.0,0.85,0.6) * smoothstep(0.012, 0.0, -ed) * 1.6;'); };
      s.g.add(am.mesh);
    }
    if (s.t3) { const o = s.t3; s.txt = textPlane(o.lines, o.font, o.h); const p = s.P(o.uv[0], o.uv[1]).multiplyScalar(o.mul || 1); p.y += o.lift || 0; s.base = p; if (o.floor) { s.txt.rotation.x = -Math.PI / 2; s.base.y += 0.02; } s.g.add(s.txt); }
    s.g.visible = false; scene.add(s.g);
  }
  MAP = makeMap(THREE, renderer); post = new ShaderPass(POST);
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam)); composer.addPass(post); composer.addPass(new OutputPass());
  ready = true; frame(clock.t); window.__resolveBuild && window.__resolveBuild();
}

/* ---------- per frame ---------- */
const tmpP = new THREE.Vector3();
function frame(t) {
  renderKW(t); renderCaptions(t);
  const si = SHOTS.findIndex((s) => t >= s.t0 && t < s.t1), S = SHOTS[si < 0 ? SHOTS.length - 1 : si];
  const out = si < SHOTS.length - 1 ? EASE.ein(prog(t, S.t1 - WHIP, S.t1)) : 0, inn = si > 0 ? 1 - EASE.eout(prog(t, S.t0, S.t0 + WHIP)) : 0;
  const yaw = -out * 0.3 + inn * 0.3, blur = Math.max(out, inn) * 0.055;
  // video shots: whip via CSS blur/translate
  for (const s of SHOTS) if (s.kind === 'video') { const e = $(s.el); const on = s === S; e.style.visibility = on ? 'visible' : 'hidden';
    if (on) { e.style.transform = `translateX(${(yaw * -900).toFixed(1)}px) scale(${(1.04 + 0.02 * Math.max(out, inn)).toFixed(3)})`; e.style.filter = blur > 0.002 ? `blur(${(blur * 260).toFixed(1)}px)` : 'none'; } }
  // UI pieces
  const ba = S.kind === 'reveal' ? prog(t, S.t0 + 0.15, S.t0 + 0.4) * (1 - prog(t, S.t1 - 0.25, S.t1)) : 0, rev = S.kind === 'reveal' ? prog(t, S.t0 + S.wipe[1] - 0.35, S.t0 + S.wipe[1]) : 0;
  $('#ba').style.opacity = ba.toFixed(3); $('#b-be').style.opacity = (1 - rev).toFixed(3); $('#b-af').style.opacity = rev.toFixed(3);
  $('#vs').style.opacity = (S.kind === 'reveal' ? prog(t, S.t0 + S.wipe[0], S.t0 + S.wipe[0] + 0.3) * (1 - prog(t, S.t1 - 0.25, S.t1)) : 0).toFixed(3);
  const ed = prog(t, 51.0, 51.8); $('#end').style.opacity = ed.toFixed(3);
  $('#end .e-price').style.transform = `translateY(${(40 * (1 - EASE.eout(prog(t, 51.0, 51.9)))).toFixed(1)}px)`;
  $('#end .e-card').style.transform = `translateY(${(80 * (1 - EASE.eout(prog(t, 51.6, 52.5)))).toFixed(1)}px)`; $('#end .e-card').style.opacity = prog(t, 51.6, 52.3).toFixed(3);
  $('#flash').style.opacity = (SHOTS.reduce((m, s) => Math.max(m, t >= s.t0 && s.t0 > 0 ? Math.exp(-(t - s.t0) * 18) * 0.12 : 0), 0)).toFixed(3);
  const mapOn = S.kind === 'map'; $('#map').style.opacity = mapOn ? 1 : 0;
  if (!ready) return;
  for (const s of SHOTS) if (s.g) s.g.visible = s === S;
  $('#gl').style.visibility = S.kind === 'video' ? 'hidden' : 'visible';
  let dark = 0;
  if (S.kind === 'depth' || S.kind === 'reveal') {
    const u = EASE[S.ease](prog(t, S.t0, S.t1)), lt = t - S.t0;
    tmpP.lerpVectors(V3(S.p0), V3(S.p1), u); cam.position.copy(tmpP);
    cam.lookAt(S.P(S.a0[0] + (S.a1[0] - S.a0[0]) * u, S.a0[1] + (S.a1[1] - S.a0[1]) * u)); cam.rotateY(yaw);
    cam.fov = S.vfov / (S.z0 + (S.z1 - S.z0) * u); cam.updateProjectionMatrix();
    if (S.txt) { const k = EASE.eout(prog(lt, S.t3.tin, S.t3.tin + 0.6)); S.txt.material.opacity = k; S.txt.position.copy(S.base);
      if (S.t3.floor) S.txt.scale.set(k, k, 1); else { if (S.t3.rise) S.txt.position.y -= 0.5 * (1 - k); else S.txt.position.y -= 0.5 * (1 - k); S.txt.lookAt(cam.position.x * 0.3, S.txt.position.y, cam.position.z); } }
    if (S.kind === 'reveal') S.uP.value = 0.18 + 0.64 * EASE.eio(prog(lt, S.wipe[0], S.wipe[1]));
    if (S.end) dark = 0.38 * prog(t, 50.9, 51.8);
    $('#gl').style.filter = 'none'; post.uniforms.uBlur.value = blur; post.uniforms.uDark.value = dark; post.uniforms.uFrame.value = Math.floor(t * 30) % 997;
    composer.render();
  } else if (mapOn) {
    MAP.render(t - S.t0, S.t1 - S.t0, { yaw, blur });
  }
}
init();

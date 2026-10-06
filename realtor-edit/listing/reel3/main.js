// 31 Carnegie Dr listing film: readable 4–5 s scenes with dynamic camera, fast light-FX transitions,
// motion graphics that land on the voiceover (title build, counting stats, staging reveals with sparkles,
// split screen, room cards, chips, map, price shine).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeMap } from './map.js';

const DUR = 63.5;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eout = (x) => 1 - Math.pow(1 - x, 3), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const $ = (s) => document.querySelector(s);
const pulse = (t, at, k = 10) => (t >= at ? Math.exp(-(t - at) * k) : 0);
const win = (t, a, b, fi = 0.3, fo = 0.3) => prog(t, a, a + fi) * (1 - prog(t, b - fo, b));
const fmt = (n) => n.toLocaleString('en-US');

/* ---------- scenes ---------- */
const SANS = '900 SIZE "Inter Tight"';
const D = (t0, t1, photo, near, far, o) => ({ kind: 'depth', t0, t1, photo, near, far, ...o });
const R = (t0, t1, photo, after, near, far, o) => ({ kind: 'reveal', t0, t1, photo, after, near, far, ...o });
const SHOTS = [
  { kind: 'video', t0: 0, t1: 4.6, el: '#w1' },
  D(4.6, 8.4, '001', 7, 60, { p0: [0, 0, 0], p1: [0, 0.45, -1.1], a0: [0.47, 0.53], a1: [0.47, 0.5], z0: 1.16, z1: 1.36, tr: 'bars' }),
  D(8.4, 12.9, '016', 1.2, 14, { p0: [0, 0, 0.1], p1: [0.05, -0.06, -0.5], a0: [0.63, 0.55], a1: [0.63, 0.5], z0: 1.06, z1: 1.32, tr: 'flash',
    t3: { lines: ['3,088', 'SQ FT'], font: SANS, h: 0.9, uv: [0.63, 0.76], floor: true, tin: 0.5 } }),
  R(12.9, 17.4, '026', '026s', 1.6, 9, { p0: [-0.05, 0, 0], p1: [0.1, 0.04, -0.3], a0: [0.39, 0.5], a1: [0.46, 0.48], z0: 1.14, z1: 1.26, wipe: [0.8, 2.0], tr: 'leak' }),
  R(17.4, 21.3, '024', '024s', 1.8, 11, { p0: [0, 0, 0], p1: [0.12, 0, -0.3], a0: [0.42, 0.5], a1: [0.48, 0.5], z0: 1.16, z1: 1.28, wipe: [0.6, 1.8], tr: 'bars' }),
  { kind: 'video', t0: 21.3, t1: 23.9, el: '#w2', tr: 'flare' },
  D(23.9, 27.5, '033', 1.6, 9, { p0: [-0.12, 0, 0], p1: [0.15, 0, -0.35], a0: [0.48, 0.5], a1: [0.55, 0.5], z0: 1.12, z1: 1.28, tr: 'leak',
    t3: { lines: ['KITCHEN'], font: SANS, h: 0.72, uv: [0.5, 0.515], mul: 0.84, lift: 0, tin: 0.5, rise: true } }),
  { kind: 'split', t0: 27.5, t1: 30.9, tr: 'bars' },
  { kind: 'video', t0: 30.9, t1: 33.7, el: '#w3', tr: 'flash' },
  D(33.7, 38.5, '053', 1.3, 8, { p0: [0, 0, 0], p1: [0.05, -0.04, -0.4], a0: [0.53, 0.5], a1: [0.55, 0.5], z0: 1.08, z1: 1.3, tr: 'flare',
    t3: { lines: ['SPA', 'ENSUITE'], font: SANS, h: 0.5, uv: [0.54, 0.78], floor: true, tin: 0.6 } }),
  R(38.5, 42.9, '056', '056s', 1.6, 9, { p0: [0, 0, 0], p1: [0.1, 0, -0.26], a0: [0.5, 0.52], a1: [0.56, 0.52], z0: 1.12, z1: 1.24, wipe: [0.6, 1.7], tr: 'leak' }),
  { kind: 'map', t0: 42.9, t1: 52.0, tr: 'bars' },
  D(52.0, 56.3, '005', 3, 14, { p0: [0, -0.1, 0], p1: [0, 0.25, -1.3], a0: [0.45, 0.6], a1: [0.45, 0.44], z0: 1.12, z1: 1.45, tr: 'flare' }),
  D(56.3, 63.5, '001', 7, 60, { p0: [0, 0.15, -0.2], p1: [0, 0.4, -0.8], a0: [0.47, 0.46], a1: [0.47, 0.43], z0: 1.2, z1: 1.3, end: true, tr: 'flash' }),
];
const SPLITP = [
  { photo: '037', near: 0.8, far: 4, p0: [0, 0, 0], p1: [0.05, 0, -0.15], a0: [0.55, 0.52], a1: [0.62, 0.52], z0: 1.25, z1: 1.42 },
  { photo: '038', near: 1.2, far: 6, p0: [0, 0, 0], p1: [0.06, 0, -0.2], a0: [0.36, 0.42], a1: [0.42, 0.42], z0: 1.2, z1: 1.38 },
  { photo: '042', near: 0.9, far: 4.5, p0: [0, 0, 0], p1: [0.05, 0, -0.2], a0: [0.56, 0.45], a1: [0.62, 0.45], z0: 1.15, z1: 1.32 },
];

/* ---------- kinetic words, room cards, chips ---------- */
const KW = [
  { t: 5.6, d: 2.6, html: 'gives you <span class="g">both.</span>', cls: 'serif', size: 150, top: 380 },
  { t: 13.85, d: 1.3, html: 'Bright, <span class="g">open living</span>', cls: 'serif', size: 128, top: 420 },
  { t: 15.15, d: 1.25, html: 'Soaring <span class="g">ceilings</span>', cls: 'serif', size: 140, top: 420 },
  { t: 16.4, d: 0.95, html: '<span class="g">Hardwood</span> throughout', cls: 'serif', size: 120, top: 420 },
  { t: 19.0, d: 2.1, html: 'built around <span class="g">the fire</span>', cls: 'serif', size: 124, top: 420 },
  { t: 34.4, d: 2.2, html: 'feels like <span class="g">a spa</span>', cls: 'serif', size: 150, top: 380 },
  { t: 39.3, d: 2.3, html: '<span class="g">4</span> BEDROOMS', cls: 'sans', size: 140, top: 420 },
  { t: 53.2, d: 1.45, html: 'Some homes<br/><span class="g">knock quietly</span>', cls: 'serif', size: 124, top: 380 },
  { t: 54.7, d: 1.55, html: 'This one<br/><span class="g">won\'t wait.</span>', cls: 'serif', size: 150, top: 380 },
];
const CARDS = [{ t: 21.6, e: 23.75, k: 'THE', v: 'Great Room' }, { t: 31.15, e: 33.55, k: 'UPSTAIRS', v: 'Primary Retreat' }];
const CHIPS = [{ t: 26.45, e: 27.4, txt: 'CENTRE ISLAND', x: 90, y: 1430 }, { t: 40.15, e: 42.75, txt: '2ND-FLOOR LAUNDRY', x: 90, y: 1430 }];
const kwEls = KW.map((k) => { const e = document.createElement('div'); e.className = 'k ' + k.cls; e.innerHTML = k.html; e.style.fontSize = k.size + 'px'; e.style.top = k.top + 'px'; e.style.lineHeight = '0.95'; $('#kw').appendChild(e); return e; });
const chipEls = CHIPS.map((c) => { const e = document.createElement('div'); e.className = 'chip'; e.innerHTML = `<i></i>${c.txt}`; e.style.left = c.x + 'px'; e.style.top = c.y + 'px'; $('#chips').appendChild(e); return e; });
const T1 = '31 Carnegie Dr'; $('#t1').innerHTML = [...T1].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');

/* ---------- captions ---------- */
const KEY = /^(space|location|both|carnegie|square|feet|oakville's|seven|oaks|open|ceilings|hardwood|fire|kitchen|hosting|island|cooktop|pantry|primary|retreat|spa|bedrooms|laundry|parks|schools|hospital|403|407|qew|wait|nayaki)$/i;
const words = []; window.WORDS.forEach((w) => { if ((w.w.startsWith(',') || w.w.startsWith('-')) && words.length) { words[words.length - 1].w += w.w; words[words.length - 1].e = w.e; } else words.push({ ...w }); });
const phrases = []; let cur = [];
words.forEach((w, i) => { cur.push(w); const n = words[i + 1]; if (/[.,?]$/.test(w.w) || cur.length >= 4 || !n || n.l !== w.l || n.s - w.e > 0.35) { phrases.push(cur); cur = []; } });
let capKey = -1;
function renderCaptions(t) {
  const el = $('#cap'); let pi = -1; for (let i = 0; i < phrases.length; i++) if (t >= phrases[i][0].s - 0.05) pi = i;
  const ph = phrases[pi], live = ph && t <= ph[ph.length - 1].e + 0.35 && t < 56.3 && !(t >= 27.5 && t < 30.9);
  if (!live) { if (capKey !== -1) { el.innerHTML = ''; capKey = -1; } return; }
  if (pi !== capKey) { capKey = pi; el.innerHTML = ph.map((w) => `<span class="w${KEY.test(w.w.replace(/[.,?]+$/, '')) ? ' k' : ''}">${w.w.replace(/[,]$/, '')}</span>`).join(' '); }
  ph.forEach((w, j) => { const e = el.children[j]; if (!e) return; const lt = t - w.s, p = clamp((lt + 0.05) / 0.16); e.style.opacity = lt < -0.05 ? 0.35 : 0.35 + 0.65 * p; e.style.transform = `translateY(${((1 - p) * 8).toFixed(1)}px)`; });
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
  const Dd = depthSampler(depthImg), tx = Math.tan((hfov * Math.PI) / 360), ty = tx / (photo.width / photo.height);
  const P = (u, v) => { const inv = 1 / far + Dd(u, v) * (1 / near - 1 / far), z = 1 / inv; return new THREE.Vector3((2 * u - 1) * tx * z, (1 - 2 * v) * ty * z, -z); };
  const SX = 300, SY = Math.round(SX / (photo.width / photo.height)), pos = new Float32Array((SX + 1) * (SY + 1) * 3), uv = new Float32Array((SX + 1) * (SY + 1) * 2), idx = [];
  for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) { const k = j * (SX + 1) + i, u = i / SX, v = j / SY, p = P(u, v); pos.set([p.x, p.y, p.z], k * 3); uv.set([u, 1 - v], k * 2); }
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = new THREE.Texture(photo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  return { mesh: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })), P, vfov: (2 * Math.atan(ty) * 180) / Math.PI };
}
function textPlane(lines, font, height) {
  const size = 220, c = document.createElement('canvas'), g = c.getContext('2d'); g.font = font.replace('SIZE', size + 'px');
  const w = Math.max(...lines.map((l) => g.measureText(l).width)); c.width = Math.ceil(w + size * 0.6); c.height = Math.ceil(size * 1.1 * lines.length + size * 0.4);
  g.font = font.replace('SIZE', size + 'px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.04;
  lines.forEach((l, i) => g.fillText(l, c.width / 2, size * 0.2 + size * 1.1 * (i + 0.5)));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry((height * c.width) / c.height, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 3; return m;
}

/* ---------- post: bright airy grade ---------- */
const POST = { uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uDark: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame,uDark; varying vec2 vUv; float r(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.71)*43758.5453); }
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c=c*1.06+.012; c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.1); c*=vec3(1.02,1.0,.975);
      c*=1.-uDark; c+=(r(vUv*vec2(1080.,1920.))-.5)*.012; gl_FragColor=vec4(c,1.); }` };

/* ---------- timeline ---------- */
const clock = { t: 0 }; const master = gsap.timeline({ paused: true });
master.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = master;

let ready = false, renderer, composer, post, cam, scene, MAP;
async function build(s) {
  const [ph, dp] = await Promise.all([loadImg(`assets/photos/${s.photo}.jpg`), loadImg(`assets/depth/${s.photo}.png`)]);
  s.g = new THREE.Group(); const pm = photoMesh(ph, dp, s.near, s.far); s.g.add(pm.mesh); s.P = pm.P; s.vfov = pm.vfov;
  if (s.after) { const [pa, da] = await Promise.all([loadImg(`assets/photos/${s.after}.jpg`), loadImg(`assets/depth/${s.after}.png`)]); const am = photoMesh(pa, da, s.near, s.far);
    const m = am.mesh.material; m.depthTest = false; am.mesh.renderOrder = 1; s.uP = { value: 0 };
    m.onBeforeCompile = (sh) => { sh.uniforms.uP = s.uP; sh.fragmentShader = 'uniform float uP;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float ed = vMapUv.x - uP; if (ed > 0.0) discard; diffuseColor.rgb += vec3(1.0,0.88,0.65) * smoothstep(0.016, 0.0, -ed) * 2.0;'); };
    s.g.add(am.mesh); }
  if (s.t3) { const o = s.t3; s.txt = textPlane(o.lines, o.font, o.h); const p = s.P(o.uv[0], o.uv[1]).multiplyScalar(o.mul || 1); p.y += o.lift || 0; s.base = p; if (o.floor) { s.txt.rotation.x = -Math.PI / 2; s.base.y += 0.02; } s.g.add(s.txt); }
  s.g.visible = false; scene.add(s.g);
}
async function init() {
  await Promise.all(['700 80px "Inter Tight"', '800 80px "Inter Tight"', '900 80px "Inter Tight"', '600 40px "Inter Tight"', 'italic 400 80px "Instrument Serif"', '400 80px "Instrument Serif"'].map((f) => document.fonts.load(f)));
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(60, 1080 / 1920, 0.05, 400);
  for (const s of SHOTS) if (s.photo) await build(s);
  for (const s of SPLITP) await build(s);
  MAP = makeMap(THREE, renderer);
  post = new ShaderPass(POST); composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam)); composer.addPass(post); composer.addPass(new OutputPass());
  ready = true; frame(clock.t); window.__resolveBuild && window.__resolveBuild();
}
function place(s, u, aspect = 1080 / 1920, settle = 1) {
  cam.aspect = aspect; cam.position.set(s.p0[0] + (s.p1[0] - s.p0[0]) * u, s.p0[1] + (s.p1[1] - s.p0[1]) * u, s.p0[2] + (s.p1[2] - s.p0[2]) * u);
  cam.lookAt(s.P(s.a0[0] + (s.a1[0] - s.a0[0]) * u, s.a0[1] + (s.a1[1] - s.a0[1]) * u));
  const z = (s.z0 + (s.z1 - s.z0) * u) * settle;
  cam.fov = aspect > 1 ? (2 * Math.atan(Math.tan((46 * Math.PI) / 180) / aspect) * 180) / Math.PI / z : s.vfov / z; cam.updateProjectionMatrix();
}

/* ---------- sparkles ---------- */
const sp = $('#spark').getContext('2d');
function sparkles(t, pts) {
  sp.clearRect(0, 0, 1080, 1920); if (!pts) return;
  for (let i = 0; i < 150; i++) { const h = Math.sin(i * 91.7) * 43758.5453, r1 = h - Math.floor(h), h2 = Math.sin(i * 17.3) * 9631.3, r2 = h2 - Math.floor(h2);
    const tb = pts.t0 + r1 * pts.d, age = t - tb; if (age < 0 || age > 1.2) continue;
    const y = 300 + r2 * 1300 - age * 120, x = pts.x(tb) + (r2 - 0.5) * 60 + Math.sin(age * 6 + i) * 10, a = (1 - age / 1.2) * (0.6 + 0.4 * Math.sin(age * 30 + i)), sz = 2 + r1 * 6;
    const g = sp.createRadialGradient(x, y, 0, x, y, sz * 5); g.addColorStop(0, `rgba(255,245,220,${a})`); g.addColorStop(0.3, `rgba(255,210,140,${a * 0.6})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    sp.fillStyle = g; sp.fillRect(x - sz * 5, y - sz * 5, sz * 10, sz * 10);
    sp.fillStyle = `rgba(255,255,255,${a})`; sp.fillRect(x - sz * 2.2, y - 0.6, sz * 4.4, 1.2); sp.fillRect(x - 0.6, y - sz * 2.2, 1.2, sz * 4.4); }
}

/* ---------- per frame ---------- */
function frame(t) {
  renderCaptions(t);
  const si = SHOTS.findIndex((s) => t >= s.t0 && t < s.t1), S = SHOTS[si < 0 ? SHOTS.length - 1 : si], lt = t - S.t0;

  // intro title (0 - 4.6)
  const bIn = back(prog(t, 0.3, 0.7)), out1 = prog(t, 4.2, 4.5);
  $('#badge').style.opacity = (prog(t, 0.3, 0.45) * (1 - out1)).toFixed(3); $('#badge').style.transform = `translateX(-50%) scale(${(0.6 + 0.4 * bIn).toFixed(3)})`;
  const dp = (t * 1.4) % 1; $('#badge .dot').style.boxShadow = `0 0 0 ${(dp * 18).toFixed(1)}px rgba(232,72,60,${(0.6 * (1 - dp)).toFixed(2)})`;
  [...$('#t1').children].forEach((e, i) => { const k = eout(prog(t, 0.9 + i * 0.06, 1.4 + i * 0.06)); e.style.opacity = (k * (1 - out1)).toFixed(3); e.style.transform = `translateY(${(70 * (1 - k)).toFixed(1)}px) rotate(${(8 * (1 - k)).toFixed(1)}deg)`; e.style.filter = `blur(${(8 * (1 - k)).toFixed(1)}px)`; });
  $('#tline').style.transform = `scaleX(${(expo(prog(t, 1.9, 2.6)) * (1 - out1)).toFixed(3)})`;
  $('#t2').style.opacity = (prog(t, 2.3, 2.7) * (1 - out1)).toFixed(3); $('#t2').style.letterSpacing = (0.7 - 0.28 * eout(prog(t, 2.3, 3.3))).toFixed(3) + 'em';

  // kinetic words
  KW.forEach((k, i) => { const e = kwEls[i], a = prog(t, k.t, k.t + 0.3), o = prog(t, k.t + k.d - 0.25, k.t + k.d);
    if (t < k.t || t > k.t + k.d) { e.style.opacity = 0; return; }
    e.style.opacity = (a * (1 - o)).toFixed(3); e.style.transform = `translateY(${(-24 * o + 30 * (1 - eout(a))).toFixed(1)}px) scale(${(1.18 - 0.18 * eout(a)).toFixed(3)})`; e.style.filter = `blur(${(8 * (1 - a) + 6 * o).toFixed(1)}px)`; });
  const kwA = Math.max(0, ...KW.map((k) => win(t, k.t - 0.1, k.t + k.d + 0.1, 0.3, 0.3)), ...CARDS.map((c) => win(t, c.t - 0.1, c.e, 0.3, 0.3)), (t > 0.2 && t < 4.5 ? 0 : 0));
  $('#kwbg').style.opacity = kwA.toFixed(3);
  // room cards
  const card = CARDS.find((c) => t >= c.t && t < c.e);
  if (card) { $('#card .c-k').textContent = card.k; $('#card .c-t').textContent = card.v; const k = back(prog(t, card.t, card.t + 0.45)); $('#card').style.opacity = win(t, card.t, card.e, 0.2, 0.25).toFixed(3); $('#card').style.transform = `translateX(${(-120 * (1 - k)).toFixed(1)}px)`; } else $('#card').style.opacity = 0;
  CHIPS.forEach((c, i) => { const k = back(prog(t, c.t, c.t + 0.4)); chipEls[i].style.opacity = win(t, c.t, c.e, 0.2, 0.25).toFixed(3); chipEls[i].style.transform = `scale(${(0.6 + 0.4 * k).toFixed(3)})`; });
  // stats card (hallway)
  const sIn = back(prog(t, 9.4, 9.9)); $('#stats').style.opacity = win(t, 9.4, 12.7, 0.2, 0.3).toFixed(3); $('#stats').style.transform = `translateY(${(140 * (1 - sIn)).toFixed(1)}px)`;
  document.querySelectorAll('#stats path').forEach((p, i) => (p.style.strokeDashoffset = (200 * (1 - eout(prog(t, 9.6 + i * 0.15, 10.4 + i * 0.15)))).toFixed(1)));
  $('#n1').textContent = Math.round(4 * eout(prog(t, 9.7, 10.3))); $('#n2').textContent = Math.round(4 * eout(prog(t, 9.85, 10.45))); $('#n3').textContent = fmt(Math.round(3088 * eout(prog(t, 10.0, 11.0))));
  // before / after
  const isR = S.kind === 'reveal', rev = isR ? prog(t, S.t0 + S.wipe[1] - 0.3, S.t0 + S.wipe[1]) : 0;
  $('#ba').style.opacity = (isR ? win(t, S.t0 + 0.2, S.t1, 0.25, 0.3) : 0).toFixed(3); $('#b-be').style.opacity = (1 - rev).toFixed(3); $('#b-af').style.opacity = rev.toFixed(3);
  $('#b-af').style.transform = `translateX(-50%) scale(${(1 + 0.25 * (isR ? pulse(t, S.t0 + S.wipe[1], 6) : 0)).toFixed(3)})`;
  $('#vs').style.opacity = (isR ? win(t, S.t0 + S.wipe[0], S.t1, 0.3, 0.3) : 0).toFixed(3);
  // split labels
  const inS = S.kind === 'split'; [[27.75, '#sp1'], [28.35, '#sp2'], [29.05, '#sp3']].forEach(([a, id]) => { const k = eout(prog(t, a, a + 0.4)); const e = $(id + ' span'); e.style.opacity = (inS ? k * (1 - prog(t, 30.65, 30.9)) : 0).toFixed(3); e.style.transform = `translateX(${(-80 * (1 - k)).toFixed(1)}px)`; });
  // map container
  $('#map').style.opacity = S.kind === 'map' ? 1 : 0;
  // end card
  const eIn = prog(t, 56.45, 56.8); $('#end').style.opacity = eIn.toFixed(3);
  $('#price').textContent = 'C$' + fmt(Math.round(1599000 * expo(prog(t, 56.6, 57.8)) / 1000) * 1000);
  $('#price').style.transform = `scale(${(0.85 + 0.15 * back(prog(t, 56.5, 57.0))).toFixed(3)})`;
  $('.shine').style.left = (-200 + 1500 * eio(prog(t, 58.0, 58.6))) + 'px';
  $('#end .e-addr').style.opacity = prog(t, 57.3, 57.7).toFixed(3); $('#end .e-addr').style.transform = `translateY(${(30 * (1 - eout(prog(t, 57.3, 57.8)))).toFixed(1)}px)`;
  $('#end .e-specs').style.opacity = prog(t, 57.7, 58.1).toFixed(3);
  $('#end .e-card').style.opacity = prog(t, 58.3, 58.6).toFixed(3); $('#end .e-card').style.transform = `translateY(${(120 * (1 - back(prog(t, 58.3, 58.8)))).toFixed(1)}px)`;

  // transitions: fast light FX centred on each cut
  let fl = pulse(t, 0, 6) * 0.6, leak = 0, flareK = -1, bw = -1;
  for (const s of SHOTS) { if (!s.tr) continue; const d = t - s.t0;
    if (s.tr === 'flash') fl = Math.max(fl, pulse(t, s.t0, 9) * 0.75);
    if (s.tr === 'bars' && d > -0.28 && d < 0.3) bw = (d + 0.28) / 0.58;
    if (s.tr === 'leak' && d > -0.3 && d < 0.4) leak = Math.max(leak, Math.sin(Math.PI * (d + 0.3) / 0.7));
    if (s.tr === 'flare' && d > -0.3 && d < 0.35) flareK = (d + 0.3) / 0.65;
    if (s.tr !== 'flash') fl = Math.max(fl, pulse(t, s.t0, 12) * 0.35); }
  if (t > 0.02 && t < 0.9) flareK = prog(t, 0.05, 0.9);
  $('#flash').style.opacity = fl.toFixed(3);
  $('#leak').style.opacity = (leak * 0.95).toFixed(3); $('#leak').style.transform = `translateX(${(-150 + 300 * leak).toFixed(0)}px) rotate(${(15 * leak).toFixed(1)}deg)`;
  $('#flare').style.opacity = flareK >= 0 ? Math.sin(flareK * Math.PI).toFixed(3) : 0; if (flareK >= 0) $('#flare i').style.transform = `translateX(${(-700 + 1600 * flareK).toFixed(0)}px) scaleY(${(0.6 + 0.6 * Math.sin(flareK * Math.PI)).toFixed(2)})`;
  document.querySelectorAll('#bars i').forEach((e, i) => { const k = bw >= 0 ? eio(clamp(bw * 1.25 - i * 0.12)) : 0; e.style.transform = `rotate(18deg) translateX(${(-1700 + 3600 * k).toFixed(0)}px)`; e.style.left = 260 + i * 280 + 'px'; });

  // video shots: gentle settle zoom
  for (const s of SHOTS) if (s.kind === 'video') { const e = $(s.el), on = s === S; e.style.visibility = on ? 'visible' : 'hidden'; if (on) e.style.transform = `scale(${(1.1 - 0.08 * eout(prog(t, s.t0, s.t1))).toFixed(3)})`; }
  if (!ready) return;
  $('#gl').style.visibility = S.kind === 'video' ? 'hidden' : 'visible'; $('#gl').style.filter = 'none';
  for (const s of SHOTS) if (s.g) s.g.visible = false; for (const s of SPLITP) s.g.visible = false;
  post.uniforms.uFrame.value = Math.floor(t * 30) % 997;
  const settle = 1 + 0.1 * (1 - eout(prog(lt, 0, 0.7)));   // quick punch-in that settles: dynamic but readable
  if (S.kind === 'depth' || S.kind === 'reveal') {
    S.g.visible = true; place(S, eio(prog(t, S.t0, S.t1)), 1080 / 1920, settle);
    if (S.txt) { const k = eout(prog(lt, S.t3.tin, S.t3.tin + 0.6)); S.txt.material.opacity = k; S.txt.position.copy(S.base);
      if (S.t3.floor) S.txt.scale.set(k, k, 1); else { S.txt.position.y -= 0.45 * (1 - k); S.txt.lookAt(cam.position.x * 0.3, S.txt.position.y, cam.position.z); } }
    if (isR) S.uP.value = 0.18 + 0.64 * eio(prog(lt, S.wipe[0], S.wipe[1]));
    post.uniforms.uDark.value = S.end ? 0.32 * prog(t, 56.5, 57.2) : 0; composer.render();
    if (isR) { const ex = (tt) => { const w = 0.18 + 0.64 * eio(prog(tt - S.t0, S.wipe[0], S.wipe[1])); const p = S.P(w, 0.5).project(cam); return (p.x * 0.5 + 0.5) * 1080; };
      sparkles(t, { t0: S.t0 + S.wipe[0], d: S.wipe[1] - S.wipe[0], x: ex }); } else sparkles(t, null);
  } else if (inS) {
    sparkles(t, null); renderer.setScissorTest(true); renderer.setClearColor(0xffffff, 1); renderer.clear();
    SPLITP.forEach((s, i) => { const slide = eout(prog(lt, i * 0.15, 0.5 + i * 0.15)); const x = Math.round(1080 * (1 - slide)); const y = 1920 - (i * 644 + 632);
      for (const q of SPLITP) q.g.visible = q === s; renderer.setViewport(x, y, 1080, 632); renderer.setScissor(x, y, 1080, 632); place(s, eio(prog(lt, 0, 3.4)), 1080 / 632); renderer.render(scene, cam); });
    renderer.setScissorTest(false); renderer.setViewport(0, 0, 1080, 1920); renderer.setClearColor(0x000000, 1);
  } else if (S.kind === 'map') { sparkles(t, null); MAP.render(lt, S.t1 - S.t0, { yaw: 0, blur: 0 }); }
  else sparkles(t, null);
}
init();

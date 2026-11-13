// EPISODE 01 — "The Concrete That Heals Itself". Every value here is a pure function of time (seconds).
// Narration phrase times (s): hook 0.00-2.97 | toss 3.14-5.17 | hiss 5.33-6.03 | lumps 6.22-8.69 | "Ha!" 8.86 | "Sloppy work!" 9.31-10.33 |
// 2000 yrs 10.49-13.83 | crumbled 13.99-16.34 | crack 16.52-17.93 | trickle 18.10-19.46 | seal 19.64-21.51 | pockets 21.67-23.98 |
// dissolve 24.15-27.44 | "Roman concrete" 27.62-28.78 | "heals itself" 28.95-29.91
import { sstep, lerp } from './core.js';
import { drawChar, CAST, fx } from './chars.js';
import { world } from './world.js';

export const FPS = 30, DURATION = 30.6, TOTAL = Math.round(DURATION * FPS);
const TOP = world.WALL.top, C0 = world.CUT_ORIGIN[1];
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const S = (t, a, b) => sstep(ramp(t, a, b));

export const SHOTS = [
  { id: 'hook', a: 0, b: 3.05, light: 'roman' },
  { id: 'toss', a: 3.05, b: 6.15, light: 'roman' },
  { id: 'lumps', a: 6.15, b: 8.78, light: 'roman' },
  { id: 'laugh', a: 8.78, b: 10.42, light: 'roman' },
  { id: 'ages', a: 10.42, b: 13.95, light: 'modern' },
  { id: 'ruin', a: 13.95, b: 16.45, light: 'modern' },
  { id: 'crack', a: 16.45, b: 19.62, light: 'modern' },
  { id: 'dive', a: 19.62, b: 20.3, light: 'modern' },
  { id: 'inside', a: 20.3, b: 27.55, light: 'cut' },
  { id: 'payoff', a: 27.55, b: 30.6, light: 'golden' },
];
export const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const LIGHTS = {
  roman: { az: 112, el: 21, sun: '#ffd09a', sunI: 3.3, sky: '#a8bce2', ground: '#8c6a48', hemi: 0.72, fog: '#f0cfae', fogNear: 45, fogFar: 700, skyTop: '#5d86c6', skyHor: '#ffd4a6', sunGlow: 0.5,
    sat: 1.08, con: 0.34, shT: '#d0d4f2', hiT: '#fff0dc', vig: 0.28, glowI: 0.55, thr: 0.86, shadowExt: 14 },
  modern: { az: 64, el: 38, sun: '#fff2e0', sunI: 3.1, sky: '#a9c2e6', ground: '#7d7464', hemi: 0.82, fog: '#cbdcec', fogNear: 60, fogFar: 760, skyTop: '#3b74c4', skyHor: '#cfe2f2', sunGlow: 0.3,
    sat: 1.04, con: 0.3, shT: '#cad8f4', hiT: '#fff6ea', vig: 0.26, glowI: 0.45, thr: 0.9, shadowExt: 30 },
  cut: { az: 120, el: 50, sun: '#cfeaff', sunI: 0.5, sky: '#3d7891', ground: '#0f1a20', hemi: 0.35, fog: '#0c1a20', fogNear: 400, fogFar: 3000, skyTop: '#0c1a20', skyHor: '#0c1a20', sunGlow: 0,
    sat: 1.1, con: 0.42, shT: '#c8e2ff', hiT: '#fff4e2', vig: 0.4, glowI: 0.95, thr: 0.72, shadowExt: 12, inkFar: 60 },
  golden: { az: 118, el: 10, sun: '#ffb46a', sunI: 3.6, sky: '#9a96cc', ground: '#6a4a3a', hemi: 0.7, fog: '#f2b88a', fogNear: 50, fogFar: 650, skyTop: '#5a5aa4', skyHor: '#ffbd7c', sunGlow: 0.9,
    sat: 1.1, con: 0.38, shT: '#cbc6ee', hiT: '#fff0d8', vig: 0.3, glowI: 0.7, thr: 0.82, shadowExt: 30 },
};

// ---------- cameras: {t, pos, look, fov, roll} ----------
const CAMS = {
  hook: [{ t: 0, pos: [-0.7, 5.05, 4.9], look: [0.75, 5.0, 1.45], fov: 36 }, { t: 3.05, pos: [-0.25, 5.0, 3.95], look: [0.8, 4.95, 1.45], fov: 33 }],
  toss: [{ t: 3.05, pos: [5.2, 5.7, 5.9], look: [0.2, 4.3, 0.5], fov: 47 }, { t: 5.2, pos: [4.8, 5.55, 5.4], look: [0.3, 4.25, 0.5], fov: 45 }, { t: 6.15, pos: [4.65, 5.5, 5.2], look: [0.4, 4.2, 0.5], fov: 44 }],
  lumps: [{ t: 6.15, pos: [2.25, 5.55, 2.75], look: [2.6, 3.9, 0.95], fov: 38 }, { t: 8.78, pos: [2.45, 4.95, 1.95], look: [2.65, 3.88, 0.92], fov: 34 }],
  laugh: [{ t: 8.78, pos: [-7.5, 5.3, 3.4], look: [-1.9, 4.8, 1.2], fov: 40 }, { t: 10.42, pos: [-6.9, 5.2, 3.1], look: [-1.8, 4.8, 1.15], fov: 38 }],
  ages: [{ t: 10.42, pos: [38, 5.2, -17], look: [6, 2.6, 0], fov: 42 }, { t: 13.95, pos: [31, 4.2, -13], look: [4, 2.8, 0], fov: 40 }],
  ruin: [{ t: 13.95, pos: [-4, 8.5, 40], look: [-32, 2.2, 12], fov: 46 }, { t: 16.45, pos: [-8, 7.0, 36], look: [-33, 2.2, 11], fov: 44 }],
  crack: [{ t: 16.45, pos: [6.1, 2.0, 8.6], look: [6.0, 1.85, 4.2], fov: 32 }, { t: 19.62, pos: [6.05, 1.97, 7.0], look: [6.0, 1.88, 4.2], fov: 29 }],
  dive: [{ t: 19.62, pos: [6.05, 1.97, 7.0], look: [6.0, 1.88, 4.2], fov: 29 }, { t: 20.3, pos: [6.0, 1.95, 4.42], look: [6.0, 1.92, 3.5], fov: 16, roll: 7 }],
  inside: [{ t: 20.3, pos: [0.15, C0 + 0.5, 2.1], look: [0, C0, -2], fov: 52, roll: -6, ease: 'out' }, { t: 22.6, pos: [5.6, C0 + 2.4, 10.6], look: [0, C0 - 0.2, 0], fov: 46 },
    { t: 25.2, pos: [1.2, C0 + 3.2, 11.8], look: [0, C0 - 0.4, 0], fov: 44 }, { t: 27.55, pos: [-6.2, C0 + 1.2, 9.6], look: [0, C0, 0], fov: 42 }],
  payoff: [{ t: 27.55, pos: [6.05, 1.97, 6.1], look: [6.0, 1.9, 4.2], fov: 30 }, { t: 28.9, pos: [10, 2.6, 11], look: [3, 2.4, 2], fov: 42 }, { t: 30.6, pos: [19, 1.6, 12.5], look: [-12, 4.2, 0], fov: 44 }],
};
const KICKS = [{ t: 3.6, a: 0.025 }, { t: 5.34, a: 0.03 }, { t: 9.32, a: 0.02 }, { t: 16.62, a: 0.05 }, { t: 17.05, a: 0.03 }, { t: 28.02, a: 0.035 }];

export const viewAt = (t, camAt) => {
  const sh = shotAt(t), v = camAt(CAMS[sh.id], t, KICKS);
  // lens: focus + blur per shot
  const d = (p) => Math.hypot(v.pos[0] - p[0], v.pos[1] - p[1], v.pos[2] - p[2]);
  const F = { hook: [[0.75, 5.0, 1.45], 11], toss: [[1.6, 4.4, 1.1], 7], lumps: [[2.6, 3.92, 0.95], 9], laugh: [[-1.6, 5.0, 0.2], 10], ages: [[14, 1, 0], 0], ruin: [[-20, 1, 12], 0],
    crack: [[6, 1.9, 4.2], 6], dive: [[6, 1.9, 4.2], 4], inside: [[0, C0, 0], 5], payoff: [[6, 1.9, 4.2], 3] }[sh.id];
  v.focus = d(F[0]); v.blur = F[1]; v.nearK = 0.8;
  if (sh.id === 'payoff') v.blur = lerp(5, 0, S(t, 27.6, 29.0));
  v.flash = t >= 10.42 && t < 10.75 ? 0.9 * (1 - ramp(t, 10.42, 10.75)) : t >= 20.1 && t < 20.55 ? (t < 20.3 ? ramp(t, 20.1, 20.3) : 1 - ramp(t, 20.3, 20.55)) * 0.95 : 0;
  v.fade = ramp(t, 30.25, 30.6);
  v.shadowFocus = sh.id === 'ages' || sh.id === 'ruin' ? [0, 2, 6] : sh.light === 'cut' ? [0, C0, 0] : sh.id === 'payoff' ? [8, 2, 4] : v.look;
  return v;
};

// ---------- story state for the world ----------
export const stateAt = (t) => {
  const sh = shotAt(t), modern = ['ages', 'ruin', 'crack', 'dive', 'payoff'].includes(sh.id);
  const st = { era: modern ? 'modern' : 'roman', lumps: S(t, 3.95, 6.6), waves: sh.id === 'payoff' ? 1.25 : modern ? 1.1 : 0.7 };
  if (modern) { st.crack = sh.id === 'payoff' ? 1 : S(t, 16.6, 17.5); st.trickle = sh.id === 'payoff' ? 0 : S(t, 18.1, 19.4); st.seal = sh.id === 'payoff' ? 1 : 0; }
  if (sh.id === 'inside') st.cutaway = { water: S(t, 20.3, 21.7), grow: S(t, 20.9, 27.0), dissolve: S(t, 23.6, 26.9), glow: S(t, 21.6, 22.3) * (1 - S(t, 25.6, 27)) };
  return st;
};

// ---------- actors (2D cards) ----------
const P = (keys, t) => { // interpolate numeric pose fields between keyed poses; non-numeric fields switch at the key
  let a = keys[0], b = keys[0]; for (let i = 0; i < keys.length; i++) { if (keys[i].t <= t) a = keys[i]; if (keys[i].t >= t) { b = keys[i]; break; } b = keys[i]; }
  const k = a === b ? 0 : sstep((t - a.t) / (b.t - a.t)), out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const va = a[key] ?? b[key], vb = b[key] ?? a[key];
    if (Array.isArray(va) && typeof va[0] === 'number') out[key] = va.map((x, i) => lerp(x, vb[i], k)); else if (typeof va === 'number') out[key] = lerp(va, vb, k); else out[key] = k < 0.5 ? va : vb; }
  return out; };
const qz = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v));
const blink = (t, seed) => { const per = 2.6 + (seed % 5) * 0.37, ph = (t + seed * 0.71) % per; return ph < 0.06 ? 0.6 : ph < 0.13 ? 1 : ph < 0.18 ? 0.5 : 0; };
const life = (t, seed, amp = 1) => ({ lean: amp * 1.2 * Math.sin(t * 1.3 + seed), headTilt: amp * 2.2 * Math.sin(t * 0.9 + seed * 2), bob: 0.08 * amp * (1 + Math.sin(t * 2.6 + seed)) });
const actor = (who, pose, pos, t, seed, extra = {}) => { const lf = life(t, seed, pose.calm ? 0.4 : 1);
  const p = { ...pose, lean: (pose.lean || 0) + lf.lean, headTilt: (pose.headTilt || 0) + lf.headTilt, bob: (pose.bob || 0) + lf.bob, blink: pose.eyes === 'happy' ? 0 : Math.max(pose.blink || 0, blink(t, seed)) };
  return { key: who + qz(p), draw: (g) => drawChar(g, CAST[who], p), pos, ...extra }; };

const SHOVEL = (angle, load) => ({ type: 'shovel', angle, load });
const BUILDER = [
  { t: 0, expr: 'sly', look: [-0.55, -0.1], armR: [62, 34], armL: [24, 52], prop: SHOVEL(-22, 1) },
  { t: 1.5, expr: 'sly', look: [0.7, 0.35], armR: [64, 34], armL: [26, 54], prop: SHOVEL(-20, 1), headTilt: 6 },
  { t: 3.05, expr: 'effort', look: [0.8, 0.3], armR: [62, 34], armL: [26, 54], prop: SHOVEL(-20, 1) },
  { t: 3.42, expr: 'effort', look: [0.8, 0.3], armR: [18, 46], armL: [40, 60], prop: SHOVEL(-62, 1), lean: -7, squash: 0.15 },
  { t: 3.62, expr: 'effort', look: [0.9, 0.4], armR: [128, 12], armL: [60, 40], prop: SHOVEL(78, 0), lean: 9, squash: -0.12 },
  { t: 4.2, expr: 'smug', look: [0.9, 0.5], armR: [80, 26], armL: [30, 50], prop: SHOVEL(40, 0), lean: 3 },
  { t: 5.3, expr: 'smug', look: [0.9, 0.5], armR: [78, 26], armL: [30, 50], prop: SHOVEL(38, 0) },
  { t: 5.5, expr: 'surprised', look: [0.9, 0.6], armR: [86, 40], armL: [80, 60], prop: SHOVEL(30, 0), lean: -8, squash: 0.1 },
  { t: 6.1, expr: 'proud', look: [0.6, 0.4], armR: [78, 26], armL: [30, 50], prop: SHOVEL(38, 0), lean: -2 },
  { t: 8.78, expr: 'proud', look: [-0.8, 0], armR: [78, 26], armL: [30, 50], prop: SHOVEL(38, 0) },
  { t: 9.35, expr: 'worried', look: [-0.9, 0], armR: [44, 90], armL: [44, 90], prop: SHOVEL(38, 0), lean: 2 },
  { t: 10.42, expr: 'worried', look: [-0.9, 0.1], armR: [48, 95], armL: [48, 95], prop: SHOVEL(38, 0), lean: 2 },
];
const FOREMAN = [
  { t: 3, expr: 'smug', look: [0.9, 0.2], armL: [30, 84], armR: [26, 70], prop: { type: 'tablet' }, calm: true },
  { t: 8.7, expr: 'smug', look: [0.9, 0.3], armL: [30, 84], armR: [26, 70], prop: { type: 'tablet' }, calm: true },
  { t: 8.9, expr: 'laugh', armR: [98, -12], armL: [26, 96], prop: { type: 'tablet' }, propHand: 'L', lean: -8, mustacheLift: 0.3 },
  { t: 10.42, expr: 'laugh', armR: [94, -8], armL: [26, 96], prop: { type: 'tablet' }, propHand: 'L', lean: -9, mustacheLift: 0.3 },
];
export const actorsAt = (t) => {
  const sh = shotAt(t), out = [];
  if (['hook', 'toss', 'lumps', 'laugh'].includes(sh.id)) {
    const b = P(BUILDER, t); out.push(actor('builder', b, [0.62, TOP, 1.5], t, 3));
    if (sh.id !== 'hook') { const f = P(FOREMAN, t); if (sh.id === 'laugh') { const k = Math.abs(Math.sin(t * 11)); f.bob = k * 0.5; f.headTilt = (f.headTilt || 0) + Math.sin(t * 11) * 4; f.squash = k * 0.06; }
      out.push(actor('foreman', f, [-1.75, TOP, 0.15], t, 7)); }
    // background crew: one walks a basket along the wall, one turns the crane wheel
    const wx = -14 + ((t * 0.9) % 14); out.push(actor('worker', { expr: 'focus', step: (t * 1.6) % 1, armL: [140, 30], armR: [140, 30], look: [1, 0] }, [wx, TOP, -2.2], t, 11));
    out.push(actor('worker', { expr: 'effort', step: (t * 1.3) % 1, armL: [100, 20], armR: [100, 20], look: [0.6, -0.4] }, [13.0, TOP + 0.15, -1.2], t, 13, { s: 0.95 }));
  }
  return out;
};

// ---------- effects (unlit cards) ----------
const FXC = (key, draw, pos, s, extra = {}) => ({ key, draw, pos, s, fx: true, blob: false, ...extra });
export const fxAt = (t) => {
  const sh = shotAt(t), out = [], TR = world.TR;
  if (t >= 3.55 && t < 4.7) { const k = ramp(t, 3.55, 4.7); out.push(FXC('pow' + Math.round(k * 60), (g) => fx.powder(g, k, 3), [TR.x - 0.2 + k * 0.4, TR.y + 1.7 - k * 0.6, TR.z + 0.2], 1.0)); }
  if (t >= 5.28 && t < 9.5) for (let i = 0; i < 5; i++) { const t0 = 5.28 + i * 0.32, k = ramp(t, t0, t0 + 1.8 + i * 0.3); if (k <= 0 || k >= 1) continue;
    out.push(FXC('steam' + i + '_' + Math.round(k * 50), (g) => fx.puff(g, k), [TR.x - 0.7 + i * 0.35, TR.y + 0.4 + k * 1.3, TR.z + (i % 2 ? 0.2 : -0.1)], 0.9 + k * 0.9, { alpha: 0.85 })); }
  if (sh.light === 'roman') for (let i = 0; i < 4; i++) { const k = ((t * 0.12 + i * 0.25) % 1); out.push(FXC('smoke' + i + Math.round(k * 40), (g) => fx.puff(g, 0.3 + k * 0.5, '200,196,190'), [-50 + k * 6, 9 + k * 14, -14 + k * 3], 8 + k * 10, { alpha: 0.7 * (1 - k) })); }
  if (['ages', 'ruin', 'payoff', 'hook', 'toss'].includes(sh.id)) for (let i = 0; i < 3; i++) { const k = ((t * 0.05 + i * 0.33) % 1), x = 60 - k * 110, ph = (t * 2.2 + i * 0.4) % 1;
    out.push(FXC('gull' + Math.round(ph * 12), (g) => fx.gull(g, ph), [x, 16 + i * 3 + Math.sin(t + i) * 1.5, -6 + i * 9], 1.6)); }
  if (t >= 17.9 && t < 18.9) { const k = ramp(t, 17.9, 18.9); out.push(FXC('spl' + Math.round(k * 30), (g) => fx.splash(g, k), [4.9, -0.75, 4.75], 0.95)); }
  if (t >= 18.1 && t < 19.62) for (let i = 0; i < 3; i++) { const k = ((t - 18.1) * 0.9 + i * 0.33) % 1; out.push(FXC('drop', (g) => fx.drop(g), [6.0 + (i - 1) * 0.04, world.CRACK.y + 0.7 - k * 1.5, 4.32], 0.12)); }
  if (sh.id === 'inside' && t > 22) for (let i = 0; i < 7; i++) { const k = ((t * 0.7 + i * 0.37) % 1); out.push(FXC('spk' + Math.round(k * 20), (g) => fx.sparkle(g, k), [(i % 2 ? 0.25 : -0.25), C0 - 3 + i * 0.9, (i * 1.7) % 4.4 - 2.2], 0.45, { add: true })); }
  if (t >= 27.95 && t < 29.3) { const k = ramp(t, 27.95, 29.3); out.push(FXC('bigspl' + Math.round(k * 40), (g) => fx.splash(g, k), [15, -0.6, 5.3], 4.2)); }
  return out;
};

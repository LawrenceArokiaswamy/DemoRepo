// CHARSYS: universal illustrated character system (dev, 2026-11-17). One skeleton + component libraries -> any character.
// Generalised from the approved Theo v3 rig: same head/face language (dot eyes, thick brows, animated mouth, shock lines),
// 2-bone IK arms, continuous sleeves, kit raster parts where a character has them (Theo), secondary motion (breath, blink, tremble, shrug).
// Units: head radius R = 1 (proportions are in head radii); `S` = pixels per unit at draw time. Ground at y = 0, up is negative.
// View: yaw 0 = camera-facing, 0.5 = three-quarter, 1 = profile; dir = +1 faces screen-right; back = true draws the back view.
export const INK = '#1c1a1e';
import { drawFace, emotionParams } from './face_rig.js';
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), L = (a, b, k) => a + (b - a) * k, ss = (x) => x * x * (3 - 2 * x);
export const ob = (x, c = 1.6) => { x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const rmp = (t, a, b) => cl((t - a) / (b - a));
// ---------------- proportion presets (head radii) ----------------
export const BUILDS = {
  adult:   { torsoH: 2.05, shoulderW: 1.02, hipW: 0.86, belly: 0.0, upperArm: 1.0, foreArm: 0.98, thigh: 1.25, shin: 1.25, limbW: 0.085, handR: 0.19, footL: 0.42, headLift: 0.9, stoop: 0 },
  slim_tall: { torsoH: 2.1, shoulderW: 0.9, hipW: 0.92, belly: 0.0, upperArm: 1.02, foreArm: 1.0, thigh: 1.4, shin: 1.38, limbW: 0.075, handR: 0.17, footL: 0.4, headLift: 0.9, stoop: 0 },
  elderly: { torsoH: 1.92, shoulderW: 1.0, hipW: 1.02, belly: 0.32, upperArm: 0.95, foreArm: 0.92, thigh: 1.12, shin: 1.12, limbW: 0.085, handR: 0.19, footL: 0.44, headLift: 0.86, stoop: 0.38 },
  child:   { torsoH: 1.32, shoulderW: 0.78, hipW: 0.68, belly: 0.12, upperArm: 0.62, foreArm: 0.6, thigh: 0.7, shin: 0.7, limbW: 0.075, handR: 0.17, footL: 0.36, headLift: 0.9, stoop: 0 },
  stocky:  { torsoH: 2.05, shoulderW: 1.18, hipW: 0.98, belly: 0.1, upperArm: 1.02, foreArm: 1.0, thigh: 1.2, shin: 1.2, limbW: 0.095, handR: 0.2, footL: 0.44, headLift: 0.88, stoop: 0 },
};
// ---------------- motion presets (how a character moves) ----------------
export const MOTION = {
  young_adult: { tempo: 1.0, shrug: 1.0, bounce: 0.0, tremor: 0.6, breathRate: 2.3, breathAmp: 1.0, recoil: 1.0 },
  elderly:     { tempo: 1.4, shrug: 0.55, bounce: 0.0, tremor: 1.4, breathRate: 1.7, breathAmp: 1.3, recoil: 0.6 },
  child:       { tempo: 0.8, shrug: 1.3, bounce: 1.0, tremor: 0.3, breathRate: 2.9, breathAmp: 0.9, recoil: 1.3 },
  soldier:     { tempo: 0.85, shrug: 0.5, bounce: 0.0, tremor: 0.0, breathRate: 2.0, breathAmp: 0.7, recoil: 0.7 },
  poised:      { tempo: 1.0, shrug: 0.8, bounce: 0.0, tremor: 0.4, breathRate: 2.2, breathAmp: 0.9, recoil: 0.9 },
};
// ---------------- expressions (shared emotional controls) ----------------
export const EXPR = {
  neutral:   { eh: 1.0, br: [0.02, 0.0], bi: 0.0, mouth: 'flat', mw: 0.9, shock: 0, worry: 0 },
  happy:     { eh: 0.7, br: [0.08, 0.06], bi: -0.05, mouth: 'grin', mw: 1.2, shock: 0, worry: 0, happyEyes: 1 },
  curious:   { eh: 1.05, br: [0.08, 0.04], bi: -0.1, mouth: 'flat', mw: 0.6, shock: 0, worry: 0, browAsym: 0.08 },
  surprised: { eh: 1.3, br: [0.22, 0.14], bi: 0.18, mouth: 'gasp', mw: 1.45, shock: 1, worry: 0 },
  scared:    { eh: 1.2, br: [0.16, 0.08], bi: 0.42, mouth: 'wobble', mw: 1.1, shock: 0.6, worry: 1 },
  sad:       { eh: 0.9, br: [0.05, 0.02], bi: 0.35, mouth: 'frown', mw: 0.9, shock: 0, worry: 0.6 },
  angry:     { eh: 0.85, br: [-0.05, -0.04], bi: -0.4, mouth: 'shout', mw: 1.1, shock: 0, worry: 0 },
};
export function mixExpr(a, b, k) { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[key] ?? 0, y = b[key] ?? 0;
  o[key] = typeof x === 'number' && typeof y === 'number' ? L(x, y, k) : Array.isArray(x) ? x.map((v, i) => L(v, y[i], k)) : (k < 0.5 ? x : y); } o.mw *= 1 - 0.35 * Math.sin(Math.PI * k); return o; }
// ---------------- geometry helpers ----------------
function ik(s, h, l1, l2, bend) { let dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy); const dm = Math.min(d, l1 + l2 - 1e-3); if (d > dm) { h = [s[0] + dx / d * dm, s[1] + dy / d * dm]; d = dm; }
  const a = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), b = Math.atan2(h[1] - s[1], h[0] - s[0]) + bend * a; return [[s[0] + Math.cos(b) * l1, s[1] + Math.sin(b) * l1], h]; }
const sh2 = (hex, k) => shade(hex, k);
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
// ---------------- the skeleton ----------------
export function skeleton(C, pose) {
  const P = C.body, yaw = pose.yaw || 0, dir = pose.dir || 1, back = !!pose.back, st = P.stoop + (pose.stoop || 0);
  const bob = pose.bob || 0, legLen = P.thigh + P.shin, crouch = pose.crouch || 0;
  const hipY = -(legLen * (1 - 0.18 * crouch)) - bob, hipX = 0;
  const torsoH = P.torsoH * (1 + (pose.breath || 0) * 0.012) - (pose.hunch || 0) * 0.12;
  const shY = hipY - torsoH + st * 0.32 - (pose.shrug || 0) * 0.16, wS = P.shoulderW * (1 - 0.42 * yaw - 0.2 * Math.max(0, yaw - 0.5) * 2), lean = (pose.lean || 0) + st * 0.25 * dir * yaw;
  const shX = hipX + lean * 0.6;
  const shoulders = [[shX - wS, shY + 0.1], [shX + wS, shY + 0.1]];
  const headR = 1 * (C.headScale || 1), headC = [shX + dir * yaw * 0.12 + st * 0.18 * dir * yaw + (pose.headDx || 0), shY - P.headLift * headR + st * 0.2 + (pose.headDy || 0)];
  const hips = [[hipX - P.hipW * 0.45 * (1 - 0.4 * yaw), hipY], [hipX + P.hipW * 0.45 * (1 - 0.4 * yaw), hipY]];
  // legs: stand / walk (phase) / sit
  const legs = hips.map((hp, i) => { const s = i ? 1 : -1, ph = pose.walk !== undefined ? pose.walk + (i ? Math.PI : 0) : null;
    if (pose.sit) { const knee = [hp[0] + s * 0.2 + dir * yaw * 0.5, hp[1] + 0.05], foot = [knee[0] + s * 0.05, 0]; return [hp, knee, foot]; }
    let foot = [hp[0] + s * 0.08 * (1 - yaw), 0], knee;
    if (ph !== null) { const sw = Math.sin(ph) * (pose.stride || 0.5), lift = Math.max(0, Math.cos(ph)) * 0.25 * (pose.stride || 0.5) * 2;
      foot = [hp[0] + dir * sw * (0.3 + 0.7 * yaw) + s * 0.08 * (1 - yaw), -lift]; }
    if (crouch > 0) foot = [foot[0] + s * 0.1 * crouch, foot[1]];
    [knee] = ik(hp, foot, P.thigh, P.shin, (i ? -1 : 1) * (yaw > 0.3 ? -dir : 1) * 0.5); return [hp, knee, foot]; });
  return { C, P, yaw, dir, back, hipY, shY, shoulders, hips, legs, headC, headR, torsoH, lean, st };
}
// ---------------- drawing primitives ----------------
const sk = (g, pts, w, col = INK) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.strokeStyle = col; g.stroke(); };
const outl = (g, fill, w) => { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); };
// torso outline (front shape; belly bulges; yaw narrows)
function torsoPath(g, K, extendHem = 0) { const { shY, hipY, P, yaw, shoulders } = K, x0 = (shoulders[0][0] + shoulders[1][0]) / 2, w = P.shoulderW * (1 - 0.42 * yaw) * 0.98, hw = (P.hipW * 0.62 + P.belly * 0.25) * (1 - 0.35 * yaw), b = P.belly;
  const hem = hipY + 0.12 + extendHem;
  g.beginPath(); g.moveTo(x0 - w * 0.82, shY - 0.02); g.quadraticCurveTo(x0, shY - 0.22, x0 + w * 0.82, shY - 0.02); g.quadraticCurveTo(x0 + w * 1.08, shY + 0.15, x0 + w * (1.0 + b * 0.25), (shY + hipY) / 2 + 0.2);
  g.quadraticCurveTo(x0 + hw * 1.15 + b * 0.35, hem - 0.25, x0 + hw, hem); g.lineTo(x0 - hw, hem); g.quadraticCurveTo(x0 - hw * 1.15 - b * 0.35, hem - 0.25, x0 - w * (1.0 + b * 0.25), (shY + hipY) / 2 + 0.2);
  g.quadraticCurveTo(x0 - w * 1.08, shY + 0.15, x0 - w * 0.82, shY - 0.02); g.closePath(); return { x0, w, hw, hem }; }
// ---------------- garment library (vector; any raster kit part can override) ----------------
export const GARMENTS = {
  hoodie(g, K, c) { const T = torsoPath(g, K); const gr = g.createLinearGradient(T.x0 - T.w, 0, T.x0 + T.w, 0); gr.addColorStop(0, shade(c.main, -0.15)); gr.addColorStop(0.6, c.main); gr.addColorStop(1, shade(c.main, 0.12)); outl(g, gr, K.ink);
    if (K.back) return; const cx = T.x0 + K.dir * K.yaw * T.w * 0.45; g.beginPath(); g.ellipse(cx, K.shY + 0.02, T.w * 0.55, 0.22, 0, Math.PI, 0); outl(g, shade(c.main, -0.12), K.ink * 0.8);
    for (const s of [-1, 1]) { sk(g, [[cx + s * 0.12, K.shY + 0.08], [cx + s * 0.14, K.shY + 0.6]], 0.05, '#f2eee9'); }
    g.beginPath(); g.moveTo(cx - 0.42, T.hem - 0.6); g.lineTo(cx + 0.42, T.hem - 0.6); g.lineTo(cx + 0.5, T.hem - 0.12); g.lineTo(cx - 0.5, T.hem - 0.12); g.closePath(); outl(g, shade(c.main, -0.1), K.ink * 0.7); },
  cardigan_shirt(g, K, c) { const T = torsoPath(g, K); const gr = g.createLinearGradient(T.x0 - T.w, 0, T.x0 + T.w, 0); gr.addColorStop(0, shade(c.main, -0.15)); gr.addColorStop(1, shade(c.main, 0.08)); outl(g, gr, K.ink);
    if (K.back) return; const cx = T.x0 + K.dir * K.yaw * T.w * 0.4;
    g.beginPath(); g.moveTo(cx - 0.28, K.shY - 0.08); g.lineTo(cx + 0.28, K.shY - 0.08); g.lineTo(cx + 0.12, K.shY + 0.9); g.lineTo(cx - 0.12, K.shY + 0.9); g.closePath(); outl(g, c.shirt, K.ink * 0.7);   // shirt V
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx, K.shY - 0.06); g.lineTo(cx + s * 0.3, K.shY - 0.12); g.lineTo(cx + s * 0.2, K.shY + 0.14); g.closePath(); outl(g, shade(c.shirt, 0.08), K.ink * 0.6); }   // collar
    sk(g, [[cx - 0.14, K.shY + 0.9], [cx - 0.1, T.hem]], K.ink * 0.7); sk(g, [[cx + 0.14, K.shY + 0.9], [cx + 0.1, T.hem]], K.ink * 0.7);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx - 0.2, K.shY + 1.0 + i * 0.28, 0.05, 0, 7); outl(g, c.button, K.ink * 0.4); }
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect(cx + s * 0.62 - 0.22, T.hem - 0.62, 0.44, 0.32, 0.06); outl(g, shade(c.main, -0.1), K.ink * 0.6); } },
  striped_tee(g, K, c) { const T = torsoPath(g, K, -0.05); g.save(); g.clip(); g.fillStyle = c.main; g.fillRect(T.x0 - 3, K.shY - 1, 6, 6);
    g.fillStyle = c.stripe; for (let y = K.shY + 0.25; y < T.hem; y += 0.36) g.fillRect(T.x0 - 3, y, 6, 0.16); g.restore(); torsoPath(g, K, -0.05); g.lineWidth = K.ink; g.strokeStyle = INK; g.stroke();
    if (!K.back) { const cx = T.x0 + K.dir * K.yaw * T.w * 0.4; g.beginPath(); g.ellipse(cx, K.shY - 0.05, 0.26, 0.12, 0, 0, Math.PI); g.lineWidth = K.ink * 0.7; g.stroke(); }
    // shorts
    g.beginPath(); g.moveTo(T.x0 - T.hw * 1.02, T.hem - 0.1); g.lineTo(T.x0 + T.hw * 1.02, T.hem - 0.1); g.lineTo(T.x0 + T.hw * 1.12, T.hem + 0.42); g.lineTo(T.x0 + 0.05, T.hem + 0.42); g.lineTo(T.x0, T.hem + 0.2); g.lineTo(T.x0 - 0.05, T.hem + 0.42); g.lineTo(T.x0 - T.hw * 1.12, T.hem + 0.42); g.closePath(); outl(g, c.shorts, K.ink); },
  sweater_skirt(g, K, c) { // skirt first (A-line to the knees), then the knit sweater
    const { hipY, P, yaw } = K, x0 = (K.shoulders[0][0] + K.shoulders[1][0]) / 2, hw = P.hipW * 0.62 * (1 - 0.3 * yaw), knee = hipY + P.thigh * 0.95;
    g.beginPath(); g.moveTo(x0 - hw, hipY - 0.1); g.lineTo(x0 + hw, hipY - 0.1); g.quadraticCurveTo(x0 + hw * 1.5, knee - 0.2, x0 + hw * 1.6, knee); g.quadraticCurveTo(x0, knee + 0.12, x0 - hw * 1.6, knee); g.quadraticCurveTo(x0 - hw * 1.5, knee - 0.2, x0 - hw, hipY - 0.1); g.closePath();
    const sg = g.createLinearGradient(x0 - hw * 1.6, 0, x0 + hw * 1.6, 0); sg.addColorStop(0, shade(c.skirt, -0.15)); sg.addColorStop(1, shade(c.skirt, 0.1)); outl(g, sg, K.ink);
    if (!K.back) for (const s of [-0.5, 0.5]) sk(g, [[x0 + s * hw * 0.6, hipY + 0.05], [x0 + s * hw * 1.1, knee - 0.05]], K.ink * 0.5, shade(c.skirt, -0.3));
    const T = torsoPath(g, K, -0.12); const gr = g.createLinearGradient(T.x0 - T.w, 0, T.x0 + T.w, 0); gr.addColorStop(0, shade(c.main, -0.14)); gr.addColorStop(1, shade(c.main, 0.1)); outl(g, gr, K.ink);
    g.save(); torsoPath(g, K, -0.12); g.clip(); g.strokeStyle = shade(c.main, -0.22); g.lineWidth = 0.025; for (let x = T.x0 - 1.2; x < T.x0 + 1.2; x += 0.16) { g.beginPath(); g.moveTo(x, T.hem - 0.22); g.lineTo(x, T.hem); g.stroke(); } g.restore();   // ribbed hem
    if (!K.back) { const cx = T.x0 + K.dir * K.yaw * T.w * 0.4; g.beginPath(); g.ellipse(cx, K.shY - 0.04, 0.3, 0.13, 0, 0, Math.PI); outl(g, shade(c.main, -0.08), K.ink * 0.7); } },
  legionary(g, K, c) { // Trajanic legionary (c. AD 100-115): tunic, lorica segmentata, focale, cingulum with apron, gladius
    const { hipY, P, yaw, dir } = K, x0 = (K.shoulders[0][0] + K.shoulders[1][0]) / 2, hw = P.hipW * 0.62 * (1 - 0.3 * yaw), hem = hipY + P.thigh * 0.62;
    g.beginPath(); g.moveTo(x0 - hw * 1.05, hipY - 0.3); g.lineTo(x0 + hw * 1.05, hipY - 0.3); g.lineTo(x0 + hw * 1.35, hem); g.quadraticCurveTo(x0, hem + 0.08, x0 - hw * 1.35, hem); g.closePath(); outl(g, c.tunic, K.ink);   // tunic skirt
    if (!K.back) for (const s of [-0.6, 0, 0.6]) sk(g, [[x0 + s * hw * 0.5, hipY - 0.1], [x0 + s * hw * 1.05, hem - 0.03]], K.ink * 0.45, shade(c.tunic, -0.3));
    const T = torsoPath(g, K, -0.22); const gr = g.createLinearGradient(T.x0 - T.w, 0, T.x0 + T.w, 0); gr.addColorStop(0, shade(c.metal, -0.28)); gr.addColorStop(0.55, c.metal); gr.addColorStop(1, shade(c.metal, 0.18)); outl(g, gr, K.ink);
    g.save(); torsoPath(g, K, -0.22); g.clip(); for (let i = 0; i < 6; i++) { const y = K.shY + 0.55 + i * ((T.hem - K.shY - 0.55) / 6); sk(g, [[T.x0 - 2, y + 0.05], [T.x0, y - 0.04], [T.x0 + 2, y + 0.05]], K.ink * 0.7); sk(g, [[T.x0 - 2, y + 0.09], [T.x0 + 2, y + 0.09]], 0.035, 'rgba(255,255,255,0.25)'); }
    if (!K.back) sk(g, [[T.x0 + dir * yaw * 0.3, K.shY + 0.5], [T.x0 + dir * yaw * 0.3, T.hem]], K.ink * 0.55); g.restore();
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const sx = K.shoulders[s < 0 ? 0 : 1][0], sy = K.shoulders[0][1]; g.beginPath(); g.ellipse(sx - s * 0.05, sy - 0.05 + i * 0.17, 0.36 - i * 0.03, 0.15, s * 0.25, Math.PI, 0); outl(g, shade(c.metal, 0.05 - i * 0.06), K.ink * 0.7); }   // shoulder guards
    if (!K.back) { const cx = T.x0 + dir * yaw * T.w * 0.35; g.beginPath(); g.ellipse(cx, K.shY + 0.02, T.w * 0.5, 0.18, 0, 0, Math.PI * 2); outl(g, c.focale, K.ink * 0.7); g.beginPath(); g.moveTo(cx - 0.08, K.shY + 0.15); g.lineTo(cx + 0.12, K.shY + 0.5); g.lineTo(cx - 0.12, K.shY + 0.48); g.closePath(); outl(g, c.focale, K.ink * 0.6); }
    // cingulum + apron of studded straps
    g.beginPath(); g.roundRect(T.x0 - T.hw * 1.05, T.hem - 0.14, T.hw * 2.1, 0.17, 0.04); outl(g, c.leather, K.ink * 0.8); for (let x = -3; x <= 3; x++) { g.beginPath(); g.arc(T.x0 + x * T.hw * 0.3, T.hem - 0.055, 0.035, 0, 7); outl(g, c.brass, K.ink * 0.3); }
    if (!K.back) for (let i = 0; i < 4; i++) { const x = T.x0 + dir * yaw * 0.2 - 0.21 + i * 0.14; sk(g, [[x, T.hem], [x, T.hem + 0.62]], 0.1, c.leather); sk(g, [[x - 0.05, T.hem], [x - 0.05, T.hem + 0.62]], K.ink * 0.3); for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(x, T.hem + k * 0.15, 0.028, 0, 7); g.fillStyle = c.brass; g.fill(); } g.beginPath(); g.arc(x, T.hem + 0.66, 0.045, 0, 7); outl(g, c.brass, K.ink * 0.3); }
    // gladius scabbard on the right hip (legionaries wore it on the right)
    const gx = T.x0 + T.hw * 1.15 * (K.back ? -1 : 1); g.save(); g.translate(gx, T.hem - 0.25); g.rotate(-0.25); g.beginPath(); g.roundRect(-0.07, 0, 0.14, 0.95, 0.04); outl(g, c.leather, K.ink * 0.7); g.beginPath(); g.roundRect(-0.1, -0.28, 0.2, 0.3, 0.06); outl(g, c.brass, K.ink * 0.6); g.restore(); },
};
// sleeves (continuous bent tube, as Theo v3) by garment
const SLEEVE = { hoodie: 'long', cardigan_shirt: 'long', striped_tee: 'short', sweater_skirt: 'long', legionary: 'tunic' };
// ---------------- hair & facial-hair library (drawn in head space, r = 1) ----------------
export const HAIR = {
  none: { back() {}, front() {} },
  crop: { back() {}, front(g, c, F) { g.save(); g.beginPath(); g.arc(0, 0, 1, 0, 7); g.clip(); g.beginPath(); g.moveTo(-1.2, -1.3); g.lineTo(1.2, -1.3); g.lineTo(1.2, -0.42);
    for (let i = 0; i <= 8; i++) g.lineTo(1.0 - i * 0.25 + F.yaw * 0.12, -0.5 + (i % 2 ? 0.08 : 0)); g.lineTo(-1.2, -0.35); g.closePath(); outl(g, c.hair, 0.06); g.restore(); } },
  bald_sides: { back(g, c) { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 0.93, 0.0, 0.2, 0.36, s * 0.2, 0, 7); outl(g, c.hair, 0.05); } },
    front(g, c) { g.beginPath(); g.ellipse(-0.25, -0.62, 0.22, 0.09, -0.4, 0, 7); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill(); for (const s of [-1, 1]) { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.28; g.moveTo(s * (0.86 + 0.0), a); g.quadraticCurveTo(s * 1.1, a + 0.05, s * 1.16, a + 0.18); } g.lineWidth = 0.05; g.strokeStyle = shade(c.hair, -0.25); g.stroke(); } } },
  kid_tousled: { back() {}, front(g, c, F) { g.save(); g.beginPath(); g.arc(0, 0, 1, 0, 7); g.clip(); g.beginPath(); g.moveTo(-1.2, -1.3); g.lineTo(1.2, -1.3); g.lineTo(1.2, -0.46);
    for (let i = 0; i <= 10; i++) g.lineTo(1.05 - i * 0.21 + F.yaw * 0.12, -0.52 + (i % 2 ? 0.1 : -0.02)); g.lineTo(-1.2, -0.42); g.closePath(); outl(g, c.hair, 0.06); g.restore();
    g.beginPath(); g.moveTo(0.05, -0.97); g.quadraticCurveTo(0.1, -1.35, 0.38, -1.3); g.quadraticCurveTo(0.2, -1.2, 0.25, -0.96); g.closePath(); outl(g, c.hair, 0.05); } },
  silver_swept: { back(g, c) {   // full swept-back silver hair with volume
      g.beginPath(); g.moveTo(-1.08, 0.12); g.quadraticCurveTo(-1.32, -0.55, -0.9, -1.0); g.quadraticCurveTo(-0.45, -1.42, 0.15, -1.36); g.quadraticCurveTo(0.85, -1.32, 1.12, -0.82); g.quadraticCurveTo(1.32, -0.3, 1.1, 0.14);
      g.quadraticCurveTo(1.15, 0.38, 0.98, 0.42); g.lineTo(-0.98, 0.42); g.quadraticCurveTo(-1.15, 0.38, -1.08, 0.12); g.closePath(); const gr = g.createLinearGradient(0, -1.4, 0, 0.4); gr.addColorStop(0, '#fbfaf7'); gr.addColorStop(1, '#c9c6c0'); outl(g, gr, 0.06); },
    front(g, c, F) { const o = F.yaw * 0.12;   // wavy silver hairline of soft locks, combed back; side volume over the ears
      const tips = [[-1.02, -0.22], [-0.86, -0.56], [-0.6, -0.5], [-0.42, -0.74], [-0.14, -0.62], [0.08, -0.8], [0.34, -0.66], [0.55, -0.82], [0.8, -0.6], [1.02, -0.24]].map(([x, y]) => [x + o * (1 - Math.abs(x)), y]);
      g.beginPath(); g.moveTo(...tips[0]); for (let k = 1; k < tips.length; k++) { const a = tips[k - 1], b = tips[k]; g.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - (k % 2 ? 0.12 : -0.02), b[0], b[1]); }
      g.quadraticCurveTo(1.18, -0.75, 0.75, -1.12); g.quadraticCurveTo(0.1, -1.42, -0.6, -1.18); g.quadraticCurveTo(-1.2, -0.85, -1.02, -0.22); g.closePath();
      const gr = g.createLinearGradient(0, -1.3, 0, -0.4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dcd8d1'); outl(g, gr, 0.055);
      g.strokeStyle = 'rgba(140,136,128,0.55)'; g.lineWidth = 0.022; g.lineCap = 'round'; for (let k = 1; k < tips.length - 1; k += 1) { const [x, y] = tips[k]; g.beginPath(); g.moveTo(x, y - 0.04); g.quadraticCurveTo(x + 0.1, y - 0.3, x + 0.28, y - 0.48); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(-0.5 + o, -1.02); g.quadraticCurveTo(-0.1 + o, -1.2, 0.35 + o, -1.12); g.stroke();
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 0.98, -0.32); g.quadraticCurveTo(sd * 1.2, -0.12, sd * 1.12, 0.12); g.quadraticCurveTo(sd * 1.02, 0.02, sd * 0.94, 0.08); g.quadraticCurveTo(sd * 1.0, -0.12, sd * 0.92, -0.18); g.closePath(); outl(g, '#e6e3dd', 0.045); } } },
  pigtails_bangs: { back(g, c) {   // puffy pigtails with hair ties + back mass
      for (const s of [-1, 1]) { g.save(); g.translate(s * 1.18, -0.05); g.rotate(s * 0.35); g.beginPath(); g.moveTo(0, -0.18); g.quadraticCurveTo(s * 0.55, -0.35, s * 0.55, 0.15); g.quadraticCurveTo(s * 0.5, 0.62, s * 0.12, 0.72); g.quadraticCurveTo(s * 0.18, 0.35, -s * 0.05, 0.2); g.closePath();
        const gr = g.createLinearGradient(0, -0.3, 0, 0.7); gr.addColorStop(0, sh2(c.hair, 0.15)); gr.addColorStop(1, sh2(c.hair, -0.2)); outl(g, gr, 0.06);
        g.strokeStyle = sh2(c.hair, -0.35); g.lineWidth = 0.025; for (const k of [0.15, 0.3]) { g.beginPath(); g.moveTo(s * k, -0.1); g.quadraticCurveTo(s * (k + 0.2), 0.25, s * (k * 0.6), 0.6); g.stroke(); }
        g.beginPath(); g.ellipse(0, -0.12, 0.13, 0.1, 0, 0, 7); outl(g, c.tie || '#e8505b', 0.04); g.restore(); }
      g.beginPath(); g.arc(0, -0.05, 1.07, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); outl(g, sh2(c.hair, -0.1), 0.06); },
    front(g, c, F) { const o = F.yaw * 0.12; g.save(); g.beginPath(); g.arc(0, 0, 1, 0, 7); g.clip();
      g.beginPath(); g.moveTo(-1.2, -1.4); g.lineTo(1.2, -1.4); g.lineTo(1.2, -0.3); g.quadraticCurveTo(1.0, -0.38, 0.86 + o, -0.5);
      for (let i = 0; i <= 8; i++) { const x = 0.86 - i * 0.215 + o; g.quadraticCurveTo(x - 0.1, -0.44 - (i % 2) * 0.05, x - 0.215, -0.52 + (i % 2 ? 0.04 : 0)); }
      g.quadraticCurveTo(-1.0, -0.38, -1.2, -0.3); g.closePath(); const gr = g.createLinearGradient(0, -1.2, 0, -0.45); gr.addColorStop(0, sh2(c.hair, 0.18)); gr.addColorStop(1, sh2(c.hair, -0.12)); outl(g, gr, 0.06); g.restore();
      g.strokeStyle = sh2(c.hair, -0.35); g.lineWidth = 0.025; for (let i = 0; i < 6; i++) { const x = -0.6 + i * 0.24 + o; g.beginPath(); g.moveTo(x + 0.15, -1.0); g.quadraticCurveTo(x + 0.05, -0.75, x, -0.55); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(-0.5 + o, -0.92); g.quadraticCurveTo(0 + o, -1.05, 0.45 + o, -0.9); g.stroke(); } },
  bob_wavy: { back(g, c) { g.beginPath(); g.moveTo(-1.12, -0.3); g.quadraticCurveTo(-1.35, 0.6, -1.18, 1.05); for (let i = 0; i <= 6; i++) g.quadraticCurveTo(-1.0 + i * 0.36, 1.25 - (i % 2) * 0.12, -0.98 + i * 0.36 + 0.18, 1.1);
    g.quadraticCurveTo(1.35, 0.6, 1.12, -0.3); g.quadraticCurveTo(0, -1.45, -1.12, -0.3); g.closePath(); const gr = g.createLinearGradient(0, -1.2, 0, 1.2); gr.addColorStop(0, shade(c.hair, 0.12)); gr.addColorStop(1, shade(c.hair, -0.18)); outl(g, gr, 0.06); },
    front(g, c, F) { g.save(); g.beginPath(); g.arc(0, 0, 1, 0, 7); g.clip(); const o = F.yaw * 0.15; g.beginPath(); g.moveTo(-1.2, -1.3); g.lineTo(1.2, -1.3); g.lineTo(1.2, 0.2); g.quadraticCurveTo(0.75 + o, -0.15, 0.55 + o, -0.48);
      g.quadraticCurveTo(0.1 + o, -0.3, -0.45 + o, -0.52); g.quadraticCurveTo(-0.8 + o, -0.35, -1.2, 0.25); g.closePath(); outl(g, c.hair, 0.06); g.restore(); sk(g, [[-0.2 + o, -0.85], [0.2 + o, -0.6]], 0.035, shade(c.hair, 0.25)); } },
};
export const FACIAL_HAIR = {
  none() {},
  moustache(g, c, F) { const x = F.fx, dy = F.P ? -F.P.curve * 0.03 - F.P.upperLip * 0.03 : 0; g.save(); g.translate(0, dy); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, 0.2); g.quadraticCurveTo(x + s * 0.2, 0.08, x + s * 0.36, 0.26); g.quadraticCurveTo(x + s * 0.2, 0.32, x, 0.27); g.closePath(); outl(g, c.hair, 0.04); } g.restore(); },
};
// ---------------- the head (generalised Theo v3 face) ----------------
export function drawHead(g, K, F, t) {   // F: { rig (face-rig params), yawH, blink } or legacy { ex, ... }
  const C = K.C, f = C.face, r = K.headR, yaw = F.yawH, back = K.back, colors = C.colors, raster = C.raster?.hair ? C.raster : null, P = F.rig || emotionParams('neutral', 0);   // legacy callers (sheet.html) get the neutral rig face
  g.save(); g.translate(...K.headC); g.rotate((F.tilt || 0) + (P ? P.tilt * 0.6 : 0)); const sq = P ? P.squash : 0; g.scale(r * (1 - sq * 0.5), r * (1 + sq));
  if (!raster) HAIR[C.hair].back(g, colors, { yaw });
  g.beginPath(); g.ellipse(0, 0, 1 * (f.wide || 1), 1, 0, 0, 7); const gr = g.createRadialGradient(-0.25, 0.35, 0.2, 0, 0, 1.05); gr.addColorStop(0, shade(colors.skin, 0.05)); gr.addColorStop(1, shade(colors.skin, -0.12)); outl(g, gr, 0.088);
  const cfg = { face: f, colors, glasses: C.glasses, browCeil: C.headgear === 'galea' ? -0.52 : -0.98 };
  if (!back && P) { g.save(); g.beginPath(); g.ellipse(0, 0, 0.97 * (f.wide || 1), 0.97, 0, 0, 7); g.clip();
    if (f.wrinkles) { g.lineWidth = 0.025; g.strokeStyle = 'rgba(40,25,25,0.45)'; const fx = 0.3 * yaw * K.dir; for (const k of [0, 1, 2]) { g.beginPath(); g.moveTo(fx - 0.28 + k * 0.03, -0.5 + k * 0.07); g.quadraticCurveTo(fx, -0.55 + k * 0.07 - P.browY[0] * 0.3, fx + 0.28 - k * 0.03, -0.5 + k * 0.07); g.stroke(); }
      for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(fx + s2 * 0.2, 0.17); g.quadraticCurveTo(fx + s2 * 0.28, 0.31, fx + s2 * 0.22, 0.43); g.stroke(); } }
    drawFace(g, cfg, P, { yaw, dir: K.dir, t, blink: F.blink, layer: 'base' });
    if (f.wrinkles) { g.lineWidth = 0.022; g.strokeStyle = 'rgba(40,25,25,0.5)'; const G2 = drawFace.geom; }
    FACIAL_HAIR[C.facialHair || 'none'](g, colors, { fx: 0.3 * yaw * K.dir, P }); g.restore(); }
  if (back && !raster && C.hair !== 'crop' || back && C.hair === 'crop' && !C.headgear) { g.save(); g.beginPath(); g.ellipse(0, 0, 0.99 * (f.wide || 1), 0.99, 0, 0, 7); g.clip(); g.beginPath(); g.ellipse(0, C.hair === 'silver_swept' ? -0.2 : -0.35, 1.2, C.hair === 'silver_swept' ? 0.95 : 0.85, 0, 0, 7); g.fillStyle = shade(colors.hair, C.hair === 'silver_swept' ? 0 : -0.05); g.fill(); g.restore(); g.beginPath(); g.ellipse(0, 0, 1 * (f.wide || 1), 1, 0, 0, 7); g.lineWidth = 0.088; g.strokeStyle = INK; g.stroke(); }   // back of the head is hair
  if (raster) { const img = yaw > 0.5 && raster.back34 ? raster.back34 : raster.front, w = (yaw > 0.5 ? 2.62 : 2.48), h = w * img.height / img.width; g.drawImage(img, yaw > 0.5 ? -1.38 : -1.27, -1.6, w, h); }
  else HAIR[C.hair].front(g, colors, { yaw: yaw * K.dir });
  if (!back && P) drawFace(g, cfg, P, { yaw, dir: K.dir, t, layer: 'brows' });   // brows read through the fringe (never hidden)
  if (C.headgear === 'galea') { g.save(); g.translate(0, -0.3); drawGalea(g, colors, yaw * K.dir, back); g.restore(); }
  if (C.glasses && !back) { const fx = 0.3 * yaw * K.dir, sep = (f.eyeSep || 0.36) * (1 - 0.3 * yaw), ey = f.eyeY || 0.04; g.lineWidth = 0.04; g.strokeStyle = INK; for (const s2 of [-1, 1]) { if (yaw > 0.82 && s2 === -K.dir) continue; g.beginPath(); g.arc(fx + s2 * sep, ey, 0.2, 0, 7); g.stroke(); } if (yaw <= 0.82) sk(g, [[fx - sep + 0.2, ey - 0.02], [fx + sep - 0.2, ey - 0.02]], 0.035); }
  if (C.earrings && !back) for (const s2 of [-1, 1]) { if (s2 === -K.dir && yaw > 0.4) continue; g.beginPath(); g.arc(s2 * 0.98 * (1 - 0.3 * yaw), 0.42, 0.07, 0, 7); outl(g, '#e3b341', 0.025); }
  if (!back && P) drawFace(g, cfg, P, { yaw, dir: K.dir, t, layer: 'accents' });
  g.restore();
}
function drawGalea(g, c, yaw, back) {   // Imperial-type helmet: bowl, brow reinforcement, neck guard, cheek guards
  g.beginPath(); g.moveTo(-1.08, -0.15); g.quadraticCurveTo(-1.12, -1.18, 0, -1.2); g.quadraticCurveTo(1.12, -1.18, 1.08, -0.15); g.lineTo(-1.08, -0.15); const gr = g.createLinearGradient(-1, -1.2, 1, 0); gr.addColorStop(0, shade(c.metal, 0.2)); gr.addColorStop(1, shade(c.metal, -0.25)); outl(g, gr, 0.07);
  g.beginPath(); g.moveTo(-1.18, -0.2); g.quadraticCurveTo(0 + yaw * 0.2, -0.38, 1.18, -0.2); g.lineWidth = 0.13; g.strokeStyle = c.brass; g.stroke(); g.lineWidth = 0.03; g.strokeStyle = INK; g.stroke();   // brow ridge
  g.beginPath(); g.moveTo(-1.1 - yaw * 0.3, -0.25); g.quadraticCurveTo(-1.45 - yaw * 0.4, 0.05, -1.3 - yaw * 0.4, 0.22); g.lineTo(-1.0, 0.02); g.closePath(); outl(g, shade(c.metal, -0.15), 0.05);   // neck guard (shows at the side)
  if (!back) for (const s of [-1, 1]) { if (s * yaw < -0.4) continue; g.beginPath(); g.moveTo(s * 0.98, -0.22); g.quadraticCurveTo(s * 1.12, 0.25, s * 0.8, 0.62); g.quadraticCurveTo(s * 0.68, 0.3, s * 0.72, -0.18); g.closePath(); outl(g, shade(c.metal, -0.05), 0.05); g.beginPath(); g.arc(s * 0.86, 0.12, 0.05, 0, 7); outl(g, c.brass, 0.02); }   // cheek guards
  g.beginPath(); g.arc(0 + yaw * 0.3, -1.22, 0.09, 0, 7); outl(g, c.brass, 0.03);   // crest knob (no crest for a legionary in battle)
}
// ---------------- arms, legs, feet ----------------
function drawLeg(g, K, leg, c) { const C = K.C, w = K.P.limbW; sk(g, leg, w + 0.0, INK); const foot = leg[2], fl = K.P.footL, d = K.yaw > 0.3 ? K.dir : (leg[0][0] < 0 ? -0.4 : 0.4);
  const shoe = C.footwear || 'shoe'; g.save(); g.translate(foot[0], foot[1]);
  if (shoe === 'caligae') { g.beginPath(); g.ellipse(d * fl * 0.35, -0.06, fl * 0.62, 0.1, 0, 0, 7); outl(g, c.leather, 0.04); for (let i = 0; i < 3; i++) sk(g, [[d * fl * 0.1 - 0.12, -0.15 - i * 0.1], [d * fl * 0.1 + 0.12, -0.1 - i * 0.1]], 0.045, shade(c.leather, -0.2)); }
  else { g.beginPath(); g.ellipse(d * fl * 0.35, -0.08, fl * 0.62, fl * 0.3, 0, 0, 7); outl(g, c.shoe || '#3b3437', 0.05); if (shoe === 'sneaker') { g.beginPath(); g.ellipse(d * fl * 0.35, -0.01, fl * 0.62, 0.05, 0, 0, Math.PI); g.lineWidth = 0.05; g.strokeStyle = '#f4f1ea'; g.stroke(); } }
  g.restore(); }
function drawArm(g, K, i, hand, c, pose) { const sh = K.shoulders[i], P = K.P, far = (i === 0 ? -1 : 1) === -K.dir && K.yaw > 0.25, l1 = P.upperArm * (far ? 0.85 : 1), l2 = P.foreArm * (far ? 0.85 : 1);
  let [el, hd] = ik(sh, hand, l1, l2, (i ? -1 : 1) * (pose.armBend?.[i] ?? 1));
  if (pose.armBend?.[i] === undefined) { const alt = ik(sh, hand, l1, l2, (i ? 1 : -1)); if (alt[0][1] > el[1] + 0.02) [el, hd] = alt; }   // default: elbows hang down
  const type = SLEEVE[K.C.garment] || 'long';
  sk(g, [el, hd], P.limbW, INK);
  const sw = (i ? 0.2 : 0.23) * (P.shoulderW / 1.02);
  if (type === 'long') { const cuff = [L(el[0], hd[0], 0.42), L(el[1], hd[1], 0.42)]; sk(g, [sh, el, cuff], sw + 0.05, INK); sk(g, [sh, el, cuff], sw, shade(c.sleeve || c.main, i ? 0.05 : -0.06)); g.beginPath(); g.arc(...cuff, sw / 2, 0, 7); outl(g, shade(c.sleeve || c.main, -0.15), 0.025); }
  else if (type === 'short' || type === 'tunic') { const end = [L(sh[0], el[0], 0.55), L(sh[1], el[1], 0.55)], col = type === 'tunic' ? c.tunic : (c.sleeve || c.main); sk(g, [sh, end], sw * 1.15 + 0.05, INK); sk(g, [sh, end], sw * 1.15, col); }
  g.beginPath(); g.arc(...hd, P.handR, 0, 7); outl(g, '#141316', 0.03);
  return hd; }
// ---------------- props ----------------
export const PROPS = {
  cane(g, K, hand, c) { sk(g, [[hand[0], hand[1] - 0.05], [hand[0] + 0.08, 0]], 0.09, INK); sk(g, [[hand[0], hand[1] - 0.05], [hand[0] + 0.08, 0]], 0.055, c.wood || '#7a5236'); g.beginPath(); g.arc(hand[0] - 0.12, hand[1] - 0.06, 0.14, Math.PI, 0); g.lineWidth = 0.09; g.strokeStyle = INK; g.stroke(); g.lineWidth = 0.055; g.strokeStyle = c.wood || '#7a5236'; g.stroke(); },
  scutum(g, K, hand, c) { const w = 0.95, h = 2.0, x = hand[0], y = hand[1]; g.save(); g.translate(x, y); g.scale(1 - 0.45 * K.yaw, 1); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 0.12); const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, shade(c.shield, -0.25)); gr.addColorStop(0.5, c.shield); gr.addColorStop(1, shade(c.shield, -0.25)); outl(g, gr, 0.07);
    g.beginPath(); g.roundRect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, 0.08); g.lineWidth = 0.05; g.strokeStyle = c.brass; g.stroke(); g.beginPath(); g.arc(0, 0, 0.2, 0, 7); outl(g, c.brass, 0.05); g.beginPath(); g.arc(0, 0, 0.09, 0, 7); outl(g, shade(c.brass, 0.25), 0.03);
    for (const s of [-1, 1]) { sk(g, [[0, s * 0.28], [0, s * 0.85]], 0.05, c.brass); sk(g, [[-0.25, s * 0.55], [0.25, s * 0.55]], 0.04, c.brass); } g.restore(); },   // generic boss + bars (exact blazon unverified)
};
// ---------------- draw a whole character ----------------
export function drawCharacter(g, C, pose, t, S, at) {   // at = [x, y] ground point in pixels; S = pixels per head radius
  g.save(); g.translate(at[0], at[1]); g.scale(S, S); if (pose.flip) g.scale(-1, 1);
  const K = skeleton(C, pose); K.ink = 0.06; const c = C.colors;
  // shadow on the ground
  g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.ellipse(0, 0.02, 1.3 + K.P.hipW * 0.4, 0.16, 0, 0, 7); g.fillStyle = 'rgba(40,25,30,0.35)'; g.fill(); g.restore();
  const hands = pose.hands || [[K.shoulders[0][0] - 0.3, K.hipY + 0.2], [K.shoulders[1][0] + 0.3, K.hipY + 0.2]];
  const order = K.dir > 0 ? [0, 1] : [1, 0];   // far side first in 3/4
  if (K.yaw > 0.25) { drawLeg(g, K, K.legs[order[0]], c); if (!K.back) drawArm(g, K, order[0], hands[order[0]], c, pose); }
  for (const i of [0, 1]) if (!(K.yaw > 0.25 && i === order[0])) drawLeg(g, K, K.legs[i], c);
  if (C.raster?.torso && !K.back) { const img = K.yaw > 0.3 && C.raster.torso34 ? C.raster.torso34 : C.raster.torso, x0 = (K.shoulders[0][0] + K.shoulders[1][0]) / 2, w = K.P.shoulderW * 2.25 * (1 - 0.15 * K.yaw), h = w * img.height / img.width;
    g.drawImage(img, x0 - w / 2, K.shY - 0.42, w, Math.max(h, K.hipY - K.shY + 0.6)); } else GARMENTS[C.garment](g, K, c);
  if (K.back) for (const i of [0, 1]) drawArm(g, K, i, hands[i], c, pose);
  if (C.prop === 'scutum' && pose.propHand !== undefined) PROPS.scutum(g, K, [hands[pose.propHand][0] - 0.1 * K.dir, hands[pose.propHand][1] - 0.4], c);
  drawHead(g, K, pose.face, t);
  if (!K.back) for (const i of [0, 1]) if (!(K.yaw > 0.25 && i === order[0])) { const hd = drawArm(g, K, i, hands[i], c, pose); if (C.prop === 'cane' && i === (pose.propHand ?? 1)) PROPS.cane(g, K, hd, c); }
  g.restore(); return K;
}

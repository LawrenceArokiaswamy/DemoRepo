// STUDIO CHARACTER GENERATOR (original). One locked art style ("pebble folk" 2.5D toon), unlimited characters.
// A character is a JSON spec; every spec inherits the same face rig (FACE presets / blendFace from toon.js) and body rig.
// drawCharacter(g, spec, pose) draws on a 600x1000 design canvas, feet at y = 980.
import { FACE, blendFace } from './toon.js';
export { FACE, blendFace };
export const INK = '#2a1b17';
const D2R = Math.PI / 180, lerp = (a, b, k) => a + (b - a) * k;
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (hex, k) => { const [r, g, b] = hexRGB(hex), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const inked = (g, fill, w = 7) => { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); };
const limb = (g, pts, w, col) => { g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]);
  g.strokeStyle = INK; g.lineWidth = w + 12; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };

// ---------- style palettes (the studio's colour language) ----------
export const PALETTE = {
  skin: ['#f3d2b8', '#ecc19f', '#e2ac84', '#c98d62', '#a86f48', '#7d4f33', '#5e3a26'],
  hair: { black: '#1f1612', brown: '#4a2e1c', auburn: '#8a3a1c', blond: '#d9a548', ginger: '#c4622d', grey: '#9a948c', white: '#ece8e0' },
  cloth: ['#a8322c', '#c98a4b', '#3f6a8a', '#5d7d3a', '#7a4f8a', '#d9a441', '#6b4a34', '#2f4559', '#b8573a', '#8a8f96'],
};

/** fill defaults; every field optional so short story-level descriptions still produce a full character */
export function normalizeSpec(s) {
  const age = s.age || 'adult';
  const d = {
    age, build: 'average', height: 1, skin: PALETTE.skin[2],
    head: { shape: age === 'child' ? 'round' : 'squircle', width: 1, jaw: 0.5 },
    eyes: { size: age === 'child' ? 1.15 : age === 'elder' ? 0.92 : 1, spacing: 1 },
    brows: { thick: age === 'elder' ? 1.2 : 1, color: null, bushy: age === 'elder' },
    nose: age === 'child' ? 'button' : 'round', ears: 1, wrinkles: age === 'elder' ? 1 : 0, freckles: 0,
    hair: { style: 'short', color: PALETTE.hair.brown }, facialHair: { type: 'none', color: null },
    outfit: { top: 'tunic', color: PALETTE.cloth[1], color2: '#6b4a34', trim: '#d9b25a', legs: '#4a3a33', boots: '#5a3622', belt: true, cape: null, apron: null },
    headwear: { type: 'none', color: '#d9b25a' }, prop: { type: 'none' },
    personality: { energy: 0.6, tempo: 1, posture: age === 'elder' ? 'hunched' : 'upright', exaggeration: 0.7 },
  };
  const m = (a, b) => (b && typeof b === 'object' && !Array.isArray(b) ? Object.fromEntries([...new Set([...Object.keys(a || {}), ...Object.keys(b)])].map((k) => [k, typeof (a || {})[k] === 'object' && (a || {})[k] !== null && !Array.isArray(a[k]) ? m(a[k], b[k]) : b[k] ?? (a || {})[k]])) : b ?? a);
  const r = m(d, s); r.brows.color = r.brows.color || r.hair.color; r.facialHair.color = r.facialHair.color || r.hair.color; return r;
}

// proportions per age (head vs body is the main read of age in this style)
const AGE = { child: { head: 0.92, body: 0.6, leg: 0.62, limb: 0.85 }, teen: { head: 0.95, body: 0.86, leg: 0.88, limb: 0.92 }, adult: { head: 1, body: 1, leg: 1, limb: 1 }, elder: { head: 1, body: 0.95, leg: 0.92, limb: 0.92 } };
const BUILD = { slim: 0.88, average: 1, stout: 1.28, muscular: 1.18 };

// ---------- head shapes ----------
function headPath(g, S, cx, cy, rx, ry) {
  const sh = S.head.shape, n = sh === 'round' ? 2.15 : sh === 'square' ? 3.6 : sh === 'long' ? 2.5 : 2.6, jaw = S.head.jaw;
  g.beginPath(); for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    let x = rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    if (s > 0) { y *= 1.04 + (sh === 'long' ? 0.08 : 0); x *= sh === 'pear' ? 1.08 : 1 - (1 - jaw) * 0.18 * s; } else if (sh === 'pear') x *= 0.88;
    g.lineTo(cx + x, cy + y); } g.closePath(); }

// ---------- hair ----------
function hairBack(g, S, cx, cy, rx, ry, yaw) {
  const H = S.hair, col = H.color, ox = -yaw * 22;
  if (H.style === 'curly') for (let i = 0; i < 13; i++) { const a = Math.PI * (1.02 + i / 12 * 0.96); g.beginPath(); g.arc(cx + ox + Math.cos(a) * rx * 0.92, cy - 30 + Math.sin(a) * ry * 0.86, 40 + (i % 3) * 8, 0, 7); inked(g, col, 7); }
  if (H.style === 'long' || H.style === 'ponytail') { g.beginPath(); g.roundRect(cx - rx * 1.05 + ox, cy - ry * 0.6, rx * 2.1, ry * (H.style === 'long' ? 2.0 : 1.2), 60); inked(g, col, 7); }
  if (H.style === 'ponytail') { g.beginPath(); g.ellipse(cx + rx * 0.95 + ox, cy - ry * 0.1, 40, 90, 0.4, 0, 7); inked(g, col, 7); }
  if (H.style === 'bun') { g.beginPath(); g.arc(cx + ox, cy - ry * 1.05, 52, 0, 7); inked(g, col, 7); }
  if (H.style === 'balding' || H.style === 'bald-sides') for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * rx * 0.9 + ox * 0.5, cy - 5, 38, 66, s * 0.3, 0, 7); inked(g, col, 6); }
  if (H.style === 'spiky') for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i / 8 * 0.9), x = cx + ox + Math.cos(a) * rx * 0.85, y = cy - 20 + Math.sin(a) * ry * 0.85;
    g.beginPath(); g.moveTo(x - 30, y + 20); g.lineTo(x + Math.cos(a) * 70, y + Math.sin(a) * 80); g.lineTo(x + 30, y + 20); g.closePath(); inked(g, col, 6); }
}
function hairFront(g, S, cx, cy, rx, ry, yaw, clip) {
  const H = S.hair, col = H.color, ox = -yaw * 22, top = cy - ry;
  g.save(); clip(); g.clip(); g.fillStyle = col;
  if (H.style === 'curly') for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 + ox + i * 26, top + 18 + Math.sin(i * 1.7) * 10, 34, 0, 7); g.fill(); }
  if (H.style === 'short' || H.style === 'spiky') { g.beginPath(); g.ellipse(cx + ox, top + 18, rx * 1.05, 76, 0, 0, 7); g.fill(); }
  if (H.style === 'sidepart') { g.beginPath(); g.moveTo(cx - rx - 10, top + 120); g.quadraticCurveTo(cx - rx * 0.5 + ox, top - 20, cx + ox - 20, top + 70); g.quadraticCurveTo(cx + rx * 0.6 + ox, top - 30, cx + rx + 10, top + 110); g.lineTo(cx + rx + 10, top - 20); g.lineTo(cx - rx - 10, top - 20); g.fill(); }
  if (H.style === 'bowl') { g.beginPath(); g.rect(cx - rx - 10, top - 10, rx * 2 + 20, ry * 0.62); g.fill(); }
  if (H.style === 'long' || H.style === 'ponytail' || H.style === 'bun') { g.beginPath(); g.moveTo(cx - rx - 10, top + 140); g.quadraticCurveTo(cx + ox, top + 20, cx + rx + 10, top + 140); g.lineTo(cx + rx + 10, top - 20); g.lineTo(cx - rx - 10, top - 20); g.fill(); }
  if (H.style === 'bald' || H.style === 'balding') { g.beginPath(); g.ellipse(cx - 50 + ox, top + 60, 34, 16, -0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill(); }
  if (H.style === 'balding') { g.strokeStyle = col; g.lineWidth = 6; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 30 + i * 18 + ox, top + 26); g.quadraticCurveTo(cx - 10 + i * 18 + ox, top + 6, cx + 6 + i * 18 + ox, top + 30); g.stroke(); } }
  g.restore();
  if (H.style === 'curly') { g.lineWidth = 6; g.strokeStyle = INK; for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 + ox + i * 26, top + 18 + Math.sin(i * 1.7) * 10, 34, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); } }
  if (H.style === 'short' || H.style === 'spiky' || H.style === 'bowl' || H.style === 'sidepart' || H.style === 'long' || H.style === 'ponytail' || H.style === 'bun') {
    g.save(); clip(); g.clip(); g.strokeStyle = INK; g.lineWidth = 7; g.beginPath();
    if (H.style === 'bowl') { g.moveTo(cx - rx, top + ry * 0.62 - 10); g.lineTo(cx + rx, top + ry * 0.62 - 10); }
    else if (H.style === 'sidepart') { g.moveTo(cx - rx - 10, top + 120); g.quadraticCurveTo(cx - rx * 0.5 + ox, top - 20, cx + ox - 20, top + 70); g.quadraticCurveTo(cx + rx * 0.6 + ox, top - 30, cx + rx + 10, top + 110); }
    else if (H.style === 'short' || H.style === 'spiky') { g.ellipse(cx + ox, top + 18, rx * 1.05, 76, 0, 0.05 * Math.PI, 0.95 * Math.PI); }
    else { g.moveTo(cx - rx - 10, top + 140); g.quadraticCurveTo(cx + ox, top + 20, cx + rx + 10, top + 140); }
    g.stroke(); g.restore(); }
}

// ---------- headwear ----------
function headwear(g, S, cx, cy, rx, ry, yaw) {
  const W = S.headwear, top = cy - ry, ox = -yaw * 14;
  if (W.type === 'crown') { g.beginPath(); const y0 = top + 30, h = 70; g.moveTo(cx - rx * 0.78 + ox, y0); for (let i = 0; i <= 4; i++) { const x = cx - rx * 0.78 + ox + i * rx * 0.39; g.lineTo(x, y0 - h - (i % 2 ? -10 : 18)); if (i < 4) g.lineTo(x + rx * 0.195, y0 - 34); }
    g.lineTo(cx + rx * 0.78 + ox, y0); g.closePath(); inked(g, W.color || '#e2b13c', 7); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx - rx * 0.4 + ox + i * rx * 0.4, y0 - 18, 11, 0, 7); inked(g, ['#c0303a', '#2f6fb0', '#2f9a5a'][i], 4); } }
  if (W.type === 'helmet') { g.beginPath(); g.ellipse(cx + ox * 0.5, top + 70, rx * 1.08, ry * 0.62, 0, Math.PI, 0); g.closePath(); inked(g, W.color || '#9aa3ac', 8);
    g.beginPath(); g.ellipse(cx + ox * 0.5, top + 72, rx * 1.28, 26, 0, 0, 7); inked(g, shade(W.color || '#9aa3ac', 0.85), 7); g.beginPath(); g.moveTo(cx + ox * 0.5, top - 30); g.lineTo(cx + ox * 0.5, top + 60); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.ellipse(cx - rx * 0.35 + ox * 0.5, top + 10, 30, 14, -0.4, 0, 7); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill();
    if (W.crest) { g.beginPath(); g.ellipse(cx + ox * 0.5, top - 44, rx * 0.75, 46, 0, Math.PI, 0); g.lineTo(cx + ox * 0.5 + rx * 0.75, top - 30); g.lineTo(cx + ox * 0.5 - rx * 0.75, top - 30); g.closePath(); inked(g, W.crest, 7);
      g.strokeStyle = shade(W.crest, 0.7); g.lineWidth = 4; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(cx + ox * 0.5 + k * 22, top - 34); g.lineTo(cx + ox * 0.5 + k * 26, top - 74 + Math.abs(k) * 8); g.stroke(); } }
    if (W.cheek) for (const s2 of [-1, 1]) { g.beginPath(); g.roundRect(cx + s2 * rx * 0.86 - 26 + ox * 0.4, top + 80, 52, 130, 22); inked(g, W.color || '#9aa3ac', 6); } }
  if (W.type === 'laurel') for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const a = Math.PI * (1.15 + i * 0.1) * (s < 0 ? 1 : 1), x = cx + s * (rx * 0.95 - i * 18) + ox, y = top + 90 - i * 14;
    g.beginPath(); g.ellipse(x, y, 22, 11, s * (0.6 + i * 0.15), 0, 7); inked(g, W.color || '#6a9a3a', 4); }
  if (W.type === 'cap') { g.beginPath(); g.ellipse(cx + ox, top + 40, rx * 1.02, ry * 0.42, 0, Math.PI, 0); g.closePath(); inked(g, W.color || '#5b4a8a', 8); g.beginPath(); g.ellipse(cx + ox + yaw * 30, top + 46, rx * 0.9, 18, 0, 0, Math.PI); inked(g, shade(W.color || '#5b4a8a', 0.8), 6); }
  if (W.type === 'tophat') { g.beginPath(); g.roundRect(cx - rx * 0.6 + ox, top - 150, rx * 1.2, 190, 14); inked(g, W.color || '#2a2430', 8); g.beginPath(); g.ellipse(cx + ox, top + 40, rx * 1.05, 22, 0, 0, 7); inked(g, W.color || '#2a2430', 7);
    g.fillStyle = '#a8322c'; g.fillRect(cx - rx * 0.6 + ox + 4, top - 10, rx * 1.2 - 8, 26); }
  if (W.type === 'hood') { g.beginPath(); g.ellipse(cx + ox * 0.4, cy - 10, rx * 1.2, ry * 1.18, 0, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); inked(g, W.color || '#6b4a34', 8); }
  if (W.type === 'goggles') for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 50 + ox, top + 56, 34, 0, 7); inked(g, '#c9a24a', 7); g.beginPath(); g.arc(cx + s * 50 + ox, top + 56, 22, 0, 7); g.fillStyle = '#9fc6d8'; g.fill(); }
}

// ---------- face (shared rig; per-character geometry) ----------
function drawFace(g, S, F, cx, cy, yaw, hs) {
  const fx = yaw * 52, eyeY = cy + 6 * hs, E = S.eyes, sp = 56 * E.spacing * hs, brow = S.brows.color, skin = S.skin, wr = S.wrinkles;
  const line = (pts, w = 5, a = 0.55) => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]); g.lineWidth = w; g.strokeStyle = `rgba(90,45,30,${a})`; g.lineCap = 'round'; g.stroke(); };
  // age lines (behind features)
  if (wr > 0.05) { for (let k = 0; k < 3; k++) { const y = eyeY - 96 * hs - k * 18; g.beginPath(); g.moveTo(cx + fx - 70, y); g.quadraticCurveTo(cx + fx, y - 10, cx + fx + 70, y); g.lineWidth = 5; g.strokeStyle = `rgba(90,45,30,${0.45 * wr})`; g.stroke(); }
    for (const s of [-1, 1]) { const x = cx + fx + s * (sp + 40 * hs); for (let k = -1; k <= 1; k++) line([[x, eyeY + k * 12], [x + s * 18, eyeY + k * 18]], 4, 0.5 * wr);
      line([[cx + fx * 1.3 + s * 50, cy + 80 * hs], [cx + fx * 1.3 + s * 62, cy + 120 * hs]], 5, 0.4 * wr); line([[cx + fx + s * sp - 26, eyeY + 52 * hs], [cx + fx + s * sp + 22, eyeY + 52 * hs]], 4, 0.35 * wr); } }
  if (S.freckles > 0) for (let k = 0; k < 14; k++) { const s = k % 2 ? 1 : -1; g.beginPath(); g.arc(cx + fx + s * (70 + (k * 13) % 50), cy + 48 + (k * 7) % 26, 3, 0, 7); g.fillStyle = 'rgba(150,80,50,0.6)'; g.fill(); }
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const far = (s > 0) === (yaw < 0), ex = cx + fx + s * sp * (1 - Math.abs(yaw) * 0.12) + (far ? -s * Math.abs(yaw) * 8 : 0), sxE = 1 - (far ? Math.abs(yaw) * 0.22 : 0);
    const rw = 33 * F.eye * E.size * sxE * hs, rh = 41 * F.eye * E.size * hs, lt = Math.min(1, F.lidT[i] + (S.age === 'elder' ? 0.12 : 0)), lb = Math.min(1, F.lidB[i]);
    if (lt + lb >= 0.98) { g.lineWidth = 9; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath();
      if (F.cheek > 0.5) g.arc(ex, eyeY + 18 * hs, 26 * sxE * hs, Math.PI * 1.12, Math.PI * 1.88); else { g.moveTo(ex - rw, eyeY + 4); g.quadraticCurveTo(ex, eyeY + 16, ex + rw, eyeY + 4); } g.stroke(); }
    else {
      g.beginPath(); g.ellipse(ex, eyeY, rw, rh, 0, 0, Math.PI * 2); inked(g, '#fffdf8', 6);
      g.save(); g.beginPath(); g.ellipse(ex, eyeY, rw, rh, 0, 0, Math.PI * 2); g.clip();
      const px = ex + F.pupil[0] * 12 * sxE * hs + fx * 0.15, py = eyeY + F.pupil[1] * 12 * hs, pr = 17 * F.pupilS * Math.min(1.1, F.eye) * E.size * hs;
      g.beginPath(); g.arc(px, py + 4, pr, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(px + 6, py - 3, Math.max(3, pr * 0.35), 0, 7); g.fillStyle = '#fff'; g.fill();
      g.fillStyle = skin;
      if (lt > 0.01) { const ly = eyeY - rh + 2 * rh * lt; g.beginPath(); g.moveTo(ex - rw - 4, eyeY - rh - 6); g.lineTo(ex + rw + 4, eyeY - rh - 6); g.lineTo(ex + rw + 4, ly); g.quadraticCurveTo(ex, ly + 10 * (1 - lt), ex - rw - 4, ly); g.fill(); }
      if (lb > 0.01) { const ly = eyeY + rh - 2 * rh * lb; g.beginPath(); g.moveTo(ex - rw - 4, eyeY + rh + 6); g.lineTo(ex + rw + 4, eyeY + rh + 6); g.lineTo(ex + rw + 4, ly); g.quadraticCurveTo(ex, ly - 12, ex - rw - 4, ly); g.fill(); }
      g.restore(); g.lineWidth = 7; g.strokeStyle = INK; g.lineCap = 'round';
      if (lt > 0.04) { const ly = eyeY - rh + 2 * rh * lt; g.beginPath(); g.moveTo(ex - rw + 2, ly); g.quadraticCurveTo(ex, ly + 10 * (1 - lt), ex + rw - 2, ly); g.stroke(); }
      if (lb > 0.04) { const ly = eyeY + rh - 2 * rh * lb; g.beginPath(); g.moveTo(ex - rw + 4, ly); g.quadraticCurveTo(ex, ly - 12, ex + rw - 4, ly); g.stroke(); } }
    const by = eyeY - 66 * hs * Math.max(1, F.eye * E.size * 0.95) + F.browY[i], ang = F.browA[i] * (s < 0 ? 1 : -1) * D2R, bw = 36 * sxE * hs, th = S.brows.thick;
    g.save(); g.translate(ex, by); g.rotate(ang); g.beginPath(); g.moveTo(-bw, 6); g.quadraticCurveTo(0, -14 * F.browBend - 4, bw, 6); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 10 + 16 * th; g.stroke(); g.strokeStyle = brow; g.lineWidth = 16 * th; g.stroke();
    if (S.brows.bushy) for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-bw + k * bw * 0.5, 0); g.lineTo(-bw + k * bw * 0.5 + 8 * s, -16); g.lineWidth = 6; g.strokeStyle = brow; g.stroke(); }
    g.restore();
  }
  // nose types
  const nx = cx + fx * 1.7, ny = cy + 62 * hs, ns = shade(skin, 0.86); g.lineWidth = 6; g.strokeStyle = INK;
  if (S.nose === 'button') { g.beginPath(); g.ellipse(nx, ny, 15, 12, 0, 0, 7); g.fillStyle = ns; g.fill(); g.beginPath(); g.arc(nx, ny + 2, 13, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  else if (S.nose === 'big') { g.beginPath(); g.ellipse(nx, ny + 4, 34, 28, 0, 0, 7); inked(g, ns, 6); }
  else if (S.nose === 'long') { g.beginPath(); g.moveTo(nx - 8, ny - 40); g.quadraticCurveTo(nx + 6 + yaw * 14, ny - 10, nx + 18 + yaw * 10, ny + 14); g.quadraticCurveTo(nx + 4, ny + 30, nx - 18, ny + 16); g.quadraticCurveTo(nx - 14, ny - 10, nx - 8, ny - 40); g.fillStyle = ns; g.fill(); g.stroke(); }
  else if (S.nose === 'hook') { g.beginPath(); g.moveTo(nx - 4, ny - 46); g.quadraticCurveTo(nx + 40, ny - 20, nx + 14, ny + 22); g.quadraticCurveTo(nx - 4, ny + 26, nx - 16, ny + 10); g.fillStyle = ns; g.fill(); g.stroke(); }
  else { g.beginPath(); g.ellipse(nx, ny, 24, 20, 0, 0, 7); g.fillStyle = ns; g.fill(); g.beginPath(); g.arc(nx, ny + 2, 22, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  // facial hair under the mouth (beards), mouth, then mustaches on top
  const FH = S.facialHair, fcol = FH.color, mx = cx + fx * 1.3, my = cy + 114 * hs;
  if (FH.type === 'beard' || FH.type === 'bigbeard') { g.beginPath(); const len = FH.type === 'bigbeard' ? 170 : 90; g.moveTo(cx - 120 * hs + fx * 0.6, cy + 40 * hs); g.quadraticCurveTo(cx - 110 + fx, my + len, mx, my + len + 30);
    g.quadraticCurveTo(cx + 110 + fx, my + len, cx + 120 * hs + fx * 0.6, cy + 40 * hs); g.quadraticCurveTo(mx, my + 150 * hs, cx - 120 * hs + fx * 0.6, cy + 40 * hs); inked(g, fcol, 7);
    g.strokeStyle = shade(fcol, 0.8); g.lineWidth = 4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(mx + k * 30, my + 90 - Math.abs(k) * 12); g.lineTo(mx + k * 26, my + len); g.stroke(); } }
  if (FH.type === 'goatee') { g.beginPath(); g.ellipse(mx, my + 52, 34, 40, 0, 0, 7); inked(g, fcol, 6); }
  if (FH.type === 'stubble') for (let k = 0; k < 60; k++) { const a = Math.PI * (0.1 + 0.8 * ((k * 37) % 60) / 60), r = 110 + (k % 5) * 10; g.beginPath(); g.arc(cx + fx + Math.cos(a) * r * hs, cy + 20 + Math.sin(a) * r * hs, 2.5, 0, 7); g.fillStyle = 'rgba(60,40,30,0.5)'; g.fill(); }
  const M = F.mouth, w = M.w * (S.age === 'child' ? 0.85 : 1) * hs, cU = -M.smile * 18, lx = mx - w, rx = mx + w, ly = my + cU - M.asym * 9, ry = my + cU + M.asym * 9, openH = M.open * 70 * hs;
  const upper = () => { g.moveTo(lx, ly); if (M.wob > 0.01) { for (let k = 1; k <= 6; k++) g.lineTo(lx + (rx - lx) * k / 6, lerp(ly, ry, k / 6) + (k % 2 ? -1 : 1) * 5 * M.wob); } else g.quadraticCurveTo(mx, my - 4 + M.smile * 16 - openH * 0.15, rx, ry); };
  const lower = () => g.bezierCurveTo(rx - w * 0.1, my + openH * 1.25 + M.smile * 10, lx + w * 0.1, my + openH * 1.25 + M.smile * 10, lx, ly);
  g.lineCap = g.lineJoin = 'round';
  if (openH < 6) { g.beginPath(); upper(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); }
  else { g.beginPath(); upper(); lower(); g.closePath(); g.save(); g.fillStyle = '#6b1f24'; g.fill(); g.clip();
    if (M.tongue > 0.05) { g.beginPath(); g.ellipse(mx, my + openH * 0.95 + 4, w * 0.55, openH * 0.42 * M.tongue + 6, 0, 0, 7); g.fillStyle = '#e0626a'; g.fill(); }
    if (M.teeth > 0.05 && S.age !== 'elder') { g.fillStyle = '#fff'; g.fillRect(lx - 4, Math.min(ly, ry) - 20, w * 2 + 8, 20 + 14 * M.teeth); if (M.smile < -0.4) g.fillRect(lx - 4, my + openH - 16 * M.teeth, w * 2 + 8, 30); }
    if (M.teeth > 0.05 && S.age === 'elder') { g.fillStyle = '#f4efe0'; g.fillRect(mx - w * 0.5, Math.min(ly, ry) - 20, w * 0.35, 34); g.fillRect(mx + w * 0.2, Math.min(ly, ry) - 20, w * 0.3, 30); }
    g.restore(); g.beginPath(); upper(); lower(); g.closePath(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); }
  if (M.smile > 0.3) for (const [x, y, s] of [[lx, ly, -1], [rx, ry, 1]]) { g.beginPath(); g.moveTo(x + s * 2, y - 2); g.quadraticCurveTo(x + s * 12, y - 6, x + s * 10, y - 16 * M.smile); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  if (FH.type === 'mustache' || FH.type === 'beard' || FH.type === 'bigbeard' || FH.type === 'handlebar') for (const s of [-1, 1]) { g.beginPath();
    if (FH.type === 'handlebar') { g.moveTo(mx, my - 26); g.quadraticCurveTo(mx + s * 60, my - 50, mx + s * 90, my - 8); g.quadraticCurveTo(mx + s * 60, my - 22, mx, my - 12); g.closePath(); }
    else g.ellipse(mx + s * 36 * hs, my - 32 * hs + (M.smile > 0.5 ? -6 : 0), 42 * hs, 18 * hs, s * (0.22 - M.smile * 0.12), 0, 7);
    inked(g, fcol, 6); }
  // cheeks / blush / sweat / tears
  for (const s of [-1, 1]) { const cxp = cx + fx * 0.8 + s * 92 * hs, cyp = cy + (70 - F.cheek * 14) * hs, gr = g.createRadialGradient(cxp, cyp, 4, cxp, cyp, 44);
    const [r, gg, b] = hexRGB(S.cheek || '#e58a72'); gr.addColorStop(0, `rgba(${r},${gg},${b},${(80 + 120 * F.blush) / 255})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(cxp - 46, cyp - 46, 92, 92); }
  if (F.sweat > 0.05) for (const [dx, dy, k] of [[-120, -70, 1], [118, -40, 0.8], [-108, 10, 0.6]]) { if (F.sweat < k * 0.5) continue; const x = cx + dx * hs, y = cy + dy * hs;
    g.beginPath(); g.moveTo(x, y - 26); g.quadraticCurveTo(x + 16, y, x, y + 12); g.quadraticCurveTo(x - 16, y, x, y - 26); inked(g, '#bfe6ff', 5); }
  if (F.tears > 0.1) for (const s of [-1, 1]) { const x = cx + fx + s * 70 * hs, y = eyeY + 34 * hs; g.beginPath(); g.ellipse(x, y, 8 * F.tears, 12 * F.tears, 0, 0, 7); inked(g, '#bfe6ff', 4); }
}

// ---------- 2.5D form shading (light-aware) ----------
function formShade(g, path, bbox, L) {
  const [x0, y0, x1, y1] = bbox, lx = L.dir; g.save(); path(); g.clip();
  const gr = g.createLinearGradient(lx > 0 ? x0 : x1, 0, lx > 0 ? x1 : x0, 0); gr.addColorStop(0, `rgba(40,20,30,${0.32 * L.contrast})`); gr.addColorStop(0.55, 'rgba(40,20,30,0)');
  g.fillStyle = gr; g.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
  const tp = g.createLinearGradient(0, y0, 0, y1); tp.addColorStop(0, 'rgba(255,255,255,0.10)'); tp.addColorStop(0.5, 'rgba(255,255,255,0)'); tp.addColorStop(1, `rgba(30,15,20,${0.16 * L.contrast})`);
  g.fillStyle = tp; g.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40); g.restore();
  g.save(); path(); g.clip(); g.translate(-lx * 9, 2); path(); g.lineWidth = 14; g.strokeStyle = `rgba(${L.rim},${0.5 * L.rimI})`; g.stroke(); g.restore();
}

// ---------- props ----------
function drawProp(g, P, hand) {
  if (!P || P.type === 'none') return; const [x, y] = hand;
  if (P.type === 'sword') { limb(g, [[x, y + 20], [x, y - 230]], 18, '#c9d1d8'); g.beginPath(); g.roundRect(x - 44, y - 6, 88, 16, 6); inked(g, '#c9a24a', 5); }
  if (P.type === 'spear') { limb(g, [[x, y + 200], [x, y - 330]], 12, '#8a5a32'); g.beginPath(); g.moveTo(x - 18, y - 320); g.lineTo(x, y - 400); g.lineTo(x + 18, y - 320); g.closePath(); inked(g, '#c9d1d8', 5); }
  if (P.type === 'staff') { limb(g, [[x - 4, 968], [x + 10, y - 200]], 16, '#7a5030'); g.beginPath(); g.arc(x + 10, y - 210, 22, 0, 7); inked(g, P.color || '#c9a24a', 5); }
  if (P.type === 'scroll') { g.beginPath(); g.roundRect(x - 50, y - 20, 100, 40, 14); inked(g, '#efe2c2', 5); }
  if (P.type === 'flask') { g.beginPath(); g.moveTo(x - 12, y - 70); g.lineTo(x + 12, y - 70); g.lineTo(x + 12, y - 40); g.lineTo(x + 34, y + 10); g.quadraticCurveTo(x, y + 30, x - 34, y + 10); g.lineTo(x - 12, y - 40); g.closePath(); inked(g, '#8fe0b0', 5); }
  if (P.type === 'shield') { g.beginPath(); if (P.shape === 'scutum') g.roundRect(x - 78, y - 130, 156, 260, 30); else { g.moveTo(x - 70, y - 80); g.lineTo(x + 70, y - 80); g.quadraticCurveTo(x + 70, y + 60, x, y + 110); g.quadraticCurveTo(x - 70, y + 60, x - 70, y - 80); } inked(g, P.color || '#a8322c', 7);
    if (P.emblem === 'boss') { g.beginPath(); g.arc(x, y, 26, 0, 7); inked(g, '#d9b25a', 5); g.strokeStyle = '#d9b25a'; g.lineWidth = 8; for (const a of [0.6, 2.5, 3.8, 5.6]) { g.beginPath(); g.moveTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34); g.lineTo(x + Math.cos(a) * 64, y + Math.sin(a) * 64); g.stroke(); } }
    else { g.beginPath(); g.moveTo(x, y - 70); g.lineTo(x, y + 90); g.moveTo(x - 56, y - 10); g.lineTo(x + 56, y - 10); g.lineWidth = 12; g.strokeStyle = '#d9b25a'; g.stroke(); } }
}

/** pose = { face, yaw, headTilt, lean, squash, bob, shrug, armL:[sh,el], armR:[sh,el], handL, handR, step, propHand, light } */
export function drawCharacter(g, spec, P) {
  const S = spec.__norm ? spec : normalizeSpec(spec), A = AGE[S.age], Wb = BUILD[S.build] || 1, L = { dir: 1, contrast: 1, rim: '255,214,160', rimI: 0.8, ...(P.light || {}) };
  const yaw = P.yaw || 0, F = P.face || FACE.neutral, hs = A.head, bob = (P.bob || 0) * 14 * A.body, sq = P.squash || 0, shrug = (P.shrug || 0) * 22, O = S.outfit;
  const hunch = S.personality.posture === 'hunched' ? 1 : 0, proud = S.personality.posture === 'proud' ? 1 : 0;
  g.save(); g.translate(300, 980); g.scale(S.height * (1 + sq * 0.12), S.height * (1 - sq * 0.12)); g.rotate((P.lean || 0) * D2R); g.translate(-300, -980);
  const legLen = 220 * A.leg, torsoLen = 270 * A.body, hipY = 960 - legLen + bob * 0.3, chestY = hipY - torsoLen + bob + hunch * 26, sw = 112 * Wb * A.body * (S.build === 'muscular' ? 1.12 : 1) + proud * 8;
  const long = O.top === 'robe' || O.top === 'dress', limbW = 40 * A.limb * (S.build === 'muscular' ? 1.15 : S.build === 'slim' ? 0.88 : 1);
  // cape (behind everything)
  if (O.cape) { g.beginPath(); g.moveTo(300 - sw * 1.1, chestY + 8); g.lineTo(300 + sw * 1.1, chestY + 8); g.lineTo(300 + sw * 1.45, 975); g.lineTo(300 - sw * 1.45, 975); g.closePath(); inked(g, O.cape, 7); }
  // legs
  if (!long) for (const s of [-1, 1]) { const ph = P.step == null ? 0 : Math.sin((P.step + (s > 0 ? 0.5 : 0)) * Math.PI * 2), lift = P.step == null ? 0 : Math.max(0, ph) * 30, fxp = 300 + s * 46 * Wb * A.body + (P.step == null ? 0 : ph * 24) + yaw * 10;
    limb(g, [[300 + s * 42 * Wb * A.body + yaw * 8, hipY], [fxp, 958 - lift]], limbW * 1.05, O.legs); g.beginPath(); g.ellipse(fxp + s * 8 + yaw * 14, 966 - lift, 42 * A.limb, 19, 0, 0, Math.PI * 2); inked(g, O.boots, 7); }
  else for (const s of [-1, 1]) { g.beginPath(); g.ellipse(300 + s * 40 + yaw * 14, 968, 40 * A.limb, 17, 0, 0, Math.PI * 2); inked(g, O.boots, 7); }
  // arms (far arm behind the torso when the body turns)
  const shY = chestY + 34 * A.body - shrug, ox = yaw * 10, L1 = 118 * A.limb * (S.age === 'child' ? 0.85 : 1), L2 = 108 * A.limb * (S.age === 'child' ? 0.85 : 1);
  const arm = (side, ang) => { const a1 = ang[0] * D2R, a2 = (ang[0] + ang[1]) * D2R, sx = 300 + side * sw + ox, ex = sx + side * Math.sin(a1) * L1, ey = shY + Math.cos(a1) * L1; return [[sx, shY], [ex, ey], [ex + side * Math.sin(a2) * L2, ey + Math.cos(a2) * L2]]; };
  const aL = arm(-1, P.armL || [8, 6]), aR = arm(1, P.armR || [8, 6]), sleeve = O.top === 'armor' ? shade(O.color, 0.9) : shade(O.color, 0.92);
  const hand = (pt, kind = 'open') => { const [x, y] = pt, r = 27 * A.limb; g.beginPath(); g.arc(x, y, kind === 'fist' ? r * 0.92 : r, 0, 7); inked(g, S.skin, 7);
    if (kind === 'spread') for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.45; limb(g, [[x + Math.cos(a) * 18, y + Math.sin(a) * 18], [x + Math.cos(a) * 44 * A.limb, y + Math.sin(a) * 44 * A.limb]], 10, S.skin); }
    if (kind === 'point') limb(g, [[x, y], [x + 40, y - 6]], 11, S.skin); };
  const farR = yaw <= 0; if (farR) { limb(g, aR, limbW, sleeve); hand(aR[2], P.handR); } else { limb(g, aL, limbW, sleeve); hand(aL[2], P.handL); }
  // torso by outfit
  const tw = (O.top === 'armor' ? 136 : 128) * Wb * A.body + proud * 8, bw = (long ? 190 : 150) * Wb * A.body, hem = long ? 950 : hipY + 80 * A.body;
  const torso = () => { g.beginPath(); g.moveTo(300 - tw + ox, chestY + 30); g.quadraticCurveTo(300 - tw + ox, chestY - 6 - shrug, 300 - tw + 40 + ox, chestY - 6 - shrug); g.lineTo(300 + tw - 40 + ox, chestY - 6 - shrug);
    g.quadraticCurveTo(300 + tw + ox, chestY - 6 - shrug, 300 + tw + ox, chestY + 30); g.lineTo(300 + bw, hem); g.quadraticCurveTo(300, hem + 20, 300 - bw, hem); g.closePath(); };
  torso(); inked(g, O.color, 8); g.save(); torso(); g.clip();
  if (O.top === 'armor') { for (let k = 0; k < 6; k++) { const y = chestY + 40 + k * 40 * A.body; g.beginPath(); g.moveTo(300 - tw - 20, y); g.quadraticCurveTo(300 + ox, y + 14, 300 + tw + 20, y); g.lineWidth = 5; g.strokeStyle = shade(O.color, 0.65); g.stroke(); }
    g.beginPath(); g.ellipse(300 - 40 + ox, chestY + 60, 30, 16, -0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); g.fillStyle = O.color2; g.fillRect(0, hipY - 10, 600, 120); }
  if (O.top === 'robe' || O.top === 'dress') { g.beginPath(); g.moveTo(300 - 40 + ox, chestY); g.lineTo(300 + 60 + ox, hem); g.lineWidth = 34; g.strokeStyle = O.color2; g.stroke(); }
  if (O.top === 'coat') { g.fillStyle = O.color2; g.beginPath(); g.moveTo(300 - 30 + ox, chestY - 10); g.lineTo(300 + 30 + ox, chestY - 10); g.lineTo(300 + 20, hem); g.lineTo(300 - 20, hem); g.fill();
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(300 + 42 + ox, chestY + 60 + k * 50, 7, 0, 7); g.fillStyle = '#d9b25a'; g.fill(); } }
  if (O.apron) { g.beginPath(); g.roundRect(300 - 96 + ox * 1.4, chestY + 50, 192, hem - chestY - 40, 18); g.fillStyle = O.apron; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); }
  if (O.trim) { g.fillStyle = O.trim; g.fillRect(0, hem - 26, 600, 26); }
  if (O.belt && !long) { g.fillStyle = '#5a3a24'; g.fillRect(0, hipY - 20, 600, 22); g.fillStyle = '#d9b25a'; g.fillRect(286 + ox, hipY - 22, 28, 26); }
  g.restore(); formShade(g, torso, [300 - bw, chestY - 10, 300 + bw, hem + 20], L);
  if (O.top === 'armor') for (const s of [-1, 1]) { g.beginPath(); g.ellipse(300 + s * tw * 0.92 + ox, chestY + 14, 62 * A.body, 36 * A.body, s * 0.25, 0, 7); inked(g, shade(O.color, 1.08), 7); }
  if (O.collar) { g.beginPath(); g.ellipse(300 + ox, chestY - 4, 96 * A.body, 26, 0, 0, 7); inked(g, O.collar, 6); }
  // head
  const ry = 168 * hs * (S.head.shape === 'long' ? 1.06 : 1), rx = 152 * hs * S.head.width * (S.head.shape === 'oval' ? 0.88 : S.head.shape === 'round' ? 1.04 : 1);
  const hc = [300 + yaw * 18 + hunch * 10, chestY - ry * 0.72 - shrug * 0.5 + hunch * 18 - proud * 6];
  g.save(); g.translate(...hc); g.rotate(((P.headTilt || 0) + hunch * 4 - proud * 3) * D2R); g.scale(1 + (P.headSquash || 0) * 0.08, 1 - (P.headSquash || 0) * 0.08); g.translate(-hc[0], -hc[1]);
  const [cx, cy] = hc, head = () => headPath(g, S, cx, cy, rx, ry);
  for (const s of [-1, 1]) { const far = (s > 0) === (yaw < 0); if (far && Math.abs(yaw) > 0.55) continue; const ex = cx + s * rx * (0.97 - (far ? Math.abs(yaw) * 0.2 : 0)) - yaw * 16;
    g.beginPath(); g.ellipse(ex, cy + 18 * hs, 30 * S.ears * hs * (far ? 1 - Math.abs(yaw) * 0.6 : 1), 40 * S.ears * hs, 0, 0, Math.PI * 2); inked(g, S.skin, 7); }
  if (S.headwear.type === 'hood') headwear(g, S, cx, cy, rx, ry, yaw);
  hairBack(g, S, cx, cy, rx, ry, yaw);
  head(); inked(g, S.skin, 8); formShade(g, head, [cx - rx, cy - ry, cx + rx, cy + ry], L);
  hairFront(g, S, cx, cy, rx, ry, yaw, head);
  drawFace(g, S, F, cx, cy, yaw, hs);
  if (S.headwear.type !== 'hood') headwear(g, S, cx, cy, rx, ry, yaw);
  g.restore();
  // near arm + prop
  const nearPts = farR ? aL : aR, nearHand = farR ? P.handL : P.handR;
  if (S.prop.type !== 'none') drawProp(g, S.prop, (P.propHand || 'R') === 'R' ? aR[2] : aL[2]);
  limb(g, nearPts, limbW, sleeve); hand(nearPts[2], nearHand);
  g.restore();
}

// ---------- personality -> performance (same rig, different acting) ----------
export function persona(S) {
  const p = S.personality, kid = S.age === 'child', old = S.age === 'elder';
  return { amp: p.exaggeration * (kid ? 1.35 : old ? 0.7 : 1), tempo: p.tempo * (kid ? 1.25 : old ? 0.75 : 1), bounce: p.energy * (kid ? 1.6 : old ? 0.5 : 1),
    tremble: old ? 1.4 : kid ? 1.2 : p.posture === 'proud' ? 0.4 : 1, idle: old ? 0.6 : kid ? 1.4 : 1 };
}

// ---------- crowd generator: controlled random specs (deterministic by seed) ----------
const rng = (seed) => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function crowdSpec(seed, role = 'civilian', period = 'roman') {
  const r = rng(seed + 17), age = pick(r, ['adult', 'adult', 'adult', 'elder', 'teen', 'child']), hairCol = age === 'elder' ? pick(r, ['#ece8e0', '#9a948c']) : pick(r, Object.values(PALETTE.hair).slice(0, 6));
  const spec = { age, build: pick(r, ['slim', 'average', 'average', 'stout']), height: 0.94 + r() * 0.12, skin: pick(r, PALETTE.skin), cheek: '#e58a72',
    head: { shape: pick(r, ['squircle', 'round', 'oval', 'square', 'long', 'pear']), width: 0.92 + r() * 0.16, jaw: r() },
    eyes: { size: 0.9 + r() * 0.2, spacing: 0.9 + r() * 0.2 }, nose: pick(r, ['button', 'round', 'big', 'long', 'hook']), ears: 0.85 + r() * 0.3,
    hair: { style: age === 'elder' ? pick(r, ['bald', 'balding', 'short', 'sidepart']) : pick(r, ['curly', 'short', 'sidepart', 'bowl', 'spiky', 'long', 'bun', 'ponytail']), color: hairCol },
    facialHair: { type: age === 'child' || age === 'teen' ? 'none' : pick(r, ['none', 'none', 'mustache', 'beard', 'stubble', 'goatee']) }, freckles: r() < 0.15 ? 1 : 0,
    outfit: { top: pick(r, ['tunic', 'tunic', 'robe', 'coat']), color: pick(r, PALETTE.cloth), color2: pick(r, PALETTE.cloth), trim: r() < 0.5 ? '#d9b25a' : null, legs: pick(r, ['#4a3a33', '#3a4a5a', '#5a4a3a']), boots: '#5a3622' },
    personality: { energy: r(), tempo: 0.8 + r() * 0.4, exaggeration: 0.5 + r() * 0.5 } };
  if (role === 'soldier') { spec.outfit = { top: 'armor', color: '#9aa3ac', color2: pick(r, ['#a8322c', '#3f6a8a', '#5d7d3a']), legs: '#4a3a33', boots: '#5a3622', belt: true };
    spec.headwear = { type: 'helmet', color: '#9aa3ac' }; spec.prop = { type: pick(r, ['spear', 'sword', 'shield']) }; spec.age = age === 'child' ? 'teen' : age === 'elder' ? 'adult' : age; }
  return spec;
}

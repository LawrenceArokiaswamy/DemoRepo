// "Pebble folk" 2.5D cartoon characters (EP01 style, original) with a parametric facial animation system.
// Every facial feature is a continuous control, so emotions blend smoothly and can be keyed with anticipation/overshoot.
export const INK = '#2a1b17';
const D2R = Math.PI / 180;

export const CAST = {
  tinker: { skin: '#e9b58c', cheek: '#e58a72', hair: '#3a2418', hairStyle: 'curly', shirt: '#d9a441', trim: '#8a5a24', apron: '#8a5636', apronTrim: '#5a3820', pants: '#4a3a33', brows: '#3a2418', build: 'slim' },
};

// ---------- face model ----------
// browY: [L,R] px (neg = up) | browA: [L,R] deg (+ = inner end down / angry) | browBend: arch (+) or worry (-)
// lidT/lidB: [L,R] 0..1 closure from top/bottom | eye: eye scale | pupil: [x,y] look | pupilS: pupil scale
// mouth: w (width), open (0..1), smile (-1..1), teeth (0..1), tongue (0..1), asym (-1..1), wob (wobble 0..1)
// cheek: raise 0..1 | sweat 0..1 | blush 0..1 | tears 0..1
export const FACE = {
  neutral:   { browY: [0, 0], browA: [0, 0], browBend: 0.2, lidT: [0.12, 0.12], lidB: [0, 0], eye: 1, pupil: [0, 0], pupilS: 1, mouth: { w: 34, open: 0, smile: 0.35, teeth: 0, tongue: 0, asym: 0, wob: 0 }, cheek: 0.1, sweat: 0, blush: 0.2, tears: 0 },
  notice:    { browY: [-14, -8], browA: [-4, 2], browBend: 0.3, lidT: [0.02, 0.05], lidB: [0, 0], eye: 1.08, pupil: [0.8, 0.2], pupilS: 0.9, mouth: { w: 22, open: 0.12, smile: 0, teeth: 0, tongue: 0, asym: 0.2, wob: 0 }, cheek: 0, sweat: 0, blush: 0.1, tears: 0 },
  curious:   { browY: [-22, 4], browA: [-10, 14], browBend: 0.5, lidT: [0.05, 0.3], lidB: [0, 0.1], eye: 1.05, pupil: [0.8, 0.35], pupilS: 1.05, mouth: { w: 16, open: 0.28, smile: 0.1, teeth: 0, tongue: 0, asym: 0.4, wob: 0 }, cheek: 0.05, sweat: 0, blush: 0.15, tears: 0 },
  suspicious:{ browY: [6, -10], browA: [14, -8], browBend: 0, lidT: [0.48, 0.3], lidB: [0.22, 0.1], eye: 0.95, pupil: [0.9, 0.2], pupilS: 0.85, mouth: { w: 30, open: 0, smile: -0.25, teeth: 0, tongue: 0, asym: 0.7, wob: 0 }, cheek: 0.1, sweat: 0, blush: 0, tears: 0 },
  disbelief: { browY: [-30, 10], browA: [-14, 18], browBend: 0.6, lidT: [0.0, 0.45], lidB: [0, 0.25], eye: 1.05, pupil: [0.7, 0.1], pupilS: 0.8, mouth: { w: 36, open: 0.05, smile: 0.35, teeth: 0, tongue: 0, asym: 1, wob: 0 }, cheek: 0.25, sweat: 0, blush: 0.15, tears: 0 },
  laugh:     { browY: [-18, -18], browA: [-8, -8], browBend: 0.6, lidT: [0.75, 0.75], lidB: [0.55, 0.55], eye: 1, pupil: [0, 0], pupilS: 1, mouth: { w: 58, open: 1, smile: 1, teeth: 1, tongue: 1, asym: 0, wob: 0 }, cheek: 1, sweat: 0, blush: 0.7, tears: 0.4 },
  shock:     { browY: [-42, -42], browA: [-6, -6], browBend: 0.9, lidT: [0, 0], lidB: [0, 0], eye: 1.3, pupil: [0.4, 0], pupilS: 0.45, mouth: { w: 36, open: 1.1, smile: -0.1, teeth: 0.3, tongue: 0.4, asym: 0, wob: 0 }, cheek: 0, sweat: 0.4, blush: 0, tears: 0 },
  fear:      { browY: [-24, -24], browA: [-26, -26], browBend: -0.7, lidT: [0, 0], lidB: [0.08, 0.08], eye: 1.2, pupil: [0.7, 0.1], pupilS: 0.55, mouth: { w: 48, open: 0.45, smile: -0.8, teeth: 1, tongue: 0, asym: 0, wob: 1 }, cheek: 0, sweat: 1, blush: 0, tears: 0 },
  angry:     { browY: [10, 10], browA: [28, 28], browBend: -0.2, lidT: [0.35, 0.35], lidB: [0.15, 0.15], eye: 0.95, pupil: [0, 0], pupilS: 0.8, mouth: { w: 44, open: 0.35, smile: -0.9, teeth: 1, tongue: 0, asym: 0, wob: 0 }, cheek: 0, sweat: 0, blush: 0.5, tears: 0 },
  sad:       { browY: [-8, -8], browA: [-24, -24], browBend: -0.6, lidT: [0.45, 0.45], lidB: [0, 0], eye: 1, pupil: [0, 0.6], pupilS: 1.05, mouth: { w: 30, open: 0, smile: -0.8, teeth: 0, tongue: 0, asym: 0, wob: 0.4 }, cheek: 0, sweat: 0, blush: 0.2, tears: 0.6 },
  confused:  { browY: [-26, 12], browA: [-16, 20], browBend: 0.2, lidT: [0.1, 0.25], lidB: [0, 0.05], eye: 1, pupil: [-0.4, -0.5], pupilS: 1, mouth: { w: 26, open: 0.05, smile: -0.2, teeth: 0, tongue: 0, asym: -0.8, wob: 0.6 }, cheek: 0, sweat: 0.2, blush: 0, tears: 0 },
  realize:   { browY: [-36, -36], browA: [-10, -10], browBend: 0.8, lidT: [0, 0], lidB: [0, 0], eye: 1.2, pupil: [0, -0.1], pupilS: 0.7, mouth: { w: 26, open: 0.55, smile: 0.2, teeth: 0, tongue: 0.3, asym: 0, wob: 0 }, cheek: 0.2, sweat: 0, blush: 0.2, tears: 0 },
};
const lerp = (a, b, k) => a + (b - a) * k;
/** blend two face states (deep numeric lerp) */
export function blendFace(A, B, k) {
  const r = (x, y) => (Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], k)) : typeof x === 'object' ? Object.fromEntries(Object.keys(x).map((key) => [key, r(x[key], y[key])])) : lerp(x, y, k));
  return r(A, B);
}

// ---------- drawing helpers ----------
const squircle = (g, cx, cy, rx, ry, n = 2.6, seg = 72) => { g.beginPath(); for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
  g.lineTo(cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (s > 0 ? 1.05 : 1)); } g.closePath(); };
const inked = (g, fill, w = 7) => { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); };
const limb = (g, pts, w, col) => { g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]);
  g.strokeStyle = INK; g.lineWidth = w + 12; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const armPts = (sx, sy, side, sh, el, L1 = 118, L2 = 108) => { const a1 = sh * D2R, a2 = (sh + el) * D2R; const ex = sx + side * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  return [[sx, sy], [ex, ey], [ex + side * Math.sin(a2) * L2, ey + Math.cos(a2) * L2]]; };
/** 2.5D shading for any closed path: soft form shadow on the side away from the light + warm rim on the lit edge */
function formShade(g, pathFn, bbox, L) {
  const [x0, y0, x1, y1] = bbox, lx = L.dir; // dir: -1 light from screen-left, +1 from screen-right
  g.save(); pathFn(); g.clip();
  const gr = g.createLinearGradient(lx > 0 ? x0 : x1, 0, lx > 0 ? x1 : x0, 0);
  gr.addColorStop(0, `rgba(40,20,30,${0.34 * L.contrast})`); gr.addColorStop(0.55, 'rgba(40,20,30,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
  const top = g.createLinearGradient(0, y0, 0, y1); top.addColorStop(0, 'rgba(255,255,255,0.10)'); top.addColorStop(0.5, 'rgba(255,255,255,0)'); top.addColorStop(1, `rgba(30,15,20,${0.18 * L.contrast})`);
  g.fillStyle = top; g.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
  g.restore();
  // rim light: offset inner stroke on the lit side
  g.save(); pathFn(); g.clip(); g.translate(-lx * 9, 2); pathFn(); g.lineWidth = 14; g.strokeStyle = `rgba(${L.rim},${0.55 * L.rimI})`; g.stroke(); g.restore();
}

// ---------- the face ----------
function drawFace(g, C, F, cx, cy, yaw, L) {
  const fx = yaw * 52, eyeY = cy + 6;
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const far = (s > 0) === (yaw < 0), ex = cx + fx + s * 56 * (1 - Math.abs(yaw) * 0.12) + (far ? -s * Math.abs(yaw) * 8 : 0), sxE = 1 - (far ? Math.abs(yaw) * 0.22 : 0);
    const rw = 33 * F.eye * sxE, rh = 41 * F.eye, lt = Math.min(1, F.lidT[i]), lb = Math.min(1, F.lidB[i]);
    if (lt + lb >= 0.98) { // closed: happy arc if cheeks are up, otherwise a soft line
      g.lineWidth = 9; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath();
      if (F.cheek > 0.5) g.arc(ex, eyeY + 18, 26 * sxE, Math.PI * 1.12, Math.PI * 1.88); else { g.moveTo(ex - rw, eyeY + 4); g.quadraticCurveTo(ex, eyeY + 16, ex + rw, eyeY + 4); }
      g.stroke();
    } else {
      g.beginPath(); g.ellipse(ex, eyeY, rw, rh, 0, 0, Math.PI * 2); inked(g, '#fffdf8', 6);
      g.save(); g.beginPath(); g.ellipse(ex, eyeY, rw, rh, 0, 0, Math.PI * 2); g.clip();
      const px = ex + F.pupil[0] * 12 * sxE + fx * 0.15, py = eyeY + F.pupil[1] * 12, pr = 17 * F.pupilS * Math.min(1.1, F.eye);
      g.beginPath(); g.arc(px, py + 4, pr, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(px + 6, py - 3, Math.max(3, pr * 0.35), 0, 7); g.fillStyle = '#fff'; g.fill();
      // lids: skin from the top/bottom with curved edges (squint when the cheeks push up)
      g.fillStyle = C.skin;
      if (lt > 0.01) { const ly = eyeY - rh + 2 * rh * lt; g.beginPath(); g.moveTo(ex - rw - 4, eyeY - rh - 6); g.lineTo(ex + rw + 4, eyeY - rh - 6); g.lineTo(ex + rw + 4, ly); g.quadraticCurveTo(ex, ly + 10 * (1 - lt), ex - rw - 4, ly); g.fill(); }
      if (lb > 0.01) { const ly = eyeY + rh - 2 * rh * lb; g.beginPath(); g.moveTo(ex - rw - 4, eyeY + rh + 6); g.lineTo(ex + rw + 4, eyeY + rh + 6); g.lineTo(ex + rw + 4, ly); g.quadraticCurveTo(ex, ly - 12, ex - rw - 4, ly); g.fill(); }
      g.restore();
      g.lineWidth = 7; g.strokeStyle = INK; g.lineCap = 'round';
      if (lt > 0.04) { const ly = eyeY - rh + 2 * rh * lt; g.beginPath(); g.moveTo(ex - rw + 2, ly); g.quadraticCurveTo(ex, ly + 10 * (1 - lt), ex + rw - 2, ly); g.stroke(); }
      if (lb > 0.04) { const ly = eyeY + rh - 2 * rh * lb; g.beginPath(); g.moveTo(ex - rw + 4, ly); g.quadraticCurveTo(ex, ly - 12, ex + rw - 4, ly); g.stroke(); }
    }
    // brow: thick bent stroke; angle (+ inner end down), height, arch/worry bend
    const by = eyeY - 66 * Math.max(1, F.eye * 0.95) + F.browY[i], ang = F.browA[i] * (s < 0 ? 1 : -1) * D2R, bw = 36 * sxE;
    g.save(); g.translate(ex, by); g.rotate(ang); g.beginPath(); g.moveTo(-bw, 6); g.quadraticCurveTo(0, -14 * F.browBend - 4, bw, 6);
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 26; g.stroke(); g.strokeStyle = C.brows; g.lineWidth = 16; g.stroke(); g.restore();
  }
  // nose (parallax: shifts further than the eyes)
  const nx = cx + fx * 1.7; g.beginPath(); g.ellipse(nx, cy + 62, 24, 20, 0, 0, Math.PI * 2); g.fillStyle = shade(C.skin, 0.88); g.fill();
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.arc(nx, cy + 64, 22, Math.PI * (0.15 + Math.max(0, yaw) * 0.1), Math.PI * (0.85 + Math.min(0, yaw) * 0.1)); g.stroke();
  // mouth: parametric (width, opening, smile curve, asymmetry, teeth, tongue, wobble)
  const M = F.mouth, mx = cx + fx * 1.3, my = cy + 114, w = M.w, cU = -M.smile * 18, aL = -M.asym * 9, aR = M.asym * 9;
  const lx = mx - w, rx = mx + w, ly = my + cU + aL, ry = my + cU + aR, openH = M.open * 70;
  const upper = () => { g.moveTo(lx, ly); if (M.wob > 0.01) { for (let k = 1; k <= 6; k++) { const x = lx + (rx - lx) * k / 6; g.lineTo(x, lerp(ly, ry, k / 6) + (k % 2 ? -1 : 1) * 5 * M.wob - (M.smile > 0 ? 0 : 0)); } } else g.quadraticCurveTo(mx, my - 4 + M.smile * 16 - openH * 0.15, rx, ry); };
  g.lineCap = g.lineJoin = 'round';
  if (openH < 6) { g.beginPath(); upper(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); }
  else {
    g.beginPath(); upper(); g.bezierCurveTo(rx - w * 0.1, my + openH * 1.25 + M.smile * 10, lx + w * 0.1, my + openH * 1.25 + M.smile * 10, lx, ly); g.closePath();
    g.save(); g.fillStyle = '#6b1f24'; g.fill(); g.clip();
    if (M.tongue > 0.05) { g.beginPath(); g.ellipse(mx, my + openH * 0.95 + 4, w * 0.55, openH * 0.42 * M.tongue + 6, 0, 0, 7); g.fillStyle = '#e0626a'; g.fill(); }
    if (M.teeth > 0.05) { g.fillStyle = '#fff'; g.fillRect(lx - 4, Math.min(ly, ry) - 20, w * 2 + 8, 20 + 14 * M.teeth); if (M.smile < -0.4) { g.fillRect(lx - 4, my + openH - 16 * M.teeth, w * 2 + 8, 30); } }
    g.restore(); g.beginPath(); upper(); g.bezierCurveTo(rx - w * 0.1, my + openH * 1.25 + M.smile * 10, lx + w * 0.1, my + openH * 1.25 + M.smile * 10, lx, ly); g.closePath(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  }
  if (M.smile > 0.3) for (const [x, y, s] of [[lx, ly, -1], [rx, ry, 1]]) { g.beginPath(); g.moveTo(x + s * 2, y - 2); g.quadraticCurveTo(x + s * 12, y - 6, x + s * 10, y - 16 * M.smile); g.lineWidth = 5; g.stroke(); }
  // cheeks, blush, sweat, tears
  for (const s of [-1, 1]) { const cxp = cx + fx * 0.8 + s * 92, cyp = cy + 70 - F.cheek * 14, gr = g.createRadialGradient(cxp, cyp, 4, cxp, cyp, 44);
    gr.addColorStop(0, C.cheek + Math.round(80 + 120 * F.blush).toString(16).padStart(2, '0')); gr.addColorStop(1, C.cheek + '00'); g.fillStyle = gr; g.fillRect(cxp - 46, cyp - 46, 92, 92); }
  if (F.sweat > 0.05) for (const [dx, dy, k] of [[-120, -70, 1], [118, -40, 0.8], [-108, 10, 0.6]]) { if (F.sweat < k * 0.5) continue; const x = cx + dx, y = cy + dy + (1 - F.sweat) * 10;
    g.beginPath(); g.moveTo(x, y - 26); g.quadraticCurveTo(x + 16, y, x, y + 12); g.quadraticCurveTo(x - 16, y, x, y - 26); inked(g, '#bfe6ff', 5); g.beginPath(); g.ellipse(x - 4, y, 3, 6, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); }
  if (F.tears > 0.1) for (const s of [-1, 1]) { const x = cx + fx + s * 70, y = eyeY + 34; g.beginPath(); g.ellipse(x, y, 8 * F.tears, 12 * F.tears, 0, 0, 7); inked(g, '#bfe6ff', 4); }
}

/** pose: { face (FACE object), yaw (-1..1 head turn), headTilt, lean, squash, bob, armL/armR [shoulder,elbow], handL/handR ('open'|'point'|'fist'|'spread'), step, shrug,
 *          light: {dir, contrast, rim:'r,g,b', rimI} } */
export function drawToon(g, C, P) {
  const L = { dir: 1, contrast: 1, rim: '255,214,160', rimI: 0.8, ...(P.light || {}) }, yaw = P.yaw || 0, F = P.face;
  const W = C.build === 'stout' ? 1.2 : 1, bob = (P.bob || 0) * 14, sq = P.squash || 0, shrug = (P.shrug || 0) * 22;
  g.save(); g.translate(300, 980); g.scale(1 + sq * 0.12, 1 - sq * 0.12); g.rotate((P.lean || 0) * D2R); g.translate(-300, -980);
  const hipY = 760 + bob, chestY = 500 + bob;
  // legs
  for (const s of [-1, 1]) { const ph = P.step == null ? 0 : Math.sin((P.step + (s > 0 ? 0.5 : 0)) * Math.PI * 2), lift = P.step == null ? 0 : Math.max(0, ph) * 34, fxp = 300 + s * 48 + (P.step == null ? 0 : ph * 26) + yaw * 10;
    limb(g, [[300 + s * 44 * W + yaw * 8, hipY - 10], [fxp, 958 - lift]], 42, C.pants); g.beginPath(); g.ellipse(fxp + s * 10 + yaw * 14, 966 - lift, 44, 20, 0, 0, Math.PI * 2); inked(g, '#5a3622', 7); }
  // arms behind
  const shY = chestY + 34 - shrug, sw = 112 * W, ox = yaw * 10;
  const aL = armPts(300 - sw + ox, shY, -1, ...(P.armL || [8, 6])), aR = armPts(300 + sw + ox, shY, 1, ...(P.armR || [8, 6])), sleeve = shade(C.shirt, 0.92);
  const hand = (pt, kind = 'open') => { const [x, y] = pt; g.beginPath(); g.arc(x, y, kind === 'fist' ? 25 : 27, 0, 7); inked(g, C.skin, 7);
    if (kind === 'spread') for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.45; limb(g, [[x + Math.cos(a) * 18, y + Math.sin(a) * 18], [x + Math.cos(a) * 44, y + Math.sin(a) * 44]], 10, C.skin); }
    if (kind === 'point') limb(g, [[x, y], [x + 40, y - 6]], 11, C.skin); };
  const yawSide = yaw > 0 ? 'L' : 'R'; // the arm on the far side tucks behind the torso when the body turns
  if (yawSide === 'L') { limb(g, aL, 40, sleeve); hand(aL[2], P.handL); }
  if (yawSide === 'R') { limb(g, aR, 40, sleeve); hand(aR[2], P.handR); }
  // torso with apron
  const tw = 128 * W, bw = 150 * W, torso = () => { g.beginPath(); g.moveTo(300 - tw + ox, chestY + 30); g.quadraticCurveTo(300 - tw + ox, chestY - 6 - shrug, 300 - tw + 40 + ox, chestY - 6 - shrug);
    g.lineTo(300 + tw - 40 + ox, chestY - 6 - shrug); g.quadraticCurveTo(300 + tw + ox, chestY - 6 - shrug, 300 + tw + ox, chestY + 30); g.lineTo(300 + bw, hipY + 80); g.quadraticCurveTo(300, hipY + 100, 300 - bw, hipY + 80); g.closePath(); };
  torso(); inked(g, C.shirt, 8);
  g.save(); torso(); g.clip();
  g.beginPath(); g.roundRect(300 - 96 + ox * 1.4, chestY + 50, 192, hipY + 110 - chestY - 50, 18); g.fillStyle = C.apron; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(300 + s * 70 + ox, chestY - 10); g.lineTo(300 + s * 80 + ox * 1.4, chestY + 56); g.lineWidth = 16; g.strokeStyle = C.apronTrim; g.stroke(); }
  g.beginPath(); g.roundRect(300 - 50 + ox * 1.5, hipY - 40, 100, 70, 10); g.fillStyle = shade(C.apron, 0.85); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  g.restore();
  formShade(g, torso, [300 - bw, chestY - 10, 300 + bw, hipY + 100], L);
  // head
  const hc = [300 + yaw * 18, 285 + bob * 1.15 - shrug * 0.5]; g.save(); g.translate(...hc); g.rotate((P.headTilt || 0) * D2R); g.scale(1 + (P.headSquash || 0) * 0.08, 1 - (P.headSquash || 0) * 0.08); g.translate(-hc[0], -hc[1]);
  const [cx, cy] = hc, rx = 152, ry = 168, head = () => squircle(g, cx, cy, rx, ry);
  for (const s of [-1, 1]) { const far = (s > 0) === (yaw < 0); if (far && Math.abs(yaw) > 0.55) continue; const ex = cx + s * rx * (0.97 - (far ? Math.abs(yaw) * 0.2 : 0)) - yaw * 16;
    g.beginPath(); g.ellipse(ex, cy + 18, 30 * (far ? 1 - Math.abs(yaw) * 0.6 : 1), 40, 0, 0, Math.PI * 2); inked(g, C.skin, 7); }
  // curly hair mop (behind), head, inner hair
  for (let i = 0; i < 13; i++) { const a = Math.PI * (1.02 + i / 12 * 0.96), rr = 40 + (i % 3) * 8; g.beginPath(); g.arc(cx - yaw * 22 + Math.cos(a) * rx * 0.92, cy - 30 + Math.sin(a) * ry * 0.86, rr, 0, 7); inked(g, C.hair, 7); }
  head(); inked(g, C.skin, 8); formShade(g, head, [cx - rx, cy - ry, cx + rx, cy + ry], L);
  g.save(); head(); g.clip(); for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 - yaw * 22 + i * 26, cy - ry + 18 + Math.sin(i * 1.7) * 10, 34, 0, 7); g.fillStyle = C.hair; g.fill(); } g.restore();
  g.lineWidth = 6; g.strokeStyle = INK; for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 - yaw * 22 + i * 26, cy - ry + 18 + Math.sin(i * 1.7) * 10, 34, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  drawFace(g, C, F, cx, cy, yaw, L);
  g.restore();
  // front arm (the near side)
  if (yawSide === 'L') { limb(g, aR, 40, sleeve); hand(aR[2], P.handR); } else { limb(g, aL, 40, sleeve); hand(aL[2], P.handL); }
  g.restore();
}

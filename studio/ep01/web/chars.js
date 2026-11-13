// Original 2D character system ("pebble folk"). Draws one character on a 600x1000 design canvas,
// feet at y=980. Fully parametric: arms by shoulder/elbow angles, face by expression + overrides.
export const INK = '#2a1b17';
const D2R = Math.PI / 180;

export const CAST = {
  builder: { skin: '#e7b48c', cheek: '#e48d74', hair: '#3a2418', hairStyle: 'curly', tunic: '#c98a4b', trim: '#7d4a25', apron: '#e9dcc0', headband: '#b8432f', build: 'slim', brows: '#3a2418' },
  foreman: { skin: '#f0c4a0', cheek: '#e88c7a', hair: '#e8e2d6', hairStyle: 'bald', tunic: '#a8322c', trim: '#e2b450', build: 'stout', mustache: '#ece6da', brows: '#ece6da', cape: '#6e1f22' },
  worker: { skin: '#c98d62', cheek: '#c97060', hair: '#1f1612', hairStyle: 'short', tunic: '#5f7f9a', trim: '#2f4559', build: 'slim', brows: '#1f1612' },
};

const EXPR = {
  neutral: { brow: [0, 0], browA: [0, 0], lid: 0.12, mouth: 'smile', ms: 0.6 },
  sly: { brow: [-14, 6], browA: [-10, 14], lid: 0.38, mouth: 'smirk', ms: 1 },
  focus: { brow: [6, 6], browA: [16, 16], lid: 0.3, mouth: 'flat', ms: 0.8 },
  effort: { brow: [8, 8], browA: [20, 20], lid: 0.45, mouth: 'grit', ms: 1 },
  surprised: { brow: [-26, -26], browA: [-6, -6], lid: 0, mouth: 'o', ms: 1 },
  laugh: { brow: [-16, -16], browA: [-8, -8], lid: 0, eyes: 'happy', mouth: 'laugh', ms: 1 },
  smug: { brow: [-6, -6], browA: [-12, 4], lid: 0.42, mouth: 'grin', ms: 1 },
  proud: { brow: [-10, -10], browA: [-4, -4], lid: 0.2, mouth: 'grin', ms: 0.9 },
  worried: { brow: [-10, -10], browA: [-22, -22], lid: 0.08, mouth: 'wobble', ms: 0.8 },
};

// ---------- small path helpers ----------
const squircle = (g, cx, cy, rx, ry, n = 2.6, seg = 64) => { g.beginPath(); for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
  const x = cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (s > 0 ? 1.04 : 1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
const fillInk = (g, fill, w = 7) => { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); };
const limb = (g, pts, w, col) => { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]);
  g.strokeStyle = INK; g.lineWidth = w + 12; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/** arm: shoulder [x,y], side (-1 screen-left, +1 screen-right), angles in degrees (0 = hanging, + = raised outward/forward) */
const armPts = (sx, sy, side, sh, el, L1 = 118, L2 = 108) => { const a1 = sh * D2R, a2 = (sh + el) * D2R;
  const ex = sx + side * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1, hx = ex + side * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2; return [[sx, sy], [ex, ey], [hx, hy]]; };

function drawProp(g, prop, hand, side) {
  if (!prop) return;
  const [hx, hy] = hand;
  if (prop.type === 'shovel') { // long wooden handle + iron blade, angle in degrees from vertical
    const a = (prop.angle || 0) * D2R, L = 380, tx = hx + Math.sin(a) * L * 0.35, ty = hy - Math.cos(a) * L * 0.35, bx = hx - Math.sin(a) * L * 0.65, by = hy + Math.cos(a) * L * 0.65;
    limb(g, [[tx, ty], [bx, by]], 14, '#8a5a32');
    g.save(); g.translate(bx, by); g.rotate(a); g.beginPath(); g.moveTo(-42, 0); g.lineTo(42, 0); g.lineTo(34, 82); g.quadraticCurveTo(0, 104, -34, 82); g.closePath(); fillInk(g, '#8c939b', 7);
    if (prop.load) { g.beginPath(); g.ellipse(0, 14, 40, 22 * prop.load, 0, Math.PI, 0); fillInk(g, '#f4f0e6', 5); }
    g.restore();
  }
  if (prop.type === 'tablet') { g.save(); g.translate(hx, hy - 10); g.rotate((prop.angle || -10) * D2R); g.beginPath(); g.roundRect(-70, -90, 140, 110, 10); fillInk(g, '#7a4f2c', 7); g.beginPath(); g.roundRect(-56, -78, 112, 86, 6); g.fillStyle = '#c9a25e'; g.fill();
    g.strokeStyle = 'rgba(60,40,20,0.6)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-44, -62 + i * 18); g.lineTo(30 - (i % 2) * 22, -62 + i * 18); g.stroke(); } g.restore(); }
}

function hand(g, [x, y], skin, r = 27) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fillInk(g, skin, 7); }

/** Draw a character. C: design (from CAST); P: pose. */
export function drawChar(g, C, P = {}) {
  const ex = { ...(EXPR[P.expr || 'neutral']) };
  const stout = C.build === 'stout', W = stout ? 1.22 : 1;
  const bob = (P.bob || 0) * 14, sq = P.squash || 0; // squash: + flattens, - stretches
  g.save();
  g.translate(300, 980); g.scale(1 + sq * 0.12, 1 - sq * 0.12); g.rotate((P.lean || 0) * D2R); g.translate(-300, -980);
  const hipY = 760 + bob, chestY = 500 + bob;
  // ---- legs (walk cycle via P.step phase) ----
  const step = P.step;
  for (const s of [-1, 1]) {
    const ph = step == null ? 0 : Math.sin((step + (s > 0 ? 0.5 : 0)) * Math.PI * 2);
    const lift = step == null ? 0 : Math.max(0, ph) * 34, fx = 300 + s * 48 + (step == null ? 0 : ph * 26);
    limb(g, [[300 + s * 44 * W, hipY - 10], [fx, 958 - lift]], 42, shade(C.tunic, 0.55));
    g.beginPath(); g.ellipse(fx + s * 10, 966 - lift, 44, 20, 0, 0, Math.PI * 2); fillInk(g, '#6a4126', 7);
  }
  // ---- cape (behind torso) ----
  if (C.cape) { g.beginPath(); g.moveTo(300 - 150 * W, chestY + 10); g.lineTo(300 + 150 * W, chestY + 10); g.lineTo(300 + 175 * W, hipY + 120); g.lineTo(300 - 175 * W, hipY + 120); g.closePath(); fillInk(g, C.cape, 7); }
  // ---- arms behind (for raised-back poses) ----
  const shY = chestY + 34, shX = 300 + 0, sw = 112 * W;
  const aL = armPts(shX - sw, shY, -1, ...(P.armL || [8, 6])), aR = armPts(shX + sw, shY, 1, ...(P.armR || [8, 6]));
  const sleeve = shade(C.tunic, 0.92);
  if (P.armLBack) { limb(g, aL, 40, sleeve); hand(g, aL[2], C.skin); }
  if (P.armRBack) { limb(g, aR, 40, sleeve); hand(g, aR[2], C.skin); }
  // ---- torso ----
  const tw = 128 * W, bw = 150 * W;
  g.beginPath(); g.moveTo(300 - tw, chestY + 30); g.quadraticCurveTo(300 - tw, chestY - 6, 300 - tw + 40, chestY - 6); g.lineTo(300 + tw - 40, chestY - 6); g.quadraticCurveTo(300 + tw, chestY - 6, 300 + tw, chestY + 30);
  g.lineTo(300 + bw, hipY + 80); g.quadraticCurveTo(300, hipY + 100, 300 - bw, hipY + 80); g.closePath(); fillInk(g, C.tunic, 8);
  g.save(); g.clip(); // tunic shading + trim + belt + apron
  const gr = g.createLinearGradient(300 - bw, 0, 300 + bw, 0); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)'); g.fillStyle = gr; g.fillRect(0, 0, 600, 1000);
  g.fillStyle = C.trim; g.fillRect(0, hipY + 56, 600, 26);
  if (C.apron) { g.beginPath(); g.roundRect(300 - 92, hipY - 70, 184, 170, 16); g.fillStyle = C.apron; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.fillStyle = 'rgba(150,140,120,0.45)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(240 + (i * 37) % 120, hipY - 30 + (i * 23) % 110, 6 + (i % 3) * 4, 0, 7); g.fill(); } }
  g.fillStyle = '#5a3a24'; g.fillRect(0, hipY - 78, 600, 22); g.fillStyle = '#d9b25a'; g.fillRect(286, hipY - 80, 28, 26);
  g.restore();
  g.beginPath(); g.moveTo(300 - 46, chestY - 6); g.quadraticCurveTo(300, chestY + 40, 300 + 46, chestY - 6); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  // ---- front arms + props ----
  if (P.prop && P.propHand !== 'L') drawProp(g, P.prop, aR[2], 1);
  if (P.prop && P.propHand === 'L') drawProp(g, P.prop, aL[2], -1);
  if (!P.armLBack) { limb(g, aL, 40, sleeve); hand(g, aL[2], C.skin); }
  if (!P.armRBack) { limb(g, aR, 40, sleeve); hand(g, aR[2], C.skin); }
  // ---- head ----
  const hc = [300, 285 + bob * 1.15], tilt = (P.headTilt || 0) * D2R;
  g.save(); g.translate(...hc); g.rotate(tilt); g.translate(-hc[0], -hc[1]);
  const [cx, cy] = hc, rx = 152, ry = 168;
  // ears
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * rx * 0.97, cy + 18, 30, 40, 0, 0, Math.PI * 2); fillInk(g, C.skin, 7); g.beginPath(); g.ellipse(cx + s * rx * 0.97, cy + 20, 12, 20, 0, 0, Math.PI * 2); g.fillStyle = shade(C.skin, 0.82); g.fill(); }
  // hair behind (curly mop)
  if (C.hairStyle === 'curly') { for (let i = 0; i < 13; i++) { const a = Math.PI * (1.02 + i / 12 * 0.96), rr = 40 + (i % 3) * 8; g.beginPath(); g.arc(cx + Math.cos(a) * rx * 0.92, cy - 30 + Math.sin(a) * ry * 0.86, rr, 0, 7); fillInk(g, C.hair, 7); } }
  if (C.hairStyle === 'bald') { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * rx * 0.88, cy - 10, 34, 52, s * 0.3, 0, 7); fillInk(g, C.hair, 6); } }
  squircle(g, cx, cy, rx, ry); fillInk(g, C.skin, 8);
  g.save(); squircle(g, cx, cy, rx, ry); g.clip();
  const hg = g.createRadialGradient(cx - 60, cy - 80, 20, cx, cy, ry * 1.2); hg.addColorStop(0, 'rgba(255,255,255,0.22)'); hg.addColorStop(0.55, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(90,40,20,0.22)'); g.fillStyle = hg; g.fillRect(0, 0, 600, 1000);
  if (C.hairStyle === 'curly') { for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 + i * 26, cy - ry + 18 + Math.sin(i * 1.7) * 10, 34, 0, 7); g.fillStyle = C.hair; g.fill(); } }
  if (C.hairStyle === 'short') { g.beginPath(); g.ellipse(cx, cy - ry + 20, rx * 1.05, 70, 0, 0, 7); g.fillStyle = C.hair; g.fill(); }
  if (C.hairStyle === 'bald') { g.beginPath(); g.ellipse(cx - 50, cy - 110, 34, 16, -0.5, 0, 7); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill(); }
  // cheeks
  for (const s of [-1, 1]) { const cg = g.createRadialGradient(cx + s * 92, cy + 66, 4, cx + s * 92, cy + 66, 40); cg.addColorStop(0, C.cheek + 'aa'); cg.addColorStop(1, C.cheek + '00'); g.fillStyle = cg; g.fillRect(cx + s * 92 - 40, cy + 26, 80, 80); }
  g.restore();
  if (C.hairStyle === 'curly') { g.lineWidth = 6; g.strokeStyle = INK; for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(cx - 130 + i * 26, cy - ry + 18 + Math.sin(i * 1.7) * 10, 34, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); } }
  if (C.headband) { g.save(); squircle(g, cx, cy, rx + 4, ry + 4); g.clip(); g.fillStyle = C.headband; g.fillRect(cx - rx - 10, cy - 124, rx * 2 + 20, 28); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(cx - rx - 10, cy - 124, rx * 2 + 20, 7); g.restore();
    g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(cx - rx + 12, cy - 124); g.lineTo(cx + rx - 12, cy - 124); g.moveTo(cx - rx + 8, cy - 96); g.lineTo(cx + rx - 8, cy - 96); g.stroke(); }
  // ---- face ----
  const look = P.look || [0, 0], lx = look[0] * 14, ly = look[1] * 12, fx = look[0] * 10;
  const eyeY = cy + 6, lid = Math.max(ex.lid, P.blink || 0), happy = ex.eyes === 'happy' || P.eyes === 'happy';
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const exx = cx + fx + s * 56;
    if (happy) { g.lineWidth = 9; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.arc(exx, eyeY + 14, 26, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); }
    else {
      g.beginPath(); g.ellipse(exx, eyeY, 33, 41, 0, 0, Math.PI * 2); fillInk(g, '#fffdf8', 6);
      g.save(); g.beginPath(); g.ellipse(exx, eyeY, 33, 41, 0, 0, Math.PI * 2); g.clip();
      g.beginPath(); g.arc(exx + lx, eyeY + ly + 4, 17, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(exx + lx + 6, eyeY + ly - 3, 6, 0, 7); g.fillStyle = '#ffffff'; g.fill();
      if (lid > 0.01) { g.fillStyle = C.skin; g.fillRect(exx - 40, eyeY - 48, 80, 6 + 88 * lid); }
      g.restore();
      if (lid > 0.01) { g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(exx - 34, eyeY - 42 + 88 * lid); g.lineTo(exx + 34, eyeY - 42 + 88 * lid); g.stroke(); }
    }
    // brows
    const by = eyeY - 66 + ex.brow[i] + (P.browUp || 0), ba = (ex.browA[i] * (s < 0 ? 1 : -1)) * D2R;
    g.save(); g.translate(exx, by); g.rotate(ba); g.beginPath(); g.roundRect(-34, -10, 68, 20, 10); g.fillStyle = C.brows || INK; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore();
  }
  // nose
  g.beginPath(); g.ellipse(cx + fx * 1.4, cy + 62, 24, 20, 0, 0, Math.PI * 2); g.fillStyle = shade(C.skin, 0.9); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.arc(cx + fx * 1.4, cy + 64, 22, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  // mouth
  const mx = cx + fx * 1.2, my = cy + 112, ms = (P.mouthScale || 1) * ex.ms, mouth = P.mouth || ex.mouth;
  g.lineWidth = 8; g.strokeStyle = INK; g.lineCap = 'round';
  const openShape = (w, h, teeth) => { g.beginPath(); g.moveTo(mx - w, my - 6); g.quadraticCurveTo(mx, my - 14, mx + w, my - 6); g.quadraticCurveTo(mx + w * 0.8, my + h, mx, my + h); g.quadraticCurveTo(mx - w * 0.8, my + h, mx - w, my - 6); g.closePath(); fillInk(g, '#6b1f24', 7);
    g.save(); g.clip(); g.beginPath(); g.ellipse(mx, my + h * 0.9, w * 0.55, h * 0.4, 0, 0, 7); g.fillStyle = '#e0626a'; g.fill(); if (teeth) { g.fillStyle = '#ffffff'; g.fillRect(mx - w, my - 14, w * 2, 16); } g.restore(); };
  if (mouth === 'smile') { g.beginPath(); g.arc(mx, my - 24, 40 * ms, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  if (mouth === 'smirk') { g.beginPath(); g.moveTo(mx - 36, my - 2); g.quadraticCurveTo(mx + 6, my + 12, mx + 40, my - 18); g.stroke(); }
  if (mouth === 'flat') { g.beginPath(); g.moveTo(mx - 26, my); g.lineTo(mx + 26, my); g.stroke(); }
  if (mouth === 'grit') { g.beginPath(); g.roundRect(mx - 34, my - 10, 68, 22, 8); fillInk(g, '#ffffff', 6); g.beginPath(); g.moveTo(mx - 30, my + 1); g.lineTo(mx + 30, my + 1); g.lineWidth = 3; g.stroke(); }
  if (mouth === 'wobble') { g.beginPath(); g.moveTo(mx - 30, my + 4); for (let k = 0; k <= 6; k++) g.lineTo(mx - 30 + k * 10, my + (k % 2 ? -4 : 4)); g.stroke(); }
  if (mouth === 'o') { g.beginPath(); g.ellipse(mx, my + 8, 20 * ms, 28 * ms, 0, 0, 7); fillInk(g, '#6b1f24', 7); }
  if (mouth === 'laugh') openShape(52 * ms, 62 * ms, true);
  if (mouth === 'grin') openShape(46 * ms, 30 * ms, true);
  if (mouth === 'open') openShape(34 * ms, 44 * ms, false);
  if (C.mustache) { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(mx + s * 38, my - 34, 44, 19, s * (0.25 + (P.mustacheLift || 0)), 0, 7); fillInk(g, C.mustache, 6); } }
  g.restore(); // head tilt
  g.restore(); // lean/squash
}

// ---------- 2D effect painters (unlit cards) ----------
export const fx = {
  puff(g, t, col = '255,255,255') { const a = Math.max(0, 1 - t) * 0.85; for (let i = 0; i < 7; i++) { const ang = i * 0.9, r = 70 + 120 * t; const x = 300 + Math.cos(ang) * r * 0.7, y = 520 - t * 160 + Math.sin(ang) * r * 0.5, rr = 80 + 90 * t;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } },
  powder(g, t, seed = 1) { for (let i = 0; i < 60; i++) { const k = (i * 97 + seed * 31) % 100 / 100, x = 160 + k * 280 + Math.sin(i) * 30, y = 200 + t * 600 * (0.6 + k * 0.6) + (i % 7) * 18, r = 4 + (i % 4) * 3;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = `rgba(250,248,240,${Math.max(0, 1 - t * 0.8)})`; g.fill(); } },
  drop(g) { g.beginPath(); g.moveTo(300, 380); g.quadraticCurveTo(360, 520, 300, 560); g.quadraticCurveTo(240, 520, 300, 380); fillInk(g, '#9fd6ef', 10); g.beginPath(); g.ellipse(285, 500, 10, 22, 0.3, 0, 7); g.fillStyle = '#ffffff'; g.fill(); },
  splash(g, t) { // cartoon crown splash: inked teardrop sheets + flying droplets + foam skirt
    const up = Math.sin(Math.min(1, t * 1.25) * Math.PI), a = Math.min(1, (1 - t) * 3), base = 760; g.globalAlpha = a;
    for (let i = 0; i < 7; i++) { const ang = -Math.PI / 2 + (i - 3) * 0.32, h = (260 + (i % 3) * 70) * up, x0 = 300 + (i - 3) * 46, x1 = x0 + Math.cos(ang) * h * 0.6, y1 = base - h;
      g.beginPath(); g.moveTo(x0 - 26, base); g.quadraticCurveTo(x1 - 20, (base + y1) / 2, x1, y1); g.quadraticCurveTo(x1 + 20, (base + y1) / 2, x0 + 26, base); g.closePath(); fillInk(g, i % 2 ? '#e9f7ff' : '#cbe9f7', 8); }
    for (let i = 0; i < 12; i++) { const ang = -Math.PI * (0.12 + i / 11 * 0.76), r = 120 + 330 * t; const x = 300 + Math.cos(ang) * r, y = base - 120 + Math.sin(ang) * r * 0.9 + t * t * 420;
      g.beginPath(); g.arc(x, y, 12 - t * 6, 0, 7); g.fillStyle = '#ffffff'; g.fill(); }
    g.beginPath(); g.ellipse(300, base + 10, 230 + 60 * t, 46, 0, 0, 7); fillInk(g, '#f7fcff', 8); g.globalAlpha = 1; },
  gull(g, ph) { const f = Math.sin(ph * Math.PI * 2) * 40; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(140, 480 - f); g.quadraticCurveTo(220, 440 - f * 0.6, 300, 500); g.quadraticCurveTo(380, 440 - f * 0.6, 460, 480 - f);
    g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 14; g.strokeStyle = '#f5f2ec'; g.stroke(); },
  sparkle(g, t) { const a = Math.sin(Math.PI * Math.min(1, t)); g.save(); g.translate(300, 500); g.rotate(t * 2); g.fillStyle = `rgba(255,255,240,${a})`;
    g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 40 : 160; g.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } g.closePath(); g.fill(); g.restore(); },
};

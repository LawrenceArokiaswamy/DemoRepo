// Minimal hand-drawn stick-figure rig + helpers (original code, node-canvas).
const path = require('path');
const KIT = '/home/user/kaomei/stickman-video-director/skills/directing-stickman-videos';
const {createCanvas, GlobalFonts} = require(path.join(KIT, 'node_modules/@napi-rs/canvas'));
GlobalFonts.registerFromPath(path.join(KIT, 'assets/fonts/Caveat.ttf'), 'Hand');

const W = 1080, H = 1920, FPS = 30;
const INK = '#1b1b1a', RED = '#E5463B', YEL = '#F6C431', PAPER = '#FDFDFC';
const D = Math.PI / 180;

// ---------- math / easing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeBack = k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
// keyframes: [{t, ...numbers}] -> interpolated object (smoothstep)
function tween(keys, t, ease = smooth) {
  if (t <= keys[0].t) return {...keys[0]};
  for (let i = 1; i < keys.length; i++) if (t < keys[i].t) {
    const a = keys[i - 1], b = keys[i], k = (b.ease || ease)((t - a.t) / (b.t - a.t)), o = {...b};
    for (const key in b) if (typeof b[key] === 'number' && typeof a[key] === 'number') o[key] = lerp(a[key], b[key], k);
    for (const key in a) if (!(key in b)) o[key] = a[key];
    return o;
  }
  return {...keys.at(-1)};
}

// ---------- boiling hand-drawn line ----------
let BOIL = 0; // changes ~10x per second
function setBoil(frame) { BOIL = Math.floor(frame / 3); }
function jit(x, y, id, amt = 1.3) { return [x + (hash(BOIL * 13.1 + id * 7.7) - .5) * 2 * amt, y + (hash(BOIL * 5.3 + id * 3.1 + 9) - .5) * 2 * amt]; }
function stroke(ctx, pts, {w = 7, color = INK, id = 1, amt = 1.2, close = false, sharp = false} = {}) {
  ctx.save(); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const p = pts.map((q, i) => jit(q[0], q[1], id * 31 + i, amt));
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
  if (p.length === 2 || sharp) for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
  else { for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my); } ctx.lineTo(p.at(-1)[0], p.at(-1)[1]); }
  if (close) ctx.closePath();
  ctx.stroke(); ctx.restore();
}
function circle(ctx, x, y, r, {w = 7, color = INK, fill = null, id = 1} = {}) {
  const n = 22, pts = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 + .2, rr = r * (1 + (hash(id * 3 + i * 1.7 + BOIL * .37) - .5) * .035); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  if (fill) { ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.fill(); ctx.restore(); }
  if (w) stroke(ctx, pts, {w, color, id, amt: .5});
}
function poly(ctx, pts, fill, alpha = 1) { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); ctx.restore(); }

// ---------- background ----------
function paper(ctx) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(30,60,90,0.045)'; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

// ---------- the figure ----------
// angles in degrees; 0 = pointing straight down, +ve = toward screen-right
const dir = a => [Math.sin(a * D), Math.cos(a * D)];
const DEFAULT_POSE = {torso: 0, head: 0, lsh: -12, lel: -8, rsh: 12, rel: 8, lhip: -7, lkn: 0, rhip: 7, rkn: 0};
const DIMS = {R: 54, neck: 12, torso: 175, ua: 88, fa: 82, th: 105, sh: 105};
function walkPose(phase, amp = 1) {
  const s = Math.sin(phase), c = Math.cos(phase);
  return {lhip: -26 * s * amp, rhip: 26 * s * amp, lkn: (s > 0 ? -38 * s : -8 * -s) * amp, rkn: (s < 0 ? 38 * s : -8 * s) * amp,
    lsh: 24 * s * amp - 6, rsh: -24 * s * amp + 6, lel: -14, rel: 14, bob: -7 * Math.abs(c) * amp};
}
// fig: {x, y: hip y (feet land at y + th + sh), s, pose, face, extras}
function figure(ctx, f) {
  const s = f.s || 1, P = {...DEFAULT_POSE, ...(f.pose || {})}, d = DIMS, id = f.id || 1;
  const hip = [f.x, f.y + (P.bob || 0) * s];
  const tv = dir(180 + P.torso); // torso points up
  const sh = [hip[0] + tv[0] * d.torso * s, hip[1] + tv[1] * d.torso * s];
  const hv = dir(180 + P.torso + P.head);
  const hc = [sh[0] + hv[0] * (d.neck + d.R) * s, sh[1] + hv[1] * (d.neck + d.R) * s];
  const limb = (o, a1, a2, l1, l2) => { const v1 = dir(a1 + P.torso), e = [o[0] + v1[0] * l1 * s, o[1] + v1[1] * l1 * s], v2 = dir(a1 + a2 + P.torso); return [o, e, [e[0] + v2[0] * l2 * s, e[1] + v2[1] * l2 * s]]; };
  const L = {la: limb(sh, P.lsh, P.lel, d.ua, d.fa), ra: limb(sh, P.rsh, P.rel, d.ua, d.fa), ll: limb(hip, P.lhip, P.lkn, d.th, d.sh), rl: limb(hip, P.rhip, P.rkn, d.th, d.sh)};
  const w = 7.5 * s;
  if (f.under) f.under(ctx, {hip, sh, hc, L, s});
  stroke(ctx, L.ll, {w, id: id + 1, sharp: true}); stroke(ctx, L.rl, {w, id: id + 2, sharp: true});
  // feet: little ovals
  for (const leg of [L.ll, L.rl]) { const fp = leg[2]; ctx.save(); ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = w * .8; ctx.beginPath(); ctx.ellipse(fp[0] + (f.face?.facing || 1) * 8 * s, fp[1] + 2 * s, 15 * s, 8 * s, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  stroke(ctx, [hip, [lerp(hip[0], sh[0], .5) + (P.curve || 0) * s, lerp(hip[1], sh[1], .5)], sh], {w, id: id + 3});
  if (f.shirt) f.shirt(ctx, {hip, sh, hc, L, s, w});
  stroke(ctx, L.la, {w, id: id + 4, sharp: true}); stroke(ctx, L.ra, {w, id: id + 5, sharp: true});
  for (const arm of [L.la, L.ra]) circle(ctx, arm[2][0], arm[2][1], 8.5 * s, {w: w * .8, fill: PAPER, id: id + 9});
  // head
  circle(ctx, hc[0], hc[1], d.R * s, {w, fill: PAPER, id: id + 6});
  // hair tuft
  const ht = [hc[0] + hv[0] * d.R * s, hc[1] + hv[1] * d.R * s];
  stroke(ctx, [ht, [ht[0] - 6 * s, ht[1] - 18 * s], [ht[0] + 10 * s, ht[1] - 26 * s]], {w: w * .7, id: id + 7});
  stroke(ctx, [[ht[0] + 4 * s, ht[1]], [ht[0] + 16 * s, ht[1] - 15 * s]], {w: w * .7, id: id + 8});
  drawFace(ctx, hc, s, f.face || {}, id, f.t || 0);
  if (f.over) f.over(ctx, {hip, sh, hc, L, s});
  return {hip, sh, hc, L};
}
function drawFace(ctx, [cx, cy], s, F, id, t) {
  const R = DIMS.R * s, fx = (F.facing || 0) * 10 * s, look = F.look || [0, 0];
  let open = 1; const bl = F.blinkSeed ?? id; const cyc = (t + hash(bl) * 3) % 3.1; if (cyc < .12 && !F.noBlink) open = .1;
  const ex = 18 * s, ey = cy - 6 * s;
  for (const side of [-1, 1]) {
    const x = cx + fx + side * ex;
    if (F.eyes === 'wide') {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * s;
      ctx.beginPath(); ctx.ellipse(x, ey, 12 * s, 14 * s * open, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + look[0] * 5 * s, ey + look[1] * 5 * s, 5.5 * s * Math.max(open, .3), 0, 7); ctx.fill(); ctx.restore();
    } else if (F.eyes === 'shut' || open < .5) {
      stroke(ctx, [[x - 8 * s, ey], [x, ey + 4 * s], [x + 8 * s, ey]], {w: 4 * s, id: id + 40 + side});
    } else if (F.eyes === 'happy') {
      stroke(ctx, [[x - 8 * s, ey + 3 * s], [x, ey - 5 * s], [x + 8 * s, ey + 3 * s]], {w: 4 * s, id: id + 42 + side});
    } else { ctx.save(); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x + look[0] * 4 * s, ey + look[1] * 4 * s, 6 * s, 8 * s, 0, 0, 7); ctx.fill(); ctx.restore(); }
    // brows
    const b = F.brow || 0; // +1 worried (inner up), -1 angry
    if (b) stroke(ctx, [[x + side * 12 * s, ey - 21 * s + 4 * s * b], [x - side * 9 * s, ey - 23 * s - 6 * s * b]], {w: 4.5 * s, id: id + 44 + side});
  }
  const my = cy + 24 * s, mx = cx + fx, m = F.mouth || 'smile';
  ctx.save(); ctx.lineWidth = 4.5 * s; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (m === 'smile') stroke(ctx, [[mx - 16 * s, my - 3 * s], [mx, my + 7 * s], [mx + 16 * s, my - 3 * s]], {w: 4.5 * s, id: id + 50});
  else if (m === 'grin') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx - 20 * s, my - 6 * s); ctx.quadraticCurveTo(mx, my + 22 * s, mx + 20 * s, my - 6 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (m === 'frown') stroke(ctx, [[mx - 15 * s, my + 6 * s], [mx, my - 4 * s], [mx + 15 * s, my + 6 * s]], {w: 4.5 * s, id: id + 51});
  else if (m === 'flat') stroke(ctx, [[mx - 13 * s, my + 2 * s], [mx + 13 * s, my + 2 * s]], {w: 4.5 * s, id: id + 52});
  else if (m === 'o') { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(mx, my + 2 * s, 8 * s, 11 * s * (F.mouthOpen ?? 1), 0, 0, 7); ctx.fill(); }
  else if (m === 'wobble') { const pts = []; for (let i = 0; i <= 6; i++) pts.push([mx - 18 * s + i * 6 * s, my + 3 * s + (i % 2 ? -5 : 5) * s]); stroke(ctx, pts, {w: 4.5 * s, id: id + 53}); }
  else if (m === 'grit') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.rect(mx - 20 * s, my - 6 * s, 40 * s, 16 * s); ctx.fill(); ctx.stroke(); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(mx + i * 10 * s, my - 6 * s); ctx.lineTo(mx + i * 10 * s, my + 10 * s); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(mx - 20 * s, my + 2 * s); ctx.lineTo(mx + 20 * s, my + 2 * s); ctx.stroke(); }
  ctx.restore();
  if (F.blush) for (const side of [-1, 1]) { ctx.save(); ctx.globalAlpha = .35 * F.blush; ctx.fillStyle = RED; ctx.beginPath(); ctx.ellipse(cx + fx + side * 33 * s, cy + 12 * s, 12 * s, 6 * s, 0, 0, 7); ctx.fill(); ctx.restore(); }
  if (F.sweat) sweat(ctx, cx + R * .95, cy - R * .25, s, t, F.sweat);
}
function sweat(ctx, x, y, s, t, n = 1) {
  for (let i = 0; i < n; i++) {
    const k = ((t * 1.3 + i * .45) % 1), yy = y + k * 60 * s + i * 8 * s, xx = x + i * 16 * s;
    ctx.save(); ctx.globalAlpha = 1 - k * .8; ctx.fillStyle = '#9fd3f5'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(xx, yy - 13 * s); ctx.quadraticCurveTo(xx + 9 * s, yy + 2 * s, xx, yy + 6 * s); ctx.quadraticCurveTo(xx - 9 * s, yy + 2 * s, xx, yy - 13 * s); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
function shakeLines(ctx, x, y, s, side, id) { for (let i = 0; i < 2; i++) stroke(ctx, [[x + side * (14 + i * 14) * s, y - 14 * s], [x + side * (20 + i * 14) * s, y], [x + side * (14 + i * 14) * s, y + 14 * s]], {w: 4 * s, id: id + i}); }

// ---------- text ----------
// handwritten write-on: reveal left->right
function hand(ctx, text, x, y, size, color, k = 1, align = 'left', weight = 700) {
  if (k <= 0) return;
  ctx.save(); ctx.font = `${weight} ${size}px Hand`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
  const w = ctx.measureText(text).width, x0 = align === 'center' ? x - w / 2 : x;
  ctx.beginPath(); ctx.rect(x0 - 20, y - size * 1.2, (w + 40) * clamp(k), size * 1.6); ctx.clip();
  ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
  return w;
}
function caption(ctx, text) {
  if (!text) return;
  ctx.save(); ctx.font = `700 64px Hand`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width, y = 1560;
  ctx.fillStyle = 'rgba(253,253,252,0.92)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 26, y - 46, w + 52, 92, 22); ctx.fill();
  ctx.fillStyle = INK; ctx.fillText(text, W / 2, y + 2); ctx.restore();
}
function marker(ctx, x1, y, x2, k, color = YEL, w = 16, id = 5) { if (k <= 0) return; stroke(ctx, [[x1, y], [lerp(x1, x2, .5), y - 4], [lerp(x1, x2, k), y + 2]], {w, color, id}); }

module.exports = {createCanvas, W, H, FPS, INK, RED, YEL, PAPER, D, clamp, lerp, smooth, easeOut, easeBack, seg, hash, tween, setBoil, stroke, circle, poly, paper, figure, walkPose, sweat, shakeLines, hand, caption, marker, DIMS, dir};

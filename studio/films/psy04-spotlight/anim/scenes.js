// PSY04 "The Spotlight Effect": shot choreography (film time = narration + 0.15 s).
const R = require('./rig.js');
const {W, H, INK, RED, YEL, PAPER, clamp, lerp, smooth, easeOut, easeBack, seg, hash, stroke, circle, poly, figure, walkPose, shakeLines, hand, marker} = R;

const FLOOR = 1400;
const hipY = (s, floor = FLOOR) => floor - (R.DIMS.th + R.DIMS.sh) * s;
const cues = []; // audio cues {t, f, g}
function floorLine(ctx, x1 = 40, x2 = 1040, y = FLOOR) { stroke(ctx, [[x1, y + 8], [lerp(x1, x2, .5), y + 4], [x2, y + 8]], {w: 5, id: 900}); }
function headline(ctx, t, a, l1, l2, t2, c2 = RED, size = 140) {
  hand(ctx, l1, 80, 240, size, INK, seg(t, a, a + .32));
  if (l2) hand(ctx, l2, 80, 240 + size * .98, size, c2, seg(t, t2, t2 + .32));
}
function spotlight(ctx, x, apexY, floorY, halfW, k, flick = 0, lamp = true) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k * (1 - flick);
  const g = ctx.createLinearGradient(0, apexY, 0, floorY);
  g.addColorStop(0, 'rgba(252,214,80,0.85)'); g.addColorStop(1, 'rgba(252,214,80,0.35)');
  poly(ctx, [[x - 36, apexY], [x + 36, apexY], [x + halfW, floorY], [x - halfW, floorY]], g);
  ctx.fillStyle = 'rgba(250,200,50,0.45)'; ctx.beginPath(); ctx.ellipse(x, floorY, halfW, 30, 0, 0, 7); ctx.fill();
  ctx.restore();
  if (!lamp) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 2);
  stroke(ctx, [[x, apexY - 90], [x, apexY - 40]], {w: 6, id: 801});
  poly(ctx, [[x - 46, apexY - 44], [x + 46, apexY - 44], [x + 36, apexY], [x - 36, apexY]], '#555');
  stroke(ctx, [[x - 46, apexY - 44], [x + 46, apexY - 44], [x + 36, apexY], [x - 36, apexY]], {w: 6, id: 802, close: true, sharp: true});
  ctx.restore();
}
function vignette(ctx, x, y, k, a = .55) { if (k <= 0) return; ctx.save(); const g = ctx.createRadialGradient(x, y, 260, x, y, 900); g.addColorStop(0, 'rgba(25,25,35,0)'); g.addColorStop(1, `rgba(25,25,35,${a * k})`); ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore(); }
function eyePair(ctx, x, y, sc, k, lx, ly) {
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(x + side * 26 * sc, y); ctx.scale(sc, sc * k);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(lx, ly, 8, 0, 7); ctx.fill(); ctx.restore();
  }
}
function eyesInDark(ctx, t, a, tx, ty, spots) {
  spots.forEach(([x, y, sc], i) => { const k = easeBack(seg(t, a + i * .09, a + i * .09 + .22)); if (k <= 0) return; const dx = tx - x, dy = ty - y, n = Math.hypot(dx, dy); eyePair(ctx, x, y, sc, k, dx / n * 6, dy / n * 6); });
}
function door(ctx, x, floor, open = 1, sign = null) {
  const w = 230, h = 560;
  stroke(ctx, [[x, floor], [x, floor - h], [x + w, floor - h], [x + w, floor]], {w: 7, id: 700, sharp: true});
  const lw = w * (1 - .75 * open);
  poly(ctx, [[x, floor - h], [x - lw * .35, floor - h + 30], [x - lw * .35, floor + 10], [x, floor]], PAPER);
  stroke(ctx, [[x, floor - h], [x - lw * .35, floor - h + 30], [x - lw * .35, floor + 10], [x, floor]], {w: 7, id: 701, sharp: true});
  if (sign) { const b = [[x + 40, floor - h - 90], [x + w - 40, floor - h - 90], [x + w - 40, floor - h - 20], [x + 40, floor - h - 20]]; poly(ctx, b, '#fff'); stroke(ctx, b, {w: 5, id: 703, close: true, sharp: true}); hand(ctx, sign, x + w / 2, floor - h - 34, 54, INK, 1, 'center'); }
}
function printFace(ctx, x, y, s, k) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(Math.cos(a) * 30, Math.sin(a) * 30 - 4, 14, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ffe6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-8, -5, 3.5, 0, 7); ctx.arc(8, -5, 3.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-13, 5); ctx.quadraticCurveTo(0, 22, 13, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(-16, 26); ctx.lineTo(-16, 42); ctx.closePath(); ctx.moveTo(0, 34); ctx.lineTo(16, 26); ctx.lineTo(16, 42); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function tshirt({stain = 0, pull = 0, print = 0, color = '#fff'} = {}) {
  return (ctx, {hip, sh, s, w}) => {
    const cx = sh[0], top = sh[1], bot = hip[1] + 18 * s + pull * 22 * s, hw = 46 * s, bw = 44 * s + pull * 14 * s;
    const pts = [[cx - hw, top + 4 * s], [cx - hw - 30 * s, top + 40 * s], [cx - hw - 12 * s, top + 62 * s], [cx - hw + 4 * s, top + 44 * s], [cx - bw, bot], [cx + bw, bot], [cx + hw - 4 * s, top + 44 * s], [cx + hw + 12 * s, top + 62 * s], [cx + hw + 30 * s, top + 40 * s], [cx + hw, top + 4 * s], [cx + 16 * s, top + 2 * s], [cx, top + 14 * s], [cx - 16 * s, top + 2 * s]];
    poly(ctx, pts, color); stroke(ctx, [...pts, pts[0]], {w: w * .7, id: 600, amt: .8});
    if (print) printFace(ctx, cx, top + 92 * s, s * .95, print);
    if (stain > 0) {
      const sx = cx + 6 * s, sy = top + 88 * s, r = 30 * s * stain;
      ctx.save(); ctx.fillStyle = '#8a4b2a'; ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * (0.75 + hash(i * 3.3) * .55); ctx[i ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) { const a = hash(i + 4) * 7, d = r * (1.3 + hash(i + 9) * .5); ctx.beginPath(); ctx.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 5 * s * stain, 0, 7); ctx.fill(); }
      ctx.fillRect(sx - 4 * s, sy + r * .6, 8 * s, r * .9 * stain); ctx.restore();
    }
  };
}
function phone(ctx, [x, y], s, ang = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = YEL; ctx.strokeStyle = INK; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.roundRect(-13 * s, -34 * s, 26 * s, 44 * s, 5 * s); ctx.fill(); ctx.stroke(); ctx.restore(); }
function clipboard(ctx, [x, y], s) { ctx.save(); ctx.translate(x, y); ctx.rotate(-.15); ctx.fillStyle = '#b07a45'; ctx.strokeStyle = INK; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.rect(-6 * s, -60 * s, 50 * s, 66 * s); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(0, -52 * s, 38 * s, 52 * s); ctx.lineWidth = 2 * s; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(5 * s, (-44 + i * 11) * s); ctx.lineTo(32 * s, (-44 + i * 11) * s); ctx.stroke(); } ctx.restore(); }
function glasses(ctx, [cx, cy], s, fx = 0) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 4 * s; for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + fx * 10 * s + side * 18 * s, cy - 6 * s, 15 * s, 0, 7); ctx.stroke(); } ctx.restore(); }
function qmark(ctx, x, y, k, size = 130) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); hand(ctx, '?', 0, 0, size, RED, 1, 'center'); ctx.restore(); }
function bubble(ctx, cx, cy, rx, ry, k, tail) {
  if (k <= 0) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  const n = 11; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; circle(ctx, Math.cos(a) * rx * .82, Math.sin(a) * ry * .78, Math.min(rx, ry) * .38, {w: 6, fill: '#fff', id: 400 + i}); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, rx * .86, ry * .82, 0, 0, 7); ctx.fill();
  ctx.restore();
  if (tail) tail.forEach(([x, y, r], i) => circle(ctx, x, y, r * k, {w: 5, fill: '#fff', id: 420 + i}));
}
function curtains(ctx, open) {
  for (const side of [-1, 1]) {
    const edge = W / 2 + side * lerp(60, 400, open), outer = side < 0 ? -40 : W + 40;
    const pts = [[outer, 520], [edge, 520]]; for (let i = 0; i <= 8; i++) pts.push([edge + side * Math.sin(i) * 10 - side * i * i * 1.6, 520 + i * 115]); pts.push([outer, 1440]);
    poly(ctx, pts, '#d8382c'); stroke(ctx, pts.slice(1, -1), {w: 6, id: 950 + side});
    for (let j = 1; j < 4; j++) { const xx = lerp(edge, outer, j / 4); stroke(ctx, [[xx, 540], [xx + side * 14, 980], [xx - side * 10, 1420]], {w: 4, id: 960 + j * side, color: '#9e2219'}); }
  }
  poly(ctx, [[-40, 470], [W + 40, 470], [W + 40, 540], [-40, 540]], '#b52a20'); stroke(ctx, [[-40, 540], [W + 40, 540]], {w: 6, id: 970});
}
function stage(ctx) { poly(ctx, [[0, FLOOR], [W, FLOOR], [W, FLOOR + 110], [0, FLOOR + 110]], '#e9c896'); stroke(ctx, [[0, FLOOR], [W, FLOOR]], {w: 6, id: 980}); stroke(ctx, [[0, FLOOR + 110], [W, FLOOR + 110]], {w: 6, id: 981}); for (let x = 60; x < W; x += 120) stroke(ctx, [[x, FLOOR + 8], [x - 10, FLOOR + 104]], {w: 3, id: 982 + x, color: '#a07a46'}); }
const PHONE_R = {rsh: 26, rel: 128, lsh: -10, lel: -6};
const PHONE_L = {lsh: -26, lel: -128, rsh: 10, rel: 6};
const NERVOUS = {lsh: 22, lel: -120, rsh: -22, rel: 120, lhip: -8, rhip: 8};
const handPt = (g, side) => (side === 'r' ? g.L.ra : g.L.la)[2];

// ---------- shots ----------
const shots = [];

// S1 "You walk in, and you're sure everyone noticed."
shots.push({end: 3.11, cam: t => ({z: 1 + .07 * smooth(seg(t, 1.0, 3.1)), cx: 640, cy: 1050, shake: t > 1 && t < 1.3 ? (1.3 - t) * 30 : 0}),
  cues: [[.02, 'door', .5], [.3, 'step', .5], [.6, 'step', .5], [.9, 'step', .5], [1.0, 'thunk', .9], [1.66, 'pep', .25]],
  draw(ctx, t) {
    const s = 1.75, on = seg(t, 1.0, 1.08);
    door(ctx, 60, FLOOR, 1); floorLine(ctx);
    const walk = t < 1.0, x = lerp(220, 640, easeOut(seg(t, 0, 1.0)) * .35 + seg(t, 0, 1.0) * .65);
    vignette(ctx, 640, 1050, on);
    spotlight(ctx, 640, 470, FLOOR, 280, on, t > 1.08 && t < 1.16 ? .5 : 0);
    let pose, face;
    if (walk) { pose = walkPose(t * Math.PI * 2 * 1.7); face = {eyes: 'dot', mouth: 'smile', facing: 1, look: [1, 0]}; }
    else {
      const k = easeBack(seg(t, 1.0, 1.18)), dart = Math.sin(t * 7) > 0 ? 1 : -1;
      pose = {lhip: lerp(-20, -10, k), rhip: lerp(20, 12, k), lkn: lerp(-20, 0, k), rkn: 0, lsh: lerp(-10, 22, k), lel: lerp(-14, -120, k), rsh: lerp(10, -22, k), rel: lerp(14, 120, k), bob: -22 * Math.sin(Math.PI * seg(t, 1.0, 1.25)), head: Math.sin(t * 7) * 2};
      face = {eyes: 'wide', mouth: t > 1.5 ? 'wobble' : 'o', brow: 1, look: [t > 1.35 ? dart : 0, 0], sweat: t > 1.45 ? 2 : 0, noBlink: true, blush: seg(t, 1.8, 2.3)};
    }
    const g = figure(ctx, {x, y: hipY(s), s, pose, face, t, id: 10});
    if (!walk && t > 1.25) { shakeLines(ctx, g.hc[0] - 100, g.hc[1], 1.75, -1, 30); shakeLines(ctx, g.hc[0] + 100, g.hc[1], 1.75, 1, 33); }
    eyesInDark(ctx, t, 1.65, g.hc[0], g.hc[1], [[150, 700, 1.1], [930, 640, 1.2], [110, 1060, 1], [970, 1000, 1.1], [900, 1290, .95], [180, 1300, .9]]);
  },
  hud(ctx, t) { headline(ctx, t, .05, 'EVERYONE', 'NOTICED.', 1.55); }});

// S2 "The stain."
shots.push({end: 4.242, cam: t => ({z: 1 + .04 * t, cx: 540, cy: 1000, shake: t > .14 && t < .36 ? 12 * (.36 - t) / .22 : 0}),
  cues: [[0, 'swish', .35], [.12, 'splat', .7]],
  draw(ctx, t) {
    const s = 2.6, st = easeBack(seg(t, .12, .32)), pull = smooth(seg(t, .45, .7));
    const pose = {lsh: lerp(-24, -40, pull), lel: lerp(28, 6, pull), rsh: lerp(24, 40, pull), rel: lerp(-28, -6, pull), lhip: -6, rhip: 6};
    figure(ctx, {x: 540, y: 1250, s, pose, face: {eyes: 'wide', mouth: 'o', mouthOpen: .6 + .5 * st, brow: 1, look: [0, t > .2 ? 1 : 0], sweat: t > .5 ? 1 : 0, noBlink: true}, t, id: 60, shirt: tshirt({stain: st, pull})});
    if (t > .12 && t < .5) { const k = seg(t, .12, .5); for (let i = 0; i < 8; i++) { const a = i / 8 * 7, r1 = 140 + k * 90; stroke(ctx, [[560 + Math.cos(a) * r1, 1010 + Math.sin(a) * r1], [560 + Math.cos(a) * (r1 + 40), 1010 + Math.sin(a) * (r1 + 40)]], {w: 6, id: 70 + i}); } }
  },
  hud(ctx, t) { hand(ctx, 'THE STAIN.', 80, 240, 140, INK, seg(t, .05, .3)); }});

// S3 "The awkward wave."
shots.push({end: 5.671, cam: t => ({z: 1.02 + .03 * t, cx: 540, cy: 1050}),
  cues: [[0, 'swish', .35], [.95, 'pop', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    const s = 1.45, freeze = seg(t, .85, 1.05), wav = Math.sin(t * 16) * (1 - freeze);
    const pose = {rsh: lerp(150, 120, freeze) + wav * 14, rel: lerp(25, 10, freeze) + wav * 18, lsh: -12, lel: -8, lhip: -7, rhip: 7, torso: wav * 2};
    const face = t < .85 ? {eyes: 'happy', mouth: 'grin', facing: 1} : {eyes: 'dot', mouth: 'grit', facing: 1, look: [1, 0], blush: freeze, sweat: t > 1.05 ? 1 : 0};
    const g = figure(ctx, {x: 300, y: hipY(s), s, pose, face, t, id: 100});
    if (t < .85) for (const k of [0, 1]) stroke(ctx, [[g.L.ra[2][0] + 30 + k * 18, g.L.ra[2][1] - 30], [g.L.ra[2][0] + 46 + k * 18, g.L.ra[2][1] - 6]], {w: 5, id: 120 + k, color: YEL});
    const x2 = lerp(1000, 640, seg(t, 0, 1.43)), wp = walkPose(t * Math.PI * 2 * 1.6, .8);
    const g2 = figure(ctx, {x: x2, y: hipY(s), s, pose: {...wp, ...PHONE_L}, face: {eyes: 'dot', mouth: 'flat', facing: -1, look: [-1, 1]}, t, id: 140});
    phone(ctx, handPt(g2, 'l'), s, .2);
  },
  hud(ctx, t) { hand(ctx, 'THE WAVE.', 80, 240, 140, INK, seg(t, .05, .3)); }});

// S4 "The voice crack."
shots.push({end: 7.349, cam: t => ({z: 1 + .03 * t, cx: 540, cy: 1000, shake: t > .42 && t < .62 ? 10 : 0}),
  cues: [[0, 'swish', .35], [.42, 'squeak', .55]],
  draw(ctx, t) {
    const s = 2.3, cr = seg(t, .42, .52), talk = t < .42 ? (Math.sin(t * 30) * .5 + .5) : 1;
    const pose = {rsh: lerp(14, 160, easeBack(cr)), rel: lerp(8, 50, cr), lsh: -14, lel: -10, lhip: -6, rhip: 6, head: cr * -4};
    const face = t < .42 ? {eyes: 'dot', mouth: 'o', mouthOpen: .3 + .7 * talk} : {eyes: 'wide', mouth: 'o', mouthOpen: 1.1, brow: 1, blush: seg(t, .5, .9), noBlink: true, sweat: t > .8 ? 1 : 0};
    const g = figure(ctx, {x: 540, y: 1280, s, pose, face, t, id: 160});
    if (t > .42) { const k = seg(t, .42, .7), mx = g.hc[0] + 70, my = g.hc[1] + 60; stroke(ctx, [[mx, my], [mx + 40 * k, my - 30 * k], [mx + 60 * k, my + 10 * k], [mx + 100 * k, my - 30 * k], [mx + 120 * k, my + 5 * k]], {w: 8, color: RED, id: 170, sharp: true});
      ctx.save(); const sc = easeBack(seg(t, .45, .65)); ctx.translate(mx + 190, my - 120); ctx.rotate(-.12); ctx.scale(sc, sc); hand(ctx, 'SQUEAK!', 0, 0, 96, RED, 1, 'center'); ctx.restore(); }
  },
  hud(ctx, t) { hand(ctx, 'THE VOICE CRACK.', 80, 240, 130, INK, seg(t, .05, .35)); }});

// S5 "But here's the thing: they almost certainly didn't."
shots.push({end: 10.789, cam: t => ({z: 1, cx: 540, cy: 1000}),
  cues: [[0, 'scratch', .5], [1.6, 'swish', .25], [2.3, 'pop', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    figure(ctx, {x: 220, y: hipY(1.3), s: 1.3, pose: {...NERVOUS, lhip: -10, rhip: 12}, face: {eyes: 'wide', mouth: 'wobble', brow: 1, sweat: 2, noBlink: true, look: [1, 0]}, t, id: 200});
    [0, .55, 1.1].forEach((d, i) => {
      const tt = Math.max(0, t - .4 - d), x = lerp(1180, -160, tt / 3.2);
      if (tt <= 0 || x < -150) return;
      const gg = figure(ctx, {x, y: hipY(1.15), s: 1.15, pose: {...walkPose(tt * Math.PI * 2 * 1.55 + i, .85), ...PHONE_L}, face: {eyes: 'dot', mouth: i === 1 ? 'smile' : 'flat', facing: -1, look: [-1, 1]}, t: t + i, id: 220 + i * 20});
      phone(ctx, handPt(gg, 'l'), 1.15, .2);
    });
    if (t < .4) { ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#000'; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore(); }
  },
  hud(ctx, t) {
    if (t < 1.45) hand(ctx, 'BUT...', 80, 240, 150, INK, seg(t, .05, .25));
    else { hand(ctx, "THEY DIDN'T", 80, 240, 140, INK, seg(t, 1.5, 1.85)); hand(ctx, 'EVEN LOOK.', 80, 377, 140, RED, seg(t, 2.3, 2.6)); }
  }});

// S6 "In 2000, Cornell psychologists sent students into a room"
shots.push({end: 15.04, cam: t => ({z: 1 + .02 * t, cx: 540, cy: 1050}),
  cues: [[0, 'swish', .35], [.3, 'pop', .25], [1.4, 'step', .4], [1.8, 'step', .4], [2.2, 'step', .4], [2.6, 'step', .4], [3.0, 'step', .4], [3.7, 'door', .5]],
  draw(ctx, t) {
    floorLine(ctx); door(ctx, 780, FLOOR, 1 - .9 * seg(t, 3.7, 4.0), 'LAB');
    const s = 1.35, pt = smooth(seg(t, .8, 1.1)) * (1 - smooth(seg(t, 3.2, 3.5)));
    const g = figure(ctx, {x: 250, y: hipY(s), s, pose: {lsh: -8, lel: -110, rsh: lerp(14, 95, pt), rel: lerp(8, -5, pt), lhip: -7, rhip: 7}, face: {eyes: 'dot', mouth: pt > .5 ? 'grin' : 'smile', facing: 1, look: [1, 0]}, t, id: 260});
    glasses(ctx, g.hc, s, 1); clipboard(ctx, handPt(g, 'l'), s);
    const sx = lerp(-120, 890, smooth(seg(t, 1.2, 3.6))), walking = t > 1.2 && t < 3.6, fade = 1 - seg(t, 3.6, 3.9);
    if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; figure(ctx, {x: sx, y: hipY(1.3), s: 1.3, pose: walking ? walkPose(t * Math.PI * 2 * 1.6) : {}, face: {eyes: 'dot', mouth: 'flat', facing: 1, look: [1, 0]}, t, id: 280}); ctx.restore(); }
  },
  hud(ctx, t) { hand(ctx, 'CORNELL, 2000', 80, 240, 140, INK, seg(t, .3, .7)); marker(ctx, 80, 270, 780, seg(t, .8, 1.15)); }});

// S7 "wearing a T-shirt with a cheesy pop star's face on it."
shots.push({end: 18.721, cam: t => ({z: 1 + .025 * t, cx: 540, cy: 1000}),
  cues: [[0, 'swish', .35], [.15, 'bing', .35], [2.2, 'pop', .25]],
  draw(ctx, t) {
    const s = 2.35, pr = easeBack(seg(t, .15, .45)), cringe = smooth(seg(t, 1.3, 1.6)), cover = smooth(seg(t, 2.2, 2.5));
    const pose = {lsh: lerp(-14, 30, cover), lel: lerp(-10, -125, cover), rsh: lerp(14, -30, cover), rel: lerp(10, 125, cover), lhip: -5, rhip: 5, bob: cringe * 18, head: Math.sin(t * 9) * cringe * 2};
    const face = {eyes: cringe > .5 ? 'wide' : 'dot', mouth: cringe > .5 ? 'grit' : 'smile', brow: cringe, blush: cringe, sweat: cringe > .5 ? 2 : 0, look: [Math.sin(t * 3) > 0 ? 1 : -1, 0], noBlink: cringe > .5};
    figure(ctx, {x: 540, y: 1230, s, pose, face, t, id: 300, shirt: tshirt({print: pr})});
    if (t > .15 && t < 1.2) for (let i = 0; i < 6; i++) { const a = i / 6 * 7 + .3, r = 190 + 30 * Math.sin(t * 12 + i); stroke(ctx, [[540 + Math.cos(a) * r, 1000 + Math.sin(a) * r], [540 + Math.cos(a) * (r + 34), 1000 + Math.sin(a) * (r + 34)]], {w: 6, color: YEL, id: 320 + i}); }
  },
  hud(ctx, t) { headline(ctx, t, .05, 'THE CRINGE', 'T-SHIRT.', 1.6); }});

// S8 "Then they asked: how many people noticed?"
const GROUP = [[560, -1], [670, 1], [780, -1], [890, 1], [990, -1]];
shots.push({end: 21.734, cam: t => ({z: 1, cx: 540, cy: 1050}),
  cues: [[0, 'swish', .35], [1.0, 'pep', .3], [1.2, 'pep', .3], [1.4, 'pep', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    figure(ctx, {x: 200, y: hipY(1.4), s: 1.4, pose: NERVOUS, face: {eyes: 'wide', mouth: 'wobble', brow: 1, sweat: 1, look: [1, 0]}, t, id: 340, shirt: tshirt({print: 1})});
    GROUP.forEach(([x, f], i) => figure(ctx, {x, y: hipY(1.0), s: 1.0, pose: {torso: Math.sin(t * 2 + i) * 2}, face: {eyes: 'dot', mouth: i % 2 ? 'smile' : 'flat', facing: f, look: [f, 0]}, t: t + i * .7, id: 360 + i * 12}));
    qmark(ctx, 640, 860, easeBack(seg(t, 1.0, 1.2))); qmark(ctx, 790, 800, easeBack(seg(t, 1.2, 1.4)), 150); qmark(ctx, 940, 860, easeBack(seg(t, 1.4, 1.6)));
  },
  hud(ctx, t) { headline(ctx, t, .05, 'HOW MANY', 'NOTICED?', 1.5); }});

// S9 "The students guessed about half the room."
shots.push({end: 24.293, cam: t => ({z: 1, cx: 540, cy: 1050}),
  cues: [[0, 'swish', .35], [.25, 'pop', .3], [1.45, 'bing', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    figure(ctx, {x: 230, y: hipY(1.45), s: 1.45, pose: NERVOUS, face: {eyes: 'wide', mouth: 'grit', brow: 1, sweat: 2, look: [1, -1], blush: .6, noBlink: true}, t, id: 400, shirt: tshirt({print: 1})});
    const bk = easeBack(seg(t, .2, .45));
    bubble(ctx, 680, 820, 360, 300, bk, [[380, 1060, 22], [430, 1000, 30]]);
    if (bk > .9) for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3), x = 520 + col * 160, y = 740 + row * 170, k = easeBack(seg(t, .5 + i * .1, .7 + i * .1));
      if (k <= 0) continue; const stare = (i + row) % 2 === 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); circle(ctx, 0, 0, 52, {w: 6, fill: '#fff', id: 430 + i});
      if (stare) eyePair(ctx, 0, -4, .75, 1, -6, 4); else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(14, -6, 6, 0, 7); ctx.arc(34, -6, 6, 0, 7); ctx.fill(); }
      ctx.restore();
      if (stare && t > 1.45) { ctx.save(); ctx.globalAlpha = seg(t, 1.45, 1.6); circle(ctx, x, y, 72, {w: 7, color: RED, id: 450 + i}); ctx.restore(); }
    }
  },
  hud(ctx, t) { headline(ctx, t, .05, 'THEIR GUESS:', 'HALF THE ROOM', 1.4); }});

// S10 "The real answer? About one in four."
shots.push({end: 27.539, cam: t => ({z: 1 + .05 * smooth(seg(t, 2.0, 3.2)), cx: 640, cy: 1050, shake: t > 2.05 && t < 2.25 ? 8 : 0}),
  cues: [[0, 'swish', .35], [1.35, 'pop', .3], [2.08, 'bing', .6]],
  draw(ctx, t) {
    floorLine(ctx);
    figure(ctx, {x: 170, y: hipY(1.3), s: 1.3, pose: NERVOUS, face: {eyes: 'wide', mouth: 'wobble', brow: 1, sweat: 1, look: [1, 0]}, t, id: 480, shirt: tshirt({print: 1})});
    [430, 600, 770, 940].forEach((x, i) => {
      const turns = i === 1 && t > 1.35, look = turns ? -1 : 1;
      const gg = figure(ctx, {x, y: hipY(1.05), s: 1.05, pose: i === 1 ? {head: turns ? -8 * easeBack(seg(t, 1.35, 1.55)) : 0} : PHONE_R, face: {eyes: turns ? 'wide' : 'dot', mouth: turns ? 'o' : 'flat', facing: look, look: [look, i === 1 ? 0 : 1], noBlink: turns}, t: t + i, id: 500 + i * 15});
      if (i !== 1) phone(ctx, handPt(gg, 'r'), 1.05, -.2);
    });
    if (t > 2.08) { const k = seg(t, 2.08, 2.45), pts = []; for (let i = 0; i <= 26 * k; i++) { const a = -1.6 + i / 26 * Math.PI * 2.1; pts.push([600 + Math.cos(a) * 140, 1100 + Math.sin(a) * 320]); } if (pts.length > 1) stroke(ctx, pts, {w: 12, color: YEL, id: 560}); }
  },
  hud(ctx, t) { hand(ctx, 'REALITY:', 80, 240, 140, INK, seg(t, .05, .3)); hand(ctx, '1 IN 4.', 80, 400, 170, RED, seg(t, 2.0, 2.2)); marker(ctx, 80, 430, 520, seg(t, 2.25, 2.5), RED, 12); }});

// S11 "It's called the spotlight effect. You feel like you're on stage, under a giant light."
shots.push({end: 33.126, cam: t => ({z: 1 + .08 * smooth(seg(t, 2.3, 5.5)), cx: 540, cy: 1000, shake: t > 4.3 && t < 4.6 ? 10 : 0}),
  cues: [[0, 'swish', .35], [.3, 'thunk', .8], [4.3, 'thunk', .9]],
  draw(ctx, t) {
    stage(ctx);
    const on = seg(t, .3, .36), big = easeBack(seg(t, 4.3, 4.6));
    vignette(ctx, 540, 1000, on, .65);
    spotlight(ctx, 540, lerp(640, 600, big), FLOOR, lerp(250, 470, big), on);
    const knock = t > 2.3 ? Math.sin(t * 28) * 7 : 0;
    figure(ctx, {x: 540, y: hipY(1.6), s: 1.6, pose: {lsh: 10, lel: 30, rsh: -10, rel: -30, lhip: 6 + knock, rhip: -6 - knock, lkn: -knock * .6, rkn: knock * .6, bob: lerp(0, 10, big)}, face: {eyes: 'wide', mouth: t > 2.3 ? 'grit' : 'o', brow: 1, sweat: 2, look: [Math.sin(t * 5) > 0 ? .7 : -.7, -.2], noBlink: true}, t, id: 580});
    curtains(ctx, easeOut(seg(t, 0, .45)));
  },
  hud(ctx, t) { headline(ctx, t, .15, 'THE SPOTLIGHT', 'EFFECT', .55); marker(ctx, 80, 400, 470, seg(t, .9, 1.2)); }});

// S12 "But everyone else is starring in their own show, worrying about their own stain."
const ROW = [180, 410, 670, 900];
shots.push({end: 38.131, cam: t => { const k = smooth(seg(t, .05, 1.3)); return {z: lerp(2.1, 1, k), cx: lerp(410, 540, k), cy: 1050}; },
  cues: [[0, 'swish', .35], [.5, 'thunk', .5], [.75, 'thunk', .5], [1.0, 'thunk', .5]],
  draw(ctx, t) {
    floorLine(ctx, -400, 1480);
    const ons = [.5, 0, .75, 1.0];
    ROW.forEach((x, i) => spotlight(ctx, x, 700, FLOOR, 125, i === 1 ? 1 : seg(t, ons[i], ons[i] + .06)));
    const s = 1.05, y = hipY(s);
    figure(ctx, {x: ROW[0], y, s, pose: {lsh: -24, lel: 28, rsh: 24, rel: -28 + Math.sin(t * 6) * 6}, face: {eyes: 'wide', mouth: 'o', brow: 1, look: [0, 1], sweat: 1, noBlink: true}, t, id: 600, shirt: tshirt({stain: 1})});
    figure(ctx, {x: ROW[1], y, s, pose: NERVOUS, face: {eyes: 'wide', mouth: 'wobble', brow: 1, sweat: 2, look: [Math.sin(t * 5) > 0 ? 1 : -1, 0], noBlink: true}, t, id: 620, shirt: tshirt({print: 1})});
    figure(ctx, {x: ROW[2], y, s, pose: {rsh: 165 + Math.sin(t * 10) * 10, rel: 40, lsh: -12, lel: -8}, face: {eyes: 'dot', mouth: 'grit', brow: 1, look: [-1, -1], blush: .5}, t: t + 1, id: 640});
    const gd = figure(ctx, {x: ROW[3], y, s, pose: PHONE_L, face: {eyes: 'wide', mouth: 'frown', brow: 1, facing: -1, look: [-1, 1], sweat: 1, noBlink: true}, t: t + 2, id: 660});
    phone(ctx, handPt(gd, 'l'), s, .2);
  },
  hud(ctx, t) { headline(ctx, t, .25, "EVERYONE'S IN", 'THEIR OWN SHOW.', 2.75); }});

// S13 "So next time you feel watched,"
shots.push({end: 40.132, cam: t => ({z: 1 + .05 * smooth(seg(t, .8, 1.2)), cx: 540, cy: 1000}),
  cues: [[0, 'swish', .35], [.85, 'pop', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    const stop = smooth(seg(t, .8, 1.0)), x = lerp(150, 540, Math.min(1, t / .95));
    const face = t < .85 ? {eyes: 'dot', mouth: 'smile', facing: 1, look: [1, 0]} : {eyes: 'wide', mouth: 'flat', brow: 1, look: [0, .1], noBlink: true};
    const g = figure(ctx, {x, y: hipY(1.7), s: 1.7, pose: walkPose(t * Math.PI * 2 * 1.6, 1 - stop), face, t, id: 680});
    if (t > .9) { shakeLines(ctx, g.hc[0] - 100, g.hc[1] - 20, 1.6, -1, 690); shakeLines(ctx, g.hc[0] + 100, g.hc[1] - 20, 1.6, 1, 693); }
  },
  hud(ctx, t) { hand(ctx, 'FEEL WATCHED?', 80, 240, 140, INK, seg(t, .2, .55)); }});

// S14 "remember: you're the only one holding the spotlight."  Payoff: the light is in HIS hand.
shots.push({end: 44.3755, cam: t => ({z: 1 + .04 * smooth(seg(t, 0, 2.8)) - .04 * smooth(seg(t, 3.1, 4.0)), cx: 540, cy: 1000}),
  cues: [[0, 'swish', .35], [3.0, 'click', .8], [3.3, 'bing', .3]],
  draw(ctx, t) {
    floorLine(ctx);
    const s = 1.7, off = t > 3.0, lower = smooth(seg(t, 3.15, 3.6)), realize = smooth(seg(t, 1.9, 2.2));
    const pose = {rsh: lerp(158, 20, lower), rel: lerp(30, 10, lower), lsh: off ? lerp(22, -12, lower) : 22, lel: off ? lerp(-120, -8, lower) : -120, lhip: -8, rhip: 8, head: realize * (1 - lower) * 8};
    const hy = hipY(s);
    if (!off) {
      const sh = [540, hy - R.DIMS.torso * s], v1 = R.dir(pose.rsh), e = [sh[0] + v1[0] * R.DIMS.ua * s, sh[1] + v1[1] * R.DIMS.ua * s], v2 = R.dir(pose.rsh + pose.rel), hp = [e[0] + v2[0] * R.DIMS.fa * s, e[1] + v2[1] * R.DIMS.fa * s];
      vignette(ctx, 540, 1000, 1, .5);
      ctx.save(); const g = ctx.createLinearGradient(hp[0], hp[1], 540, FLOOR); g.addColorStop(0, 'rgba(252,214,80,0.9)'); g.addColorStop(1, 'rgba(252,214,80,0.35)'); poly(ctx, [[hp[0] - 12, hp[1] + 10], [hp[0] + 12, hp[1] + 10], [770, FLOOR], [310, FLOOR]], g); ctx.fillStyle = 'rgba(250,200,50,0.45)'; ctx.beginPath(); ctx.ellipse(540, FLOOR, 230, 30, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    const face = off ? (t > 3.5 ? {eyes: 'happy', mouth: 'grin'} : {eyes: 'dot', mouth: 'o', mouthOpen: .5}) : realize > .5 ? {eyes: 'wide', mouth: 'o', brow: 1, look: [.7, -1], noBlink: true} : {eyes: 'wide', mouth: 'wobble', brow: 1, sweat: 2, noBlink: true, look: [Math.sin(t * 5) > 0 ? 1 : -1, 0]};
    const g = figure(ctx, {x: 540, y: hy, s, pose, face, t, id: 700});
    const hp = handPt(g, 'r'); ctx.save(); ctx.translate(hp[0], hp[1]); ctx.rotate(off ? lerp(.6, 0, lower) : .6); ctx.fillStyle = '#4a4a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-14, -10, 28, 70, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = off ? '#ccc' : YEL; ctx.beginPath(); ctx.roundRect(-20, 52, 40, 22, 5); ctx.fill(); ctx.stroke(); ctx.restore();
    if (realize > .5 && !off) qmark(ctx, g.hc[0] - 120, g.hc[1] - 80, easeBack(seg(t, 2.0, 2.2)), 110);
    if (t > 3.5) for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .45, r = 110 + 10 * Math.sin(t * 8); stroke(ctx, [[g.hc[0] + Math.cos(a) * r, g.hc[1] + Math.sin(a) * r], [g.hc[0] + Math.cos(a) * (r + 30), g.hc[1] + Math.sin(a) * (r + 30)]], {w: 6, color: YEL, id: 720 + i}); }
  },
  hud(ctx, t) { headline(ctx, t, .9, "YOU'RE HOLDING", 'THE SPOTLIGHT.', 1.75); }});

let acc = 0; for (const sh of shots) { sh.start = acc; for (const [ct, f, g] of sh.cues || []) cues.push({t: +(acc + ct).toFixed(3), f, g}); acc = sh.end; }
module.exports = {shots, duration: acc, cues};

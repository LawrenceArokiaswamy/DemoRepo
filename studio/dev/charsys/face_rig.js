// FACE RIG + EMOTIONAL ACTING (dev, 2026-11-17). Continuous facial controls for every character (head space, radius = 1),
// 12 emotions x intensity (subtle 0.35 / clear 0.7 / extreme 1.0) with body acting, character secondary actions, and a timeline API.
// Generalises Theo v3: dot eyes, thick brows, animated gasp with quiver, trembling dread mouth, shock + worry lines.
export const INK = '#1c1a1e';
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), L = (a, b, k) => a + (b - a) * k, ss = (x) => x * x * (3 - 2 * x);
const ob = (x, c = 1.6) => { x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rmp = (t, a, b) => cl((t - a) / (b - a));
// ---------------- the control set (neutral) ----------------
export const NEUTRAL = { browY: [0, 0], browAng: [0, 0], browArch: [0.06, 0.06], lidUp: [0, 0], lidLow: [0, 0], eyeW: 1, eyeH: 1, eyeWhite: 0, pupil: 1, look: [0, 0],
  mouthW: 1, jaw: 0, curve: 0, cornerL: 0, cornerR: 0, mouthX: 0, upperLip: 0, teeth: 0, tongue: 0, tremble: 0, round: 0,
  cheek: 0, blush: 0, sweat: 0, tears: 0, wrinkleNose: 0, shock: 0, worry: 0, anger: 0, sparkle: 0, squash: 0, tilt: 0 };
// emotion = full-strength target (+ extreme overlay above intensity 0.75) + body acting
export const EMOTIONS = {
  neutral:   { face: {}, body: {} },
  happy:     { face: { browY: [0.08, 0.08], browAng: [-0.05, -0.05], lidLow: [0.45, 0.45], cheek: 1, curve: 1.05, mouthW: 1.55, jaw: 0.45, teeth: 1, tongue: 0.3, blush: 0.35, sparkle: 0.7 },
               extreme: { jaw: 0.72, lidUp: [0.5, 0.5], lidLow: [0.55, 0.55], tongue: 0.7, mouthW: 1.55 }, body: { headDy: -0.08, shrug: 0.35, hands: 'open', bob: 0.04 }, bodyX: { hands: 'cheer', bob: 0.25, tilt: 0.06 } },
  sad:       { face: { browY: [0.03, 0.03], browAng: [0.6, 0.6], lidUp: [0.5, 0.5], curve: -1.05, mouthW: 0.95, look: [0, 0.7], tremble: 0.25, tears: 0.35 },
               extreme: { tears: 1, jaw: 0.38, tremble: 0.9, curve: -1.25, lidUp: [0.62, 0.62], mouthW: 1.15 }, body: { headDy: 0.12, shrug: -0.3, slump: 0.6, hands: 'limp' }, bodyX: { hands: 'face', tremor: 0.6 } },
  scared:    { face: { browY: [0.17, 0.17], browAng: [0.38, 0.38], eyeWhite: 1, pupil: 0.4, eyeH: 1.3, eyeW: 1.14, jaw: 0.34, curve: -0.5, mouthW: 1.2, teeth: 0.7, tremble: 0.65, sweat: 0.7, shock: 0.5, worry: 0.8 },
               extreme: { jaw: 0.55, pupil: 0.3, tremble: 1, shock: 1, sweat: 1, eyeH: 1.4 }, body: { shrug: 0.7, lean: -0.15, hands: 'chest', tremor: 0.7 }, bodyX: { hands: 'face', crouch: 0.25, tremor: 1 } },
  angry:     { face: { browY: [-0.06, -0.06], browAng: [-0.6, -0.6], browArch: [0.02, 0.02], lidUp: [0.38, 0.38], lidLow: [0.18, 0.18], curve: -0.55, mouthW: 1.05, anger: 0.7, squash: -0.03 },
               extreme: { jaw: 0.55, teeth: 1, curve: -0.35, anger: 1, mouthW: 1.35 }, body: { lean: 0.18, shrug: 0.25, hands: 'fists', headDy: 0.04 }, bodyX: { lean: 0.3, tremor: 0.3 } },
  surprised: { face: { browY: [0.3, 0.3], browAng: [0.04, 0.04], browArch: [0.15, 0.15], eyeWhite: 1, pupil: 0.75, eyeH: 1.32, eyeW: 1.18, jaw: 0.62, round: 1, mouthW: 0.72, teeth: 0.4, shock: 0.8, squash: 0.06 },
               extreme: { jaw: 0.95, shock: 1, squash: 0.1, pupil: 0.6 }, body: { headDy: -0.06, lean: -0.2, shrug: 0.5, hands: 'up' }, bodyX: { hands: 'up', bob: 0.12 } },
  confused:  { face: { browY: [0.24, -0.05], browAng: [0.08, -0.32], lidUp: [0, 0.4], lidLow: [0, 0.2], curve: -0.15, cornerL: -0.07, cornerR: 0.06, mouthX: 0.06, mouthW: 0.85, look: [0.45, -0.6], tilt: 0.2 },
               extreme: { browY: [0.32, -0.1], tilt: 0.28 }, body: { tilt: 0.12, hands: 'scratch', shrug: 0.15 }, bodyX: {} },
  curious:   { face: { browY: [0.2, 0.02], browAng: [0.0, -0.12], lidUp: [0.0, 0.15], eyeH: 1.08, curve: 0.12, mouthW: 0.6, look: [0.6, 0], tilt: -0.1 },
               extreme: { eyeH: 1.15, browY: [0.26, 0.04] }, body: { lean: 0.14, tilt: -0.06, hands: 'chin' }, bodyX: {} },
  disgusted: { face: { browY: [-0.05, 0.02], browAng: [-0.38, -0.12], lidUp: [0.32, 0.42], lidLow: [0.35, 0.3], upperLip: 1, curve: -0.5, cornerL: -0.09, mouthW: 0.95, wrinkleNose: 1, tilt: 0.1, look: [-0.6, 0] },
               extreme: { jaw: 0.25, tongue: 0.8, wrinkleNose: 1.3 }, body: { lean: -0.2, tilt: 0.1, hands: 'away' }, bodyX: { lean: -0.3 } },
  suspicious:{ face: { browY: [0.15, -0.08], browAng: [0.0, -0.38], lidUp: [0.48, 0.52], look: [0.85, 0], curve: -0.15, cornerR: -0.05, mouthW: 0.55, mouthX: 0.08 },
               extreme: { lidUp: [0.58, 0.6] }, body: { lean: -0.05, hands: 'crossed' }, bodyX: {} },
  embarrassed:{ face: { browY: [0.06, 0.06], browAng: [0.32, 0.32], lidUp: [0.15, 0.15], blush: 1, curve: 0.55, cornerR: -0.07, mouthW: 0.85, look: [-0.75, 0.5], sweat: 0.5, tremble: 0.12 },
               extreme: { blush: 1.3, sweat: 1, tremble: 0.3 }, body: { shrug: 0.3, headDy: 0.06, hands: 'fidget', tilt: 0.08 }, bodyX: {} },
  worried:   { face: { browY: [0.16, 0.08], browAng: [0.55, 0.4], eyeH: 1.0, look: [-0.75, 0.15], curve: -0.3, mouthW: 0.7, mouthX: -0.07, cornerL: 0.05, cornerR: -0.03, upperLip: 0.5, tremble: 0.5, worry: 1, sweat: 0.45 },
               extreme: { tremble: 0.8, sweat: 0.7, eyeWhite: 0.6, pupil: 0.6 }, body: { shrug: 0.4, hands: 'wring', tremor: 0.4 }, bodyX: { tremor: 0.7 } },
  focused:   { face: { browY: [-0.07, -0.07], browAng: [-0.22, -0.22], browArch: [0.02, 0.02], lidUp: [0.3, 0.3], lidLow: [0.22, 0.22], pupil: 0.9, curve: -0.08, mouthW: 0.72 },   // intense concentration / resolve (not in CORE12)
               extreme: { lidUp: [0.4, 0.4], browY: [-0.1, -0.1], mouthW: 0.65 }, body: { shrug: -0.08, lean: 0.04, hands: 'relaxed' }, bodyX: {} },
  relieved:  { face: { browY: [0.04, 0.04], browAng: [0.3, 0.3], lidUp: [0.85, 0.85], curve: 0.75, mouthW: 1.05, jaw: 0.1, round: 0.25, blush: 0.2, tilt: -0.08 },
               extreme: { lidUp: [0.85, 0.85], curve: 0.75 }, body: { shrug: -0.35, headDy: 0.03, hands: 'chest1', exhale: 1 }, bodyX: {} },
};
export const CORE12 = ['happy', 'sad', 'scared', 'angry', 'surprised', 'confused', 'curious', 'disgusted', 'suspicious', 'embarrassed', 'worried', 'relieved'];
export const INTENSITY = { subtle: 0.35, clear: 0.7, extreme: 1.0 };
// speech / special mouth shapes (visemes)
export const MOUTHS = { rest: { jaw: 0, mouthW: 0.8 }, A: { jaw: 0.6, mouthW: 1.1, teeth: 0.6, tongue: 0.5 }, E: { jaw: 0.28, mouthW: 1.3, teeth: 1, curve: 0.2 }, O: { jaw: 0.5, round: 1, mouthW: 0.6 },
  U: { jaw: 0.2, round: 1, mouthW: 0.45 }, MBP: { jaw: 0, mouthW: 0.75, curve: -0.05 }, FV: { jaw: 0.12, mouthW: 0.9, teeth: 1 },
  gasp: { jaw: 0.85, round: 1, mouthW: 0.75, teeth: 0.4 }, laugh: { jaw: 0.75, curve: 1, mouthW: 1.5, teeth: 1, tongue: 0.7 }, cry: { jaw: 0.4, curve: -1.2, mouthW: 1.15, tremble: 0.9 } };
function lerpVal(a, b, k) { return Array.isArray(a) ? a.map((v, i) => L(v, b[i], k)) : L(a, b, k); }
export function mixParams(A, B, k) { const o = {}; for (const key in NEUTRAL) o[key] = lerpVal(A[key] ?? NEUTRAL[key], B[key] ?? NEUTRAL[key], k); return o; }
export function emotionParams(name, intensity = 0.7) {   // continuous: neutral -> target by intensity; extreme overlay fades in above 0.75
  const E = EMOTIONS[name] || EMOTIONS.neutral, full = { ...NEUTRAL, ...E.face }, k = cl(intensity / 0.85), x = ss(rmp(intensity, 0.75, 1.0));
  let p = mixParams(NEUTRAL, full, k); if (x > 0 && E.extreme) p = mixParams(p, { ...p, ...E.extreme }, x); return p; }
export function bodyParams(name, intensity = 0.7) { const E = EMOTIONS[name] || EMOTIONS.neutral, k = cl(intensity / 0.85), x = ss(rmp(intensity, 0.75, 1.0)), b = { ...E.body }, bx = E.bodyX || {};
  const o = {}; for (const key of ['headDy', 'shrug', 'lean', 'slump', 'crouch', 'bob', 'tilt', 'tremor', 'exhale']) o[key] = (b[key] || 0) * k + (bx[key] ? (bx[key] - (b[key] || 0)) * x : 0);
  o.hands = x > 0.5 && bx.hands ? bx.hands : b.hands || 'relaxed'; return o; }
// ---------------- drawing ----------------
const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
function outl(g, fill, w) { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }
// geometry used by both drawing and the automated checks
export function faceGeometry(cfg, P, yaw = 0, dir = 1) {
  const f = cfg.face || {}, size = f.eyeSize || 1, fx = (0.3 * yaw + 0.32 * Math.max(0, yaw - 0.5) * 2) * dir, sep = (f.eyeSep || 0.36) * (1 - 0.3 * yaw - 0.35 * Math.max(0, yaw - 0.5) * 2), eyY = f.eyeY || 0.04;
  const eyes = [-1, 1].map((s, i) => { const far = (s === -dir ? 1 : 0) * yaw, sc = (1 - 0.2 * far) * size, ex = fx + s * sep * (1 - 0.5 * far * yaw);
    const helm = (cfg.browCeil ?? -0.98) > -0.9, eH = helm && P.eyeH > 1 ? 1 + (P.eyeH - 1) * 0.55 : P.eyeH, ew = 0.095 * P.eyeW * sc, eh = 0.148 * eH * sc, wk = P.eyeWhite, sw = L(ew, ew * 1.35, wk), shh = L(eh, eh * 1.22, wk); return { s, i, ex, ey: eyY, ew, eh, sw, shh, top: eyY - shh, bottom: eyY + shh, hidden: yaw > 0.82 && s === -dir }; });
  const thick = 0.105 * (f.browThick || 1), ceil = cfg.browCeil ?? -0.98, glassTop = cfg.glasses ? eyY - 0.21 : 9;
  const brows = eyes.map((e) => { const i = e.i, bw = 0.19 * (f.browW || 1) * (1 - 0.2 * (e.s === -dir ? 1 : 0) * yaw), base = eyY - 0.27 - P.browY[i]; let innerY = base - P.browAng[i] * 0.3, outerY = base + P.browAng[i] * 0.1;
    let lo = Math.max(innerY, outerY) + thick / 2, shift = 0; const limit = Math.min(e.top - 0.035, glassTop - 0.015); if (lo > limit) shift = limit - lo;   // never sit on the eye or the glasses
    let hi = Math.min(innerY, outerY) - P.browArch[i] - thick / 2 + shift, shiftUp = 0, arch = P.browArch[i]; if (hi < ceil) shiftUp = Math.min(ceil - hi, Math.max(0, limit - (lo + shift)));   // never vanish under a helmet brim
    if (hi + shiftUp < ceil - 1e-4) {   // still no room (helmet + wide eyes): flatten the brow's slant/arch so it fits between brim and eye, keeping its direction
      const room = Math.max(0.0, limit - ceil - thick), dy = innerY - outerY, span = Math.abs(dy) + Math.max(0, arch), k = span > 1e-6 ? Math.min(1, room / span) : 1;
      const top = ceil + thick / 2 + Math.max(0, arch) * k; innerY = dy < 0 ? top : top + dy * k; outerY = dy < 0 ? top - dy * k : top; arch *= k; shift = 0; shiftUp = 1e-3; }
    return { e, bw, innerX: e.ex - e.s * bw * 0.95, outerX: e.ex + e.s * bw * 0.95, innerY: innerY + shift + shiftUp, outerY: outerY + shift + shiftUp, arch, thick, clampedDown: shift < 0, clampedUp: shiftUp > 0 }; });
  const mx = fx + 0.02 + P.mouthX * dir, my = 0.36 + (f.mouthY || 0), W = 0.17 * P.mouthW * (f.mouthW || 1) * (1 - 0.25 * yaw), jaw = P.jaw;
  const mouth = { mx, my, W, top: my - 0.08 - Math.abs(P.curve) * 0.07, bottom: my + 0.06 + jaw * 0.34 + Math.max(0, P.curve) * 0.1 };
  { const Wd = W * (1 - 0.35 * P.round), cL = my - P.curve * 0.07 + P.cornerL - P.upperLip * 0.05, cR = my - P.curve * 0.07 + P.cornerR, xL = mx - Wd, xR = mx + Wd, pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12, x = L(xL, xR, u), y = jaw < 0.06 ? L(cL, cR, u) + P.curve * 0.17 * Math.sin(Math.PI * u) - P.upperLip * 0.1 * (1 - u) * Math.sin(Math.PI * u)
      : L(cL, cR, u) + P.curve * 0.09 * Math.sin(Math.PI * u) - jaw * 0.06 * Math.sin(Math.PI * u) - P.upperLip * 0.07 * Math.max(0, 0.6 - u) - P.round * jaw * 0.06 * Math.sin(Math.PI * u); pts.push([x, y - 0.028]); }
    mouth.samples = pts; mouth.top = Math.min(...pts.map((q) => q[1])); }
  return { fx, eyes, brows, mouth, eyY, sep };
}
export function drawFace(g, cfg, P, o = {}) {   // cfg: { face, colors, glasses?, browCeil? }; P: control params; o: { yaw, dir, t, blink, layer: 'base'|'brows'|'accents' }
  const yaw = o.yaw || 0, dir = o.dir || 1, t = o.t || 0, c = cfg.colors, G = faceGeometry(cfg, P, yaw, dir), skin = c.skin, browCol = c.brow || INK;
  if (o.layer === 'brows') {   // drawn after hair (cartoon convention: brows read through the fringe); clamped under helmets
    for (const b of G.brows) { if (b.e.hidden) continue; g.beginPath(); g.moveTo(b.innerX, b.innerY); g.quadraticCurveTo((b.innerX + b.outerX) / 2, Math.min(b.innerY, b.outerY) - b.arch, b.outerX, b.outerY);
      g.lineCap = 'round'; if (browCol !== INK) { g.lineWidth = b.thick + 0.03; g.strokeStyle = INK; g.stroke(); } g.lineWidth = b.thick; g.strokeStyle = browCol; g.stroke(); }
    if (P.anger > 0.05) { g.save(); g.globalAlpha = cl(P.anger); g.translate(G.fx + 0.42, -0.58); g.strokeStyle = '#c0392b'; g.lineWidth = 0.045; g.lineCap = 'round'; for (const [a, b2] of [[0, 1], [1, 0], [2, 3], [3, 2]]) { g.beginPath(); const q = [[-0.1, -0.03], [0.1, -0.03], [-0.1, 0.06], [0.1, 0.06]]; g.moveTo(q[a][0] * 0.9, q[a][1] - 0.06); g.quadraticCurveTo(0, 0, q[b2][0], q[b2][1] + 0.05); g.stroke(); } g.restore(); }
    return G; }
  if (o.layer === 'accents') {   // sweat + tears on top of everything
    if (P.sweat > 0.05) { const k = cl(P.sweat), x = (G.fx + 0.7) * (dir || 1), y = -0.32 + 0.12 * ((t * 0.6) % 1) * k; g.save(); g.translate(x, y); g.scale(0.9 * k + 0.2, 0.9 * k + 0.2); g.beginPath(); g.moveTo(0, -0.16); g.quadraticCurveTo(0.12, 0.02, 0.08, 0.09); g.quadraticCurveTo(0, 0.17, -0.08, 0.09); g.quadraticCurveTo(-0.12, 0.02, 0, -0.16); outl(g, '#a8dcff', 0.03); g.beginPath(); g.ellipse(-0.03, 0.04, 0.025, 0.045, -0.3, 0, 7); g.fillStyle = '#fff'; g.fill(); g.restore(); }
    if (P.tears > 0.05) for (const e of G.eyes) { if (e.hidden) continue; const k = cl(P.tears), x0 = e.ex - e.s * e.sw * 0.2, y0 = e.bottom - 0.02, flow = (t * 1.3) % 1;
      g.beginPath(); g.moveTo(x0 - 0.035, y0); g.quadraticCurveTo(x0 - 0.05 * e.s, y0 + 0.25 * k, x0 - 0.02 * e.s, y0 + 0.45 * k); g.lineTo(x0 + 0.05 * e.s, y0 + 0.45 * k); g.quadraticCurveTo(x0 + 0.04 * e.s, y0 + 0.2 * k, x0 + 0.035, y0); g.closePath(); outl(g, 'rgba(150,205,255,0.85)', 0.025);
      g.beginPath(); g.arc(x0, y0 + 0.45 * k + 0.08 * flow, 0.04 * k, 0, 7); outl(g, 'rgba(150,205,255,0.95)', 0.02); }
    return G; }
  // ---- base layer: cheeks/blush, eyes (+lids), nose wrinkle, shock/worry lines, mouth (clipped to the skull by the caller)
  if (P.blush > 0.02) for (const e of G.eyes) { if (e.hidden) continue; g.beginPath(); g.ellipse(e.ex + e.s * 0.07, G.eyY + 0.25, 0.14, 0.075, 0, 0, 7); g.fillStyle = `rgba(235,110,110,${0.42 * cl(P.blush, 0, 1.4)})`; g.fill(); }
  for (const e of G.eyes) { if (e.hidden) continue; const i = e.i, lu = cl(Math.max(P.lidUp[i], o.blink || 0)), ll = cl(P.lidLow[i]), px = e.ex + P.look[0] * 0.07 * dir, py = e.ey + P.look[1] * 0.05;
    if (lu + ll >= 0.92) {   // closed: happy arc (cheeks up) or soft closed arc
      const happy = ll > 0.3 || P.cheek > 0.4; g.beginPath(); g.moveTo(e.ex - e.sw * 1.25, e.ey + (happy ? 0.03 : 0)); g.quadraticCurveTo(e.ex, e.ey + (happy ? -0.1 : 0.07), e.ex + e.sw * 1.25, e.ey + (happy ? 0.03 : 0)); g.lineWidth = 0.05; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); continue; }
    g.save(); g.beginPath(); g.ellipse(e.ex, e.ey, e.sw * 1.05, e.shh * 1.05, 0, 0, 7); g.clip();
    if (P.eyeWhite < 0.99) { g.globalAlpha = 1 - P.eyeWhite; g.beginPath(); g.ellipse(px, py, e.ew, e.eh, 0, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(px - e.ew * 0.3, py - e.eh * 0.45, e.ew * 0.28, 0, 7); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(); g.globalAlpha = 1; }
    if (P.eyeWhite > 0.01) { g.globalAlpha = P.eyeWhite; g.beginPath(); g.ellipse(e.ex, e.ey, e.sw, e.shh, 0, 0, 7); g.fillStyle = '#fbfaf6'; g.fill(); const pr = e.sw * 0.62 * P.pupil;
      g.beginPath(); g.arc(e.ex + P.look[0] * (e.sw - pr) * 0.8 * dir, e.ey + P.look[1] * (e.shh - pr) * 0.6, pr, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(e.ex + P.look[0] * (e.sw - pr) * 0.8 * dir - pr * 0.3, e.ey - pr * 0.35, pr * 0.32, 0, 7); g.fillStyle = '#fff'; g.fill(); g.globalAlpha = 1; }
    if (P.sparkle > 0.3) { g.fillStyle = `rgba(255,255,255,${cl(P.sparkle)})`; g.beginPath(); g.arc(px + e.ew * 0.35, py + e.eh * 0.35, e.ew * 0.16, 0, 7); g.fill(); }
    if (lu > 0.01) { const yb = e.top + 2 * e.shh * lu; g.beginPath(); g.rect(e.ex - 1, e.top - 1, 2, yb - e.top + 1); g.fillStyle = skin; g.fill(); g.beginPath(); g.moveTo(e.ex - e.sw * 1.1, yb + 0.01); g.quadraticCurveTo(e.ex, yb - 0.03, e.ex + e.sw * 1.1, yb + 0.01); g.lineWidth = 0.035; g.strokeStyle = INK; g.stroke(); }
    if (ll > 0.01) { const yt = e.bottom - 2 * e.shh * ll; g.beginPath(); g.moveTo(e.ex - 1, e.bottom + 1); g.lineTo(e.ex - 1, yt + 0.04); g.quadraticCurveTo(e.ex, yt - 0.04, e.ex + 1, yt + 0.04); g.lineTo(e.ex + 1, e.bottom + 1); g.closePath(); g.fillStyle = skin; g.fill();
      g.beginPath(); g.moveTo(e.ex - e.sw * 1.1, yt + 0.035); g.quadraticCurveTo(e.ex, yt - 0.035, e.ex + e.sw * 1.1, yt + 0.035); g.lineWidth = 0.03; g.strokeStyle = INK; g.stroke(); }
    g.restore();
    if (P.eyeWhite > 0.05) { g.globalAlpha = P.eyeWhite; g.beginPath(); g.ellipse(e.ex, e.ey, e.sw, e.shh, 0, 0, 7); g.lineWidth = 0.035; g.strokeStyle = INK; g.stroke(); g.globalAlpha = 1; }
    if (P.cheek > 0.05) { g.globalAlpha = cl(P.cheek); g.beginPath(); g.arc(e.ex + e.s * 0.05, e.bottom + 0.16, 0.11, Math.PI * 1.15, Math.PI * 1.85); g.lineWidth = 0.025; g.strokeStyle = INK; g.stroke(); g.globalAlpha = 1; }
    if (P.shock > 0.05) { g.globalAlpha = cl(P.shock); g.lineWidth = 0.025; g.strokeStyle = INK; for (const k of [0, 1]) { g.beginPath(); g.arc(e.ex + e.s * (e.sw + 0.09 + k * 0.05), e.ey, 0.09, e.s > 0 ? -0.6 : Math.PI - 0.6, e.s > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); } g.globalAlpha = 1; }
  }
  if (P.wrinkleNose > 0.05) { g.globalAlpha = cl(P.wrinkleNose); g.lineWidth = 0.025; g.strokeStyle = INK; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(G.fx - 0.05, G.eyY + 0.12 + k * 0.04); g.quadraticCurveTo(G.fx, G.eyY + 0.1 + k * 0.04, G.fx + 0.05, G.eyY + 0.12 + k * 0.04); g.stroke(); } g.globalAlpha = 1; }
  if (P.worry > 0.05 && !(cfg.face || {}).wrinkles) { g.globalAlpha = cl(P.worry); g.lineWidth = 0.028; g.strokeStyle = INK; for (const k of [0, 1]) { g.beginPath(); g.moveTo(G.fx - 0.13, -0.47 + k * 0.07); g.quadraticCurveTo(G.fx, -0.52 + k * 0.07, G.fx + 0.13, -0.47 + k * 0.07); g.stroke(); } g.globalAlpha = 1; }
  // ---- mouth: one continuous shape (closed line <-> open mouth), curve/corners/upper lip/tremble/teeth/tongue
  const M = G.mouth, tr = P.tremble, ph = t * 17, wob = (i) => tr * 0.03 * Math.sin(ph + i * 1.7), cv = P.curve, W = M.W * (1 - 0.35 * P.round);
  const cL = M.my - cv * 0.07 + P.cornerL - P.upperLip * 0.05, cR = M.my - cv * 0.07 + P.cornerR, xL = M.mx - W, xR = M.mx + W, jaw = P.jaw * (1 + 0.06 * Math.sin(t * 29) * (P.round > 0.5 ? 1 : 0.3));
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (jaw < 0.06) {   // closed: curved / wobbly line
    g.beginPath(); g.moveTo(xL, cL); const n = 6; for (let i = 1; i <= n; i++) { const u = i / n, x = L(xL, xR, u), base = L(cL, cR, u) + cv * 0.17 * Math.sin(Math.PI * u) - P.upperLip * 0.05 * (1 - u) * Math.sin(Math.PI * u) * 2; g.lineTo(x, base + (i < n ? wob(i) * (i % 2 ? 1 : -1) : 0)); }
    g.lineWidth = 0.056; g.strokeStyle = INK; g.stroke();
  } else {   // open: upper lip curve + lower lip curve
    const up = (u) => L(cL, cR, u) + cv * 0.09 * Math.sin(Math.PI * u) - jaw * 0.06 * Math.sin(Math.PI * u) - P.upperLip * 0.07 * Math.max(0, 0.6 - u) - P.round * jaw * 0.06 * Math.sin(Math.PI * u);
    const lo = (u) => L(cL, cR, u) + (jaw * 0.32 + Math.max(0, cv) * 0.1 + Math.min(0, cv) * 0.02) * Math.sin(Math.PI * u) * (1 + P.round * 0.2) + wob(u * 6) * (u > 0.1 && u < 0.9 ? 1 : 0);
    const N = 14; g.beginPath(); g.moveTo(xL, cL); for (let i = 1; i <= N; i++) g.lineTo(L(xL, xR, i / N), up(i / N)); for (let i = N - 1; i >= 1; i--) g.lineTo(L(xL, xR, i / N), lo(i / N)); g.closePath();
    g.fillStyle = '#6e2228'; g.fill(); g.save(); g.clip();
    if (P.tongue > 0.05) { g.beginPath(); g.ellipse(M.mx, lo(0.5) - 0.02, W * 0.6, 0.06 + jaw * 0.08, 0, 0, 7); g.fillStyle = '#e07c84'; g.fill(); }
    if (P.teeth > 0.05) { g.globalAlpha = cl(P.teeth); g.beginPath(); g.moveTo(xL, cL - 0.05); for (let i = 0; i <= N; i++) g.lineTo(L(xL, xR, i / N), up(i / N) + 0.06); g.lineTo(xR, cR - 0.05); g.lineTo(xL, cL - 0.05); g.fillStyle = '#fff'; g.fill(); g.globalAlpha = 1; }
    g.restore(); g.beginPath(); g.moveTo(xL, cL); for (let i = 1; i <= N; i++) g.lineTo(L(xL, xR, i / N), up(i / N)); for (let i = N - 1; i >= 1; i--) g.lineTo(L(xL, xR, i / N), lo(i / N)); g.closePath(); g.lineWidth = 0.05; g.strokeStyle = INK; g.stroke();
  }
  return G;
}
// ---------------- body acting: hand presets + character secondary actions ----------------
export function handsFor(preset, K, t, opt = {}) {
  const sh = K.shoulders, hip = K.hipY, hc = K.headC, w = (sh[1][0] - sh[0][0]) / 2, mid = (sh[0][0] + sh[1][0]) / 2, osc = (a, f = 9) => Math.sin(t * f) * a;
  const P = { relaxed: [[sh[0][0] - 0.1, hip + 0.32], [sh[1][0] + 0.1, hip + 0.32]], limp: [[sh[0][0] + 0.05, hip + 0.45], [sh[1][0] - 0.05, hip + 0.45]],
    open: [[sh[0][0] - 0.45, hip - 0.1], [sh[1][0] + 0.45, hip - 0.1]], cheer: [[sh[0][0] - 0.5, hc[1] - 0.6 + osc(0.08, 12)], [sh[1][0] + 0.5, hc[1] - 0.6 - osc(0.08, 12)]],
    up: [[sh[0][0] - 0.62, sh[0][1] - 0.15], [sh[1][0] + 0.62, sh[1][1] - 0.15]], chest: [[mid - 0.18, sh[0][1] + 0.55 + osc(0.03, 25)], [mid + 0.18, sh[0][1] + 0.6 - osc(0.03, 25)]],
    chest1: [[mid + 0.05, sh[0][1] + 0.6], [sh[1][0] + 0.1, hip + 0.32]], face: [[hc[0] - 1.18, hc[1] + 0.3 + osc(0.02, 20)], [hc[0] + 1.18, hc[1] + 0.3 - osc(0.02, 20)]],   // hands beside the head, never over the face
    fists: [[sh[0][0] - 0.25, hip + 0.05], [sh[1][0] + 0.25, hip + 0.05]], scratch: [[sh[0][0] - 0.1, hip + 0.32], [hc[0] + 1.02, hc[1] - 0.62 + osc(0.06, 14)]],
    chin: [[mid - 0.05, sh[0][1] + 0.75], [hc[0] + 0.15, hc[1] + 0.95]], away: [[sh[0][0] - 0.1, hip + 0.3], [sh[1][0] + 0.6, sh[1][1] - 0.1]],
    crossed: [[mid + 0.3, sh[0][1] + 0.85], [mid - 0.3, sh[0][1] + 0.9]], fidget: [[mid - 0.08 + osc(0.04, 8), hip + 0.05], [mid + 0.08 - osc(0.04, 8), hip + 0.05]],
    wring: [[mid - 0.1 + osc(0.05, 7), sh[0][1] + 0.65], [mid + 0.1 - osc(0.05, 7), sh[0][1] + 0.68]] };
  if (preset === 'face' && K.C && K.C.headgear) preset = 'chest';   // helmets: hands to chest, never across the face
  return P[preset] || P.relaxed;
}
// character secondary actions (performance choices, configured per character, not hard-coded stereotypes)
export function applySecondary(action, K, hands, pose, t, k) {
  if (!action || k <= 0) return hands; const sh = K.shoulders, hip = K.hipY, mid = (sh[0][0] + sh[1][0]) / 2;
  const mixH = (h, target) => [L(h[0], target[0], k), L(h[1], target[1], k)];
  if (action === 'raise_shield') { hands[0] = mixH(hands[0], [sh[0][0] + 0.25, sh[0][1] + 0.6]); pose.propHand = 0; pose.armBend = [-1, pose.armBend?.[1] ?? 1]; }
  if (action === 'hand_on_sword') hands[1] = mixH(hands[1], [sh[1][0] + 0.18, hip - 0.15]);
  if (action === 'grip_cane') { hands[1] = [sh[1][0] + 0.45, hip + 0.25 + Math.sin(t * 25) * 0.02 * k]; pose.propHand = 1; }
  if (action === 'lower_head') { pose.headDy = (pose.headDy || 0) + 0.12 * k; }
  if (action === 'jump') pose.bob = (pose.bob || 0) + 0.45 * k * Math.max(0, Math.sin(t * 9));
  return hands; }
// ---------------- timeline API ----------------
// script: [{ emotion, intensity, at, transition, hold?, secondary? }]; returns { face, body, secondary, secK }
export function actingState(C, script, t) {
  let i = 0; while (i < script.length - 1 && t >= script[i + 1].at) i++; const cur = script[i], prev = script[Math.max(0, i - 1)];
  const sudden = (cur.transition ?? 0.4) <= 0.2, kRaw = rmp(t, cur.at, cur.at + (cur.transition ?? 0.4)), k = i === 0 ? 1 : sudden ? ob(kRaw, 1.8) : ss(kRaw);
  const fa = emotionParams(prev.emotion, prev.intensity), fb = emotionParams(cur.emotion, cur.intensity), face = mixParams(fa, fb, cl(k, 0, 1.25));
  const ba = bodyParams(prev.emotion, prev.intensity), bb = bodyParams(cur.emotion, cur.intensity), body = {}; for (const key in bb) body[key] = typeof bb[key] === 'number' ? L(ba[key] || 0, bb[key], cl(k, 0, 1.2)) : (k < 0.35 ? ba[key] : bb[key]);
  body.handsPrev = ba.hands; body.handsK = ss(cl(k)); body.handsCur = bb.hands;
  // anticipation before a sudden beat: squeeze + dip
  const nxt = script[i + 1]; if (nxt && (nxt.transition ?? 0.4) <= 0.2) { const a = Math.sin(Math.PI * rmp(t, nxt.at - 0.14, nxt.at)); face.lidUp = face.lidUp.map((v) => Math.min(1, v + 0.35 * a)); body.crouch = (body.crouch || 0) + 0.18 * a; body.shrug = (body.shrug || 0) - 0.1 * a; }
  const sec = cur.secondary ?? C.acting?.[cur.emotion]; const secPrev = prev.secondary ?? C.acting?.[prev.emotion];
  return { face, body, secondary: sec, secK: sec ? ss(cl(k)) * cl((cur.intensity - 0.3) / 0.4) : 0, secPrev, secPrevK: secPrev && secPrev !== sec ? 1 - ss(cl(k)) : 0 };
}
// Instruction API (owner brief): [{ character, emotion, intensity: 'subtle'|'clear'|'extreme'|0..1, transition_duration, hold_duration, secondary_action }]
// -> timed script for actingState(). Consecutive entries blend (e.g. curious -> suspicious -> surprised -> scared). Transitions <= 0.2 s get anticipation + overshoot.
export function scriptFromInstructions(list, start = 0) {
  let at = start; const out = [];
  for (const s of list) { const tr = s.transition_duration ?? 0.4, it = typeof s.intensity === 'string' ? INTENSITY[s.intensity] : (s.intensity ?? INTENSITY.clear);
    out.push({ character: s.character, emotion: s.emotion, intensity: it, at, transition: tr, secondary: s.secondary_action ?? undefined }); at += tr + (s.hold_duration ?? 1.0); }
  return out;
}

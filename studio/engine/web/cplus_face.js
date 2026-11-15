// C+ "Cinematic Expressive" face (original design, ported from studio/design/concept_cplus.html face()).
// Draws the front-view face onto a transparent canvas that is UV-mapped onto the 3D head's FaceShell (planar front projection).
// The 3D model supplies the nose, ears and head shading; this draws eyes (heavy upper lid, pupils, catch-lights), thick tapered
// brows, cheeks and the mouth library. Expressions are numeric so they can blend; blink and gaze are separate live controls.
export const INK = '#2a1b17';
const PAL = { white: '#fffaf2', hair: '#5a2f1a', mouth: '#7a2a26', tongue: '#e46a6a' }, OW = 7;
// open: lid opening per eye (1 = normal), pup: gaze [x,y] (-1..1), pr: pupil size, brow: raise (negative = up), tilt: degrees (+ = worried/inner-up),
// mouth: smile|grin|O|grimace|shout|smirk|flat|frown, mo: mouth size, cheek: blush 0..1, red: anger flush, happyEye: closed happy arcs
export const EXP = {
  neutral:    { open: [0.86, 0.86], pup: [0, 0], pr: 1, brow: [0, -4], tilt: [0, 2], mouth: 'smile', mo: 1, cheek: 0.4 },
  relaxed:    { open: [0.8, 0.8], pup: [0, 0], pr: 1, brow: [4, 2], tilt: [-2, 0], mouth: 'smile', mo: 0.9, cheek: 0.45 },
  curious:    { open: [0.92, 0.88], pup: [0, 0], pr: 0.95, brow: [-10, 0], tilt: [4, -4], mouth: 'flat', mo: 0.8, cheek: 0.35 },
  happy:      { open: [0.5, 0.5], happyEye: 1, pup: [0, 0], pr: 1, brow: [-10, -12], tilt: [-4, -6], mouth: 'grin', mo: 1, cheek: 1 },
  surprised:  { open: [1.2, 1.2], pup: [0, 0], pr: 0.6, brow: [-34, -36], tilt: [2, 2], mouth: 'O', mo: 1.15, cheek: 0.2 },
  scared:     { open: [1.08, 1.08], pup: [0.15, 0.1], pr: 0.55, brow: [-16, -18], tilt: [18, 18], mouth: 'grimace', mo: 1, cheek: 0 },
  concern:    { open: [1.0, 1.0], pup: [0, 0], pr: 0.75, brow: [-12, -14], tilt: [16, 16], mouth: 'frown', mo: 1, cheek: 0.15 },
  angry:      { open: [0.62, 0.62], pup: [0, 0.1], pr: 0.9, brow: [10, 10], tilt: [-24, -24], mouth: 'shout', mo: 1, cheek: 0.6, red: 1 },
  suspicious: { open: [0.36, 0.78], pup: [0.5, 0], pr: 0.85, brow: [10, -16], tilt: [-12, 8], mouth: 'smirk', mo: 1, cheek: 0.2 },
  squint:     { open: [0.55, 0.55], pup: [0, 0], pr: 1, brow: [10, 8], tilt: [-6, -6], mouth: 'flat', mo: 0.9, cheek: 0.3 },
};
const L = (a, b, k) => a + (b - a) * k, LA = (a, b, k) => a.map((v, i) => L(v, b[i], k));
// blend two expressions (numbers interpolate; the mouth shape switches at the midpoint, its size dips through the switch)
export function blendExp(A, B, k) {
  if (typeof A === 'string') A = EXP[A]; if (typeof B === 'string') B = EXP[B]; if (k <= 0) return { ...A }; if (k >= 1) return { ...B };
  const mouth = k < 0.5 ? A.mouth : B.mouth, dip = 1 - 0.35 * Math.sin(k * Math.PI);
  return { open: LA(A.open, B.open, k), pup: LA(A.pup, B.pup, k), pr: L(A.pr, B.pr, k), brow: LA(A.brow, B.brow, k), tilt: LA(A.tilt, B.tilt, k), mouth,
    mo: (k < 0.5 ? (A.mo ?? 1) : (B.mo ?? 1)) * dip, cheek: L(A.cheek || 0, B.cheek || 0, k), red: L(A.red || 0, B.red || 0, k), happyEye: (k < 0.5 ? A.happyEye : B.happyEye) || 0 };
}
// draw the face. g: 2D context of a square canvas (N px covering +-S metres of the head front), X: expression,
// live: { blink 0..1, gaze [x,y] added to the expression's pupils }
export function drawCPlusFace(g, X, live = {}, o = {}) {
  const N = g.canvas.width, k = (o.headR || 0.226) / (o.S || 0.25) * N / 2 / 102;   // concept units: head radius r = 102
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, N, N); g.setTransform(k, 0, 0, k, N / 2, N / 2);
  const r = 102, cx = 0, cy = 0, blink = live.blink || 0, gaze = live.gaze || [0, 0];
  const ink = (w = OW) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = g.lineCap = 'round'; g.stroke(); };
  const fill = (col, w = OW) => { g.fillStyle = col; g.fill(); if (w) ink(w); };
  const E = (x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); };
  if (X.red) { g.save(); g.globalAlpha = 0.22 * X.red; E(cx, cy + r * 0.12, r * 0.72, r * 0.5); g.fillStyle = '#e04030'; g.fill(); g.restore(); }
  const V2 = o.style === 'v2', ES = V2 ? 0.8 : 1, LID = V2 ? OW + 1 : OW + 3, sp = (V2 ? 0.33 : 0.37) * r;   // v2: smaller eyes, crisper lids (Visual standard v2)
  for (const [s, i] of [[-1, 0], [1, 1]]) {
    const ex = cx + s * sp, ey = cy + r * 0.1, rx = 0.25 * r * ES, o0 = X.open[i], o = o0 * (1 - blink), ry = 0.3 * r * ES * Math.max(0.1, o);
    if (X.happyEye && blink < 0.5) { g.beginPath(); g.moveTo(ex - rx, ey + ry * 0.4); g.quadraticCurveTo(ex, ey - ry * 2.2, ex + rx, ey + ry * 0.4); ink(OW + 1); }
    else if (o < 0.16) { g.beginPath(); g.moveTo(ex - rx * 1.05, ey); g.quadraticCurveTo(ex, ey + r * 0.07, ex + rx * 1.05, ey); ink(LID); }   // closed lid
    else { const pupX = (X.pup[0] + gaze[0]), pupY = (X.pup[1] + gaze[1]);
      g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, 7); fill(PAL.white, 5); g.save(); g.clip(); const pr = 0.13 * r * X.pr, px = ex + pupX * rx * 0.55, py = ey + pupY * ry * 0.5;
      E(px, py, pr, pr); g.fillStyle = INK; g.fill(); E(px - pr * 0.35, py - pr * 0.4, pr * 0.32, pr * 0.32); g.fillStyle = '#fff'; g.fill();
      if (blink > 0.02) { g.beginPath(); g.rect(ex - rx * 1.2, ey - 0.3 * r * o0 * 1.1, rx * 2.4, 0.6 * r * o0 * blink * 1.1); g.fillStyle = '#e9ad86'; g.fill(); }   // lid sweeping down
      g.restore(); g.beginPath(); g.ellipse(ex, ey, rx * 1.03, ry * 1.03, 0, Math.PI * 1.05, Math.PI * 1.95); ink(LID); }   // upper lid
    // thick tapered brow (sits just under the helmet brim)
    const by = Math.max(-0.37 * r, ey - (V2 ? 0.36 : 0.43) * r - (o0 > 1 ? (o0 - 1) * r * 0.45 : 0) + X.brow[i] * r / 150),   // clamped: stays visible under the helmet brim
      tilt = X.tilt[i] * Math.PI / 180 * s, bw = (V2 ? 0.17 : 0.21) * r;
    g.save(); g.translate(ex + s * 0.02 * r, by); g.rotate(tilt); if (s > 0) g.scale(-1, 1);
    if (V2) { g.beginPath(); g.moveTo(-bw, 6); g.quadraticCurveTo(0, -bw * 0.62, bw * 1.1, 0); g.quadraticCurveTo(0, -bw * 0.18, -bw, 6); g.closePath(); g.fillStyle = o.browCol || INK; g.fill(); g.restore(); }
    else { g.beginPath(); g.moveTo(-bw, 8); g.quadraticCurveTo(-bw * 0.1, -bw * 0.8, bw * 1.15, -3); g.quadraticCurveTo(bw * 0.1, -bw * 0.12, -bw, 8); g.closePath(); g.fillStyle = o.browCol || PAL.hair; g.fill(); ink(5); g.restore(); } }
  for (const s of [-1, 1]) { E(cx + s * r * 0.54, cy + r * 0.46, r * 0.15, r * 0.09); g.fillStyle = `rgba(232,104,96,${0.25 + 0.4 * (X.cheek || 0)})`; g.fill(); }
  // 1620s moustache (o.stache): two curled strokes above the mouth
  if (o.stache) { for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 4, cy + r * 0.52); g.quadraticCurveTo(cx + s * r * 0.2, cy + r * 0.47, cx + s * r * 0.3, cy + r * 0.55); g.quadraticCurveTo(cx + s * r * 0.36, cy + r * 0.6, cx + s * r * 0.33, cy + r * 0.48);
    g.lineWidth = 9; g.strokeStyle = o.browCol || PAL.hair; g.lineCap = 'round'; g.stroke(); } }
  // mouth library
  const mx = cx + (X.mouth === 'smirk' ? r * 0.04 : 0), my = cy + r * (V2 ? 0.62 : 0.66), mw = (V2 ? 0.38 : 0.46) * r * (X.mo ?? 1); g.beginPath();
  if (X.mouth === 'smile') { g.moveTo(mx - mw * 0.5, my - 2); g.quadraticCurveTo(mx + mw * 0.05, my + mw * 0.32, mx + mw * 0.55, my - 6); ink(OW); }
  else if (X.mouth === 'flat') { g.moveTo(mx - mw * 0.36, my + 2); g.quadraticCurveTo(mx, my + mw * 0.08, mx + mw * 0.38, my); ink(OW); }
  else if (X.mouth === 'frown') { g.moveTo(mx - mw * 0.4, my + 8); g.quadraticCurveTo(mx, my - mw * 0.16, mx + mw * 0.4, my + 8); ink(OW); }
  else if (X.mouth === 'grin') { g.moveTo(mx - mw * 0.75, my - 6); g.quadraticCurveTo(mx, my + mw * 1.1, mx + mw * 0.75, my - 6); g.closePath(); fill(PAL.mouth, OW); g.save(); g.clip(); E(mx, my + mw * 0.6, mw * 0.36, mw * 0.24); g.fillStyle = PAL.tongue; g.fill(); g.fillStyle = PAL.white; g.fillRect(mx - mw, my - 8, mw * 2, mw * 0.2); g.restore(); }
  else if (X.mouth === 'O') { E(mx, my + mw * 0.15, mw * 0.3, mw * 0.44); fill(PAL.mouth, OW); g.save(); g.clip(); E(mx, my + mw * 0.45, mw * 0.24, mw * 0.18); g.fillStyle = PAL.tongue; g.fill(); g.restore(); }
  else if (X.mouth === 'grimace') { const w = mw * 0.72; g.moveTo(mx - w, my); g.quadraticCurveTo(mx - w * 0.5, my - 12, mx, my - 3); g.quadraticCurveTo(mx + w * 0.5, my - 14, mx + w, my); g.quadraticCurveTo(mx, my + mw * 0.42, mx - w, my); fill(PAL.white, OW);
    g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(mx + i * w * 0.33, my - 9); g.lineTo(mx + i * w * 0.33, my + mw * 0.18); } g.moveTo(mx - w * 0.9, my + 4); g.lineTo(mx + w * 0.9, my + 4); ink(3); }
  else if (X.mouth === 'shout') { g.moveTo(mx - mw * 0.62, my + 2); g.quadraticCurveTo(mx, my - mw * 0.35, mx + mw * 0.62, my + 2); g.quadraticCurveTo(mx, my + mw * 0.75, mx - mw * 0.62, my + 2); fill(PAL.mouth, OW); g.save(); g.clip(); g.fillStyle = PAL.white; g.fillRect(mx - mw, my - mw * 0.2, mw * 2, mw * 0.2); g.restore(); }
  else if (X.mouth === 'smirk') { g.moveTo(mx - mw * 0.45, my + 4); g.quadraticCurveTo(mx + mw * 0.1, my + 9, mx + mw * 0.52, my - mw * 0.2); ink(OW); }
  g.setTransform(1, 0, 0, 1, 0, 0);
}

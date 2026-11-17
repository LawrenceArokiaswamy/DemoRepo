// STYLE LAB (isolated visual-direction experiment, 2026-11-17). Original studio character design "Theo, new look", shared by
// Style B (flat 2D stick figure, canvas) and Style C (2.5D puppet, three.js face decal). Nothing here is used by the production pipeline.
// Design: an egg head, wider at the crown, with one signature ink-curl of hair (the studio silhouette mark); big oval eyes with
// heavy upper lids; thick tapered brows; a small expressive mouth; ink #1b1622.
export const INK = '#1b1622', SKIN = '#f3d6b8', HAIR = '#3a2418';
// expression presets: open (eye height 0-1.3), lid (upper-lid droop 0-1), pup [x,y] (-1..1), brow [angle, raise] per side, mouth, mo (size)
export const EXPR = {
  tired:   { open: 0.72, lid: 0.45, pup: [0, 0.55], brow: [[0.05, 0], [-0.05, 0]], mouth: 'flat', mo: 0.8, blush: 0.15 },
  frown:   { open: 0.8, lid: 0.25, pup: [0, 0.6], brow: [[0.32, -0.15], [-0.32, -0.15]], mouth: 'frown', mo: 0.8, blush: 0.1 },
  shock:   { open: 1.22, lid: 0, pup: [0, 0.35], brow: [[-0.18, 0.55], [0.18, 0.55]], mouth: 'o', mo: 0.9, blush: 0 },
  dread:   { open: 1.12, lid: 0, pup: [-0.85, 0.05], brow: [[-0.28, 0.42], [0.1, 0.5]], mouth: 'grimace', mo: 0.7, blush: 0 },
};
export const lerpExpr = (a, b, k) => { const L = (x, y) => x + (y - x) * k; return { open: L(a.open, b.open), lid: L(a.lid, b.lid), pup: [L(a.pup[0], b.pup[0]), L(a.pup[1], b.pup[1])],
  brow: [0, 1].map((i) => [L(a.brow[i][0], b.brow[i][0]), L(a.brow[i][1], b.brow[i][1])]), mouth: k < 0.5 ? a.mouth : b.mouth, mo: L(a.mo, b.mo) * (1 - 0.5 * Math.sin(Math.PI * k)), blush: L(a.blush, b.blush) }; };
// the egg head outline (unit size: height 1, centre 0,0); used by B for the head shape and silhouette
export function headPath(g, cx, cy, s, tilt = 0) {
  g.save(); g.translate(cx, cy); g.rotate(tilt); g.beginPath();
  g.moveTo(0, -0.52 * s); g.bezierCurveTo(0.42 * s, -0.54 * s, 0.56 * s, -0.12 * s, 0.5 * s, 0.14 * s); g.bezierCurveTo(0.44 * s, 0.42 * s, 0.2 * s, 0.5 * s, 0, 0.5 * s);
  g.bezierCurveTo(-0.2 * s, 0.5 * s, -0.44 * s, 0.42 * s, -0.5 * s, 0.14 * s); g.bezierCurveTo(-0.56 * s, -0.12 * s, -0.42 * s, -0.54 * s, 0, -0.52 * s); g.closePath(); g.restore();
}
// hair: a short wavy fringe clipped to the head + the signature ink curl rising from the crown (the studio silhouette mark)
export function hairCurl(g, cx, cy, s, tilt = 0, col = HAIR) {
  g.save(); g.translate(cx, cy); g.rotate(tilt);
  g.save(); headPath(g, 0, 0, s, 0); g.clip(); g.beginPath(); g.moveTo(-0.6 * s, -0.7 * s); g.lineTo(0.6 * s, -0.7 * s); g.lineTo(0.6 * s, -0.2 * s);
  g.quadraticCurveTo(0.42 * s, -0.31 * s, 0.3 * s, -0.26 * s); g.quadraticCurveTo(0.18 * s, -0.39 * s, 0.02 * s, -0.28 * s); g.quadraticCurveTo(-0.14 * s, -0.39 * s, -0.3 * s, -0.25 * s); g.quadraticCurveTo(-0.46 * s, -0.33 * s, -0.6 * s, -0.17 * s); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 0.02 * s; g.strokeStyle = INK; g.stroke(); g.restore();
  g.beginPath(); g.moveTo(-0.03 * s, -0.49 * s); g.bezierCurveTo(-0.06 * s, -0.72 * s, 0.2 * s, -0.8 * s, 0.25 * s, -0.66 * s); g.bezierCurveTo(0.28 * s, -0.55 * s, 0.14 * s, -0.53 * s, 0.13 * s, -0.61 * s);
  g.lineCap = 'round'; g.lineWidth = 0.07 * s; g.strokeStyle = INK; g.stroke(); g.lineWidth = 0.038 * s; g.strokeStyle = col; g.stroke(); g.restore();
}
// the face features only (transparent background), centred on cx,cy for a head of size s; yaw shifts features sideways (head turn)
export function drawFeatures(g, cx, cy, s, E, o = {}) {
  const yaw = o.yaw || 0, fx = cx + yaw * 0.16 * s, ink = o.ink || INK, glow = o.eyeGlow || 0;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const ex = fx + side * 0.17 * s * (1 - 0.25 * Math.abs(yaw)) , ey = cy + 0.02 * s, rw = 0.1 * s, rh = 0.135 * s * E.open;
    // eye white + ink rim
    g.beginPath(); g.ellipse(ex, ey, rw, Math.max(0.01 * s, rh), 0, 0, Math.PI * 2); g.fillStyle = glow ? `rgba(255,255,255,1)` : '#fbf8f2'; g.fill(); g.lineWidth = 0.022 * s; g.strokeStyle = ink; g.stroke();
    // pupil + highlight (clipped to the eye)
    g.save(); g.beginPath(); g.ellipse(ex, ey, rw, Math.max(0.01 * s, rh), 0, 0, Math.PI * 2); g.clip();
    const px = ex + E.pup[0] * rw * 0.55, py = ey + E.pup[1] * rh * 0.5, pr = 0.06 * s * (E.open > 1.1 ? 0.78 : 1);
    g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fillStyle = ink; g.fill(); g.beginPath(); g.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
    // heavy upper lid (droops down over the eye)
    if (E.lid > 0.01) { g.beginPath(); g.rect(ex - rw * 1.2, ey - rh * 1.2, rw * 2.4, rh * 1.2 * E.lid + rh * 0.15); g.fillStyle = o.skin || SKIN; g.fill(); g.beginPath(); g.moveTo(ex - rw, ey - rh * 1.2 + rh * 1.2 * E.lid + rh * 0.15); g.lineTo(ex + rw, ey - rh * 1.2 + rh * 1.2 * E.lid + rh * 0.15); g.lineWidth = 0.022 * s; g.strokeStyle = ink; g.stroke(); }
    g.restore();
    // brow: thick tapered stroke; angle tilts inner end, raise lifts it
    const [ang, raise] = E.brow[side < 0 ? 0 : 1], by = ey - 0.2 * s - raise * 0.07 * s, bw = 0.12 * s;
    g.save(); g.translate(ex, by); g.rotate(side * ang); g.beginPath(); g.moveTo(-bw, 0.012 * s); g.quadraticCurveTo(0, -0.03 * s, bw, 0.012 * s); g.quadraticCurveTo(0, -0.0 * s, -bw, 0.012 * s);
    g.lineWidth = 0.04 * s; g.strokeStyle = ink; g.stroke(); g.restore();
  }
  // blush
  if (E.blush > 0.02) for (const side of [-1, 1]) { g.beginPath(); g.ellipse(fx + side * 0.25 * s, cy + 0.17 * s, 0.06 * s, 0.03 * s, 0, 0, Math.PI * 2); g.fillStyle = `rgba(232,120,110,${0.5 * E.blush})`; g.fill(); }
  // mouth
  const mx = fx, my = cy + 0.3 * s, m = E.mo * s; g.lineWidth = 0.022 * s; g.strokeStyle = ink;
  g.beginPath();
  if (E.mouth === 'o') { g.ellipse(mx, my, 0.035 * m, 0.05 * m, 0, 0, Math.PI * 2); g.fillStyle = '#4a1f24'; g.fill(); g.stroke(); }
  else if (E.mouth === 'frown') { g.moveTo(mx - 0.06 * m, my + 0.015 * m); g.quadraticCurveTo(mx, my - 0.02 * m, mx + 0.06 * m, my + 0.015 * m); g.stroke(); }
  else if (E.mouth === 'grimace') { g.moveTo(mx - 0.07 * m, my); g.quadraticCurveTo(mx - 0.035 * m, my - 0.02 * m, mx, my); g.quadraticCurveTo(mx + 0.035 * m, my + 0.02 * m, mx + 0.07 * m, my); g.stroke(); }
  else { g.moveTo(mx - 0.05 * m, my); g.lineTo(mx + 0.05 * m, my); g.stroke(); }
  g.restore();
}

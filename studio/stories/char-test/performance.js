// C+ acting test performance (6.6 s): relaxed -> blink + glance -> head, then shoulders, then body turn -> anticipation + surprise take
// -> wind-up + point at the unseen event (his right-front, up) -> looks back to camera with concern, settles while still pointing.
// Pose-to-pose eased targets (channel) feed a deterministic spring bank: lag, overshoot and settle come from per-part stiffness
// (head fastest, hips slowest = overlapping action); crest and cape are secondary springs dragging behind head / chest (follow-through).
// Axes (character's own): x = pitch (+ forward / down), y = yaw (+ to his left), z = roll (+ tilts to his right; + raises the LEFT arm sideways).
export function makePerformance(CP) {
  const { channel, springBank, blinkAt, blendExp, EXP, ease } = CP;
  const Z = [0, 0, 0];
  const K = {   // [t, [x,y,z], dur, ease]
    hips:  [[0, [0, 0, 0.03]], [1.95, [0, -0.12, 0.0], 0.5], [2.15, [0.0, -0.3, -0.02], 0.45], [2.5, [0.05, -0.3, 0], 0.16], [2.68, [-0.06, -0.3, 0], 0.1], [3.0, [0, -0.3, 0], 0.4], [3.32, [0.02, -0.32, 0], 0.18], [3.52, [-0.02, -0.34, 0.01], 0.14], [4.5, [0, -0.3, 0.02], 0.6]],
    chest: [[0, [0.02, 0, -0.02]], [1.85, [0.02, -0.22, -0.02], 0.45], [2.5, [0.12, -0.22, 0], 0.16], [2.68, [-0.2, -0.22, 0], 0.1], [3.0, [-0.08, -0.22, 0], 0.35], [3.3, [-0.02, -0.12, 0.04], 0.2], [3.5, [-0.06, -0.3, -0.05], 0.15], [4.4, [-0.02, -0.1, -0.02], 0.5]],
    neck:  [[0, [0, 0, 0]], [1.55, [0.06, 0.06, 0], 0.15], [1.7, [-0.06, -0.14, 0], 0.32], [2.5, [0.08, -0.14, 0], 0.16], [2.68, [-0.12, -0.14, 0], 0.1], [3.2, [-0.06, -0.12, 0], 0.4], [4.33, [0, 0.06, 0.02], 0.45]],
    head:  [[0, [0.02, 0.0, 0.05]], [1.0, [0.02, -0.06, 0.03], 0.25], [1.55, [0.1, 0.08, 0.02], 0.15], [1.7, [-0.22, -0.38, -0.04], 0.34], [2.5, [0.12, -0.36, 0], 0.16], [2.68, [-0.26, -0.36, 0.0], 0.1], [3.3, [-0.18, -0.3, 0.02], 0.3], [4.33, [0.03, 0.34, 0.1], 0.42], [5.5, [0.06, 0.3, 0.13], 0.8]],
    upperarmL: [[0, [-0.05, 0, -0.04]], [2.5, [0.1, 0, 0.06], 0.16], [2.68, [-0.62, 0, 0.62], 0.12], [3.45, [-0.3, 0, 0.28], 0.35], [4.6, [-0.12, 0, 0.1], 0.7]],
    forearmL:  [[0, [-0.18, 0, 0]], [2.5, [-0.3, 0, 0], 0.16], [2.68, [-1.3, 0, 0], 0.12], [3.45, [-1.1, 0, 0], 0.35], [4.6, [-0.55, 0, 0], 0.7]],
    handL:     [[0, Z], [2.68, [-0.3, 0, 0.2], 0.12], [3.45, [0, 0, 0], 0.4]],
    upperarmR: [[0, [-0.05, 0, 0.04]], [2.5, [0.1, 0, -0.06], 0.16], [2.68, [-0.55, 0, -0.55], 0.12], [3.25, [0.3, 0, -0.18], 0.22], [3.48, [-2.05, -0.42, -0.1], 0.2, 'out'], [5.1, [-1.75, -0.36, -0.12], 0.9]],
    forearmR:  [[0, [-0.18, 0, 0]], [2.5, [-0.3, 0, 0], 0.16], [2.68, [-1.25, 0, 0], 0.12], [3.25, [-1.15, 0, 0], 0.22], [3.48, [-0.08, 0, 0], 0.2, 'out'], [5.1, [-0.25, 0, 0], 0.9]],
    handR:     [[0, Z], [2.68, [-0.3, 0, -0.2], 0.12], [3.25, [0.2, 0, 0], 0.2], [3.5, [-0.12, 0, 0], 0.2]],
    thighL: [[0, [0, 0, 0.02]], [2.5, [-0.16, 0, 0], 0.16], [2.68, [0.02, 0, 0], 0.12]],
    shinL:  [[0, Z], [2.5, [0.3, 0, 0], 0.16], [2.68, [0.0, 0, 0], 0.12]],
    thighR: [[0, [0, 0, -0.02]], [2.12, [-0.38, 0.1, 0], 0.16], [2.3, [0, 0, 0], 0.2], [2.5, [-0.16, 0, 0], 0.16], [2.68, [0.02, 0, 0], 0.12]],
    shinR:  [[0, Z], [2.12, [0.55, 0, 0], 0.16], [2.3, [0, 0, 0], 0.2], [2.5, [0.3, 0, 0], 0.16], [2.68, [0.0, 0, 0], 0.12]],
    hipsPos: [[0, [0, 0, 0]], [2.12, [0, 0.012, 0], 0.16], [2.3, [0, 0, 0], 0.2], [2.5, [0, -0.03, 0.01], 0.16], [2.68, [0, 0.02, -0.02], 0.1], [3.0, [0, 0, 0], 0.4]],
    sq: [[0, [0]], [2.5, [-0.035], 0.16], [2.68, [0.05], 0.08], [2.85, [0], 0.25]],
    gaze: [[0, [0, 0]], [1.0, [-0.85, -0.15], 0.06], [2.05, [-0.35, -0.1], 0.2], [2.68, [-0.15, -0.3], 0.06], [3.5, [-0.35, -0.15], 0.08], [4.25, [0.85, 0.0], 0.07], [4.75, [0.1, 0.0], 0.3]],
  };
  const SPR = { head: [3.4, 0.6], neck: [3.0, 0.68], chest: [2.3, 0.7], hips: [1.8, 0.82], upperarmL: [2.7, 0.55], upperarmR: [2.6, 0.5], forearmL: [3.0, 0.5], forearmR: [3.0, 0.48],
    handL: [3.6, 0.45], handR: [3.6, 0.45], thighL: [3.4, 0.8], shinL: [3.4, 0.8], thighR: [3.4, 0.8], shinR: [3.4, 0.8], hipsPos: [3.2, 0.6], sq: [4.2, 0.38], gaze: [9, 0.9] };
  const spec = {}; for (const [k, keys] of Object.entries(K)) spec[k] = { target: channel(keys), f: SPR[k][0], z: SPR[k][1] };
  const run = springBank(spec, { crest: { src: 'head', f: 2.4, z: 0.22, gain: 1.15 }, cape1: { src: 'chest', f: 1.7, z: 0.3, gain: 1.3 }, cape2: { src: 'cape1', f: 2.2, z: 0.3, gain: 0.9 } });
  // expressions: [t, name, blend duration]
  const EXPR = [[0, 'relaxed', 0], [1.02, 'curious', 0.18], [2.5, 'squint', 0.12], [2.68, 'surprised', 0.08], [4.3, 'concern', 0.35]];
  const exprAt = (t) => { let X = EXP[EXPR[0][1]]; for (let i = 1; i < EXPR.length; i++) { const [t0, n, d] = EXPR[i]; if (t < t0) break; X = blendExp(X, EXP[n], ease.ss(Math.min(1, (t - t0) / d))); } return X; };
  const BLINKS = [0.55, 1.72, 3.18, 4.31, 5.45];
  return (t) => {
    const s = run(t), br = Math.sin(t * 2 * Math.PI * 0.28), sway = Math.sin(t * 2 * Math.PI * 0.17 + 1.1);
    const ch = s.chest, add = (a, b) => a.map((v, i) => v + (b[i] || 0));
    const bones = {
      hips: s.hips, spine: ch.map((v) => v * 0.45), chest: add(ch.map((v) => v * 0.55), [br * 0.012, 0, sway * 0.006]), neck: s.neck, head: add(s.head, [0, sway * 0.012, 0]),
      crest: s.crest, cape1: add(s.cape1, [0.04 + br * 0.01, 0, 0]), cape2: s.cape2,
      upperarmL: add(s.upperarmL, [br * -0.01, 0, 0]), forearmL: s.forearmL, handL: s.handL, upperarmR: add(s.upperarmR, [br * -0.01, 0, 0]), forearmR: s.forearmR, handR: s.handR,
      thighL: s.thighL, shinL: s.shinL, thighR: s.thighR, shinR: s.shinR,
    };
    const ex = exprAt(t);
    return { bones, offset: { hips: add(s.hipsPos, [0, br * 0.003, 0]) }, squash: s.sq[0], face: ex, blink: blinkAt(t, BLINKS), gaze: s.gaze, hand: t > 3.52 ? 'point' : 'relaxed' };
  };
}

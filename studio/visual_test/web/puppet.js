// 2D cut-out puppet (original code). Illustrated parts + expression heads, rigged with joint anchors measured from the art.
// pose: { head, headPrev, headK (0..1 crossfade), headRot, near:[shoulder,elbow], far:[shoulder,elbow], nearHand, farHand,
//         legs:[near,far], lean (deg, about the feet), squash (+ flattens / - stretches), bob (px), bodyRot (deg, about the hips) }
const HEADS = ['neutral', 'curious', 'disbelief', 'laugh', 'shock', 'fear', 'blink', 'talk'];
const PARTS = ['part_0', 'part_1', 'part_2', 'part_3', 'part_4', 'part_5', 'part_6', 'part_7', 'part_8'];
export const HANDS = { open: 'part_3', point: 'part_4', fist: 'part_5', spread: 'part_6' };
export const CW = 1400, CH = 2400; // design canvas; feet rest near y = 2320

export async function loadPuppet(base = './char/') {
  const load = (n) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `${base}${n}.png`; });
  const J = await (await fetch(base + 'joints.json')).json(), R = await (await fetch(base + 'rig.json')).json();
  const img = {}; for (const n of [...PARTS, ...HEADS.map((h) => 'head_' + h)]) img[n] = await load(n);
  return { J, R, img };
}

const D2R = Math.PI / 180;
function place(g, im, anchor, x, y, s, rotDeg, alpha = 1, sx = 1, sy = 1) {
  const w = im.width * s * sx, h = im.height * s * sy;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.rotate(-rotDeg * D2R); g.drawImage(im, -anchor[0] * w, -anchor[1] * h, w, h); g.restore();
}
function limbEnd(x, y, top, bot, im, s, rotDeg) {
  const dx = (bot[0] - top[0]) * im.width * s, dy = (bot[1] - top[1]) * im.height * s, r = -rotDeg * D2R;
  return [x + dx * Math.cos(r) - dy * Math.sin(r), y + dx * Math.sin(r) + dy * Math.cos(r)];
}

export function drawPuppet(g, P, pose) {
  const { J, R, img } = P, T = img.part_0, ts = R.torso_scale, tw = T.width * ts, th = T.height * ts;
  const sq = pose.squash || 0, bob = pose.bob || 0;
  g.save();
  // whole-body lean / squash about the feet
  g.translate(CW / 2, 2320); g.rotate(-(pose.lean || 0) * D2R); g.scale(1 + sq * 0.1, 1 - sq * 0.1); g.translate(-CW / 2, -2320);
  const top = 560 + bob, tx = CW / 2 - tw / 2, tp = (u, v) => [tx + u * tw, top + v * th];
  // legs (behind everything), slightly stretched vertically to restore the design's leg length
  const hipN = tp(...R.hip_near), hipF = tp(...R.hip_far), lg = pose.legs || [0, 0];
  place(g, img.part_8, J.part_8.top, hipF[0], hipF[1], R.leg_scale * 0.92, lg[1], 1, 1, 1.12);
  place(g, img.part_7, J.part_7.top, hipN[0], hipN[1], R.leg_scale * 0.92, lg[0], 1, 1, 1.12);
  // upper body rotates about the hips
  const hips = tp(0.5, 0.55); g.save(); g.translate(...hips); g.rotate(-(pose.bodyRot || 0) * D2R); g.translate(-hips[0], -hips[1]);
  const arm = (side, up, handKey, angs) => { const sh = tp(...R['shoulder_' + side]), U = img[up], F = img[HANDS[handKey || 'open']], fk = HANDS[handKey || 'open'];
    const el = limbEnd(sh[0], sh[1], J[up].top, J[up].bot, U, R.upper_scale, angs[0]);
    place(g, F, J[fk].top, el[0], el[1], R.fore_scale, angs[0] + angs[1]); place(g, U, J[up].top, sh[0], sh[1], R.upper_scale, angs[0]); };
  arm('far', 'part_2', pose.farHand, pose.far || [0, 0]);
  place(g, T, [0.5, 0], CW / 2, top, ts, 0);
  // head: crossfade between expressions, rotate about the collar
  const col = tp(...R.collar), hr = pose.headRot || 0, k = pose.headK ?? 1;
  place(g, img['head_' + pose.head], J['head_' + pose.head].collar, col[0], col[1], R.head_scale * (pose.headScale || 1), hr);   // hard swap (no see-through crossfade)
  arm('near', 'part_1', pose.nearHand, pose.near || [0, 0]);
  // shoulder patch: redraw the torso's own shoulder over the sleeve's open top end so the joint never shows
  { const sp = tp(...R.shoulder_near); g.save(); g.beginPath(); g.ellipse(sp[0] + tw * 0.02, sp[1] - th * 0.005, tw * 0.1, th * 0.05, 0, 0, Math.PI * 2); g.clip(); place(g, T, [0.5, 0], CW / 2, top, ts, 0); g.restore(); }
  g.restore(); g.restore();
}

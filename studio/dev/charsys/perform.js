// perform.js: shared "actor" helpers for any renderer that draws charsys characters (sheets, 3D-world cards, compositing).
// loadChar(id) -> character with build + motion resolved; stateAt(C, script, t) -> acting state with per-step hand overrides;
// poseFrom(C, st, t, view) -> full pose (face rig, body acting, hands, secondaries); blinkAt(seed, t) natural blinks.
import { BUILDS, MOTION, skeleton } from './charsys.js';
import { actingState, handsFor, applySecondary } from './face_rig.js';
const L = (a, b, k) => a + (b - a) * k, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
export async function loadChar(id, base = '/dev/charsys/library') {
  const J = await (await fetch(`${base}/${id}/character.json`)).json();
  return { ...J, body: { ...BUILDS[J.build], ...(J.body_overrides || {}) }, motionP: MOTION[J.motion] };
}
// script steps: { emotion, intensity, at, transition, hands?, look?, crouch?, secondary? }
export function stateAt(C, script, t) {
  const st = actingState(C, script, t); let i = 0; while (i < script.length - 1 && t >= script[i + 1].at) i++;
  const cur = script[i], prev = script[Math.max(0, i - 1)], k = ss((t - cur.at) / Math.max(0.05, cur.transition ?? 0.4));
  if (cur.hands || prev.hands) { st.body.handsPrev = prev.hands ?? st.body.handsPrev; st.body.handsCur = cur.hands ?? st.body.handsCur; st.body.handsK = i === 0 ? 1 : k; }
  for (const key of ['crouch', 'lean', 'shrug']) if (cur[key] !== undefined || prev[key] !== undefined) st.body[key] = L(prev[key] ?? st.body[key] ?? 0, cur[key] ?? st.body[key] ?? 0, i === 0 ? 1 : k);
  st.lookStep = cur.look !== undefined ? cur.look : null; st.step = cur; return st;
}
export function blinkAt(seed, t) { let s = seed * 9.73; for (let b = 0.4 + (seed % 7) * 0.31; b < t + 1; b += 2.2 + ((Math.sin(s += 1.7) + 1) * 1.6)) if (t > b && t < b + 0.12) return 1; return 0; }
export function poseFrom(C, st, t, view = {}) {
  const { yaw = 0, dir = 1, back = false, blink = 0 } = view, b = st.body, M = C.motionP, trem = Math.sin(t * 27) * 0.012 * (b.tremor || 0) * (0.4 + M.tremor);
  const p = { yaw, dir, back, breath: Math.sin(t * M.breathRate * (b.exhale ? 0.6 : 1)) * M.breathAmp * (1 + (b.exhale || 0)), shrug: (b.shrug || 0) * M.shrug, lean: (b.lean || 0) * (0.6 + 0.4 * M.recoil) + trem, hunch: b.slump || 0, crouch: b.crouch || 0,
    bob: (b.bob || 0) * (1 + M.bounce) * Math.max(0, Math.sin(t * 8)) * (b.bob > 0.1 ? 1 : 0.4), headDy: b.headDy || 0, headDx: trem * 1.5, face: { rig: st.face, yawH: back ? 0 : yaw, tilt: b.tilt || 0, blink } };
  const K = skeleton(C, p), hA = handsFor(b.handsPrev ?? b.hands, K, t), hB = handsFor(b.handsCur ?? b.hands, K, t), k = b.handsK ?? 1;
  let hands = [0, 1].map((i) => [L(hA[i][0], hB[i][0], k), L(hA[i][1], hB[i][1], k)]);
  if (C.prop === 'cane') { hands[1] = [K.shoulders[1][0] + 0.45, K.hipY + 0.25]; p.propHand = 1; }
  if (st.secPrev && st.secPrevK > 0) hands = applySecondary(st.secPrev, K, hands, p, t, st.secPrevK);
  if (st.secondary && st.secK > 0) hands = applySecondary(st.secondary, K, hands, p, t, st.secK);
  p.hands = hands; p.K = K; return p;
}

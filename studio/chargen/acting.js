// REUSABLE ACTING LAYER (original). Same action library for every character; personality (persona()) changes
// timing, amplitude and secondary motion, so an elder and a young soldier perform the same beat differently.
import { FACE, blendFace, normalizeSpec, persona } from './chargen.js';
const D = (o) => JSON.parse(JSON.stringify(o)), lerp = (a, b, k) => a + (b - a) * k, sstep = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (6 * x - 15) + 10); };
const NEUTRAL_BODY = { yaw: 0, headTilt: 0, lean: 0, squash: 0, bob: 0, shrug: 0, armL: [8, 8], armR: [8, 8], handL: 'open', handR: 'open', dx: 0 };

// action library: face preset + body pose (+ which secondary-motion layer runs while it holds)
export const ACTIONS = {
  idle:      { face: 'neutral', body: {} },
  notice:    { face: 'notice', body: { headTilt: -3, lean: -2, shrug: 0.3 }, accent: 'pop' },
  curious:   { face: 'curious', body: { headTilt: 10, lean: 6, bob: 1.4, armR: [64, 24], handR: 'point' } },
  suspicious:{ face: 'suspicious', body: { headTilt: -6, lean: -3, armL: [30, 110], handL: 'fist' } },
  disbelief: { face: 'disbelief', body: { headTilt: -8, lean: -6, shrug: 0.25, armL: [34, 110], handL: 'fist' } },
  laugh:     { face: 'laugh', body: { headTilt: 8, lean: -8, squash: 0.06, armR: [92, 8], handR: 'point', armL: [30, 100] }, sec: 'laugh' },
  shock:     { face: 'shock', body: { squash: -0.3, bob: -3, shrug: 0.6, lean: -4, armL: [150, 20], armR: [150, 20], handL: 'spread', handR: 'spread' }, accent: 'jolt' },
  fear:      { face: 'fear', body: { yaw: -0.15, headTilt: 4, lean: -9, squash: 0.06, bob: 1.2, shrug: 0.8, armL: [120, 120], armR: [112, 110], handL: 'spread', handR: 'spread' }, sec: 'tremble' },
  sad:       { face: 'sad', body: { headTilt: 8, lean: 3, shrug: 0.4, bob: 1 } },
  confused:  { face: 'confused', body: { headTilt: 12, armR: [70, 120], handR: 'open' } },
  realize:   { face: 'realize', body: { headTilt: -4, armR: [150, 30], handR: 'point' }, accent: 'pop' },
  angry:     { face: 'angry', body: { lean: 6, armL: [20, 30], armR: [20, 30], handL: 'fist', handR: 'fist', squash: 0.05 } },
};

// beats: [{ t, act, body:{overrides}, face:{overrides} }]; returns a pose for drawCharacter at time t
export function makePerformer(specIn, beats, seed = 1) {
  const S = normalizeSpec(specIn); S.__norm = 1; const P = persona(S), trans = 0.32 / P.tempo;
  // per-character idle rhythm + blink schedule (elders blink slower, kids faster)
  const blinks = []; for (let t = 0.3 + (seed % 7) * 0.13; t < 60; t += (2.6 + ((seed * 13 + blinks.length * 7) % 10) * 0.18) / P.tempo) blinks.push(t);
  const target = (b) => { const A = ACTIONS[b.act], body = { ...NEUTRAL_BODY }; for (const [k, v] of Object.entries({ ...A.body, ...(b.body || {}) })) body[k] = v;
    // amplitude: scale numeric pose offsets from neutral by the persona
    for (const k of ['headTilt', 'lean', 'squash', 'bob', 'shrug']) body[k] = NEUTRAL_BODY[k] + (body[k] - NEUTRAL_BODY[k]) * (b.body && k in b.body ? 1 : P.amp);
    const face = D(FACE[A.face]); for (const [k, v] of Object.entries(b.face || {})) face[k] = typeof v === 'object' && !Array.isArray(v) ? { ...face[k], ...v } : v; return { body, face, A }; };
  const T = beats.map((b) => ({ ...b, ...target(b) }));
  return { spec: S, persona: P, poseAt(t) {
    let i = 0; while (i < T.length - 1 && T[i + 1].t <= t) i++; const cur = T[i], prev = T[Math.max(0, i - 1)], k = i === 0 ? 1 : sstep((t - cur.t) / trans);
    const face = blendFace(prev.face, cur.face, k), body = {};
    for (const key of Object.keys(cur.body)) { const a = prev.body[key], b = cur.body[key]; body[key] = Array.isArray(b) ? b.map((v, j) => lerp(a[j], v, k)) : typeof b === 'number' ? lerp(a, b, k) : k < 0.5 ? a : b; }
    const dt = t - cur.t;
    // accents: anticipation -> overshoot -> settle (squash/stretch, follow-through), scaled by persona
    if (cur.A.accent === 'jolt' && dt < 0.9) { const s = Math.exp(-dt * 6 * P.tempo) * Math.cos(dt * 22 * P.tempo); body.squash += -0.25 * s * P.amp; body.bob += -2.2 * s * P.amp; body.headSquash = -0.4 * s; }
    if (cur.A.accent === 'pop' && dt < 0.5) { const s = Math.exp(-dt * 9) * Math.sin(dt * 30); body.headSquash = -0.3 * s * P.amp; body.squash += -0.08 * s * P.amp; }
    // secondary layers
    body.bob += 0.25 * P.idle * Math.sin(t * 2.6 * P.tempo + seed); body.headTilt += 1.2 * P.idle * Math.sin(t * 1.7 * P.tempo + seed * 2);
    if (cur.A.sec === 'laugh') { const f = 16 * P.tempo, s = Math.abs(Math.sin(t * f)); body.bob += s * 1.4 * P.bounce; body.headTilt += 4 * P.amp * Math.sin(t * f); face.mouth.open = 0.62 + 0.3 * s; face.cheek = 0.9 + 0.1 * s; body.squash += 0.05 * s * P.bounce; }
    if (cur.A.sec === 'tremble') { const j = Math.sin(t * 63), j2 = Math.sin(t * 47); body.headTilt += 1.4 * j * P.tremble; body.lean += 0.7 * j2 * P.tremble; face.pupil = [face.pupil[0] + 0.12 * j2, face.pupil[1] + 0.08 * j]; face.mouth.wob = 1; }
    if (!(cur.A.sec === 'laugh')) for (const bt of blinks) { const d = t - bt, len = 0.13 / Math.min(1.2, P.tempo); if (d > 0 && d < len) { const q = d < len * 0.45 ? d / (len * 0.45) : 1 - (d - len * 0.45) / (len * 0.55); face.lidT = face.lidT.map((v) => Math.max(v, q)); } }
    // walking: if dx changes between beats, drive the step cycle from distance travelled
    body.step = Math.abs(prev.body.dx - cur.body.dx) > 0.01 && k < 1 ? (body.dx * 3.2) % 1 : null;
    return { face, ...body, propHand: specIn.propHand || 'R' }; } };
}

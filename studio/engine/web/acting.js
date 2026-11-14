// REUSABLE ACTING LAYER v2 (original). One action library + one locomotion model for every character.
// Personality (persona + walk style) changes timing, amplitude, gait and secondary motion, not the rig.
//   performer = makePerformer(spec, { beats, path, speech, seed })
//   pose = performer.poseAt(t, ctx)   ctx = { camRight:[x,z], targets:{ name:[u,v] } }  -> pass to drawCharacter
import { FACE, blendFace, normalizeSpec, persona } from './chargen.js';
import { applySpeech } from './lipsync.js';
const D = (o) => JSON.parse(JSON.stringify(o)), lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (6 * x - 15) + 10); };
const NB = { yaw: 0, headYaw: 0, headTilt: 0, lean: 0, squash: 0, bob: 0, shrug: 0, sit: 0, armL: [8, 8], armR: [8, 8], handL: 'open', handR: 'open' };

// ---- action library (face preset + body pose + accent + secondary layer) ----
export const ACTIONS = {
  idle:      { face: 'neutral', body: {} },
  talk:      { face: 'neutral', body: {}, sec: 'talk' },
  notice:    { face: 'notice', body: { headTilt: -3, lean: -2, shrug: 0.3 }, accent: 'pop' },
  curious:   { face: 'curious', body: { headTilt: 10, lean: 6, bob: 1.4 } },
  lookAround:{ face: 'curious', body: { headTilt: 4 }, sec: 'scan' },
  suspicious:{ face: 'suspicious', body: { headTilt: -6, lean: -3 } },
  disbelief: { face: 'disbelief', body: { headTilt: -8, lean: -6, shrug: 0.25 } },
  point:     { face: 'notice', body: { armR: [96, -6], handR: 'point', lean: 3 } },
  laugh:     { face: 'laugh', body: { headTilt: 8, lean: -8, squash: 0.06 }, sec: 'laugh' },
  shock:     { face: 'shock', body: { squash: -0.3, bob: -3, shrug: 0.6, lean: -4, armL: [150, 20], armR: [150, 20], handL: 'spread', handR: 'spread' }, accent: 'jolt' },
  recoil:    { face: 'shock', body: { lean: -12, squash: -0.08, shrug: 0.6, headTilt: -8, armL: [110, 95], armR: [104, 100], handL: 'spread', handR: 'spread' }, accent: 'jolt' },
  stumble:   { face: 'fear', body: { lean: -16, shrug: 0.4, armL: [150, 30], armR: [128, 46], handL: 'spread', handR: 'spread' }, sec: 'wobble' },
  fallSit:   { face: 'shock', body: { sit: 1, lean: -8, shrug: 0.3, armL: [52, 30], armR: [52, 30], handL: 'spread', handR: 'spread' }, accent: 'thud' },
  dazed:     { face: 'confused', body: { sit: 1, lean: -4, headTilt: 10, armL: [36, 20], armR: [36, 20] }, sec: 'dizzy' },
  sheepish:  { face: 'sad', body: { headTilt: 8, shrug: 0.4, armL: [150, 60], handL: 'open' } },
  fear:      { face: 'fear', body: { yaw: -0.15, headTilt: 4, lean: -9, squash: 0.06, bob: 1.2, shrug: 0.8, armL: [120, 120], armR: [112, 110], handL: 'spread', handR: 'spread' }, sec: 'tremble' },
  sad:       { face: 'sad', body: { headTilt: 8, lean: 3, shrug: 0.4, bob: 1 } },
  confused:  { face: 'confused', body: { headTilt: 12, armR: [70, 120], handR: 'open' } },
  realize:   { face: 'realize', body: { headTilt: -4, armR: [150, 30], handR: 'point' }, accent: 'pop' },
  angry:     { face: 'angry', body: { lean: 6, armL: [20, 30], armR: [20, 30], handL: 'fist', handR: 'fist', squash: 0.05 } },
  carry:     { face: 'neutral', body: { handL: 'grip', handR: 'grip' } },
  effort:    { face: 'angry', body: { lean: 4, squash: 0.08, handL: 'grip', handR: 'grip' }, sec: 'strain' },
};
// walk styles (personality): stride, foot lift, bob, arm swing, lean, cadence, hip sway
export const WALK = {
  shuffle: { stride: 0.62, lift: 0.4, bob: 0.35, swing: 0.35, lean: 4, cadence: 0.85, sway: 0.2 },
  stride:  { stride: 1, lift: 1, bob: 1, swing: 1, lean: 3, cadence: 1, sway: 0.4 },
  bouncy:  { stride: 0.9, lift: 1.5, bob: 1.8, swing: 1.3, lean: 3, cadence: 1.15, sway: 0.6 },
  march:   { stride: 1, lift: 1.3, bob: 0.6, swing: 1.6, lean: 0, cadence: 1, sway: 0 },
  swagger: { stride: 1.05, lift: 0.8, bob: 0.8, swing: 1.1, lean: -3, cadence: 0.9, sway: 1.2 },
};

export function makePerformer(specIn, { beats, path = null, speech = null, seed = 1, walk = null }) {
  const S = normalizeSpec(specIn); S.__norm = 1; const P = persona(S), trans = 0.3 / P.tempo;
  const style = WALK[walk || S.personality.walk || (S.age === 'elder' ? 'shuffle' : S.age === 'child' ? 'bouncy' : 'stride')];
  const legScale = { child: 0.62, teen: 0.88, adult: 1, elder: 0.92 }[S.age] * S.height;
  const blinks = []; for (let t = 0.3 + (seed % 7) * 0.13; t < 120; t += (2.4 + ((seed * 13 + blinks.length * 7) % 10) * 0.2) / P.tempo) blinks.push(t);
  const T = beats.map((b) => { const A = ACTIONS[b.act] || ACTIONS.idle, body = { ...NB, ...D(A.body), ...D(b.body || {}) };
    for (const k of ['headTilt', 'lean', 'squash', 'bob', 'shrug']) if (!(b.body && k in b.body)) body[k] = NB[k] + (body[k] - NB[k]) * P.amp;
    const face = D(FACE[b.face?.preset || A.face]); for (const [k, v] of Object.entries(b.face || {})) if (k !== 'preset') face[k] = typeof v === 'object' && !Array.isArray(v) ? { ...face[k], ...v } : v;
    return { ...b, A, body, face }; });
  const beatIdx = (t) => { let i = 0; while (i < T.length - 1 && T[i + 1].t <= t) i++; return i; };
  // ---- path / locomotion: world position, odometer, speed
  let pos = () => null, odo = [];
  if (path && path.length) {
    const ease = (u) => { const r = 0.22; if (u < r) return (u * u) / (2 * r * (1 - r)); if (u > 1 - r) return 1 - ((1 - u) * (1 - u)) / (2 * r * (1 - r)); return (u - r / 2) / (1 - r); };
    pos = (t) => { if (t <= path[0].t) return [path[0].x, path[0].z]; for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1]; if (t <= b.t) { const k = (b.ease === 'linear' ? (x) => x : ease)((t - a.t) / (b.t - a.t)); return [lerp(a.x, b.x, k), lerp(a.z, b.z, k)]; } } const l = path[path.length - 1]; return [l.x, l.z]; };
    let d = 0, prev = pos(path[0].t - 1); for (let t = path[0].t - 1; t <= path[path.length - 1].t + 2; t += 1 / 120) { const p = pos(t); d += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; odo.push([t, d]); }
  }
  const dist = (t) => { if (!odo.length) return 0; const i = clamp(Math.round((t - odo[0][0]) * 120), 0, odo.length - 1); return odo[i][1]; };
  const vel = (t) => { const a = pos(t - 0.04), b = pos(t + 0.04); return a ? [(b[0] - a[0]) / 0.08, (b[1] - a[1]) / 0.08] : [0, 0]; };
  // ---- the raw (un-delayed) yaw the character wants at time t: beats, or direction of travel when moving
  const yawWanted = (t, ctx) => { const i = beatIdx(t), cur = T[i], prev = T[Math.max(0, i - 1)], k = i === 0 ? 1 : sstep((t - cur.t) / trans);
    let y = lerp(prev.body.yaw, cur.body.yaw, k); const v = vel(t), sp = Math.hypot(...v);
    if (sp > 0.05 && ctx?.camRight) { const amt = clamp(sp / 0.35, 0, 1), side = (v[0] * ctx.camRight[0] + v[1] * ctx.camRight[1]) / sp; y = lerp(y, clamp(side, -1, 1) * 0.55, amt * (cur.faceTravel === false ? 0 : 1)); }
    return y; };

  return { spec: S, persona: P, style, pos, poseAt(t, ctx = {}) {
    const i = beatIdx(t), cur = T[i], prev = T[Math.max(0, i - 1)], k = i === 0 ? 1 : sstep((t - cur.t) / trans), dt = t - cur.t;
    const face = blendFace(prev.face, cur.face, k), body = {};
    for (const key of Object.keys(NB)) { const a = prev.body[key], b = cur.body[key]; body[key] = Array.isArray(b) ? b.map((v, j) => lerp(a[j], v, k)) : typeof b === 'number' ? lerp(a, b, k) : k < 0.5 ? a : b; }
    // turns: the head leads, the body follows ~0.14 s later
    const lag = 0.14 / P.tempo, yNow = yawWanted(t, ctx), yBody = yawWanted(t - lag, ctx); body.yaw = yBody; body.headYaw += clamp(yNow - yBody, -0.5, 0.5) * 1.2;
    // reach / grab targets (IK in drawCharacter); targets may be named and resolved by the scene each frame
    const res = (r) => (r ? { pt: typeof r === 'string' ? ctx.targets?.[r] : r.pt || r, hand: r.hand } : null);
    for (const side of ['L', 'R']) { const a = res(prev['reach' + side]), b = res(cur['reach' + side]);
      if (b?.pt && a?.pt) body['reach' + side] = { pt: [lerp(a.pt[0], b.pt[0], k), lerp(a.pt[1], b.pt[1], k)], k: 1 };
      else if (b?.pt) body['reach' + side] = { pt: b.pt, k: i === 0 ? 1 : k };
      else if (a?.pt && k < 1) body['reach' + side] = { pt: a.pt, k: 1 - k }; }
    // accents: anticipation / overshoot / settle (squash-stretch + follow-through), scaled by persona
    if (cur.A.accent === 'jolt' && dt < 0.9) { const s = Math.exp(-dt * 6 * P.tempo) * Math.cos(dt * 22 * P.tempo); body.squash += -0.25 * s * P.amp; body.bob += -2.2 * s * P.amp; body.headSquash = -0.4 * s; }
    if (cur.A.accent === 'pop' && dt < 0.5) { const s = Math.exp(-dt * 9) * Math.sin(dt * 30); body.headSquash = -0.3 * s * P.amp; body.squash += -0.08 * s * P.amp; }
    if (cur.A.accent === 'thud') { const fallT = 0.22 / P.tempo; if (dt < fallT) { body.sit = sstep(dt / fallT) * body.sit; body.lean -= 12 * Math.sin(dt / fallT * Math.PI); }
      else if (dt < fallT + 0.8) { const d2 = dt - fallT, s = Math.exp(-d2 * 7) * Math.cos(d2 * 24); body.squash += 0.32 * s; body.headSquash = 0.45 * s; body.bob += 1.5 * s; } }
    // secondary layers
    const idleA = P.idle * (body.sit > 0.5 ? 0.5 : 1); body.bob += 0.25 * idleA * Math.sin(t * 2.6 * P.tempo + seed); body.headTilt += 1.2 * idleA * Math.sin(t * 1.7 * P.tempo + seed * 2);
    if (cur.A.sec === 'laugh') { const f = 16 * P.tempo, s = Math.abs(Math.sin(t * f)); body.bob += s * 1.4 * P.bounce; body.headTilt += 4 * P.amp * Math.sin(t * f); face.mouth.open = 0.62 + 0.3 * s; face.cheek = 0.9 + 0.1 * s; body.squash += 0.05 * s * P.bounce; }
    if (cur.A.sec === 'tremble') { const j = Math.sin(t * 63), j2 = Math.sin(t * 47); body.headTilt += 1.4 * j * P.tremble; body.lean += 0.7 * j2 * P.tremble; face.pupil = [face.pupil[0] + 0.12 * j2, face.pupil[1] + 0.08 * j]; face.mouth.wob = 1; }
    if (cur.A.sec === 'wobble') { const s = Math.exp(-dt * 2.5); body.lean += 7 * Math.sin(dt * 11) * s; body.armL = [body.armL[0] + 25 * Math.sin(dt * 13) * s, body.armL[1]]; body.armR = [body.armR[0] - 25 * Math.sin(dt * 13 + 1) * s, body.armR[1]]; }
    if (cur.A.sec === 'scan') { body.headYaw += 0.42 * Math.sin(dt * 1.9 * P.tempo); face.pupil = [face.pupil[0] + 0.6 * Math.sin(dt * 1.9 * P.tempo + 0.4), face.pupil[1]]; }
    if (cur.A.sec === 'dizzy') { body.headTilt += 6 * Math.sin(t * 3); face.pupil = [0.5 * Math.cos(t * 6), 0.5 * Math.sin(t * 6)]; }
    if (cur.A.sec === 'strain') { body.headTilt += 1.2 * Math.sin(t * 40); }
    // locomotion: gait cycle from distance travelled (no foot sliding), bob, lean, arm counter-swing
    const v = vel(t), sp = Math.hypot(...v);
    if (sp > 0.03) { const amt = clamp(sp / 0.35, 0, 1), run = sp > 1.25 * legScale, cyc = (run ? 1.35 : 0.78) * legScale * style.stride, ph = dist(t) / cyc;
      const side = ctx.camRight ? (v[0] * ctx.camRight[0] + v[1] * ctx.camRight[1]) / sp : 1, gdir = Math.abs(side) < 0.25 ? 0 : Math.sign(side);
      body.gait = { phase: ph, amt, run, dir: gdir, lift: style.lift, stride: style.stride * (Math.abs(side) < 0.25 ? 0.2 : 1) };
      body.bob += (run ? 1.6 : 0.7) * style.bob * amt * Math.cos(ph * 4 * Math.PI) * P.bounce; body.lean += gdir * ((run ? 9 : 2) + style.lean) * amt + style.sway * 2 * Math.sin(ph * 2 * Math.PI) * amt;
      const sw = (run ? 34 : 18) * style.swing * amt * Math.sin(ph * 2 * Math.PI), held = (s) => body['reach' + s]?.k > 0.5;
      if (!held('L')) body.armL = [body.armL[0] + sw, body.armL[1] + (run ? 70 * amt : 8)]; if (!held('R')) body.armR = [body.armR[0] - sw, body.armR[1] + (run ? 70 * amt : 8)];
      body.headTilt += -1.5 * Math.cos(ph * 4 * Math.PI) * amt; if (run) face.mouth.open = Math.max(face.mouth.open, 0.25); }
    // speech: visemes + loudness on top of the emotion; emphasis lifts brows, nods the head and drives talking gestures
    if (speech && cur.speak !== false) { const s = speech.at(t);
      if (s.talking) { const kk = cur.A.sec === 'laugh' ? 0.6 : 1; face.mouth = applySpeech(face.mouth, s, kk);
        face.browY = face.browY.map((b) => b - 14 * s.emph); body.headTilt += -3.5 * s.emph * P.amp; body.bob += 0.4 * s.emph;
        if (cur.A.sec === 'talk' && cur.gesture) { const g = cur.gesture === 'L' ? 'armL' : 'armR'; body[g] = [body[g][0] + 26 * s.emph * P.amp, body[g][1] + 30 * s.emph]; } } }
    // blinks (not during laughter squint); blink on big emphasis onsets too
    if (cur.A.sec !== 'laugh') for (const bt of blinks) { const d = t - bt, len = 0.13 / Math.min(1.2, P.tempo); if (d > 0 && d < len) { const q = d < len * 0.45 ? d / (len * 0.45) : 1 - (d - len * 0.45) / (len * 0.55); face.lidT = face.lidT.map((x) => Math.max(x, q)); } }
    if (cur.look) { const ly = cur.look === 'cam' ? -body.yaw * 0.8 : cur.look; body.headYaw += (ly - body.headYaw) * k * 0.8; face.pupil = [face.pupil[0] + (cur.look === 'cam' ? -body.yaw * 0.5 : ly), face.pupil[1]]; }
    const p = pos(t); return { face, ...body, pos: p, propHand: specIn.propHand || 'R', showProp: cur.showProp ?? true, facing: cur.facing, pointDir: cur.pointDir };
  } };
}

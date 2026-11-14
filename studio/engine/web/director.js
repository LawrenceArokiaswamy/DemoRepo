// STORY DIRECTOR (original). Plays any story folder: story.json (set, cast bible, performances, shots, audio)
// + optional business.js (story-specific object interaction: carried props, particles, physics).
// URL: director.html?story=/stories/<slug>   Exposes window.renderFrame(f), window.TOTAL, window.cues(), window.ready.
import { THREE, scene, camera, composer, bokeh, grade, makeCard, camKeys, loadModel, renderer } from './stage.js';
import { drawCharacter, normalizeSpec, periodExtra, checkPeriod } from './chargen.js';
import { makePerformer } from './acting.js';
import { makeSpeech } from './lipsync.js';

const base = new URLSearchParams(location.search).get('story'), J = async (p) => (await fetch(`${base}/${p}`)).json();
const story = await J('story.json'), FPS = story.fps || 30, DUR = story.duration; window.TOTAL = Math.round(DUR * FPS);
const TM = story.timeMap || [[0, 0], [DUR, DUR]];   // piecewise-linear video time -> world time
const worldT = (t) => { for (let i = 0; i < TM.length - 1; i++) { const [a0, w0] = TM[i], [a1, w1] = TM[i + 1]; if (t <= a1 || i === TM.length - 2) return w0 + (w1 - w0) * Math.max(0, Math.min(1, (t - a0) / (a1 - a0))); } return t; };
// ---- set
const SET = await (await import(`./sets/${story.set}.js`)).build();
// ---- period check: every principal and extra must fit the story's period
const warnings = []; for (const [id, c] of Object.entries(story.cast)) warnings.push(...checkPeriod(c.spec, story.period));
if (warnings.length) console.error('PERIOD', warnings.join('; '));
// ---- speech: one track per speaking character (word timings from tools/align.py, loudness from tools/envelope.py)
const speeches = {};
for (const line of story.dialogue || []) { const words = await J(line.words), env = await J(line.env); speeches[line.speaker] = makeSpeech(words, env, { offset: line.offset }); }
// ---- performers + cards
const CARD_H = story.cardHeight || 1.62;
const mkActor = (id, P, x, z, res = 1, y = 0) => { const c = document.createElement('canvas'); c.width = 1200 * res; c.height = 2000 * res; const card = makeCard(CARD_H * 0.6, CARD_H, c); card.mesh.material.emissive.setRGB(0.32, 0.31, 0.3);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshBasicMaterial({ color: '#2a1a10', transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1, 0.5, 1); scene.add(sh);
  return { id, P, x, y, z, c, g: c.getContext('2d'), card, sh }; };
const ACT = {};
for (const [id, c] of Object.entries(story.cast)) { const perf = story.performances[id] || { beats: [{ t: 0, act: 'idle' }] };
  ACT[id] = mkActor(id, makePerformer({ ...c.spec, propHand: c.spec.propHand }, { beats: perf.beats, path: perf.path, speech: speeches[id], seed: c.seed || 1 }), c.x, c.z, 1, c.y || 0); }
for (const [i, e] of (story.extras || []).entries()) { const spec = periodExtra(e.seed, story.period, e.role || 'civilian');
  const P = makePerformer(spec, { beats: e.beats || [{ t: 0, act: 'idle' }], path: e.path, seed: 20 + i }); ACT[e.id || 'extra' + i] = mkActor(e.id || 'extra' + i, P, e.x, e.z, 0.5, e.y || 0); }   // extras: half-res cards
const cardToWorld = (A, uv, front = 0.07) => A.card.mesh.localToWorld(new THREE.Vector3((uv[0] - 0.5) * CARD_H * 0.6, (1 - uv[1]) * CARD_H, front));
const handsMid = (A) => [(A.out.hands.L[0] + A.out.hands.R[0]) / 2, (A.out.hands.L[1] + A.out.hands.R[1]) / 2];
const camRight = () => { const r = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); return [r.x, r.z]; };
const light = story.cardLight || { dir: -1, contrast: 1.05, rim: '255,222,180', rimI: 0.85 };
// setup(t): camera + every character card at time t (business code may call it to capture deterministic states)
function setup(t) {
  const sh = story.shots.find((s) => t >= s.a && t < s.b) || story.shots[story.shots.length - 1], v = camKeys(sh.keys, t);
  for (const kk of story.kicks || []) { const d = (t - kk.t) * FPS; if (d >= 0 && d < 8) { const s = (Math.floor(d) % 2 ? -1 : 1) * kk.a * (1 - d / 8); v.look = [v.look[0] + s, v.look[1] + s * 1.4, v.look[2]]; } }
  let up = [0, 1, 0];
  if (sh.attach && biz.frameOf) { const M = biz.frameOf(sh.attach, worldT(t)), P = new THREE.Vector3(...v.pos).applyMatrix4(M), Lk = new THREE.Vector3(...v.look).applyMatrix4(M); v.pos = P.toArray(); v.look = Lk.toArray();
    if (sh.attachUp) { const u = new THREE.Vector3(0, 1, 0).transformDirection(M); up = new THREE.Vector3(0, 1, 0).lerp(u, sh.attachUp).normalize().toArray(); } }
  camera.position.set(...v.pos); camera.up.set(...up); camera.lookAt(...v.look); camera.fov = v.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  bokeh.uniforms.focus.value = v.focus; bokeh.uniforms.aperture.value = v.ap ?? 0.0006;
  const ctx = { camRight: camRight() }, wt = worldT(t);
  for (const A of Object.values(ACT)) {
    const pose = A.P.poseAt(wt, ctx); let x = pose.pos ? pose.pos[0] : A.x, z = pose.pos ? pose.pos[1] : A.z, y = A.y || 0;
    const pl = biz.placeActor ? biz.placeActor(A.id, wt, pose, CTX) : null;   // business may put actors on decks, walls, etc.
    if (pl) { x = pl.x; y = pl.y; z = pl.z; if (pl.lean) pose.lean = (pose.lean || 0) + pl.lean; if (pl.hide) { A.card.mesh.visible = A.sh.visible = false; continue; } }
    A.card.mesh.visible = true; A.sh.visible = !(pl && pl.noShadow);
    A.card.mesh.position.set(x, y, z); A.card.mesh.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z); A.card.mesh.updateMatrixWorld(); A.sh.position.set(x, y + 0.004, z + 0.03);
    const g = A.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, A.c.width, A.c.height); g.setTransform(A.c.width / 600, 0, 0, A.c.height / 1000, 0, 0);
    A.out = drawCharacter(g, A.P.spec, { ...pose, light }); A.card.tex.needsUpdate = true; A.pose = pose;
  }
}
// ---- story business (optional)
const CTX = { THREE, scene, camera, SET, ACT, story, FPS, DUR, setup, cardToWorld, handsMid, camRight, loadModel, worldT, grade, renderer };
let biz = {};
if (story.business) biz = await import(`${base}/${story.business}`); if (biz.init) await biz.init(CTX);
window.renderFrame = (f) => { const t = f / FPS; if (biz.prepare) biz.prepare(CTX); setup(t); if (biz.frame) biz.frame(worldT(t), CTX, t); grade.uniforms.t.value = t; composer.render(); return true; };
window.cues = () => { const out = { fps: FPS, duration: DUR, events: [] };
  // footsteps from every walking character's gait (contacts = half-cycles of the gait phase)
  for (const [id, A] of Object.entries(ACT)) { let last = null; for (let t = 0; t < DUR; t += 1 / 240) { camera.position.set(0, 1.2, 4); camera.lookAt(0, 0.9, 0); camera.updateMatrixWorld();
    const p = A.P.poseAt(t, { camRight: camRight() }); if (p.gait) { const c = Math.floor(p.gait.phase * 2); if (last !== null && c !== last) out.events.push({ type: 'step', t: +t.toFixed(3), who: id, gain: id.startsWith('extra') ? 0.25 : 1 }); last = c; } else last = null; } }
  if (biz.prepare) biz.prepare(CTX); if (biz.cues) out.events.push(...biz.cues(CTX)); out.events.sort((a, b) => a.t - b.t); return out; };
window.ready = true;

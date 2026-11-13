// Character-system test (8 s): two generated characters react to the same event with the same action library,
// performed differently by personality. Old Matthias (slow, small, wheezy) vs Marcus the young legionary (jumpy, big).
import { THREE, scene, camera, composer, bokeh, grade, makeCard, camKeys } from './stage.js';
import { buildSet, SET } from './set.js';
import { drawCharacter } from './chargen.js';
import { makePerformer } from './acting.js';
import { CAST5 } from './cast.js';

const FPS = 30, DUR = 8; window.TOTAL = Math.round(DUR * FPS);
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
await buildSet();
const CARD_H = 1.62, CW = 900, CH = 1500;
// shot list references characters by id; specs come from the story's cast bible
const ELDER = makePerformer(CAST5.elder, [
  { t: 0, act: 'idle', body: { yaw: 0.3, armR: [18, -10] } },
  { t: 1.45, act: 'notice', body: { yaw: 0.4, armR: [18, -10] } },                         // notices late
  { t: 2.1, act: 'curious', body: { yaw: 0.45, armR: [18, -10], armL: [70, 20], handL: 'point', handR: 'open' } },
  { t: 3.5, act: 'shock', body: { yaw: 0.3, armR: [18, -10], armL: [60, 40], handL: 'spread' } },   // small startle (persona amp 0.42)
  { t: 4.45, act: 'laugh', body: { yaw: 0.5, armR: [18, -10], armL: [92, 6], handL: 'point', handR: 'open' } },   // wheezes, points at the soldier
], 3);
const SOLDIER = makePerformer(CAST5.soldier, [
  { t: 0, act: 'idle', body: { yaw: -0.25, armR: [20, 40] } },
  { t: 1.05, act: 'notice', body: { yaw: -0.4, armR: [24, 46] } },                         // notices instantly
  { t: 1.7, act: 'suspicious', body: { yaw: -0.4, armR: [70, 80], armL: [40, 100], handL: 'fist' } },  // shield up, guarded
  { t: 3.42, act: 'shock', body: { yaw: -0.2 } },                                           // big jolt
  { t: 3.95, act: 'fear', body: { yaw: -0.3, dx: 0.14, armR: [96, 70], armL: [120, 120] } },     // backs off behind the shield
  { t: 6.3, act: 'sad', body: { yaw: -0.35, dx: 0.14, armR: [30, 40], armL: [150, 60], handL: 'open' }, face: { blush: 1, cheek: 0.4, pupil: [-0.6, 0.4] } },  // sheepish, scratches helmet
], 7);
const ACTORS = [{ P: ELDER, x: -0.4, z: 0.62, light: -1 }, { P: SOLDIER, x: 0.38, z: 0.58, light: -1 }].map((a) => {
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const card = makeCard(CARD_H * 0.6, CARD_H, c); card.mesh.material.emissive.setRGB(0.3, 0.29, 0.28);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.38, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1, 0.45, 1); scene.add(sh);
  return { ...a, c, g: c.getContext('2d'), card, sh }; });
const clock = SET.props.alarm_clock_01; clock.scale.multiplyScalar(1.35); clock.position.x = -0.02; clock.position.z = 0.95; clock.position.y -= SET.benchTop; clock.rotation.y += Math.PI + 0.2; const clock0 = clock.position.clone(), clockR0 = clock.rotation.clone();

const SHOTS = [
  { a: 0, b: 3.42, keys: [{ t: 0, pos: [0.0, 1.05, 4.5], look: [0.0, 0.82, 0.6], fov: 40, focus: 3.8, ap: 0.0007 }, { t: 3.42, pos: [0.0, 1.0, 4.15], look: [0.0, 0.8, 0.6], fov: 40, focus: 3.5, ap: 0.0007 }] },
  { a: 3.42, b: 4.45, keys: [{ t: 3.42, pos: [0.15, 1.15, 3.0], look: [0.36, 1.0, 0.6], fov: 38, focus: 2.4, ap: 0.0012 }, { t: 4.45, pos: [0.15, 1.15, 2.8], look: [0.38, 1.02, 0.6], fov: 38, focus: 2.2, ap: 0.0012 }] },
  { a: 4.45, b: 6.1, keys: [{ t: 4.45, pos: [-0.2, 1.1, 2.95], look: [-0.38, 0.98, 0.62], fov: 38, focus: 2.35, ap: 0.0012 }, { t: 6.1, pos: [-0.22, 1.1, 2.7], look: [-0.38, 1.0, 0.62], fov: 38, focus: 2.1, ap: 0.0012 }] },
  { a: 6.1, b: 8, keys: [{ t: 6.1, pos: [0.06, 1.0, 4.3], look: [0.06, 0.82, 0.6], fov: 40, focus: 3.65, ap: 0.0007 }, { t: 8, pos: [0.06, 1.0, 4.05], look: [0.06, 0.84, 0.6], fov: 40, focus: 3.4, ap: 0.0007 }] },
];
const KICKS = [{ t: 1.0, a: 0.004 }, { t: 3.42, a: 0.03 }];
function clockAt(t) {
  const p = clock0.clone(), r = clockR0.clone(); let rattle = 0;
  const hop = (a, b, h, spin = 0) => { if (t > a && t < b) { const k = ramp(t, a, b); p.y += 4 * h * k * (1 - k); r.z += Math.sin(k * Math.PI * 3) * spin; } };
  hop(1.0, 1.2, 0.02, 0.08); hop(2.6, 2.8, 0.015, -0.06);
  if (t > 3.0 && t < 3.4) rattle = 0.25 * Math.sin(t * 95);
  if (t >= 3.4 && t < 4.2) { const k = ramp(t, 3.4, 4.2); p.y += 4 * 0.35 * k * (1 - k); r.y += k * 4.4; r.x += Math.sin(k * Math.PI) * 0.6; }
  if (t >= 4.2) { r.y += 4.4; rattle = 0.6 * Math.sin(t * 130) * Math.max(0.15, 1 - ramp(t, 4.2, 8)); p.y += Math.abs(Math.sin(t * 9)) * 0.02 * (1 - ramp(t, 4.2, 8)); }
  r.z += rattle * 0.12; r.x += rattle * 0.05; clock.position.copy(p); clock.rotation.copy(r);
}
window.renderFrame = (f) => {
  const t = f / FPS, sh = SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1], v = camKeys(sh.keys, t);
  for (const kk of KICKS) { const d = (t - kk.t) * FPS; if (d >= 0 && d < 8) { const s = (Math.floor(d) % 2 ? -1 : 1) * kk.a * (1 - d / 8); v.look = [v.look[0] + s, v.look[1] + s * 1.4, v.look[2]]; v.roll = (v.roll || 0) + s * 25; } }
  camera.position.set(...v.pos); camera.up.set(0, 1, 0); camera.lookAt(...v.look); camera.rotateZ((v.roll || 0) * Math.PI / 180); camera.fov = v.fov; camera.updateProjectionMatrix();
  bokeh.uniforms.focus.value = v.focus; bokeh.uniforms.aperture.value = v.ap ?? 0.001;
  for (const A of ACTORS) { const pose = A.P.poseAt(t), x = A.x + (pose.dx || 0), g = A.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    drawCharacter(g, A.P.spec, { ...pose, light: { dir: A.light, contrast: 1, rim: '255,210,150', rimI: 0.9 } }); A.card.tex.needsUpdate = true;
    A.card.mesh.position.set(x, 0, A.z); A.card.mesh.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - A.z); A.sh.position.set(x, 0.004, A.z + 0.03); }
  clockAt(t);
  SET.flame.scale.set(1, 2.2 + 0.3 * Math.sin(t * 23), 1); SET.dust.rotation.y = t * 0.02;
  grade.uniforms.t.value = t; grade.uniforms.flash.value = t >= 3.42 && t < 3.52 ? 0.1 * (1 - ramp(t, 3.42, 3.52)) : 0;
  composer.render(); return true;
};
window.ready = true;

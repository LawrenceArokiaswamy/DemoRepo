// Visual test 2 (7.5 s): simple EP01-style toon character with parametric facial animation in a CC0 PBR workshop.
// Beats: notice -> curious -> disbelief -> laugh -> fright.
import { THREE, scene, camera, composer, bokeh, grade, makeCard, camKeys, sstep, lerp } from './stage.js';
import { buildSet, SET } from './set.js';
import { drawToon, CAST, FACE, blendFace } from './toon.js';

const FPS = 30, DUR = 7.5; window.TOTAL = Math.round(DUR * FPS);
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
await buildSet();
const T = SET.benchTop;
const CW = 960, CH = 1600, pc = document.createElement('canvas'); pc.width = CW; pc.height = CH; const pg = pc.getContext('2d');
const CARD_H = 2.0, card = makeCard(CARD_H * 0.6, CARD_H, pc);
card.mesh.material.emissive.setRGB(0.3, 0.29, 0.28);
const contact = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.38, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.scale.set(1, 0.5, 1); scene.add(contact);
const clock = SET.props.alarm_clock_01, clock0 = clock.position.clone(), clockR0 = clock.rotation.clone();
const HEAD = [0.12, 1.43, -0.6];

// ---------- camera ----------
const SHOTS = [
  { a: 0, b: 2.6, keys: [{ t: 0, pos: [0.48, 1.22, 2.05], look: [0.1, 1.12, -0.4], fov: 40, focus: 1.95, ap: 0.0013 }, { t: 0.75, pos: [0.46, 1.23, 1.98], look: [0.1, 1.13, -0.4], fov: 39, focus: 1.9, ap: 0.0013 },
    { t: 1.05, pos: [0.45, 1.25, 1.95], look: [0.11, 1.2, -0.45], fov: 39, focus: 2.55, ap: 0.0013 }, { t: 2.6, pos: [0.42, 1.3, 1.92], look: [0.16, 1.26, -0.45], fov: 38, focus: 2.45, ap: 0.0013 }] },
  { a: 2.6, b: 3.8, keys: [{ t: 2.6, pos: [0.42, 1.44, 1.95], look: [0.1, 1.36, -0.6], fov: 37, focus: 2.55, ap: 0.0015 }, { t: 3.8, pos: [0.4, 1.44, 1.8], look: [0.1, 1.37, -0.6], fov: 35, focus: 2.4, ap: 0.0015 }] },
  { a: 3.8, b: 5.0, keys: [{ t: 3.8, pos: [-1.15, 1.48, 1.95], look: [0.08, 1.15, -0.35], fov: 42, focus: 2.6 }, { t: 5.0, pos: [-1.05, 1.46, 1.8], look: [0.08, 1.16, -0.35], fov: 40, focus: 2.45 }] },
  { a: 5.0, b: 7.5, keys: [{ t: 5.0, pos: [0.3, 1.45, 2.5], look: [0.08, 1.15, -0.4], fov: 46, focus: 2.95, ap: 0.0009 }, { t: 5.9, pos: [0.3, 1.45, 2.35], look: [0.08, 1.18, -0.4], fov: 44, focus: 2.8, ap: 0.0009 },
    { t: 6.5, pos: [0.3, 1.45, 1.75], look: [0.0, 1.36, -0.75], fov: 38, focus: 2.5, ap: 0.0014, ease: 'out' }, { t: 7.5, pos: [0.28, 1.46, 1.6], look: [0.0, 1.37, -0.75], fov: 36, focus: 2.36, ap: 0.0014 }] },
];
const KICKS = [{ t: 0.62, a: 0.006 }, { t: 5.02, a: 0.03 }, { t: 5.9, a: 0.018 }];

// ---------- acting: face keys (preset + overrides) and body keys ----------
const F = (name, o = {}) => ({ ...JSON.parse(JSON.stringify(FACE[name])), ...o });
const FK = [
  { t: 0.0, f: F('neutral', { pupil: [0.6, 0.6] }) }, { t: 0.62, f: F('neutral', { pupil: [0.6, 0.6] }) },
  { t: 0.72, f: F('notice', { eye: 1.15 }) }, { t: 1.1, f: F('notice') },                                   // notices (eyes pop, pupils shrink)
  { t: 1.4, f: F('curious') }, { t: 2.5, f: F('curious', { pupil: [0.9, 0.5] }) },                          // curious
  { t: 2.72, f: F('disbelief') }, { t: 3.7, f: F('disbelief') },                                            // disbelief
  { t: 3.86, f: F('laugh', { mouth: { ...FACE.laugh.mouth, open: 0.7 } }) }, { t: 4.98, f: F('laugh') },    // laugh
  { t: 5.06, f: F('shock', { eye: 1.42, pupilS: 0.35 }) }, { t: 5.6, f: F('shock') },                       // shock pop
  { t: 5.85, f: F('fear') }, { t: 7.5, f: F('fear', { browY: [-30, -30] }) },                               // fear / panic
];
const BK = [
  { t: 0.0, yaw: 0.15, headTilt: 0, lean: 0, squash: 0, bob: 0.4, shrug: 0, armL: [16, 70], armR: [24, 76], handL: 'open', handR: 'open', z: -0.60 },
  { t: 0.62, yaw: 0.15, headTilt: 0, lean: 0, squash: 0, bob: 0.4, shrug: 0, armL: [16, 70], armR: [24, 76], handL: 'open', handR: 'open', z: -0.60 },
  { t: 0.75, yaw: 0.3, headTilt: -3, lean: -2, squash: -0.08, bob: 0, shrug: 0.3, armL: [16, 60], armR: [24, 66], handL: 'open', handR: 'open', z: -0.62 },
  { t: 1.4, yaw: 0.35, headTilt: 10, lean: 6, squash: 0.04, bob: 1.6, shrug: 0, armL: [40, 70], armR: [64, 24], handL: 'open', handR: 'point', z: -0.50 },
  { t: 2.5, yaw: 0.38, headTilt: 12, lean: 7, squash: 0.04, bob: 1.8, shrug: 0, armL: [42, 72], armR: [66, 22], handL: 'open', handR: 'point', z: -0.48 },
  { t: 2.75, yaw: 0.2, headTilt: -6, lean: -5, squash: -0.04, bob: 0.2, shrug: 0.2, armL: [34, 110], armR: [20, 40], handL: 'fist', handR: 'open', z: -0.57 },
  { t: 3.7, yaw: 0.22, headTilt: -8, lean: -6, squash: -0.04, bob: 0, shrug: 0.25, armL: [34, 112], armR: [20, 42], handL: 'fist', handR: 'open', z: -0.58 },
  { t: 3.9, yaw: 0.1, headTilt: 8, lean: -8, squash: 0.06, bob: 0.6, shrug: 0, armL: [30, 100], armR: [92, 8], handL: 'open', handR: 'point', z: -0.58 },
  { t: 4.98, yaw: 0.1, headTilt: 10, lean: -9, squash: 0.06, bob: 0.6, shrug: 0, armL: [30, 104], armR: [94, 6], handL: 'open', handR: 'point', z: -0.58 },
  { t: 5.06, yaw: 0, headTilt: -4, lean: 0, squash: 0.3, bob: 1.5, shrug: 0.4, armL: [30, 40], armR: [30, 40], handL: 'spread', handR: 'spread', z: -0.60 },   // anticipation
  { t: 5.25, yaw: 0, headTilt: -6, lean: -4, squash: -0.32, bob: -3.2, shrug: 0.6, armL: [150, 20], armR: [150, 20], handL: 'spread', handR: 'spread', z: -0.75 }, // jolt up
  { t: 5.6, yaw: 0, headTilt: -5, lean: -5, squash: -0.05, bob: -0.6, shrug: 0.5, armL: [140, 24], armR: [144, 24], handL: 'spread', handR: 'spread', z: -0.81 },
  { t: 5.9, yaw: -0.15, headTilt: 4, lean: -9, squash: 0.06, bob: 1.2, shrug: 0.8, armL: [120, 120], armR: [112, 110], handL: 'spread', handR: 'spread', z: -0.91 },  // cower
  { t: 7.5, yaw: -0.2, headTilt: 6, lean: -10, squash: 0.08, bob: 1.6, shrug: 0.9, armL: [122, 124], armR: [114, 112], handL: 'spread', handR: 'spread', z: -0.95 },
];
const keyAt = (keys, t) => { let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++; const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)]; return [a, b, a === b ? 1 : sstep((t - a.t) / (b.t - a.t))]; };
function actingAt(t) {
  const [fa, fb, fk] = keyAt(FK, t), face = blendFace(fa.f, fb.f, fk);
  const [ba, bb, bk] = keyAt(BK, t), body = {};
  for (const k of Object.keys(ba)) { const va = ba[k], vb = bb[k] ?? va; body[k] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], bk)) : typeof va === 'number' ? lerp(va, vb, bk) : (bk < 0.5 ? va : vb); }
  // secondary motion / life
  body.bob += 0.25 * Math.sin(t * 2.6); body.headTilt += 1.2 * Math.sin(t * 1.7);
  const laughing = t > 3.86 && t < 5.0, fearful = t > 5.85;
  if (laughing) { const s = Math.abs(Math.sin(t * 16)); body.bob += s * 1.4; body.headTilt += 4 * Math.sin(t * 16); face.mouth.open = 0.72 + 0.28 * s; face.cheek = 0.9 + 0.1 * s; body.squash += 0.05 * s; }
  if (fearful) { const j = Math.sin(t * 63), j2 = Math.sin(t * 47); body.headTilt += 1.4 * j; body.lean += 0.7 * j2; face.pupil = [face.pupil[0] + 0.12 * j2, face.pupil[1] + 0.08 * j]; face.mouth.wob = 1; }
  if (t > 0.62 && t < 1.2) face.pupil = [0.6 + 0.35 * Math.sin((t - 0.62) * 30) * Math.exp(-(t - 0.62) * 6), 0.5];   // eye darts when it first moves
  // blinks (skipped while the eyes are squeezed in laughter)
  for (const bt of [0.35, 2.15, 3.3, 6.9]) { const d = t - bt; if (d > 0 && d < 0.13 && !laughing) { const k = d < 0.06 ? d / 0.06 : 1 - (d - 0.06) / 0.07; face.lidT = face.lidT.map((v) => Math.max(v, k)); } }
  body.headSquash = t > 5.02 && t < 5.4 ? -0.4 * Math.sin(ramp(t, 5.02, 5.4) * Math.PI) : t > 0.62 && t < 0.85 ? -0.25 * Math.sin(ramp(t, 0.62, 0.85) * Math.PI) : 0;
  return { face, ...body };
}
// ---------- the clock ----------
function clockAt(t) {
  const p = clock0.clone(), r = clockR0.clone(); let rattle = 0;
  const hop = (a, b, h, spin = 0) => { if (t > a && t < b) { const k = ramp(t, a, b); p.y += 4 * h * k * (1 - k); r.z += Math.sin(k * Math.PI * 3) * spin; } };
  hop(0.6, 0.82, 0.018, 0.08);                                         // twitch
  if (t > 2.6 && t < 3.3) rattle = 0.3 * Math.sin(t * 95);             // rattles at him
  hop(3.95, 4.25, 0.05, 0.15); hop(4.45, 4.7, 0.04, -0.12);              // silly hops (he laughs)
  if (t >= 5.0 && t < 5.9) { const k = ramp(t, 5.0, 5.9); p.y += 4 * 0.42 * k * (1 - k); p.z += 0.2 * k; r.y += k * 4.4; r.x += Math.sin(k * Math.PI) * 0.7; }      // springs violently
  if (t >= 5.9) { const k = ramp(t, 5.9, 7.5); p.z += 0.2 - 0.18 * k; p.x += 0.04 * k; p.y += Math.abs(Math.sin(k * Math.PI * 6)) * 0.035 * (1 - k * 0.5); r.y += 4.4 + k; rattle = 0.6 * Math.sin(t * 130); }  // rings & hops toward him
  r.z += rattle * 0.12; r.x += rattle * 0.05; clock.position.copy(p); clock.rotation.copy(r);
}

window.renderFrame = (f) => {
  const t = f / FPS, sh = SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1], v = camKeys(sh.keys, t);
  for (const kk of KICKS) { const d = (t - kk.t) * FPS; if (d >= 0 && d < 8) { const s = (Math.floor(d) % 2 ? -1 : 1) * kk.a * (1 - d / 8); v.look = [v.look[0] + s, v.look[1] + s * 1.4, v.look[2]]; v.roll = (v.roll || 0) + s * 25; } }
  camera.position.set(...v.pos); camera.up.set(0, 1, 0); camera.lookAt(...v.look); camera.rotateZ((v.roll || 0) * Math.PI / 180); camera.fov = v.fov; camera.updateProjectionMatrix();
  bokeh.uniforms.focus.value = v.focus; bokeh.uniforms.aperture.value = v.ap ?? 0.0012;
  const A = actingAt(t);
  pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, CW, CH); pg.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
  drawToon(pg, CAST.tinker, { ...A, light: { dir: -1, contrast: 1, rim: '255,210,150', rimI: 0.9 } }); card.tex.needsUpdate = true;
  card.mesh.position.set(HEAD[0], 0, A.z); card.mesh.rotation.y = Math.atan2(camera.position.x - HEAD[0], camera.position.z - A.z);
  contact.position.set(HEAD[0], 0.004, A.z + 0.04);
  clockAt(t);
  SET.flame.scale.set(1, 2.2 + 0.3 * Math.sin(t * 23) + 0.2 * Math.sin(t * 37), 1); SET.lamp.intensity = 1.4 * (1 + 0.06 * Math.sin(t * 23));
  SET.dust.rotation.y = t * 0.02; SET.dust.position.y = -t * 0.01;
  grade.uniforms.t.value = t; grade.uniforms.flash.value = t >= 5.02 && t < 5.12 ? 0.12 * (1 - ramp(t, 5.02, 5.12)) : 0;
  composer.render(); return true;
};
window.ready = true;

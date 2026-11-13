// Visual-quality test scene (8 s): Pip vs the alarm clock. curiosity -> disbelief -> laughter -> shock -> fear.
import { THREE, scene, camera, composer, bokeh, grade, makeCard, camKeys, sstep, lerp } from './stage.js';
import { buildSet, SET } from './set.js';
import { loadPuppet, drawPuppet, CW, CH } from './puppet.js';

const FPS = 30, DUR = 8.0; window.TOTAL = Math.round(DUR * FPS);
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a))), S = (t, a, b) => sstep(ramp(t, a, b));

await buildSet();
const T = SET.benchTop, PUP = await loadPuppet();
const pc = document.createElement('canvas'); pc.width = CW; pc.height = CH; const pg = pc.getContext('2d');
const CARD_H = 1.9, card = makeCard(CARD_H * CW / CH, CARD_H, pc);
const contact = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.scale.set(1, 0.55, 1); scene.add(contact);
const clock = SET.props.alarm_clock_01, clock0 = clock.position.clone(), clockR0 = clock.rotation.clone();

// ---------- shots ----------
const PIPHEAD = [0.08, 1.62, -0.62];
const SHOTS = [
  { a: 0, b: 2.3, keys: [{ t: 0, pos: [0.5, T + 0.22, 1.45], look: [0.08, T + 0.36, -0.3], fov: 40, focus: 1.4, ap: 0.0014 }, { t: 1.15, pos: [0.46, T + 0.23, 1.32], look: [0.08, T + 0.38, -0.3], fov: 39, focus: 1.3, ap: 0.0014 },
    { t: 1.45, pos: [0.45, T + 0.24, 1.29], look: [0.09, T + 0.42, -0.35], fov: 38, focus: 1.95, ap: 0.0014 }, { t: 2.3, pos: [0.42, T + 0.25, 1.2], look: [0.1, T + 0.44, -0.35], fov: 37, focus: 1.9, ap: 0.0014 }] },
  { a: 2.3, b: 3.6, keys: [{ t: 2.3, pos: [-0.95, 1.55, 1.55], look: [0.05, 1.28, -0.35], fov: 37, focus: 2.15 }, { t: 3.6, pos: [-0.85, 1.52, 1.4], look: [0.05, 1.3, -0.35], fov: 35, focus: 2.0 }] },
  { a: 3.6, b: 6.6, keys: [{ t: 3.6, pos: [0.32, 1.56, 1.7], look: [0.05, 1.3, -0.4], fov: 44, focus: 2.2, ap: 0.0009 }, { t: 6.6, pos: [0.3, 1.54, 1.5], look: [0.08, 1.3, -0.4], fov: 42, focus: 2.0, ap: 0.0009 }] },
  { a: 6.6, b: 8.0, keys: [{ t: 6.6, pos: [0.55, 1.52, 0.95], look: [0.2, 1.52, -0.85], fov: 36, focus: 1.85, ap: 0.0016 }, { t: 8.0, pos: [0.5, 1.54, 0.8], look: [0.2, 1.54, -0.85], fov: 34, focus: 1.7, ap: 0.0016 }] },
];
const KICKS = [{ t: 3.62, a: 0.03 }, { t: 3.95, a: 0.012 }, { t: 4.55, a: 0.02 }, { t: 6.25, a: 0.025 }];

// ---------- Pip's acting (keyed poses; numeric fields eased, head swaps crossfade over 3 frames) ----------
const K = [
  { t: 0.0, head: 'curious', headRot: 6, near: [38, 52], nearHand: 'point', far: [8, 14], lean: 0, bob: 26, bodyRot: -3, z: -0.5 },
  { t: 0.9, head: 'curious', headRot: 9, near: [42, 50], nearHand: 'point', far: [8, 14], lean: 0, bob: 34, bodyRot: -4, z: -0.47 },
  { t: 1.08, head: 'curious', headRot: 9, near: [42, 50], nearHand: 'point', far: [8, 14], lean: 0, bob: 34, bodyRot: -4, z: -0.47 },
  { t: 1.25, head: 'disbelief', headRot: -4, near: [22, 40], nearHand: 'open', far: [10, 20], lean: 0, bob: 0, bodyRot: 4, z: -0.56, squash: -0.08 },
  { t: 2.25, head: 'disbelief', headRot: -6, near: [26, 46], nearHand: 'open', far: [12, 30], lean: 0, bob: -6, bodyRot: 5, z: -0.58 },
  { t: 2.4, head: 'laugh', headRot: 10, near: [70, 18], nearHand: 'point', far: [30, 70], lean: 0, bob: 10, bodyRot: -2, z: -0.58 },
  { t: 3.55, head: 'laugh', headRot: 12, near: [74, 16], nearHand: 'point', far: [32, 74], lean: 0, bob: 14, bodyRot: -4, z: -0.58 },
  { t: 3.66, head: 'shock', headRot: -8, near: [30, 40], nearHand: 'spread', far: [30, 40], lean: 0, bob: 40, bodyRot: 2, z: -0.6, squash: 0.25 },
  { t: 3.82, head: 'shock', headRot: -10, near: [-128, -22], nearHand: 'spread', far: [132, 40], farHand: 'spread', lean: 0, bob: -60, bodyRot: 6, z: -0.72, squash: -0.3 },
  { t: 4.3, head: 'shock', headRot: -9, near: [-122, -18], nearHand: 'spread', far: [128, 36], farHand: 'spread', lean: 0, bob: -20, bodyRot: 7, z: -0.76, squash: -0.05 },
  { t: 4.75, head: 'fear', headRot: -6, near: [118, 110], nearHand: 'spread', far: [104, 96], farHand: 'spread', lean: 0, bob: 30, bodyRot: 11, z: -0.86, squash: 0.08 },
  { t: 6.55, head: 'fear', headRot: -9, near: [122, 114], nearHand: 'spread', far: [106, 100], farHand: 'spread', lean: 0, bob: 40, bodyRot: 13, z: -0.92 },
  { t: 7.25, head: 'fear', headRot: -5, near: [96, 96], nearHand: 'spread', far: [80, 80], farHand: 'spread', lean: 0, bob: 26, bodyRot: 9, z: -0.92 },
  { t: 7.45, head: 'blink', headRot: -4, near: [92, 94], nearHand: 'spread', far: [78, 78], farHand: 'spread', lean: 0, bob: 24, bodyRot: 8, z: -0.92 },
  { t: 7.6, head: 'fear', headRot: -3, near: [90, 92], nearHand: 'spread', far: [76, 76], farHand: 'spread', lean: 0, bob: 24, bodyRot: 8, z: -0.92 },
];
function poseAt(t) {
  let i = 0; while (i < K.length - 1 && K[i + 1].t <= t) i++; const a = K[i], b = K[Math.min(i + 1, K.length - 1)], k = a === b ? 1 : sstep((t - a.t) / (b.t - a.t));
  const p = {}; for (const key of Object.keys(a)) { const va = a[key], vb = b[key] ?? va; p[key] = Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : typeof va === 'number' ? lerp(va, vb, k) : va; }
  const prevHead = i > 0 ? K[i - 1].head : a.head; p.headScale = prevHead !== a.head ? 1 + 0.06 * Math.max(0, 1 - (t - a.t) * 9) : 1;   // swap pop
  // life: breathing + laughter shake + fear tremble
  p.bob += 6 * Math.sin(t * 2.4);
  if (a.head === 'laugh') { p.bob += 16 * Math.abs(Math.sin(t * 17)); p.bodyRot += 2.5 * Math.sin(t * 17); p.headRot += 4 * Math.sin(t * 17 + 0.6); }
  if (a.head === 'fear') { p.headRot += 1.6 * Math.sin(t * 61); p.bodyRot += 0.8 * Math.sin(t * 47); p.near[1] += 2 * Math.sin(t * 53); }
  return p;
}
// ---------- the clock's physical action ----------
function clockAt(t) {
  const p = clock0.clone(), r = clockR0.clone(); let rattle = 0;
  if (t > 1.0 && t < 1.25) { const k = ramp(t, 1.0, 1.25); p.y += Math.sin(k * Math.PI) * 0.02; r.z += Math.sin(k * Math.PI * 4) * 0.06; }   // a twitch
  if (t > 2.45 && t < 3.6) rattle = 0.25 * Math.sin(t * 90);                                                                          // ticking harder while he laughs
  if (t >= 3.6 && t < 4.55) { const k = ramp(t, 3.6, 4.55); p.y += 4 * 0.38 * k * (1 - k); p.x += -0.08 * k; p.z += 0.22 * k; r.y += k * 4.2; r.x += Math.sin(k * Math.PI) * 0.6; } // springs up, spins
  if (t >= 4.55) { const k = ramp(t, 4.55, 6.25); const hop = Math.abs(Math.sin(k * Math.PI * 4)) * 0.06 * (1 - k); p.x += -0.08 + 0.33 * k; p.z += 0.22 + 0.12 * k; p.y += hop; r.y += 4.2 + k * 1.5; rattle = 0.5 * Math.sin(t * 120); }
  if (t >= 6.25) { const k = ramp(t, 6.25, 6.6); p.y -= k * k * (T - 0.0) ; p.x += 0.1 * k; r.z += -k * 1.4; }                          // off the edge
  r.z += rattle * 0.12; r.x += rattle * 0.05; clock.position.copy(p); clock.rotation.copy(r);
}

window.renderFrame = (f) => {
  const t = f / FPS, sh = SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1], v = camKeys(sh.keys, t);
  for (const kk of KICKS) { const d = (t - kk.t) * FPS; if (d >= 0 && d < 8) { const s = (Math.floor(d) % 2 ? -1 : 1) * kk.a * (1 - d / 8); v.look = [v.look[0] + s, v.look[1] + s * 1.4, v.look[2]]; v.roll = (v.roll || 0) + s * 25; } }
  camera.position.set(...v.pos); camera.up.set(0, 1, 0); camera.lookAt(...v.look); camera.rotateZ((v.roll || 0) * Math.PI / 180); camera.fov = v.fov; camera.updateProjectionMatrix();
  bokeh.uniforms.focus.value = v.focus; bokeh.uniforms.aperture.value = v.ap ?? 0.0012;
  // puppet
  const p = poseAt(t); pg.clearRect(0, 0, CW, CH); drawPuppet(pg, PUP, p); card.tex.needsUpdate = true;
  card.mesh.position.set(PIPHEAD[0], 0, p.z); card.mesh.rotation.y = Math.atan2(camera.position.x - PIPHEAD[0], camera.position.z - p.z);
  contact.position.set(PIPHEAD[0], 0.004, p.z + 0.05);
  clockAt(t);
  SET.flame.scale.set(1, 2.2 + 0.3 * Math.sin(t * 23) + 0.2 * Math.sin(t * 37), 1); SET.lamp.intensity = 3.5 * (1 + 0.06 * Math.sin(t * 23)) * (t > 3.6 && t < 4.6 ? 1.0 + 0.25 * Math.sin(t * 60) : 1);
  SET.dust.rotation.y = t * 0.02; SET.dust.position.y = -t * 0.01;
  grade.uniforms.t.value = t; grade.uniforms.flash.value = t >= 3.6 && t < 3.72 ? 0.35 * (1 - ramp(t, 3.6, 3.72)) : 0;
  composer.render();
  return true;
};
window.ready = true;

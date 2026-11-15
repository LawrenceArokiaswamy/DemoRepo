// C+ CHARACTER RUNTIME (original). Loads the Blender-built, rigged glTF (studio/engine/blender/build_cplus_sailor.py),
// gives it the live C+ face, bold screen-constant outlines and a small, reusable posing + acting API:
//   const ch = await loadCPlus(THREE);  parent.add(ch.root);
//   ch.pose({ bones: { head: [pitch, yaw, roll], ... }, offset: { hips: [x, y, z] }, squash, face: EXP|name, blink, gaze, hand: 'relaxed'|'point' });
//   ch.update(camera)   // outline width + face texture
// Bone rotations are DELTAS in the character's own axes (x = pitch: + leans forward / nods down, y = yaw: + turns to the character's left,
// z = roll: + tilts toward the character's right... see AXES below), applied on top of the rest pose and inherited down the chain.
// Acting helpers: makeTimeline() (eased pose-to-pose targets) + springs (deterministic overshoot / overlap / follow-through).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXP, blendExp, drawCPlusFace, INK } from './cplus_face.js';
import { toonGradient } from './style/painterly.js';
export { EXP, blendExp };
export const BONES = ['hips', 'spine', 'chest', 'neck', 'head', 'crest', 'upperarmL', 'forearmL', 'handL', 'upperarmR', 'forearmR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR', 'cape1', 'cape2'];

export async function loadCPlus(THREE, o = {}) {
  const url = o.url || '/engine/web/characters/cplus_sailor.glb';
  const gltf = await new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.add(gltf.scene); root.name = 'CPlus';
  const B = {}; gltf.scene.traverse((n) => { if (n.isBone) B[n.name.replace(/[.\s]/g, '')] = n; });
  gltf.scene.updateMatrixWorld(true);
  const rest = {}; const inv = new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert();
  for (const [n, b] of Object.entries(B)) { const mw = new THREE.Matrix4().multiplyMatrices(inv, b.matrixWorld), q = new THREE.Quaternion(); mw.decompose(new THREE.Vector3(), q, new THREE.Vector3());
    rest[n] = { q: b.quaternion.clone(), p: b.position.clone(), w: q, wi: q.clone().invert() }; }
  // face: live canvas on the FaceShell
  const N = o.faceRes || 1024, fc = document.createElement('canvas'); fc.width = fc.height = N; const fg = fc.getContext('2d');
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.flipY = false; ftex.anisotropy = 8;
  const faceMat = new THREE.MeshToonMaterial({ map: ftex, gradientMap: toonGradient([0.72, 0.9, 1.0]), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // outlines: inverted hulls (skinned meshes get skinned hulls bound to the same skeleton); width set per frame in screen pixels
  const olU = { w: { value: 0.006 } }, olMat = new THREE.MeshBasicMaterial({ color: o.ink || INK, side: THREE.BackSide });
  olMat.onBeforeCompile = (sh) => { sh.uniforms.olW = olU.w; sh.vertexShader = 'uniform float olW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * olW;'); };
  const meshes = [], hands = { relaxed: [], point: [] }, hulls = [];
  const tone = o.tone ?? 0.7, seen = new Set();   // flat base colours are toned down so the toon key light (calibrated for textured sets) doesn't blow them out
  gltf.scene.traverse((m) => { if (!m.isMesh) return; meshes.push(m); for (const mt of [].concat(m.material)) if (mt && mt.color && !seen.has(mt)) { seen.add(mt); mt.color.multiplyScalar(tone); } });
  for (const m of meshes) {
    const nm = m.name; m.castShadow = !/Face/.test(nm); m.receiveShadow = true; m.frustumCulled = false;
    if (/FaceShell/.test(nm)) { m.material = faceMat; m.userData.keepMaterial = true; m.renderOrder = 3; continue; }
    if (/^HandR/.test(nm) || /^Hand_R|^Hand\.R/.test(nm)) hands.relaxed.push(m); if (/^HandPoint/.test(nm)) hands.point.push(m);
    if (o.outline === false || /^Band/.test(nm)) continue;
    let h; if (m.isSkinnedMesh) { h = new THREE.SkinnedMesh(m.geometry, olMat); h.bind(m.skeleton, m.bindMatrix); h.bindMode = m.bindMode; } else h = new THREE.Mesh(m.geometry, olMat);
    h.position.copy(m.position); h.quaternion.copy(m.quaternion); h.scale.copy(m.scale); h.userData.keepMaterial = true; h.frustumCulled = false; h.castShadow = false; h.name = nm + '_ol';
    m.parent.add(h); hulls.push({ h, src: m });
  }
  for (const { h, src } of hulls) src.userData.hull = h;
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
  let curFace = EXP.neutral, live = { blink: 0, gaze: [0, 0] }, faceKey = '';
  const ch = {
    root, body, bones: B, rest, face: { canvas: fc, tex: ftex, mat: faceMat }, height: 1.72,
    setHand(kind) { for (const m of hands.relaxed) { m.visible = kind !== 'point'; if (m.userData.hull) m.userData.hull.visible = m.visible; }
      for (const m of hands.point) { m.visible = kind === 'point'; if (m.userData.hull) m.userData.hull.visible = m.visible; } },
    // P.bones: { name: [x, y, z] radians (model axes, applied in rest frame) }, P.offset: { name: [x, y, z] metres }, P.squash: -1..1 (+ = stretch)
    pose(P = {}) {
      for (const n of Object.keys(B)) { const r = rest[n], d = P.bones && P.bones[n]; B[n].position.copy(r.p);
        if (!d) { B[n].quaternion.copy(r.q); continue; }
        _q.setFromEuler(_e.set(d[0] || 0, d[1] || 0, d[2] || 0, 'YXZ')); B[n].quaternion.copy(r.q).multiply(r.wi.clone().multiply(_q).multiply(r.w)); }
      for (const [n, off] of Object.entries(P.offset || {})) if (B[n]) { _v.set(...off).applyQuaternion(rest[n].wi).applyQuaternion(rest[n].q); B[n].position.add(_v); }
      const s = P.squash || 0; body.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5);
      if (P.face) curFace = typeof P.face === 'string' ? EXP[P.face] : P.face; live = { blink: P.blink || 0, gaze: P.gaze || [0, 0] };
      if (P.hand) ch.setHand(P.hand);
    },
    // per frame: outline width constant in screen pixels (px at a 1920-px-tall frame), face texture redraw when it changed
    update(camera, px = 3.2) {
      root.updateMatrixWorld(true); const d = camera.position.distanceTo(B.chest.getWorldPosition(_v));
      olU.w.value = Math.min(0.02, px * 2 * d * Math.tan(camera.fov * Math.PI / 360) / 1920);
      const key = JSON.stringify([curFace, live]); if (key !== faceKey) { drawCPlusFace(fg, curFace, live); ftex.needsUpdate = true; faceKey = key; }
    },
  };
  ch.setHand('relaxed'); ch.pose({});
  return ch;
}

// ---------------- acting helpers ----------------
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = { ss: (x) => x * x * (3 - 2 * x), sss: (x) => x * x * x * (x * (x * 6 - 15) + 10), out: (x) => 1 - (1 - x) * (1 - x) * (1 - x), in: (x) => x * x * x, lin: (x) => x };
// eased pose-to-pose channel: keys [[t, value(array), dur?, easeName?]] — the value starts moving at t and arrives at t + dur
export function channel(keys) {
  return (t) => { let v = keys[0][1].slice();
    for (let i = 1; i < keys.length; i++) { const [t0, val, dur = 0.3, e = 'sss'] = keys[i]; if (t < t0) break; const k = ease[e](cl((t - t0) / dur)); v = v.map((x, j) => x + (val[j] - x) * k); }
    return v; };
}
// deterministic spring bank: integrates every channel from t = 0 with a fixed step, so any frame renders identically in any order / batch.
// spec: { name: { target: (t) => array, f: Hz, z: damping ratio (<1 overshoots) } }; secondary: { name: { src, f, z, gain } } follows another
// channel's spring output and returns (lagged - source) * gain: the 'drag' used for crest / cape / loose parts.
export function springBank(spec, secondary = {}, dt = 1 / 240) {
  let st = null, n0 = 0;
  const init = () => { st = {}; for (const [k, s] of Object.entries(spec)) { const x = s.target(0); st[k] = { x: x.slice(), v: x.map(() => 0) }; }
    for (const [k, s] of Object.entries(secondary)) { const x = st[s.src].x; st[k] = { x: x.slice(), v: x.map(() => 0) }; } n0 = 0; };
  const step = (S, tgt, f, z) => { const w = 2 * Math.PI * f; for (let j = 0; j < S.x.length; j++) { const a = w * w * (tgt[j] - S.x[j]) - 2 * z * w * S.v[j]; S.v[j] += a * dt; S.x[j] += S.v[j] * dt; } };
  return (t) => { const n = Math.round(t / dt); if (!st || n < n0) init();
    for (; n0 < n; n0++) { const tt = (n0 + 1) * dt; for (const [k, s] of Object.entries(spec)) step(st[k], s.target(tt), s.f, s.z);
      for (const [k, s] of Object.entries(secondary)) step(st[k], st[s.src].x, s.f, s.z); }
    const out = {}; for (const k of Object.keys(spec)) out[k] = st[k].x.slice();
    for (const [k, s] of Object.entries(secondary)) out[k] = st[k].x.map((x, j) => (x - st[s.src].x[j]) * (s.gain ?? 1));
    return out; };
}
// blink: quick close (0.06 s), hold, slower open (0.1 s)
export function blinkAt(t, times, close = 0.06, hold = 0.03, open = 0.1) {
  let b = 0; for (const t0 of times) { const d = t - t0; if (d < 0 || d > close + hold + open) continue;
    b = Math.max(b, d < close ? ease.ss(d / close) : d < close + hold ? 1 : 1 - ease.ss((d - close - hold) / open)); } return b;
}

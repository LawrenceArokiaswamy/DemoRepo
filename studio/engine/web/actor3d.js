// 3D PEBBLE ACTOR (original, EXPERIMENTAL): a reusable 3D character in our own design language.
// Pebble-shaped body + rounded head with our 2D face drawing (chargen drawFace) as a decal, chunky coloured sleeves,
// mitten hands, short legs, ink outlines (inverted hull), cel shading (toon gradient), real cast/received shadows.
// Pose (all optional): { pos:[x,y,z], yaw, lean, side, bob, headYaw, headPitch, face (FACE preset or object),
//                        handL:[x,y,z] / handR:[x,y,z] (in the actor's PARENT space; 2-bone IK), squash }
import * as THREE from 'three';
import { drawFace, normalizeSpec, FACE } from './chargen.js';
import { toonGradient } from './style/painterly.js';

const INK = '#2a1424';
export const toonMat = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...o });
function outlined(mesh, w = 0.012) {   // inverted hull: back faces pushed out along normals, drawn in ink
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${w.toFixed(4)};`); };
  m.customProgramCacheKey = () => 'hull' + w; const o = new THREE.Mesh(mesh.geometry, m); o.userData.keepMaterial = true; o.userData.hull = true; mesh.add(o); mesh.userData.hull = o;
  mesh.castShadow = mesh.receiveShadow = true; mesh.userData.keepMaterial = true; return mesh;
}
const part = (geo, color, w, o) => outlined(new THREE.Mesh(geo, toonMat(color, o)), w);
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

export function makeActor3D(spec, opts = {}) {
  const S = normalizeSpec(spec), O = S.outfit, H = (opts.height ?? 1.62) * (S.height || 1), k = H / 1.62;
  const root = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  root.add(hips); hips.position.y = 0.42 * k; hips.add(torso); torso.position.y = 0; torso.add(head); head.position.y = 0.6 * k;
  // legs + sandals
  for (const s of [-1, 1]) { const leg = part(new THREE.CapsuleGeometry(0.075 * k, 0.24 * k, 6, 14), O.legs === 'skin' ? S.skin : O.legs, 0.01);
    leg.position.set(0.11 * s * k, 0.21 * k, 0); root.add(leg);
    const foot = part(new THREE.SphereGeometry(0.085 * k, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), O.boots || '#5a3622', 0.01); foot.scale.set(1, 0.7, 1.45); foot.position.set(0.11 * s * k, 0.0, 0.04 * k); root.add(foot); }
  // pebble body: skirt (color2) + upper (armour / tunic colour) + belt
  const skirt = part(lathe([[0.001, -0.06], [0.25, -0.06], [0.3, 0.02], [0.29, 0.12], [0.26, 0.2], [0.001, 0.2]].map(([r, y]) => [r * k, y * k])), O.top === 'armor' ? O.color2 : O.color, 0.012); torso.add(skirt);
  const upper = part(lathe([[0.001, 0.16], [0.27, 0.16], [0.285, 0.3], [0.25, 0.46], [0.17, 0.58], [0.001, 0.61]].map(([r, y]) => [r * k, y * k])), O.color, 0.012); torso.add(upper);
  if (O.top === 'armor') for (const y of [0.24, 0.33, 0.42]) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.278 * k * (1 - (y - 0.24) * 0.6), 0.008 * k, 6, 36), new THREE.MeshBasicMaterial({ color: INK })); band.rotation.x = Math.PI / 2; band.position.y = y * k; band.userData.keepMaterial = true; torso.add(band); }
  if (O.belt) { const belt = part(new THREE.TorusGeometry(0.27 * k, 0.03 * k, 8, 36), '#5a3622', 0.006); belt.rotation.x = Math.PI / 2; belt.position.y = 0.17 * k; torso.add(belt); }
  // head: rounded pebble, ears, helmet with crest
  const R = 0.27 * k * (S.head.width || 1), skull = part(new THREE.SphereGeometry(R, 40, 28), S.skin, 0.013); skull.scale.set(1, 0.96, 0.9); skull.position.y = R * 0.92; head.add(skull);
  for (const s of [-1, 1]) { const ear = part(new THREE.SphereGeometry(0.055 * k * (S.ears || 1), 12, 10), S.skin, 0.008); ear.scale.set(0.5, 1, 0.8); ear.position.set(s * R * 0.98, R * 0.9, 0); head.add(ear); }
  const hw = S.headwear || {};
  if (hw.type === 'helmet') { const hc = hw.color || '#b8a070';
    const cap = part(new THREE.SphereGeometry(R * 1.04, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.46), hc, 0.012); cap.scale.set(1, 0.98, 0.94); cap.position.y = R * 0.98; head.add(cap);
    const brim = part(new THREE.TorusGeometry(R * 1.02, 0.022 * k, 8, 40), hc, 0.006); brim.rotation.x = Math.PI / 2; brim.scale.set(1, 0.94, 1); brim.position.y = R * 1.08; head.add(brim);
    const crest = part(new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.07 * k, 24, 1, false, -Math.PI / 2, Math.PI), '#a8322c', 0.008); crest.rotation.z = Math.PI / 2; crest.rotation.y = Math.PI / 2; crest.position.y = R * 1.95; head.add(crest);
    if (hw.cheek) for (const s of [-1, 1]) { const ch = part(new THREE.BoxGeometry(0.03 * k, 0.17 * k, 0.12 * k), hc, 0.006); ch.position.set(s * R * 0.93, R * 0.68, 0.03 * k); ch.rotation.z = s * 0.12; head.add(ch); } }
  // face decal: our 2D face drawing on a front patch of the head
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; const fg = fc.getContext('2d'), ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  const decal = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 40, 28, Math.PI / 2 - 1.05, 2.1, 0.62, 1.75), toonMat('#ffffff', { map: ftex, transparent: true, alphaTest: 0.05 }));
  decal.scale.copy(skull.scale); decal.position.copy(skull.position); decal.userData.keepMaterial = true; decal.receiveShadow = true; head.add(decal);
  let faceKey = '';
  const setFace = (F) => { const key = JSON.stringify(F); if (key === faceKey) return; faceKey = key; fg.clearRect(0, 0, 512, 512);
    fg.save(); fg.translate(256, 250); fg.scale(0.88, 0.88); fg.translate(-300, -300); drawFace(fg, S, F, 300, 300, 0, 1.0); fg.restore(); ftex.needsUpdate = true; };
  setFace(FACE.neutral);
  // arms: sleeve tubes (shoulder -> elbow -> wrist) rebuilt per pose, mitten hands
  const arm = {}; for (const s of ['L', 'R']) { const sl = part(new THREE.BufferGeometry(), O.top === 'armor' ? O.color2 : O.color, 0.01); torso.add(sl);
    const hand = part(new THREE.SphereGeometry(0.068 * k, 16, 12), S.skin, 0.009); hand.scale.set(1, 0.9, 1.1); torso.add(hand); arm[s] = { sl, hand }; }
  const SH = { L: new THREE.Vector3(0.235 * k, 0.5 * k, 0), R: new THREE.Vector3(-0.235 * k, 0.5 * k, 0) }, A1 = 0.27 * k, A2 = 0.27 * k;
  const rest = { L: new THREE.Vector3(0.36 * k, 0.05 * k, 0.04 * k), R: new THREE.Vector3(-0.36 * k, 0.05 * k, 0.04 * k) };
  function solveArm(s, targetTorso) {
    const sh = SH[s], t = targetTorso.clone(), d = t.clone().sub(sh), L = Math.min(d.length(), A1 + A2 - 1e-3), dir = d.normalize();
    const cosA = (A1 * A1 + L * L - A2 * A2) / (2 * A1 * L), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const pole = new THREE.Vector3(s === 'L' ? 0.5 : -0.5, -1, -0.6).normalize(); const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const elbow = sh.clone().add(dir.clone().multiplyScalar(A1 * cosA)).add(perp.multiplyScalar(A1 * sinA)), wrist = sh.clone().add(dir.clone().multiplyScalar(L));
    const curve = new THREE.CatmullRomCurve3([sh.clone().add(new THREE.Vector3(0, 0.02 * k, 0)), sh.clone().lerp(elbow, 0.5), elbow, elbow.clone().lerp(wrist, 0.5), wrist]);
    const g = new THREE.TubeGeometry(curve, 16, 0.062 * k, 10, false); const a = arm[s]; a.sl.geometry.dispose(); a.sl.geometry = g; a.sl.userData.hull.geometry = g; a.hand.position.copy(wrist); }
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3();
  function setPose(P = {}) {
    if (P.pos) root.position.set(...P.pos); root.rotation.y = P.yaw ?? root.rotation.y;
    const sq = P.squash || 0; hips.scale.set(1 + sq * 0.08, 1 - sq * 0.1, 1 + sq * 0.08); hips.position.y = 0.42 * k + (P.bob || 0) * 0.04 * k;
    torso.rotation.set((P.lean || 0) * Math.PI / 180, 0, (P.side || 0) * Math.PI / 180);
    head.rotation.set(-(P.headPitch || 0), P.headYaw || 0, (P.headTilt || 0) * Math.PI / 180, 'YXZ');
    if (P.face) setFace(typeof P.face === 'string' ? FACE[P.face] : P.face);
    root.updateMatrixWorld(true); m4.copy(torso.matrixWorld).invert();
    const parentW = root.parent ? root.parent.matrixWorld : new THREE.Matrix4();
    for (const s of ['L', 'R']) { const h = P['hand' + s]; solveArm(s, h ? v.set(...h).applyMatrix4(parentW).applyMatrix4(m4).clone() : rest[s]); }
  }
  setPose({});
  return { root, hips, torso, head, setPose, setFace, spec: S, height: H };
}

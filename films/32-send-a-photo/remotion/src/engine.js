// Film 32 "How Do I Send a Photo?" — three.js engine (pure function of time) used by the Remotion composition.
// Characters: Microsoft Rocketbox avatars (MIT) with their own motion capture, ARKit face shapes, and procedural layers on top
// (two-bone arm IK for hugs and hands, head/eye aim, spine lean, blinks). Sets: Poly Haven CC0 models, textures and HDRIs.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { staticFile } from 'remotion';

export const W = 1080, H = 1920;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a)); const ss = x => (x = clamp(x), x * x * (3 - 2 * x));
const sm = (t, a, b) => ss(seg(t, a, b));
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

let R, composer, bokeh, bloom, grade, camera, scene, ENV = {}, SETS = {}, CH = {}, ready = null;
const gl = new GLTFLoader(), tl = new THREE.TextureLoader(), rl = new RGBELoader();
const load = (l, u) => new Promise((res, rej) => l.load(u, res, undefined, rej));

// ---------- materials ----------
async function texSet(name, rep = [1, 1], o = {}) {
  const f = k => staticFile(`ph/tex/${name}_${k}.jpg`);
  const [d, n, r] = await Promise.all([load(tl, f('diff')), load(tl, f('nor')), load(tl, f('rough'))]);
  d.colorSpace = THREE.SRGBColorSpace;
  for (const t of [d, n, r]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; }
  return new THREE.MeshStandardMaterial({ map: d, normalMap: n, roughnessMap: r, roughness: 1, color: o.color || '#ffffff', normalScale: new THREE.Vector2(o.ns || 1, o.ns || 1) });
}
const M = (c, r = .8, m = 0, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...x });
function box(w, h, d, mat, p, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
function cyl(r1, r2, h, mat, p, x = 0, y = 0, z = 0, s = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, s), mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
function uvBox(w, h, d, mat, p, x, y, z, tile = 1) { // box with UVs in metres (textures tile at real scale)
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv, pos = g.attributes.position, nor = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)); const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    if (ny > .5) uv.setXY(i, px / tile, pz / tile); else if (nx > .5) uv.setXY(i, pz / tile, py / tile); else uv.setXY(i, px / tile, py / tile); }
  const o = new THREE.Mesh(g, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o;
}
async function model(id, p, x = 0, y = 0, z = 0, ry = 0, s = 1) {
  const g = (await load(gl, staticFile(`ph/models/${id}/${id}.gltf`))).scene; g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 8; } }); p.add(g); return g;
}

// ---------- characters ----------
async function character(file, o = {}) {
  const g = await load(gl, staticFile(file)); const root = g.scene; const C = { root, clips: {}, bones: {}, morphs: [], o };
  root.traverse(x => {
    if (x.isBone) C.bones[x.name] = x;
    if (x.isMesh) {
      x.castShadow = x.receiveShadow = true; x.frustumCulled = false;
      const m = x.material; m.envMapIntensity = .9;
      if (m.name === 'hair') { m.alphaHash = true; m.transparent = false; m.alphaTest = 0; m.roughness = .55; m.side = THREE.DoubleSide; if (o.hair) m.color.set(o.hair); }
      if (m.name === 'skin') { m.roughness = .58; if (o.skin) m.color.set(o.skin); }
      if (m.name === 'body' && o.body) m.color.set(o.body);
      if (x.morphTargetDictionary) C.morphs.push(x);
    }
  });
  C.mixer = new THREE.AnimationMixer(root);
  for (const a of g.animations) { a.tracks = a.tracks.filter(t => !/Eye|Blink|brow|Lip|Mouth|Jaw|Cheek|Caninus|Masseter|Tongue|Nose/i.test(t.name) || /Bip01_Head|Bip01_Neck/.test(t.name)); const ac = C.mixer.clipAction(a); ac.play(); ac.weight = 0; C.clips[a.name] = { a, ac }; }
  C.b = n => C.bones['Bip01_' + n.replace(/ /g, '_')];
  return C;
}
// pose = list of [clip, time, weight]; time wraps; then procedural layers
function pose(C, layers) {
  for (const k in C.clips) C.clips[k].ac.weight = 0;
  let tot = 0; for (const [, , w] of layers) tot += w;
  for (const [n, t, w] of layers) { const c = C.clips[n]; c.ac.weight = w / tot; c.ac.time = ((t % c.a.duration) + c.a.duration) % c.a.duration; }
  C.mixer.update(0); C.root.updateMatrixWorld(true);
}
function face(C, f) { // ARKit names; f: {smile, sad, blink, browUp, frown, jaw, squint, cry}
  const v = {};
  const s = f.smile || 0, sad = f.sad || 0;
  v.mouthSmileLeft = v.mouthSmileRight = clamp(s); v.cheekSquintLeft = v.cheekSquintRight = clamp(s * .6 + (f.squint || 0));
  v.mouthFrownLeft = v.mouthFrownRight = clamp(sad * .7 + (f.frown || 0)); v.browInnerUp = clamp(sad * .8 + (f.browUp || 0));
  v.mouthPressLeft = v.mouthPressRight = clamp(sad * .35); v.mouthStretchLeft = v.mouthStretchRight = clamp((f.cry || 0) * .5);
  v.eyeBlinkLeft = v.eyeBlinkRight = clamp((f.blink || 0) + (f.lids || 0) * (1 - (f.blink || 0)));
  v.eyeSquintLeft = v.eyeSquintRight = clamp(s * .35 + (f.squint || 0) * .6); v.jawOpen = clamp(f.jaw || 0); v.mouthRollLower = clamp((f.roll || 0));
  v.browDownLeft = v.browDownRight = clamp(f.browDown || 0); v.mouthShrugLower = clamp(sad * .3 + (f.cry || 0) * .4);
  for (const m of C.morphs) { const d = m.morphTargetDictionary; for (const k in d) m.morphTargetInfluences[d[k]] = v[k] || 0; }
}
export const blinkAt = (t, seed) => { const p = (t + hash(seed) * 4) % (2.6 + hash(seed + 1) * 2); return p < .16 ? Math.sin(p / .16 * Math.PI) : 0; };
// rotate a bone so that (in world space) direction from it to `childPos` points at `target`, blended by w
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
function aimBone(bone, from, to, w = 1) { // from, to: world directions
  if (w <= 0) return; const dq = _q.setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  const wq = bone.getWorldQuaternion(new THREE.Quaternion()); const nq = dq.multiply(wq);
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); const local = pq.multiply(nq);
  bone.quaternion.slerp(local, w); bone.updateMatrixWorld(true);
}
const wp = b => b.getWorldPosition(new THREE.Vector3());
// two-bone IK: upper/fore/hand bones, target world pos, pole world pos
function ik(C, side, target, pole, w = 1) {
  if (w <= 0) return; const up = C.b(`${side} UpperArm`), fo = C.b(`${side} Forearm`), ha = C.b(`${side} Hand`);
  const S = wp(up), E = wp(fo), Wr = wp(ha); const a = S.distanceTo(E), b = E.distanceTo(Wr);
  const T = target.clone(); const d = Math.min(T.distanceTo(S), (a + b) * .995); const dir = T.clone().sub(S).normalize();
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1); const along = a * cosA, h = Math.sqrt(Math.max(0, a * a - along * along));
  const pv = pole.clone().sub(S); pv.sub(dir.clone().multiplyScalar(pv.dot(dir))).normalize();
  const Ed = S.clone().addScaledVector(dir, along).addScaledVector(pv, h);
  aimBone(up, E.clone().sub(S), Ed.clone().sub(S), w);
  const E2 = wp(fo), W2 = wp(ha); const Td = S.clone().addScaledVector(dir, d);
  aimBone(fo, W2.clone().sub(E2), Td.clone().sub(E2), w);
}
function lookAt(C, target, w = 1, eyes = true) { // head + neck share the turn; eyes do the rest
  const head = C.b('Head'), neck = C.b('Neck');
  for (const [b, k] of [[neck, .4], [head, .75]]) {
    const hp = wp(head); const fwd = V(0, 0, 1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion())); // Rocketbox head: +Z? measured below
    const cur = C.faceDir(); const want = target.clone().sub(hp).normalize(); aimBone(b, cur, cur.clone().lerp(want, 1).normalize(), w * k);
  }
  if (eyes) for (const s of ['LEye', 'REye']) { const e = C.b(s); if (!e) continue; const cur = C.faceDir(); const want = target.clone().sub(wp(e)).normalize(); aimBone(e, cur, want, w * .9); }
}
function rotLocal(b, x, y, z, w = 1) { if (!b) return; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * w, y * w, z * w)); b.quaternion.multiply(q); b.updateMatrixWorld(true); }
function rotWorld(b, axis, ang) { const wq = b.getWorldQuaternion(new THREE.Quaternion()); const nq = new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(wq);
  b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(nq)); b.updateMatrixWorld(true); }

// ---------- sets ----------
async function buildPorch() {
  const g = new THREE.Group(); scene.add(g); SETS.porch = g;
  const deck = await texSet('wood_floor_deck', [1, 1], { color: '#d8c8b0' }); const sid = await texSet('weathered_plank_siding', [1, 1], { color: '#f2ece2' });
  const grass = await texSet('leafy_grass', [1, 1], { color: '#a8a070' }); const roof = await texSet('roof_planks', [1, 1], { color: '#e8e0d4' }); const grav = await texSet('gravel_road', [1, 1]);
  uvBox(7, .12, 3.2, deck, g, 0, -.06, -.6, 1.6);                   // porch floor (front edge at z = 1.0)
  uvBox(9, 3.6, .2, sid, g, 0, 1.68, -2.3, 1.8);                     // house wall
  uvBox(7.4, .08, 3.6, roof, g, 0, 2.95, -.7, 2);                     // porch ceiling
  for (const x of [-3.2, -1.1, 1.1, 3.2]) cyl(.07, .08, 3, M('#efe9de', .6), g, x, 1.45, .85, 12); // posts
  const rail = M('#ebe4d8', .65); for (const x0 of [-3.2, 1.1]) { box(2.1, .06, .08, rail, g, x0 + 1.05, .92, .85); box(2.1, .05, .06, rail, g, x0 + 1.05, .12, .85); for (let k = 0; k < 13; k++) box(.035, .8, .035, rail, g, x0 + .1 + k * .16, .52, .85); }
  for (let k = 0; k < 3; k++) uvBox(1.8, .12, .3, deck, g, 0, -.18 - k * .16, 1.15 + k * .3, 1.6); // steps
  // window with warm light behind it + door
  const frame = M('#f4efe6', .55); box(1.3, 1.5, .08, frame, g, -2, 1.55, -2.17); const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35), new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: '#ffb25c', emissiveIntensity: 1.6, roughness: .2 })); glass.position.set(-2, 1.55, -2.12); g.add(glass);
  box(1.0, 2.1, .08, M('#6b4a32', .5), g, 1.4, 1.05, -2.16); box(.04, .04, .06, M('#c9a24a', .3, .8), g, 1.05, 1.0, -2.1);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), new THREE.MeshStandardMaterial({ emissive: '#ffcc88', emissiveIntensity: 4 })); lamp.position.set(.6, 2.3, -2.1); g.add(lamp);
  // yard + drive
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), grass); grass.map.repeat.set(200, 200); grass.normalMap.repeat.set(200, 200); grass.roughnessMap.repeat.set(200, 200);
  gr.rotation.x = -Math.PI / 2; gr.position.y = -.66; gr.receiveShadow = true; g.add(gr);
  const dr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), grav); grav.map.repeat.set(2, 30); grav.normalMap.repeat.set(2, 30); dr.rotation.x = -Math.PI / 2; dr.position.set(4.5, -.65, 25); dr.receiveShadow = true; g.add(dr);
  const rc = await model('Rockingchair_01', g, -2.3, 0, -1.4, .5); await model('potted_plant_02', g, 2.6, 0, .4, 0, 1.1); await model('wicker_basket_01', g, -1.4, 0, -1.9);
  // a few soft trees far away (billboard-ish cones) to break the horizon
  const tm = M('#3d4a2a', .9); for (let i = 0; i < 14; i++) { const x = -60 + i * 9 + hash(i) * 5, z = -40 - hash(i + 3) * 30; const t = cyl(0, 2.5 + hash(i) * 1.5, 7 + hash(i + 7) * 4, tm, g, x, 3, z, 10); t.castShadow = false; }
}
async function buildLiving() {
  const g = new THREE.Group(); scene.add(g); SETS.living = g;
  const floor = await texSet('old_wooden_floor_02', [1, 1], { color: '#c8b49a' }); const wall = await texSet('painted_plaster_wall', [1, 1], { color: '#d9c7a8' });
  const rug = await texSet('fabric_pattern_07', [1, 1], { color: '#c79a7a' });
  uvBox(8, .1, 8, floor, g, 0, -.05, 0, 1.4); uvBox(8, 3, .15, wall, g, 0, 1.5, -1.6, 2); uvBox(.15, 3, 8, wall, g, -3.2, 1.5, 0, 2); uvBox(.15, 3, 8, wall, g, 3.2, 1.5, 0, 2);
  uvBox(8, .1, 8, M('#e8dccb', .9), g, 0, 3, 0, 2);
  const rm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), rug); rug.map.repeat.set(1.3, .9); rug.normalMap.repeat.set(1.3, .9); rm.rotation.x = -Math.PI / 2; rm.position.set(0, .006, .7); rm.receiveShadow = true; g.add(rm);
  SETS.sofa = await model('Sofa_01', g, 0, 0, -1.05, 0, 1);
  await model('throw_pillows_01', g, -.95, .45, -1.15, .3, .9);
  SETS.table = await model('CoffeeTable_01', g, 0, 0, .55, 0, 1);
  await model('wooden_bookshelf_worn', g, 2.3, 0, -1.35, 0, 1); await model('mantel_clock_01', g, 2.3, 1.02, -1.35, 0, 1.2);
  await model('potted_plant_02', g, -2.4, 0, -1.2, 0, 1.2);
  await model('hanging_picture_frame_01', g, -.6, 1.75, -1.52, 0, 1.4); await model('hanging_picture_frame_02', g, .55, 1.65, -1.52, 0, 1.2);
  await model('standing_picture_frame_01', g, -.3, .43, .45, .3, 1.3);
  // side table + lamp (warm key light)
  box(.5, .55, .5, M('#5a3c26', .55), g, 1.35, .275, -1.0); cyl(.08, .11, .3, M('#c9b79a', .4), g, 1.35, .7, -1.0);
  const shade = cyl(.17, .24, .3, new THREE.MeshStandardMaterial({ color: '#f3dcb0', emissive: '#ffbf73', emissiveIntensity: 2.2, roughness: .9, side: THREE.DoubleSide }), g, 1.35, 1.0, -1.0, 32); shade.castShadow = false;
  SETS.lampL = new THREE.PointLight('#ffb36b', 6, 9, 1.6); SETS.lampL.position.set(1.35, 1.0, -1.0); SETS.lampL.castShadow = true; SETS.lampL.shadow.mapSize.set(1024, 1024); SETS.lampL.shadow.radius = 6; SETS.lampL.shadow.bias = -.002; g.add(SETS.lampL);
  // window (dusk blue) on the left wall
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.5), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#4a6a9a', emissiveIntensity: .9 })); win.position.set(-3.11, 1.6, -.2); win.rotation.y = Math.PI / 2; g.add(win);
  box(.06, 1.6, 1.5, M('#efe6d6', .6), g, -3.12, 1.6, -.2).material.transparent = false;
  SETS.winL = new THREE.SpotLight('#7a9ad0', 8, 10, .9, .8, 1.5); SETS.winL.position.set(-3.0, 1.9, -.2); SETS.winL.target.position.set(0, .6, -.6); g.add(SETS.winL, SETS.winL.target);
}

// ---------- props held by characters ----------
function makePhone() { const g = new THREE.Group(); box(.072, .15, .009, M('#1b1d22', .35, .3), g); const s = new THREE.Mesh(new THREE.PlaneGeometry(.064, .138), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#9ec4ff', emissiveIntensity: .25, roughness: .15 })); s.position.z = .0051; g.add(s); g.traverse(o => o.castShadow = true); return g; }
function attach(C, boneName, obj, pos, rot) { const b = C.b(boneName); b.add(obj); obj.position.copy(pos); obj.rotation.set(...rot); obj.scale.setScalar(1 / b.getWorldScale(new THREE.Vector3()).x); return obj; }

// ---------- init ----------
export function init(canvas) {
  if (ready) return ready;
  ready = (async () => {
    R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.toneMapping = THREE.AgXToneMapping; R.toneMappingExposure = 1; R.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(30, W / H, .05, 600);
    const pm = new THREE.PMREMGenerator(R);
    for (const n of ['farm_sunset', 'kiara_9_dusk']) { const h = await load(rl, staticFile(`ph/hdri/${n}.hdr`)); h.mapping = THREE.EquirectangularReflectionMapping; ENV[n] = { bg: h, env: pm.fromEquirectangular(h).texture }; }
    ENV.sun = new THREE.DirectionalLight('#ffc48a', 3); ENV.sun.castShadow = true; ENV.sun.shadow.mapSize.set(2048, 2048); ENV.sun.shadow.radius = 4; ENV.sun.shadow.bias = -.0004; ENV.sun.shadow.normalBias = .02;
    const sc = ENV.sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 40; scene.add(ENV.sun, ENV.sun.target);
    await buildPorch(); await buildLiving();
    CH.dad = await character('dad.glb', { hair: '#d8d4cc' }); CH.son = await character('son.glb', {});
    for (const C of Object.values(CH)) { scene.add(C.root); const hb = C.b('Head'); // which local axis of the head points out of the face? nose is in front
      const nose = C.bones['Bip01_MNose']; C.root.updateMatrixWorld(true); const off = wp(nose).sub(wp(hb)); off.y = 0; C.noseLocal = off.normalize().applyQuaternion(hb.getWorldQuaternion(new THREE.Quaternion()).invert());
      C.faceDir = () => C.noseLocal.clone().applyQuaternion(hb.getWorldQuaternion(new THREE.Quaternion())).normalize(); }
    CH.dad.phone = attach(CH.dad, 'R Hand', makePhone(), V(0, 0, 0), [0, 0, 0]); CH.son.phone = attach(CH.son, 'L Hand', makePhone(), V(0, 0, 0), [0, 0, 0]);
    SETS.laptop = await model('classic_laptop', SETS.living, 0, 0, 0, 0, 1);
    composer = new EffectComposer(R, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 2, aperture: .002, maxblur: .006 }); composer.addPass(bokeh);
    bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .35, .6, .9); composer.addPass(bloom);
    composer.addPass(new OutputPass());
    grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uWarm: { value: .0 }, uVig: { value: .45 }, uLift: { value: .02 }, uSat: { value: 1 }, uFade: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uWarm,uVig,uLift,uSat,uFade; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,uSat);
          c=c*(1.-uLift)+uLift*vec3(.9,.95,1.1); c*=vec3(1.+uWarm*.10,1.+uWarm*.02,1.-uWarm*.10);
          vec2 q=vUv-.5; q.x*=.75; c*=1.-uVig*smoothstep(.25,.85,length(q)*1.35);
          c+= (h(vUv*vec2(1080.,1920.)+fract(uT*7.13))-.5)*.035; c*=1.-uFade; gl_FragColor=vec4(c,1.); }` });
    composer.addPass(grade);
  })();
  return ready;
}

// ---------- shots ----------
function hide() { for (const k of ['porch', 'living']) SETS[k].visible = false; for (const C of Object.values(CH)) { C.root.visible = false; C.phone.visible = false; } SETS.laptop.visible = false; }
function cam(p, l, fov, focus, ap) { camera.position.copy(p); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix(); bokeh.uniforms.focus.value = focus; bokeh.uniforms.aperture.value = ap; bokeh.uniforms.maxblur.value = .012; }
function outdoor(name, sunPos, sunCol, sunI, envI, bgI = 1) { scene.background = ENV[name].bg; scene.environment = ENV[name].env; scene.backgroundIntensity = bgI; scene.environmentIntensity = envI; scene.backgroundBlurriness = .02;
  ENV.sun.visible = true; ENV.sun.position.copy(sunPos); ENV.sun.target.position.set(0, 1, 0); ENV.sun.color.set(sunCol); ENV.sun.intensity = sunI; scene.fog = new THREE.Fog('#f0b27a', 40, 300); }
function indoor() { scene.background = new THREE.Color('#000'); scene.environment = ENV.kiara_9_dusk.env; scene.environmentIntensity = .22; ENV.sun.visible = false; scene.fog = null; }

// SHOT 1 (0-6 s): porch at golden hour — the son climbs onto the porch; Dad, beaming, pulls him into a hug. The son hugs back with one arm,
// the phone still in his other hand.
function shotHug(t) {
  SETS.porch.visible = true; outdoor('farm_sunset', V(-6, 4.2, -9), '#ffb877', 3.2, .55, .9);
  const D = CH.dad, S = CH.son; D.root.visible = S.root.visible = true; S.phone.visible = true;
  const meet = 2.0, k = sm(t, meet - .9, meet + .5); // arms come up and close
  // son walks the last two steps in (walk clip), then stops
  const walkK = 1 - sm(t, meet - .4, meet + .1); const sz = lerp(1.25, .36, sm(t, 0, meet + .1));
  S.root.position.set(.05, 0, sz); S.root.rotation.y = Math.PI; D.root.position.set(0, 0, 0); D.root.rotation.y = 0;
  pose(S, [['m_walk_slow_01', t * 1.0, walkK + .001], ['m_idle_neutral_01', t, 1 - walkK + .001]]);
  pose(D, [['m_idle_breathe_01', t, 1]]);
  // lean into each other
  const lean = k * .14; rotWorld(D.b('Spine1'), V(1, 0, 0), lean); rotWorld(S.b('Spine1'), V(1, 0, 0), -lean * .8);
  rotWorld(D.b('Head'), V(0, 0, 1), -k * .25); rotWorld(D.b('Head'), V(0, 1, 0), k * .35); rotWorld(D.b('Head'), V(1, 0, 0), k * .12);
  rotWorld(S.b('Head'), V(0, 1, 0), k * .3);
  // Dad: both arms around the son's back (shoulder blades), elbows out
  const sB = wp(S.b('Spine2')); const back = sB.clone().add(V(0, .02, .16));
  ik(D, 'R', back.clone().add(V(-.13, .06, 0)), wp(D.b('R Forearm')).add(V(-.5, -.2, .3)), k);
  ik(D, 'L', back.clone().add(V(.15, -.08, 0)), wp(D.b('L Forearm')).add(V(.5, -.3, .3)), k);
  // son: right arm loosely around Dad; left hand keeps the phone low, screen glancing up
  const dB = wp(D.b('Spine2')).add(V(0, 0, -.14)); ik(S, 'R', dB.clone().add(V(-.12, .02, 0)), wp(S.b('R Forearm')).add(V(-.5, -.3, -.3)), k * .85);
  S.phone.position.set(.02, -.06, .03); S.phone.rotation.set(1.3, 0, 1.6);
  const bl = blinkAt(t, 3); face(D, { smile: .25 + k * .55, blink: k > .5 ? .92 : bl, browUp: k * .35, squint: k * .2 }); face(S, { smile: .15, blink: blinkAt(t, 9) });
  // camera: 3/4 over the son's shoulder onto Dad's face, slow push
  const pz = lerp(3.1, 2.55, ss(t / 6)); cam(V(-1.15, 1.5, pz), V(.02, 1.5, .1), 30, wp(D.b('Head')).distanceTo(camera.position), .0016);
  grade.uniforms.uWarm.value = .5; grade.uniforms.uLift.value = .03;
}
// SHOT 2 (6-12 s): the couch, evening lamp light. The son types on his laptop. Dad sits close, holds out his old phone: "Son... how do I send a photo?"
function shotCouch(t, close) {
  SETS.living.visible = true; indoor(); const D = CH.dad, S = CH.son; D.root.visible = S.root.visible = true; D.phone.visible = true; SETS.laptop.visible = true;
  const seatY = -.03; S.root.position.set(-.38, seatY, -.78); S.root.rotation.y = 0; D.root.position.set(.36, seatY, -.8); D.root.rotation.y = -.28;
  pose(S, [['m_sit_chair_idle_neutral_01', t + 3, 1]]); pose(D, [['m_sit_chair_breathe_01', t, 1]]);
  // son: hands on the laptop keyboard on his knees, head down to the screen
  const lap = wp(S.b('L Thigh')).lerp(wp(S.b('R Thigh')), .5); lap.y += .1; lap.z += .3;
  SETS.laptop.position.copy(lap).add(V(0, -.0, .02)); SETS.laptop.rotation.set(0, Math.PI, 0); SETS.laptop.scale.setScalar(1);
  const typ = n => .012 * Math.sin(t * 17 + n) * (Math.sin(t * 2.3 + n) > 0 ? 1 : 0);
  ik(S, 'L', lap.clone().add(V(.09, .03 + typ(1), .05)), wp(S.b('L Forearm')).add(V(.4, -.3, 0)), 1);
  ik(S, 'R', lap.clone().add(V(-.09, .03 + typ(2), .05)), wp(S.b('R Forearm')).add(V(-.4, -.3, 0)), 1);
  rotWorld(S.b('Neck'), V(1, 0, 0), .32); rotWorld(S.b('Head'), V(1, 0, 0), .18);
  // Dad: leans in, right hand offers the phone toward the son at chest height, head turned to him
  const ask = sm(t, .6, 1.8); rotWorld(D.b('Spine1'), V(0, 0, 1), ask * .1); rotWorld(D.b('Spine1'), V(1, 0, 0), ask * .1);
  const sH = wp(S.b('Head')); const offer = wp(D.b('Spine2')).lerp(sH, .48); offer.y = lerp(wp(D.b('Spine2')).y - .05, sH.y - .32, 1); offer.z += .16;
  ik(D, 'R', offer, wp(D.b('R Forearm')).add(V(.2, -.5, .2)), ask);
  D.phone.position.set(.08, .02, .02); D.phone.rotation.set(0, -1.4, 1.5);
  lookAt(D, sH, .9 * ask + .1); lookAt(S, SETS.laptop.position.clone().add(V(0, .1, 0)), .6);
  const fade = sm(t, 4.0, 5.2); // no answer: his smile slowly fades
  face(D, { smile: lerp(.55, .12, fade), sad: fade * .45, blink: blinkAt(t, 5), browUp: .25 + fade * .2 }); face(S, { blink: blinkAt(t, 11) * .8, lids: .35 });
  if (!close) cam(V(.15, 1.05, 2.0), V(.0, .78, -.75), 34, 2.75, .0011);
  else { const hp = wp(D.b('Head')); cam(V(-.45, 1.12, .55).add(V(0, 0, -t * .01)), hp.clone().add(V(-.02, -.02, 0)), 26, hp.distanceTo(V(-.45, 1.12, .55)), .003); }
  grade.uniforms.uWarm.value = .35; grade.uniforms.uLift.value = .02;
}

export const DUR = 12;
export function render(t) {
  hide(); grade.uniforms.uT.value = t; grade.uniforms.uFade.value = 1 - sm(t, 0, .6) * (1 - sm(t, DUR - .7, DUR));
  if (t < 6) shotHug(t); else if (t < 9) shotCouch(t - 6, false); else shotCouch(t - 6, true);
  composer.render();
}

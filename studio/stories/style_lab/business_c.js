// STYLE C (style lab, isolated): premium 2.5D hybrid. The SAME new Theo design as Style B (shared face.js) built as a dimensional toon puppet:
// egg-sphere head with a curved 2D face decal (canvas, redrawn per frame), the signature curl as a tube, hoodie capsule torso, tube limbs placed
// between joints (no rig needed), all in the Ashgrove set with Plate A, plus layered depth: a foreground lamp silhouette, dust motes in the phone
// light, a soft moon haze. Uses the existing director/engine read-only; nothing in the pipeline is modified.
import { EXPR, lerpExpr, drawFeatures, INK, SKIN, HAIR } from './face.js';
let S = null, THREE = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), rmp = (t, a, b) => cl((t - a) / (b - a)), ss = (x) => x * x * (3 - 2 * x), L = (a, b, k) => a + (b - a) * k;
const ob = (x) => { const c = 1.7; x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const T = { CUT: 1.8, READ: 2.2, HIT: 3.35, LOOK: 3.95, END: 5.0 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function init(C) {
  THREE = C.THREE; S = { RS: C.SET }; C.dbg = () => ({ S });
  const scene = C.scene, std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
  // --- Plate A as the back wall (same mapping as the approved hybrid test)
  const tex = await new THREE.TextureLoader().loadAsync('/stories/ad01_style_test_plateA/plateA.jpg'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const hide = []; scene.traverse((o) => { if ((o.isMesh || o.isSprite) && o.getWorldPosition(V(0, 0, 0)).z < -2.8) hide.push(o); }); hide.forEach((o) => (o.visible = false)); S.RS.hall.visible = false;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2 * 1536 / 2720), new THREE.MeshBasicMaterial({ map: tex, color: '#dfe3ee', fog: false })); plate.position.set(0, 1.35, -2.99); plate.userData.keepMaterial = true; scene.add(plate);
  // --- the puppet
  const P = S.P = { root: new THREE.Group() }; scene.add(P.root);
  const hood = std('#4c515e'), dark = std('#23262f'), skin = std('#e2b892'), ink = std(INK);
  P.torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.2, 8, 24), hood); P.torso.scale.set(1.12, 1, 0.78); P.root.add(P.torso);
  P.hoodRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 10, 24), hood); P.root.add(P.hoodRing);
  P.neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.09, 12), skin); P.root.add(P.neck);
  P.head = new THREE.Group(); P.root.add(P.head);
  // head: ONE toon material whose texture carries skin + the 2D face (equirect: +z front = u 0.25), redrawn per frame -> no decal seam
  const { toonGradient } = await import('/engine/web/style/painterly.js');
  P.fc = document.createElement('canvas'); P.fc.width = 2048; P.fc.height = 1024; P.ftex = new THREE.CanvasTexture(P.fc); P.ftex.colorSpace = THREE.SRGBColorSpace; P.ftex.anisotropy = 8;
  const hs = new THREE.Mesh(new THREE.SphereGeometry(0.17, 64, 48), new THREE.MeshToonMaterial({ map: P.ftex, gradientMap: toonGradient() })); hs.scale.set(1, 1.06, 0.94); hs.userData.keepMaterial = true; P.head.add(hs);
  // hair cap (top of the egg) + fringe band, and the signature curl as a tube
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.174, 48, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), std(HAIR)); cap.scale.set(1, 1.06, 0.94); cap.rotation.x = -0.18; P.head.add(cap);
  const curl = new THREE.CatmullRomCurve3([V(-0.005, 0.17, 0.0), V(-0.01, 0.235, 0.01), V(0.03, 0.272, 0.02), V(0.07, 0.262, 0.02), V(0.075, 0.232, 0.015), V(0.05, 0.222, 0.012), V(0.04, 0.238, 0.01)]);
  P.head.add(new THREE.Mesh(new THREE.TubeGeometry(curl, 48, 0.011, 10, false), std(HAIR)));
  // limbs: tube segments rebuilt between joints each frame (simple, rig-free; capsules oriented by quaternion)
  const seg = (r, m) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 16), m); g.userData.r = r; const j = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); g.userData.joint = j; scene.add(g, j); return g; };
  P.seg = { ua: [seg(0.034, hood), seg(0.034, hood)], fa: [seg(0.03, hood), seg(0.03, hood)], th: [seg(0.042, dark), seg(0.042, dark)], sh: [seg(0.038, dark), seg(0.038, dark)] };
  P.hand = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), skin); scene.add(m); return m; });
  P.foot = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 12), std('#1e1b24')); m.scale.set(1, 0.5, 1.6); scene.add(m); return m; });
  P.knee = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), dark); scene.add(m); return m; });
  // phone (screen faces his eyes; back toward camera)
  P.phone = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.009), std('#16161c', { roughness: 0.4 })); P.phone.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.142), new THREE.MeshBasicMaterial({ color: '#8fb6ff' })); scr.position.z = 0.0048; scr.userData.keepMaterial = true; P.phone.add(scr);
  P.plight = new THREE.PointLight('#9cc6ff', 0.35, 0.9, 1.5); P.plight.position.z = 0.22; P.phone.add(P.plight); scene.add(P.phone);
  for (const o of [P.torso, P.hoodRing, P.neck, hs, cap]) o.castShadow = o.receiveShadow = true;
  // --- layered depth: foreground floor-lamp silhouette (out of focus), dust motes in the phone light, moon haze
  const lamp = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), std('#0d0c12')); pole.position.y = 0.75; lamp.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 24, 1, true), std('#0d0c12', { side: THREE.DoubleSide })); shade.position.y = 1.55; lamp.add(shade); lamp.position.set(-0.55, 0, 0.35); scene.add(lamp); S.lamp = lamp;
  const dtex = S.RS.phoneGlow; S.dust = [];
  for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dtex, color: '#cfe0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 })); const k = 0.008 + (i % 4) * 0.004; sp.scale.set(k, k, 1); sp.userData.keepMaterial = true; sp.userData.seed = i; scene.add(sp); S.dust.push(sp); }
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.0), new THREE.MeshBasicMaterial({ map: S.RS.glowTex, color: '#7f9ad8', transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); haze.position.set(1.4, 1.9, -2.6); haze.userData.keepMaterial = true; scene.add(haze);
  S.fill = new THREE.PointLight('#a8bce8', 0.3, 4, 1.6); scene.add(S.fill);
  S.rim = new THREE.SpotLight('#b8ccff', 2.2, 6, 0.5, 0.6, 1.5); S.rim.position.set(1.2, 2.3, -2.7); S.rim.target.position.set(0, 1.0, -2.0); scene.add(S.rim, S.rim.target);   // moon rim kicker from the window side
}
function place(m, a, b) { const d = b.clone().sub(a), len = d.length(); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(1, Math.max(0.001, len), 1); m.userData.joint.position.copy(a); }
export function frame(t, C) {
  const P = S.P, so = S.RS.SOFA, hit = ob(rmp(t, T.HIT, T.HIT + 0.18)), look = ss(rmp(t, T.LOOK, T.LOOK + 0.35)), br = Math.sin(t * 2.4) * 0.006;
  const hip = V(so.x, 0.47, so.z + 0.02), chest = V(so.x, 0.74 + br - 0.012 * hit, so.z - 0.01 - 0.02 * hit);
  P.torso.position.copy(hip).add(chest).multiplyScalar(0.5); P.torso.rotation.x = -0.08 - 0.06 * hit;
  P.hoodRing.position.set(chest.x, chest.y + 0.07, chest.z - 0.05); P.hoodRing.rotation.x = Math.PI / 2 - 0.4;
  const neckB = chest.clone().add(V(0, 0.11, 0.01)); P.neck.position.copy(neckB).add(V(0, 0.04, 0));
  P.head.position.copy(neckB).add(V(-0.03 * look, 0.215, 0.02 - 0.02 * hit)); P.head.rotation.set(0.2 * (1 - hit) - 0.05 * hit, -0.55 * look, 0.04 * (1 - hit) - 0.08 * look);
  // phone held at the reading position; hands on it
  const ph = V(so.x + 0.005, 0.86 - 0.012 * hit, so.z + 0.27 + 0.015 * hit); P.phone.position.copy(ph); P.phone.lookAt(P.head.position.clone().add(V(0, 0.03, 0.12)));
  P.plight.intensity = 0.22 + 0.06 * hit;
  for (const s of [0, 1]) { const sg = s ? 1 : -1, sh = chest.clone().add(V(sg * 0.15, 0.06, 0)), hand = ph.clone().add(V(sg * 0.04, -0.06, -0.005)), elb = sh.clone().lerp(hand, 0.5).add(V(sg * 0.06, -0.13, -0.04));
    place(P.seg.ua[s], sh, elb); place(P.seg.fa[s], elb, hand); P.hand[s].position.copy(hand);
    const hp = hip.clone().add(V(sg * 0.075, 0, 0)), kn = V(so.x + sg * 0.11, 0.46, so.z + 0.42), ft = V(so.x + sg * 0.13, 0.05, so.z + 0.5);
    place(P.seg.th[s], hp, kn); place(P.seg.sh[s], kn, ft); P.knee[s].position.copy(kn); P.foot[s].position.copy(ft).add(V(0, 0, 0.03)); }
  // the face decal: same expression track as Style B
  const E = EXPR; let ex = t < T.READ ? E.tired : t < T.HIT ? lerpExpr(E.tired, E.frown, ss(rmp(t, T.READ, T.READ + 0.35))) : t < T.LOOK ? lerpExpr(E.frown, E.shock, hit) : lerpExpr(E.shock, E.dread, look);
  if ([0.9, 2.95, 4.65].some((b) => t >= b && t < b + 0.12)) ex = { ...ex, lid: 1 };
  const g = P.fc.getContext('2d'); g.fillStyle = '#d9ad87'; g.fillRect(0, 0, 2048, 1024); drawFeatures(g, 512, 520, 640, ex, { skin: '#d9ad87' }); P.ftex.needsUpdate = true;
  // lighting + depth layers
  S.fill.position.copy(C.camera.position).add(V(0.2, 0.25, 0)); S.fill.intensity = 0.12;
  for (const d of S.dust) { const k = d.userData.seed, a = k * 2.399; d.position.set(so.x + Math.cos(a) * (0.12 + (k % 5) * 0.05), 0.8 + ((k * 0.37 + t * 0.05) % 0.55), so.z + 0.22 + Math.sin(a) * 0.12); d.material.opacity = 0.25 + 0.25 * Math.sin(t * 1.3 + k); }
}

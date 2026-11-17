// AFTER DARK AD01 beat 1: free in-house STYLE TEST (owner-approved 2026-11-17). Not episode production.
// 5.0 s, two shots: S1 insert over his shoulder (the message from "Me"), S2 his phone-lit face, push-in; the reaction lands on "3:17".
// Reuses the C+ v2 hero (the same loader settings as Episode 3) and a phone built like the Episode 3 phone rig. No engine file changed.
let S = null, THREE = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), rmp = (t, a, b) => cl((t - a) / (b - a));
const ss = (x) => x * x * (3 - 2 * x), outBack = (x) => { const c = 1.9; x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const snap = (t, t0, d = 0.15) => outBack(rmp(t, t0, t0 + d));
export const T = { MSG: 0.35, DOTS: 1.15, CUT: 1.8, READ: 2.2, HIT: 3.35, GULP: 4.3, END: 5.0 };
export async function init(C) {
  THREE = C.THREE; const RS = C.SET; S = { RS, C }; C.dbg = () => ({ S, frameOf });
  const CP = await import('/engine/web/character_cplus.js'); S.CP = CP;
  S.hero = await CP.loadCPlus(THREE, { url: '/engine/web/characters/cplus_modern_m.glb', look: 'v2', faceRes: 1024, face: { style: 'v2', browCol: '#2a1b17' },
    recolor: { top: '#5d616b', hair: '#3a2418' }, rim: '#b8c8ff', rimK: 0.22, paintK: 0.06, shadowLevel: 178 });   // grey hoodie, cold rim
  C.scene.add(S.hero.root);
  S.phone = makePhone(); C.scene.add(S.phone.g);
  // a faint cold fill near the camera so the expression reads (After Dark rule: close-ups only, about 0.3)
  S.fill = new THREE.PointLight('#a8bce8', 0.3, 4, 1.6); C.scene.add(S.fill);
}
function makePhone() {
  const g = new THREE.Group(), c = document.createElement('canvas'); c.width = 360; c.height = 760; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.165, 0.009), new THREE.MeshStandardMaterial({ color: '#16161c', roughness: 0.4 })); g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.074, 0.156), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.0048; scr.userData.keepMaterial = true; g.add(scr);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 })); glow.scale.set(0.35, 0.35, 1); glow.position.z = 0.03; glow.userData.keepMaterial = true; g.add(glow);
  const light = new THREE.PointLight('#9cc6ff', 0.8, 0.9, 1.5); light.position.z = 0.1; g.add(light);
  return { g, c, tex, glow, light, state: '' };
}
// the messages screen: "Me" (his own photo), the warning bubble, typing dots
function screen(t) {
  const P = S.phone, dots = t >= T.DOTS ? Math.floor((t - T.DOTS) * 4) % 3 : -1, pop = t >= T.MSG ? Math.round(snap(t, T.MSG, 0.2) * 20) / 20 : 0, st = pop + '|' + dots; if (P.state === st) return; P.state = st;
  const g = P.c.getContext('2d'), W = 360, H = 760; g.fillStyle = '#0d1020'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8ecf8'; g.font = 'bold 26px Inter, DejaVu Sans'; g.textAlign = 'center'; g.fillText('3:09', W / 2, 44);
  g.fillStyle = '#1b2036'; g.fillRect(0, 70, W, 120);
  g.beginPath(); g.arc(W / 2, 112, 30, 0, 7); g.fillStyle = '#f0c49e'; g.fill(); g.fillStyle = '#3a2418'; g.beginPath(); g.arc(W / 2, 100, 30, Math.PI, 0); g.fill();   // tiny avatar: his own face
  g.fillStyle = '#1e1418'; for (const dx of [-10, 10]) { g.beginPath(); g.arc(W / 2 + dx, 114, 3.5, 0, 7); g.fill(); }
  g.fillStyle = '#ffffff'; g.font = 'bold 30px Inter, DejaVu Sans'; g.fillText('Me', W / 2, 172);
  if (pop > 0) { g.save(); g.translate(40, 250); g.scale(pop, pop); g.fillStyle = '#e9ecf4'; g.beginPath(); g.roundRect(0, 0, 286, 150, 26); g.fill();
    g.fillStyle = '#111522'; g.font = '800 34px Inter, DejaVu Sans'; g.textAlign = 'left'; ["Don't open", 'the door', 'at 3:17.'].forEach((s, i) => g.fillText(s, 22, 46 + i * 40)); g.restore(); }
  if (dots >= 0) { g.fillStyle = '#2a3150'; g.beginPath(); g.roundRect(40, 424, 110, 58, 29); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = i === dots ? '#ffffff' : '#7d86a8'; g.beginPath(); g.arc(68 + i * 27, 453, 8, 0, 7); g.fill(); } }
  g.fillStyle = '#1b2036'; g.beginPath(); g.roundRect(20, 690, W - 40, 50, 25); g.fill(); g.fillStyle = '#6a7290'; g.font = '24px Inter, DejaVu Sans'; g.textAlign = 'left'; g.fillText('Message', 44, 723);
  P.tex.needsUpdate = true;
}
export function frameOf(name) { return new THREE.Matrix4(); }
export function frame(t, C) {
  const E = (n) => S.CP.EXP[n], X = (a, b, k) => S.CP.blendExp(typeof a === 'string' ? E(a) : a, typeof b === 'string' ? E(b) : b, cl(k));
  if (C.story.plateRef) { S.hero.root.visible = false; S.phone.g.visible = false; S.fill.intensity = 0; S.RS.hemi.intensity = 1.1; return; }   // character-free, evenly lit layout frame (reference for the painted-wall test)
  const so = S.RS.SOFA, hit = snap(t, T.HIT, 0.18), gulp = Math.sin(Math.PI * rmp(t, T.GULP, T.GULP + 0.35));
  // face: tired reading -> a frown (his own number?) -> eyes widen on "3:17" -> a swallow
  let f = t < T.READ ? X('neutral', 'squint', 0.35) : t < T.HIT ? X('squint', 'curious', ss(rmp(t, T.READ, T.READ + 0.4))) : { ...E('scared'), open: [1.0 + 0.15 * hit, 1.0 + 0.15 * hit], pup: [0, 0.25], pr: 0.5, brow: [-22, -24], mouth: 'flat', mo: 0.6, cheek: 0 };
  if (t >= T.GULP) f = { ...f, mouth: 'grimace', mo: 0.35 + 0.2 * gulp };
  const breath = Math.sin(t * 2.4) * 0.012;
  const bones = { spine: [0.1, 0, 0], chest: [0.08 + breath - 0.05 * hit, 0, 0], neck: [0.12, 0, 0], head: [0.16 - 0.08 * hit + 0.02 * gulp, 0.04, 0.02 * (1 - hit)],
    thighL: [-1.5, 0, 0.08], thighR: [-1.5, 0, -0.08], shinL: [1.45, 0, 0], shinR: [1.45, 0, 0], footL: [0.05, 0, 0], footR: [0.05, 0, 0],
    upperarmR: [-1.2, 0, 0.2], forearmR: [-0.9, 0.8, 0], upperarmL: [-1.0, 0, -0.4], forearmL: [-0.9, -0.4, 0] };   // both hands meet at the phone (solved with probe_expr: within 2-3 cm)
  S.hero.root.position.set(so.x, 0, so.z); S.hero.root.rotation.set(0, 0, 0);
  S.hero.pose({ bones, offset: { hips: [0, -0.24 - 0.012 * hit, -0.02] }, face: f, gaze: [0.02, -0.55 + 0.1 * hit], blink: S.CP.blinkAt(t, [0.9, 2.95, 4.5]), hand: 'relaxed', squash: 0.025 * gulp });
  S.hero.root.updateMatrixWorld(true);
  // the phone floats at the reading position in front of his chest, screen turned to his eyes (Episode 3 insert approach)
  const head = S.hero.bones.head.getWorldPosition(new THREE.Vector3()), eye = head.clone().add(new THREE.Vector3(0, 0.05, 0.08));
  const hR = S.hero.bones.handR.getWorldPosition(new THREE.Vector3()), hL = S.hero.bones.handL.getWorldPosition(new THREE.Vector3()); S.phone.g.position.copy(hR).add(hL).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.07, 0.02 + 0.02 * hit));
  S.phone.g.lookAt(t < T.CUT ? C.camera.position : eye); screen(t);   // insert cheat: the screen turns to the camera in S1 (as in Episode 3), to his eyes in S2
  S.phone.light.intensity = 0.8 + 0.15 * hit;
  if (t < T.CUT) { S.phone.g.position.y += 0.075; S.phone.light.intensity = 0.25; }   // insert: the screen sits clear of his grip, no hot spill on the hands
  // fill near the camera, only on the face shot
  S.fill.position.copy(C.camera.position).add(new THREE.Vector3(0.2, 0.25, 0)); S.fill.intensity = t >= T.CUT ? 0.25 : 0.08;
  // the strip under the door breathes very slightly (someone moving in the hall? the episode pays this off at 3:17)
  S.RS.hall.intensity = 0.6 + 0.08 * Math.sin(t * 5.3); S.RS.spill.material.opacity = 0.5 + 0.06 * Math.sin(t * 5.3);
  S.hero.update(C.camera, 4.6);
}

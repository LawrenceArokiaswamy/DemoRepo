// ASHGROVE HOUSE FLAT: style-test set for After Dark AD01 beat 1 (owner-approved free style test, 2026-11-17).
// Self-contained: it lives in this test folder and is loaded through story.json "set": "../../../stories/ad01_style_test/set".
// No engine file changed.
// Layout (floor y = 0): a living-room corner, room x -2.6..2.6, z -3.0..1.5.
//   Back wall (z = -3.0): a tall window onto the night city (right), and the front-door recess (left) with a warm strip of hall light under the door.
//   The sofa faces +z, so the reverse shot of Theo has the door over his shoulder.
// Lighting: cold moonlight from behind (through the window), an almost dark fill; warm only at the door strip.
import { THREE, scene } from '/engine/web/stage.js';
import * as P from '/engine/web/style/painted.js';
export const RS = { lamps: [] };
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
const kit = (t) => { t.userData.painted = true; return t; };
const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; return add(m); };
export async function build() {
  P.initPainted(THREE);
  scene.fog = new THREE.Fog('#0b0f1c', 5, 16); RS.fog = scene.fog;
  const key = new THREE.DirectionalLight('#9fb8ff', 1.0); key.position.set(3, 6, -12); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 40 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03; scene.add(key, key.target); RS.key = key;
  RS.hemi = new THREE.HemisphereLight('#3a4a7a', '#141018', 0.4); scene.add(RS.hemi);
  // floor, rug, walls, ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.5), std({ map: kit(P.woodFloor([3, 3])) })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -0.75); add(floor, false);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), std({ map: kit(P.velvet('#4a3a5a', [2, 1])) })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, -1.1); add(rug, false);
  const wp = std({ map: kit(P.wallpaper('#3a4150', '#4d5566', [4, 2])) }), trim = std({ color: '#2a2a33' }), dark = std({ color: '#1c1a20' });
  const wallSeg = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wp); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); return m; };
  // back wall with two openings: door recess x -1.9..-0.9, window x 0.5..1.9 (y 0.8..2.4); wall height 2.7
  wallSeg(0.7, 2.7, -2.25, 1.35, -3.0); wallSeg(1.4, 2.7, -0.2, 1.35, -3.0); wallSeg(0.7, 2.7, 2.25, 1.35, -3.0);
  wallSeg(1.0, 0.65, -1.4, 2.375, -3.0); wallSeg(1.4, 0.8, 1.2, 0.4, -3.0); wallSeg(1.4, 0.3, 1.2, 2.55, -3.0);
  wallSeg(4.5, 2.7, -2.6, 1.35, -0.75, Math.PI / 2); wallSeg(4.5, 2.7, 2.6, 1.35, -0.75, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.5), std({ color: '#15141a' })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.7, -0.75); add(ceil, false);
  box(5.2, 0.12, 0.03, trim, 0, 0.06, -2.985);   // skirting
  // the window: night city backdrop, mullions, sill, a radiator under it, thin curtains
  const city = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ map: P.nightCity(), color: '#9aa6c8' })); city.position.set(1.2, 1.8, -6.5); city.userData.keepMaterial = true; scene.add(city);
  for (const x of [0.5, 1.2, 1.9]) box(0.05, 1.6, 0.06, trim, x, 1.6, -2.98); box(1.4, 0.05, 0.06, trim, 1.2, 1.6, -2.98); box(1.5, 0.05, 0.2, trim, 1.2, 0.8, -2.92);
  for (let i = 0; i < 6; i++) box(0.05, 0.45, 0.08, std({ color: '#3a3d48' }), 0.7 + i * 0.2, 0.42, -2.9);
  const curtain = std({ color: '#2c3346', transparent: true, opacity: 0.85 }); box(0.32, 2.0, 0.03, curtain, 0.32, 1.55, -2.88); box(0.32, 2.0, 0.03, curtain, 2.08, 1.55, -2.88);
  // the door recess (1.0 m deep) and the front door at its end, with a warm strip of hall light under it
  wallSeg(1.0, 2.05, -1.9, 1.025, -3.5, Math.PI / 2); wallSeg(1.0, 2.05, -0.9, 1.025, -3.5, -Math.PI / 2);
  const rc = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), dark); rc.rotation.x = Math.PI / 2; rc.position.set(-1.4, 2.05, -3.5); scene.add(rc);
  const rf = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), std({ map: kit(P.woodFloor([1, 1])) })); rf.rotation.x = -Math.PI / 2; rf.position.set(-1.4, 0.001, -3.5); add(rf, false);
  const door = box(0.86, 1.98, 0.05, std({ map: kit(P.panels('#3a2c26', [1, 2])) }), -1.4, 1.01, -3.97); RS.door = door;
  box(0.05, 0.05, 0.05, std({ color: '#c9a04a', metalness: 0.4, roughness: 0.4 }), -1.1, 1.0, -3.93);
  for (const x of [-1.86, -0.94]) box(0.06, 2.05, 0.08, trim, x, 1.025, -3.0); box(1.0, 0.06, 0.08, trim, -1.4, 2.05, -3.0);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.022), new THREE.MeshBasicMaterial({ color: '#ffc27a' })); strip.position.set(-1.4, 0.011, -3.94); strip.userData.keepMaterial = true; scene.add(strip); RS.strip = strip;
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: P.glow('255,190,110'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(-1.4, 0.006, -3.75); spill.userData.keepMaterial = true; scene.add(spill); RS.spill = spill;
  for (const dx of [-0.438, 0.438]) { const leak = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 1.94), new THREE.MeshBasicMaterial({ color: '#ffb46a', transparent: true, opacity: 0.75 })); leak.position.set(-1.4 + dx, 0.99, -3.945); leak.userData.keepMaterial = true; scene.add(leak); }   // hall light leaking round the door edges
  const hall = new THREE.PointLight('#ffb870', 0.6, 1.2, 2); hall.position.set(-1.4, 0.05, -3.85); scene.add(hall); RS.hall = hall;
  // furniture: sofa (seat top 0.40), side table with an unlit lamp, a framed print, a bookshelf, a cold fridge glow from the kitchenette edge (right)
  const fab = std({ map: kit(P.velvet('#4a5468', [2, 1])) });
  box(2.0, 0.38, 0.85, fab, 0, 0.21, -2.15); box(2.0, 0.55, 0.22, fab, 0, 0.66, -2.5); box(0.22, 0.6, 0.85, fab, -1.0, 0.42, -2.15); box(0.22, 0.6, 0.85, fab, 1.0, 0.42, -2.15);
  box(0.5, 0.42, 0.4, std({ color: '#5a4a52' }), -0.55, 0.62, -2.3); box(0.5, 0.42, 0.4, std({ color: '#47506a' }), 0.6, 0.62, -2.32);   // cushions
  box(0.45, 0.5, 0.45, std({ color: '#2e2620' }), 1.5, 0.25, -2.3); const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 20, 1, true), std({ color: '#cbbfa8', side: THREE.DoubleSide })); lamp.position.set(1.5, 0.82, -2.3); add(lamp);
  box(0.02, 0.3, 0.02, trim, 1.5, 0.62, -2.3);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), std({ map: kit(P.painting(1)) })); print.position.set(-0.2, 1.75, -2.99); scene.add(print); box(0.66, 0.51, 0.02, trim, -0.2, 1.75, -2.995);
  for (let i = 0; i < 4; i++) box(0.9, 0.03, 0.3, trim, -2.42, 0.4 + i * 0.45, -1.0, Math.PI / 2);
  const books = ['#6a3a3a', '#3a5a6a', '#8a7a4a', '#4a4a6a', '#5a6a4a']; for (let s = 0; s < 3; s++) for (let i = 0; i < 9; i++) box(0.18, 0.26 + (i % 3) * 0.04, 0.06, std({ color: books[(i + s) % 5] }), -2.42, 0.56 + s * 0.45, -1.36 + i * 0.08, Math.PI / 2);
  const fridge = new THREE.PointLight('#bfe0ff', 0.35, 2.5, 2); fridge.position.set(2.5, 1.2, 0.6); scene.add(fridge); RS.fridge = fridge;
  RS.glowTex = P.glow('255,190,110'); RS.phoneGlow = P.glow('140,190,255');
  RS.SOFA = { x: 0, z: -2.05, seatY: 0.4 };
  return RS;
}

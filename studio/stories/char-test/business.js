// C+ character acting test (Milestone 2): the Blender-built Roman sailor on the warship deck at golden hour.
// Character-local camera frames: frameOf('char') = the character's standing spot on the deck (x = his left, y = up, z = his front).
// story.turnaround: frames 0..4 render the neutral model at 0 / 45 / 90 / 180 / -45 degrees for the model check.
let S = null, THREE = null;
const SHIP = { x: 6, z: 36 };
export async function init(C) {
  THREE = C.THREE; const SY = C.SET, H = SY.hero; S = { SY, H, st: C.story };
  const CP = await import('/engine/web/character_cplus.js'); S.CP = CP;
  S.ch = await CP.loadCPlus(THREE); S.base = new THREE.Group(); S.base.add(S.ch.root); H.body.add(S.base);
  const st = C.story.stand || { u: 0.66, v: -0.12, yaw: Math.PI / 2 }; S.base.position.copy(H.deckPoint(st.u, st.v)); S.base.rotation.y = st.yaw;
  const { toonMat } = await import('/engine/web/actor3d.js');
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 24), toonMat('#b89566')); coil.rotation.x = Math.PI / 2; coil.position.copy(H.deckPoint(0.77, 0.72)).add(new THREE.Vector3(0, 0.08, 0)); coil.castShadow = true; coil.userData.keepMaterial = true; H.body.add(coil);
  const props = [['wooden_crate_01', 0.37, -0.62, 1.4, 0.3], ['wooden_crate_02', 0.395, -0.82, 1.15, -0.2], ['ceramic_vase_02', 0.41, -0.5, 1.5, 0], ['wooden_crate_01', 0.21, 0.42, 1.5, 0.2], ['wooden_crate_02', 0.215, 0.05, 1.25, -0.3], ['wooden_crate_01', 0.235, 0.35, 1.1, 0.9], ['ceramic_vase_02', 0.25, -0.5, 1.7, 0], ['ceramic_vase_01', 0.27, -0.66, 1.6, 0], ['wooden_bucket_01', 0.32, 0.55, 1.3, 0]];
  for (const [id, u, vv, sc, ry] of props) { try { const m = await C.loadModel(id); m.scale.setScalar(sc); m.position.copy(H.deckPoint(u, vv)); m.rotation.y = ry; m.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); H.body.add(m); } catch (e) {} }
  for (const s of SY.fleet) s.root.visible = true;
  if (!C.story.turnaround) S.perf = (await import(`${new URLSearchParams(location.search).get('story')}/performance.js`)).makePerformance(CP);
}
function placeShip(t) {
  if (S.placedAt === t) return; S.placedAt = t; const SY = S.SY, H = S.H; SY.sea.update(t + 40);
  const y = SY.sea.heightAt(SHIP.x, SHIP.z, t + 40); H.root.position.set(SHIP.x, y, SHIP.z); H.root.rotation.set(0, Math.PI / 2 + 0.25, 0); const sl = SY.sea.slopeAt(SHIP.x, SHIP.z, t + 40); H.root.rotateZ(-sl[1] * 0.3); H.root.rotateX(sl[0] * 0.2);
  H.root.updateMatrixWorld(true); }
export function frameOf(name, w) { placeShip(w); S.base.updateWorldMatrix(true, false); return S.base.matrixWorld.clone(); }
export function frame(t, C, vt) {
  const H = S.H; placeShip(t); if (H.setOars) H.setOars(t * 0.4, 'rest'); if (H.setTime) H.setTime(t);
  if (S.st.turnaround) { const f = Math.round(vt * C.FPS), yaw = [0, 0.785, 1.571, 3.1416, -0.785, 0][f] ?? 0; S.ch.root.rotation.y = yaw;
    S.ch.pose({ face: S.st.face || 'neutral', bones: S.st.poseBones || {} , hand: S.st.hand || 'relaxed' }); }
  else S.ch.pose(S.perf(vt));
  const si = (S.st.shots || []).findIndex((sh) => vt >= sh.a && vt < sh.b); S.ch.update(C.camera, (S.st.outlineByShot && S.st.outlineByShot[si < 0 ? S.st.shots.length - 1 : si]) ?? S.st.outlinePx ?? 5.0);
}

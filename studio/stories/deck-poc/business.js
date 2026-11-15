// "Deck at sunset" proof of concept (EXPERIMENTAL): 3D pebble actors hauling a rope on a warship deck at sunset;
// the claw arm's huge shadow sweeps across the deck; one sailor turns toward the wall, calm -> shocked.
// Coordinates for actors, props, rope and camera are SHIP-LOCAL (x = toward the bow / the wall, y = up, z = across).
let S = null, THREE = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => cl((t - a) / (b - a)), L3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const SHIP = { x: 6, z: 36 };
export async function init(C) {
  THREE = C.THREE; const SY = C.SET, H = SY.hero; S = { SY, H };
  const { makeActor3D, toonMat } = await import('/engine/web/actor3d.js'); S.FACE = (await import('/engine/web/chargen.js')).FACE;
  const sailor = { name: 'Lucius (sailor)', period: 'roman', age: 'adult', build: 'average', skin: '#e8b48a', freckles: 1, head: { shape: 'round', width: 1.0 }, eyes: { size: 1.12 }, nose: 'button', ears: 1.2,
    hair: { style: 'caesar', color: '#6a3a1c' }, outfit: { top: 'armor', color: '#b8bec4', color2: '#a8322c', legs: 'skin', sandals: true, boots: '#6b4426', belt: true }, headwear: { type: 'helmet', color: '#c9a560', cheek: true } };
  const mate = { ...sailor, name: 'Gaius', skin: '#c98d62', freckles: 0, eyes: { size: 1.0 }, nose: 'round', outfit: { ...sailor.outfit, color: '#c2a27a', color2: '#5a6f8a', top: 'tunic' }, headwear: { type: 'none' }, hair: { style: 'short', color: '#2a1a12' } };
  S.hero = makeActor3D(sailor); S.mate = makeActor3D(mate); H.body.add(S.hero.root, S.mate.root);
  // rope: a halyard from a deck cleat up to the yard; both sailors haul it
  S.pin = H.deckPoint(0.52, -0.55).add(new THREE.Vector3(0, 0.35, 0)); S.top = H.deckPoint(0.56, 0).add(new THREE.Vector3(0, 9.9, 0)); S.pin = S.top;
  S.ropeMat = toonMat('#b89566'); S.rope = new THREE.Mesh(new THREE.BufferGeometry(), S.ropeMat); S.rope.castShadow = true; S.rope.userData.keepMaterial = true; H.body.add(S.rope);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 24), S.ropeMat); coil.rotation.x = Math.PI / 2; coil.position.copy(H.deckPoint(0.76, -0.68)).add(new THREE.Vector3(0, 0.08, 0)); coil.castShadow = true; coil.userData.keepMaterial = true; H.body.add(coil);
  // foreground dressing at the stern (existing CC0 models)
  const props = [['wooden_crate_01', 0.21, 0.42, 1.5, 0.2], ['wooden_crate_02', 0.215, 0.05, 1.25, -0.3], ['wooden_crate_01', 0.235, 0.35, 1.1, 0.9], ['ceramic_vase_02', 0.25, -0.5, 1.7, 0], ['ceramic_vase_01', 0.27, -0.66, 1.6, 0], ['wooden_bucket_01', 0.32, 0.55, 1.3, 0]];
  for (const [id, u, vv, sc, ry] of props) { try { const m = await C.loadModel(id); m.scale.setScalar(sc); m.position.copy(H.deckPoint(u, vv)); m.rotation.y = ry; m.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); H.body.add(m); } catch (e) {} }
  // invisible stand-in for the claw arm (beam + chain + hand): casts the shadow only
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); S.claw = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 28), ghost); beam.position.set(0, 4.5, -13); beam.rotation.x = -0.32; S.claw.add(beam);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5, 8), ghost); chain.position.set(0, 2.5, 0); S.claw.add(chain);
  for (const a of [-0.7, 0, 0.7]) { const prong = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.6, 0.55), ghost); prong.position.set(Math.sin(a) * 1.3, -0.9, Math.cos(a) * 0.5 - 0.3); prong.rotation.z = a * 1.2; S.claw.add(prong); }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), ghost); S.claw.add(hub);
  S.claw.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.keepMaterial = true; } }); C.scene.add(S.claw);
  for (const s of SY.fleet) s.root.visible = true;
}
function placeShip(t) {   // the ship rides the swell, bow toward the wall (called before the camera reads the ship's frame)
  if (S.placedAt === t) return; S.placedAt = t; const SY = S.SY, H = S.H; SY.sea.update(t + 40);
  const y = SY.sea.heightAt(SHIP.x, SHIP.z, t + 40); H.root.position.set(SHIP.x, y, SHIP.z); H.root.rotation.set(0, Math.PI / 2 + 0.25, 0); const sl = SY.sea.slopeAt(SHIP.x, SHIP.z, t + 40); H.root.rotateZ(-sl[1] * 0.3); H.root.rotateX(sl[0] * 0.2);
  H.root.updateMatrixWorld(true); }
export function frameOf(name, w) { placeShip(w); S.H.body.updateWorldMatrix(true, false); return S.H.body.matrixWorld.clone(); }
export function frame(t, C) {
  const SY = S.SY, H = S.H; placeShip(t);
  if (H.setOars) H.setOars(t * 0.4, 'rest'); if (H.setTime) H.setTime(t);
  // hauling cycle (period 1.15 s): sailors face the mast (-x) and pull the halyard down and back; hero stops at 3.05 s, mate at 3.45 s
  const cyc = (ph) => 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
  const base = { hero: H.deckPoint(0.64, -0.12), mate: H.deckPoint(0.69, -0.32) };
  const pull = (off, t0) => cyc((t - off) / 1.15) * (1 - ss(ramp(t, t0, t0 + 0.4)));
  const ph = pull(0, 3.05), pm = pull(0.18, 3.45);
  const grip = (b, p, dz) => b.clone().add(new THREE.Vector3(-0.42 + p * 0.16, 1.18 - p * 0.22, dz));
  const gH = grip(base.hero, ph, 0.12), gM = grip(base.mate, pm, 0.05), gH2 = gH.clone().add(new THREE.Vector3(0.2, -0.12, -0.05)), gM2 = gM.clone().add(new THREE.Vector3(0.2, -0.12, -0.05));
  // ---- mate: keeps hauling a little longer, then freezes and looks up at the shadow
  const mLook = ss(ramp(t, 3.4, 3.9));
  S.mate.setPose({ pos: base.mate.toArray(), yaw: -1.5 + mLook * 0.9, lean: lerp(4, -14, pm) * (1 - mLook) - mLook * 5, bob: -pm * 0.5, headPitch: mLook * 0.6, headYaw: mLook * 0.2,
    face: t < 3.45 ? { ...S.FACE.neutral, mouth: { ...S.FACE.neutral.mouth, open: Math.round(pm * 3) / 10, teeth: 0.5, smile: 0.05 } } : 'fear',
    handL: L3(gM.toArray(), [gM.x + 0.05, gM.y + 0.25, gM.z - 0.35], mLook), handR: L3(gM2.toArray(), [gM.x + 0.1, gM.y + 0.2, gM.z + 0.3], mLook) });
  // ---- hero: hauls (back to camera), notices the shadow (3.05), turns round toward the wall and looks up (3.15-3.85), shock + lets go (3.55-3.95)
  const turn = ss(ramp(t, 3.15, 3.85)), letGo = ss(ramp(t, 3.5, 3.9)), recoil = t > 3.6 ? Math.sin(cl((t - 3.6) / 0.7) * Math.PI) : 0;
  const face = t < 3.05 ? { ...S.FACE.neutral, mouth: { ...S.FACE.neutral.mouth, open: Math.round(ph * 3) / 10, teeth: 0.5 } } : t < 3.5 ? 'notice' : 'shock';
  const hp = base.hero, yawH = lerp(-1.5, 1.0, turn), fw = new THREE.Vector3(Math.sin(yawH), 0, Math.cos(yawH)), rt = new THREE.Vector3(Math.cos(yawH), 0, -Math.sin(yawH));
  // shock pose: hands thrown up beside the head (relative to where he faces), never in front of the face
  const up1 = hp.clone().add(new THREE.Vector3(0, 1.62, 0)).addScaledVector(rt, 0.5).addScaledVector(fw, 0.05).toArray(), up2 = hp.clone().add(new THREE.Vector3(0, 1.58, 0)).addScaledVector(rt, -0.5).addScaledVector(fw, 0.05).toArray();
  const headLead = ss(ramp(t, 3.02, 3.4));   // the head turns first (anticipation), the body follows
  S.hero.setPose({ pos: hp.toArray(), yaw: yawH, lean: lerp(4, -14, ph) * (1 - turn) - recoil * 9, side: turn * 5, bob: -ph * 0.5 - recoil * 0.25, squash: recoil * 0.3,
    headPitch: Math.max(turn, headLead * 0.6) * 0.42, headYaw: (headLead - turn) * 1.1 + turn * 0.18, face,
    handL: L3(gH.toArray(), up1, letGo), handR: L3(gH2.toArray(), up2, letGo) });
  // rope: masthead -> (hero's grip while holding) -> mate's grip -> cleat behind them
  S.pin = H.deckPoint(0.77, -0.55).add(new THREE.Vector3(0, 0.3, 0));
  const pts = [S.top, ...(letGo < 0.5 ? [gH] : []), gM, S.pin].map((p) => p.clone());
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 64, 0.035, 6, false); S.rope.geometry.dispose(); S.rope.geometry = g;
  // claw shadow: the stand-in is placed up-sun of a target point on the deck, so its shadow lands exactly there;
  // the target sweeps from the bow toward the sailors (2.6-4.4 s) and the claw's shadow ends over the hero
  const sd = new THREE.Vector3(...C.style.preset.sky.sunDir).normalize(); H.body.updateWorldMatrix(true, false);
  const sw = ss(ramp(t, 2.6, 4.4)), tgt = H.deckPoint(lerp(0.95, 0.655, sw), lerp(1.6, -0.05, sw)).applyMatrix4(H.body.matrixWorld);
  // the arm blots out part of the sun as it passes: key light dims ~35 %, fill steady (cinematic cheat, reads as 'something huge overhead')
  if (S.k0 == null) S.k0 = C.style.key.intensity; C.style.key.intensity = S.k0 * (1 - 0.35 * ss(ramp(t, 2.95, 3.55)));
  S.claw.position.copy(tgt).addScaledVector(sd, 7.5); S.claw.rotation.set(0, -0.25 + sw * 0.2, Math.sin(t * 1.7) * 0.04);
}

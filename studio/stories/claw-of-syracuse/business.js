// "The Claw of Syracuse" business: ship + machine choreography as pure functions of WORLD time w (see story.json timeMap).
// Documented (Polybius 8.5-8.7): night approach; ships close in under the wall; beam projecting over the wall; iron hand on a
// chain grips the prow; the operator presses down the inner end, the ship stands upright on its stern; the chain is let go
// suddenly; ships capsize or fill. Reconstruction (ours): machine dimensions, counterweight + windlass, timings, the ship's look.
const K = { STONES: [11.0, 11.8, 12.6], CREAK: 14.4, SWING0: 16.2, SWING1: 19.6, LOWER0: 18.8, BITE: 21.0, LIFT0: 22.6, LIFT1: 31.0, REL: 32.6, DAYS: 49.5, POKE: 51.4, JUMP0: 52.3, JUMP1: 53.0, BITEFISH: 52.4, YANK: 53.0, CAUGHT: 53.45 };
const lerp = (a, b, k) => a + (b - a) * k, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ramp = (w, a, b) => cl((w - a) / (b - a));
const ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, s5 = (x) => { x = cl(x); return x * x * x * (x * (6 * x - 15) + 10); };
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const D2R = Math.PI / 180;
let S = null;

export async function init(C) {
  const { THREE, scene, SET } = C; S = { THREE, SY: SET };
  const { makeSplash, makeSprayTexture, makeCrown } = await import('/engine/web/fx/ocean.js');
  S.tex = makeSprayTexture(THREE); S.splash = makeSplash(THREE, scene, S.tex, { count: 240, seed: 3 }); S.impact = makeSplash(THREE, scene, S.tex, { count: 420, seed: 5 });
  const rc = document.createElement('canvas'); rc.width = rc.height = 256; const rg = rc.getContext('2d'), grd = rg.createRadialGradient(128, 128, 60, 128, 128, 128); grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.55, 'rgba(255,255,255,0.85)'); grd.addColorStop(0.75, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); rg.fillStyle = grd; rg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { rg.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.5 + ')'; const a = Math.random() * 6.28, r = 70 + Math.random() * 55; rg.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3, 3); }
  const rt = new THREE.CanvasTexture(rc); rt.colorSpace = THREE.SRGBColorSpace; S.rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, opacity: 0, color: '#f2f6f6' })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; }); S.spray2 = makeSplash(THREE, scene, S.tex, { count: 120, seed: 9 });
  S.crown = makeCrown(THREE, scene, S.tex, { count: 90, seed: 4 }); S.debrisSplash = makeSplash(THREE, scene, S.tex, { count: 220, seed: 12 });
  // debris that tumbles off the tilting ship (shields, oars, helmets, a barrel): start states captured in prepare()
  const shM = new THREE.MeshStandardMaterial({ color: '#a8322c', roughness: 0.55 }), brz = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 0.8, roughness: 0.35 }), oarM = new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.7 });
  const mkShield = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.06), shM)); const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), brz); b.position.z = 0.05; g.add(b); return g; };
  const mkOar = () => { const g = new THREE.Group(); const o = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 6.5, 6), oarM); g.add(o); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.42), oarM); bl.position.y = -3.4; g.add(bl); return g; };
  const mkHelm = () => new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brz);
  S.debris = [[mkShield, 25.6, 0.62, 1], [mkShield, 26.8, 0.5, -1], [mkOar, 27.2, 0.55, 1], [mkHelm, 27.9, 0.7, -1], [mkShield, 28.5, 0.4, 1], [mkOar, 29.1, 0.35, -1], [mkHelm, 29.8, 0.45, 1], [mkShield, 30.3, 0.66, -1], [mkOar, 30.9, 0.6, 1]]
    .map(([mk, t0, u, side], i) => { const m = mk(); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); m.visible = false; scene.add(m); return { m, t0, u, side, spin: [rnd(i, 1) * 6 - 3, rnd(i, 2) * 6 - 3, rnd(i, 3) * 6 - 3] }; });
  // fishing gag props: line, bobber, fish (invented visual joke illustrating Plutarch 17.3)
  S.line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), new THREE.MeshBasicMaterial({ color: '#e8e2d0' })); scene.add(S.line);
  S.bobber = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#c0302a', roughness: 0.4 })); scene.add(S.bobber);
  { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#2a1b17';
    g.beginPath(); g.moveTo(40, 64); g.quadraticCurveTo(110, 8, 190, 64); g.quadraticCurveTo(110, 120, 40, 64); g.closePath(); g.fillStyle = '#7fb0c0'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(190, 64); g.lineTo(240, 30); g.lineTo(240, 98); g.closePath(); g.fillStyle = '#5f90a4'; g.fill(); g.stroke(); g.beginPath(); g.arc(78, 56, 13, 0, 7); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.arc(80, 57, 6, 0, 7); g.fillStyle = '#2a1b17'; g.fill();
    g.beginPath(); g.moveTo(44, 72); g.quadraticCurveTo(58, 80, 64, 70); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    S.fish = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); S.fish.scale.set(0.9, 0.45, 1); scene.add(S.fish); }
  // catapult stones (fly over the ships and land far behind)
  S.stones = K.STONES.map((t0, i) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: '#8f8576', roughness: 1 })); m.castShadow = true; scene.add(m);
    return { m, t0, from: new THREE.Vector3(-6 + i * 5, 15, -3), to: new THREE.Vector3(-10 + i * 9, 0, 70 + i * 12), fl: 1.9 }; });
  // water cascading off the rising hull: falling streak sprites
  S.cascade = []; for (let i = 0; i < 90; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, color: '#e8f0f2', transparent: true, depthWrite: false, opacity: 0 })); scene.add(sp); S.cascade.push({ sp, u: 0.45 + rnd(i, 1) * 0.55, side: rnd(i, 2) > 0.5 ? 1 : -1, ph: rnd(i, 3), sz: 0.25 + rnd(i, 4) * 0.5 }); }
  // deck cargo that slides when the ship tilts
  S.barrels = []; for (let i = 0; i < 3; i++) { const b = await C.loadModel(i % 2 ? 'ceramic_vase_02' : 'ceramic_vase_01'); b.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.map = null; o.material.color.set(['#b0603a', '#a5583a', '#bd6f45'][i]); o.material.roughness = 0.88; } }); const bb = new THREE.Box3().setFromObject(b); b.scale.setScalar(0.75 / (bb.max.y - bb.min.y)); const g = new THREE.Group(); g.add(b); { const b2 = new THREE.Box3().setFromObject(b), c = b2.getCenter(new THREE.Vector3()); b.position.set(-c.x, -b2.min.y, -c.z); } SET.hero.body.add(g); S.barrels.push({ g, u: 0.55 + i * 0.09, v: (i - 1) * 0.45 }); }
  // sand tray with a geometric diagram (Plutarch: he died absorbed in a diagram); sits at Archimedes' feet in the reveal
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#d8c39a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 50},70,0.25)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  g.strokeStyle = 'rgba(90,70,40,0.9)'; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 150, 0, 7); g.stroke(); g.strokeRect(106, 106, 300, 300); g.beginPath(); g.moveTo(106, 406); g.lineTo(256, 106); g.lineTo(406, 406); g.stroke(); g.beginPath(); g.moveTo(60, 470); g.lineTo(470, 300); g.stroke(); g.beginPath(); g.arc(300, 360, 8, 0, 7); g.fill();
  const tt = new THREE.CanvasTexture(c); tt.colorSpace = THREE.SRGBColorSpace; const tray = new THREE.Group(); const top = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshStandardMaterial({ map: tt, roughness: 1 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.32; tray.add(top);
  const frameM = new THREE.MeshStandardMaterial({ color: '#6b4a30', roughness: 0.8 }); for (const [w2, d2, x2, z2] of [[1.4, 0.1, 0, 0.7], [1.4, 0.1, 0, -0.7], [0.1, 1.4, 0.7, 0], [0.1, 1.4, -0.7, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w2, 0.36, d2), frameM); b.position.set(x2, 0.18, z2); b.castShadow = true; tray.add(b); }
  tray.position.set(-5.4, SET.wallTop + 0.2, -2.6); scene.add(tray); S.tray = tray;
}

// ---------------- ship + machine state ----------------
const SHIP = { L: 30 };
function heroState(w, SY) {
  const H = SY.hero, Lb = H.L - 1.2 + 0.0, piv = SY.pivot;   // distance stern pivot -> bow grip (approx along the keel)
  let cz, lift = 0, sink = 0, roll = 0, rowMode = 'row', yaw = 0;
  cz = lerp(82, 31.4, s5(ramp(w, 0, 14.2))); if (w > 14.2) cz = 31.4 - 0.5 * ss(ramp(w, 14.2, 21));
  if (w > 12.5) rowMode = 'rest';
  // lift: angle eased with small jerks (the crew heaving), beam derived from the ship so the chain stays taut
  let th = 0; if (w >= K.LIFT0) { const k = ramp(w, K.LIFT0, K.LIFT1); th = 68 * D2R * (s5(k) + 0.012 * Math.sin(k * 40) * (1 - k)); }
  if (w >= K.REL) { const d = w - K.REL - 0.25; if (d < 0) th = 68 * D2R; else if (d < 0.85) th = 68 * D2R * (1 - (d / 0.85) ** 2); else { const e = d - 0.85; th = -17 * D2R * Math.exp(-e * 1.3) * Math.cos(e * 3.6) - 4 * D2R * (1 - Math.exp(-e)); sink = cl(e * 0.5) * 1.9 + 0.8 * Math.exp(-e * 2) * Math.sin(e * 6); roll = 18 * D2R * ss(cl(e / 3)); } }
  lift = th; const bowRise = Math.sin(th) * Lb;
  // drag toward the wall while standing up, so the bow stays under the beam tip
  if (w >= K.LIFT0 && w < K.REL + 1.1) { const tip = beamTip(beamAngle(w, SY, th), SY); const pivZ = tip.z + Lb * Math.cos(th); cz = Math.min(cz, pivZ - (H.L / 2 - 1.2)); }
  if (w >= K.REL + 1.1) { const tip0 = beamTip(beamAngle(K.REL, SY, 68 * D2R), SY); cz = tip0.z + Lb * Math.cos(68 * D2R) - (H.L / 2 - 1.2) + (w - K.REL - 1.1) * 0.25; }
  return { x: 1.0, cz, lift, sink, roll, rowMode, rowPhase: w * 0.55, bowRise, hidden: w >= K.DAYS };
}
function beamAngle(w, SY, th) {   // beam pitch (rad, + = tip up)
  const rest = 78 * D2R;           // reared up behind the battlements ("invisible at other times", Polybius)
  const grab = -30 * D2R;
  if (w < K.SWING0) return rest; if (w < K.SWING1) return lerp(rest, grab, s5(ramp(w, K.SWING0, K.SWING1)) + 0.04 * Math.sin(ramp(w, K.SWING0, K.SWING1) * Math.PI));
  if (w < K.LIFT0) return grab;
  if (w < K.REL + 0.25) { const H = SY.hero, Lb = H.L - 1.2, bowY = -H.draft * 0.7 + Math.sin(th) * Lb + (H.H + 1.4) * Math.cos(th), need = (bowY + chainLen(w) - SY.pivot.y) / SY.outer; return Math.asin(cl(need, -0.95, 0.95)); }
  return lerp(36 * D2R, 20 * D2R, ss(ramp(w, K.REL + 0.25, K.REL + 2)));
}
const chainLen = (w) => w < K.LOWER0 ? 1.5 : w < K.BITE ? lerp(1.5, 6.2, ss(ramp(w, K.LOWER0, K.BITE - 0.15))) : 6.2;
function beamTip(phi, SY) { const p = SY.pivot; return { x: p.x, y: p.y + Math.sin(phi) * SY.outer - 0.3, z: p.z + Math.cos(phi) * SY.outer }; }

export function frameOf(name, w) {   // camera attachment frames (ship-local)
  if (S.lastW !== w) { poseShips(w); S.lastW = w; } const SY = S.SY, ship = name === 'flag' ? SY.flag : SY.hero; ship.body.updateWorldMatrix(true, false); return name.endsWith('Root') ? ship.root.matrixWorld.clone() : ship.body.matrixWorld.clone();
}
let lastW = null;
function poseShips(w, C) {
  const { THREE } = S, SY = S.SY, sea = SY.sea, st = heroState(w, SY), H = SY.hero, F = SY.flag;
  // hero
  H.root.visible = !st.hidden; H.root.position.set(st.x, 0, st.cz); H.root.rotation.set(0, Math.PI / 2, 0);
  const bob = sea.heightAt(st.x, st.cz, w), sl = sea.slopeAt(st.x, st.cz, w), still = 1 - cl(st.lift / (10 * D2R));
  H.root.position.y = bob * still - st.sink; H.root.rotateZ(-sl[1] * 0.35 * still); H.root.rotateX(sl[0] * 0.25 * still + st.roll);
  H.lift.rotation.z = st.lift; H.setOars(st.rowPhase, st.lift > 0.12 ? 'dangle' : st.rowMode, new THREE.Vector3(-Math.sin(st.lift), -Math.cos(st.lift), 0));
  // flagship (Marcellus): follows, holds off, later the days-later approach and panic retreat
  let fx = -15, fz = lerp(96, 44, s5(ramp(w, 0, 15))), fro = 'row', back = 0;
  if (w > 15) fro = 'rest';
  if (w >= K.DAYS) { fx = -4; fz = lerp(40, 27, ss(ramp(w, K.DAYS, K.POKE))); fro = w < K.POKE ? 'row' : 'row'; if (w > K.POKE + 0.9) { back = (w - K.POKE - 0.9); fz += back * back * 2.2 + back * 2; } }
  if (w >= 55.5) { fx = 20; fz = 130; }
  F.root.position.set(fx, sea.heightAt(fx, fz, w), fz); F.root.rotation.set(0, Math.PI / 2 + (w >= K.DAYS && w < 55.5 ? 0.12 : -0.05), 0); const fs = sea.slopeAt(fx, fz, w); F.root.rotateZ(-fs[1] * 0.35); F.root.rotateX(fs[0] * 0.25);
  F.setOars(w * (back > 0 ? -1.4 : 0.55), fro);
  for (const s of SY.fleet) { const p = s.root.position; s.root.position.y = sea.heightAt(p.x, p.z, w); s.setOars(w * 0.5 + p.x * 0.1, w < 15 ? 'row' : 'rest'); if (!s.z0) s.z0 = p.z; p.z = s.z0 + (w < 15 ? lerp(40, 0, s5(ramp(w, 0, 15))) : 0) + (w >= 55.5 ? 60 : 0); }
  // machine
  const phi = beamAngle(w, SY, st.lift); SY.beam.rotation.x = -phi; SY.beam.visible = true;
  const tip = beamTip(phi, SY); H.lift.updateWorldMatrix(true, true);
  const grip = H.bowGrip.clone().applyMatrix4(H.body.matrixWorld);
  let handP; if (w < K.BITE) handP = new THREE.Vector3(tip.x, tip.y - chainLen(w), tip.z); else if (w < K.REL + 0.25) handP = grip; else { const d = w - K.REL - 0.25; handP = new THREE.Vector3(tip.x, Math.max(tip.y - 9, grip.y + 0.4 * Math.max(0, 0.6 - d)), tip.z + d * 0.4); }
  if (w >= K.BITE - 0.25 && w < K.BITE) { const k = ramp(w, K.BITE - 0.25, K.BITE); handP.lerp(grip, ss(k)); }
  SY.hand.position.copy(handP); SY.hand.rotation.set(0, 0, w > K.BITE && w < K.REL + 0.25 ? -st.lift * 0.6 : Math.sin(w * 1.3) * 0.08);
  // chain links from tip to hand
  const A = new THREE.Vector3(tip.x, tip.y, tip.z), B = handP.clone().add(new THREE.Vector3(0, 0.4, 0)), n = Math.min(119, Math.floor(A.distanceTo(B) / 0.24)), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), dir = B.clone().sub(A).normalize();
  const slack = w < K.BITE ? 0.0 : w > K.REL + 0.25 ? 0.6 : 0; for (let i = 0; i < 120; i++) { if (i >= n) { M.makeScale(0, 0, 0); SY.chain.setMatrixAt(i, M); continue; } const k = i / n, P = A.clone().lerp(B, k); P.y -= Math.sin(k * Math.PI) * slack;
    Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); if (i % 2) Q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)); M.compose(P, Q, new THREE.Vector3(1, 1, 1)); SY.chain.setMatrixAt(i, M); }
  SY.chain.instanceMatrix.needsUpdate = true; SY.winch.rotation.x = (w > K.LIFT0 ? (Math.min(w, K.REL) - K.LIFT0) * 2.2 : 0);
  // sliding cargo
  for (const b of S.barrels) { const slide = cl(Math.sin(st.lift) * 1.3 - 0.15) * (b.u - 0.12); const u = b.u - slide; b.g.position.copy(H.deckPoint(u, b.v)); b.g.rotation.set(0, 0, 0); b.g.visible = !st.hidden; }
  S.st = st; S.tip = tip; S.grip = grip; return st;
}

// actors on decks / walls / in the water
const ON = { titus: ['hero', 0.8, 0.25], crew1: ['hero', 0.62, -0.35], crew2: ['hero', 0.5, 0.35], crew3: ['hero', 0.34, -0.15], crew4: ['hero', 0.72, -0.5], crew5: ['hero', 0.44, 0.5], crew6: ['hero', 0.27, 0.2], marcellus: ['flag', 0.16, 0.1], officer1: ['flag', 0.26, -0.45], officer2: ['flag', 0.3, 0.45] };
export function placeActor(id, w, pose, C) {
  const { THREE } = S, SY = S.SY; if (S.lastW !== w) { poseShips(w, C); S.lastW = w; }
  if (id === 'archimedes') { if (w >= 55.5) return { x: -4.5, y: SY.wallTop + 0.3, z: -1.5 }; return { x: -4.5, y: SY.wallTop + 0.3, z: -1.6 }; }
  if (id.startsWith('worker')) { const i = +id.slice(-1); return { x: -1.4 + i * 1.4, y: SY.wallTop + 0.3, z: -5.9 }; }
  const on = ON[id]; if (!on) return null;
  let [ship, u, v] = on; if (w >= K.DAYS && ship === 'hero') { ship = 'flag'; u = { titus: 0.72, crew1: 0.62, crew2: 0.53, crew3: 0.4, crew4: 0.45, crew5: 0.33, crew6: 0.26 }[id]; v = { crew4: 0.9 }[id] ?? v;
    if (id === 'crew4' && w >= K.JUMP0) { if (!S.jumpFrom) prepare(C); const k = cl((w - K.JUMP0) / (K.JUMP1 - K.JUMP0)); if (k < 1) { const p = S.jumpFrom.clone().lerp(S.jumpTo, k); p.y = lerp(S.jumpFrom.y, SY.sea.heightAt(S.jumpTo.x, S.jumpTo.z, w) - 0.9, k) + Math.sin(k * Math.PI) * 2.2; return { x: p.x, y: p.y, z: p.z, lean: -40 * k, noShadow: true }; }
      return { x: S.jumpTo.x, y: SY.sea.heightAt(S.jumpTo.x, S.jumpTo.z, w) - 0.95, z: S.jumpTo.z, noShadow: true }; } }
  const S0 = ship === 'flag' ? SY.flag : SY.hero, st = S.st;
  if (ship === 'hero' && w > K.REL + 1.0 && w < K.DAYS) {   // in the water around the swamped hull
    const k = { titus: 0, crew1: 1, crew2: 2, crew3: 3, crew4: 4, crew5: 5, crew6: 6 }[id], x = st.x + (k % 2 ? -1 : 1) * (4.2 + k * 0.6), z = st.cz + 3 + k * 2.3;
    return { x, y: SY.sea.heightAt(x, z, w) - 0.95, z, noShadow: true };
  }
  let lean = 0; if (ship === 'hero' && st.lift > 0.02) { const slide = cl(Math.sin(st.lift) * 1.2 - 0.1) * (u - 0.1) * 0.5; u -= slide; lean = -st.lift / D2R * 0.3; }
  const p = S0.deckPoint(u, v).applyMatrix4(S0.body.matrixWorld); return { x: p.x, y: p.y, z: p.z, lean, noShadow: true, hide: ship === 'hero' && S.st.hidden };
}

export function prepare(C) {
  if (S.prepared) return; S.prepared = true; const { THREE } = S, SY = S.SY;
  for (const d of S.debris) { poseShips(d.t0, C); const H = SY.hero; d.p0 = H.deckPoint(d.u, d.side * 1.05).applyMatrix4(H.body.matrixWorld); d.v0 = new THREE.Vector3(d.side * 1.6, 0.8, 2.2); }
  poseShips(K.JUMP0, C); S.jumpFrom = SY.flag.deckPoint(0.45, 0.9).applyMatrix4(SY.flag.body.matrixWorld); poseShips(K.JUMP1, C); S.jumpTo = new THREE.Vector3(3.6, 0, 0).applyMatrix4(SY.flag.root.matrixWorld).setY(0);
  S.lastW = null;
}
export function frame(w, C, t) {
  const { THREE } = S, SY = S.SY; if (S.lastW !== w) { poseShips(w, C); S.lastW = w; }
  SY.sea.update(w);
  // dawn: pre-dawn blue -> sunrise during the lift -> golden morning; "days later" is daytime
  const day = w >= K.DAYS ? 1 : ss(ramp(w, 12, 31)), sunUp = w >= K.DAYS ? 1 : ss(ramp(w, 26, 33));
  C.scene.environmentIntensity = lerp(0.16, 0.6, day); C.scene.backgroundIntensity = lerp(0.12, 0.72, day); SY.sun.intensity = lerp(0.0, 3.4, sunUp); SY.hemi.intensity = lerp(0.12, 0.25, day);
  SY.fog.color.setRGB(lerp(0.11, 0.79, day), lerp(0.13, 0.72, day), lerp(0.2, 0.66, day)); C.renderer.toneMappingExposure = lerp(0.85, 0.88, day);
  for (const T of SY.torches) { const fl = 1 + 0.15 * Math.sin(w * 23 + T.x) + 0.1 * Math.sin(w * 37 + T.x * 2); T.f.scale.set(0.9 * fl, 1.4 * fl, 1); T.f.material.opacity = lerp(1, 0.35, day); if (T.L) T.L.intensity = 30 * fl * lerp(1, 0.25, day); }
  SY.mist.forEach((m, i) => { m.material.opacity = lerp(0.35, 0.2, day); m.material.color.setRGB(lerp(0.16, 0.92, day), lerp(0.2, 0.88, day), lerp(0.28, 0.84, day)); m.material.map.offset.x = w * 0.004 * (i + 1); });
  // stones
  for (const s of S.stones) { const a = (w - s.t0) / s.fl; s.m.visible = a > 0 && a < 1; if (s.m.visible) { s.m.position.lerpVectors(s.from, s.to, a); s.m.position.y += Math.sin(a * Math.PI) * 14; s.m.rotation.set(a * 9, a * 7, 0); } }
  // splashes: stones landing, hand biting, bow slam, hull slap, swamping
  const st = S.st, ev = [];
  for (const s of S.stones) ev.push({ t0: s.t0 + s.fl, pos: [s.to.x, 0, s.to.z], power: 0.9 });
  const bowZ = S.grip ? S.grip.z : 15; ev.push({ t0: K.REL + 1.1, pos: [1.0, 0.2, bowZ + 1], power: 2.4, spread: [1.6, 1.2] }); ev.push({ t0: K.REL + 1.25, pos: [3.5, 0.2, bowZ + 6], power: 1.6, spread: [1.4, 1] }); ev.push({ t0: K.REL + 1.25, pos: [-1.5, 0.2, bowZ + 6], power: 1.6, spread: [1.4, 1] });
  ev.push({ t0: K.REL + 1.5, pos: [1, 0.2, bowZ + 13], power: 1.2 });
  S.splash.update(w, ev);
  const hit = K.REL + 1.1, bz = S.impactZ ?? (S.impactZ = bowZ);
  S.impact.update(w, [{ t0: hit, pos: [1.0, 0.3, bz + 0.5], power: 1.4, scale: 2.4, spread: [1.3, 1.0] }, { t0: hit + 0.12, pos: [1.0, 0.3, bz + 5], power: 1.1, scale: 2.0, spread: [1.6, 0.8] }, { t0: hit + 0.2, pos: [1.0, 0.3, bz + 10], power: 0.8, scale: 1.6, spread: [1.8, 0.8] }]);
  S.rings.forEach((m, i) => { const a = w - hit - i * 0.25; m.visible = a > 0 && a < 4.5 && w < K.DAYS; if (!m.visible) return; const r = 4 + a * (6 - i); m.scale.set(r * 2, r * 2 * (1 + i * 0.3), 1); m.position.set(1.0, SY.sea.heightAt(1, bz + 4 + i * 3, w) + 0.12, bz + 4 + i * 3); m.material.opacity = 0.75 * (1 - a / 4.5); });
  // the impact: crater + expanding wave in the sea surface, a crown of water columns, debris splashes
  if (!S.impactSet && S.impactZ != null) { SY.sea.setImpact(1.0, S.impactZ + 4, hit, 1.6); S.impactSet = true; }
  S.crown.update(w, [{ t0: hit, pos: [1.0, 0.0, bz + 1.5], r0: 3.6, H: 19, dur: 1.7, stretch: [1.5, 1.0] }, { t0: hit + 0.12, pos: [1.0, 0.0, bz + 8], r0: 2.6, H: 10, dur: 1.3, stretch: [1.6, 0.9] }, { t0: hit + 0.22, pos: [1.0, 0.0, bz + 15], r0: 2.0, H: 6, dur: 1.1 }]);
  const dEv = []; for (const d of S.debris) { if (!d.p0) { d.m.visible = false; continue; } const a = w - d.t0; d.m.visible = a > 0 && w < K.DAYS; if (!d.m.visible) continue;
    const g = 9.81, p = d.p0.clone().addScaledVector(d.v0, a); p.y -= 0.5 * g * a * a; const sh = SY.sea.heightAt(p.x, p.z, w);
    if (p.y > sh) { d.m.position.copy(p); d.m.rotation.set(d.spin[0] * a, d.spin[1] * a, d.spin[2] * a); } else { const tHit = (d.v0.y + Math.sqrt(d.v0.y * d.v0.y + 2 * g * Math.max(0, d.p0.y - sh))) / g; d.m.position.set(p.x, sh + 0.02, p.z); d.m.rotation.set(Math.PI / 2 + Math.sin(w) * 0.1, d.spin[1] * tHit, 0); dEv.push({ t0: d.t0 + tHit, pos: [p.x, sh, p.z], power: 0.55 }); } }
  S.debrisSplash.update(w, dEv.concat([{ t0: K.JUMP1, pos: S.jumpTo ? [S.jumpTo.x, 0.2, S.jumpTo.z] : [0, -50, 0], power: 0.8 }, { t0: K.YANK, pos: [-4.2, 0.2, 4.8], power: 0.45 }]));
  // fishing gag (days later)
  const A = C.ACT.archimedes, fishing = w >= K.DAYS && A?.out?.propTip; S.line.visible = S.bobber.visible = S.fish.visible = !!fishing;
  if (fishing) { const tip = C.cardToWorld(A, A.out.propTip, 0.06), water = new THREE.Vector3(tip.x + 0.4, SY.sea.heightAt(tip.x + 0.4, 4.8, w) + 0.04, 4.8);
    const bob = w > K.BITEFISH && w < K.YANK ? Math.sin(w * 30) * 0.08 - 0.06 : Math.sin(w * 2) * 0.02; let end = water.clone(); end.y += bob;
    if (w >= K.YANK) { const k = cl((w - K.YANK) / (K.CAUGHT - K.YANK)), hang = tip.clone().add(new THREE.Vector3(0, -0.7, 0.1)); end = water.clone().lerp(hang, ss(k)); end.y += Math.sin(k * Math.PI) * 3; }
    S.bobber.position.copy(end); S.bobber.visible = w < K.YANK; const mid = tip.clone().add(end).multiplyScalar(0.5), len = tip.distanceTo(end); S.line.position.copy(mid); S.line.scale.set(1, len, 1); S.line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(tip).normalize());
    S.fish.visible = w >= K.YANK; S.fish.position.copy(end).add(new THREE.Vector3(0, -0.25, 0)); S.fish.material.rotation = w < K.CAUGHT ? (w - K.YANK) * 14 : Math.PI / 2 + Math.sin(w * 18) * 0.5; }
  // atmosphere: sun glow at dawn, surf along the rocks, stronger grade
  SY.sunGlow.material.opacity = 0.55 * sunUp * (w >= K.DAYS ? 0.4 : 1); SY.surf.material.map.offset.x = w * 0.02; SY.surf.material.opacity = 0.55 + 0.25 * Math.sin(w * 1.1);
  C.grade.uniforms.con.value = 0.27; C.grade.uniforms.vig.value = 0.38;
  S.spray2.update(w, [{ t0: K.LIFT0 + 0.2, pos: [1, 0.2, (S.grip?.z || 15) + 0.5], power: 0.8, spread: [0.6, 0.6] }, { t0: K.DAYS + 3.1, pos: [-4, 0.2, 27], power: 0.6 }]);
  // cascading water from the rising hull
  const H = SY.hero; for (const c of S.cascade) { const on = st.lift > 0.05 && w < K.REL + 1 && !st.hidden; c.sp.visible = on; if (!on) continue;
    const p = H.deckPoint(c.u, c.side * 1.1).setY(0.4).applyMatrix4(H.body.matrixWorld), ph = (w * 1.6 + c.ph) % 1; c.sp.position.set(p.x + c.side * 0.4, Math.max(0.1, p.y - ph * ph * 9), p.z); c.sp.scale.set(c.sz, c.sz * 2.6, 1); c.sp.material.opacity = 0.55 * (1 - ph) * cl(st.lift * 3); }
}

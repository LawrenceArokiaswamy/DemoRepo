// "The Claw of Syracuse" business: ship + machine choreography as pure functions of WORLD time w (see story.json timeMap).
// Documented (Polybius 8.5-8.7): night approach; ships close in under the wall; beam projecting over the wall; iron hand on a
// chain grips the prow; the operator presses down the inner end, the ship stands upright on its stern; the chain is let go
// suddenly; ships capsize or fill. Reconstruction (ours): machine dimensions, counterweight + windlass, timings, the ship's look.
const K = { STONES: [11.0, 11.8, 12.6], CREAK: 14.4, SWING0: 16.2, SWING1: 19.6, LOWER0: 18.8, BITE: 21.0, LIFT0: 22.6, LIFT1: 31.0, REL: 32.6, DAYS: 49.5, POKE: 55.4, JUMP0: 56.3, JUMP1: 57.0, BITEFISH: 56.4, YANK: 57.0, CAUGHT: 57.45 };
const lerp = (a, b, k) => a + (b - a) * k, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ramp = (w, a, b) => cl((w - a) / (b - a));
const ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, s5 = (x) => { x = cl(x); return x * x * x * (x * (6 * x - 15) + 10); };
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const D2R = Math.PI / 180;
let S = null, THREE = null; const setThree = (T) => { THREE = T; };

export async function init(C) {
  const { THREE, scene, SET } = C; S = { THREE, SY: SET }; setThree(C.THREE);
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
  S.splinters = []; for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25 + rnd(i, 21) * 0.3), new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: 0.8 })); m.visible = false; scene.add(m);
    S.splinters.push({ m, v: [(rnd(i, 22) - 0.5) * 6, 2 + rnd(i, 23) * 4, (rnd(i, 24) - 0.2) * 5], r: 10 + rnd(i, 25) * 20 }); }
  S.dust = []; for (let i = 0; i < 60; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, color: '#b9a88e', transparent: true, depthWrite: false, opacity: 0 })); sp.scale.set(0.25 + rnd(i, 31) * 0.4, 0.25 + rnd(i, 31) * 0.4, 1); sp.visible = false; scene.add(sp);
    S.dust.push({ s: sp, o: [(rnd(i, 32) - 0.5) * 2.5, (rnd(i, 33) - 0.6) * 3, (rnd(i, 34) - 0.5) * 12 + 4], drift: (rnd(i, 35) - 0.5) * 0.6, delay: rnd(i, 36) * 0.3 }); }
  { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.35, 'rgba(235,245,248,0.9)'); gr.addColorStop(1, 'rgba(235,245,248,0.15)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(16, 64, 9, 62, 0, 0, 7); g.fill(); S.streak = new THREE.CanvasTexture(c); S.streak.colorSpace = THREE.SRGBColorSpace; }
  S.drops = []; for (let i = 0; i < 260; i++) { const drip = i % 3 === 0, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.streak, color: '#eaf3f5', transparent: true, depthWrite: false, opacity: 0 })); sp.visible = false; scene.add(sp);
    S.drops.push({ sp, drip, keel: rnd(i, 41) > 0.35, u: i % 7 === 1 ? 0.9 + rnd(i, 42) * 0.1 : 0.52 + rnd(i, 42) * 0.48, side: rnd(i, 43) > 0.5 ? 1 : -1, per: 0.8 + rnd(i, 44) * 0.9, ph: rnd(i, 45), w: drip ? 0.035 + rnd(i, 46) * 0.03 : (i % 7 === 1 ? 0.6 + rnd(i, 46) * 0.5 : 0.1 + rnd(i, 46) * 0.16) }); }
  S.dropSplash = makeSplash(THREE, scene, S.tex, { count: 120, seed: 17 });
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
  // extra distant fleet (story.extraFleet): low-detail hulls behind the main fleet so 'sixty warships' reads as a mass
  if (C.story.extraFleet) { const { buildWarship } = await import('/engine/web/props/warship.js'); const n = C.story.extraFleet;
    for (let i = 0; i < n; i++) { const s = buildWarship(THREE, { L: 30, B: 5, H: 3, pbr: null, eye: false, oarsPerSide: 8, seed: 40 + i }), row = Math.floor(i / 6), col = i % 6;
      s.root.position.set(-110 + col * 44 + (row % 2) * 22 + (rnd(i, 51) - 0.5) * 10, 0, 175 + row * 32 + rnd(i, 52) * 10); s.root.rotation.y = Math.PI / 2 + (rnd(i, 53) - 0.5) * 0.2; scene.add(s.root); SET.fleet.push(s); } }
  // rope gag (story.ropeGag): a short pole swings out over the battlement like a tiny claw-arm, a rope dangling from it (Plutarch, Marcellus 17)
  if (C.story.ropeGag) { const R = C.story.ropeGag, wood = new THREE.MeshStandardMaterial({ color: '#7a5636', roughness: 0.85 }), hemp = new THREE.MeshStandardMaterial({ color: '#8a6a3e', roughness: 0.95 });
    const piv = new THREE.Group(); piv.position.set(...R.pivot); scene.add(piv); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, R.len, 8), wood); pole.rotation.x = Math.PI / 2; pole.position.z = R.len / 2; pole.castShadow = true; piv.add(pole);
    const segs = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 6), hemp); m.castShadow = true; scene.add(m); segs.push(m); }
    S.rope = { R, piv, segs, tip: new THREE.Vector3() }; }
}

// ---------------- ship + machine state ----------------
const SHIP = { L: 30 };
function heroState(w, SY) {
  const H = SY.hero, Lb = H.L - 1.2 + 0.0, piv = SY.pivot;   // distance stern pivot -> bow grip (approx along the keel)
  let cz, lift = 0, sink = 0, roll = 0, rowMode = 'row', yaw = 0;
  cz = lerp(82, 31.4, s5(ramp(w, 0, 14.2))); if (w > 14.2) cz = 31.4 - 0.5 * ss(ramp(w, 14.2, 21));
  if (w > 12.5) rowMode = 'rest';
  // lift: angle eased with small jerks (the crew heaving), beam derived from the ship so the chain stays taut
  let th = 0; if (w >= K.LIFT0) { const d = w - K.LIFT0, hold = 0.6;   // the sea holds the hull a moment (suction), then it breaks free and rises in heaves
    const k = cl((d - hold) / (K.LIFT1 - K.LIFT0 - hold)), ke = cl(k - (0.8 / (2 * Math.PI * 6)) * Math.sin(2 * Math.PI * 6 * k));
    th = 68 * D2R * s5(ke) + (d < hold ? 0.7 * D2R * Math.sin(d / hold * Math.PI) : 0); sink = Math.sin(th) * 0.7; }
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
  const liftK = cl(st.lift / (20 * D2R)); if (liftK > 0 && w < K.REL + 0.25) { H.root.rotateX(0.035 * Math.sin(w * 0.8) * liftK); H.root.rotateY(0.02 * Math.sin(w * 0.55 + 1) * liftK); }
  if (H.rig) { const dt = 0.06, th = (x) => heroState(x, SY).lift, acc = (th(w + dt) - 2 * st.lift + th(w - dt)) / (dt * dt); H.rig.rotation.z = cl(-acc * 0.012, -0.14, 0.14) + 0.025 * Math.sin(w * 2.1) * liftK; }
  H.setTime(w); H.lift.rotation.z = st.lift; H.setOars(st.rowPhase, st.lift > 0.12 ? 'dangle' : st.rowMode, new THREE.Vector3(-Math.sin(st.lift), -Math.cos(st.lift), 0));
  // flagship (Marcellus): follows, holds off, later the days-later approach and panic retreat
  let fx = -15, fz = lerp(96, 44, s5(ramp(w, 0, 15))), fro = 'row', back = 0;
  if (w > 15) fro = 'rest';
  if (w >= K.DAYS) { fx = -4; fz = lerp(40, 27, ss(ramp(w, K.DAYS, K.POKE))); fro = w < K.POKE ? 'row' : 'row'; if (w > K.POKE + 0.9) { back = (w - K.POKE - 0.9); fz += back * back * 2.2 + back * 2; } }
  if (w >= 59.5) { fx = 20; fz = 130; }
  F.root.position.set(fx, sea.heightAt(fx, fz, w), fz); F.root.rotation.set(0, Math.PI / 2 + (w >= K.DAYS && w < 59.5 ? 0.12 : -0.05), 0); const fs = sea.slopeAt(fx, fz, w); F.root.rotateZ(-fs[1] * 0.35); F.root.rotateX(fs[0] * 0.25);
  F.setOars(w * (back > 0 ? -1.4 : 0.55), fro);
  for (const s of SY.fleet) { const p = s.root.position; s.root.position.y = sea.heightAt(p.x, p.z, w); s.setOars(w * 0.5 + p.x * 0.1, w < 15 ? 'row' : 'rest'); if (!s.z0) s.z0 = p.z; p.z = s.z0 + (w < 15 ? lerp(40, 0, s5(ramp(w, 0, 15))) : 0) + (w >= 59.5 ? 30 : 0); }
  // machine
  const phi = beamAngle(w, SY, st.lift), eSnap = w - (K.LIFT0 - 0.1); SY.beam.rotation.x = -phi + (w > K.LIFT0 - 0.1 && w < K.REL + 0.25 ? 0.004 * Math.sin(w * 41) + 0.02 * Math.exp(-Math.max(0, eSnap) * 4) * Math.sin(Math.max(0, eSnap) * 30) : 0); SY.beam.visible = true;
  const tip = beamTip(phi, SY); H.lift.updateWorldMatrix(true, true);
  const grip = H.bowGrip.clone().applyMatrix4(H.body.matrixWorld);
  let handP; if (w < K.BITE) handP = new THREE.Vector3(tip.x, tip.y - chainLen(w), tip.z); else if (w < K.REL + 0.25) handP = grip; else { const d = w - K.REL - 0.25; handP = new THREE.Vector3(tip.x, Math.max(tip.y - 9, grip.y + 0.4 * Math.max(0, 0.6 - d)), tip.z + d * 0.4); }
  if (w >= K.BITE - 0.25 && w < K.BITE) { const k = ramp(w, K.BITE - 0.25, K.BITE); handP.lerp(grip, ss(k)); }
  SY.hand.position.copy(handP); SY.hand.rotation.set(0, 0, w > K.BITE && w < K.REL + 0.25 ? -st.lift * 0.6 : Math.sin(w * 1.3) * 0.08);
  // chain links from tip to hand
  const A = new THREE.Vector3(tip.x, tip.y, tip.z), B = handP.clone().add(new THREE.Vector3(0, 0.4, 0)), n = Math.min(119, Math.floor(A.distanceTo(B) / 0.24)), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), dir = B.clone().sub(A).normalize();
  const SNAP = K.LIFT0 - 0.1, load = w > SNAP && w < K.REL + 0.25 ? 1 : 0; let slack = 0, vib = 0;
  if (w >= K.BITE && w < SNAP) slack = 1.5 * (1 - ss(ramp(w, K.BITE + 0.5, SNAP)));
  if (w >= SNAP && w < K.REL + 0.25) { const e = w - SNAP; vib = 0.28 * Math.exp(-e * 4.5) * Math.sin(e * 62) + 0.025 * Math.sin(w * 93); }
  if (w > K.REL + 0.25) slack = 0.6;
  for (let i = 0; i < 120; i++) { if (i >= n) { M.makeScale(0, 0, 0); SY.chain.setMatrixAt(i, M); continue; } const k = i / n, P = A.clone().lerp(B, k); P.y -= Math.sin(k * Math.PI) * slack; P.x += Math.sin(k * Math.PI) * vib;
    Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); if (i % 2) Q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)); M.compose(P, Q, new THREE.Vector3(1, 1, 1)); SY.chain.setMatrixAt(i, M); }
  SY.chain.instanceMatrix.needsUpdate = true; SY.winch.rotation.x = (w > K.LIFT0 ? (Math.min(w, K.REL) - K.LIFT0) * 2.2 : 0);
  // sliding cargo
  for (const b of S.barrels) { const slide = cl(Math.sin(st.lift) * 1.3 - 0.15) * (b.u - 0.12); const u = b.u - slide; b.g.position.copy(H.deckPoint(u, b.v)); b.g.rotation.set(0, 0, 0); b.g.visible = !st.hidden; }
  S.st = st; S.tip = tip; S.grip = grip; return st;
}

// actors on decks / walls / in the water
const ON = { titus: ['hero', 0.8, 0.25], crew1: ['hero', 0.62, -0.35], crew2: ['hero', 0.5, 0.35], crew3: ['hero', 0.34, -0.15], crew4: ['hero', 0.72, -0.5], crew5: ['hero', 0.44, 0.5], crew6: ['hero', 0.27, 0.2], marcellus: ['flag', 0.16, 0.1], officer1: ['flag', 0.26, -0.45], officer2: ['flag', 0.3, 0.45] };
export function placeActor(id, w, pose, C) {
  const HA = C.story.hideAfter; if (HA && w >= HA.w && HA.ids.includes(id)) return { x: 0, y: -50, z: 0, hide: true };   // story option: actors leave the stage
  const { THREE } = S, SY = S.SY; if (S.lastW !== w) { poseShips(w, C); S.lastW = w; }
  if (id === 'archimedes') { if (w >= 59.5) return { x: -4.5, y: SY.wallTop + 0.3, z: -1.5 }; return { x: -4.5, y: SY.wallTop + 0.3, z: -1.6 }; }
  if (id.startsWith('worker')) { const i = +id.slice(-1), WR = C.story.workerRun;   // story option: defenders run along the walkway
    if (WR && w >= WR.t0 - 0.5 && w <= WR.t1 + 0.5) { const k = cl((w - WR.t0 - i * 0.25) / (WR.t1 - WR.t0)); return { x: lerp(WR.x0, WR.x1, k) - i * 1.5, y: SY.wallTop + 0.3 + Math.abs(Math.sin(w * 9 + i)) * 0.08, z: WR.z + i * 0.35, lean: 10 }; }
    return { x: -1.4 + i * 1.4, y: SY.wallTop + 0.3, z: -5.9 }; }
  const on = ON[id]; if (!on) return null;
  let [ship, u, v] = on; if (w >= K.DAYS && ship === 'hero') { ship = 'flag'; u = { titus: 0.72, crew1: 0.62, crew2: 0.53, crew3: 0.4, crew4: 0.45, crew5: 0.33, crew6: 0.26 }[id]; v = { crew4: 0.9 }[id] ?? v;
    if (id === 'crew4' && w >= K.JUMP0) { if (!S.jumpFrom) prepare(C); const k = cl((w - K.JUMP0) / (K.JUMP1 - K.JUMP0)); if (k < 1) { const p = S.jumpFrom.clone().lerp(S.jumpTo, k); p.y = lerp(S.jumpFrom.y, SY.sea.heightAt(S.jumpTo.x, S.jumpTo.z, w) - 0.9, k) + Math.sin(k * Math.PI) * 2.2; return { x: p.x, y: p.y, z: p.z, lean: -40 * k, noShadow: true }; }
      return { x: S.jumpTo.x, y: SY.sea.heightAt(S.jumpTo.x, S.jumpTo.z, w) - 0.95, z: S.jumpTo.z, noShadow: true }; } }
  const S0 = ship === 'flag' ? SY.flag : SY.hero, st = S.st;
  if (ship === 'hero' && w > K.REL + 1.0 && w < K.DAYS) {   // in the water around the swamped hull
    const k = { titus: 0, crew1: 1, crew2: 2, crew3: 3, crew4: 4, crew5: 5, crew6: 6 }[id], x = st.x + (k % 2 ? -1 : 1) * (4.2 + k * 0.6), z = st.cz + 3 + k * 2.3;
    return { x, y: SY.sea.heightAt(x, z, w) - 0.95, z, noShadow: true };
  }
  let lean = 0; if (ship === 'hero' && st.lift > 0.02) { const sl = (L) => cl(Math.sin(L) * 1.2 - 0.1) * (u - 0.1) * 0.5, slide = sl(st.lift), prev = sl(heroState(w - 0.08, SY).lift), spd = Math.abs(slide - prev) / 0.08 * 30;
    u -= slide; lean = -Math.min(14, st.lift / D2R * 0.22); if (spd > 0.05 && pose) pose.gait = { phase: slide * 9, amt: Math.min(1, spd * 0.6), run: false, dir: -1, lift: 1, stride: 1 }; }
  if (ship === 'hero' && pose && w > K.LIFT0 + 0.3 && w < K.REL + 0.4) { const R = REACT[id]; if (R) { const r = R(w, u, v, S0, pose); if (r) { u = r.u ?? u; v = r.v ?? v; } } }
  const p = S0.deckPoint(u, v).applyMatrix4(S0.body.matrixWorld), up = new THREE.Vector3(0, 1, 0).transformDirection(S0.body.matrixWorld);
  if (pose && pose._grips) { for (const [side, wp, k] of pose._grips) { const uv = worldToCard(p, wp, C); pose['reach' + side] = { pt: uv, k }; pose['hand' + side] = 'grip'; } delete pose._grips; }
  return { x: p.x, y: p.y, z: p.z, lean, noShadow: true, shadowUp: up.toArray(), hide: ship === 'hero' && S.st.hidden };
}

// project a world point onto an actor's camera-facing card (0..1 card coords) so hands can grip real 3D objects
function worldToCard(pos, wp, C) { const cam = C.camera.position, ry = Math.atan2(cam.x - pos.x, cam.z - pos.z), H = C.story.cardHeight || 1.62, W = H * 0.6;
  const rx = Math.cos(ry), rz = -Math.sin(ry), d = (wp.x - pos.x) * rx + (wp.z - pos.z) * rz; return [cl(0.5 + d / W, -0.2, 1.2), cl(1 - (wp.y - pos.y) / H, -0.1, 1.1)]; }
// how each sailor copes once the deck tilts (fear made varied and physical: gripping, crouching, sliding, praying)
const rail = (S0, u, side, h = 0.85) => S0.deckPoint(u, side * 1.18).add(new THREE.Vector3(0, h, 0)).applyMatrix4(S0.body.matrixWorld);
const gk = (w, t0) => ss(cl((w - t0) / 0.35));
const REACT = {
  titus: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 1.4); P._grips = [['R', rail(S0, u + 0.01, 1, 0.75), k], ['L', rail(S0, u + 0.035, 1, 0.95), k]]; P.lean = (P.lean || 0) - 6 * k; return { v: lerp(v, 0.92, k) }; },
  crew1: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 0.9), mu = 0.545; const m = S0.deckPoint(mu + 0.008, 0).add(new THREE.Vector3(0, 1.0, 0)).applyMatrix4(S0.body.matrixWorld); P._grips = [['L', m, k], ['R', m.clone().add(new THREE.Vector3(0, 0.25, 0)), k]]; P.face && (P.face.lidT = P.face.lidT.map((x) => Math.max(x, 0.55 * k))); return { u: lerp(u, mu - 0.012, k), v: lerp(v, 0.18, k) }; },
  crew2: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 1.1); P.squash = (P.squash || 0) + 0.32 * k; P.bob = (P.bob || 0) + 3.2 * k; P.armL = [150, 130]; P.armR = [150, 130]; P.handL = P.handR = 'spread'; P.headTilt = (P.headTilt || 0) + 10 * k + 3 * Math.sin(w * 31); return null; },
  crew3: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 1.6); P.sit = k; P.gait = null; P.armL = [120 + 30 * Math.sin(w * 7), 20]; P.armR = [130 + 30 * Math.sin(w * 6 + 1), 30]; P.handL = P.handR = 'spread'; return { u: u - 0.06 * k * cl((w - K.LIFT0 - 1.6) / 3) }; },
  crew4: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 1.2); P._grips = [['L', rail(S0, u, -1, 0.85), k]]; P.armR = [105 + 10 * Math.sin(w * 5), -15]; P.handR = 'spread'; return { v: lerp(v, -0.9, k) }; },
  crew5: (w, u, v, S0, P) => { P.armL = [150 + 40 * Math.sin(w * 9), 30]; P.armR = [150 + 40 * Math.sin(w * 9 + 3), 30]; P.handL = P.handR = 'spread'; return null; },
  crew6: (w, u, v, S0, P) => { const k = gk(w, K.LIFT0 + 1.8); const c = S0.deckPoint(u, v).add(new THREE.Vector3(0, 1.0, 0)).applyMatrix4(S0.body.matrixWorld); P._grips = [['L', c, k * 0.9], ['R', c, k * 0.9]]; if (P.face) { P.face.lidT = P.face.lidT.map(() => 0.9 * k + 0.1); P.face.tears = 0.6 * k; } P.headTilt = (P.headTilt || 0) + 8 * k; return null; },
};
export function cardLight(C, A) {   // shade each character from the side the sun is actually on, for this camera; rim takes the sky's colour
  const SY = S.SY, r = new THREE.Vector3().setFromMatrixColumn(C.camera.matrixWorld, 0), sd = SY.sunDir, sideDot = sd.x * r.x + sd.z * r.z, up = SY.sun.intensity / 3.4;
  return { dir: sideDot >= 0 ? 1 : -1, contrast: 0.75 + 0.55 * up, rim: up > 0.3 ? '255,206,160' : '170,190,230', rimI: 0.55 + 0.6 * up };
}
export function prepare(C) {
  if (S.prepared) return; S.prepared = true; const { THREE } = S, SY = S.SY;
  for (const d of S.debris) { poseShips(d.t0, C); const H = SY.hero; d.p0 = H.deckPoint(d.u, d.side * 1.05).applyMatrix4(H.body.matrixWorld); d.v0 = new THREE.Vector3(d.side * 1.6, 0.8, 2.2); }
  poseShips(K.BITE + 0.02, C); S.biteP = S.grip.clone();
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
  const HZ = (C.story.clearAfter != null && w >= C.story.clearAfter) ? (C.story.hazeScale ?? 0.3) : 1; SY.fog.near = 60 / HZ; SY.fog.far = 420 / HZ;   // story option: clearer air late in the film
  const EX = (C.story.exposure || []).find((e) => t >= e[0] && t < e[1]);   // story option: per-shot exposure / glare override [t0, t1, exposure, sunGlowScale]
  if (EX) { C.renderer.toneMappingExposure = EX[2]; }
  SY.mist.forEach((m, i) => { m.material.opacity = lerp(0.35, 0.2, day) * HZ; m.material.color.setRGB(lerp(0.16, 0.92, day), lerp(0.2, 0.88, day), lerp(0.28, 0.84, day)); m.material.map.offset.x = w * 0.004 * (i + 1); });
  // stones
  if (S.rope) { const { R, piv, segs } = S.rope, on = w >= K.DAYS && w < (R.until ?? 1e9), k = ss(ramp(w, R.t0, R.t0 + R.swing)); piv.visible = on; piv.rotation.x = lerp(-1.35, -0.12, k) + Math.sin(w * 2.1) * 0.03 * k;   // pole tips out over the sea
    piv.updateMatrixWorld(true); const tip = new THREE.Vector3(0, 0, R.len).applyMatrix4(piv.matrixWorld); let prev = tip.clone(); const sw = Math.sin((w - R.t0) * 2.4) * 0.35 * (1 - 0.5 * k) * k;
    segs.forEach((m, i) => { m.visible = on && k > 0.02; const a = (i + 1) / segs.length, nx = tip.x + Math.sin(sw * a * 1.6) * 0.42 * (i + 1) * 0.35, ny = tip.y - 0.4 * (i + 1) * k, nz = tip.z + Math.sin(sw * a) * 0.42 * (i + 1) * 0.6;
      const p = new THREE.Vector3(nx, ny, nz), mid = prev.clone().add(p).multiplyScalar(0.5); m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().sub(prev).normalize()); prev = p; }); }
  for (const s of S.stones) { const a = (w - s.t0) / s.fl; s.m.visible = !C.story.noStones && a > 0 && a < 1; if (s.m.visible) { s.m.position.lerpVectors(s.from, s.to, a); s.m.position.y += Math.sin(a * Math.PI) * 14; s.m.rotation.set(a * 9, a * 7, 0); } }
  // splashes: stones landing, hand biting, bow slam, hull slap, swamping
  const st = S.st, ev = [];
  if (!C.story.noStones) for (const s of S.stones) ev.push({ t0: s.t0 + s.fl, pos: [s.to.x, 0, s.to.z], power: 0.9 });
  const bowZ = S.grip ? S.grip.z : 15; ev.push({ t0: K.REL + 1.1, pos: [1.0, 0.2, bowZ + 1], power: 2.4, spread: [1.6, 1.2] }); ev.push({ t0: K.REL + 1.25, pos: [3.5, 0.2, bowZ + 6], power: 1.6, spread: [1.4, 1] }); ev.push({ t0: K.REL + 1.25, pos: [-1.5, 0.2, bowZ + 6], power: 1.6, spread: [1.4, 1] });
  ev.push({ t0: K.REL + 1.5, pos: [1, 0.2, bowZ + 13], power: 1.2 });
  S.splash.update(w, ev);
  const hit = K.REL + 1.1, bz = S.impactZ ?? (S.impactZ = bowZ);
  S.impact.update(w, [{ t0: hit, pos: [1.0, 0.3, bz + 0.5], power: 1.4, scale: 2.4, spread: [1.3, 1.0] }, { t0: hit + 0.12, pos: [1.0, 0.3, bz + 5], power: 1.1, scale: 2.0, spread: [1.6, 0.8] }, { t0: hit + 0.2, pos: [1.0, 0.3, bz + 10], power: 0.8, scale: 1.6, spread: [1.8, 0.8] }]);
  S.rings.forEach((m, i) => { if (w < hit && S.sternZ) { const a = w - K.LIFT0 - 0.6 - i * 0.4; m.visible = a > 0 && a < 4; if (!m.visible) return; const r = 3 + a * (5.5 - i); m.scale.set(r * 2, r * 2, 1); m.position.set(1.0, SY.sea.heightAt(1, S.sternZ, w) + 0.1, S.sternZ); m.material.opacity = 0.55 * (1 - a / 4); return; } const a = w - hit - i * 0.25; m.visible = a > 0 && a < 4.5 && w < K.DAYS; if (!m.visible) return; const r = 4 + a * (6 - i); m.scale.set(r * 2, r * 2 * (1 + i * 0.3), 1); m.position.set(1.0, SY.sea.heightAt(1, bz + 4 + i * 3, w) + 0.12, bz + 4 + i * 3); m.material.opacity = 0.75 * (1 - a / 4.5); });
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
  SY.sunGlow.material.opacity = 0.55 * sunUp * (w >= K.DAYS ? 0.4 : 1) * (EX ? (EX[3] ?? 1) : 1); SY.surf.material.map.offset.x = w * 0.02; SY.surf.material.opacity = 0.55 + 0.25 * Math.sin(w * 1.1);
  C.grade.uniforms.con.value = 0.27; C.grade.uniforms.vig.value = 0.38;
  S.spray2.update(w, [{ t0: K.LIFT0 + 0.2, pos: [1, 0.2, (S.grip?.z || 15) + 0.5], power: 0.8, spread: [0.6, 0.6] }, { t0: K.DAYS + 3.1, pos: [-4, 0.2, 27], power: 0.6 }]);
  // the stern digs in as the bow rises: a displacement wave
  if (!S.sternSet) { SY.sea.setImpact(1.0, (S.st?.cz ?? 31) + 13, K.LIFT0 + 0.6, 1.0, 1); S.sternZ = (S.st?.cz ?? 31) + 13; S.sternSet = true; }
  // splinters when the iron hand bites; dust shaken off the beam and A-frame at the snap and on each heave
  for (const p of S.splinters) { const a = w - K.BITE; p.m.visible = a > 0 && a < 1.4 && !!S.biteP; if (!p.m.visible) continue; p.m.position.set(S.biteP.x + p.v[0] * a, S.biteP.y + p.v[1] * a - 4.9 * a * a, S.biteP.z + p.v[2] * a); p.m.rotation.set(a * p.r, a * p.r * 0.7, 0); }
  for (const d of S.dust) { const t0s = [K.LIFT0 - 0.1, K.LIFT0 + 1.9, K.LIFT0 + 3.3, K.LIFT0 + 4.6], ages = t0s.map((t0) => w - t0 - d.delay).filter((a) => a > 0 && a < 2.2); const a = ages.length ? Math.min(...ages) : -1;
    d.s.visible = a >= 0; if (!d.s.visible) continue; d.s.position.set(SY.pivot.x + d.o[0] + d.drift * a, SY.pivot.y + d.o[1] - 2.2 * a * a, SY.pivot.z + d.o[2]); d.s.material.opacity = 0.5 * (1 - a / 2.2); }
  // water draining off the rising hull: falling streams + drips (no fog), splashes where they land
  const Hh = SY.hero, active = st.lift > 0.03 && w < K.REL + 1 && !st.hidden, drainK = Math.exp(-Math.max(0, w - K.LIFT0) * 0.12); const landings = [];
  for (const d of S.drops) { d.sp.visible = false; if (!active) continue; const per = d.per, tau = ((w * 1.0 + d.ph * per) % per);
    const p0 = Hh.deckPoint(d.u, d.side * 0.35).setY(-Hh.draft * (d.keel ? 0.85 : 0.2) + (d.keel ? 0 : 0.6)).applyMatrix4(Hh.body.matrixWorld); const sea0 = SY.sea.heightAt(p0.x, p0.z, w);
    if (p0.y < sea0 + 0.4) continue; const y = p0.y - 4.905 * tau * tau; if (y < sea0) { if (tau - Math.sqrt(2 * (p0.y - sea0) / 9.81) < 0.05) landings.push([p0.x, sea0, p0.z]); continue; }
    d.sp.visible = true; const v = 9.81 * tau; d.sp.position.set(p0.x + d.side * 0.25, y - Math.min(1.6, v * 0.08) * 0.5, p0.z); d.sp.scale.set(d.w, d.drip ? d.w * 4 : Math.max(0.25, Math.min(d.w > 0.5 ? 3.2 : 2.2, v * (d.w > 0.5 ? 0.3 : 0.16))), 1); d.sp.material.opacity = (d.drip ? 0.85 : d.w > 0.5 ? 0.8 * Math.exp(-Math.max(0, w - K.LIFT0 - 0.6) * 0.45) : 0.7) * drainK; }
  S.dropSplash.update(w, landings.slice(0, 12).map((p, i) => ({ t0: w - 0.05 - (i % 4) * 0.04, pos: p, power: 0.22 })));
  // churning foam where the hull meets the water (stern pressed down while the bow is lifted)
  if (!S.foam) { S.foam = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), S.rings[0].material.clone()); m.rotation.x = -Math.PI / 2; m.visible = false; C.scene.add(m); S.foam.push({ m, u: 0.03 + rnd(i, 51) * 0.36, side: rnd(i, 52) > 0.5 ? 1 : -1, ph: rnd(i, 53) * 6.28, s: 1.2 + rnd(i, 54) * 2 }); } }
  for (const f of S.foam) { const on = active && st.lift > 0.08; f.m.visible = on; if (!on) continue; const p = Hh.deckPoint(f.u, f.side * 1.25).applyMatrix4(Hh.body.matrixWorld), sh = SY.sea.heightAt(p.x, p.z, w);
    f.m.position.set(p.x + f.side * 0.6, sh + 0.06, p.z); const sc = f.s * (1 + 0.25 * Math.sin(w * 2.3 + f.ph)) * cl(st.lift * 2.5); f.m.scale.set(sc * 1.6, sc, 1); f.m.material.opacity = 0.65 * cl(st.lift * 3); }
  // (legacy cascade puffs disabled: they read as fog)
  if (S.cascade) for (const c of S.cascade) c.sp.visible = false;
  if (false) {
  const H = SY.hero; for (const c of S.cascade) { const on = st.lift > 0.05 && w < K.REL + 1 && !st.hidden; c.sp.visible = on; if (!on) continue;
    const p = H.deckPoint(c.u, c.side * 1.1).setY(0.4).applyMatrix4(H.body.matrixWorld), ph = (w * 1.6 + c.ph) % 1; c.sp.position.set(p.x + c.side * 0.4, Math.max(0.1, p.y - ph * ph * 9), p.z); c.sp.scale.set(c.sz, c.sz * 2.6, 1); c.sp.material.opacity = 0.55 * (1 - ph) * cl(st.lift * 3); }
  }
}

// EPISODE 2: VASA (1628). Story business: ship states per beat, the running stability test (crew + roll simulation), the gun-deck
// flooding, the sinking, the inquiry room, the seabed, the 1961 raising. Characters: C+ V1 rig + 1628 costumes (V1.1 foot planting).
// Camera frames for story.json shots: 'ship' (ship root, not heeled), 'deck' (heeled: the horizon tilts), 'ship@T' (the ship's frame
// frozen at time T: a fixed world camera composed relative to the ship), 'world', 'room' (inquiry room origin).
let S = null, THREE = null, CP = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, lerp = (a, b, k) => a + (b - a) * k, rmp = (t, a, b) => cl((t - a) / (b - a));
const VOY = { x: 40, z: 10 }, QUAY = { x: -76, z: -5.0 };
// ---------------- beats (video seconds) ----------------
const T = { S02: 1.6, S03: 4.0, S04: 6.9, RUN0: 9.6, RUND: 1.4, STOP: 14.45, S07: 16.2, S08: 18.6, S09: 21.0, S10: 24.0, S11: 25.8, S12: 28.2, S13: 30.2, S14: 35.4, S15: 40.8, S16: 45.0, S17: 48.0, END: 50.4 };
const LANES = [[-11.6, 0], [-10.4, 0], [-9.2, 0], [-8.1, 0], [-2.6, 0], [-1.8, 0], [0.25, 0], [2.5, 0], [3.5, 0], [-10.4, 0.28], [-2.6, 0.3], [3.5, 0.25]];
const HERO_LANE = 7;

export async function init(C) {
  THREE = C.THREE; const ST = C.SET; S = { ST, C };
  const { pbr } = await import('/engine/web/stage.js'); const { loadVasa, VASA } = await import('/engine/web/props/vasa.js'); CP = await import('/engine/web/character_cplus.js');
  S.VASA = VASA; S.V = await loadVasa(THREE, pbr); C.scene.add(S.V.root); C.camera.far = 2500; C.camera.updateProjectionMatrix();
  const load = (kind, o = {}) => CP.loadCPlus(THREE, { url: `/engine/web/characters/cplus_${kind}.glb`, faceRes: o.faceRes || 512, face: { stache: /officer|council/.test(kind) }, recolor: o.recolor });
  const skins = ['#f0b88f', '#d39672', '#e8b48a', '#c98d62'], hairs = ['#5a2f1a', '#2a1a12', '#8a5a2a', '#3a2418'];
  S.hero = await load('sailor1628', { faceRes: 1024 });
  S.crew = [];
  for (let i = 0; i < LANES.length; i++) { if (i === HERO_LANE) { S.crew.push(S.hero); continue; }
    S.crew.push(await load(['sailor1628b', 'sailor1628c', 'sailor1628'][i % 3], { recolor: { skin: skins[i % 4], hair: hairs[(i + 1) % 4], top: ['#e6dcc3', '#cfd6dc', '#d9c9a0'][i % 3], breech: ['#6b5844', '#3f4a5c', '#5a4a3a'][(i + 2) % 3] } })); }
  S.admiral = await load('officer1628', { faceRes: 1024 });
  S.captain = await load('officer1628', { recolor: { top: '#6a2a24', breech: '#6a2a24', hat: '#3a2a1e' } });
  S.wright = await load('shipwright1628', { faceRes: 1024 });
  S.council = [await load('council1628', { faceRes: 1024 }), await load('council1628', { recolor: { top: '#3a2f4a', breech: '#3a2f4a', hair: '#8a8a88' } }), await load('council1628', { recolor: { top: '#2f3a2a', breech: '#2f3a2a', hair: '#2a1a12' } }), await load('council1628', { recolor: { top: '#4a2a22', breech: '#4a2a22', hair: '#6a4a2a' } })];
  S.towns = [await load('shipwright1628', { recolor: { top: '#5a6a8a', breech: '#3f4a5c', leather: '#3f4a5c' } }), await load('sailor1628c', { recolor: { top: '#c9b48a', skin: '#e8b48a' } }), await load('council1628', { recolor: { top: '#5a3a5a', breech: '#5a3a5a', hair: '#3a2418' } })];
  S.towns[1].root.scale.setScalar(0.68);   // the child
  S.all = [...S.crew, S.admiral, S.captain, S.wright, ...S.council, ...S.towns];
  for (const ch of S.all) { C.scene.add(ch.root); ch.root.visible = false; }
  // ---- effects: salute smoke, gust ripple, water sheets in the lower gunports, interior flood plane, splashes, bubbles, light shafts
  const sprayT = ST.spray;
  S.smoke = []; for (let i = 0; i < 36; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprayT, color: '#f4f0e8', transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; C.scene.add(s); S.smoke.push(s); }
  { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(10,30,40,0)'); gr.addColorStop(0.5, 'rgba(5,18,30,0.85)'); gr.addColorStop(1, 'rgba(10,30,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c); S.gust = new THREE.Mesh(new THREE.PlaneGeometry(320, 34), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); S.gust.rotation.x = -Math.PI / 2; S.gust.userData.keepMaterial = true; S.gust.visible = false; C.scene.add(S.gust); }
  { const c = document.createElement('canvas'); c.width = 128; c.height = 512; const g = c.getContext('2d'); g.fillStyle = 'rgba(70,140,150,0.75)'; g.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(230,245,245,${0.3 + Math.random() * 0.5})`; g.fillRect(Math.random() * 128, Math.random() * 512, 3 + Math.random() * 6, 30 + Math.random() * 90); }
    S.sheetTex = new THREE.CanvasTexture(c); S.sheetTex.wrapT = THREE.RepeatWrapping; S.sheetTex.colorSpace = THREE.SRGBColorSpace; }
  S.sheets = []; for (const k of [3, 4, 5, 6, 7]) { const x = -S.VASA.L / 2 + (0.24 + k * (0.58 / 11)) * S.VASA.L;
    const g = new THREE.PlaneGeometry(0.72, 2.2, 1, 12); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 1.1) / 2.2; p.setXYZ(i, p.getX(i), S.VASA.lowerDeckY + 0.9 * v + 0.75 * v * v * 0 + (v > 0.6 ? 0.55 : v * 0.9), -5.3 + (1 - v) * 1.9 * (1 - v)); }
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: S.sheetTex.clone(), transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.material.map.wrapT = THREE.RepeatWrapping; m.position.x = x; m.userData.keepMaterial = true; m.visible = false; S.V.heel.add(m); S.sheets.push(m); }
  S.flood = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), new THREE.MeshBasicMaterial({ color: '#3f8a92', transparent: true, opacity: 0.82, depthWrite: true })); S.flood.rotation.x = -Math.PI / 2; S.flood.userData.keepMaterial = true; S.flood.visible = false; C.scene.add(S.flood);
  S.splash = CP_splash(C, sprayT);
  S.lamps = [new THREE.PointLight('#ffc070', 0, 9, 1.4), new THREE.PointLight('#ffc070', 0, 9, 1.4)]; S.lamps[0].position.set(4, S.VASA.lowerDeckY + 1.8, 0.5); S.lamps[1].position.set(-3, S.VASA.lowerDeckY + 1.8, 1.0); for (const l of S.lamps) S.V.heel.add(l);
  // underwater: surface seen from below, light shafts, drifting motes
  S.under = new THREE.Group(); C.scene.add(S.under); S.under.visible = false;
  { const surf = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#8fd2cf', side: THREE.BackSide, transparent: true, opacity: 0.9 })); surf.rotation.x = -Math.PI / 2; surf.position.set(40, -0.4, 10); surf.userData.keepMaterial = true; S.under.add(surf);
    for (let i = 0; i < 9; i++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + (i % 3), 40), new THREE.MeshBasicMaterial({ color: '#cfeee6', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      sh.position.set(20 + i * 6, -16, 4 + (i % 4) * 5); sh.rotation.set(0, i * 0.7, 0.35); sh.userData.keepMaterial = true; S.under.add(sh); }
    S.motes = []; for (let i = 0; i < 60; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprayT, color: '#dfeee6', transparent: true, opacity: 0.35, depthWrite: false })); s.scale.setScalar(0.15 + (i % 5) * 0.05); S.under.add(s); S.motes.push(s); } }
  // 1961 salvage: two pontoons, cranes, press boats
  S.salv = new THREE.Group(); C.scene.add(S.salv); S.salv.visible = false;
  { const mPont = new THREE.MeshStandardMaterial({ color: '#5a5f66', roughness: 0.8 }), mBoat = new THREE.MeshStandardMaterial({ color: '#d8d4ca', roughness: 0.7 }), mRed = new THREE.MeshStandardMaterial({ color: '#6a6f76', roughness: 0.7 });
    for (const dz of [-10.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(44, 3.2, 6), mPont); p.position.set(VOY.x, 0.35, VOY.z + dz * 1.15); p.scale.set(1, 0.5, 0.8); S.salv.add(p); const cr = new THREE.Mesh(new THREE.BoxGeometry(0.6, 16, 0.6), mRed);  }
    for (const [x, z, r] of [[VOY.x + 26, VOY.z - 30, 0.6], [VOY.x - 22, VOY.z - 28, -0.4], [VOY.x + 48, VOY.z - 6, 1.4]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(7, 1.4, 2.4), mBoat); b.position.set(x, 0.5, z); b.rotation.y = r; S.salv.add(b); const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.0), mBoat); cab.position.set(x, 1.8, z); cab.rotation.y = r; S.salv.add(cab); }
    S.flashes = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprayT, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(VOY.x + [26, 27, -22, -21, 48, 47][i], 2.6, VOY.z + [-30, -29, -28, -27, -6, -5][i]); s.scale.setScalar(2.2); S.salv.add(s); S.flashes.push(s); }
    S.salvCrowd = ST.addCrowd([...Array(24)].map((_, i) => [VOY.x - 18 + (i % 24) * 1.6, 1.15, VOY.z - 12.1 + ((i * 7) % 3 - 1) * 0.5]), 11); S.salvCrowd.body.visible = S.salvCrowd.head.visible = false; }
  { const { pbr: pb } = await import('/engine/web/stage.js'); const st = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 7), pb('wood_planks', [3, 2], { roughness: 0.85, color: '#c7a57a' })); st.position.set(VOY.x - 3, 0.6, 99.5); st.castShadow = st.receiveShadow = true; C.scene.add(st); }
  { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), new THREE.MeshStandardMaterial({ color: '#5e4a36' })); cap.scale.set(1.25, 0.32, 1.25); cap.position.set(0.05, 0.58, 0.05); ST.chair.add(cap); }
  S.rollCache = null; S.landHAt = (await import('/engine/web/sets/stockholm.js')).landH;
}
function CP_splash(C, tex) { const list = []; for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#eef4f5', transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; C.scene.add(s); list.push(s); } return { list }; }

// ---------------- stability test: crew position + ship roll (deterministic spring, integrated from the start of the quay scene) ----------------
function runZ(t, lane) {   // a runner's z on deck (port -3.4 .. starboard +3.4) and facing (+1 toward starboard)
  const [, delay] = LANES[lane], t0 = T.RUN0 + delay; if (t < t0) return { z: -3.4, dir: 1, dist: 0, moving: 0 };
  const tt = Math.min(t, T.STOP) - t0, n = Math.floor(tt / T.RUND), f = (tt - n * T.RUND) / T.RUND, e = ss(Math.min(1, f * 1.08));
  const from = n % 2 === 0 ? -3.4 : 3.4, to = -from, z = lerp(from, to, e);
  return { z, dir: Math.sign(to - from), dist: n * 6.8 + Math.abs(z - from), moving: t < T.STOP ? 1 : 0, n, f };
}
function crewMeanZ(t) { let s = 0; for (let i = 0; i < LANES.length; i++) s += runZ(t, i).z; return s / LANES.length; }
function rollAt(t) {   // heel (+ = port) of the moored ship during the test
  const dt = 1 / 120, n = Math.max(0, Math.round((t - T.S04) / dt)); if (!S.rollCache || n < S.rollCache.n) S.rollCache = { n: 0, x: 0, v: 0 };
  const R = S.rollCache, w = 2 * Math.PI * 0.36, z = 0.07;
  while (R.n < n) { const tt = T.S04 + (R.n + 1) * dt, tgt = -0.042 * crewMeanZ(tt) / 3.4; const a = w * w * (tgt - R.x) - 2 * z * w * R.v; R.v += a * dt; R.x += R.v * dt; R.n++; }
  return R.x;
}
// ---------------- ship state per beat ----------------
function shipState(t) {
  t = Math.round(t * 1000) / 1000;   // director time can be 3.99999 at a cut
  if (t < T.S03) { const k = rmp(t, T.S02, T.S03); return { x: VOY.x - 34 + t * 1.6, z: VOY.z, heel: 0.03 + ss(rmp(t, 2.3, 3.6)) * 0.17 + Math.sin(t * 1.1) * 0.005, ports: 1 }; }
  if (t < T.S08) return { x: QUAY.x, z: QUAY.z, heel: rollAt(t) + Math.sin(t * 0.9) * 0.003, ports: t < T.S03 + 0.5 ? 0 : ss(rmp(t, T.S03 + 0.5, T.S03 + 2.4)) };
  if (t < T.S09) { const k = ss(rmp(t, T.S08, T.S09 + 1)); return { x: QUAY.x + 3 + k * 10, z: QUAY.z + 3 * k, heel: 0.015 + Math.sin(t) * 0.006, ports: 1 }; }
  if (t < T.S10) return { x: VOY.x - 4 + (t - T.S09) * 0.8, z: VOY.z, heel: 0.02 + ss(rmp(t, T.S09 + 0.3, T.S09 + 1.4)) * 0.13 - ss(rmp(t, T.S09 + 1.6, T.S09 + 2.8)) * 0.12, ports: 1 };
  if (t < T.S11) return { x: VOY.x - 1, z: VOY.z, heel: 0.03 + ss(rmp(t, T.S10 + 1.0, T.S11 + 0.4)) * 0.12, ports: 1 };
  if (t < T.S13) return { x: VOY.x, z: VOY.z, heel: 0.15 + ss(rmp(t, T.S11, T.S13)) * 0.2, ports: 1 };
  if (t < T.S14) { const k = rmp(t, T.S13, T.S14); return { x: VOY.x, z: VOY.z, heel: 0.36 + Math.pow(k, 1.3) * 0.75, sink: Math.pow(ss(rmp(t, T.S13 + 0.8, T.S14 + 0.6)), 1.6) * 20, pitch: -k * 0.08, ports: 1 }; }
  if (t < T.S15) return { x: VOY.x, z: VOY.z, heel: 0, sink: 60, ports: 1 };
  if (t < T.S16) return { x: VOY.x, z: VOY.z, heel: 0.06, sink: 27.2, pitch: 0.02, ports: 0.3, wreck: true };
  if (t < T.S17) { const k = ss(rmp(t, T.S16, T.S17 + 0.5)); return { x: VOY.x, z: VOY.z, heel: 0.02, sink: lerp(6.0, 2.2, Math.pow(k, 0.7)), ports: 0.3, wreck: true }; }
  return { x: VOY.x, z: VOY.z, heel: 0.02, sink: lerp(2.2, 1.9, ss(rmp(t, T.S17, T.END))), ports: 0.3, wreck: true };
}
function place(t) {
  if (S.placedAt === t) return; S.placedAt = t; const ST = S.ST; ST.sea.update(t + 40);
  const s = shipState(t), y = ST.sea.heightAt(s.x, s.z, t + 40) * 0.6;
  if (!!s.wreck !== !!S.V.isWreck) S.V.wreck(!!s.wreck);
  S.V.set({ x: s.x, y, z: s.z, heading: 0, heel: s.heel, sink: s.sink || 0, pitch: s.pitch || 0 }); S.V.ports(0, s.ports, 0.6); S.V.ports(1, s.ports, 0.6);
}
export function frameOf(name, t) {
  if (name.startsWith('ship@')) { const tf = +name.slice(5); place(tf); const M = new THREE.Matrix4().makeTranslation(S.V.root.position.x, 0, S.V.root.position.z); S.placedAt = null; place(t); return M; }
  place(t); if (name === 'room') return new THREE.Matrix4().makeTranslation(S.ST.room.x, S.ST.room.y, S.ST.room.z);
  if (name === 'world') return new THREE.Matrix4();
  if (name.startsWith('ground@')) { const [x, z] = name.slice(7).split(',').map(Number); return new THREE.Matrix4().makeTranslation(x, S.landHAt(x, z), z); }
  S.V.root.updateMatrixWorld(true); return name === 'deck' ? S.V.heel.matrixWorld.clone() : new THREE.Matrix4().makeTranslation(S.V.root.position.x, S.V.root.position.y, S.V.root.position.z);
}
// ---------------- shadows follow the action ----------------
function shadowAt(C, cx, cy, cz, r) { const k = C.style.key, sd = new THREE.Vector3(...C.style.preset.sky.sunDir).normalize(); k.target.position.set(cx, cy, cz); k.position.set(cx, cy, cz).addScaledVector(sd, 160);
  Object.assign(k.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 40, far: 320 }); k.shadow.camera.updateProjectionMatrix(); k.target.updateMatrixWorld(); }

// ---------------- characters ----------------
const E = (n) => CP.EXP[n];
function onDeck(ch, x, z, yaw, P) { if (ch.root.parent !== S.V.heel) S.V.heel.add(ch.root); ch.root.visible = true; ch.root.position.set(x, S.VASA.deckY, z); ch.root.rotation.set(0, yaw, 0); ch.pose(P); }
function atWorld(ch, x, y, z, yaw, P) { if (ch.root.parent !== S.C.scene) S.C.scene.add(ch.root); ch.root.visible = true; ch.root.position.set(x, y, z); ch.root.rotation.set(0, yaw, 0); ch.pose(P); }
const blinkAt = (t, ts) => CP.blinkAt(t, ts);
// standing idle with planted feet and breathing; extra bones merged on top
function stand(t, extra = {}, seed = 0) { const br = Math.sin((t + seed) * 1.7) * 0.012, sw = Math.sin((t + seed) * 0.8) * 0.02;
  const bones = { chest: [br, 0, 0], head: [0.02, sw, 0], upperarmL: [-0.05, 0, -0.05], upperarmR: [-0.05, 0, 0.05], forearmL: [-0.2, 0, 0], forearmR: [-0.2, 0, 0], ...extra.bones };
  return { face: extra.face || E('neutral'), blink: blinkAt(t, extra.blinks || [seed % 3 + 0.4, seed % 3 + 3.4, seed % 3 + 6.9]), gaze: extra.gaze || [0, 0], bones, offset: { hips: [0, -0.01 + br * 0.2, 0], ...(extra.offset || {}) },
    feet: extra.feet || { L: [0.12, 0.08, 0.02], R: [-0.12, 0.08, -0.02] }, hand: extra.hand || 'relaxed', squash: extra.squash || 0 }; }
function runPose(t, lane, frozen) {   // sprint across the deck (V1.1 gait + planted feet), freezes at T.STOP
  const r = runZ(t, lane), g = CP.gait(r.dist, { stride: 0.6, lift: 0.1, run: 1, width: 0.1 }), sw = g.swing * (frozen ? 1 : 1);
  const bones = { hips: [0, 0, g.sway * 0.5], spine: [g.lean * 0.5, 0, 0], chest: [g.lean * 0.6, -g.sway, 0], head: [-g.lean * 0.6, 0, 0], upperarmL: [sw * 0.9, 0, 0.12], upperarmR: [-sw * 0.9, 0, -0.12], forearmL: [-1.2, 0, 0], forearmR: [-1.2, 0, 0] };
  return { r, P: { face: lane === HERO_LANE ? CP.blendExp(E('happy'), E('squint'), ss(rmp(t, 12.0, 13.0))) : E('curious'), blink: 0, gaze: [0, -0.1], bones, offset: { hips: [0, g.bob, 0] }, feet: g.feet, footPitch: g.footPitch } };
}
function crewFrame(t) {   // the quay scene, 6.9 .. 18.6
  for (let i = 0; i < LANES.length; i++) { const ch = S.crew[i], [x] = LANES[i]; const xx = x + (LANES[i][1] ? -0.8 : 0);
    if (t < T.RUN0) {   // lined up at the port rail, facing starboard; the hero stretches like an athlete
      const P = stand(t, i === HERO_LANE ? { face: E('happy'), bones: { upperarmL: [-2.6, 0, 0.3], upperarmR: [-2.6, 0, -0.3], forearmL: [-0.5, 0, 0], forearmR: [-0.5, 0, 0], chest: [-0.1, Math.sin(t * 4) * 0.15, 0] } } : { face: E('curious') }, i);
      onDeck(ch, xx, -3.4, 0, P); continue; }
    const r = runZ(t, i);
    if (i === HERO_LANE && t >= T.RUN0 + 3 * T.RUND && t < T.STOP) {   // the hero lands on the high side after the third run: dizzy wobble
      const w = t * 7, P = stand(t, { face: { ...E('squint'), open: [0.7, 0.5] }, gaze: [Math.cos(w) * 0.6, Math.sin(w) * 0.4], bones: { head: [0.05, Math.sin(w * 0.5) * 0.2, Math.sin(w) * 0.18], chest: [0, 0, -Math.sin(w * 0.8) * 0.08], upperarmL: [-0.4, 0, 1.1 + Math.sin(w) * 0.2], upperarmR: [-0.4, 0, -1.1 + Math.sin(w) * 0.2], forearmL: [-0.3, 0, 0], forearmR: [-0.3, 0, 0] } }, i);
      onDeck(ch, xx, 3.4, Math.PI * 0.2 * Math.sin(w * 0.3), P); continue; }
    if (t < T.STOP) { const { P } = runPose(t, i); const yaw = r.dir > 0 ? 0 : Math.PI; onDeck(ch, xx, r.z, yaw, P); continue; }
    // frozen mid-stride at the admiral's signal, then relax and look toward the quay (port)
    const { P } = runPose(T.STOP - 0.02, i), r0 = runZ(T.STOP - 0.02, i), yaw0 = r0.dir > 0 ? 0 : Math.PI, rel = ss(rmp(t, 15.6 + (i % 4) * 0.1, 16.4));
    let z = r0.z; if (i === 3) z += ss(rmp(t, T.STOP, 15.5)) * 0.7 * Math.sign(-rollAt(t) || 1);   // one keeps sliding with the tilt
    const Ps = stand(t, { face: E('concern'), bones: { head: [0.1, (yaw0 === 0 ? -1 : 1) * 0.6 * rel, 0] } }, i);
    const mix = (a, b) => (a || [0, 0, 0]).map((v, k) => lerp(v, (b || [0, 0, 0])[k], rel)), bones = {}; for (const k of new Set([...Object.keys(P.bones), ...Object.keys(Ps.bones)])) bones[k] = mix(P.bones[k], Ps.bones[k]);
    const feet = { L: P.feet.L.map((v, k) => lerp(v, Ps.feet.L[k], rel)), R: P.feet.R.map((v, k) => lerp(v, Ps.feet.R[k], rel)) };
    onDeck(ch, xx, z, yaw0, { face: rel > 0.3 ? (i === HERO_LANE ? CP.blendExp(E('surprised'), E('concern'), rel) : E('concern')) : E('surprised'), blink: blinkAt(t, [15.9 + i * 0.05]), gaze: [0, 0], bones, offset: { hips: [0, lerp(P.offset.hips[1], -0.01, rel), 0] }, feet, footPitch: P.footPitch });
  }
}
export function frame(t, C, vt) {
  t = Math.round(t * 1000) / 1000;
  const ST = S.ST; place(t); for (const ch of S.all) ch.root.visible = false;
  S.ST.sea.near.receiveShadow = false; for (const s of S.smoke) s.visible = false; S.gust.visible = false; for (const m of S.sheets) m.visible = false; S.flood.visible = false; for (const s of S.splash.list) s.visible = false;
  for (const l of S.lamps) l.intensity = 0; S.under.visible = false; S.salv.visible = false; S.salvCrowd.body.visible = S.salvCrowd.head.visible = false; ST.roomLight.intensity = 0;
  for (const c of ST.crowds) if (c !== S.salvCrowd) c.body.visible = c.head.visible = true;
  if (C.style && C.style.sky) C.style.sky.mesh.visible = true; C.scene.fog = ST.fog; ST.seabed.visible = false;
  const V = S.V, D = S.VASA; let px = 4.2;
  // ---- S01-S02 hook (voyage)
  if (t < T.S03) { shadowAt(C, V.root.position.x, 8, V.root.position.z, 34);
    const k = rmp(t, T.S02, T.S03), smile = t < 2.75 ? E('happy') : CP.blendExp(E('happy'), E('concern'), ss(rmp(t, 2.75, 3.5)));
    const wave = t < 2.8 ? Math.sin(t * 9) * 0.35 : Math.sin(2.8 * 9) * 0.35 * (1 - ss(rmp(t, 2.8, 3.3)));
    onDeck(S.hero, 1.0, 3.3, 0, stand(t, { face: smile, gaze: t < 3.15 ? [0, 0] : t < 3.6 ? [0, 0.8] : [0, 0], blinks: [3.05],
      bones: { upperarmR: [-2.5 + wave * 0.3, 0, -0.5 - wave], forearmR: [-0.5, 0, 0], chest: [-0.03, 0, 0], head: [0.03 + (t > 3.15 ? 0.06 : 0), 0, 0] } }));
    for (let i = 0; i < 4; i++) onDeck(S.crew[i], -3 - i * 1.6, 2.8 + (i % 2) * 0.5, 0.2 * (i - 1.5), stand(t, { face: E('happy'), bones: { upperarmL: [-2.4 + Math.sin(t * 8 + i) * 0.2, 0, 0.5] } }, i));
  }
  // ---- S03-S07 at the quay: ports open (shipwright watches), the stability test, the admiral
  else if (t < T.S08) { shadowAt(C, QUAY.x, 4, QUAY.z - 3, 30);
    if (t < T.S04) atWorld(S.wright, QUAY.x + 12, ST.quay.y, ST.quay.z - 2.0, 0.7, stand(t, { face: CP.blendExp(E('curious'), E('concern'), ss(rmp(t, 5.3, 6.0))), gaze: [0, -0.6], blinks: [5.9], bones: { head: [-0.32, 0, 0], neck: [-0.1, 0, 0], upperarmR: [-0.7, 0, 0.1], forearmR: [-1.5, 0, 0] }, squash: t > 6.2 && t < 6.5 ? -0.02 : 0 }));
    if (t >= T.S04) crewFrame(t);
    if (t >= T.S04 && t < 9.4) onDeck(S.captain, -6.0, 1.6, -2.6, stand(t, { face: E('angry'), bones: { upperarmR: [-2.9 * ss(rmp(t, 8.2, 8.6)) * (1 - ss(rmp(t, 9.4, 9.9))), 0, -0.2], forearmR: [-0.2, 0, 0] } }));
    // the admiral on the quay
    const ax = QUAY.x + 6, az = ST.quay.z - 1.6, look = [-0.35, 0, 0];
    if (t >= 11.5) { const up = ss(rmp(t, 14.15, 14.45)) * (1 - ss(rmp(t, 16.4, 17.0))), wave = ss(rmp(t, 17.5, 17.9)) * (1 - ss(rmp(t, 18.3, 18.6)));
      const turn = ss(rmp(t, 16.5, 17.0)) * (1 - ss(rmp(t, 17.3, 17.7)));
      const face = t < 12.1 ? E('neutral') : t < 14.15 ? CP.blendExp(E('neutral'), E('surprised'), ss(rmp(t, 12.1, 12.4))) : t < 16.4 ? E('angry') : CP.blendExp(E('concern'), E('squint'), ss(rmp(t, 17.2, 17.6)));
      atWorld(S.admiral, ax, ST.quay.y, az, 0, stand(t, { face: { ...face, mouth: t > 14.2 && t < 15.1 ? 'shout' : face.mouth }, blinks: [12.0, 16.1, 17.35], gaze: turn > 0.5 ? [-0.7, -0.3] : [0, -0.3],
        bones: { head: [-0.3 + turn * 0.2, turn * 0.9, 0], neck: [-0.08, turn * 0.3, 0], chest: [t > 17.0 && t < 17.5 ? 0.08 : 0, turn * 0.2, 0], upperarmR: [lerp(-0.05, -2.9, up) + wave * -1.3, wave * -0.6, -0.1], forearmR: [-0.2 - wave * 0.4, 0, 0],
          upperarmL: [-0.15, 0, 0.12], forearmL: [-1.3, 0, 0] }, squash: t > 17.0 && t < 17.4 ? -0.025 * Math.sin(rmp(t, 17.0, 17.4) * Math.PI) : 0 })); }
    px = 4.6;
  }
  // ---- S08 departure: salute smoke from the starboard gunports
  else if (t < T.S09) { shadowAt(C, V.root.position.x, 8, V.root.position.z, 36);
    let i = 0; for (const [t0, k] of [[19.3, 6], [19.6, 8], [19.9, 4], [20.2, 10]]) { const a = t - t0; for (let j = 0; j < 9; j++, i++) { const s = S.smoke[i]; if (a < 0 || a > 3) continue; const x = -D.L / 2 + (0.24 + k * 0.0527) * D.L;
      const p = new THREE.Vector3(x + j * 0.2, 1.4 + j * 0.15, 6.3 + a * (1.5 + j * 0.4)); V.heel.localToWorld(p); s.position.copy(p); s.visible = true; const sz = 1.2 + a * (1.4 + j * 0.2); s.scale.set(sz, sz, 1); s.material.opacity = 0.8 * (1 - a / 3) * cl(a * 8); } }
    for (let i = 0; i < 5; i++) onDeck(S.crew[i], -4 + i * 2, 3.4, 0, stand(t, { face: E('happy'), bones: { upperarmL: [-2.4 + Math.sin(t * 8 + i) * 0.2, 0, 0.5] } }, i));
  }
  // ---- S09 first breeze (hero at the starboard rail, high side): grabs on, looks down to the low side, relief
  else if (t < T.S10) { shadowAt(C, V.root.position.x, 8, V.root.position.z, 20);
    const lean = ss(rmp(t, 21.3, 22.3)) * (1 - ss(rmp(t, 22.6, 23.7))), relief = ss(rmp(t, 23.2, 23.6));
    onDeck(S.hero, 2.0, 3.5, 0, stand(t, { face: relief > 0.5 ? E('happy') : CP.blendExp(E('neutral'), E('scared'), lean), gaze: [0, lean * 0.4], blinks: [21.6, 23.5],
      bones: { upperarmL: [-1.6 * lean - 0.05, 0, 0.3 * lean], forearmL: [-0.4, 0, 0], upperarmR: [-1.4 * lean, 0, -0.2], forearmR: [-0.6, 0, 0], chest: [0.1 * lean, 0.5 * lean, 0], head: [0.25 * lean, 0.9 * lean, 0], hips: [0, 0, -0.08 * lean] },
      squash: relief * (t < 23.9 ? Math.sin(rmp(t, 23.2, 23.9) * Math.PI) * 0.02 : 0) }));
    onDeck(S.crew[0], -1.0, 2.6, 0.4, stand(t, { face: relief > 0.5 ? E('happy') : CP.blendExp(E('neutral'), E('scared'), lean), bones: { upperarmR: [-1.2 * lean, 0, -0.3] } }, 3));
    px = 4.8;
  }
  // ---- S10 the stronger gust: a dark ripple runs across the water from the south and hits the ship
  else if (t < T.S11) { shadowAt(C, V.root.position.x, 8, V.root.position.z, 36);
    S.gust.visible = true; S.gust.position.set(VOY.x, 0.25, VOY.z + lerp(70, 2, ss(rmp(t, T.S10, T.S10 + 1.4)))); S.gust.material.opacity = 1;
  }
  // ---- S11-S12 the lower gun deck: heel grows, the port-side gunports reach the water, water pours in
  else if (t < T.S13) { shadowAt(C, V.root.position.x, 3, V.root.position.z, 18); for (const l of S.lamps) l.intensity = 4.5;
    const turn = ss(rmp(t, 26.3, 26.75)), sh = ss(rmp(t, 26.5, 27.0)), bd = ss(rmp(t, 26.7, 27.3));   // head first, then shoulders, then body
    onDeck(S.hero, 2.4, 0.6, 0.15 - Math.PI * 0.85 * bd, { ...stand(t, { face: t < 26.6 ? E('neutral') : t < 28.6 ? E('surprised') : E('scared'), gaze: turn > 0.4 ? [0.2, 0.25] : [0.6, 0], blinks: [26.35],
      bones: { head: [0.2 * turn, -1.2 * turn * (1 - bd * 0.85), 0], neck: [0, -0.3 * turn * (1 - bd), 0], chest: [0, -0.5 * sh * (1 - bd), 0], upperarmL: [-0.8 * ss(rmp(t, 27.2, 27.6)), 0, 0.5], forearmL: [-1.3 * ss(rmp(t, 27.2, 27.6)), 0, 0], upperarmR: [-1.9 * ss(rmp(t, 28.4, 28.8)), 0, -0.2], forearmR: [-0.2, 0, 0] } }), hand: t > 28.5 ? 'point' : 'relaxed' });
    S.hero.root.position.y = S.VASA.lowerDeckY;
    // water: sheets through the low (port) ports + the flood plane rising inside
    const wk = rmp(t, 27.4, T.S13); if (t < T.S12) for (const [i, m] of S.sheets.entries()) { const a = cl((wk - i * 0.06) * 2.2); m.visible = a > 0; m.material.map.offset.y = -t * 1.6; m.scale.set(1, Math.max(0.01, a), 1); m.material.opacity = 1.0; m.material.color.set('#ffffff'); }
    if (t >= T.S12) { for (const m of S.sheets) m.visible = false; let i = 0;   // exterior: the open lower ports reach the water -> water rushes in
      for (let k = 1; k <= 10; k++) { const p = new THREE.Vector3(-S.VASA.L / 2 + (0.24 + k * (0.58 / 11)) * S.VASA.L, 1.35, -6.0); V.heel.localToWorld(p); const sea = ST.sea.heightAt(p.x, p.z, t + 40);
        if (p.y - sea > 0.35) continue; for (let j = 0; j < 6 && i < S.splash.list.length; j++, i++) { const sp = S.splash.list[i], ph = (t * 2.2 + j * 0.37 + k * 0.13) % 1;
          sp.visible = true; sp.position.set(p.x + (j - 2.5) * 0.18, sea + 0.15 + ph * 0.9 - ph * ph * 0.8, p.z - 0.3 + ph * 0.6); const sz = 0.35 + ph * 0.6; sp.scale.set(sz, sz, 1); sp.material.opacity = 0.8 * (1 - ph); } } }
    const deckLow = new THREE.Vector3(0, S.VASA.lowerDeckY, -4.5); V.heel.localToWorld(deckLow); S.flood.visible = wk > 0 && t < T.S12; S.flood.position.set(V.root.position.x + 1, deckLow.y - 0.12 + ss(wk) * 0.45, V.root.position.z - 4.0); S.flood.scale.set(1, 0.45, 1);
    px = 5.0;
  }
  // ---- S13 the sinking, seen from the south shore crowd (respectful: no gags)
  else if (t < T.S14) { shadowAt(C, VOY.x, 6, VOY.z + 40, 70); const gy = () => 1.2;
    const [px1, pz1] = [VOY.x - 2.75, 100.0], [px2, pz2] = [VOY.x - 1.85, 99.9], [px3, pz3] = [VOY.x - 1.55, 99.3];
    const still = (k, seed) => stand(t, { face: E('scared'), gaze: [0, -0.2], bones: { head: [-0.12, 0.15, 0], upperarmL: [-1.4 * k, 0, 0.3], forearmL: [-1.8 * k, 0, 0] } }, seed);
    atWorld(S.towns[0], px1, gy(px1, pz1), pz1, Math.PI + 0.1, still(ss(rmp(t, 32.2, 32.8)), 1));
    atWorld(S.towns[1], px2, gy(px2, pz2), pz2, Math.PI - 0.1, stand(t, { face: E('scared'), bones: { upperarmL: [-0.6, 0, 0.6 * ss(rmp(t, 31.4, 31.9))], head: [-0.25, 0.3 * ss(rmp(t, 33.5, 34.2)), 0] } }, 2));
    atWorld(S.towns[2], px3, gy(px3, pz3), pz3, Math.PI + 0.25, stand(t, { face: E('concern'), bones: { head: [-0.1, 0, 0] } }, 3));
    // splashes where the hull meets the water as she goes over
    const ev = [[31.6, 0], [32.6, 6], [33.6, -6], [34.4, 10]]; let i = 0; for (const [t0, dx] of ev) for (let j = 0; j < 17; j++, i++) { const s = S.splash.list[i], a = t - t0 - (j % 5) * 0.05; if (a < 0 || a > 1.8) continue;
      const an = j * 2.4; s.visible = true; s.position.set(VOY.x + dx + Math.cos(an) * (1 + a * 3), Math.max(0, a * 7 - 9.8 * a * a * 0.5 + 1.0), VOY.z - 5 + Math.sin(an) * (1 + a * 2)); const sz = 1.2 + a * 3; s.scale.set(sz, sz, 1); s.material.opacity = 0.75 * (1 - a / 1.8); }
    px = 3.8;
  }
  // ---- S14 the inquiry: everyone points at someone else, then at the empty chair, then they glance at the king's portrait and lower their arms
  else if (t < T.S15) { const R = ST.room; ST.roomLight.intensity = 2.6; for (const c of ST.crowds) c.body.visible = c.head.visible = false; if (C.style && C.style.sky) C.style.sky.mesh.visible = false;
    shadowAt(C, R.x, R.y, R.z, 10); const cast = [...S.council, S.captain], ring = [[-2.0, 0.9], [-1.0, -0.4], [1.0, -0.4], [2.0, 0.9], [0.0, -1.0]];
    const pt1 = ss(rmp(t, 35.7, 36.1)), chair = ss(rmp(t, 36.9, 37.3)), up = ss(rmp(t, 38.4, 38.9)), lower = ss(rmp(t, 39.0, 39.8)), shrug = ss(rmp(t, 39.9, 40.4));
    cast.forEach((ch, i) => { const [x, z] = ring[i], cx = 0, cz = 1.0, toC = Math.atan2(cx - x, cz - z), nb = ring[(i + 1) % ring.length], toN = Math.atan2(nb[0] - x, nb[1] - z);
      const aim = lerp(toN, toC, chair) - toC, arm = Math.max(pt1, chair) * (1 - lower);
      atWorld(ch, R.x + x, R.y, R.z + z, toC, stand(t, { face: up > 0.5 ? (shrug > 0.5 ? E('squint') : E('concern')) : chair > 0.5 ? E('suspicious') : E('angry'), hand: arm > 0.2 ? 'point' : 'relaxed', blinks: [38.2 + i * 0.07, 40.1],
        gaze: up > 0.4 ? [0, -0.9] : [0, 0], bones: { chest: [0, aim * 0.4, 0], head: [-0.5 * up * (1 - lower * 0.4), aim * 0.6 * (1 - up), 0], upperarmR: [-1.55 * arm, aim * 0.8, -0.1], forearmR: [-0.1, 0, 0],
          upperarmL: [-0.2 - shrug * 0.4, 0, 0.3 + shrug * 0.5], forearmL: [-0.4 - shrug * 0.9, 0, 0] } }, i)); });
    px = 4.4;
  }
  // ---- S15 underwater: 333 years on the seabed
  else if (t < T.S16) { S.under.visible = true; ST.seabed.visible = true; for (const c of ST.crowds) c.body.visible = c.head.visible = false; if (C.style && C.style.sky) C.style.sky.mesh.visible = false;
    C.scene.fog = S.uFog || (S.uFog = new THREE.Fog('#1f4a4a', 4, 70)); shadowAt(C, VOY.x, -26, VOY.z, 30);
    S.motes.forEach((s, i) => { s.position.set(VOY.x - 20 + ((i * 37) % 50), -30 + ((i * 13 + t * (0.3 + (i % 3) * 0.2)) % 28), VOY.z - 10 + ((i * 17) % 30)); });
  }
  // ---- S16-S17 1961: the hull comes back up between salvage pontoons; press boats; camera flashes
  else { S.salv.visible = true; S.salvCrowd.body.visible = S.salvCrowd.head.visible = true; shadowAt(C, VOY.x, 2, VOY.z, 40);
    S.flashes.forEach((f, i) => { const a = (t * 1.3 + i * 0.37) % 1.6; f.material.opacity = a < 0.08 ? 1 - a / 0.08 : 0; });
    let i = 0; for (let j = 0; j < 40; j++, i++) { const s = S.splash.list[i], a = ((t - T.S16) * 1.0 + j * 0.13) % 1.4; s.visible = true; const p = new THREE.Vector3(-D.L / 2 + (j / 40) * D.L, 1.0 - a * 2.2, (j % 2 ? 1 : -1) * 6.2); V.heel.localToWorld(p); s.position.copy(p); s.scale.set(0.5, 1.4, 1); s.material.opacity = 0.55 * (1 - a / 1.4); }
  }
  const si = (S.st || (S.st = C.story)).shots.findIndex((sh) => vt >= sh.a && vt < sh.b), sh = C.story.shots[si < 0 ? C.story.shots.length - 1 : si]; if (sh && sh.outline) px = sh.outline;
  for (const ch of S.all) if (ch.root.visible) ch.update(C.camera, px);
}

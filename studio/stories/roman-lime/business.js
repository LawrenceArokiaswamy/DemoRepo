// Story business for "roman-lime": the carried lime pot, the toss, lumps landing in the mortar, steam, bubbles,
// the dropped pot's bounce-and-roll, and a worker's carried basket. All motion is a pure function of time t,
// and hand-off states are captured from setup() so parallel render chunks agree exactly.
const T_TOSS = 4.36, T_DROP = 6.55, HISS = 5.8;
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a))), lerp = (a, b, k) => a + (b - a) * k;
let S = null;

export async function init(C) {
  const { THREE, scene, SET } = C; S = {};
  // lime pot: gripped at its middle by both hands (IK targets in the performance), tilted to pour
  S.pivot = new THREE.Group(); scene.add(S.pivot); S.pivot.add(SET.pot); S.potAt = (dy) => SET.pot.position.copy(SET.potOff).add(new THREE.Vector3(0, dy, 0)); S.potAt(-SET.potH * 0.5);
  const limeMat = new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.95 });
  S.potLime = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 1), limeMat); m.position.set((i % 3 - 1) * 0.05, 0.1 + (i % 2) * 0.01, (Math.floor(i / 3) - 1) * 0.05); m.castShadow = true; S.pivot.add(m); S.potLime.push(m); }
  S.lumps = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.013 + rnd(i, 1) * 0.014, 1), limeMat); m.castShadow = true; m.visible = false; scene.add(m);
    const a = rnd(i, 2) * Math.PI * 2, r = Math.sqrt(rnd(i, 3)) * SET.tubR * 0.8; S.lumps.push({ m, t0: T_TOSS + 0.04 + rnd(i, 4) * 0.12, fl: 0.36 + rnd(i, 5) * 0.12, end: new THREE.Vector3(SET.tubC.x + Math.cos(a) * r, SET.mortarY + 0.008, SET.tubC.z + Math.sin(a) * r), sp: rnd(i, 6) }); }
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const puffTex = new THREE.CanvasTexture(c); puffTex.colorSpace = THREE.SRGBColorSpace;
  S.puffs = []; for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, color: '#f4f2ee', opacity: 0 })); scene.add(s); const burst = i < 34;
    S.puffs.push({ s, t0: burst ? HISS - 0.02 + rnd(i, 7) * 0.5 : T_TOSS + 0.5 + rnd(i, 8) * 7.5, life: burst ? 1.4 + rnd(i, 9) : 2.2 + rnd(i, 10) * 1.2, burst, a: rnd(i, 11) * 6.28, r: Math.sqrt(rnd(i, 12)) * SET.tubR * 0.8, sp: 0.25 + rnd(i, 13) * 0.35 }); }
  S.bubbles = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#77736b', roughness: 0.25 })); scene.add(m); m.visible = false;
    const a = rnd(i, 14) * 6.28, r = Math.sqrt(rnd(i, 15)) * SET.tubR * 0.85; S.bubbles.push({ m, x: SET.tubC.x + Math.cos(a) * r, z: SET.tubC.z + Math.sin(a) * r, ph: rnd(i, 16), rate: 1.5 + rnd(i, 17) * 2 }); }
  // worker's basket
  const bk = await C.loadModel('wicker_basket_01'); { const b = new THREE.Box3().setFromObject(bk); bk.scale.setScalar(0.26 / (b.max.y - b.min.y)); const b2 = new THREE.Box3().setFromObject(bk), cc = b2.getCenter(new THREE.Vector3()); bk.position.set(-cc.x, -b2.max.y + 0.03, -cc.z); }
  S.basket = new THREE.Group(); S.basket.add(bk); scene.add(S.basket);
}
// deterministic captures (drop start, lump launch point), independent of which frame a render chunk starts on
export function prepare(C) {
  if (S.dropFrom) return; const { THREE, ACT } = C;
  C.setup(T_DROP - 1 / C.FPS); S.dropFrom = { p0: C.cardToWorld(ACT.felix, C.handsMid(ACT.felix), 0.12), v0: new THREE.Vector3(0.9, 2.2, 0.35) };
  C.setup(T_TOSS + 0.1); const m = C.handsMid(ACT.felix); S.lumpStart = C.cardToWorld(ACT.felix, [m[0] - 0.05, m[1] - 0.06], 0.14);
}
function potFall(t) {   // ballistic arc, two bounces, then rolls to rest on its side
  const { p0, v0 } = S.dropFrom, g = 9.81; let tt = t - T_DROP, p = p0.clone(), v = v0.clone(), rest = 0.13, rot = 0; const bounces = [];
  const fly = (dt) => { p.addScaledVector(v, dt); p.y -= 0.5 * g * dt * dt; v.y -= g * dt; };
  for (let b = 0; b < 3; b++) { const disc = v.y * v.y + 2 * g * (p.y - rest), tHit = (v.y + Math.sqrt(Math.max(0, disc))) / g; if (tt < tHit) { fly(tt); rot += tt * 9; return { p, rot, side: Math.min(1, (t - T_DROP) * 1.6), bounces }; }
    fly(tHit); tt -= tHit; rot += tHit * 9; bounces.push(t - tt); v.y = -v.y * (b === 0 ? 0.38 : 0.25); v.x *= 0.6; v.z *= 0.6; }
  const dec = 1.2, sp = Math.hypot(v.x, v.z), tr = Math.min(tt, sp / dec), dist = sp * tr - 0.5 * dec * tr * tr;
  if (sp > 0) { p.x += v.x / sp * dist; p.z += v.z / sp * dist; } p.y = rest; return { p, rot: rot + dist / 0.13, side: 1, bounces };
}
export function frame(t, C) {
  const { THREE, ACT, SET } = C, F = ACT.felix, mid = C.handsMid(F);
  if (t < T_DROP) { S.pivot.position.copy(C.cardToWorld(F, mid, 0.12)); S.pivot.rotation.set(0, F.card.mesh.rotation.y, 0);
    const tilt = t < T_TOSS - 0.12 ? 0 : t < T_TOSS + 0.3 ? Math.sin(ramp(t, T_TOSS - 0.12, T_TOSS + 0.3) * Math.PI / 2) * 1.9 : lerp(1.9, 0, ramp(t, T_TOSS + 0.3, T_TOSS + 0.75));
    S.pivot.rotateZ(tilt); S.potAt(-SET.potH * 0.5); }
  else { const s = potFall(t); S.pivot.position.copy(s.p); S.pivot.rotation.set(0, 0, -s.side * Math.PI / 2); S.pivot.rotateY(s.rot * 0.3); S.potAt(-SET.potH * 0.5); }
  S.potLime.forEach((m) => { m.visible = t < T_TOSS + 0.02; });
  for (const L of S.lumps) { if (t < L.t0) { L.m.visible = false; continue; } L.m.visible = true; const st = S.lumpStart.clone().add(new THREE.Vector3((L.sp - 0.5) * 0.08, (L.sp - 0.5) * 0.04, 0)), k = Math.min(1, (t - L.t0) / L.fl);
    L.m.position.set(lerp(st.x, L.end.x, k), lerp(st.y, L.end.y, k) + Math.sin(k * Math.PI) * 0.22, lerp(st.z, L.end.z, k)); L.m.rotation.set(k * 6 + L.sp * 6, k * 4, 0);
    if (k >= 1) { const d = t - L.t0 - L.fl; L.m.position.y = L.end.y - Math.min(0.012, d * 0.01) + 0.004 * Math.sin(t * 30 + L.sp * 9) * Math.exp(-d * 0.5); } }
  for (const P of S.puffs) { const a = t - P.t0; if (a < 0 || a > P.life) { P.s.material.opacity = 0; continue; } const k = a / P.life;
    P.s.position.set(SET.tubC.x + Math.cos(P.a) * P.r * (1 + k) + (P.burst ? 0.35 * k : 0.1 * k), SET.mortarY + 0.02 + a * P.sp * (P.burst ? 1.4 : 1), SET.tubC.z + Math.sin(P.a) * P.r + (P.burst ? 0.2 * k : 0));
    const sz = (P.burst ? 0.22 : 0.12) + k * (P.burst ? 0.55 : 0.3); P.s.scale.set(sz, sz, 1); P.s.material.opacity = (P.burst ? 0.5 : 0.22) * Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k); }
  for (const B of S.bubbles) { const a = t - (HISS - 0.1); if (a < 0) { B.m.visible = false; continue; } const c = (a * B.rate + B.ph) % 1; B.m.visible = c < 0.7; const s = Math.sin(c / 0.7 * Math.PI) * (a < 3 ? 1 : 0.5); B.m.position.set(B.x, SET.mortarY, B.z); B.m.scale.set(s, s * 1.2, s); }
  const E = ACT.extra0; S.basket.position.copy(C.cardToWorld(E, C.handsMid(E), 0.1)); S.basket.rotation.set(0, E.card.mesh.rotation.y, 0);
  SET.waterTex.offset.set(t * 0.004, t * 0.009);
}
// typed sound cues for engine/tools/sfxlib.py
export function cues(C) {
  const ev = [{ type: 'scrape', t: 3.78 }, { type: 'whoosh', t: T_TOSS - 0.11, dur: 0.45 }, { type: 'sizzle', t: 4.85, peak: HISS + 0.2, end: 12.5 }, { type: 'whoosh', t: 6.45, dur: 0.35, hi: true }];
  for (const L of S.lumps) ev.push({ type: 'plop', t: +(L.t0 + L.fl).toFixed(3) });
  for (let i = 0; i < 40; i++) ev.push({ type: 'bubble', t: +(HISS - 0.1 + rnd(i, 30) * 5.8).toFixed(3) });
  const b = potFall(T_DROP + 3).bounces; b.forEach((t, k) => ev.push({ type: 'clunk', t: +t.toFixed(3), gain: [1, 0.5, 0.3][k] })); ev.push({ type: 'roll', t: +(b[b.length - 1] + 0.03).toFixed(3) });
  for (const t of [6.98, 7.12, 7.27, 7.4]) ev.push({ type: 'scuff', t }); ev.push({ type: 'thud', t: 7.45 + 0.22 / C.ACT.felix.P.persona.tempo });
  return ev;
}

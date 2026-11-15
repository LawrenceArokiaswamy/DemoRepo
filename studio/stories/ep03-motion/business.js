// EPISODE 3 GATE 2 MOTION TEST (9 s): "What if everyone could see your entire internet history?"
// S1 two-shot: calm date -> the phone buzzes, lights up -> he glances (eyes first, then head)
// S2 insert: the alert, readable, progress bar climbing
// S3 his close-up: tiny anticipation -> SNAP into shock -> hold (tremble, shock lines, sweat drop)
// S4 her: head snaps to him, eyes narrow, leans in; he slides his eyes to her and gulps
// S5 wide: the other diners' phones light up in a wave; heads snap down; camera pulls back and up
// Acting rule (Visual standard v2): fast deliberate moves into strong poses (3-6 frames, overshoot) then readable holds.
let S = null, THREE = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), rmp = (t, a, b) => cl((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (x) => x * x * (3 - 2 * x), outBack = (x) => { const c = 1.9; x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// snap(t, t0, d): 0 -> 1 in d seconds with overshoot (the pose lands and settles)
const snap = (t, t0, d = 0.15) => outBack(rmp(t, t0, t0 + d));
const T = { BUZZ: 1.1, S2: 2.0, S3: 3.3, ANT: 3.45, SHOCK: 3.62, S4: 5.0, S5: 6.6, END: 9.0, WAVE: [6.75, 6.92, 7.08, 7.22, 7.38, 7.55] };
export async function init(C) {
  THREE = C.THREE; const RS = C.SET; S = { RS, C };
  const CP = await import('/engine/web/character_cplus.js'); S.CP = CP;
  const L = (k, o = {}) => CP.loadCPlus(THREE, { url: `/engine/web/characters/cplus_${k}.glb`, look: 'v2', faceRes: o.faceRes || 512, face: { style: 'v2', browCol: '#2a1b17' }, recolor: o.recolor, rim: '#ffd2a0', rimK: 0.4, shadowLevel: 178 });
  S.hero = await L('modern_m', { faceRes: 1024, recolor: { top: '#3f6f8f', hair: '#3a2418' } });
  S.partner = await L('modern_f', { faceRes: 1024, recolor: { top: '#b84a48', hair: '#5a2e1c', skin: '#e9b48e' } });
  S.diners = [];
  for (const [k, rc] of [['modern_f', { top: '#4a7a5a', hair: '#2a1a12', skin: '#c98d62' }], ['modern_m', { top: '#8a6a3a', hair: '#1e1612', skin: '#d39672' }], ['modern_m', { top: '#5a4a7a', hair: '#6a4a2a' }], ['modern_f', { top: '#d9a93a', hair: '#8a5a2a' }],
    ['modern_m', { top: '#2f4f4a', hair: '#2a1a12', skin: '#a8714e' }], ['modern_f', { top: '#6a8ab0', hair: '#3a2418', skin: '#f0c8a0' }]]) S.diners.push(await L(k, { recolor: rc }));
  for (const ch of [S.hero, S.partner, ...S.diners]) C.scene.add(ch.root);
  // the hero's phone: live screen canvas (off / alert with climbing %), glow + cool face light
  S.scr = document.createElement('canvas'); S.scr.width = 360; S.scr.height = 760; S.sT = new THREE.CanvasTexture(S.scr); S.sT.colorSpace = THREE.SRGBColorSpace; S.sT.anisotropy = 8; S.scrState = '';
  S.phone = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.009, 0.165), new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.4 })); body.castShadow = true; S.phone.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.074, 0.156), new THREE.MeshBasicMaterial({ map: S.sT, toneMapped: false })); screen.rotation.x = -Math.PI / 2; screen.position.y = 0.0048; screen.userData.keepMaterial = true; S.phone.add(screen);
  S.pglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); S.pglow.scale.set(0.55, 0.55, 1); S.pglow.position.y = 0.03; S.pglow.userData.keepMaterial = true; S.phone.add(S.pglow);
  S.phoneLight = new THREE.PointLight('#8fbaff', 1.9, 2.2, 1.5); S.phoneLight.position.y = 0.12; S.phone.add(S.phoneLight); C.scene.add(S.phone);
  S.dphones = S.diners.map(() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.008), new THREE.MeshBasicMaterial({ color: '#cfe4ff' })); b.userData.keepMaterial = true; g.add(b);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); s.scale.set(0.6, 0.6, 1); s.userData.keepMaterial = true; g.add(s);
    const l = new THREE.PointLight('#8fbaff', 1.2, 1.4, 1.6); l.position.z = 0.1; g.add(l); C.scene.add(g); return { g, b, s, l }; });
  S.sweat = sprite(drawSweat, 0.07, 0.1); S.shock = sprite(drawShock, 0.3, 0.3);
}
// cartoon symbols are overlays: depthTest off so hair never hides them
function sprite(draw, w, h) { const c = document.createElement('canvas'); c.width = 128; c.height = 128; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.renderOrder = 10; s.scale.set(w, h, 1); s.userData.keepMaterial = true; s.userData.base = [w, h]; S.C.scene.add(s); return s; }
function drawSweat(g) { g.beginPath(); g.moveTo(64, 8); g.quadraticCurveTo(108, 70, 94, 96); g.quadraticCurveTo(64, 126, 34, 96); g.quadraticCurveTo(20, 70, 64, 8); g.fillStyle = '#9fd8ff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#1e1418'; g.stroke(); g.beginPath(); g.ellipse(52, 78, 8, 14, -0.3, 0, 7); g.fillStyle = '#fff'; g.fill(); }
function drawShock(g) { g.strokeStyle = '#1e1418'; g.lineCap = 'round'; g.lineWidth = 9; for (const [a, r0, r1] of [[-0.9, 26, 56], [-0.35, 30, 62], [0.2, 26, 54]]) { g.beginPath(); g.moveTo(20 + Math.cos(a) * r0, 110 + Math.sin(a) * r0 * 1.6); g.lineTo(20 + Math.cos(a) * r1, 110 + Math.sin(a) * r1 * 1.6); g.stroke(); } }
function drawScreen(on, pct) { const g = S.scr.getContext('2d'), W = 360, H = 760; const gr = g.createLinearGradient(0, 0, 0, H);
  if (!on) { gr.addColorStop(0, '#15151c'); gr.addColorStop(1, '#0b0b10'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(0, 120); g.lineTo(W, 0); g.lineTo(W, 60); g.lineTo(0, 200); g.fill(); return; }
  gr.addColorStop(0, '#1b2a55'); gr.addColorStop(1, '#0c1226'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#dfe8ff'; g.font = 'bold 74px Inter, DejaVu Sans'; g.textAlign = 'center'; g.fillText('9:41', W / 2, 140);
  g.fillStyle = '#ff3b3b'; g.beginPath(); g.roundRect(18, 210, W - 36, 330, 26); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W / 2, 236); g.lineTo(W / 2 + 34, 296); g.lineTo(W / 2 - 34, 296); g.closePath(); g.fill();
  g.fillStyle = '#ff3b3b'; g.font = 'bold 40px DejaVu Sans'; g.fillText('!', W / 2, 290); g.fillStyle = '#fff'; g.font = '900 40px Inter, DejaVu Sans'; g.fillText('ALERT', W / 2, 350); g.font = 'bold 30px Inter, DejaVu Sans';
  for (const [i, t] of ['Your ENTIRE internet', 'history is now', 'PUBLIC'].entries()) g.fillText(t, W / 2, 400 + i * 40);
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.roundRect(44, 500, W - 88, 18, 9); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(44, 500, (W - 88) * pct, 18, 9); g.fill();
  g.fillStyle = '#9fb4e8'; g.font = 'bold 24px DejaVu Sans'; g.fillText(`Sharing with everyone nearby… ${Math.round(pct * 100)}%`, W / 2, 590); }
const E = (n) => S.CP.EXP[n], X = (a, b, k) => S.CP.blendExp(typeof a === 'string' ? E(a) : a, typeof b === 'string' ? E(b) : b, cl(k));
function seat(ch, T, side, P = {}) { const p = T.seat(side), yaw = Math.atan2(T.x - p.x, T.z - p.z); ch.root.position.set(p.x, 0, p.z); ch.root.rotation.set(0, yaw + (P.turn || 0), 0); ch.root.visible = true;
  const b = { spine: [0.08, 0, 0], chest: [0.06, 0, 0], thighL: [-1.5, 0, 0.06], thighR: [-1.5, 0, -0.06], shinL: [1.45, 0, 0], shinR: [1.45, 0, 0], footL: [0.05, 0, 0], footR: [0.05, 0, 0],
    upperarmL: [-0.55, 0, 0.12], upperarmR: [-0.55, 0, -0.12], forearmL: [-1.0, 0, 0], forearmR: [-1.0, 0, 0], ...(P.bones || {}) };
  ch.pose({ bones: b, offset: { hips: [0, -0.24 + (P.dy || 0), -0.04] }, face: P.face || E('neutral'), gaze: P.gaze || [0, 0], blink: P.blink || 0, hand: P.hand || 'relaxed', squash: P.squash || 0 }); return { p, yaw }; }
const add = (a, b) => a.map((v, i) => v + (b[i] || 0)), mul = (a, k) => a.map((v) => v * k);
export function frameOf(name) { const T = S.RS.TABLE0; if (name === 'table') return new THREE.Matrix4().makeRotationY(T.rot).setPosition(T.x, 0, T.z); return new THREE.Matrix4(); }
export function frame(t, C, vt) {
  t = Math.round(t * 1000) / 1000; const RS = S.RS, TB = RS.TABLE0, br = Math.sin(t * 2.2) * 0.012;
  // ---- phone: off until BUZZ; buzz jiggle 0.4 s; screen on; progress climbs
  const on = t >= T.BUZZ, pct = cl(0.12 + (t - T.BUZZ) * 0.17, 0, 0.97), key = on ? 'on' + Math.round(pct * 100) : 'off';
  if (key !== S.scrState) { drawScreen(on, pct); S.sT.needsUpdate = true; S.scrState = key; }
  const ph = TB.seat(1).lerp(new THREE.Vector3(TB.x, 0, TB.z), 0.55), jig = t > T.BUZZ && t < T.BUZZ + 0.45 ? Math.sin(t * 95) * 0.06 : 0;
  S.phone.position.set(ph.x, TB.top + 0.012, ph.z); S.phone.scale.setScalar(1.6); S.phone.rotation.set(0, TB.rot + 0.9 + Math.PI + jig, 0); S.phone.rotateX(-0.12);
  const glowK = on ? snap(t, T.BUZZ, 0.12) : 0; S.pglow.material.opacity = 0.9 * glowK; S.phoneLight.intensity = (vt >= T.S2 && vt < T.S3 ? 0.6 : 1.9) * glowK;
  // ---- HERO: calm smile -> glance (eyes 1.25, head 1.35) -> curious -> anticipation squint -> SNAP shock -> hold + tremble; later guilty side-glance + gulp
  const glance = snap(t, 1.35, 0.16), ant = rmp(t, T.ANT, T.SHOCK), shock = snap(t, T.SHOCK, 0.12), side = snap(t, 5.95, 0.1) * (1 - snap(t, 6.45, 0.12)), gulp = t > 6.15 && t < 6.45 ? Math.sin(rmp(t, 6.15, 6.45) * Math.PI) : 0;
  let hf = t < 1.25 ? X('relaxed', 'happy', 0.4) : t < T.ANT ? X('happy', 'curious', rmp(t, 1.25, 1.4)) : t < T.SHOCK ? X('curious', 'squint', ss(ant)) : X('squint', { ...E('surprised'), open: [1.3, 1.3], pr: 0.45, brow: [-40, -42], mouth: 'grimace', mo: 0.95, cheek: 0 }, rmp(t, T.SHOCK, T.SHOCK + 0.08));
  const tremble = t > T.SHOCK + 0.15 ? Math.sin(t * 47) * 0.012 : 0;
  const armK = shock * (1 - rmp(t, 4.93, 4.99));   // arms relax back onto the table at the cut to S4 (the frozen face stays)
  seat(S.hero, TB, 1, { face: hf, gaze: [t > 5.9 && t < 6.5 ? -0.9 * side : 0, t < 1.25 ? 0 : 0.8 * (1 - side)], blink: CPblink(t, [0.6, 3.38]),
    squash: -0.03 * ss(ant) * (1 - shock) + 0.035 * shock * (1 - rmp(t, T.SHOCK + 0.15, T.SHOCK + 0.5)) - 0.02 * gulp, dy: 0.015 * shock,
    bones: { spine: [0.04 - 0.08 * shock, 0, 0], chest: [lerp(0.04, -0.14, shock) + br, 0, tremble], neck: [lerp(0, 0.16, glance) - 0.12 * shock, 0, 0], head: [lerp(0.02, 0.24, glance) - 0.1 * shock + 0.06 * gulp, -0.25 * side, 0.04 + tremble],
      upperarmL: [lerp(-0.15, -0.3, armK), 0, lerp(0.12, 0.1, armK)], forearmL: [lerp(-0.45, -1.8, armK), 0, 0], upperarmR: [lerp(-0.62, -0.3, armK), 0, lerp(-0.2, -0.1, armK)], forearmR: [lerp(-0.85, -1.8, armK), 0, 0] } });
  // ---- PARTNER: happy chatting (small nods) -> notices (1.6) -> head snaps to him (5.1) -> eyes narrow (5.3) -> leans in, holds the side-eye
  const pturn = snap(t, 5.1, 0.14), narrow = snap(t, 5.3, 0.12), lean = ss(rmp(t, 5.3, 5.9)), nod = t < 1.2 ? Math.sin(t * 6) * 0.04 : 0;
  const pf = t < 1.6 ? X('relaxed', 'happy', 0.6) : t < 5.25 ? X('happy', 'curious', rmp(t, 1.6, 1.8)) : X('curious', { ...E('suspicious'), open: [0.42, 0.55], pup: [-0.75, 0.15], brow: [18, 14], tilt: [-16, -10], mouth: 'frown', mo: 0.8 }, rmp(t, 5.25, 5.35));
  seat(S.partner, TB, -1, { face: pf, blink: CPblink(t, [0.9, 4.4]), turn: 0.05, dy: -0.01 * lean,
    bones: { spine: [0.1 + 0.08 * lean, 0, 0], chest: [0.08 + 0.06 * lean + br, 0.1 * pturn, 0], head: [nod - 0.02, lerp(0.15, -0.32, pturn), lerp(0.04, -0.14, narrow)],
      upperarmL: [-0.8, 0, 0.15], forearmL: [-1.3, -0.9, 0], upperarmR: [-0.8, 0, -0.15], forearmR: [-1.3, 0.9, 0] } });
  // ---- DINERS: eating/idle until their phone lights up in the wave, then heads snap down + a staggered reaction
  RS.tables.slice(1).forEach((tb, i) => { const ch = S.diners[i]; if (!ch) return; const sideK = i % 2 ? 1 : -1, tw = T.WAVE[i] ?? 9, lit = snap(t, tw, 0.12), look = snap(t, tw + 0.12, 0.16), react = snap(t, tw + 0.35, 0.14);
    const reactF = [E('surprised'), E('scared'), { ...E('surprised'), mouth: 'O' }][i % 3];
    const { p, yaw } = seat(ch, tb, sideK, { face: t < tw + 0.35 ? E('relaxed') : reactF, gaze: [0, 0.6 * look], squash: 0.03 * react * (1 - rmp(t, tw + 0.5, tw + 0.9)),
      bones: { head: [0.05 + 0.33 * look - 0.1 * react, 0, 0], neck: [0.1 * look, 0, 0], upperarmR: [lerp(-0.55, -0.85, look), 0, -0.25], forearmR: [lerp(-1.0, -1.55, look), 0, 0], upperarmL: [-0.55, 0, 0.2], forearmL: [-1.2, 0, 0] } });
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), dp = S.dphones[i]; dp.g.position.copy(p).addScaledVector(fw, 0.32).add(new THREE.Vector3(0, lerp(0.72, 0.9, look), 0)); dp.g.lookAt(dp.g.position.clone().addScaledVector(fw, -1).add(new THREE.Vector3(0, 0.9, 0)));
    dp.b.material.color.set(lit > 0.05 ? '#cfe4ff' : '#16161c'); dp.s.material.opacity = 0.85 * lit; dp.s.scale.setScalar(0.6 * (0.6 + 0.4 * lit)); dp.l.intensity = 1.2 * lit; });
  // ---- symbols beside his head: shock lines pop on the take, sweat drop appears and slides
  S.hero.root.updateMatrixWorld(true); const hp = S.hero.bones.head.getWorldPosition(new THREE.Vector3()), right = new THREE.Vector3().setFromMatrixColumn(C.camera.matrixWorld, 0);
  const shk = snap(t, T.SHOCK + 0.02, 0.12) * (1 - rmp(t, 4.6, 4.8)); S.shock.visible = shk > 0.01 && vt < T.S4; S.shock.scale.set(0.3 * shk, 0.3 * shk, 1); S.shock.position.copy(hp).addScaledVector(right, 0.33).add(new THREE.Vector3(0, 0.3, 0)); S.shock.material.rotation = -Math.PI * 0.35;
  const sw = snap(t, 4.05, 0.12); S.sweat.visible = sw > 0.01 && vt < T.S5; S.sweat.scale.set(0.07 * sw, 0.1 * sw, 1); S.sweat.position.copy(hp).addScaledVector(right, -0.24).add(new THREE.Vector3(0, 0.16 - 0.05 * rmp(t, 4.2, 6.5), 0));
  const px = vt < T.S2 ? 4.6 : vt < T.S3 ? 4.6 : vt < T.S4 ? 6.0 : vt < T.S5 ? 4.6 : 3.2;
  for (const ch of [S.hero, S.partner, ...S.diners]) ch.update(C.camera, px);
}
function CPblink(t, ts) { return S.CP.blinkAt(t, ts); }

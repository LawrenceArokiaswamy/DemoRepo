// EPISODE 3 BENCHMARK (Gate 1 stills): "What if everyone could see your entire internet history?"
// A couple at a restaurant table. His phone lights up: everyone's browsing history is going public. He freezes; she grows
// suspicious; around the room other diners' phones light up. Three stills: A close-up, B table two-shot, C wide.
let S = null, THREE = null;
export async function init(C) {
  THREE = C.THREE; const RS = C.SET; S = { RS, C };
  const CP = await import('/engine/web/character_cplus.js'); S.CP = CP;
  const L = (k, o = {}) => CP.loadCPlus(THREE, { url: `/engine/web/characters/cplus_${k}.glb`, look: 'v2', faceRes: o.faceRes || 512, face: { style: 'v2', browCol: '#2a1b17' }, recolor: o.recolor, rim: o.rim || '#ffd2a0', rimK: 0.4, shadowLevel: 178 });
  S.hero = await L('modern_m', { faceRes: 1024, recolor: { top: '#3f6f8f', hair: '#3a2418' } });
  S.partner = await L('modern_f', { faceRes: 1024, recolor: { top: '#b84a48', hair: '#5a2e1c', skin: '#e9b48e' } });
  S.diners = [];
  const looks = [['modern_f', { top: '#4a7a5a', hair: '#2a1a12', skin: '#c98d62' }], ['modern_m', { top: '#8a6a3a', hair: '#1e1612', skin: '#d39672' }], ['modern_m', { top: '#5a4a7a', hair: '#6a4a2a' }], ['modern_f', { top: '#d9a93a', hair: '#8a5a2a' }],
    ['modern_m', { top: '#2f4f4a', hair: '#2a1a12', skin: '#a8714e' }], ['modern_f', { top: '#6a8ab0', hair: '#3a2418', skin: '#f0c8a0' }]];
  for (const [k, rc] of looks) S.diners.push(await L(k, { recolor: rc }));
  for (const ch of [S.hero, S.partner, ...S.diners]) C.scene.add(ch.root);
  // ---- the phone: dark body + live screen (original UI) + cool glow sprite + a small cool light that lights the face from below
  const scr = document.createElement('canvas'); scr.width = 360; scr.height = 760; S.scr = scr; drawScreen(scr.getContext('2d'));
  const sT = new THREE.CanvasTexture(scr); sT.colorSpace = THREE.SRGBColorSpace; sT.anisotropy = 8;
  S.phone = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.009, 0.165), new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.4 })); body.castShadow = true; S.phone.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.074, 0.156), new THREE.MeshBasicMaterial({ map: sT, toneMapped: false })); screen.rotation.x = -Math.PI / 2; screen.position.y = 0.0048; screen.userData.keepMaterial = true; S.phone.add(screen);
  const pg = new THREE.Sprite(new THREE.SpriteMaterial({ map: RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); pg.scale.set(0.55, 0.55, 1); pg.position.y = 0.03; pg.userData.keepMaterial = true; S.phone.add(pg);
  S.phoneLight = new THREE.PointLight('#8fbaff', 1.9, 2.2, 1.5); S.phoneLight.position.y = 0.12; S.phone.add(S.phoneLight); C.scene.add(S.phone);
  // diners' phones: small glowing screens + glow + a weak cool light each
  S.dphones = S.diners.map(() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.008), new THREE.MeshBasicMaterial({ color: '#cfe4ff' })); b.userData.keepMaterial = true; g.add(b);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); s.scale.set(0.6, 0.6, 1); s.userData.keepMaterial = true; g.add(s);
    const l = new THREE.PointLight('#8fbaff', 1.2, 1.4, 1.6); l.position.z = 0.1; g.add(l); C.scene.add(g); return g; });
  // cartoon symbols (restrained): a sweat drop and three shock lines beside the hero's head
  S.sweat = sprite(drawSweat, 0.07, 0.1); S.shock = sprite(drawShock, 0.3, 0.3);
}
function sprite(draw, w, h) { const c = document.createElement('canvas'); c.width = 128; c.height = 128; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(w, h, 1); s.userData.keepMaterial = true; S.C.scene.add(s); return s; }
function drawSweat(g) { g.beginPath(); g.moveTo(64, 8); g.quadraticCurveTo(108, 70, 94, 96); g.quadraticCurveTo(64, 126, 34, 96); g.quadraticCurveTo(20, 70, 64, 8); g.fillStyle = '#9fd8ff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#1e1418'; g.stroke();
  g.beginPath(); g.ellipse(52, 78, 8, 14, -0.3, 0, 7); g.fillStyle = '#fff'; g.fill(); }
function drawShock(g) { g.strokeStyle = '#1e1418'; g.lineCap = 'round'; g.lineWidth = 9; for (const [a, r0, r1] of [[-0.9, 26, 56], [-0.35, 30, 62], [0.2, 26, 54]]) { g.beginPath(); g.moveTo(20 + Math.cos(a) * r0, 110 + Math.sin(a) * r0 * 1.6); g.lineTo(20 + Math.cos(a) * r1, 110 + Math.sin(a) * r1 * 1.6); g.stroke(); } }
// the notification UI (original design): lock screen, big red warning banner, progress bar
function drawScreen(g) { const W = 360, H = 760; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b2a55'); gr.addColorStop(1, '#0c1226'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#dfe8ff'; g.font = 'bold 74px Inter, DejaVu Sans'; g.textAlign = 'center'; g.fillText('9:41', W / 2, 140);
  g.fillStyle = '#ff3b3b'; g.beginPath(); g.roundRect(18, 210, W - 36, 330, 26); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W / 2, 236); g.lineTo(W / 2 + 34, 296); g.lineTo(W / 2 - 34, 296); g.closePath(); g.fill(); g.fillStyle = '#ff3b3b'; g.font = 'bold 40px DejaVu Sans'; g.fillText('!', W / 2, 290);
  g.fillStyle = '#fff'; g.font = '900 40px Inter, DejaVu Sans'; g.fillText('ALERT', W / 2, 350); g.font = 'bold 30px Inter, DejaVu Sans';
  for (const [i, t] of ['Your ENTIRE internet', 'history is now', 'PUBLIC'].entries()) g.fillText(t, W / 2, 400 + i * 40);
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.roundRect(44, 500, W - 88, 18, 9); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(44, 500, (W - 88) * 0.73, 18, 9); g.fill();
  g.fillStyle = '#9fb4e8'; g.font = 'bold 24px DejaVu Sans'; g.fillText('Sharing with everyone nearby… 73%', W / 2, 590); }

const E = (n) => S.CP.EXP[n];
function seat(ch, T, side, P = {}) {   // seat a C+ character on a chair of table T (side ±1), facing the table centre
  const p = T.seat(side), yaw = Math.atan2(T.x - p.x, T.z - p.z); ch.root.position.set(p.x, 0, p.z); ch.root.rotation.set(0, yaw + (P.turn || 0), 0); ch.root.visible = true;
  const b = { hips: [0.0, 0, 0], spine: [0.08, 0, 0], chest: [0.06, 0, 0], thighL: [-1.5, 0, 0.06], thighR: [-1.5, 0, -0.06], shinL: [1.45, 0, 0], shinR: [1.45, 0, 0], footL: [0.05, 0, 0], footR: [0.05, 0, 0],
    upperarmL: [-0.55, 0, 0.12], upperarmR: [-0.55, 0, -0.12], forearmL: [-1.0, 0, 0], forearmR: [-1.0, 0, 0], ...(P.bones || {}) };
  ch.pose({ bones: b, offset: { hips: [0, -0.24, -0.04] }, face: P.face || E('neutral'), gaze: P.gaze || [0, 0], blink: 0, hand: P.hand || 'relaxed' }); return { p, yaw };
}
export function frameOf(name) { const T = S.RS.TABLE0; if (name === 'table') return new THREE.Matrix4().makeRotationY(T.rot).setPosition(T.x, 0, T.z); return new THREE.Matrix4(); }
export function frame(t, C, vt) {
  const RS = S.RS, T = RS.TABLE0, shot = Math.floor(vt + 1e-6);   // shot 0 = A close-up, 1 = B two-shot, 2 = C wide
  // the couple: hero on side +1 (frozen, staring down at the phone), partner on side -1 (leans in, suspicious)
  const shock = { ...E('surprised'), open: [1.25, 1.25], pr: 0.5, brow: [-36, -38], mouth: 'grimace', mo: 0.9, cheek: 0 };
  seat(S.hero, T, 1, { face: shock, gaze: [0, 0.75], bones: { spine: [0.02, 0, 0], chest: [-0.08, 0, 0], neck: [0.18, 0, 0], head: [0.24, 0, 0.04], upperarmL: [-0.15, 0, 0.12], forearmL: [-0.45, 0, 0], upperarmR: [-0.62, 0, -0.2], forearmR: [-0.85, 0, 0], handL: [0.3, 0, 0], handR: [0.3, 0, 0] } });
  seat(S.partner, T, -1, { face: { ...E('suspicious'), open: [0.42, 0.55], pup: [-0.75, 0.15], brow: [18, 14], tilt: [-16, -10], mouth: 'frown', mo: 0.8 }, gaze: [0, 0], turn: 0.05, bones: { spine: [0.14, 0, 0], chest: [0.12, 0.1, 0], head: [-0.02, -0.32, -0.12], upperarmL: [-0.8, 0, 0.15], forearmL: [-1.3, -0.9, 0], upperarmR: [-0.8, 0, -0.15], forearmR: [-1.3, 0.9, 0] } });
  // phone on the table in front of him, screen up, tilted slightly toward him
  const ph = T.seat(1).lerp(new THREE.Vector3(T.x, 0, T.z), 0.55); S.phone.position.set(ph.x, T.top + 0.012, ph.z); S.phone.scale.setScalar(1.6); S.phone.lookAt(C.camera.position.x, T.top + 0.012, C.camera.position.z); S.phone.rotateY(Math.PI); S.phone.rotateX(-0.25);   // cartoon-scaled phone, screen turned toward the viewer
  // diners around the room: seated at the other tables, looking down at their own glowing phones (held up)
  RS.tables.slice(1).forEach((tb, i) => { const ch = S.diners[i]; if (!ch) return; const side = i % 2 ? 1 : -1;
    const { p, yaw } = seat(ch, tb, side, { face: i % 3 === 0 ? E('surprised') : i % 3 === 1 ? E('scared') : E('concern'), gaze: [0, 0.6], bones: { head: [0.35, 0, 0], neck: [0.1, 0, 0], upperarmR: [-0.85, 0, -0.25], forearmR: [-1.55, 0, 0], upperarmL: [-0.55, 0, 0.2], forearmL: [-1.2, 0, 0] } });
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); const dp = S.dphones[i]; dp.position.copy(p).addScaledVector(fw, 0.32).add(new THREE.Vector3(0, 0.9, 0)); dp.lookAt(dp.position.clone().addScaledVector(fw, -1).add(new THREE.Vector3(0, 0.9, 0))); });
  // symbols beside the hero's head (screen-facing sprites)
  S.hero.root.updateMatrixWorld(true); const hp = S.hero.bones.head.getWorldPosition(new THREE.Vector3()); const cam = C.camera.position, right = new THREE.Vector3().setFromMatrixColumn(C.camera.matrixWorld, 0);
  S.sweat.position.copy(hp).addScaledVector(right, 0.24).add(new THREE.Vector3(0, 0.16, 0)); S.shock.position.copy(hp).addScaledVector(right, -0.32).add(new THREE.Vector3(0, 0.22, 0));
  S.sweat.visible = shot < 2; S.shock.visible = shot === 0;
  for (const ch of [S.hero, S.partner, ...S.diners]) ch.update(C.camera, [6.0, 4.6, 3.2][shot] ?? 4);
}

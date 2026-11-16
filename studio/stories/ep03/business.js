// EPISODE 3: "What if everyone could see your entire internet history?" (fiction). Restaurant set + C+ v2 cast (Gate 2 approved).
// Shots are authored in animation time (story.timeMap conforms them to the voice later). Beats (T) are listed below.
// Inserts use a vertical, front-facing "insert phone" floating in front of the blurred table (readable, controlled exposure).
let S = null, THREE = null;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), rmp = (t, a, b) => cl((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (x) => x * x * (3 - 2 * x), outBack = (x) => { const c = 1.9; x = cl(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const snap = (t, t0, d = 0.15) => outBack(rmp(t, t0, t0 + d));
export const T = { S01: 0, S02: 2.8, S03: 5.0, S04: 7.4, BUB_HE: 10.3, S05: 13.0, BUB_SHE: 13.5, S06: 16.6, S07: 21.2, S08: 23.2, S09: 25.6, S10: 35.4, S11: 41.8, END: 50.0,
  WAVE: [3.0, 3.18, 3.34, 3.5, 3.66, 3.82] };
const QUERIES = { he: 'how to seem interesting on a date', she: 'how to leave a date early',
  weird: ['why do I sneeze when I see the sun', 'can dogs eat cheese', 'how to fold a fitted sheet', 'is it weird to talk to plants', 'why does my cat stare at me', 'how long can you go without blinking'] };
export async function init(C) {
  THREE = C.THREE; const RS = C.SET; S = { RS, C }; C.dbg = () => ({ S, frameOf });
  const CP = await import('/engine/web/character_cplus.js'); S.CP = CP;
  const L = (k, o = {}) => CP.loadCPlus(THREE, { url: `/engine/web/characters/cplus_${k}.glb`, look: 'v2', faceRes: o.faceRes || 512, face: { style: 'v2', browCol: '#2a1b17' }, recolor: o.recolor, rim: '#ffd2a0', rimK: 0.22, paintK: 0.06, shadowLevel: 178 });
  S.hero = await L('modern_m', { faceRes: 1024, recolor: { top: '#3f6f8f', hair: '#3a2418' } });
  S.partner = await L('modern_f', { faceRes: 1024, recolor: { top: '#b84a48', hair: '#5a2e1c', skin: '#e9b48e' } });
  S.diners = [];
  for (const [k, rc] of [['modern_f', { top: '#4a7a5a', hair: '#2a1a12', skin: '#c98d62' }], ['modern_m', { top: '#8a6a3a', hair: '#1e1612', skin: '#d39672' }], ['modern_m', { top: '#5a4a7a', hair: '#6a4a2a' }], ['modern_f', { top: '#d9a93a', hair: '#8a5a2a' }],
    ['modern_m', { top: '#2f4f4a', hair: '#2a1a12', skin: '#a8714e' }], ['modern_f', { top: '#6a8ab0', hair: '#3a2418', skin: '#f0c8a0' }]]) S.diners.push(await L(k, { faceRes: 768, recolor: rc }));
  for (const ch of [S.hero, S.partner, ...S.diners]) C.scene.add(ch.root);
  // table phone (S02, S04-S05, S07) + diners' phones
  S.phone = makePhone(false); C.scene.add(S.phone.g);
  S.dph = S.diners.map(() => { const p = makePhone(false, 0.9); C.scene.add(p.g); return p; });
  // insert phone: vertical, screen facing the insert camera (front-facing, readable)
  S.ins = makePhone(true); C.scene.add(S.ins.g);
  { S.thumb = new THREE.Group(); const tm = new THREE.MeshToonMaterial({ color: '#f2c29c', emissive: '#c48d6c' }); const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.0135, 0.045, 6, 12), tm); th.position.y = 0.036; S.thumb.add(th);
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.07, 6, 12), tm); palm.position.set(0.008, 0.12, 0); S.thumb.add(palm);
    S.thumb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.45, 0.2, 0.87).normalize()); S.thumb.visible = false; S.ins.g.add(S.thumb); }
  S.sweat = sprite(drawSweat, 0.07, 0.1); S.shock = sprite(drawShock, 0.3, 0.3);
  S.bubbles = []; S.lampsBase = RS.lamps.map((l) => l.intensity); S.hemi0 = RS.hemi.color.clone();
}
// ---- phone factory: dark body + live canvas screen + glow + cool light
function makePhone(vertical, scale = 1) {
  const g = new THREE.Group(), c = document.createElement('canvas'); c.width = 360; c.height = 760; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.009, 0.165), new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.4 })); g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.074, 0.156), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0048; scr.userData.keepMaterial = true; g.add(scr);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.RS.phoneGlow, color: '#8fc0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); glow.scale.set(0.5, 0.5, 1); glow.position.y = 0.03; glow.userData.keepMaterial = true; g.add(glow);
  const light = new THREE.PointLight('#8fbaff', 0, 2.0, 1.5); light.position.y = 0.12; g.add(light);
  if (vertical) { g.rotation.x = Math.PI / 2; glow.visible = false; light.visible = false; }
  g.scale.setScalar(scale); return { g, c, tex, glow, light, state: '' };
}
function screen(P, state) { if (P.state === state) return; P.state = state; const g = P.c.getContext('2d'), W = 360, H = 760, [mode, arg] = state.split('|');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, mode === 'off' ? '#15151c' : '#1b2a55'); bg.addColorStop(1, mode === 'off' ? '#0b0b10' : '#0c1226'); g.fillStyle = bg; g.fillRect(0, 0, W, H); g.textAlign = 'center';
  if (mode === 'off') { g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(0, 120); g.lineTo(W, 0); g.lineTo(W, 60); g.lineTo(0, 200); g.fill(); P.tex.needsUpdate = true; return; }
  g.fillStyle = '#dfe8ff'; g.font = 'bold 74px Inter, DejaVu Sans'; g.fillText('9:41', W / 2, 120);
  if (mode === 'alert') { g.fillStyle = '#ff3b3b'; g.beginPath(); g.roundRect(18, 190, W - 36, 360, 26); g.fill(); g.fillStyle = '#fff'; g.font = '900 48px Inter, DejaVu Sans'; g.fillText('⚠ ALERT', W / 2, 262);
    g.font = 'bold 36px Inter, DejaVu Sans'; ['Your search', 'history is now', 'PUBLIC'].forEach((t, i) => g.fillText(t, W / 2, 330 + i * 52));
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.roundRect(44, 500, W - 88, 18, 9); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(44, 500, (W - 88) * (+arg || 0.3), 18, 9); g.fill(); }
  if (mode === 'share') { g.fillStyle = '#eef3ff'; g.font = 'bold 30px Inter, DejaVu Sans'; g.fillText('Sharing your history with', W / 2, 230);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(24, 270, W - 48, 150, 24); g.fill(); g.fillStyle = '#1b2a55'; g.font = '900 46px Inter, DejaVu Sans'; g.fillText(arg, W / 2, 350 + (arg.length > 10 ? -6 : 0));
    g.fillStyle = '#2ecc71'; g.beginPath(); g.arc(W / 2, 520, 46, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - 22, 520); g.lineTo(W / 2 - 4, 540); g.lineTo(W / 2 + 26, 500); g.stroke(); }
  if (mode === 'search') { const [txt, cur] = (arg || '').split('^'); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(20, 220, W - 40, 84, 42); g.fill();
    g.fillStyle = '#9aa3b5'; g.beginPath(); g.arc(66, 262, 16, 0, 7); g.lineWidth = 6; g.strokeStyle = '#9aa3b5'; g.stroke(); g.beginPath(); g.moveTo(78, 274); g.lineTo(90, 286); g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#1b2a55'; g.font = 'bold 30px Inter, DejaVu Sans'; const ls = txt ? wrap(txt, 14) : [''], last = ls[ls.length - 1];
    if (ls.length > 1) { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(20, 220, W - 40, 84 + (ls.length - 1) * 42, 36); g.fill(); g.fillStyle = '#1b2a55'; }
    ls.forEach((l, i) => g.fillText(l, 100, 273 + i * 42)); const w = g.measureText(last).width;
    if (cur === '1') { g.fillStyle = '#2f6bff'; g.fillRect(102 + w, 245 + (ls.length - 1) * 42, 4, 38); } g.textAlign = 'center'; g.fillStyle = 'rgba(223,232,255,0.55)'; g.font = 'bold 24px DejaVu Sans'; g.fillText(txt ? '' : 'Search…', W / 2, 360 + (ls.length - 1) * 42); }
  P.tex.needsUpdate = true; }
// ---- symbols + search bubbles (overlays: depthTest off)
function sprite(draw, w, h, cw = 128, ch = 128) { const c = document.createElement('canvas'); c.width = cw; c.height = ch; draw(c.getContext('2d'), cw, ch); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.renderOrder = 10; s.scale.set(w, h, 1); s.userData.keepMaterial = true; s.visible = false; S.C.scene.add(s); return s; }
function drawSweat(g) { g.beginPath(); g.moveTo(64, 8); g.quadraticCurveTo(108, 70, 94, 96); g.quadraticCurveTo(64, 126, 34, 96); g.quadraticCurveTo(20, 70, 64, 8); g.fillStyle = '#9fd8ff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#1e1418'; g.stroke(); g.beginPath(); g.ellipse(52, 78, 8, 14, -0.3, 0, 7); g.fillStyle = '#fff'; g.fill(); }
function drawShock(g) { g.strokeStyle = '#1e1418'; g.lineCap = 'round'; g.lineWidth = 9; for (const [a, r0, r1] of [[-0.9, 26, 56], [-0.35, 30, 62], [0.2, 26, 54]]) { g.beginPath(); g.moveTo(20 + Math.cos(a) * r0, 110 + Math.sin(a) * r0 * 1.6); g.lineTo(20 + Math.cos(a) * r1, 110 + Math.sin(a) * r1 * 1.6); g.stroke(); } }
function bubble(text, bw = 0.4) {   // search bubble: white rounded card with a search icon and the query; tail pointing down to the head
  const lines = wrap(text, 18), cw = 512, ch = 120 + lines.length * 58;
  return sprite((g) => { g.fillStyle = '#ffffff'; g.strokeStyle = '#1e1418'; g.lineWidth = 8; g.beginPath(); g.roundRect(8, 8, cw - 16, ch - 56, 34); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cw / 2 - 28, ch - 52); g.lineTo(cw / 2, ch - 10); g.lineTo(cw / 2 + 28, ch - 52); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(cw / 2 - 24, ch - 60, 48, 10);
    g.strokeStyle = '#2f6bff'; g.lineWidth = 8; g.beginPath(); g.arc(56, 62, 18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(70, 76); g.lineTo(86, 92); g.stroke();
    g.fillStyle = '#1b2a55'; g.font = '900 44px Inter, DejaVu Sans'; lines.forEach((l, i) => g.fillText(l, 98, 78 + i * 58)); }, bw, bw * ch / cw, cw, ch); }
function wrap(t, n) { const w = t.split(' '), out = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > n) { out.push(cur.trim()); cur = x; } else cur += ' ' + x; } if (cur.trim()) out.push(cur.trim()); return out; }
const E = (n) => S.CP.EXP[n], X = (a, b, k) => S.CP.blendExp(typeof a === 'string' ? E(a) : a, typeof b === 'string' ? E(b) : b, cl(k));
function seat(ch, TB, side, P = {}) { const p = TB.seat(side), yaw = Math.atan2(TB.x - p.x, TB.z - p.z); ch.root.position.set(p.x, 0, p.z); ch.root.rotation.set(0, yaw + (P.turn || 0), 0); ch.root.visible = true;
  const b = { spine: [0.08, 0, 0], chest: [0.06, 0, 0], thighL: [-1.5, 0, 0.06], thighR: [-1.5, 0, -0.06], shinL: [1.45, 0, 0], shinR: [1.45, 0, 0], footL: [0.05, 0, 0], footR: [0.05, 0, 0],
    upperarmL: [-0.55, 0, 0.12], upperarmR: [-0.55, 0, -0.12], forearmL: [-1.0, 0, 0], forearmR: [-1.0, 0, 0], ...(P.bones || {}) };
  ch.pose({ bones: b, offset: { hips: [0, -0.24 + (P.dy || 0), -0.04] }, face: P.face || E('neutral'), gaze: P.gaze || [0, 0], blink: P.blink || 0, hand: P.hand || 'relaxed', squash: P.squash || 0 }); return { p, yaw }; }
export function frameOf(name) { const RS = S.RS, TB = RS.TABLE0;
  if (name === 'table') return new THREE.Matrix4().makeRotationY(TB.rot).setPosition(TB.x, 0, TB.z);
  if (name.startsWith('diner')) { const i = +name.slice(5), tb = RS.tables[i + 1], p = tb.seat(i % 2 ? 1 : -1), yaw = Math.atan2(tb.x - p.x, tb.z - p.z); return new THREE.Matrix4().makeRotationY(yaw).setPosition(p.x, 0, p.z); }   // the diner's own frame: +z = the way they face
  return new THREE.Matrix4(); }
export function frame(t, C, vt) {
  t = Math.round(t * 1000) / 1000; const RS = S.RS, TB = RS.TABLE0, br = Math.sin(t * 2.2) * 0.012;
  // ---- lighting looks: normal -> "next day" (cool, quiet, dimmer lamps) -> "weeks later" (warm, brighter)
  const day2 = t >= T.S08 && t < T.S10, later = t >= T.S10 && t < T.S11; RS.lamps.forEach((l, i) => { l.intensity = S.lampsBase[i] * (day2 ? 0.45 : later ? 1.25 : 1); }); RS.hemi.color.copy(S.hemi0).lerp(new THREE.Color('#9fb8e8'), day2 ? 0.7 : 0);
  // ---- table phone
  const ph = TB.seat(1).lerp(new THREE.Vector3(TB.x, 0, TB.z), 0.55); S.phone.g.position.set(ph.x, TB.top + 0.012, ph.z); S.phone.g.scale.setScalar(1.6); S.phone.g.rotation.set(t >= 22.0 && t < T.S10 ? Math.PI : 0, TB.rot + 0.9 + Math.PI, 0);
  const on = t >= 0.3 && !(t >= 22.0 && t < T.S10); screen(S.phone, on ? 'alert|0.6' : 'off'); S.phone.glow.material.opacity = on ? 0.9 : 0; S.phone.light.intensity = on && !(t >= T.S06 && t < T.S07) ? (t >= T.S07 && t < T.S08 ? 0.4 : 1.6) : 0;
  // ---- insert phone: front-facing in front of the table, visible only during insert shots
  const ins = (t < T.S02) || (t >= T.S06 && t < T.S07) || (t >= 27.0 && t < 28.55) || (t >= 30.0 && t < 31.9) || t >= T.S11; S.ins.g.visible = ins;
  { const lp = t >= T.S11 ? new THREE.Vector3(-0.16, 1.0, 0.02) : new THREE.Vector3(0, 1.02, 0); lp.applyAxisAngle(new THREE.Vector3(0, 1, 0), TB.rot).add(new THREE.Vector3(TB.x, 0, TB.z)); S.ins.g.position.copy(lp); }
  S.ins.g.rotation.set(Math.PI / 2, 0, 0); S.ins.g.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), TB.rot - Math.PI / 2);   // screen faces away from the hero, toward the insert camera
  if (t < T.S02) screen(S.ins, 'alert|' + cl(0.15 + t * 0.12).toFixed(2));
  else if (t < T.S07) screen(S.ins, 'share|' + (t < 18.0 ? 'Boss' : t < 19.4 ? 'Mom' : 'Everyone nearby'));
  else if (t >= T.S11) screen(S.ins, 'search|^' + (Math.floor(t * 2.5) % 2));
  else { const two = t >= 30.0, q = two ? 'how to leave a relationship safely' : 'is this mole normal', lt = t - (two ? 30.0 : 27.0), ty = two ? [0.05, 0.65, 1.55, 1.85] : [0, 0.9, 1.15, 1.5];   // typed, held whole, deleted
    const typed = lt < ty[1] ? q.slice(0, Math.floor(q.length * rmp(lt, ty[0], ty[1]))) : lt < ty[2] ? q : q.slice(0, Math.max(0, Math.floor(q.length * (1 - rmp(lt, ty[2], ty[3])))));
    screen(S.ins, 'search|' + typed + '^' + (Math.floor(t * 3) % 2)); }
  { const on = t >= 42.3; S.thumb.visible = on && S.ins.g.visible; if (on) { const V = (x, y, z) => new THREE.Vector3(x, y, z), A = V(0.07, 0.02, 0.12), H = V(-0.004, 0.014, -0.012), Bk = V(0.03, 0.024, 0.06), H2 = V(-0.002, 0.009, -0.014);
    const p = t < 43.4 ? A.lerp(H, ss(rmp(t, 42.3, 43.4))) : t < 44.3 ? H : t < 46.4 ? H.lerp(Bk, ss(rmp(t, 44.3, 44.9))) : Bk.lerp(H2, ss(rmp(t, 46.4, 47.8)));
    const tr = (t >= 43.4 && t < 44.3) || t >= 47.8 ? 0.0012 : 0; p.x += Math.sin(t * 31) * tr; p.z += Math.sin(t * 23 + 1) * tr; S.thumb.position.copy(p); } }
  // ---- HERO
  const glance = snap(t, 0.5, 0.16), shock = snap(t, 1.2, 0.12), relax = rmp(t, 7.0, 7.4), heBub = snap(t, T.BUB_HE, 0.14), deadpan = snap(t, 14.4, 0.2);
  let hf = t < 1.2 ? X('curious', 'squint', 0.3) : t < 7.4 ? { ...E('surprised'), open: [1.3, 1.3], pr: 0.45, brow: [-40, -42], mouth: 'grimace', mo: 0.95, cheek: 0 } : t < T.BUB_HE ? X('relaxed', 'happy', 0.4)
    : t < 13.6 ? X('happy', { ...E('scared'), mouth: 'grimace' }, rmp(t, T.BUB_HE + 0.15, T.BUB_HE + 0.3)) : t < 14.4 ? E('scared') : t < T.S08 ? { ...E('neutral'), open: [0.55, 0.55], brow: [6, 6], mouth: 'flat' } : t < T.S10 ? E('concern') : t < T.S11 ? X('happy', 'happy', 1) : E('concern');
  let hb = { neck: [0.14 * glance, 0, 0], head: [0.2 * glance - 0.1 * shock * (1 - relax), 0, 0.04], chest: [br - 0.1 * shock * (1 - relax), 0, 0] };
  if (t >= T.S04 && t < T.S08) hb = { head: [0.02 - 0.06 * heBub, deadpan * 0.55, -0.05 * heBub], chest: [br - 0.05 * heBub, 0, 0], upperarmL: [-0.15, 0, 0.12], forearmL: [-0.45, 0, 0], upperarmR: [-0.62, 0, -0.2], forearmR: [-0.85, 0, 0] };
  if (t >= T.S07 && t < T.S08) { const fd = ss(rmp(t, 21.4, 22.1)); hb.upperarmR = [lerp(-0.62, -0.75, fd), 0, -0.2]; hb.head = [0.25, 0, 0]; }
  if (t >= T.S10 && t < T.S11) { const la = Math.sin(t * 9) * 0.05; hb = { head: [-0.12 + la, 0.35, 0.08], chest: [-0.06 + la * 0.5, 0.1, 0], upperarmL: [-0.15, 0, 0.12], forearmL: [-0.45, 0, 0], upperarmR: [-0.62, 0, -0.2], forearmR: [-0.85, 0, 0] }; }
  if (t >= T.S11) { const look = snap(t, 45.6, 0.22); hb = { head: [0.15 * (1 - look) - 0.02, 0.0, 0.06], neck: [0.1 * (1 - look), 0, 0], chest: [br, 0, 0], upperarmR: [-0.85, 0.1, -0.25], forearmR: [-1.5, 0, 0], upperarmL: [-0.15, 0, 0.12], forearmL: [-0.45, 0, 0] }; }
  // revision 2 (owner notes): embarrassment after his bubble; weeks-later callback (tense -> relaxed -> laughing); hesitant ending
  let hG = t < 0.5 ? [0, 0] : t < 7.4 ? [0, 0.75] : t >= T.S11 ? [0, 0.7 * (1 - snap(t, 45.5, 0.15))] : [0, 0], hSq = 0;
  if (t >= T.BUB_HE + 0.35 && t < 14.4) { const e = ss(rmp(t, T.BUB_HE + 0.35, T.BUB_HE + 0.7)); hf = { ...E('scared'), mouth: 'grimace', mo: 0.35, cheek: 1, brow: [14, 18], open: [0.8, 0.8] };
    hb.head = [hb.head[0] + 0.24 * e, hb.head[1] - 0.2 * e, hb.head[2]]; hb.chest = [hb.chest[0] + 0.08 * e, 0, 0]; hG = [0.65 * e, 0.4 * e]; hSq = -0.035 * e; }
  if (t >= 14.4 && t < T.S06) hf = { ...hf, cheek: 1 };
  if (t >= 37.6 && t < T.S11) { const tense = rmp(t, 37.95, 38.1) * (1 - ss(rmp(t, 39.2, 39.7))), lh = ss(rmp(t, 39.8, 40.1)), la = Math.sin(t * 13) * 0.05 * lh, sigh = rmp(t, 39.2, 39.45) * (1 - rmp(t, 39.45, 39.8));
    hf = t < 37.95 ? X('relaxed', 'happy', 0.5) : t < 39.2 ? { ...E('scared'), mouth: 'grimace', mo: 0.4, cheek: 1, brow: [14, 18] } : t < 39.8 ? { ...E('relaxed'), cheek: 1, open: [0.45, 0.45] } : { ...E('happy'), cheek: 1 };
    hb = { head: [-0.02 + 0.2 * tense - 0.12 * lh + la, -0.15 * tense, 0.04], neck: [0.05 * tense, 0, 0], chest: [br + 0.07 * tense + 0.05 * sigh - 0.06 * lh + la * 0.5, 0, 0], upperarmL: [-0.15, 0, 0.12], forearmL: [-0.45, 0, 0], upperarmR: [-0.62, 0, -0.2], forearmR: [-0.85, 0, 0] };
    hG = [0.6 * tense, 0.35 * tense]; hSq = -0.035 * tense - 0.03 * sigh; }
  if (t >= T.S11) { hf = t < 43.6 ? E('concern') : t < 45.4 ? { ...E('concern'), brow: [12, -6], mouth: 'flat', open: [0.85, 0.85] } : t < 48.0 ? { ...E('concern'), brow: [14, 4], mouth: 'grimace', mo: 0.15, open: [1.0, 1.0] } : { ...E('concern'), brow: [10, 10], mouth: 'flat' };
    if (t >= 43.8 && t < 44.35) hG = [0.6, 0.2]; if (t >= 48.0 && t < 48.7) hG = [0, 0.6]; hSq = 0.02 * rmp(t, 48.9, 49.05) * (1 - rmp(t, 49.05, 49.3)); }
  seat(S.hero, TB, 1, { face: hf, gaze: hG, blink: S.CP.blinkAt(t, [9.0, 15.8, 30.0, 39.0, 43.3, 46.5, 49.4]), squash: 0.03 * shock * (1 - rmp(t, 1.4, 1.8)) + hSq, bones: hb });
  // ---- PARTNER
  const sheBub = snap(t, T.BUB_SHE, 0.14), readHis = snap(t, 10.6, 0.16), grin = snap(t, 14.6, 0.14), laugh = t >= T.S10 && t < 37.6 ? Math.sin(t * 10) * 0.06 : 0;
  const pf = t < T.S04 ? X('relaxed', 'curious', rmp(t, 1.4, 1.7)) : t < 10.6 ? X('relaxed', 'happy', 0.5) : t < T.BUB_SHE ? { ...E('suspicious'), open: [0.6, 0.95], brow: [-14, 10], tilt: [6, -10] } : t < 14.6 ? E('surprised') : t < T.S08 ? { ...E('happy'), mouth: 'grimace', cheek: 1 }
    : t < T.S10 ? E('concern') : E('happy');
  const pbn = { spine: [0.1, 0, 0], chest: [0.08 + br + laugh, 0.1 * readHis, 0], head: [-0.02 - 0.12 * readHis * (1 - sheBub) + laugh, lerp(0.15, -0.3, readHis), lerp(0.04, -0.12, readHis) + 0.1 * grin],
      upperarmL: [-0.8, 0, 0.15], forearmL: [-1.3, -0.9, 0], upperarmR: [-0.8, 0, -0.15], forearmR: [-1.3, 0.9, 0] };
  let pf2 = pf, pG = t >= 10.6 && t < T.BUB_SHE ? [-0.3, -0.5] : [0, 0], pSq = 0;
  if (t >= 14.6 && t < T.S06) { const away = ss(rmp(t, 15.3, 15.6)); pf2 = { ...E('concern'), mouth: 'grimace', mo: 0.3, cheek: 1, brow: [10, -4], open: [0.95, 0.95] }; pG = [lerp(-0.7, 0.7, away), 0.15 * away]; pbn.head = [pbn.head[0] + 0.08 * away, pbn.head[1] + 0.4 * away, pbn.head[2]]; pSq = 0.025 * away; }
  if (t >= 37.6 && t < T.S11) { const look = snap(t, 38.0, 0.16), burst = snap(t, 38.55, 0.12), sh = Math.sin(t * 14) * 0.07 * cl(burst);
    pf2 = t < 38.0 ? E('happy') : t < 38.55 ? { ...E('surprised'), open: [1.1, 1.1] } : { ...E('happy'), cheek: 1 };
    pbn.head = [-0.02 - 0.12 * look * (1 - cl(burst)) - 0.25 * burst + sh, lerp(0.15, -0.3, look) * (1 - 0.5 * cl(burst)), 0.04 + 0.1 * burst]; pbn.chest = [0.08 - 0.1 * burst + sh * 0.6, 0, 0];
    pG = [-0.3 * look * (1 - cl(burst)), -0.5 * look * (1 - cl(burst))]; pSq = 0.03 * cl(burst) * Math.abs(Math.sin(t * 14)); }
  seat(S.partner, TB, -1, { face: pf2, blink: S.CP.blinkAt(t, [2.0, 8.6, 16.2, 28.0, 41.0]), turn: 0.05, gaze: pG, squash: pSq, bones: pbn });
  // ---- DINERS
  RS.tables.slice(1).forEach((tb, i) => { const ch = S.diners[i]; if (!ch) return; const sideK = i % 2 ? 1 : -1, tw = T.WAVE[i], lit = t >= tw ? snap(t, tw, 0.12) : 0, look = snap(t, tw + 0.1, 0.15), react = snap(t, tw + 0.3, 0.13);
    const quiet = t >= T.S08 && t < T.S10, giggle = t >= T.S10 && t < T.S11 ? Math.sin(t * 11 + i) * 0.06 : 0;
    const worry = i === 0 && t >= 25.6 && t < 27.0, hes = i === 1 && t >= 28.55 && t < 30.0, quit = i === 3 && t >= 31.9 && t < T.S10, lower = quit ? ss(rmp(t, 32.4, 32.9)) : 0, look2 = look * (1 - lower);
    const dart = hes ? (t < 28.9 ? 0 : t < 29.25 ? -snap(t, 28.9, 0.1) : t < 29.6 ? 1 : 0) : quit ? 0.5 * ss(rmp(t, 32.9, 33.2)) : 0;
    let face = quiet ? E('concern') : t >= T.S10 && t < T.S11 ? E('happy') : t < tw + 0.3 ? E('relaxed') : [E('surprised'), E('scared'), { ...E('surprised'), mouth: 'O' }][i % 3];
    if (hes) face = { ...E('concern'), mouth: 'grimace', mo: 0.2, brow: [16, 16], open: [1.05, 1.05] }; if (quit) face = t < 32.3 ? E('concern') : { ...E('concern'), brow: [18, 18], mouth: 'flat', open: [0.6, 0.6] };
    const sigh = quit ? rmp(t, 32.3, 32.5) * (1 - rmp(t, 32.5, 32.9)) : 0, glance = hes && dart !== 0;
    const { p, yaw } = seat(ch, tb, sideK, { face, gaze: glance ? [0.8 * dart, 0.1] : quit && t > 32.9 ? [0.6, 0.2] : [0, quiet ? 0.7 : 0.6 * look], squash: 0.03 * react * (1 - rmp(t, tw + 0.5, tw + 0.9)) - 0.04 * sigh,
      bones: { head: [glance ? 0.12 : quiet ? 0.32 - 0.12 * lower : 0.05 + 0.33 * look - 0.1 * react + giggle, 0.3 * dart, 0], neck: [0.1 * look, 0, 0], chest: [giggle * 0.5 + 0.1 * sigh, 0, 0], upperarmR: [lerp(-0.55, -0.85, look2), 0, -0.25], forearmR: [lerp(-1.0, -1.55, look2), 0, 0], upperarmL: [-0.55, 0, 0.2], forearmL: [-1.2, 0, 0] } });
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), dp = S.dph[i]; dp.g.position.copy(p).addScaledVector(fw, 0.3).add(new THREE.Vector3(0, lerp(0.72, 0.9, look2), 0)); dp.g.lookAt(dp.g.position.clone().addScaledVector(fw, -1).add(new THREE.Vector3(0, 0.9, 0))); dp.g.rotateX(Math.PI / 2);
    const sOn = worry || hes || (quit && t < 32.7), dOn = t >= tw && !(t >= 22.0 && t < T.S10); screen(dp, sOn ? 'search|^' + (Math.floor(t * 3) % 2) : dOn ? 'alert|0.5' : 'off'); const dim = t >= T.S10 ? 0.35 : 1; dp.glow.material.opacity = sOn ? 0.5 : dOn ? 0.85 * lit * dim : 0; dp.light.intensity = sOn ? 0.8 : dOn ? 1.2 * lit * dim : 0; });
  // ---- close-up fill: a soft warm key near the camera in close and medium character shots (toon faces need a clear key)
  if (!S.fill) { S.fill = new THREE.PointLight('#ffe2c0', 0, 4, 1.5); S.C.scene.add(S.fill); }
  const dc = (t >= 5.0 && t < 7.4) || (t >= 25.6 && t < 27.0) || (t >= 28.55 && t < 30.0) || (t >= 31.9 && t < 33.15) || (t >= T.S10 && t < 37.6); const med = (t >= T.S04 && t < T.S06) || (t >= T.S07 && t < T.S08) || (t >= 37.6 && t < T.S11), fin = t >= T.S11; S.fill.intensity = dc ? (t >= T.S10 && t < 37.6 ? 0.5 : 2.0) : med ? 0.9 : fin ? 0.6 : 0; S.fill.position.copy(C.camera.position).add(new THREE.Vector3(0, 0.35, 0));
  // ---- symbols + bubbles
  S.hero.root.updateMatrixWorld(true); const hp = S.hero.bones.head.getWorldPosition(new THREE.Vector3()), right = new THREE.Vector3().setFromMatrixColumn(C.camera.matrixWorld, 0);
  const shk = snap(t, 1.24, 0.12) * (1 - rmp(t, 2.6, 2.8)); S.shock.visible = shk > 0.01 && t < T.S02; S.shock.scale.set(0.3 * shk, 0.3 * shk, 1); S.shock.position.copy(hp).addScaledVector(right, 0.33).add(new THREE.Vector3(0, 0.3, 0));
  const sw = t >= 10.9 && t < T.S06 ? snap(t, 10.9, 0.12) : t >= 38.1 && t < 39.3 ? snap(t, 38.1, 0.12) : 0; S.sweat.visible = sw > 0.01; S.sweat.scale.set(0.07 * sw, 0.1 * sw, 1); S.sweat.position.copy(hp).addScaledVector(right, -0.24).add(new THREE.Vector3(0, 0.12 - 0.04 * (t < T.S06 ? rmp(t, 11.0, 16.5) : rmp(t, 38.2, 39.3)), 0));
  if (!S.bHe) { S.bHe = bubble(QUERIES.he, 0.56); S.bShe = bubble(QUERIES.she, 0.56); S.bWeird = QUERIES.weird.map((q) => bubble(q)); }
  const mid = S.hero.bones.head.getWorldPosition(new THREE.Vector3()).add(S.partner.bones.head.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
  const place = (b, ch, k, bob, big = false, mid = null) => { b.visible = k > 0.01; if (!b.visible) return; ch.root.updateMatrixWorld(true); const h = ch.bones.head.getWorldPosition(new THREE.Vector3()); b.position.copy(h).add(new THREE.Vector3(0, (big ? 0.42 : 0.5) + Math.sin(t * 2 + bob) * 0.015, 0)); if (mid) b.position.lerp(mid.clone().setY(b.position.y), 0.5); const [w0, h0] = b.userData.wh || (b.userData.wh = [b.scale.x, b.scale.y]); const z = big ? 1.25 : 1; b.scale.set(w0 * k * z, h0 * k * z, 1); };
  place(S.bHe, S.hero, t >= T.BUB_HE && t < 13.35 ? heBub * (1 - ss(rmp(t, 13.1, 13.35))) : t >= 37.9 && t < T.S11 ? snap(t, 37.9, 0.14) : 0, 0, false, mid); place(S.bShe, S.partner, t >= T.BUB_SHE && t < T.S06 ? sheBub : 0, 1.3, false, mid);
  S.bWeird.forEach((b, i) => place(b, S.diners[i], t >= T.S10 && t < 37.6 ? snap(t, (i === 1 ? 36.62 : T.S10 + 0.15), 0.14) : 0, i, true));
  const px = t < 1e9 ? 4.6 : 4.6; for (const ch of [S.hero, S.partner, ...S.diners]) ch.update(C.camera, px);
}

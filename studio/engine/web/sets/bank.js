// BANK INTERIOR (original design, 2026-11-17; reusable for any present-day bank / lobby / heist / office story).
// A classic marble banking hall: teller counter with brass-framed glass, a round vault door ajar, marble columns, coffered ceiling with
// brass chandeliers, a waiting area, a check-writing island, queue ropes, and a glazed front facade onto a street (late-afternoon sun).
// World: floor y = 0, hall x -8..8, z -13..9. Counter front face at z = -9.0 (customers' side z > -9). Front doors at z = +9.
// All models/textures/HDRI: Poly Haven CC0 (fetched by tools/fetch_assets.py). Everything else is procedural.
import { THREE, scene, loadModel, pbr, loadHDRI } from '../stage.js';
export const BANK = { lights: {}, anim: [], props: {} };
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
const box = (w, h, d, mat, x, y, z, ry = 0, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; return add(m, cast); };
const cyl = (r0, r1, h, mat, x, y, z, seg = 32, cast = true) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); return add(m, cast); };
const ctex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const glowTex = ctex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const glow = (x, y, z, col, s = 0.8, op = 0.8) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); scene.add(sp); return sp; };
async function place(id, { x = 0, y = 0, z = 0, ry = 0, h, w, top } = {}) {   // place a CC0 model by its bounds: base on y (or hang from 'top'), optional target height/width
  const m = await loadModel(id); const b = new THREE.Box3().setFromObject(m), sz = b.getSize(new THREE.Vector3()); let k = 1; if (h) k = h / sz.y; else if (w) k = w / Math.max(sz.x, sz.z); m.scale.setScalar(k);
  const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3()); const g = new THREE.Group(); m.position.set(-c.x, top !== undefined ? -b2.max.y : -b2.min.y, -c.z); g.add(m); g.position.set(x, top ?? y, z); g.rotation.y = ry; scene.add(g); return g; }
export const BANK_NAME = 'ASHCROFT & VALE';

export async function build() {
  await loadHDRI('./assets/hdri/bank_vault_1k.hdr', 0.5);
  scene.background = new THREE.Color('#141416'); scene.fog = new THREE.Fog('#1c2026', 24, 56);
  // ---------- lighting (motivated): late sun through the facade (key), cool sky bounce (fill), warm brass practicals, sign + screens
  const key = new THREE.DirectionalLight('#ffd2a0', 2.0); key.position.set(-7, 10, 24); key.target.position.set(0, 0, -6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 2, far: 70 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; scene.add(key, key.target); BANK.lights.key = key;
  BANK.lights.hemi = new THREE.HemisphereLight('#8fa6c8', '#3a3028', 0.38); scene.add(BANK.lights.hemi);
  const counterSpot = new THREE.SpotLight('#ffcf98', 60, 16, 0.75, 0.6, 2); counterSpot.position.set(0, 5.8, -5.5); counterSpot.target.position.set(0, 0.8, -8.5); counterSpot.castShadow = true; counterSpot.shadow.mapSize.set(1024, 1024); counterSpot.shadow.bias = -0.0006;
  scene.add(counterSpot, counterSpot.target); BANK.lights.counter = counterSpot;
  for (const [x, z, i] of [[0, -4, 22], [0, 2.5, 18], [-5.5, -10.6, 6], [5.5, -10.6, 6]]) { const p = new THREE.PointLight('#ffc98a', i, 11, 2); p.position.set(x, 4.3, z); scene.add(p); }
  // ---------- floor: polished marble tiles + a deep green runner from the doors to the counter (leading line)
  const marbleFloor = pbr('marble_01', [7, 9.6], { roughness: 0.22, envMapIntensity: 1.15, color: '#efe6da' }); marbleFloor.roughnessMap = null;
  { const grout = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), new THREE.MeshBasicMaterial({ map: ctex(1024, 1408, (g, w, h) => { g.strokeStyle = 'rgba(60,45,35,0.55)'; g.lineWidth = 3; for (let x = 0; x <= w; x += w / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += h / 11) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }), transparent: true, depthWrite: false })); grout.rotation.x = -Math.PI / 2; grout.position.set(0, 0.003, -2); scene.add(grout); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), marbleFloor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -2); floor.geometry.setAttribute('uv2', floor.geometry.attributes.uv); add(floor, false);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 14), std({ map: ctex(256, 1024, (g, w, h) => { g.fillStyle = '#1f3b33'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8954a'; g.lineWidth = 10; g.strokeRect(14, -10, w - 28, h + 20); g.strokeStyle = '#2c4d43'; g.lineWidth = 3; for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke(); } }), roughness: 0.95 }));
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.006, 1.6); add(runner, false);
  // ---------- walls: dark wood wainscot, warm plaster above, brass rail, crown moulding
  const plaster = pbr('plastered_wall_02', [6, 2], { color: '#e8dccb' }), wood = pbr('dark_wood', [6, 1], { roughness: 0.55 }), brass = std({ color: '#c9a24e', metalness: 0.85, roughness: 0.32 }), darkBrass = std({ color: '#8a6a2e', metalness: 0.8, roughness: 0.4 });
  const marble = pbr('marble_01', [1, 1], { roughness: 0.18, envMapIntensity: 1.2 });
  const wall = (len, x, z, ry, h = 6) => { const g = new THREE.Group(); const up = new THREE.Mesh(new THREE.PlaneGeometry(len, h - 1.4), plaster); up.position.y = 1.4 + (h - 1.4) / 2; const lo = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.4), wood); lo.position.set(0, 0.7, 0.01);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.06), brass); rail.position.set(0, 1.42, 0.03); const crown = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, 0.25), std({ color: '#d8ccb8' })); crown.position.set(0, h - 0.15, 0.1);
    for (const m of [up, lo, rail, crown]) { m.receiveShadow = true; g.add(m); } g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; };
  wall(16, 0, -13, 0); wall(22, -8, -2, Math.PI / 2); wall(22, 8, -2, -Math.PI / 2);
  // ---------- coffered ceiling
  const ceilM = std({ color: '#e9e1d4', roughness: 0.9 }); const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), ceilM); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 6.0, -2); add(ceil, false);
  for (let x = -6; x <= 6; x += 3) box(0.28, 0.35, 22, ceilM, x, 5.82, -2, 0, false); for (let z = -12; z <= 8; z += 2.5) box(16, 0.35, 0.28, ceilM, 0, 5.82, z, 0, false);
  // ---------- marble columns with brass bases and capitals
  for (const x of [-4.4, 4.4]) for (const z of [-6, -0.5, 5]) { const c = cyl(0.36, 0.38, 6, marble, x, 3, z, 40); c.material = marble; cyl(0.5, 0.5, 0.3, brass, x, 0.15, z); cyl(0.55, 0.42, 0.35, std({ color: '#d9cfbf' }), x, 5.65, z); }
  // ---------- teller counter: dark wood body, marble top, brass kick rail, glass partitions with brass mullions and speak holes
  box(13.6, 1.08, 0.75, wood, 0, 0.54, -9.38); box(13.8, 0.06, 0.95, marble, 0, 1.11, -9.35); box(13.6, 0.05, 0.05, brass, 0, 0.12, -8.98);
  for (let i = 0; i < 8; i++) { const x = -6.3 + i * 1.8; box(1.5, 0.75, 0.02, std({ color: '#3a2618', roughness: 0.5 }), x + 0.9, 0.55, -8.99, 0, false); }   // panel insets
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 4; i++) { const x = -4.8 + i * 3.2; const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.15), glass); pane.position.set(x, 1.78, -9.3); pane.renderOrder = 2; scene.add(pane);
    const hole = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.09, 24), darkBrass); hole.position.set(x, 1.62, -9.29); scene.add(hole); box(0.5, 0.05, 0.2, darkBrass, x, 1.16, -9.3); }
  for (let i = 0; i <= 4; i++) box(0.06, 1.2, 0.08, brass, -6.4 + i * 3.2, 1.75, -9.3); box(13, 0.07, 0.1, brass, 0, 2.36, -9.3);
  // teller stations behind the glass: monitors with live-looking UI (screen glow), keyboards, number lamps, paperwork
  const screenTex = ctex(512, 320, (g, w, h) => { g.fillStyle = '#0f2a44'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f7fc1'; g.fillRect(0, 0, w, 40); g.fillStyle = '#e8f1f8'; g.font = 'bold 22px DejaVu Sans'; g.fillText(BANK_NAME + '  ·  TELLER 3', 14, 28);
    for (let r = 0; r < 8; r++) { g.fillStyle = r % 2 ? '#15385a' : '#123150'; g.fillRect(14, 56 + r * 30, w - 28, 26); g.fillStyle = '#9cc4e4'; g.fillRect(24, 64 + r * 30, 120 + (r * 37) % 90, 9); g.fillStyle = '#5fbf7f'; g.fillRect(w - 110, 64 + r * 30, 60 + (r * 23) % 30, 9); } });
  for (let i = 0; i < 4; i++) { const x = -4.8 + i * 3.2; box(2.6, 0.06, 0.8, std({ color: '#5a3a26', roughness: 0.5 }), x, 0.92, -10.4); box(2.5, 0.88, 0.05, wood, x, 0.45, -10.8);
    const mon = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.04), std({ color: '#1c1d20', roughness: 0.4 })); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.z = 0.021;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), std({ color: '#1c1d20' })); stand.position.y = -0.27; mon.add(body, scr, stand); mon.position.set(x + 0.55, 1.33, -10.25); mon.rotation.y = Math.PI - 0.55; mon.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(mon);
    glow(x + 0.45, 1.33, -10.15, '#5aa8ff', 0.7, 0.25); box(0.45, 0.03, 0.16, std({ color: '#2a2b2e' }), x - 0.1, 0.96, -10.2);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshBasicMaterial({ map: ctex(170, 100, (g, w, h) => { g.fillStyle = '#121212'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff6a3a'; g.font = 'bold 70px DejaVu Sans'; g.textAlign = 'center'; g.fillText(String(i + 1), w / 2, 78); }) }));
    num.position.set(x - 1.05, 2.15, -9.27); scene.add(num); }
  // cash on the counter of window 2 (the robber's target): banded stacks of fictional notes
  const cashTex = ctex(256, 128, (g, w, h) => { g.fillStyle = '#c9d3b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#7f9a6e'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.strokeStyle = '#5c7a52'; g.lineWidth = 3; g.strokeRect(14, 18, w - 28, h - 36); g.fillStyle = '#556f4a'; g.font = 'bold 34px DejaVu Sans'; g.fillText('100', 24, 58); g.fillStyle = '#d8b25a'; g.fillRect(w / 2 - 14, 0, 28, h); });
  const cashM = std({ map: cashTex, roughness: 0.85 }); BANK.props.cash = [];
  for (let k = 0; k < 9; k++) { const s = box(0.17, 0.07, 0.08, cashM, -1.6 - 0.45 + (k % 3) * 0.2, 1.17 + Math.floor(k / 3) * 0.072, -9.55 + (k % 2) * 0.1); BANK.props.cash.push(s); }
  // ---------- back wall: brass sign on a green marble band, clock, framed prints, security cameras
  const signTex = ctex(2048, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d3a31'); gr.addColorStop(1, '#13271f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24e'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
    g.textAlign = 'center'; g.fillStyle = '#e8c36a'; g.font = '600 150px DejaVu Serif'; g.fillText(BANK_NAME, w / 2, 172); g.font = '600 52px DejaVu Serif'; g.fillStyle = '#c9a24e'; g.fillText('SAVINGS  ·  TRUST  ·  EST. 1931', w / 2, 255); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.2), std({ map: signTex, emissive: '#3a2a10', emissiveMap: signTex, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.2 })); sign.position.set(0, 4.25, -12.97); scene.add(sign);
  for (const x of [-3.8, 3.8]) glow(x, 4.95, -12.8, '#ffd08a', 1.4, 0.35);
  BANK.props.clock = await place('wall_clock', { x: -6.0, y: 3.6, z: -12.95, h: 0.75 });
  for (const [x, z, ry] of [[-7.95, -6, Math.PI / 2], [-7.95, 1.5, Math.PI / 2], [7.95, -6.5, -Math.PI / 2]]) await place('fancy_picture_frame_01', { x, y: 2.1, z, ry, h: 1.3 });
  for (const [x, z, ry] of [[-7.6, -12.6, Math.PI * 0.8], [7.6, -12.6, -Math.PI * 0.8], [7.6, 8.6, -Math.PI * 0.25]]) await place('security_camera_01', { x, y: 4.7, z, ry, h: 0.35 });
  await place('fire_alarm', { x: -7.95, y: 1.9, z: 6.5, ry: Math.PI / 2, h: 0.25 });
  // ---------- the vault: round steel door ajar in the back wall (behind the counter, right), lit interior with deposit boxes
  { const vx = 5.0, vz = -12.9, R = 1.35, steel = std({ color: '#9aa1a8', metalness: 0.9, roughness: 0.3 });
    const frame = new THREE.Mesh(new THREE.TorusGeometry(R + 0.12, 0.16, 16, 64), steel); frame.position.set(vx, 1.55, vz + 0.05); add(frame);
    const inside = new THREE.Mesh(new THREE.CircleGeometry(R, 48), std({ map: ctex(512, 512, (g, w, h) => { g.fillStyle = '#4a5560'; g.fillRect(0, 0, w, h); for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { g.fillStyle = (x + y) % 3 ? '#b8a46a' : '#a8955e'; g.fillRect(8 + x * 42, 8 + y * 42, 36, 36); g.fillStyle = '#3a3324'; g.fillRect(24 + x * 42, 24 + y * 42, 6, 6); } }), emissive: '#6a7684', emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.5 }));
    inside.position.set(vx, 1.55, vz + 0.02); scene.add(inside);
    const door = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.45, 64), steel); disc.rotation.x = Math.PI / 2; disc.position.x = R; door.add(disc);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 24), steel); sp.position.set(R, 0, 0.26); sp.rotation.z = k * Math.PI / 3; door.add(sp); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), steel); bar.rotation.z = k * Math.PI / 3; bar.position.set(R, 0, 0.27); door.add(bar); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), steel); b.position.set(R + Math.cos(a) * (R - 0.12), Math.sin(a) * (R - 0.12), 0); b.rotation.x = Math.PI / 2; door.add(b); }
    door.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); door.position.set(vx - R, 1.55, vz + 0.3); door.rotation.y = -0.85; scene.add(door); BANK.props.vault = door;
    const vl = new THREE.PointLight('#bcd6ff', 5, 5, 2); vl.position.set(vx, 1.6, vz + 0.6); scene.add(vl); }
  // ---------- chandeliers + wall sconces (warm practicals, glow sprites for bloom)
  for (const z of [-4, 2.5]) { await place('Chandelier_01', { x: 0, z, top: 6.0, h: 1.6 }); glow(0, 4.75, z, '#ffcf8a', 1.6, 0.3); }
  for (const z of [-9.5, -3, 3.5]) for (const s of [-1, 1]) { cyl(0.08, 0.12, 0.25, brass, s * 7.92, 2.9, z, 12); glow(s * 7.75, 3.05, z, '#ffc77a', 0.9, 0.7); }
  // ---------- queue lane: brass stanchions with red velvet rope (catenary)
  const velvet = std({ color: '#7a1424', roughness: 0.75 }); const posts = [];
  for (const x of [-1.15, 1.15]) for (let k = 0; k < 4; k++) { const z = -8.0 + k * 1.25; cyl(0.035, 0.035, 0.95, brass, x, 0.5, z, 12); cyl(0.17, 0.2, 0.05, brass, x, 0.03, z, 24); const t = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), brass); t.position.set(x, 1.0, z); add(t); posts.push([x, z]); }
  for (let i = 0; i < posts.length - 1; i++) { const [x0, z0] = posts[i], [x1, z1] = posts[i + 1]; if (x0 !== x1) continue; const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(new THREE.Vector3(x0, 0.9 - Math.sin(Math.PI * u) * 0.16, z0 + (z1 - z0) * u)); }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 8), velvet)); }
  // ---------- check-writing island (left) with slips, pens and a brass lamp; trash can
  box(1.9, 1.02, 0.75, wood, -3.0, 0.51, -3.2); box(2.05, 0.06, 0.9, marble, -3.0, 1.05, -3.2);
  await place('stationery_supplies', { x: -3.5, y: 1.08, z: -3.2, h: 0.12 }); await place('office_notepads', { x: -2.6, y: 1.08, z: -3.1, w: 0.35 }); await place('clipboard', { x: -2.2, y: 1.08, z: -3.3, w: 0.32, ry: 0.4 });
  await place('metal_trash_can', { x: -2.0, z: -2.5, h: 0.6 });
  // ---------- waiting area (right): sofa, armchairs, coffee table, plants
  await place('sofa_02', { x: 7.2, z: 1.8, ry: -Math.PI / 2, w: 2.2 }); await place('modern_arm_chair_01', { x: 5.3, z: 0.4, ry: Math.PI * 0.75, h: 0.85 }); await place('modern_arm_chair_01', { x: 5.3, z: 3.3, ry: Math.PI * 0.25, h: 0.85 });
  await place('coffee_table_round_01', { x: 6.1, z: 1.8, h: 0.45 }); await place('binder_notebook', { x: 6.0, y: 0.46, z: 1.7, w: 0.3, ry: 0.5 });
  for (const [x, z, id, h] of [[7.3, -1.2, 'pachira_aquatica_01', 2.2], [7.3, 4.6, 'potted_plant_02', 1.6], [-7.3, -0.5, 'potted_plant_01', 1.7], [-7.3, 7.6, 'pachira_aquatica_01', 2.3], [7.3, 7.6, 'potted_plant_01', 1.7]]) await place(id, { x, z, h });
  await place('WetFloorSign_01', { x: -5.8, z: 6.8, h: 0.65, ry: 0.6 });
  // ---------- glazed front facade with double doors (brass frames), etched name (reads reversed from inside), street beyond in sun
  const street = ctex(2048, 1024, (g, w, h) => { const sky = g.createLinearGradient(0, 0, 0, h * 0.5); sky.addColorStop(0, '#f6e6cf'); sky.addColorStop(1, '#fbf1df'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const bl = [['#c9b7a0', 0, 330, 520], ['#b8a38c', 300, 240, 600], ['#d8c8b2', 560, 300, 480], ['#a8957f', 880, 260, 640], ['#cfbca5', 1160, 330, 540], ['#bba893', 1500, 280, 620], ['#d2c2ad', 1800, 260, 500]];
    for (const [c, x, bw, bh] of bl) { g.fillStyle = c; g.fillRect(x, h * 0.62 - bh, bw, bh); g.fillStyle = 'rgba(90,110,130,0.55)'; for (let yy = h * 0.62 - bh + 40; yy < h * 0.62 - 60; yy += 70) for (let xx = x + 24; xx < x + bw - 40; xx += 60) g.fillRect(xx, yy, 34, 46); }
    g.fillStyle = '#9b958c'; g.fillRect(0, h * 0.62, w, h * 0.06); g.fillStyle = '#6e6a66'; g.fillRect(0, h * 0.68, w, h * 0.32);
    g.fillStyle = '#3d5a7a'; g.beginPath(); g.roundRect(1250, h * 0.6 - 70, 420, 110, 40); g.fill(); g.fillStyle = '#9fc0dc'; g.fillRect(1330, h * 0.6 - 60, 240, 40); g.fillStyle = '#1e1e1e'; for (const xx of [1330, 1590]) { g.beginPath(); g.arc(xx, h * 0.6 + 40, 34, 0, 7); g.fill(); }
    for (const xx of [180, 760, 1880]) { g.fillStyle = '#5b4632'; g.fillRect(xx, h * 0.62 - 260, 18, 260); g.fillStyle = '#7b9a5a'; g.beginPath(); g.arc(xx + 9, h * 0.62 - 300, 110, 0, 7); g.fill(); } });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), new THREE.MeshBasicMaterial({ map: street, color: '#ffffff' })); st.position.set(0, 6, 20); st.rotation.y = Math.PI; scene.add(st); BANK.props.street = st;
  const fglass = new THREE.MeshPhysicalMaterial({ color: '#e9f3f6', transparent: true, opacity: 0.12, roughness: 0.03, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), fglass); fp.position.set(0, 3, 9); fp.castShadow = false; scene.add(fp);
  for (let x = -8; x <= 8; x += 1.6) box(0.1, 6, 0.14, darkBrass, x, 3, 9); for (const y of [0.05, 3.3, 5.9]) box(16, 0.12, 0.16, darkBrass, 0, y, 9);
  const etched = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.5), new THREE.MeshBasicMaterial({ map: ctex(1024, 170, (g, w, h) => { g.translate(w, 0); g.scale(-1, 1); g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '600 96px DejaVu Serif'; g.textAlign = 'center'; g.fillText(BANK_NAME, w / 2, 120); }), transparent: true, depthWrite: false }));
  etched.position.set(0, 2.3, 8.95); etched.rotation.y = Math.PI; scene.add(etched);
  // ---------- atmosphere: sun shafts through the facade + slow dust motes (animated per frame)
  const shaftTex = ctex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,220,170,0.0)'); gr.addColorStop(0.25, 'rgba(255,220,170,0.55)'); gr.addColorStop(1, 'rgba(255,220,170,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const hx = g.createLinearGradient(0, 0, w, 0); hx.addColorStop(0, 'rgba(0,0,0,1)'); hx.addColorStop(0.5, 'rgba(0,0,0,0)'); hx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = hx; g.fillRect(0, 0, w, h); });
  BANK.shafts = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 13), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.11, side: THREE.DoubleSide, fog: false }));
    m.position.set(-5.6 + i * 2.4, 3.2, 3.5); m.rotation.set(0.62, 0.25, 0.0); scene.add(m); BANK.shafts.push(m); }
  { const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 14; pos[i * 3 + 1] = Math.random() * 5.5; pos[i * 3 + 2] = -10 + Math.random() * 18; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex, color: '#ffe2b8', size: 0.025, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust); BANK.dust = { pts: dust, base: pos.slice() }; }
  BANK.tick = (t) => { const p = BANK.dust.pts.geometry.attributes.position, b = BANK.dust.base; for (let i = 0; i < p.count; i++) { p.array[i * 3] = b[i * 3] + Math.sin(t * 0.3 + i) * 0.15; p.array[i * 3 + 1] = (b[i * 3 + 1] + t * 0.05 + Math.sin(t * 0.5 + i * 1.7) * 0.1) % 5.5; } p.needsUpdate = true; };
  return BANK;
}
// a canvas duffel bag (3D, so it can be thrown, land, slide and be picked up in the world)
export function makeDuffel(col = '#2c3a52') {
  const g = new THREE.Group(), fab = std({ color: col, roughness: 0.92 }), trim = std({ color: '#151a24', roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 8, 20), fab); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.85); g.add(body);
  for (const s of [-1, 1]) { const end = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), trim); end.position.x = s * 0.385; end.rotation.y = s * Math.PI / 2; g.add(end); }
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.02), trim); zip.position.y = 0.168; g.add(zip);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 16, Math.PI), trim); h.position.set(s * 0.1, 0.15, 0); g.add(h); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); return g;
}

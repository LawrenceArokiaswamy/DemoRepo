// Roman harbour world (original). Two eras + a microscopic cutaway set. world.update(S) drives all story state.
import { THREE, scene, add, tbox, group, toon, texMat, waterMat, waterU, ND_INST, flatND } from './core.js';
import * as TX from './tex.js';

const WALL = { x0: -70, x1: 31, z: 4.2, top: 3.4, bot: -7 };
const M = {
  conFresh: texMat(TX.concrete(3), 1, 1), conOld: texMat(TX.concrete(3, { weathered: true }), 1, 1), conWet: texMat(TX.concrete(9, { wet: true, clasts: 2.2, size: 1024 }), 1, 1),
  modern: texMat((() => { const c = TX.concrete(21, { clasts: 0 }); const g = c.getContext('2d'); g.fillStyle = 'rgba(150,150,150,0.55)'; g.fillRect(0, 0, 1024, 1024);
    const r = TX.rng(4); g.strokeStyle = 'rgba(30,28,26,0.85)'; for (let i = 0; i < 14; i++) { g.lineWidth = 2 + r() * 3; g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 9; k++) { x += (r() - 0.5) * 120; y += r() * 90; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 18; i++) { const x = r() * 1024, y = r() * 600; const gr = g.createLinearGradient(x, y, x, y + 300); gr.addColorStop(0, 'rgba(140,70,30,0.7)'); gr.addColorStop(1, 'rgba(140,70,30,0)'); g.fillStyle = gr; g.fillRect(x - 6, y, 12 + r() * 10, 300); } return c; })(), 1, 1),
  ashlar: texMat(TX.ashlar(5), 1, 1), ashlarW: texMat(TX.ashlar(6, { tone: '#d8c4a0' }), 1, 1),
  plank: texMat(TX.planks(7), 1, 1), plankV: texMat(TX.planks(8, { tone: '#8a5c34', vertical: true }), 1, 1), wood: toon({ color: '#7a5030' }), woodDark: toon({ color: '#4e3320' }),
  rock: texMat(TX.rock(11), 2, 2), sand: texMat(TX.sand(12), 30, 30), rust: texMat(TX.rust(13)), lime: toon({ color: '#f6f3ea' }), limeGlow: toon({ color: '#ffffff', emissive: '#d8f2ff', emissiveIntensity: 0.0 }),
  plaster: toon({ color: '#e8d8bc' }), plaster2: toon({ color: '#d9c09a' }), roof: toon({ color: '#b5583a' }), green: toon({ color: '#5d7d38' }), green2: toon({ color: '#47672c' }), cypress: toon({ color: '#36522a' }),
  terra: toon({ color: '#b6643a' }), basket: toon({ color: '#b48a4e' }), rope: toon({ color: '#a8875a' }), iron: toon({ color: '#4d4a46' }), sail: toon({ color: '#efe3c8', side: THREE.DoubleSide }), hullRed: toon({ color: '#8c3a28' }),
  algae: toon({ color: '#3f5f2c' }), barn: toon({ color: '#d6cdb8' }),
};
const ROMAN = group(), MODERN = group(), BOTH = group(), CUT = group(0, -400, 0);

// ---------- sea ----------
const seaGeo = new THREE.PlaneGeometry(900, 900, 320, 320); seaGeo.rotateX(-Math.PI / 2);
const sea = new THREE.Mesh(seaGeo, waterMat); sea.userData.nd = flatND([0, 1, 0]); sea.position.set(60, 0, 0); scene.add(sea);
const farSea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), waterMat); farSea.position.y = -0.25; farSea.userData.nd = flatND([0, 1, 0]); scene.add(farSea);

// ---------- the sea wall (mole) ----------
const wallLen = WALL.x1 - WALL.x0, wallH = WALL.top - WALL.bot;
const wallBody = add(tbox(wallLen, wallH, WALL.z * 2, 3.2), M.conFresh, (WALL.x0 + WALL.x1) / 2, (WALL.top + WALL.bot) / 2, 0, BOTH);
// coping stones along both top edges, string course at mid height
const coping = []; for (const s of [-1, 1]) for (let x = WALL.x0 + 1; x < WALL.x1 - 1; x += 1.6) coping.push(add(tbox(1.55, 0.35, 0.7, 1.2), M.ashlar, x + 0.8, WALL.top + 0.17, s * (WALL.z - 0.35), BOTH));
// rubble mound at the waterline
const rubble = (() => { const g = new THREE.DodecahedronGeometry(1, 0), im = new THREE.InstancedMesh(g, M.rock, 520), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = TX.rng(7); let k = 0;
  for (let i = 0; i < 520; i++) { const along = r(), x = WALL.x0 + along * (wallLen + 3), side = r() < 0.5 ? -1 : 1, z = side * (WALL.z + 0.6 + r() * 2.2), s = 0.5 + r() * 1.1;
    if (x > WALL.x1 + 1 && Math.abs(z) < WALL.z) continue; e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, -0.6 + r() * 0.5, x > WALL.x1 ? (r() - 0.5) * 9 : z), q, new THREE.Vector3(s, s * 0.6, s)); im.setMatrixAt(k++, m4); }
  im.count = k; im.castShadow = im.receiveShadow = true; im.userData.nd = ND_INST; BOTH.add(im); return im; })();

// ---------- Roman era: construction site ----------
// unfinished end: timber formwork standing in the sea
for (let x = 31; x <= 38; x += 1.4) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.16, 0.18, 11, 8), M.wood, x, -2, s * (WALL.z + 0.2), ROMAN);
for (const s of [-1, 1]) add(tbox(7.4, 4.6, 0.2, 2), M.plank, 34.7, 0.7, s * (WALL.z + 0.05), ROMAN);
add(tbox(0.2, 4.6, WALL.z * 2 + 0.3, 2), M.plank, 38.4, 0.7, 0, ROMAN);
const fillIn = add(tbox(7.2, 2.6, WALL.z * 2 - 0.1, 2), M.conWet, 34.7, -0.3, 0, ROMAN); // half-filled formwork
for (let x = 31.5; x <= 38; x += 2.1) add(tbox(0.18, 0.18, WALL.z * 2 + 1.2, 1), M.woodDark, x, 3.05, 0, ROMAN);
// mixing trough + wet concrete surface + lumps
const TR = { x: 2.6, z: 0.9, y: WALL.top };
const trough = group(TR.x, TR.y, TR.z, ROMAN);
add(tbox(2.4, 0.12, 1.3, 1), M.plank, 0, 0.06, 0, trough); for (const s of [-1, 1]) { add(tbox(2.4, 0.62, 0.1, 1), M.plank, 0, 0.37, s * 0.65, trough); add(tbox(0.1, 0.62, 1.3, 1), M.plank, s * 1.2, 0.37, 0, trough); }
const mixMat = texMat(TX.concrete(9, { wet: true, clasts: 0.4 }), 1, 1); const mix = add(tbox(2.28, 0.04, 1.18, 0.6), mixMat, 0, 0.5, 0, trough);
const lumps = (() => { const g = new THREE.IcosahedronGeometry(1, 1), im = new THREE.InstancedMesh(g, M.lime, 70), r = TX.rng(17), data = [];
  for (let i = 0; i < 70; i++) data.push({ x: (r() - 0.5) * 2.0, z: (r() - 0.5) * 1.0, s: 0.012 + Math.pow(r(), 2.5) * 0.03, ry: r() * 6, delay: r() });
  im.userData.data = data; im.userData.nd = ND_INST; im.castShadow = false; trough.add(im); return im; })();
// lime heap + baskets + amphorae + sacks
const heap = add(new THREE.ConeGeometry(0.75, 0.7, 14), M.lime, -1.0, WALL.top + 0.35, 2.4, ROMAN); heap.scale.set(1, 1, 0.8);
const basket = (x, z, s = 1, par = ROMAN) => { const b = add(new THREE.CylinderGeometry(0.32 * s, 0.24 * s, 0.42 * s, 14, 1, true), M.basket, x, WALL.top + 0.21 * s, z, par); add(new THREE.CircleGeometry(0.3 * s, 14).rotateX(-Math.PI / 2), M.lime, x, WALL.top + 0.38 * s, z, par); return b; };
basket(-0.2, 2.9); basket(0.4, 3.25, 0.85); basket(-2.4, 2.7, 0.9);
const amph = new THREE.LatheGeometry([[0, 0], [0.08, 0.03], [0.21, 0.24], [0.24, 0.48], [0.16, 0.72], [0.07, 0.8], [0.06, 0.95], [0.09, 1.0], [0, 1.0]].map(([a, b]) => new THREE.Vector2(a, b)), 14);
[[-3.4, -2.6], [-3.0, -3.0], [-3.8, -3.1], [5.6, -2.9], [6.0, -3.2]].forEach(([x, z], i) => { const a = add(amph, M.terra, x, WALL.top, z, ROMAN); a.rotation.z = i === 2 ? 1.25 : 0; if (i === 2) a.position.y += 0.22; });
for (let i = 0; i < 4; i++) { const sk = add(new THREE.SphereGeometry(0.34, 12, 8), M.sail, 4.6 + (i % 2) * 0.55, WALL.top + 0.24, -2.6 + Math.floor(i / 2) * 0.6, ROMAN); sk.scale.set(1, 0.7, 0.8); }
// treadwheel crane (wheel + A-frame + jib + rope + hanging block)
const crane = group(13, WALL.top, -1.2, ROMAN);
{ const wheel = group(0, 2.3, 0, crane); add(new THREE.TorusGeometry(2.2, 0.1, 6, 36), M.wood, 0, 0, -0.45, wheel); add(new THREE.TorusGeometry(2.2, 0.1, 6, 36), M.wood, 0, 0, 0.45, wheel);
  for (let k = 0; k < 8; k++) { add(tbox(4.4, 0.1, 0.1, 1), M.wood, 0, 0, -0.45, wheel).rotation.z = k * Math.PI / 8; add(tbox(4.4, 0.1, 0.1, 1), M.wood, 0, 0, 0.45, wheel).rotation.z = k * Math.PI / 8; }
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; add(tbox(0.08, 0.08, 1.0, 1), M.woodDark, Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0, wheel); }
  crane.userData.wheel = wheel;
  for (const s of [-1, 1]) { const l = add(tbox(0.2, 5.6, 0.2, 2), M.woodDark, 0.4, 2.6, s * 0.75, crane); l.rotation.x = -s * 0.12; }
  const jib = add(tbox(0.22, 8.4, 0.22, 2), M.woodDark, 2.2, 5.2, 0, crane); jib.rotation.z = -0.62;
  add(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 5), M.rope, 4.65, 7.4 - 1.6 - 1.0, 0, crane);
  const blk = add(tbox(1.2, 0.8, 0.9, 1), M.ashlarW, 4.65, 4.1 - 1.4, 0, crane); crane.userData.block = blk; }
// scaffold ladder + timber stacks
for (let i = 0; i < 6; i++) add(tbox(3.2, 0.14, 0.32, 1), M.plank, -6 + (i % 3) * 0.1, WALL.top + 0.07 + Math.floor(i / 3) * 0.15, -2.6 + (i % 3) * 0.34, ROMAN);
// lime kiln on the shore, smoking
const kiln = group(-50, 3.2, -14, ROMAN); add(new THREE.CylinderGeometry(2.2, 2.8, 4.2, 14), M.ashlar, 0, 2.1, 0, kiln); add(new THREE.CylinderGeometry(1.3, 2.0, 1.4, 14), M.ashlar, 0, 4.9, 0, kiln);
add(new THREE.CircleGeometry(1.25, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.2, 0.4) }), 0, 5.61, 0, kiln, { cast: false }).userData.ndSkip = true;
// merchant ship moored alongside
const ship = group(-22, 0, -13, ROMAN); ship.rotation.y = 0.08;
{ const sh = new THREE.Shape(); sh.moveTo(-7, 0.8); sh.quadraticCurveTo(-6.2, -1.6, -3, -1.9); sh.lineTo(4, -1.9); sh.quadraticCurveTo(7, -1.5, 7.6, 1.6); sh.lineTo(-7.4, 1.6); sh.closePath();
  const hull = new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 3 }); hull.translate(0, 0, -1.7);
  add(hull, [M.plankV, M.hullRed], 0, 0.3, 0, ship); add(tbox(14, 0.15, 3.6, 1.5), M.plank, 0, 1.85, 0, ship);
  add(new THREE.CylinderGeometry(0.16, 0.2, 11, 8), M.woodDark, -0.6, 7, 0, ship); add(new THREE.CylinderGeometry(0.1, 0.1, 7.5, 8), M.woodDark, -0.6, 10.6, 0, ship).rotation.x = Math.PI / 2;
  const sail = add(new THREE.CylinderGeometry(0.5, 0.5, 7.2, 12, 1, false, 0, Math.PI), M.sail, -0.6, 10.1, 0, ship); sail.rotation.x = Math.PI / 2; sail.scale.set(1, 1, 0.55);
  add(new THREE.ConeGeometry(0.5, 1.6, 8), M.woodDark, 7.8, 2.4, 0, ship).rotation.z = -1.1; }
// ---------- shore (both eras): beach, cliffs, town, trees ----------
add(new THREE.PlaneGeometry(140, 420).rotateX(-Math.PI / 2), M.sand, -108, 0.15, 0, BOTH, { cast: false });
const shoreTop = add(tbox(110, 9, 420, 6), M.rock, -150, 1, 0, BOTH);
{ const g = new THREE.DodecahedronGeometry(1, 1), r = TX.rng(23); for (let i = 0; i < 42; i++) { const z = (r() - 0.5) * 300, x = -96 - r() * 18, s = 5 + r() * 9;
  const rk = add(g, M.rock, x, s * 0.4, z, BOTH); rk.scale.set(s, s * (0.8 + r() * 0.7), s * (0.8 + r() * 0.5)); rk.rotation.set(r(), r() * 3, r()); } }
const house = (x, z, w, d, h, ry, par = BOTH) => { const gg = group(x, 5.5, z, par); gg.rotation.y = ry; add(tbox(w, h, d, 2), Math.abs(x * z) % 2 > 1 ? M.plaster : M.plaster2, 0, h / 2, 0, gg);
  const rf = add(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.6, 2.2, 4), M.roof, 0, h + 1.1, 0, gg); rf.rotation.y = Math.PI / 4; rf.scale.set(w / Math.hypot(w, d) * 1.42, 1, d / Math.hypot(w, d) * 1.42);
  for (const s of [-1, 1]) add(tbox(0.7, 0.9, 0.1, 1), M.woodDark, s * w * 0.28, h * 0.6, d / 2 + 0.04, gg, { cast: false }); return gg; };
{ const r = TX.rng(31); for (let i = 0; i < 26; i++) house(-104 - r() * 40, -110 + i * 8.5 + r() * 3, 5 + r() * 4, 5 + r() * 3, 3.5 + r() * 4, r() * 0.5 - 0.25 + Math.PI / 2); }
{ const temple = group(-120, 5.5, 34, BOTH); add(tbox(14, 1.2, 9, 2), M.ashlarW, 0, 0.6, 0, temple); for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.45, 0.5, 6, 12), M.plaster, -5 + i * 2, 4.2, 4, temple);
  add(tbox(12, 6, 6, 2), M.plaster2, 0, 4.2, -1, temple); add(tbox(14, 1, 9.4, 2), M.ashlarW, 0, 7.6, 0, temple); const pd = add(new THREE.ConeGeometry(8.4, 2.6, 4), M.roof, 0, 9.4, 0, temple); pd.rotation.y = Math.PI / 4; pd.scale.set(1.1, 1, 0.72); }
const tree = (x, z, h, y = 5.5) => { const gg = group(x, y, z, BOTH); add(new THREE.CylinderGeometry(0.15, 0.22, 1.2, 6), M.woodDark, 0, 0.6, 0, gg); const c = add(new THREE.SphereGeometry(1, 10, 10), M.cypress, 0, h / 2 + 1, 0, gg); c.scale.set(0.95, h / 2, 0.95); };
{ const r = TX.rng(41); for (let i = 0; i < 40; i++) tree(-100 - r() * 50, -150 + r() * 300, 5 + r() * 5); }
// lighthouse on a rock island
const pharos = group(150, 0, -260, BOTH);
{ const isl = add(new THREE.DodecahedronGeometry(16, 1), M.rock, 0, -3, 0, pharos); isl.scale.set(1.6, 0.6, 1.2); add(tbox(12, 14, 12, 3), M.ashlarW, 0, 13, 0, pharos); add(tbox(8, 10, 8, 3), M.ashlarW, 0, 25, 0, pharos);
  add(new THREE.CylinderGeometry(3, 3.6, 8, 12), M.ashlarW, 0, 34, 0, pharos); const fire = add(new THREE.SphereGeometry(2.4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.2, 0.8) }), 0, 40, 0, pharos, { cast: false }); fire.userData.ndSkip = true; }

// ---------- modern era: crumbling concrete pier + vegetation + weathering ----------
const PZ = 18;
{ const r = TX.rng(51);
  for (let i = 0; i < 9; i++) { const x = -62 + i * 7, broken = i >= 5; const col = add(new THREE.CylinderGeometry(0.55, 0.6, 9, 12), M.modern, x, -1.8 - (broken ? r() * 1.5 : 0), PZ, MODERN);
    if (broken) { col.rotation.z = (r() - 0.5) * 0.35; col.rotation.x = (r() - 0.5) * 0.25; col.scale.y = 0.55 + r() * 0.3; } }
  for (let i = 0; i < 9; i++) { const x = -58.5 + i * 7, slab = add(tbox(6.8, 0.6, 6, 2), M.modern, x, 2.6, PZ, MODERN);
    if (i >= 5) { slab.position.y = 0.4 - r() * 1.0; slab.rotation.set((r() - 0.5) * 0.5, r() * 0.4, (i % 2 ? 1 : -1) * (0.25 + r() * 0.35)); }
    if (i === 4 || i >= 5) for (let k = 0; k < 7; k++) { const b = add(new THREE.CylinderGeometry(0.035, 0.035, 1.2 + r() * 1.4, 5), M.rust, 0, 0, 0, slab); b.position.set(3.4 + r() * 0.5, (r() - 0.5) * 0.4, (k - 3) * 0.8); b.rotation.z = Math.PI / 2 + (r() - 0.5) * 0.9; b.rotation.x = (r() - 0.5) * 0.6; } }
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) if (i < 6) { const p = add(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), M.rust, -61 + i * 7, 3.45, PZ + s * 2.8, MODERN); if (i >= 4) p.rotation.z = (r() - 0.5) * 1.2; }
  const chunk = new THREE.DodecahedronGeometry(1, 0); for (let i = 0; i < 26; i++) { const c = add(chunk, M.modern, -26 + r() * 22, -0.2 + r() * 0.5, PZ + (r() - 0.5) * 9, MODERN); c.scale.setScalar(0.4 + r() * 1.0); c.rotation.set(r() * 3, r() * 3, r() * 3); }
  // weathering on the Roman wall: algae band, barnacles, top vegetation
  const al = add(new THREE.PlaneGeometry(wallLen, 1.4), M.algae, (WALL.x0 + WALL.x1) / 2, 0.3, WALL.z + 0.02, MODERN, { cast: false });
  const al2 = al.clone(); al2.position.z = -WALL.z - 0.02; al2.rotation.y = Math.PI; MODERN.add(al2);
  const tuft = new THREE.ConeGeometry(0.12, 0.6, 5); tuft.translate(0, 0.3, 0); const im = new THREE.InstancedMesh(tuft, M.green, 900), m4 = new THREE.Matrix4();
  for (let i = 0; i < 900; i++) { const s = 0.6 + r(); m4.compose(new THREE.Vector3(WALL.x0 + r() * wallLen, WALL.top, (r() - 0.5) * (WALL.z * 2 - 0.6)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4)), new THREE.Vector3(s, s * (0.6 + r()), s)); im.setMatrixAt(i, m4); }
  im.userData.nd = ND_INST; MODERN.add(im); }

// ---------- the crack on the old wall face (+z side) ----------
const CRACK = { x: 6, y: 1.9 };
const crackCanvas = (seal) => { const [c, g] = TX.canvas(512, 1024), r = TX.rng(88); let x = 256, y = 40; const pts = [[x, y]]; while (y < 990) { x += (r() - 0.5) * 70; y += 40 + r() * 40; pts.push([x, y]); }
  const draw = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); };
  if (seal) { draw(30, '#f2eee2'); draw(14, '#ffffff'); for (let i = 0; i < 140; i++) { const p = pts[(r() * pts.length) | 0]; g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(p[0] + (r() - 0.5) * 34, p[1] + (r() - 0.5) * 40, 3 + r() * 5, 3 + r() * 5); } }
  else { draw(26, 'rgba(20,16,12,0.95)'); draw(9, '#050404'); for (let k = 0; k < 6; k++) { const p = pts[2 + k * 3]; g.lineWidth = 6; g.beginPath(); g.moveTo(...p); g.lineTo(p[0] + (r() - 0.5) * 140, p[1] + 40 + r() * 60); g.stroke(); } }
  return c; };
const crackMats = [false, true].map((s) => new THREE.MeshBasicMaterial({ map: TX.tex(crackCanvas(s)), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, fog: true }));
const crack = add(new THREE.PlaneGeometry(0.9, 1.8), crackMats[0], CRACK.x, CRACK.y, WALL.z + 0.012, MODERN, { cast: false, receive: false }); crack.userData.ndSkip = true;
const seal = add(new THREE.PlaneGeometry(0.9, 1.8), crackMats[1], CRACK.x, CRACK.y, WALL.z + 0.014, MODERN, { cast: false, receive: false }); seal.userData.ndSkip = true;
const wetStreak = add(new THREE.PlaneGeometry(0.22, 1.6), new THREE.MeshBasicMaterial({ color: '#2a3a40', transparent: true, opacity: 0.0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), CRACK.x + 0.02, CRACK.y - 0.2, WALL.z + 0.013, MODERN, { cast: false }); wetStreak.userData.ndSkip = true;

// ---------- cutaway: inside the crack (microscopic) ----------
const cutBack = add(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'varying vec3 vP; void main(){ vec3 c = mix(vec3(.02,.05,.07), vec3(.10,.24,.30), smoothstep(-.6,.9,vP.y)); gl_FragColor = vec4(c,1.); }' }), 0, 0, 0, CUT, { cast: false });
cutBack.userData.ndSkip = true;
const cutMat = texMat(TX.concrete(61, { clasts: 1.6, wet: true }), 1, 1);
const zig = (dx) => { const pts = []; const r = TX.rng(5); for (let i = 0; i <= 10; i++) pts.push([dx + (r() - 0.5) * 0.7 + (i % 2 ? 0.3 : -0.3), -4 + i * 0.8]); return pts; };
const half = (side) => { const sh = new THREE.Shape(), z = zig(side * 0.5), far = side * 7; sh.moveTo(far, -4); z.forEach(([x, y]) => sh.lineTo(x, y)); sh.lineTo(far, 4); sh.closePath(); if (side < 0) {}
  const g = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false }); g.translate(0, 0, -3); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.2, uv.getY(i) * 0.2); return add(g, cutMat, 0, 0, 0, CUT); };
const halfL = half(-1), halfR = half(1);
// lime clasts at the crack faces (dissolve) and new calcite crystals (grow)
const cl = (() => { const g = new THREE.IcosahedronGeometry(1, 2), mat = toon({ color: '#ffffff', emissive: '#fff4d8', emissiveIntensity: 0.35 }), im = new THREE.InstancedMesh(g, mat, 14), r = TX.rng(9), d = [];
  for (let i = 0; i < 14; i++) { const y = -3.4 + i * 0.5 + r() * 0.2, side = i % 2 ? 1 : -1, fx = zig(side * 0.5).reduce((a, p) => (Math.abs(p[1] - y) < Math.abs(a[1] - y) ? p : a))[0]; d.push({ x: fx + side * 0.05, y, z: (r() - 0.5) * 4.2, s: 0.3 + r() * 0.18 }); }
  im.userData.data = d; im.userData.nd = ND_INST; CUT.add(im); return im; })();
const cry = (() => { const g = new THREE.OctahedronGeometry(1, 0); g.scale(0.6, 1.6, 0.6); const mat = toon({ color: '#f4f8ff', emissive: '#bfe6ff', emissiveIntensity: 0.25 }), N = 420, im = new THREE.InstancedMesh(g, mat, N), r = TX.rng(19), d = [];
  for (let i = 0; i < N; i++) { const y = -3.9 + r() * 7.8, z = (r() - 0.5) * 5.6, side = r() < 0.5 ? -1 : 1, base = zig(side * 0.5).reduce((a, p) => (Math.abs(p[1] - y) < Math.abs(a[1] - y) ? p : a))[0];
    d.push({ x: base - side * 0.02, y, z, side, s: 0.06 + r() * 0.08, delay: r(), rot: r() * 6 }); }
  im.userData.data = d; im.userData.nd = ND_INST; CUT.add(im); return im; })();
const waterIn = (() => { const sh = new THREE.Shape(); const L = zig(-0.5), R = zig(0.5); sh.moveTo(...L[0]); L.forEach((p) => sh.lineTo(...p)); for (let i = R.length - 1; i >= 0; i--) sh.lineTo(...R[i]); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 5.4, bevelEnabled: false }); g.translate(0, 0, -2.7);
  const m = add(g, new THREE.MeshBasicMaterial({ color: '#4fb6e0', transparent: true, opacity: 0.55, depthWrite: false }), 0, 0, 0, CUT, { cast: false }); m.userData.ndSkip = true; return m; })();
const cutKey = new THREE.PointLight('#bfe8ff', 0, 30); cutKey.position.set(-3, 5, 6); CUT.add(cutKey);
const cutRim = new THREE.PointLight('#ffd9a0', 0, 30); cutRim.position.set(4, -2, -5); CUT.add(cutRim);

// ---------- per-frame state ----------
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
export const world = {
  WALL, TR, CRACK, PZ, CUT_ORIGIN: [0, -400, 0],
  update(S, t) {
    const old = S.era === 'modern';
    ROMAN.visible = !old; MODERN.visible = old; CUT.visible = !!S.cutaway;
    wallBody.material = old ? M.conOld : M.conFresh; coping.forEach((c) => (c.material = old ? M.conOld : M.ashlar));
    waterU.t.value = t; waterU.amp.value = S.waves ?? 1;
    crane.userData.wheel.rotation.z = -t * 0.35; crane.userData.block.position.y = 2.7 + Math.sin(t * 0.35) * 0.4;
    ship.position.y = Math.sin(t * 0.9) * 0.12; ship.rotation.z = Math.sin(t * 0.7) * 0.012;
    // lumps appear in the trough after the lime goes in
    const L = lumps.userData.data, lk = S.lumps || 0;
    L.forEach((d, i) => { const k = Math.max(0, Math.min(1, (lk - d.delay * 0.6) / 0.4)); e4.set(0, d.ry, 0); q4.setFromEuler(e4); m4.compose(v3.set(d.x, 0.52 + d.s * 0.2, d.z), q4, s3.set(d.s * k, d.s * k * 0.75, d.s * k)); lumps.setMatrixAt(i, m4); });
    lumps.instanceMatrix.needsUpdate = true;
    mix.position.y = 0.5 + Math.sin(t * 3) * 0.003;
    // crack on the old wall
    crack.visible = old && (S.crack || 0) > 0 && (S.seal || 0) < 1; crack.scale.set(1, Math.max(0.01, S.crack || 0), 1); crack.position.y = CRACK.y + (1 - (S.crack || 0)) * 0.9;
    seal.visible = old && (S.seal || 0) > 0; seal.material.opacity = S.seal || 0; crackMats[0].opacity = 1 - (S.seal || 0) * 0.85;
    wetStreak.material.opacity = (S.trickle || 0) * 0.6; wetStreak.scale.y = Math.max(0.01, S.trickle || 0); wetStreak.position.y = CRACK.y + 0.6 - (S.trickle || 0) * 0.8;
    // cutaway: water rises, clasts dissolve, crystals grow
    if (S.cutaway) { const c = S.cutaway; cutKey.intensity = 45; cutRim.intensity = 30;
      waterIn.scale.set(1, Math.max(0.01, c.water), 1); waterIn.position.y = -4 * (1 - c.water);
      cl.userData.data.forEach((d, i) => { const k = 1 - Math.min(1, Math.max(0, (c.dissolve - (i / 14) * 0.3) / 0.7)); m4.compose(v3.set(d.x, d.y, d.z), q4.identity(), s3.setScalar(d.s * Math.max(0.001, k))); cl.setMatrixAt(i, m4); });
      cl.material.emissiveIntensity = 0.15 + c.glow * 0.9; cl.instanceMatrix.needsUpdate = true;
      cry.userData.data.forEach((d, i) => { const k = Math.min(1, Math.max(0, (c.grow - d.delay * 0.7) / 0.3)); e4.set(0, d.rot, d.side * 1.2); q4.setFromEuler(e4);
        m4.compose(v3.set(d.x - d.side * k * 0.12, d.y, d.z), q4, s3.setScalar(d.s * Math.max(0.001, k) * (1 + c.grow * 0.6))); cry.setMatrixAt(i, m4); });
      cry.material.emissiveIntensity = 0.2 + c.glow * 0.6; cry.instanceMatrix.needsUpdate = true; }
    else { cutKey.intensity = cutRim.intensity = 0; }
  },
};

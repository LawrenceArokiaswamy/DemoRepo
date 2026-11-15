// STOCKHOLM HARBOUR, 1628 (original stylised layout, Episode 2 "Vasa"). Not a survey-accurate map: a readable stage for the story.
// World: the channel runs along x (the ship sails toward +x, out of the harbour); the old town, the royal castle and the quay
// are on the west (x < -110); rocky shores with houses line both sides (z < -95 north, z > 95 south). Calm Baltic water.
// Also holds the separate "rooms" the episode cuts to: the inquiry chamber (far east, on land) and the seabed under the channel.
import { THREE, scene, pbr } from '../stage.js';
import { makeOcean, makeSprayTexture } from '../fx/ocean.js';

export const ST = { crowds: [] };
const R = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
const add = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.geometry.setAttribute('uv2', m.geometry.attributes.uv); return add(m); };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });

// land height: water channel between |z| < 95 east of x = -110; land rises to low rocky hills
export function landH(x, z) {
  const nz = Math.abs(z) - 95, wx = -110 - x;   // >0 = on land
  const dLand = Math.max(nz, wx); if (dLand < -6) return -8;
  const n = Math.sin(x * 0.045 + z * 0.02) * 3 + Math.sin(x * 0.11 - z * 0.07) * 1.6 + Math.sin(x * 0.023 + 1.3) * 5;
  return -2 + Math.min(1, Math.max(0, (dLand + 6) / 14)) * (4 + Math.max(0, n + 5) * 1.1 + Math.max(0, dLand) * 0.05);
}
export async function build() {
  scene.fog = new THREE.Fog('#d8e4f2', 90, 420); ST.fog = scene.fog;
  const sun = new THREE.DirectionalLight('#fff0d8', 3.2); sun.position.set(-60, 80, -60); sun.target.position.set(0, 0, 0); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 400 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target); ST.sun = sun; ST.hemi = new THREE.HemisphereLight('#a9c3e8', '#6b5a48', 0.6); scene.add(ST.hemi);
  // ---- sea (calm, Baltic green-blue)
  ST.sea = makeOcean(THREE, scene, { center: [0, 0], near: 280, seg: 300, color: '#2b5e6e', deep: '#12313b', waves: [[1, 0.3, 0.06, 13], [0.4, 1, 0.05, 8], [-0.6, 0.7, 0.04, 4.6], [0.9, -0.3, 0.03, 2.7]], amp: 1, detail: 0.3 });
  ST.spray = makeSprayTexture(THREE);
  // ---- land: one displaced grid around the channel, vertex-coloured (rock at the shore, green above)
  const G = new THREE.PlaneGeometry(1400, 900, 280, 180); G.rotateX(-Math.PI / 2); const pos = G.attributes.position, col = [];
  const rock = new THREE.Color('#8b8478'), grass = new THREE.Color('#6f8a4c'), dark = new THREE.Color('#556b3c');
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), h = landH(x, z); pos.setY(i, h); const c = h < 2.5 ? rock.clone() : grass.clone().lerp(dark, R(i, 3) * 0.5); col.push(c.r, c.g, c.b); }
  G.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); G.computeVertexNormals();
  ST.land = add(new THREE.Mesh(G, std('#ffffff', { vertexColors: true })), false);
  // ---- town: gabled houses (ochre, red, white plaster), two church spires, the royal castle with its tower (stylised)
  const walls = ['#e2c48f', '#c9644a', '#efe6d6', '#d9a066', '#b85a3c', '#e8d9b8'].map((c) => std(c)), roofM = std('#7a3b2a'), roofD = std('#4a4440');
  const house = (x, z, w, d, h, ry, i) => { const y = landH(x, z); if (y < 0.5) return; const hb = box(w, h, d, walls[i % walls.length], x, y + h / 2, z, ry);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, d, 4, 1), i % 4 === 0 ? roofD : roofM); rf.rotation.set(Math.PI / 2, 0, Math.PI / 4); const g = new THREE.Group(); g.add(rf); g.scale.set(1, 1, 1);
    const r2 = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, h * 0.55, 4), i % 4 === 0 ? roofD : roofM); r2.position.set(x, y + h + h * 0.27, z); r2.rotation.y = ry + Math.PI / 4; r2.scale.set(1, 1, d / w); add(r2); };
  let n = 0;
  for (let i = 0; i < 160; i++) { const x = -150 - R(i, 1) * 160, z = -110 + R(i, 2) * 220; house(x, z, 6 + R(i, 3) * 6, 6 + R(i, 4) * 5, 6 + R(i, 5) * 8, R(i, 6) * 0.3, n++); }   // old town (west)
  for (let i = 0; i < 70; i++) { const x = -100 + R(i, 7) * 380, z = -112 - R(i, 8) * 70; house(x, z, 5 + R(i, 9) * 4, 5 + R(i, 10) * 4, 4 + R(i, 11) * 4, R(i, 12), n++); }   // north shore
  for (let i = 0; i < 70; i++) { const x = -100 + R(i, 13) * 380, z = 112 + R(i, 14) * 70; house(x, z, 5 + R(i, 15) * 4, 5 + R(i, 16) * 4, 4 + R(i, 17) * 4, R(i, 18), n++); }   // south shore
  const spire = (x, z, h) => { const y = landH(x, z); box(7, h, 7, walls[2], x, y + h / 2, z); const c = new THREE.Mesh(new THREE.ConeGeometry(4.6, h * 0.9, 8), std('#3f5a4c')); c.position.set(x, y + h + h * 0.45, z); add(c); };
  spire(-165, -40, 26); spire(-200, 45, 22); spire(60, -150, 18);
  { const x = -150, z = -70, y = landH(x, z); box(70, 22, 40, walls[2], x, y + 11, z); box(16, 52, 16, walls[2], x + 18, y + 26, z + 6);   // castle + tower
    const c = new THREE.Mesh(new THREE.ConeGeometry(10, 26, 8), std('#3f5a4c')); c.position.set(x + 18, y + 65, z + 6); add(c);
    for (let k = 0; k < 3; k++) { const crown = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.45, 8, 16), std('#d9a93a', { metalness: 0.3, roughness: 0.4 })); crown.position.set(x + 18, y + 80 + k * 3.2, z + 6); crown.rotation.x = Math.PI / 2; add(crown); }
    ST.palace = new THREE.Vector3(x + 18, y + 60, z + 6); }
  // ---- the quay where Vasa is fitted out (wooden pier on the west shore, ship moored alongside its south face)
  const planks = pbr('wood_planks', [6, 30], { roughness: 0.85, color: '#c7a57a' });
  ST.quay = { x0: -112, x1: -40, z: -11.5, y: 2.2 };
  box(ST.quay.x1 - ST.quay.x0, 0.6, 8, planks, (ST.quay.x0 + ST.quay.x1) / 2, ST.quay.y - 0.3, ST.quay.z - 4);
  for (let x = ST.quay.x0; x <= ST.quay.x1; x += 4) for (const dz of [-0.2, -7.8]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 8), std('#5a3e28')); p.position.set(x, -2.4, ST.quay.z + dz); add(p); }
  for (let x = ST.quay.x0 + 6; x < ST.quay.x1; x += 9) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 10), std('#4a3426')); b.position.set(x, ST.quay.y + 0.45, ST.quay.z - 0.8); add(b); }
  // ---- crowds: instanced townsfolk (body + head), read as a crowd at distance
  ST.addCrowd = (pts, seed = 1) => { const N = pts.length, body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 0.75, 4, 8), std('#ffffff'), N), head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.25, 10, 8), std('#ffffff'), N);
    const cols = ['#3a4a6a', '#7a3b2a', '#5a5a3a', '#2a2622', '#8a6a3a', '#a8322a', '#e6dcc3'].map((c) => new THREE.Color(c)), skin = ['#f0b88f', '#d39672', '#e8b48a'].map((c) => new THREE.Color(c)), m = new THREE.Matrix4();
    pts.forEach((p, i) => { const s = 0.9 + R(i, seed) * 0.25; m.makeScale(s, s, s).setPosition(p[0], p[1] + 0.68 * s, p[2]); body.setMatrixAt(i, m); body.setColorAt(i, cols[Math.floor(R(i, seed + 1) * cols.length)]);
      m.makeScale(s, s, s).setPosition(p[0], p[1] + 1.48 * s, p[2]); head.setMatrixAt(i, m); head.setColorAt(i, skin[Math.floor(R(i, seed + 2) * 3)]); });
    body.castShadow = head.castShadow = true; scene.add(body, head); const c = { body, head, pts }; ST.crowds.push(c); return c; };
  const qp = []; for (let i = 0; i < 160; i++) { const x = ST.quay.x0 - 3 - R(i, 21) * 14, z = ST.quay.z - 2 - R(i, 22) * 22; qp.push([x, Math.max(ST.quay.y, landH(x, z)), z]); } ST.quayCrowd = ST.addCrowd(qp, 3);
  const sp = []; for (let i = 0; i < 260; i++) { const x = -40 + R(i, 31) * 140, z = 97 + R(i, 32) * 10; if (Math.abs(x - 38) < 12) continue; sp.push([x, Math.max(0.3, landH(x, z)), z]); } ST.shoreCrowd = ST.addCrowd(sp, 7);
  // ---- seabed under the channel (32 m) for the underwater shots; hidden from above by the sea
  ST.seabed = add(new THREE.Mesh(new THREE.PlaneGeometry(220, 160, 60, 40).rotateX(-Math.PI / 2), std('#4c4a3a')), false); ST.seabed.position.set(40, -32, 0);
  { const p = ST.seabed.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) * 0.3) * 0.4 + Math.cos(p.getZ(i) * 0.21) * 0.5); ST.seabed.geometry.computeVertexNormals(); }
  // ---- the inquiry chamber (far east, a closed room): panelled walls, table, chairs, a royal portrait (original stylised painting)
  const IX = 900, IZ = 0; ST.room = { x: IX, z: IZ, y: 30 };
  const wall = std('#6b4a32'), floor = pbr('dark_planks', [4, 4], { roughness: 0.8 }), plaster = std('#d8c9a8');
  box(14, 0.3, 12, floor, IX, ST.room.y - 0.15, IZ); box(14, 6, 0.3, plaster, IX, ST.room.y + 3, IZ - 6); box(14, 6, 0.3, plaster, IX, ST.room.y + 3, IZ + 6); box(0.3, 6, 12, plaster, IX - 7, ST.room.y + 3, IZ); box(0.3, 6, 12, plaster, IX + 7, ST.room.y + 3, IZ); box(14, 0.3, 12, std('#3a2a1e'), IX, ST.room.y + 6, IZ);
  box(14, 1.4, 0.35, wall, IX, ST.room.y + 0.7, IZ - 5.85); box(0.35, 1.4, 12, wall, IX - 6.85, ST.room.y + 0.7, IZ);
  box(4.2, 0.12, 1.6, wall, IX, ST.room.y + 0.82, IZ - 1.2); for (const [dx, dz] of [[-1.9, -0.5], [1.9, -0.5], [-1.9, -1.9], [1.9, -1.9]]) box(0.12, 0.8, 0.12, wall, IX + dx, ST.room.y + 0.4, IZ - 1.2 + dz + 0.7);
  ST.chair = new THREE.Group(); { const s = box(0.6, 0.08, 0.6, wall, 0, 0.5, 0); const b = box(0.6, 0.9, 0.08, wall, 0, 0.95, -0.28); const legs = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([a, c]) => box(0.07, 0.5, 0.07, wall, a, 0.25, c)); for (const m of [s, b, ...legs]) { scene.remove(m); ST.chair.add(m); } }
  ST.chair.position.set(IX + 0.0, ST.room.y, IZ + 0.15); ST.chair.rotation.y = 0; scene.add(ST.chair);
  { const c = document.createElement('canvas'); c.width = 384; c.height = 512; const g = c.getContext('2d');   // portrait: a crowned royal figure (stylised, not a likeness)
    g.fillStyle = '#3a2c22'; g.fillRect(0, 0, 384, 512); g.fillStyle = '#5b4632'; g.fillRect(20, 20, 344, 472); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#6a7a94'); gr.addColorStop(1, '#3a4256'); g.fillStyle = gr; g.fillRect(34, 34, 316, 444);
    g.fillStyle = '#1d2a4a'; g.beginPath(); g.ellipse(192, 470, 150, 190, 0, Math.PI, 0); g.fill(); g.fillStyle = '#f0c8a0'; g.beginPath(); g.ellipse(192, 230, 70, 86, 0, 0, 7); g.fill();
    g.fillStyle = '#d9a93a'; g.beginPath(); g.moveTo(126, 160); for (const [x, y] of [[140, 110], [162, 150], [192, 96], [222, 150], [244, 110], [258, 160]]) g.lineTo(x, y); g.closePath(); g.fill();
    g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(192, 300, 40, 30, 0, 0, Math.PI); g.fill(); g.strokeStyle = '#2a1b17'; g.lineWidth = 6; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(192 + s * 30, 222); g.lineTo(192 + s * 30, 226); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; ST.portrait = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); ST.portrait.position.set(IX, ST.room.y + 3.4, IZ - 5.8); scene.add(ST.portrait); }
  ST.roomLight = new THREE.PointLight('#ffcf8a', 0, 30, 1.2); ST.roomLight.position.set(IX + 2, ST.room.y + 4.8, IZ + 2); scene.add(ST.roomLight);
  return ST;
}

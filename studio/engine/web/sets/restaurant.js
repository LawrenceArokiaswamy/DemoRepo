// RESTAURANT INTERIOR (original layout; Episode 3 benchmark "What if everyone could see your internet history?").
// An evening bistro: warm pendant lamps over round tables, green patterned wallpaper over dark wood panelling, velvet booths,
// a backlit bar, tall arched windows onto a night city. World: floor y = 0, room x -8..8, z -10..5 (back wall with windows at z = -10).
// Exposes the table list (for staging diners), the couple's table (TABLE0), pendant and phone light helpers.
import { THREE, scene, loadModel } from '../stage.js';
import * as P from '../style/painted.js';
export const RS = { tables: [], lamps: [] };
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const kit = (t) => { t.userData.painted = true; return t; };
const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; return add(m); };
const cyl = (r0, r1, h, mat, x, y, z, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); return add(m); };
export async function build() {
  P.initPainted(THREE);
  scene.fog = new THREE.Fog('#2a1f2a', 14, 42); RS.fog = scene.fog;
  // ---- lights: cool moonlight through the windows (shadow-casting key the style re-aims), warm hemisphere, warm pendants
  const key = new THREE.DirectionalLight('#9fb6ff', 1.0); key.position.set(2, 8, -20); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03; scene.add(key, key.target); RS.key = key;
  RS.hemi = new THREE.HemisphereLight('#ffd9a8', '#3a2a22', 0.45); scene.add(RS.hemi);
  // ---- floor, walls, ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 15), std({ map: kit(P.woodFloor([5, 5])) })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -2.5); add(floor, false);
  const wp = std({ map: kit(P.wallpaper('#2f5a52', '#6e9c84', [8, 2])) }), pan = std({ map: kit(P.panels('#5a3424', [10, 1])) }), dark = std({ color: '#3a2218' }), brass = std({ color: '#c9a04a', metalness: 0.3, roughness: 0.45 });
  const wall = (w, x, z, ry) => { const g = new THREE.Group(); const up = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.1), wp); up.position.y = 1.15 + 1.55; const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.15), pan); lo.position.y = 0.575;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.08), dark); rail.position.set(0, 1.17, 0.04); for (const m of [up, lo, rail]) { m.receiveShadow = true; g.add(m); } g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; };
  wall(16, 0, -10, 0); wall(15, -8, -2.5, Math.PI / 2); wall(15, 8, -2.5, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 15), std({ color: '#2a1a14' })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.25, -2.5); add(ceil, false);
  for (let z = -9; z <= 4; z += 2.2) box(16, 0.22, 0.3, dark, 0, 4.1, z);
  // ---- arched windows onto the night city (backdrop behind the wall openings) with dark mullions and brass sills
  const city = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), new THREE.MeshBasicMaterial({ map: P.nightCity() })); city.position.set(0, 3.6, -11.5); city.userData.keepMaterial = true; scene.add(city);
  for (const x of [-4.6, 0, 4.6]) { const sh = new THREE.Shape(); sh.moveTo(-1.1, 0); sh.lineTo(1.1, 0); sh.lineTo(1.1, 2.0); sh.absarc(0, 2.0, 1.1, 0, Math.PI, false); sh.lineTo(-1.1, 0);
    for (const dx of [-0.37, 0.37]) box(0.06, 3.0, 0.08, dark, x + dx, 2.7, -9.95); box(2.2, 0.06, 0.08, dark, x, 2.4, -9.95); box(2.5, 0.08, 0.3, brass, x, 1.2, -9.85); }
  // cut the wall where the windows are: simplest is to rebuild the back wallpaper as segments between the windows
  scene.children.filter((o) => o.isGroup && Math.abs(o.position.z + 10) < 0.01).forEach((g) => { g.children[0].visible = false; });
  for (const [x0, x1] of [[-8, -5.7], [-3.5, -1.1], [1.1, 3.5], [5.7, 8]]) { const w = x1 - x0; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.1), wp); m.position.set((x0 + x1) / 2, 2.7, -10); m.receiveShadow = true; scene.add(m); }
  // ---- velvet booths along the left wall, framed paintings, brass sconces with glow
  const vel = std({ map: kit(P.velvet('#7a1f2a', [3, 1])) });
  for (const z of [-8, -5.2, -2.4, 0.4]) { box(1.0, 0.45, 2.2, vel, -7.4, 0.42, z); box(0.25, 1.0, 2.2, vel, -7.85, 0.95, z); }
  const glowW = P.glow('255,190,110');
  const sconce = (x, y, z, ry) => { const s = cyl(0.07, 0.12, 0.2, brass, x, y, z, 12); const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowW, color: '#ffc27a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); g.position.set(x + Math.sin(ry) * 0.12, y + 0.12, z + Math.cos(ry) * 0.12); g.scale.set(0.9, 0.9, 1); g.userData.keepMaterial = true; scene.add(g); };
  for (const [z, k] of [[-6.6, 1], [-3.8, 2], [-1.0, 3]]) { const pnt = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), std({ map: kit(P.painting(k)) })); pnt.position.set(-7.97, 2.35, z); pnt.rotation.y = Math.PI / 2; scene.add(pnt);
    const fr = box(0.05, 0.9, 1.15, brass, -7.99, 2.35, z); sconce(-7.9, 1.75, z + 0.85, Math.PI / 2); }
  for (const x of [-6.5, -2.3, 2.3, 6.5]) sconce(x, 2.6, -9.9, 0);
  // ---- the bar along the right wall: counter, brass rail, backlit shelves of coloured bottles, stools
  box(0.9, 1.1, 8, std({ map: kit(P.panels('#4a2a1c', [6, 1])) }), 6.9, 0.55, -4.5); box(1.1, 0.08, 8.2, std({ color: '#1e120c', roughness: 0.4 }), 6.85, 1.14, -4.5);
  { const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.8), new THREE.MeshBasicMaterial({ color: '#ffcf8a' })); back.position.set(7.96, 2.2, -4.5); back.rotation.y = -Math.PI / 2; back.userData.keepMaterial = true; scene.add(back);
    const cols = ['#2f7a4a', '#a8322a', '#d9a93a', '#6a3a8a', '#3a6aa8', '#c96a2a']; for (const y of [1.6, 2.35]) { box(0.35, 0.05, 8, dark, 7.8, y - 0.05, -4.5);
      for (let i = 0; i < 26; i++) { const b = cyl(0.045, 0.05, 0.28 + (i % 3) * 0.05, std({ color: cols[i % 6], roughness: 0.25, transparent: true, opacity: 0.85 }), 7.78, y + 0.16, -8.2 + i * 0.29, 10); b.castShadow = false; } } }
  for (const z of [-7.5, -5.5, -3.5, -1.5]) { cyl(0.2, 0.2, 0.07, dark, 6.1, 0.78, z); cyl(0.03, 0.03, 0.75, brass, 6.1, 0.38, z, 8); }
  // ---- round tables with linen cloths, bentwood chairs, a candle, glasses; diners are staged by the story
  const cloth = std({ map: kit(P.linen()) }), wood = std({ color: '#4a2c1e' });
  const FS = 0.82;   // furniture scaled to the C+ cartoon proportions (seat 0.38 m, table top 0.62 m)
  // angles: chair positions around the table (table-local radians, 0 = +x)
  const table = (x, z, rot = 0, angles = [Math.PI, 0]) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(FS); scene.add(g);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 40), cloth); top.position.y = 0.76; const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.68, 0.32, 40, 1, true), cloth); drape.position.y = 0.6;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 0.6, 16), wood); leg.position.y = 0.3;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12), std({ color: '#f4ecd8' })); candle.position.set(0, 0.84, 0.05); const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16), brass); holder.position.set(0, 0.79, 0.05);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowW, color: '#ffb24a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); flame.scale.set(0.22, 0.3, 1); flame.position.set(0, 0.95, 0.05); flame.userData.keepMaterial = true;
    const glass = std({ color: '#cfe6f0', transparent: true, opacity: 0.45, roughness: 0.1 }), plate = std({ color: '#f7f2ea' });
    for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.015, 24), plate); pl.position.set(s * 0.32, 0.785, 0); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.14, 12), glass); gl.position.set(s * 0.3, 0.85, -0.22); g.add(pl, gl); }
    for (const m of [top, drape, leg, candle, holder]) { m.castShadow = m.receiveShadow = true; g.add(m); } g.add(flame);
    const chairs = []; for (const ang of angles) { const s = 1; const c = new THREE.Group(); const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20), wood); seat.position.y = 0.46; c.add(seat);
      for (const [lx, lz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.46, 8), wood); l.position.set(lx, 0.23, lz); c.add(l); }
      const back = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 20, Math.PI), wood); back.position.set(0, 0.75, 0.2); c.add(back); for (const bx of [-0.2, 0.2]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), wood); p2.position.set(bx, 0.6, 0.2); c.add(p2); }
      c.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); c.position.set(Math.cos(ang) * 0.95, 0, Math.sin(ang) * 0.95); c.rotation.y = Math.PI / 2 - ang; g.add(c); chairs.push(c); }
    const T = { g, x, z, rot, chairs, top: 0.78 * FS, seatY: 0.485 * FS, seat: (s) => new THREE.Vector3(Math.cos(angles[s > 0 ? 1 : 0]) * 0.95 * FS, 0, Math.sin(angles[s > 0 ? 1 : 0]) * 0.95 * FS).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).add(new THREE.Vector3(x, 0, z)) }; RS.tables.push(T); return T; };
  RS.TABLE0 = table(0.4, -3.0, 2.29, [1.22, 0]);   // the couple: adjacent seats (70° apart) so both faces read in a vertical frame
  for (const [x, z, r] of [[-3.6, -5.6, 0.4], [3.6, -6.2, -0.3], [-4.4, -1.2, 0.1], [3.8, -1.8, 0.6], [-1.9, -7.6, 0.2], [1.8, -8.3, -0.2], [-2.0, 1.6, 0.3]]) table(x, z, r);
  // ---- pendant lamps: brass shades with warm bulbs + glow halos; real point lights over the important tables
  const pendant = (x, z, h = 2.35, light = false, I = 3.2) => { const cord = cyl(0.008, 0.008, 4.25 - h, dark, x, h + (4.25 - h) / 2, z, 6); const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 24, 1, true), brass); shade.position.set(x, h, z); shade.material.side = THREE.DoubleSide; add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff1c8' })); bulb.position.set(x, h - 0.12, z); bulb.userData.keepMaterial = true; scene.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowW, color: '#ffcf8a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); halo.scale.set(1.3, 1.3, 1); halo.position.set(x, h - 0.15, z); halo.userData.keepMaterial = true; scene.add(halo);
    if (light) { const L = new THREE.PointLight('#ffc78a', I, 7, 1.6); L.position.set(x, h - 0.2, z); scene.add(L); RS.lamps.push(L); } };
  pendant(RS.TABLE0.x, RS.TABLE0.z, 2.3, true, 3.6); for (const T of RS.tables.slice(1)) pendant(T.x, T.z, 2.4, T.z > -7, 1.6);
  // ---- plants (pots + clustered leaves) in corners and by the windows
  const leaf = std({ color: '#3f6b3a' }), leaf2 = std({ color: '#557f42' }), pot = std({ color: '#a8583a' });
  for (const [x, z, s] of [[-7.2, -9.3, 1.3], [7.2, -9.3, 1.2], [-2.3, -9.5, 0.9], [2.3, -9.5, 0.9], [-7.3, 3.8, 1.1]]) { cyl(0.22 * s, 0.17 * s, 0.45 * s, pot, x, 0.22 * s, z);
    for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 10, 8), i % 2 ? leaf : leaf2); const a = i * 2.4; l.scale.set(0.45, 1.5, 0.3); l.position.set(x + Math.cos(a) * 0.18 * s, (0.6 + (i % 5) * 0.18) * s, z + Math.sin(a) * 0.18 * s); l.rotation.set(Math.sin(a) * 0.7, a, Math.cos(a) * 0.7); add(l); } }
  RS.glowTex = glowW; RS.phoneGlow = P.glow('140,190,255');
  return RS;
}

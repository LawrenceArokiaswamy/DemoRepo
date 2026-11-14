// SYRACUSE SEA WALL, 213 BC (original layout; stylised reconstruction). The Achradina wall "reaches down to the very
// edge of the sea" (Polybius 8.3). World: wall face along x at z = 0, sea toward +z, city toward -z. Sun rises over the sea.
// The claw machine's exact form is NOT documented: beam + chain + iron hand + lever follow Polybius 8.6; the counterweight,
// windlass and dimensions are our reconstruction.
import { THREE, scene, renderer, loadModel, pbr } from '../stage.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { makeOcean, makeSprayTexture } from '../fx/ocean.js';
import { buildWarship } from '../props/warship.js';

export const SY = { wallTop: 13, wallZ: 0 };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; m.geometry.setAttribute('uv2', m.geometry.attributes.uv); scene.add(m); return m; };
async function put(id, x, y, z, { ry = 0, h = null, s = 1 } = {}) { const m = await loadModel(id); m.rotation.y = ry; const b = new THREE.Box3().setFromObject(m), size = b.getSize(new THREE.Vector3());
  m.scale.setScalar(h ? h / size.y : s); const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3()); m.position.set(x - c.x, y - b2.min.y, z - c.z); scene.add(m); return m; }

function sunDirOfHDR(tex) {   // brightest texel of an equirect HDR -> direction (three.js equirect convention)
  const { data, width: w, height: h } = tex.image; let best = -1, bi = 0; const half = data instanceof Uint16Array, f = half ? THREE.DataUtils.fromHalfFloat : (x) => x;
  for (let i = 0; i < w * h; i += 3) { const l = f(data[i * 4]) + f(data[i * 4 + 1]) + f(data[i * 4 + 2]); if (l > best) { best = l; bi = i; } }
  const u = (bi % w + 0.5) / w, v = (Math.floor(bi / w) + 0.5) / h, phi = (u - 0.5) * 2 * Math.PI, theta = v * Math.PI;   // three: x = -cos(phi) sin? use lookup below
  return { u, v, elev: (0.5 - v) * Math.PI, azim: phi };
}

export async function build() {
  // ---- sky + image-based light (dawn); rotate the sky so its sun sits at the requested azimuth (over the sea, +z)
  const hdr = await new RGBELoader().loadAsync('./assets/hdri/qwantani_sunrise_puresky_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const sd = sunDirOfHDR(hdr); SY.hdrSun = sd;
  // in three.js equirect, texture u=0.5 looks along -z; u increases toward +x... rotate so the sun azimuth faces +z (sea) slightly to +x
  // three.js r160 has no backgroundRotation, so rotate the photo itself: roll its columns until the sun sits at the wanted azimuth
  // (three's equirect lookup: u = atan(dir.z, dir.x) / 2pi + 0.5)
  const want = Math.PI * 0.08, uWant = (Math.PI / 2 - want) / (2 * Math.PI) + 0.5, { data, width: w, height: h } = hdr.image, k = Math.round((uWant - sd.u) * w), src = data.slice();
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const si = (r * w + c) * 4, di = (r * w + (((c + k) % w) + w) % w) * 4; data[di] = src[si]; data[di + 1] = src[si + 1]; data[di + 2] = src[si + 2]; data[di + 3] = src[si + 3]; }
  hdr.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; pm.dispose(); scene.background = hdr;
  scene.environmentIntensity = 0.6; scene.backgroundIntensity = 0.9; scene.fog = new THREE.Fog('#c9b8a8', 60, 420); SY.fog = scene.fog;
  // sun: matched to the sky's sun direction (low over the sea)
  const el = Math.max(0.04, sd.elev), az = want; const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize(); SY.sunDir = sunDir;
  const sun = new THREE.DirectionalLight('#ffc89a', 3.2); sun.position.copy(sunDir).multiplyScalar(120).add(new THREE.Vector3(0, 0, 20)); sun.target.position.set(0, 6, 20);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 40, bottom: -40, near: 10, far: 300 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target); SY.sun = sun;
  SY.hemi = new THREE.HemisphereLight('#a9bcdc', '#6a5a4a', 0.5); scene.add(SY.hemi);
  // ---- sea
  SY.sea = makeOcean(THREE, scene, { center: [0, 34], near: 150, seg: 300, color: '#22566a', deep: '#0c2633', waves: [[0.15, 1, 0.12, 16], [-0.5, 0.8, 0.1, 9], [0.7, 0.6, 0.08, 5], [-0.2, -1, 0.05, 3.1]], amp: 1, detail: 0.26 });
  // ---- shore rocks at the foot of the wall
  const rocks = []; for (const [id, x, z, s, ry] of [['coast_rocks_01', -30, 3, 0.32, 0.4], ['coast_rocks_02', 22, 4, 0.3, 2.0], ['coast_rocks_01', 62, 2, 0.3, 1.2], ['coast_rocks_02', -70, 3, 0.34, 3]])
    rocks.push(await put(id, x, -1.6, z, { s, ry }));
  const rockM = pbr('rock_face_02', [6, 2], { roughness: 0.95, color: '#8a7c6c' }); box(240, 3.2, 5, rockM, 0, 0.1, 1.2);   // rocky ledge the wall stands on
  // ---- the wall (ashlar), towers, battlements, loopholes, walkway
  const T = SY.wallTop, stone = (rx, ry) => pbr('castle_wall_varriation', [rx, ry], { roughness: 0.92, color: '#e6d6bf' });
  box(240, T + 1.5, 6, stone(40, 3.2), 0, (T + 1.5) / 2 - 1.5, -3);
  for (let x = -117; x <= 117; x += 3.0) box(1.3, 1.6, 1.0, stone(0.33, 0.4), x, T + 0.8, -0.5);                    // merlons
  const slit = new THREE.MeshStandardMaterial({ color: '#0d0b09', roughness: 1 }); for (let x = -60; x <= 60; x += 3.2) { if (Math.abs(x) < 2) continue; box(0.22, 1.7, 0.1, slit, x, T - 3.2, 0.01); }   // loopholes (Polybius 8.5)
  for (const x of [-34, 36, -86, 88]) { box(10, T + 7, 10, stone(2.6, 4), x, (T + 7) / 2 - 1.5, -2.4); for (let k = -4; k <= 4; k += 2) for (const [dx, dz] of [[k, 2.4 + 2.4], [k, -7.2]]) box(1.2, 1.5, 1, stone(0.3, 0.4), x + dx, T + 6.2, dz - 2.4); }
  box(240, 0.3, 4.5, pbr('dark_planks', [60, 1], { roughness: 0.85 }), 0, T + 0.05, -3.4);                           // walkway
  // ---- the city of Syracuse behind the wall (Achradina): plateau, whitewashed houses with terracotta roofs, a temple, trees
  const land = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), pbr('gravelly_sand', [60, 60], { roughness: 1, color: '#b8a48a' })); land.rotation.x = -Math.PI / 2; land.position.set(0, T - 0.35, -206); land.receiveShadow = true; land.geometry.setAttribute('uv2', land.geometry.attributes.uv); scene.add(land);
  const plaster = pbr('plastered_wall', [1, 1], { roughness: 0.95, color: '#efe6d6' }), roofM = new THREE.MeshStandardMaterial({ color: '#b5583a', roughness: 0.85 }), r2 = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 90; i++) { const x = -110 + r2(i, 1) * 220, z = -12 - r2(i, 2) * 150; if (Math.abs(x + 25) < 12 && Math.abs(z + 48) < 12) continue; const w = 4 + r2(i, 3) * 6, d = 4 + r2(i, 4) * 6, hgt = 3 + r2(i, 5) * 4, ry = (r2(i, 6) - 0.5) * 0.3;
    const hb = box(w, hgt, d, plaster, x, T - 0.35 + hgt / 2, z, ry); const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.02, 1.6 + r2(i, 7), 4), roofM); rf.position.set(x, T - 0.35 + hgt + 0.8, z); rf.rotation.y = Math.PI / 4 + ry; rf.scale.set(w / Math.hypot(w, d) * 1.41, 1, d / Math.hypot(w, d) * 1.41); rf.castShadow = true; scene.add(rf); }
  const marble = new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 0.55 }); const TX = -25, TZ = -48, TY = T - 0.35;
  box(16, 1.4, 26, marble, TX, TY + 0.7, TZ); box(13, 6.2, 22, plaster, TX, TY + 4.5, TZ);
  for (let i = 0; i < 6; i++) for (const zz of [-12, 12]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 7, 16), marble); c.position.set(TX - 6.2 + i * 2.48, TY + 4.9, TZ + zz); c.castShadow = true; scene.add(c); }
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.2, 26.5, 3, 1), roofM); ped.rotation.set(Math.PI / 2, 0, Math.PI / 2); ped.scale.set(0.42, 1, 1); ped.position.set(TX, TY + 9.6, TZ); ped.castShadow = true; scene.add(ped);
  const leaf = new THREE.MeshStandardMaterial({ color: '#4a5e34', roughness: 0.9 }); for (let i = 0; i < 40; i++) { const x = -100 + r2(i, 9) * 200, z = -14 - r2(i, 10) * 120, cy = new THREE.Mesh(new THREE.ConeGeometry(0.9, 6 + r2(i, 11) * 3, 8), leaf); cy.position.set(x, T - 0.35 + 3.5, z); cy.castShadow = true; scene.add(cy); }
  // ---- weathering: wet algae line where the sea washes the wall, surf foam along the rocks
  const wetM = new THREE.MeshStandardMaterial({ color: '#2f3a2c', roughness: 0.3, metalness: 0.05 }); box(240, 1.0, 0.1, wetM, 0, 2.2, 0.05); box(240, 0.25, 5.1, wetM, 0, 1.68, 1.2);
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 64; const fg2 = fc.getContext('2d'); for (let i = 0; i < 1600; i++) { const x = Math.random() * 512, y = Math.random() * 64, r = 1 + Math.random() * 5; fg2.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.5 * (1 - y / 64)})`; fg2.beginPath(); fg2.arc(x, y, r, 0, 7); fg2.fill(); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = THREE.RepeatWrapping; ft.repeat.set(30, 1); SY.surf = new THREE.Mesh(new THREE.PlaneGeometry(240, 3.2), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, opacity: 0.8, color: '#f0f4f4' }));
  SY.surf.rotation.x = -Math.PI / 2; SY.surf.position.set(0, 0.22, 4.9); scene.add(SY.surf);
  // ---- defences and clutter on the walkway: torsion catapults (Archimedes' artillery, Polybius 8.5), banners, stores
  const tim2 = pbr('rough_wood', [1, 1], { roughness: 0.85, color: '#a07a56' }), rope2 = new THREE.MeshStandardMaterial({ color: '#4a3a28', roughness: 0.9 });
  for (const cx of [-21, -12, 9, 18, 30]) { const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 2.6), tim2); base.position.y = 0.3; g.add(base);
    for (const sx of [-0.55, 0.55]) { const up = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.18), tim2); up.position.set(sx, 0.95, 0.4); g.add(up); }
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 2.4), tim2); arm.position.set(0, 1.25, -0.1); arm.rotation.x = -0.55; g.add(arm); const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 10), rope2); sk.rotation.z = Math.PI / 2; sk.position.set(0, 0.95, 0.4); g.add(sk);
    g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); g.position.set(cx, T + 0.2, -3.0); scene.add(g); }
  const bnM = new THREE.MeshStandardMaterial({ color: '#8a2b2b', roughness: 0.9, side: THREE.DoubleSide }), bnG = new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: 0.7, side: THREE.DoubleSide });
  for (const bx of [-34, 36]) for (const off of [-2.5, 2.5]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.2, 1, 6), bnM); const pa = b.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getY(i) * 1.3 + bx) * 0.12); b.geometry.computeVertexNormals();
    b.position.set(bx + off, T + 3.2, 2.66); b.castShadow = true; scene.add(b); const st = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), bnG); st.position.set(bx + off, T + 1.3, 2.67); scene.add(st); }
  for (const [id, x, z, h, ry] of [['wooden_crate_02', 3.2, -4.6, 0.5, 0.3], ['wooden_crate_01', 4.4, -4.9, 0.55, 1.1], ['ceramic_vase_01', 5.3, -3.6, 0.7, 0], ['ceramic_vase_02', 5.9, -4.2, 0.55, 1], ['wicker_basket_02', -7.2, -3.3, 0.4, 0.5]]) {
    try { const m = await put(id, x, T + 0.2, z, { h, ry }); if (id.startsWith('ceramic')) m.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.map = null; o.material.color.set('#b0603a'); o.material.roughness = 0.88; } }); } catch (e) {} }
  // ---- distant land: hills north along the coast and Etna on the horizon (visible from Syracuse on clear days)
  const hillM = new THREE.MeshStandardMaterial({ color: '#6f7a72', roughness: 1 }); for (const [x, z, r, h] of [[260, -80, 140, 26], [330, 60, 120, 18], [-260, -160, 160, 30], [180, -260, 150, 40]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), hillM); m.scale.set(1, h / r, 0.6); m.position.set(x, -2, z); scene.add(m); }
  const etna = new THREE.Mesh(new THREE.ConeGeometry(260, 120, 40), new THREE.MeshBasicMaterial({ color: '#9aa2ae', fog: false })); etna.position.set(520, 30, -520); scene.add(etna);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(70, 32, 40), new THREE.MeshBasicMaterial({ color: '#d9dde4', fog: false })); snow.position.set(520, 76, -520); scene.add(snow); SY.etna = [etna, snow];
  // ---- the low sun's glow on the horizon (additive), and a stronger grade
  const glowT = makeSprayTexture(THREE); SY.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: '#ffb46a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.0 }));
  SY.sunGlow.position.copy(SY.sunDir.clone().multiplyScalar(380).setY(10)); SY.sunGlow.scale.set(260, 120, 1); scene.add(SY.sunGlow);
  // ---- torches along the battlements (flame sprites + a few lights)
  const fl = makeSprayTexture(THREE); SY.torches = [];
  for (const x of [-26, -14, 12, 24, 44, -50]) { const pole = box(0.12, 1.4, 0.12, new THREE.MeshStandardMaterial({ color: '#3a2a1a' }), x, T + 1.9, -0.2);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fl, color: '#ffb060', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); f.position.set(x, T + 2.85, -0.2); f.scale.set(0.9, 1.4, 1); scene.add(f);
    const L = Math.abs(x) < 20 ? new THREE.PointLight('#ff9a4a', 30, 22, 2) : null; if (L) { L.position.set(x, T + 3, 0.6); scene.add(L); } SY.torches.push({ f, L, x }); }
  // ---- THE CLAW MACHINE (reconstruction): A-frame on the walkway, pivoting beam, chain, iron hand, counterweight, windlass
  const timber = pbr('rough_wood', [1, 4], { roughness: 0.85, color: '#b08a66' }), iron = new THREE.MeshStandardMaterial({ color: '#3b3a38', metalness: 0.8, roughness: 0.45 });
  const PIV = new THREE.Vector3(0, T + 7.5, -2.2); SY.pivot = PIV; SY.inner = 7.5; SY.outer = 19;
  for (const s of [-1, 1]) { const leg = box(0.34, 8.2, 0.34, timber, s * 1.1, T + 3.9, -2.2); leg.rotation.z = s * 0.12; const leg2 = box(0.3, 8.6, 0.3, timber, s * 1.1, T + 3.9, -4.4); leg2.rotation.x = 0.28; leg2.rotation.z = s * 0.12; }
  box(3.6, 0.4, 0.4, timber, 0, PIV.y, PIV.z);
  const beamG = new THREE.Group(); beamG.position.copy(PIV); scene.add(beamG); SY.beam = beamG;
  const beamLen = SY.inner + SY.outer, beam = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, beamLen), timber); beam.position.z = (SY.outer - SY.inner) / 2; beam.castShadow = true; beamG.add(beam);
  for (const z of [-SY.inner + 0.5, -2, 4, 10, SY.outer - 0.6]) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.25), iron); band.position.z = z; beamG.add(band); }
  const sheave = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16), iron); sheave.rotation.z = Math.PI / 2; sheave.position.set(0, -0.3, SY.outer - 0.4); beamG.add(sheave);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), pbr('wood_planks', [1, 1], { roughness: 0.9, color: '#8a6a4a' })); cw.position.set(0, -1.9, -SY.inner + 0.6); cw.castShadow = true; beamG.add(cw);   // counterweight box of stones
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: '#9a8c7a', roughness: 1 })); st.position.set(-0.6 + (i % 3) * 0.6, -0.8, -SY.inner + 0.2 + Math.floor(i / 3) * 0.7); beamG.add(st); }
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.6, 14), timber); winch.rotation.z = Math.PI / 2; winch.position.set(0, T + 0.9, -5.0); winch.castShadow = true; scene.add(winch); SY.winch = winch;
  for (const s of [-1, 1]) { box(0.3, 1.4, 0.3, timber, s * 1.5, T + 0.75, -5.0); const h = box(0.12, 0.12, 1.4, timber, s * 1.75, T + 0.9, -5.0); h.rotation.x = 0.7; }
  // chain (instanced links) + iron hand
  const linkG = new THREE.TorusGeometry(0.16, 0.05, 6, 10); SY.chain = new THREE.InstancedMesh(linkG, iron, 120); SY.chain.castShadow = true; scene.add(SY.chain);
  const hand = new THREE.Group(); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.7, 10), iron); hand.add(hub);
  for (let k = 0; k < 4; k++) { const claw = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.13, 8, 16, Math.PI * 0.75), iron); claw.rotation.set(0, k * Math.PI / 2, Math.PI * 1.15); claw.position.y = -0.4; const g = new THREE.Group(); g.add(claw); g.rotation.y = k * Math.PI / 2; hand.add(g);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8), iron); tip.position.set(0.0, -1.15, 0.72); g.add(tip); }
  hand.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(hand); SY.hand = hand;
  // ---- the Roman fleet (one hero ship + a distant fleet)
  SY.hero = buildWarship(THREE, { L: 30, B: 5.2, H: 3.0, pbr, shield: '#a8322c' }); scene.add(SY.hero.root);
  SY.flag = buildWarship(THREE, { L: 32, B: 5.6, H: 3.2, pbr, shield: '#8a2a5a', seed: 2 }); scene.add(SY.flag.root);
  SY.fleet = []; for (const [x, z, ry] of [[-26, 70, 0.08], [18, 86, -0.05], [-48, 110, 0.1], [40, 120, -0.1], [-8, 140, 0.03], [62, 160, 0], [-70, 165, 0.12]]) { const s = buildWarship(THREE, { L: 30, B: 5, H: 3, pbr: null, eye: false, oarsPerSide: 12 }); s.root.position.set(x, 0, z); s.root.rotation.y = Math.PI / 2 + ry; scene.add(s.root); SY.fleet.push(s); }
  // ---- low sea mist
  const mc = document.createElement('canvas'); mc.width = mc.height = 256; const mg = mc.getContext('2d'); for (let i = 0; i < 70; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 20 + Math.random() * 50, gr = mg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); mg.fillStyle = gr; mg.fillRect(0, 0, 256, 256); }
  const mt = new THREE.CanvasTexture(mc); mt.wrapS = mt.wrapT = THREE.RepeatWrapping; SY.mist = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(320, 30), new THREE.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false, opacity: 0.55, color: '#dfe6ee', fog: true })); m.userData.mist = true; m.position.set(0, 1.0 + i * 0.8, 95 + i * 30); m.material.map = mt.clone(); m.material.map.repeat.set(4, 1); scene.add(m); SY.mist.push(m); }
  return SY;
}

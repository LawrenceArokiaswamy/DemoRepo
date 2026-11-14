// Roman harbour building site (original layout), c. 1st century AD: a marine-concrete sea wall under construction.
// All assets Poly Haven CC0. Period check: no modern props (no glass bottles, metal hardware, printed books, clocks).
import { THREE, scene, renderer, loadModel, pbr } from '../stage.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const RSET = { props: {}, tub: null, mortarY: 0, sea: null };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true;
  m.geometry.setAttribute('uv2', m.geometry.attributes.uv); scene.add(m); return m; };
async function put(id, x, y, z, { ry = 0, h = null, s = 1, name = id } = {}) {
  const m = await loadModel(id); m.rotation.y = ry; const b = new THREE.Box3().setFromObject(m), size = b.getSize(new THREE.Vector3());
  m.scale.setScalar(h ? h / size.y : s); const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3());
  m.position.set(x - c.x, y - b2.min.y, z - c.z); scene.add(m); RSET.props[name] = m; return m;
}
const terracotta = (m, col = '#b0603a') => m.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.map = null; o.material.color.set(col); o.material.roughness = 0.88; o.material.metalness = 0; } });

function waterNormals() {   // procedural wave normal map (sum of directional sines), tiled + scrolled for motion
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  const W = [[1, 0.2, 3, 0.9], [0.3, 1, 5, 0.6], [-0.7, 0.6, 7, 0.4], [0.8, -0.5, 11, 0.25], [0.1, -1, 17, 0.15]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let dx = 0, dy = 0; for (const [ax, ay, f, a] of W) { const ph = (ax * x + ay * y) / N * Math.PI * 2 * f, d = Math.cos(ph) * a * f * 0.06; dx += ax * d; dy += ay * d; }
    const n = [-dx, -dy, 1], l = Math.hypot(...n), i = (y * N + x) * 4; im.data[i] = (n[0] / l * 0.5 + 0.5) * 255; im.data[i + 1] = (n[1] / l * 0.5 + 0.5) * 255; im.data[i + 2] = (n[2] / l * 0.5 + 0.5) * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 85); return t;
}

export async function buildRomanSet() {
  // sky: a "pure sky" HDRI (no modern buildings) for background + image-based light
  const hdr = await new RGBELoader().loadAsync('./assets/hdri/qwantani_morning_puresky_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; scene.environmentIntensity = 0.55; pm.dispose();
  scene.background = hdr; scene.backgroundIntensity = 0.8; scene.backgroundRotation = new THREE.Euler(0, 1.2, 0); scene.environmentRotation = new THREE.Euler(0, 1.2, 0);
  scene.fog = new THREE.Fog('#c7d3dc', 30, 160);
  // ground: coastal sand; sea beyond the wall
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), pbr('coast_sand_01', [22, 22], { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  ground.geometry.setAttribute('uv2', ground.geometry.attributes.uv); scene.add(ground);
  const nm = waterNormals(); RSET.waterTex = nm;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 300), new THREE.MeshStandardMaterial({ color: '#2f6f80', roughness: 0.06, metalness: 0.15, normalMap: nm, normalScale: new THREE.Vector2(0.32, 0.32), envMapIntensity: 1.4 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.03, -5.4 - 150); scene.add(sea); RSET.sea = sea;
  // the sea wall (opus quadratum facing over a concrete core), stepped where work is unfinished
  const ss = (rx, ry) => pbr('large_sandstone_blocks', [rx, ry], { roughness: 0.9, color: '#e8dccb' }), worn = pbr('large_sandstone_blocks', [0.3, 0.22], { roughness: 0.92, color: '#d9cbb5' });
  box(14, 0.95, 1.4, ss(5.5, 0.4), 0.5, 0.475, -3.7);                  // low course along the shore
  box(4.2, 1.9, 1.5, ss(1.7, 0.8), -4.9, 0.95, -3.65);                 // finished tall section (left)
  box(1.6, 1.45, 1.5, ss(0.65, 0.6), -2.1, 0.725, -3.65);               // step down
  for (const [x, y, z, ry] of [[-0.9, 1.15, -3.6, 0.05], [-0.25, 1.15, -3.75, -0.08], [0.9, 1.15, -3.55, 0.1], [-1.25, 1.55, -3.65, 0]]) box(0.62, 0.4, 0.5, worn, x, y, z, ry);   // loose blocks being set
  // timber formwork (Romans poured marine concrete into wooden forms), with a little concrete showing
  const planks = pbr('wood_planks', [1, 1], { roughness: 0.85 });
  const FX = 2.6, FZ = -3.5; box(1.6, 1.35, 0.06, planks, FX, 0.95 + 0.4, FZ + 0.72); box(1.6, 1.35, 0.06, planks, FX, 0.95 + 0.4, FZ - 0.72); box(0.06, 1.35, 1.5, planks, FX - 0.8, 0.95 + 0.4, FZ); box(0.06, 1.35, 1.5, planks, FX + 0.8, 0.95 + 0.4, FZ);
  for (const dx of [-0.82, 0, 0.82]) box(0.1, 1.6, 0.1, planks, FX + dx, 1.4, FZ + 0.8);
  const conc = pbr('dirty_concrete', [1, 1], { roughness: 0.6, color: '#9a958c' }); box(1.52, 0.04, 1.42, conc, FX, 1.86, FZ);
  // distant headlands
  await put('coast_rocks_01', -26, -0.6, -48, { s: 0.35, ry: 0.6, name: 'headL' }); await put('coast_rocks_02', 30, -0.8, -60, { s: 0.4, ry: 2.2, name: 'headR' });
  // ---- working props ----
  const tub = await put('wooden_bucket_02', 0.18, 0, -0.22, { s: 1.3, ry: 0.4, name: 'tub' }); RSET.tub = tub;    // mortar tub (~0.95 m)
  const tb = new THREE.Box3().setFromObject(tub); RSET.mortarY = tb.max.y - 0.07; RSET.tubC = new THREE.Vector3(0.18, RSET.mortarY, -0.22); RSET.tubR = (tb.max.x - tb.min.x) / 2 - 0.06;
  const mortar = new THREE.Mesh(new THREE.CircleGeometry(RSET.tubR, 48), pbr('dirty_concrete', [0.8, 0.8], { roughness: 0.48, color: '#bdb6aa', emissive: new THREE.Color('#2c2925') })); mortar.rotation.x = -Math.PI / 2; mortar.position.copy(RSET.tubC); mortar.receiveShadow = true;
  mortar.geometry.setAttribute('uv2', mortar.geometry.attributes.uv); scene.add(mortar); RSET.mortar = mortar;
  await put('trowel_01', 0.62, 0.01, 0.2, { s: 1.2, ry: 2.1, name: 'trowel' });
  const pot = await put('planter_pot_clay', 0, 0, 0, { h: 0.3, name: 'limepot' }); RSET.pot = pot;     // carried by Felix
  RSET.potH = 0.3; RSET.potOff = pot.position.clone(); pot.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // amphorae (tinted clay jars), pozzolana heap, baskets, crates, tools
  for (const [id, x, z, h, ry] of [['ceramic_vase_01', -1.55, -1.75, 0.62, 0], ['ceramic_vase_02', -1.2, -1.95, 0.5, 1], ['ceramic_vase_01', -1.85, -2.05, 0.6, 2], ['ceramic_vase_02', -0.95, -2.3, 0.42, 2.5], ['ceramic_vase_02', 1.75, -2.2, 0.48, 0.5]])
    terracotta(await put(id, x, 0, z, { h, ry, name: id + x }), ['#b0603a', '#a5583a', '#bd6f45'][Math.floor(Math.abs(x * 10)) % 3]);
  const heapMat = pbr('gravelly_sand', [2, 2], { roughness: 1, color: '#9a8878' });
  for (const [x, z, r, h] of [[-2.4, -1.2, 0.85, 0.55], [2.2, -1.0, 0.6, 0.35]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 40, 1, true), heapMat); c.position.set(x, h / 2 - 0.01, z); c.castShadow = c.receiveShadow = true; c.geometry.setAttribute('uv2', c.geometry.attributes.uv); scene.add(c); }
  await put('wicker_basket_02', -2.0, 0, -0.55, { h: 0.3, ry: 0.7, name: 'basket' }); await put('wicker_basket_01', 1.55, 0, -1.25, { h: 0.33, ry: -0.4, name: 'basket2' });
  await put('wooden_crate_02', 2.15, 0, -0.1, { h: 0.42, ry: 1.2, name: 'crate' }); await put('rusted_spade_01', 1.2, 0, -2.85, { h: 1.0, ry: 0.2, name: 'spade' }).then((m) => { m.rotation.x = -0.32; m.position.y += 0.02; });
  await put('wooden_bowl_01', -1.0, 0, 0.9, { h: 0.08, name: 'bowl' }); await put('wooden_bucket_01', -2.3, 0, 0.3, { h: 0.36, ry: 1, name: 'bucket' });
  for (const [x, z, s, ry] of [[-2.8, -2.6, 1.6, 0.4], [3.2, -2.5, 1.8, 2]]) await put('rock_07', x, 0, z, { s, ry, name: 'rk' + x });
  for (const [x, z, s] of [[-0.5, -2.8, 2], [1.9, -2.7, 1.6]]) await put('stone_01', x, 0, z, { s, name: 'st' + x });
  // ---- light: low morning sun from camera-left, sky fill from the HDRI
  const sun = new THREE.DirectionalLight('#ffe2bd', 3.4); sun.position.set(-6, 5.2, 4.5); sun.target.position.set(0.2, 0.5, -0.6); sun.castShadow = true;
  sun.shadow.mapSize.set(3072, 3072); Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
  scene.add(sun, sun.target); RSET.sun = sun;
  const bounce = new THREE.HemisphereLight('#cfe3ff', '#c9a477', 0.35); scene.add(bounce);
}
export const build = async () => { await buildRomanSet(); return RSET; };

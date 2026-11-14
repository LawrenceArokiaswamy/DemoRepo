// Inventor's workshop set (original layout) built from Poly Haven CC0 assets.
import { THREE, scene, loadModel, pbr, loadHDRI } from '../stage.js';

export const SET = { benchTop: 0.9, benchZ: 0, props: {} };
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true;
  const uv = m.geometry.attributes.uv; m.geometry.setAttribute('uv2', uv); scene.add(m); return m; };
/** place a model so its bounding box bottom sits at y, centred at x,z; optional uniform scale to a target height */
async function put(id, x, y, z, { ry = 0, h = null, s = 1, parent = scene } = {}) {
  const m = await loadModel(id); m.rotation.y = ry; const b = new THREE.Box3().setFromObject(m), size = b.getSize(new THREE.Vector3());
  const k = h ? h / size.y : s; m.scale.setScalar(k); const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3());
  m.position.set(x - c.x, y - b2.min.y, z - c.z); parent.add(m); SET.props[id] = m; return m;
}

export async function buildSet() {
  await loadHDRI('./assets/hdri/artist_workshop_1k.hdr', 0.38);
  scene.background = new THREE.Color('#1a1410');
  // ---- room shell ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), pbr('brown_planks_05', [4.5, 4.5], { roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.geometry.setAttribute('uv2', floor.geometry.attributes.uv); scene.add(floor);
  const brick = pbr('brick_wall_02', [2.4, 1.2]), plaster = pbr('plastered_wall', [2, 1.2]), beams = pbr('dark_planks', [1, 4]);
  const WZ = -1.7; // back wall with a window opening x[-2.1,-1.0] y[1.35,2.55]
  box(2.9, 3.6, 0.25, brick, -3.55, 1.8, WZ); box(4.1, 3.6, 0.25, brick, 1.05, 1.8, WZ); box(1.1, 1.35, 0.25, brick, -1.55, 0.675, WZ); box(1.1, 1.05, 0.25, brick, -1.55, 3.075, WZ);
  const wood = new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.7 });
  for (const [w, h, x, y] of [[1.18, 0.09, -1.55, 2.58], [1.18, 0.12, -1.55, 1.33], [0.09, 1.25, -2.1, 1.95], [0.09, 1.25, -1.0, 1.95], [0.05, 1.2, -1.55, 1.95], [1.1, 0.05, -1.55, 1.95]]) box(w, h, 0.12, wood, x, y, WZ + 0.06);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.7) })); sky.position.set(-1.55, 2.0, WZ - 1.2); scene.add(sky);
  box(0.25, 3.6, 7, plaster, -3.3, 1.8, 1.6);           // left wall
  box(9, 0.12, 7, beams, 0, 3.6, 1.6);                  // ceiling boards
  for (let i = 0; i < 5; i++) box(0.22, 0.3, 7, wood, -2.6 + i * 1.3, 3.4, 1.6);
  box(0.2, 3.6, 0.2, wood, 1.35, 1.8, WZ + 0.2); box(0.2, 3.6, 0.2, wood, -0.35, 1.8, WZ + 0.2);   // timber posts
  // ---- hero furniture + props ----
  const bench = await put('WoodenTable_03', 0, 0, 0, { h: 0.8 }); SET.benchTop = new THREE.Box3().setFromObject(bench).max.y; const T = SET.benchTop;
  await put('bench_vice_01', -0.52, T, 0.12, { ry: 0.3 });
  await put('hand_plane_no4', 0.42, T, 0.18, { ry: 1.2 });
  await put('wooden_hammer_01', -0.18, T, 0.25, { ry: 1.5 }).then((m) => { m.rotation.z = Math.PI / 2; m.position.y = T + 0.01; });
  await put('magnifying_glass_01', 0.22, T, 0.27, { ry: 0.5 }).then((m) => { m.rotation.x = -Math.PI / 2; m.position.y = T + 0.015; });
  await put('chemistry_set', 0.45, T, -0.18, { ry: -0.3 });
  await put('vintage_microscope', -0.35, T, -0.2, { ry: 0.6 });
  await put('vintage_oil_lamp', 0.62, T, 0.0, { h: 0.55 });
  await put('book_encyclopedia_set_01', -0.6, T, -0.15, { ry: 1.57 });
  await put('seadogs_compass', 0.05, T, 0.3, { ry: 0.4 });
  await put('pocket_watch', -0.05, T, 0.33, { ry: 1.0 });
  await put('wooden_candlestick', -0.15, T, -0.25, {});
  await put('alarm_clock_01', 0.05, T, 0.08, { ry: -0.25, h: 0.2 });   // the hero gadget
  // the model's glass uses its colour texture at full opacity, which renders as a black disc over the dial: replace with clear glass
  SET.props.alarm_clock_01.traverse((o) => { if (o.isMesh && /glass/i.test(o.material.name)) o.material = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0, envMapIntensity: 1.2, depthWrite: false }); });
  // ---- room dressing ----
  await put('wooden_bookshelf_worn', -0.55, 0, WZ + 0.45, {});
  await put('vintage_grandfather_clock_01', 2.0, 0, WZ + 0.3, {});
  await put('standing_chalkboard_01', 1.55, 0, -1.0, { ry: -0.6 });
  await put('spinning_wheel_01', -2.6, 0, 0.6, { ry: 1.2 });
  await put('Barrel_02', 1.7, 0, 0.4, {}); await put('wooden_crate_01', 1.55, 0.0, 1.05, { ry: 0.4 }); await put('wooden_bucket_01', -1.3, 0, 0.9, {});
  await put('wooden_stool_01', -0.9, 0, 0.55, { ry: 0.3 }); await put('wicker_basket_01', 1.62, 0.88, 0.4, {});
  await put('Lantern_01', -0.85, 1.26, WZ + 0.45, { h: 0.32 }); await put('brass_pot_01', -0.25, 0.5, WZ + 0.45, { h: 0.22 }); await put('mantel_clock_01', -0.4, 1.71, WZ + 0.45, { h: 0.2 });
  await put('brass_goblets', 0.7, T, -0.25, { h: 0.18 });
  // ---- lights ----
  const sun = new THREE.DirectionalLight('#ffd8a8', 4.2); sun.position.set(-4.5, 5.5, -6); sun.target.position.set(0.3, 0.8, 0.3); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const lamp = new THREE.PointLight('#ffa456', 1.4, 3, 2); lamp.position.set(0.62, T + 0.42, 0.0); scene.add(lamp); SET.lamp = lamp;
  const fill = new THREE.SpotLight('#9fb8ff', 18, 10, 0.6, 0.8, 2); fill.position.set(2.5, 2.6, 3.2); fill.target.position.set(0, 1.2, -0.4); scene.add(fill, fill.target);
  const rim = new THREE.SpotLight('#ffcf9a', 22, 8, 0.5, 0.7, 2); rim.position.set(1.4, 2.8, -1.4); rim.target.position.set(0, 1.4, -0.5); scene.add(rim, rim.target);
  // window light shaft (soft additive volume) + dust motes
  const shaftTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,220,170,0.55)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (let i = 0; i < 3; i++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.0 + i * 0.25, 4.2), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.16 - i * 0.03, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    sh.position.set(-1.0 + i * 0.05, 1.5, -0.4); sh.rotation.set(0.55, 0.62 + i * 0.12, 0.2); scene.add(sh); }
  const N = 260, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = -1.8 + Math.random() * 1.8; pos[i * 3 + 1] = 0.6 + Math.random() * 2.2; pos[i * 3 + 2] = -1.3 + Math.random() * 1.6; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  SET.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffe6c4', size: 0.008, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(SET.dust);
  // lamp flame
  SET.flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3.2, 1.2) })); SET.flame.scale.set(1, 2.2, 1); SET.flame.position.set(0.62, T + 0.3, 0.0); scene.add(SET.flame);
}
export const build = async () => { await buildSet(); return SET; };

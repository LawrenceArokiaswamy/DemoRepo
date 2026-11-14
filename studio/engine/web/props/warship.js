// ANCIENT OARED WARSHIP (original, procedural; stylised reconstruction of a Hellenistic/Roman polyreme).
// Local frame: +x = bow, y = up (waterline y = 0), z = beam. Hierarchy: root (position/heading/bob) -> lift (pivot at the
// stern keel, so lift.rotation.z stands the ship on its stern) -> body. Returns handles for animation.
export function buildWarship(THREE, { L = 30, B = 5, H = 3.0, draft = 1.3, pbr = null, hullTex = 'dark_wooden_planks', deckTex = 'wood_planks', oarsPerSide = 22, shield = '#a8322c', eye = true, seed = 1 } = {}) {
  const wood = pbr ? pbr(hullTex, [L / 4, 1.2], { roughness: 0.8, color: '#9a7a5c', side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: '#6b4a34', roughness: 0.8, side: THREE.DoubleSide });
  const pitch = new THREE.MeshStandardMaterial({ color: '#1e1a17', roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
  const deckM = pbr ? pbr(deckTex, [L / 3, 1.2], { roughness: 0.85, color: '#c9ab88' }) : new THREE.MeshStandardMaterial({ color: '#9a7a5c' });
  const bronze = new THREE.MeshStandardMaterial({ color: '#b07a3a', metalness: 0.85, roughness: 0.32 });
  const oarM = new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.7 }), paint = new THREE.MeshStandardMaterial({ color: '#7a2a2a', roughness: 0.6 });
  const root = new THREE.Group(), lift = new THREE.Group(), body = new THREE.Group(); root.add(lift); lift.add(body);
  const pivot = new THREE.Vector3(-L / 2 + 1.2, -draft * 0.7, 0); lift.position.copy(pivot); body.position.copy(pivot).multiplyScalar(-1);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const halfW = (u) => B / 2 * Math.pow(Math.sin(Math.PI * clamp(u * 0.97 + 0.015, 0, 1)), u > 0.5 ? 0.75 : 0.5);
  const keel = (u) => -draft * Math.pow(Math.sin(Math.PI * clamp(u, 0.02, 0.98)), 0.25);
  const sheer = (u) => H + 2.4 * Math.pow(1 - u, 7) + 0.9 * Math.pow(u, 8);
  // ---- hull: lofted sections, pitch below the wale, planks above
  const NS = 64, NJ = 18, pos = [], uv = [], idxA = [], idxB = [];
  for (const side of [1, -1]) { const base = pos.length / 3;
    for (let i = 0; i <= NS; i++) { const u = i / NS, x = -L / 2 + u * L, w = halfW(u), s = sheer(u), k = keel(u);
      for (let j = 0; j <= NJ; j++) { const f = (j / NJ) * Math.PI / 2, z = w * Math.pow(Math.cos(f), 0.7), y = s - (s - k) * Math.pow(Math.sin(f), 1.5); pos.push(x, y, side * z); uv.push(u * L / 3, j / NJ * 2); } }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NJ; j++) { const a = base + i * (NJ + 1) + j, b = a + NJ + 1, q = side > 0 ? [a, b, a + 1, b, b + 1, a + 1] : [a, a + 1, b, b, a + 1, b + 1];
      (j < NJ * 0.42 ? idxA : idxB).push(...q); } }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  hg.setIndex([...idxA, ...idxB]); hg.addGroup(0, idxA.length, 0); hg.addGroup(idxA.length, idxB.length, 1); hg.computeVertexNormals(); hg.setAttribute('uv2', hg.attributes.uv);
  const hull = new THREE.Mesh(hg, [wood, pitch]); hull.castShadow = hull.receiveShadow = true; body.add(hull);
  // ---- deck (a little below the sheer, bulwarks above)
  const dp = [], du = [], di = []; for (let i = 0; i <= NS; i++) { const u = i / NS, x = -L / 2 + u * L, w = halfW(u) * 0.96, y = Math.min(sheer(u), H + 0.6) - 0.45; dp.push(x, y, -w, x, y, w); du.push(u * L / 3, 0, u * L / 3, 1); if (i < NS) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals(); dg.setAttribute('uv2', dg.attributes.uv);
  const deck = new THREE.Mesh(dg, deckM); deck.receiveShadow = deck.castShadow = true; body.add(deck); const deckY = (u) => Math.min(sheer(u), H + 0.6) - 0.45;
  // ---- outrigger oar-box + wale stripe
  for (const s of [1, -1]) { const ob = new THREE.Mesh(new THREE.BoxGeometry(L * 0.62, 0.7, 0.55), paint); ob.position.set(L * 0.02, H * 0.62, s * (B / 2 + 0.12)); ob.castShadow = true; body.add(ob);
    const wale = new THREE.Mesh(new THREE.BoxGeometry(L * 0.9, 0.16, 0.12), new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: 0.5, metalness: 0.3 })); wale.position.set(0, H * 0.9, s * (halfW(0.5) + 0.02)); body.add(wale); }
  // ---- oars (instanced; rowing angle set per frame)
  const oarGeo = new THREE.CylinderGeometry(0.06, 0.07, 1, 6); oarGeo.translate(0, -0.5, 0); const bladeGeo = new THREE.BoxGeometry(0.06, 1.1, 0.42); bladeGeo.translate(0, -0.55, 0);
  const N = oarsPerSide * 2, oars = new THREE.InstancedMesh(oarGeo, oarM, N), blades = new THREE.InstancedMesh(bladeGeo, oarM, N); oars.castShadow = blades.castShadow = true; body.add(oars, blades);
  const oarLen = H * 0.62 + 2.6, ports = []; for (const s of [1, -1]) for (let i = 0; i < oarsPerSide; i++) ports.push([-L * 0.29 + L * 0.62 * (i + 0.5) / oarsPerSide, H * 0.55, s * (B / 2 + 0.38), s]);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S1 = new THREE.Vector3(1, oarLen, 1), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
  const DN = new THREE.Vector3(0, -1, 0), OUT = new THREE.Vector3();
  function setOars(phase, mode = 'row', downLocal = null) {   // mode: row | rest | dangle (hang along downLocal = world-down in body space)
    ports.forEach(([x, y, z, s], i) => { const ph = phase * Math.PI * 2, sweep = mode === 'row' ? Math.sin(ph) * 0.42 : 0, liftA = mode === 'row' ? Math.max(0, Math.cos(ph)) * 0.18 : mode === 'rest' ? 0.25 : 0;
      if (mode === 'dangle' && downLocal) { OUT.set(0, 0, s).multiplyScalar(0.35).add(downLocal).normalize(); Q.setFromUnitVectors(DN, OUT); } else { E.set(-s * (1.0 - liftA), sweep, 0); Q.setFromEuler(E); } V.set(x, y, z);
      M.compose(V, Q, S1); oars.setMatrixAt(i, M); const tip = new THREE.Vector3(0, -oarLen, 0).applyQuaternion(Q).add(V); M.compose(tip, Q, ONE); blades.setMatrixAt(i, M); });
    oars.instanceMatrix.needsUpdate = blades.instanceMatrix.needsUpdate = true; }
  setOars(0);
  // ---- ram (three-finned bronze rostrum at the waterline) + bow post + stern ornament
  const ram = new THREE.Group(); const rb = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 8), bronze); rb.rotation.z = -Math.PI / 2; rb.position.x = 1.0; ram.add(rb);
  for (const dy of [-0.25, 0.05, 0.35]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.9 - Math.abs(dy) * 0.6), bronze); fin.position.set(1.1, dy, 0); ram.add(fin); }
  ram.position.set(L / 2 - 0.4, -0.15, 0); ram.traverse((o) => { if (o.isMesh) o.castShadow = true; }); body.add(ram);
  const tube = (pts, r, mat) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 8, false), mat); m.castShadow = true; body.add(m); return m; };
  tube([[L / 2 - 0.3, H + 0.6, 0], [L / 2 + 0.3, H + 1.5, 0], [L / 2 + 0.2, H + 2.2, 0], [L / 2 - 0.3, H + 2.4, 0]], 0.16, wood);
  tube([[-L / 2 + 0.6, sheer(0.02) - 0.3, 0], [-L / 2 - 0.2, sheer(0.0) + 0.6, 0], [-L / 2 + 0.1, sheer(0) + 1.5, 0], [-L / 2 + 0.9, sheer(0) + 1.8, 0], [-L / 2 + 1.3, sheer(0) + 1.4, 0]], 0.12, wood);
  // ---- painted eye (oculus) on both bows
  if (eye) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#efe6d0'; g.beginPath(); g.ellipse(128, 64, 110, 46, 0, 0, 7); g.fill(); g.fillStyle = '#2a6b8a'; g.beginPath(); g.arc(128, 64, 34, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(128, 64, 17, 0, 7); g.fill();
    g.strokeStyle = '#7a2a2a'; g.lineWidth = 10; g.beginPath(); g.ellipse(128, 64, 112, 48, 0, 0, 7); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    for (const s of [1, -1]) { const u = 0.9, m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.position.set(-L / 2 + u * L, H * 0.78, s * (halfW(u) + 0.06)); m.rotation.y = s > 0 ? 0.32 : Math.PI - 0.32; body.add(m); } }
  // ---- mast, yard with furled sail, rigging, shields along the rail
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 11, 10), wood); mast.position.set(L * 0.06, H + 5, 0); mast.castShadow = true; body.add(mast);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 9, 8), wood); yard.rotation.x = Math.PI / 2; yard.position.set(L * 0.06, H + 9.6, 0); body.add(yard);
  const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 8.4, 9), new THREE.MeshStandardMaterial({ color: '#b9a888', roughness: 1 })); sail.rotation.x = Math.PI / 2; sail.position.set(L * 0.06, H + 9.25, 0); sail.castShadow = true; body.add(sail);
  const rope = new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.9 }); const line = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, A.distanceTo(Bv), 4), rope); m.position.copy(A).add(Bv).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); body.add(m); };
  line([L * 0.06, H + 10.4, 0], [L / 2 - 0.5, H + 0.7, 0]); line([L * 0.06, H + 10.4, 0], [-L / 2 + 1.2, H + 1.2, 0]); for (const s of [1, -1]) line([L * 0.06, H + 10, 0], [L * 0.06, H + 0.5, s * (B / 2)]);
  const shM = new THREE.MeshStandardMaterial({ color: shield, roughness: 0.55 }), boss = new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.8, roughness: 0.35 });
  for (const s of [1, -1]) for (let i = 0; i < 12; i++) { const u = 0.22 + i * 0.045, g = new THREE.Group(), sh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.06), shM); g.add(sh); const bo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), boss); bo.position.z = 0.05; g.add(bo);
    g.position.set(-L / 2 + u * L, sheer(u) - 0.25, s * (halfW(u) + 0.05)); g.rotation.y = s > 0 ? 0 : Math.PI; g.rotation.x = s * 0.0; body.add(g); }
  /** local deck point (u along length 0..1 from stern, v across -1..1) */
  const deckPoint = (u, v = 0) => new THREE.Vector3(-L / 2 + u * L, deckY(u), v * halfW(u) * 0.8);
  const bowGrip = new THREE.Vector3(L / 2 - 0.1, H + 1.4, 0);   // where the claw bites (bow post)
  return { root, lift, body, L, B, H, draft, deckY, halfW, deckPoint, bowGrip, setOars, materials: { wood, pitch, deckM, bronze } };
}

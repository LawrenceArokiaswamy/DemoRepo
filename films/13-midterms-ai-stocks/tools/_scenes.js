// ---------------- film 13 palette + small helpers ----------------
const DEM = new THREE.Color('#3F7CFF'), REP = new THREE.Color('#F04A50'), UNC = new THREE.Color('#9AA6C8'), AMBER = new THREE.Color('#FF9A2E');
const NAVY = 0x0B1433;
const M = (c, e = 0x000000, ei = 0, r = .55, m = .25) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: ei, roughness: r, metalness: m });
function edges(mesh, col, k = 1.6, op = 1) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), new THREE.LineBasicMaterial({ color: col.clone().multiplyScalar(k), transparent: true, opacity: op, toneMapped: false })); mesh.add(l); return l; }
function box(w, h, d, mat, col = GOLD, k = 1.6, op = 1) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); if (col) m.userData.e = edges(m, col, k, op); return m; }
function cyl(rt, rb, h, mat, seg = 24) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); }
function lbl(text, o) { const L = label3d(text, o); return L; }
function faceCam(o) { o.quaternion.copy(camera.quaternion); }
let F, CAPS, US; const FONTS = [[AN, 'fonts/Anton-Regular.ttf'], [BX, 'fonts/BarlowCondensed-ExtraBold.ttf'], [BB, 'fonts/BarlowCondensed-Bold.ttf'], [BS, 'fonts/BarlowCondensed-SemiBold.ttf']];
const word = (id, w) => { const ws = F.words[id]; const k = ws.findIndex(x => x[0].toLowerCase().replace(/[^a-z']/g, '') === w); return k < 0 ? ws[0][1] : ws[k][1]; };
const L0 = id => F.lines[id][0], L1 = id => F.lines[id][1];
const SETS = {};
function makeSet(name) { const g = new THREE.Group(); g.visible = false; scene.add(g); SETS[name] = g; return g; }
function show(...names) { for (const k in SETS) SETS[k].visible = names.includes(k); }
function cam(p, l, fov = 40, roll = 0, near = .02, far = 400) { camera.position.copy(p); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(l); if (camera.fov !== fov || camera.near !== near || camera.far !== far) { camera.fov = fov; camera.near = near; camera.far = far; camera.updateProjectionMatrix(); } }
// map-plane camera (map lies in XY, z up): position given in map coords, up = +z
function mcam(p, l, fov = 40, roll = 0) { camera.position.copy(p); camera.up.set(Math.sin(roll), 0, Math.cos(roll)).normalize(); camera.lookAt(l); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } }
const T = {}; let EV = [];
const pts1 = (p, c, s) => { const g = glowPoints(p, c, s, p.map((_, i) => hash(i))); g.material.uniforms.uAper.value = 0; g.material.uniforms.uTw.value = 0; return g; };

// ================= US MAP =================
const MAP = { states: [], line: null, head: null, dcs: [] };
function buildMap() {
  const g = makeSet('map');
  const base = new THREE.Mesh(new THREE.PlaneGeometry(16, 11), new THREE.MeshBasicMaterial({ map: canvasTex(512, 352, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(40,90,200,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(90,150,255,.18)'; c.lineWidth = 1; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }), transparent: true, depthWrite: false, toneMapped: false }));
  base.position.z = -.02; g.add(base);
  const lp = [];
  for (const st in US) {
    const mat = M(NAVY, GOLD, 0, .5, .3); let cx = 0, cy = 0, n = 0;
    for (const ring of US[st]) {
      const sh = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(x, y)));
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .07, bevelEnabled: false }), mat); g.add(mesh);
      for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; lp.push(a[0], a[1], .072, b[0], b[1], .072); cx += a[0]; cy += a[1]; n++; }
    }
    MAP.states.push({ st, mat, cx: cx / n, cy: cy / n });
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  MAP.outline = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: CYAN.clone().multiplyScalar(1.5), transparent: true, opacity: .9, toneMapped: false })); g.add(MAP.outline);
  // the falling stock line, floating above the map (shape illustrative)
  const r = mulberry(11), P = []; const N = 26;
  for (let i = 0; i <= N; i++) { const u = i / N; const x = lerp(-4.3, 4.1, u); const fall = u < .55 ? .5 * Math.sin(u * 9) * .4 + 2.3 - u * .9 : lerp(1.8, -2.5, ei((u - .55) / .45)); P.push([x, fall + (r() - .5) * .35 * (u < .55 ? 1 : .4)]); }
  MAP.lineP = poly(P, 0);
  MAP.line = trail(MAP.lineP, .075, GOLD2.clone().multiplyScalar(2.4), .9); MAP.line.material.uniforms.uTail.value = 3; g.add(MAP.line);
  MAP.head = pts1([0, 0, 0], [3, 2.4, 1.2], [.09]); g.add(MAP.head);
  // data-centre blocks (illustrative spots)
  const spots = [[3.25, .45], [3.0, .7], [-.1, -1.3], [-.45, -1.85], [-2.8, -1.0], [2.3, .7], [2.05, -.9], [-4.0, 2.4], [.45, .95], [1.45, .95], [-3.9, .9], [1.1, -.2]];
  for (const [x, y] of spots) { const b = box(.22, .22, 1, M(0x101a3c, CYAN, .4), CYAN, 1.8); b.position.set(x, y, .07); b.scale.z = .001; g.add(b); MAP.dcs.push(b); }
  const q = lbl('?', { size: 300, font: AN, color: CSS.gold, glow: 'rgba(255,170,30,.9)', h: 2.2, mult: 1.2 }); q.position.set(0, .3, 2.2); g.add(q); MAP.q = q;
  g.add(dust(900, 21, [-12, 12, -9, 9, -6, 6], [CYAN, GOLD2], [.02, .05], 8, 6, .35));
}
function mapFill(t, mode, k = 1) {
  for (const s of MAP.states) {
    let e = .12;
    if (mode === 'sweep') { const a = .05 + (s.cx + 4.7) / 9.2 * 1.05 + hash(s.cx * 9.1) * .25; const f = seg(t, a, a + .3); e = .12 + 1.0 * eo(f) * (.85 + .15 * Math.sin(t * 6 + s.cx)); }
    else if (mode === 'lit') e = .55 + .1 * Math.sin(t * 2 + s.cx * 2);
    else if (mode === 'dim') e = .14;
    s.mat.emissiveIntensity = e * k; s.mat.emissive.copy(GOLD);
  }
}
function mapLine(u, t) {
  MAP.line.material.uniforms.uHead.value = u; MAP.line.material.uniforms.uT.value = t; MAP.line.visible = u > 0;
  const p = MAP.lineP.at(clamp(u)); MAP.head.position.set(p.x, p.y, .9); MAP.head.visible = u > 0 && u < 1.02;
  return V(p.x, p.y, .9);
}

// ================= CAPITOL (simple geometric silhouette) =================
function buildCapitol() {
  const g = makeSet('capitol'); const c = new THREE.Group(); g.add(c); SETS.capitol.userData.c = c;
  const stone = M(0x111a3a, GOLD, .05, .6, .2);
  const add = (m, x, y, z) => { m.position.set(x, y, z); c.add(m); return m; };
  add(box(7.4, .3, 2.2, stone, GOLD, 1.2), 0, .15, 0); add(box(6.8, .25, 1.9, stone, GOLD, 1.2), 0, .42, 0);
  add(box(2.4, 1.3, 1.4, stone, GOLD, 1.5), 0, 1.2, 0);
  for (const sx of [-1, 1]) { add(box(2.1, 1.0, 1.2, stone, GOLD, 1.3), sx * 2.3, 1.05, 0); add(box(.9, 1.15, 1.35, stone, GOLD, 1.3), sx * 3.15, 1.12, 0);
    for (let i = 0; i < 6; i++) add(cyl(.045, .05, .85, stone, 10), sx * (1.55 + i * .3), 1.0, .66); }
  for (let i = 0; i < 8; i++) add(cyl(.05, .055, 1.05, stone, 10), -.84 + i * .24, 1.07, .78);
  const tri = new THREE.Shape([new THREE.Vector2(-1.1, 0), new THREE.Vector2(1.1, 0), new THREE.Vector2(0, .42)]);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .2, bevelEnabled: false }), stone); edges(ped, GOLD, 1.6); add(ped, 0, 1.85, .62);
  const drum = add(cyl(.95, 1.0, .45, stone, 40), 0, 2.08, 0); edges(drum, GOLD, 1.2, .5);
  const drum2 = add(cyl(.78, .8, .55, stone, 40), 0, 2.55, 0);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; add(cyl(.03, .03, .55, stone, 8), Math.sin(a) * .86, 2.55, Math.cos(a) * .86); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.76, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M(0x16214a, GOLD, .25, .35, .5)); dome.scale.y = 1.25; add(dome, 0, 2.82, 0);
  const ribs = new THREE.Group(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const pts = []; for (let k = 0; k <= 12; k++) { const b = k / 12 * Math.PI / 2; pts.push(V(Math.sin(a) * Math.cos(b) * .765, Math.sin(b) * .95, Math.cos(a) * Math.cos(b) * .765)); } const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: GOLD2.clone().multiplyScalar(2), toneMapped: false })); ribs.add(ln); }
  ribs.position.y = 2.82; c.add(ribs);
  add(cyl(.13, .15, .42, stone, 16), 0, 3.95, 0); add(new THREE.Mesh(new THREE.ConeGeometry(.08, .32, 12), M(0x222, GOLD, 2)), 0, 4.32, 0);
  // windows: warm points
  const p = [], col = [], s = []; const r = mulberry(4);
  for (let i = 0; i < 90; i++) { const x = (r() - .5) * 6.6, y = .7 + r() * .7; if (Math.abs(x) < 1.2) continue; p.push(x, y, .62); col.push(2.2, 1.5, .6); s.push(.03); }
  c.add(pts1(p, col, s));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (cc, w) => { const gr = cc.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,80,.35)'); gr.addColorStop(.35, 'rgba(40,80,200,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cc.fillStyle = gr; cc.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, toneMapped: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = .01; g.add(ground);
  g.add(dust(1200, 8, [-20, 20, -2, 16, -24, -4], [new THREE.Color(.7, .8, 1), GOLD2], [.02, .05], 20, 0, .5));
}

// ================= SEAT CHARTS (hemicycles) =================
function hemi(n, rows, r0, r1) {
  const R = [...Array(rows)].map((_, i) => lerp(r0, r1, i / (rows - 1))); const tot = R.reduce((a, b) => a + b, 0);
  const cnt = R.map(r => Math.round(n * r / tot)); let d = n - cnt.reduce((a, b) => a + b, 0); cnt[rows - 1] += d;
  const S = []; R.forEach((r, i) => { for (let k = 0; k < cnt[i]; k++) { const a = Math.PI * (1 - (k + .5) / cnt[i]); S.push({ a, x: Math.cos(a) * r, y: Math.sin(a) * r }); } });
  return S.sort((p, q) => q.a - p.a);
}
function buildSeats(name, n, rows, r0, r1, sz, d, u) {
  const g = makeSet(name); const S = hemi(n, rows, r0, r1); const p = [], c = [], s = [];
  S.forEach(q => { p.push(q.x, q.y, 0); c.push(.2, .25, .4); s.push(sz); });
  const pt = pts1(p, c, s); g.add(pt); g.userData = { pt, S, d, u, n };
  const ring = new THREE.Mesh(new THREE.RingGeometry(r1 + .25, r1 + .3, 96, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: .6, side: THREE.DoubleSide })); g.add(ring);
  // majority line
  const k = Math.floor(n / 2) + 1, a = S[Math.min(k - 1, n - 1)].a; const ml = new THREE.Mesh(new THREE.PlaneGeometry(.03, r1 - r0 + .8), new THREE.MeshBasicMaterial({ color: GOLD2.clone().multiplyScalar(2.5), toneMapped: false, transparent: true }));
  const rm = (r0 + r1) / 2; ml.position.set(Math.cos(a) * rm, Math.sin(a) * rm, .01); ml.rotation.z = a - Math.PI / 2; g.add(ml); g.userData.ml = ml;
  g.add(dust(500, 31, [-10, 10, -6, 10, -14, -2], [CYAN, GOLD2], [.02, .05], 8, 8, .3));
}
function seatsFill(name, t, t0, dur) {
  const { pt, S, d, u, n } = SETS[name].userData; const col = pt.geometry.attributes.color;
  for (let i = 0; i < n; i++) {
    const k = i < d ? 'd' : i < d + u ? 'u' : 'r'; const order = k === 'd' ? i / d : k === 'r' ? (n - 1 - i) / (n - d - u) : 1; const f = eo(seg(t, t0 + order * dur * .8, t0 + order * dur * .8 + .18));
    const C = k === 'd' ? DEM : k === 'r' ? REP : UNC; const b = k === 'u' ? (.8 + .5 * Math.sin(t * 7 + i)) : 1.7;
    col.setXYZ(i, lerp(.15, C.r * b, f), lerp(.2, C.g * b, f), lerp(.35, C.b * b, f));
  }
  col.needsUpdate = true;
}

// ================= CHART (daily closes) + TICKER WALL =================
function chartSet(name, pts, xLabels, yr, marker) {
  const g = makeSet(name); const X0 = -3, X1 = 3, Y0 = -2.2, Y1 = 2.2;
  const xs = pts.map(p => p[0]); const xa = Math.min(...xs), xb = Math.max(...xs, marker ? marker[0] : -1e9);
  const map = (x, y) => [lerp(X0, X1, (x - xa) / (xb - xa)), lerp(Y0, Y1, (y - yr[0]) / (yr[1] - yr[0]))];
  const P = pts.map(([x, y]) => map(x, y)); const pl = poly(P, 0);
  const tr = trail(pl, .085, GOLD2.clone().multiplyScalar(2.6), 0); tr.material.uniforms.uTail.value = 3; g.add(tr);
  const head = pts1([0, 0, 0], [3, 2.4, 1.2], [.16]); g.add(head);
  const gl = []; for (let i = 0; i <= 6; i++) { const y = lerp(Y0, Y1, i / 6); gl.push(X0 - .3, y, -.01, X1 + .3, y, -.01); }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gl, 3)), new THREE.LineBasicMaterial({ color: new THREE.Color(.25, .4, .8), transparent: true, opacity: .5 })); g.add(grid);
  const dots = P.map(([x, y]) => { const d = pts1([x, y, .01], [2.6, 2.1, 1.1], [.11]); g.add(d); return d; });
  xLabels.forEach(([x, s]) => { const L = lbl(s, { size: 90, font: BX, color: '#cfe0ff', h: .32 }); const [px] = map(x, yr[0]); L.position.set(px, Y0 - .45, 0); g.add(L); });
  if (marker) { const [mx] = map(marker[0], 0); const m = new THREE.Mesh(new THREE.PlaneGeometry(.04, Y1 - Y0 + .6), new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(2.2), toneMapped: false, transparent: true })); m.position.set(mx, 0, -.005); g.add(m);
    const L = lbl(marker[1], { size: 90, font: BX, color: CSS.cyan, glow: 'rgba(60,200,255,.8)', h: .36 }); L.position.set(mx, Y1 + .55, 0); g.add(L); g.userData.marker = [m, L]; }
  g.add(dust(700, 17, [-9, 9, -7, 7, -12, -1], [CYAN, GOLD2], [.02, .05], 8, 10, .35));
  g.userData = { ...g.userData, tr, head, pl, dots, P };
  return g;
}
function chartDraw(name, u, t) { const { tr, head, pl, dots, P } = SETS[name].userData; tr.material.uniforms.uHead.value = u; tr.material.uniforms.uT.value = t; const p = pl.at(clamp(u)); head.position.set(p.x, p.y, .02);
  const n = P.length; dots.forEach((d, i) => d.material.uniforms.uOpacity.value = u * (n - 1) >= i - .02 ? 1 : 0); return p; }
function buildTicker() {
  const g = makeSet('ticker'); const tiles = []; const r = mulberry(9);
  const HERO = { '2,1': ['NASDAQ', '▼ 5.5%'], '4,2': ['CHIP STOCKS', '▼ 12%'], '1,3': ['NVIDIA', '▼ 9%'] };
  for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
    const hero = HERO[`${i},${j}`]; const seed = r() * 1e4;
    const m = cardMesh(1.5, .9, 300, 180, (c, w, h) => { rr(c, 4, 4, w - 8, h - 8, 16); c.fillStyle = hero ? 'rgba(40,24,6,.92)' : 'rgba(8,14,40,.85)'; c.fill(); c.lineWidth = 4; c.strokeStyle = hero ? '#FFC93C' : 'rgba(80,140,255,.55)'; c.stroke();
      const rr2 = mulberry(seed | 0); c.beginPath(); let y = h * .35; for (let x = 20; x < w - 20; x += 10) { y += (rr2() - .35) * 9; c.lineTo(x, Math.min(h - 18, y)); } c.strokeStyle = hero ? '#FFE38F' : 'rgba(255,170,60,.85)'; c.lineWidth = 4; c.stroke();
      if (hero) { c.fillStyle = '#fff'; c.font = `40px ${BX}`; c.textAlign = 'left'; c.fillText(hero[0], 22, 54); c.fillStyle = '#FFC93C'; c.font = `64px ${AN}`; c.fillText(hero[1], 22, 150); }
      else { c.fillStyle = 'rgba(255,170,60,.9)'; c.font = `46px ${BX}`; c.fillText('▼', w - 60, 58); } });
    m.position.set((i - 2.5) * 1.62, (j - 2.5) * 1.0, 0); g.add(m); tiles.push({ m, i, j, hero: !!hero, d: hash(i * 7 + j * 13) });
  }
  g.userData.tiles = tiles; g.add(dust(600, 12, [-10, 10, -7, 7, -10, -1], [AMBER, GOLD2], [.02, .05], 8, 10, .35));
}

// ================= DATA CENTRE AISLE =================
function buildAisle() {
  const g = makeSet('aisle'); const rack = new THREE.BoxGeometry(.7, 2.2, 1.1); const im = new THREE.InstancedMesh(rack, M(0x0b1230, 0x000000, 0, .4, .6), 60); let k = 0; const mm = new THREE.Matrix4();
  const p = [], c = [], s = []; const r = mulberry(3);
  for (const side of [-1, 1]) for (let i = 0; i < 30; i++) { const x = side * 1.1, z = -i * 1.2; mm.makeTranslation(x, 1.1, z); im.setMatrixAt(k++, mm);
    for (let q = 0; q < 26; q++) { p.push(x - side * .36, .2 + r() * 1.9, z + (r() - .5) * 1.0); const kk = r() < .7 ? CYAN : GOLD2; c.push(kk.r * 2.2, kk.g * 2.2, kk.b * 2.2); s.push(.012 + .01 * r()); } }
  g.add(im); const leds = glowPoints(p, c, s, p.map((_, i) => r())); leds.material.uniforms.uTw.value = .7; leds.material.uniforms.uAper.value = 4; g.add(leds); g.userData.leds = leds;
  for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .03, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.5, 2.2), toneMapped: false })); l.position.set(0, 2.9, -i * 3); g.add(l); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), new THREE.MeshStandardMaterial({ color: 0x050a1c, roughness: .25, metalness: .8, map: canvasTex(128, 512, (cc, w, h) => { cc.fillStyle = '#0a1230'; cc.fillRect(0, 0, w, h); cc.strokeStyle = 'rgba(80,160,255,.6)'; cc.lineWidth = 2; for (let y = 0; y < h; y += 26) { cc.beginPath(); cc.moveTo(0, y); cc.lineTo(w, y); cc.stroke(); } cc.beginPath(); cc.moveTo(w / 2, 0); cc.lineTo(w / 2, h); cc.stroke(); }) }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -16; g.add(floor);
}

// ================= CONSTRUCTION SITE + CHIP CONVEYOR =================
function buildBuild() {
  const g = makeSet('build'); const B = [];
  for (let b = 0; b < 3; b++) { const grp = new THREE.Group(); grp.position.set((b - 1) * 2.6, 0, -b * .6); g.add(grp); const floors = [];
    for (let f = 0; f < 8; f++) { const m = box(1.8, .32, 1.4, M(0x0d1636, CYAN, .15), CYAN, 1.8, .9); m.position.y = .16 + f * .34; grp.add(m); floors.push(m); }
    const crane = new THREE.Group(); crane.add(box(.08, 3.6, .08, M(0x222a44, GOLD, .4), GOLD, 1.8)); const jib = box(2.2, .07, .07, M(0x222a44, GOLD, .4), GOLD, 1.8); jib.position.set(.7, 1.8, 0); crane.add(jib);
    crane.position.set(1.1, 1.8, .4); grp.add(crane);
    const q = lbl('?', { size: 260, font: AN, color: CSS.gold, glow: 'rgba(255,170,30,.9)', h: .9, mult: 1.2 }); q.position.set(0, 3.5, .8); grp.add(q);
    B.push({ grp, floors, jib, q, ph: b * .7 }); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#060b20'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(80,140,255,.35)'; for (let x = 0; x < w; x += 12) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }), toneMapped: false }));
  ground.rotation.x = -Math.PI / 2; g.add(ground); g.userData.B = B;
  g.add(dust(700, 41, [-12, 12, 0, 8, -10, 2], [CYAN, GOLD2], [.02, .05], 8, 8, .35));
  // conveyor: chip factory (left) -> data centre (right)
  const c = makeSet('chips'); const fac = box(1.6, 1.4, 1.4, M(0x111a3a, GOLD, .15), GOLD, 1.8); fac.position.set(-3.4, .7, 0); c.add(fac);
  const dc = box(1.8, 1.8, 1.6, M(0x0d1636, CYAN, .25), CYAN, 1.8); dc.position.set(3.4, .9, 0); c.add(dc);
  const belt = box(5.4, .12, .7, M(0x0a0f24, CYAN, .1), CYAN, 1.2, .7); belt.position.set(0, .45, 0); c.add(belt);
  const L1_ = lbl('CHIP MAKER', { size: 80, font: BX, color: '#fff', h: .34 }); L1_.position.set(-3.4, 1.75, .75); c.add(L1_);
  const L2_ = lbl('DATA CENTER', { size: 80, font: BX, color: '#fff', h: .34 }); L2_.position.set(3.4, 2.15, .85); c.add(L2_);
  const chip = new THREE.BoxGeometry(.34, .06, .34); const ci = new THREE.InstancedMesh(chip, M(0x2a2210, GOLD, 1.2, .3, .6), 60); ci.frustumCulled = false; c.add(ci); c.userData = { ci };
  c.add(dust(600, 43, [-10, 10, -2, 7, -10, 1], [CYAN, GOLD2], [.02, .05], 8, 8, .35));
}
function chipsUpdate(t, t0, t1) {
  const { ci } = SETS.chips.userData; const mm = new THREE.Matrix4(); const dt = .14, v = 2.6;
  for (let i = 0; i < 60; i++) { const ts = t0 - 2.2 + i * dt; const x = -2.7 + (t - ts) * v; const dens = lerp(1, .18, ss(seg(ts, t0 + .3, t1 - .5)));
    const vis = x > -2.7 && x < 2.6 && hash(i * 3.3) < dens; mm.makeScale(vis ? 1 : .0001, 1, vis ? 1 : .0001); mm.setPosition(x, .55, 0); ci.setMatrixAt(i, mm); }
  ci.instanceMatrix.needsUpdate = true;
}

// ================= BRICKS + HOUSES =================
function buildBricks() {
  const g = makeSet('bricks'); const fac = box(1.6, 1.2, 1.3, M(0x1a1420, GOLD, .15), GOLD, 1.6); fac.position.set(-3.2, .6, 0); g.add(fac);
  const L = lbl('BRICK MAKER', { size: 80, font: BX, color: '#fff', h: .32 }); L.position.set(-3.2, 1.55, .7); g.add(L);
  const bg = new THREE.BoxGeometry(.3, .14, .15); const bi = new THREE.InstancedMesh(bg, M(0x7a3a1a, AMBER, .55, .6, .1), 420); bi.frustumCulled = false; g.add(bi);
  // three house sites: wall bricks laid in rows (outline of a box), plus roof frames
  const sites = [[-.4, 0], [1.6, -.4], [3.6, 0]]; const slots = [];
  sites.forEach(([sx, sz], h) => { for (let row = 0; row < 7; row++) for (let k = 0; k < 16; k++) { const side = k >> 2, q = k & 3; const off = (q - 1.5) * .31 + (row % 2) * .07;
    const [x, z, ry] = side === 0 ? [sx + off, sz + .62, 0] : side === 1 ? [sx + off, sz - .62, 0] : side === 2 ? [sx - .62, sz + off * .9, Math.PI / 2] : [sx + .62, sz + off * .9, Math.PI / 2];
    slots.push({ x, y: .08 + row * .15, z, ry, h, row }); } });
  const roofs = sites.map(([sx, sz]) => { const tri = new THREE.Shape([new THREE.Vector2(-.75, 0), new THREE.Vector2(.75, 0), new THREE.Vector2(0, .6)]); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.3, bevelEnabled: false }), new THREE.MeshBasicMaterial({ visible: false })); edges(m, GOLD, 1.8); m.position.set(sx, 1.12, sz - .65); g.add(m); return m; });
  const stop = new THREE.Group(); const oct = new THREE.Mesh(new THREE.CircleGeometry(.62, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.15, .3), toneMapped: false })); oct.rotation.z = Math.PI / 8; stop.add(oct);
  const st = lbl('STOP?', { size: 130, font: AN, color: '#1a1206', h: .42 }); st.position.z = .01; stop.add(st); const pole = box(.06, 1.4, .06, M(0x333a55), null); pole.position.y = -1.2; stop.add(pole); stop.position.set(1.6, 2.6, .9); g.add(stop);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(.02, .035, .09) })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  g.add(dust(700, 51, [-12, 12, 0, 8, -10, 2], [AMBER, GOLD2], [.02, .05], 8, 8, .35));
  g.userData = { bi, slots, roofs, stop };
}
function bricksUpdate(t, tA, tStop, tEnd) {
  const { bi, slots, roofs, stop } = SETS.bricks.userData; const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), p = V(0, 0, 0);
  // build progress grows until the STOP sign, then freezes; unsold bricks pile up at the factory afterwards
  const prog = clamp((Math.min(t, tStop) - tA) / (tStop - tA)) * .75; const ns = slots.length;
  for (let i = 0; i < ns; i++) { const s = slots[i]; const order = (s.row + s.h * .15) / 7.5; const f = eo(seg(prog, order - .06, order));
    const src = V(-2.6, .9, 0); p.set(lerp(src.x, s.x, f), lerp(src.y, s.y, f) + Math.sin(Math.PI * f) * 1.2, lerp(src.z, s.z, f)); q.setFromEuler(new THREE.Euler(0, s.ry, 0)); sc.setScalar(f > 0 ? 1 : .0001); mm.compose(p, q, sc); bi.setMatrixAt(i, mm); }
  for (let i = ns; i < 420; i++) { const k = i - ns; const f = seg(t, tStop + .1 + k * .01, tStop + .35 + k * .01); const col = k % 6, lay = Math.floor(k / 6);
    p.set(-3.2 + (col - 2.5) * .32 + (lay % 2) * .08, .07 + (lay % 9) * .15, 1.0 + Math.floor(lay / 9) * .2); q.identity(); sc.setScalar(f > 0 ? 1 : .0001); p.y += (1 - eo(f)) * 1.5; mm.compose(p, q, sc); bi.setMatrixAt(i, mm); }
  bi.instanceMatrix.needsUpdate = true;
  roofs.forEach((r, i) => r.children[0].material.opacity = .3 + .7 * (1 - seg(t, tStop, tStop + .3)));
  const sp = back(seg(t, tStop - .05, tStop + .35), 2); stop.scale.setScalar(Math.max(.001, sp)); stop.visible = t > tStop - .05; faceCam(stop);
}

// ================= COINS: spending vs profits seesaw =================
function buildCoins() {
  const g = makeSet('coins'); const cg = new THREE.CylinderGeometry(.22, .22, .06, 28); const coin = M(0x6a4a10, GOLD, .9, .25, .9);
  const ci = new THREE.InstancedMesh(cg, coin, 260); ci.frustumCulled = false; g.add(ci);
  const dc = box(2.2, 1.8, 1.6, M(0x0d1636, CYAN, .3), CYAN, 1.8); dc.position.set(0, .9, -.4); g.add(dc);
  const L = lbl('AI DATA CENTERS', { size: 80, font: BX, color: '#fff', h: .3 }); L.position.set(0, 2.1, .45); g.add(L);
  const fulc = new THREE.Mesh(new THREE.ConeGeometry(.45, .9, 3), M(0x182246, GOLD, .3)); edges(fulc, GOLD, 1.8); fulc.position.set(0, .45, 0);
  const plank = box(5, .12, .7, M(0x141d40, GOLD, .25), GOLD, 2); const saw = new THREE.Group(); saw.add(plank); saw.position.set(0, .95, 0);
  const LS = lbl('AI SPENDING', { size: 90, font: BX, color: CSS.gold, h: .34 }); LS.position.set(-1.9, -.45, .45); saw.add(LS);
  const LP = lbl('PROFITS SO FAR', { size: 90, font: BX, color: CSS.cyan, h: .34 }); LP.position.set(1.9, -.45, .45); saw.add(LP);
  const sw = makeSet('saw'); sw.add(fulc); sw.add(saw); const si = new THREE.InstancedMesh(cg, coin, 60); si.frustumCulled = false; saw.add(si);
  sw.add(dust(600, 61, [-10, 10, -1, 8, -10, 1], [GOLD2, CYAN], [.02, .05], 8, 8, .35));
  g.add(dust(600, 62, [-10, 10, -1, 9, -10, 1], [GOLD2, CYAN], [.02, .05], 8, 8, .35));
  g.userData = { ci }; sw.userData = { saw, si };
}
function coinsPour(t, t0) {
  const { ci } = SETS.coins.userData; const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(0, 0, 0), sc = V(1, 1, 1);
  for (let i = 0; i < 260; i++) { const ts = t0 - 1.2 + i * .012; const life = (t - ts) / 1.1; const vis = life > 0 && life < 1; const a = hash(i) * Math.PI * 2, r = 2.6 + hash(i + 9) * 1.5;
    const sx = Math.cos(a) * r, sz = Math.sin(a) * r * .6 + .8; const k = clamp(life); p.set(lerp(sx, (hash(i + 3) - .5) * .8, k), lerp(4.5 + hash(i + 5) * 2, 1.9, k) + Math.sin(Math.PI * k) * .8, lerp(sz, -.3, k));
    q.setFromEuler(new THREE.Euler(t * 3 + i, i, t * 2)); sc.setScalar(vis ? 1 - .5 * k : .0001); mm.compose(p, q, sc); ci.setMatrixAt(i, mm); }
  ci.instanceMatrix.needsUpdate = true;
}
function sawUpdate(t, u) {
  const { saw, si } = SETS.saw.userData; const tilt = .19 * ss(seg(u, .15, .7)) + .015 * Math.sin(t * 5) * seg(u, .15, .7); saw.rotation.z = tilt;
  const mm = new THREE.Matrix4(), p = V(0, 0, 0), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  for (let i = 0; i < 60; i++) { const left = i < 50; const k = left ? i : i - 50; const stack = left ? k % 3 : 0, lev = left ? Math.floor(k / 3) : k;
    const f = eo(seg(u, (left ? .02 : .3) + lev * .012, (left ? .12 : .4) + lev * .012)); p.set(left ? -1.9 + (stack - 1) * .5 : 1.9, .1 + lev * .065 + (1 - f) * 2, 0); sc.setScalar(f > 0 ? 1 : .0001); mm.compose(p, q, sc); si.setMatrixAt(i, mm); }
  si.instanceMatrix.needsUpdate = true;
}

// ================= LEMONADE STAND =================
function buildLemon() {
  const g = makeSet('lemon'); const wood = M(0x2a2236, GOLD, .12, .7, .1);
  const counter = box(2.6, 1.0, .9, wood, GOLD, 1.5); counter.position.set(0, .5, 0); g.add(counter);
  for (const sx of [-1.2, 1.2]) { const p = box(.08, 1.4, .08, wood, GOLD, 1.5); p.position.set(sx, 1.7, .35); g.add(p); }
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .9), new THREE.MeshBasicMaterial({ map: canvasTex(512, 160, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFE38F' : '#3AD6FF'; c.fillRect(i * w / 8, 0, w / 8, h); } c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, h - 20, w, 20); }), toneMapped: false, side: THREE.DoubleSide }));
  awn.position.set(0, 2.45, .55); awn.rotation.x = -.5; g.add(awn);
  const sign = cardMesh(2.0, .5, 512, 128, (c, w, h) => { rr(c, 4, 4, w - 8, h - 8, 20); c.fillStyle = '#FFE38F'; c.fill(); c.fillStyle = '#1a1206'; c.font = `92px ${AN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LEMONADE', w / 2, h / 2 + 4); });
  sign.position.set(0, .55, .46); g.add(sign);
  const cg = new THREE.CylinderGeometry(.11, .085, .26, 16); const ci = new THREE.InstancedMesh(cg, M(0x6a5a10, new THREE.Color('#FFE860'), 1.1, .3, .1), 8); ci.frustumCulled = false; g.add(ci);
  const tags = ['WORTH: $$$$$', 'WORTH: $$'].map((s, k) => { const m = cardMesh(1.8, .62, 450, 155, (c, w, h) => { rr(c, 6, 6, w - 12, h - 12, 24); c.fillStyle = k ? 'rgba(20,30,70,.95)' : 'rgba(50,34,6,.95)'; c.fill(); c.lineWidth = 6; c.strokeStyle = k ? '#4FDCFF' : '#FFC93C'; c.stroke(); c.fillStyle = k ? '#4FDCFF' : '#FFC93C'; c.font = `84px ${AN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, w / 2, h / 2 + 4); }); m.position.set(1.9, 2.1, .6); g.add(m); return m; });
  const sales = cardMesh(1.6, .5, 400, 125, (c, w, h) => { c.fillStyle = '#fff'; c.font = `70px ${BX}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SALES', w / 2 - 40, h / 2); c.fillStyle = '#FFC93C'; c.fillText('▼', w / 2 + 90, h / 2); });
  sales.position.set(-1.9, 2.1, .6); g.add(sales);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c, w) => { const gr = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,220,120,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, toneMapped: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = .005; g.add(ground);
  g.add(dust(600, 71, [-10, 10, -1, 8, -10, 1], [GOLD2, CYAN], [.02, .05], 8, 8, .35));
  g.userData = { ci, tags, sales };
}
function lemonUpdate(t, phase, k) {   // phase 0: busy (cups vanish fast), 1: slow (cups linger)
  const { ci, tags, sales } = SETS.lemon.userData; const mm = new THREE.Matrix4(), p = V(0, 0, 0), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  const period = phase ? 2.6 : .45;
  for (let i = 0; i < 8; i++) { const ph = ((t + i * period / 8 * (phase ? 3 : 1)) % period) / period; const pop = phase ? 1 - seg(ph, .9, 1) : (ph < .7 ? eo(ph / .15) : 1 - eo((ph - .7) / .15));
    p.set(-1 + i * .29, 1.13 + (phase ? 0 : (1 - pop) * .3), .1); sc.setScalar(Math.max(.0001, pop)); mm.compose(p, q, sc); ci.setMatrixAt(i, mm); }
  ci.instanceMatrix.needsUpdate = true;
  tags[0].visible = !phase || k < .35; tags[1].visible = phase && k >= .35; const sh = phase ? (k < .35 ? 1 - .5 * ei(k / .35) : back(seg(k, .35, .6), 2)) : 1;
  tags.forEach(m => { m.scale.setScalar(Math.max(.01, sh)); faceCam(m); }); sales.visible = !!phase; sales.scale.setScalar(back(seg(k, 0, .3), 2) + .0001); faceCam(sales);
}

// ================= RATES: dial, savings jar, money moving =================
function buildRates() {
  const g = makeSet('dial');
  for (let i = 0; i < 24; i++) { const a0 = Math.PI * (1 - i / 24), a1 = Math.PI * (1 - (i + .82) / 24); const k = i / 23; const col = new THREE.Color().lerpColors(CYAN, GOLD, k).multiplyScalar(1.4);
    const s = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.05, 6, 1, a1, a0 - a1), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, side: THREE.DoubleSide })); g.add(s); s.userData.i = i; }
  const nd = new THREE.Group(); const needle = new THREE.Mesh(new THREE.PlaneGeometry(.09, 1.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.2, 2), toneMapped: false })); needle.position.y = .9; nd.add(needle); g.add(nd);
  const hub = new THREE.Mesh(new THREE.CircleGeometry(.2, 32), new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(2), toneMapped: false })); hub.position.z = .01; g.add(hub);
  const L = lbl('INTEREST RATES', { size: 100, font: AN, color: '#fff', h: .5 }); L.position.set(0, -.55, 0); g.add(L);
  const lo = lbl('LOW', { size: 80, font: BX, color: CSS.cyan, h: .3 }); lo.position.set(-1.85, -.25, 0); g.add(lo); const hi = lbl('HIGH', { size: 80, font: BX, color: CSS.gold, h: .3 }); hi.position.set(1.85, -.25, 0); g.add(hi);
  g.add(dust(600, 81, [-9, 9, -7, 7, -10, -1], [CYAN, GOLD2], [.02, .05], 8, 10, .35)); g.userData.nd = nd;
  // jar + risky box (money moving between them)
  const j = makeSet('jar'); const glass = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 2.2, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x88aaff, transparent: true, opacity: .14, roughness: .1, metalness: .1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(2, 1.1, 0); j.add(glass); const rim = new THREE.Mesh(new THREE.TorusGeometry(.9, .03, 8, 48), new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(2), toneMapped: false })); rim.rotation.x = Math.PI / 2; rim.position.set(2, 2.2, 0); j.add(rim);
  const rim2 = rim.clone(); rim2.position.y = 0; j.add(rim2);
  const JL = lbl('SAFE SAVINGS', { size: 90, font: BX, color: CSS.cyan, h: .36 }); JL.position.set(2, 2.65, 0); j.add(JL);
  const risky = box(1.7, 1.5, 1.2, M(0x1a1430, AMBER, .25), AMBER, 1.8); risky.position.set(-2.1, .75, 0); j.add(risky);
  const spark = cardMesh(1.3, .7, 260, 140, (c, w, h) => { c.beginPath(); let y = 30; const r = mulberry(5); for (let x = 10; x < w - 10; x += 12) { y += (r() - .3) * 16; c.lineTo(x, Math.min(h - 10, Math.max(10, y))); } c.strokeStyle = '#FFB347'; c.lineWidth = 7; c.stroke(); });
  spark.position.set(-2.1, .8, .62); j.add(spark);
  const RL = lbl('RISKY STOCKS', { size: 90, font: BX, color: CSS.gold, h: .36 }); RL.position.set(-2.1, 1.95, 0); j.add(RL);
  const cg = new THREE.CylinderGeometry(.16, .16, .05, 24); const ci = new THREE.InstancedMesh(cg, M(0x6a4a10, GOLD, .9, .25, .9), 140); ci.frustumCulled = false; j.add(ci);
  const pct = lbl('+%', { size: 160, font: AN, color: CSS.gold2, glow: 'rgba(255,170,30,.9)', h: .7 }); pct.position.set(2, 1.4, .95); j.add(pct);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(.02, .035, .09) })); ground.rotation.x = -Math.PI / 2; j.add(ground);
  j.add(dust(600, 82, [-10, 10, -1, 8, -10, 1], [CYAN, GOLD2], [.02, .05], 8, 8, .35)); j.userData = { ci, pct };
}
function jarUpdate(t, t0, mode) {   // mode 0: savings jar grows ("pays more"); 1: coins arc from risky stocks into the jar
  const { ci, pct } = SETS.jar.userData; const mm = new THREE.Matrix4(), p = V(0, 0, 0), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  for (let i = 0; i < 140; i++) {
    let vis = false;
    if (i < 40) { const lev = i; const f = mode ? 1 : eo(seg(t, t0 + lev * .035, t0 + lev * .035 + .2)); p.set(2 + (hash(i) - .5) * .5, .05 + lev * .05 + (1 - f) * 1.5, (hash(i + 1) - .5) * .5); vis = f > 0; q.identity(); }
    else { const k = i - 40; const ts = t0 + k * .02 - .2; const life = (t - ts) / .7; vis = mode && life > 0 && life < 1; const u = clamp(life);
      p.set(lerp(-2.1, 2, u), 1.5 + Math.sin(Math.PI * u) * 1.6 + (1 - u) * 0, (hash(k) - .5) * .5); q.setFromEuler(new THREE.Euler(u * 6, 0, u * 4)); }
    sc.setScalar(vis ? 1 : .0001); mm.compose(p, q, sc); ci.setMatrixAt(i, mm);
  }
  ci.instanceMatrix.needsUpdate = true; pct.visible = !mode; pct.scale.setScalar(Math.max(.01, back(seg(t, t0 + .5, t0 + .9), 2))); faceCam(pct);
}

// ================= CANDY LINE + ICE-CREAM TRUCK =================
function buildCandy() {
  const g = makeSet('candy');
  const stand = box(1.6, 1.2, .9, M(0x241a36, VIOLET, .4), new THREE.Color('#B9A6FF'), 1.4); stand.position.set(-3, .6, 0); g.add(stand);
  const cs = cardMesh(1.5, .45, 400, 120, (c, w, h) => { rr(c, 4, 4, w - 8, h - 8, 18); c.fillStyle = '#B9A6FF'; c.fill(); c.fillStyle = '#140c2a'; c.font = `86px ${AN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CANDY', w / 2, h / 2 + 4); }); cs.position.set(-3, 1.45, .2); g.add(cs);
  const truck = new THREE.Group(); const body = box(2.3, 1.4, 1.2, M(0xdde8ff, CYAN, .25, .4, .2), CYAN, 1.8); body.position.set(0, 1.05, 0); truck.add(body);
  const cab = box(.8, .9, 1.1, M(0xbcd0ff, CYAN, .2), CYAN, 1.8); cab.position.set(-1.5, .8, 0); truck.add(cab);
  for (const [x, z] of [[-1.4, .55], [-1.4, -.55], [.7, .55], [.7, -.55]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .14, 20), M(0x111)); w.rotation.x = Math.PI / 2; w.position.set(x, .24, z); truck.add(w); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.3, .8, 20), M(0xc08a3a, GOLD, .5)); cone.rotation.z = Math.PI; cone.position.set(.2, 2.15, 0); truck.add(cone);
  const scoop = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), M(0xffd9ec, new THREE.Color('#FF9AD5'), .8)); scoop.position.set(.2, 2.65, 0); truck.add(scoop);
  const ts = cardMesh(1.9, .42, 480, 106, (c, w, h) => { c.fillStyle = '#0b1433'; c.font = `78px ${AN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ICE CREAM', w / 2, h / 2 + 4); }); ts.position.set(.1, 1.15, .62); truck.add(ts);
  g.add(truck); const kids = []; const cols = [CYAN, GOLD2, new THREE.Color('#B9A6FF'), new THREE.Color('#9CFFCF'), GOLD, new THREE.Color('#FF9AD5')];
  for (let i = 0; i < 7; i++) { const k = new THREE.Group(); const c = cols[i % cols.length]; const b = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .32, 6, 12), M(0x182040, c, .6)); b.position.y = .36; k.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 12), M(0x223060, c, .9)); h.position.y = .82; k.add(h); g.add(k); kids.push(k); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(.02, .035, .09) })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  g.add(dust(600, 91, [-10, 10, -1, 8, -10, 1], [CYAN, GOLD2], [.02, .05], 8, 8, .35)); g.userData = { truck, kids };
}
function candyUpdate(t, tArr, tGo) {
  const { truck, kids } = SETS.candy.userData; const a = eo(seg(t, tArr, tArr + .6)); truck.position.set(lerp(8, 2.6, a), Math.abs(Math.sin(t * 9)) * .02 * (1 - a), 0);
  kids.forEach((k, i) => { const line = V(-2 + i * .5, 0, .2); const tgt = V(1.4 + (i % 4) * .4 - .3, 0, 1.1 + Math.floor(i / 4) * .45); const f = ss(seg(t, tGo + i * .09, tGo + i * .09 + .55));
    k.position.copy(line.lerp(tgt, f)); k.position.y = Math.abs(Math.sin((t + i) * (f > 0 && f < 1 ? 14 : 3))) * (f > 0 && f < 1 ? .18 : .03); k.rotation.y = f > 0 && f < 1 ? -1.2 : -.4 * f; });
}

// ================= SPARK + DRY WOOD =================
function buildFire() {
  const g = makeSet('fire'); const wood = M(0x3a2410, AMBER, .25, .8, 0); const r = mulberry(13);
  for (let i = 0; i < 14; i++) { const l = cyl(.16, .16, 2.2, wood, 14); const row = i < 6 ? 0 : i < 11 ? 1 : 2; const k = row === 0 ? i : row === 1 ? i - 6 : i - 11; const n = [6, 5, 3][row];
    l.rotation.z = Math.PI / 2; l.rotation.y = (r() - .5) * .3; l.position.set(0, .17 + row * .29, (k - (n - 1) / 2) * .33); edges(l, AMBER, 1.2, .6); g.add(l); }
  const WL = lbl('AI WORRIES', { size: 100, font: AN, color: CSS.gold, h: .45 }); WL.position.set(0, -.35, 1.5); WL.rotation.x = -.3; g.add(WL);
  const SL = lbl('ELECTION', { size: 90, font: BX, color: '#fff', glow: 'rgba(255,200,120,.9)', h: .32 }); g.add(SL);
  const spark = pts1([0, 0, 0], [3, 2.4, 1.4], [.14]); g.add(spark);
  const N = 500, p = [], c = [], s = []; for (let i = 0; i < N; i++) { p.push(0, 0, 0); c.push(2.4, 1.2 + r() * .8, .3); s.push(.04 + .06 * r()); }
  const fl = glowPoints(p, c, s, p.map(() => r())); fl.material.uniforms.uAper.value = 0; fl.material.uniforms.uTw.value = .3; g.add(fl);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (cc, w) => { const gr = cc.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,150,50,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cc.fillStyle = gr; cc.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, toneMapped: false }));
  ground.rotation.x = -Math.PI / 2; g.add(ground); g.userData = { spark, fl, SL, ground, N };
  g.add(dust(500, 93, [-10, 10, -1, 8, -10, 1], [AMBER, GOLD2], [.02, .05], 8, 8, .35));
}
function fireUpdate(t, tHit) {
  const { spark, fl, SL, ground, N } = SETS.fire.userData; const k = seg(t, tHit - .8, tHit);
  const sp = V(lerp(-2.2, 0, k), lerp(4.2, .9, ei(k)) + Math.sin(k * 9) * .08, lerp(.6, 0, k)); spark.position.copy(sp); spark.visible = t < tHit + .05;
  SL.position.copy(sp).add(V(-.1, .45, 0)); SL.visible = t < tHit + .1; faceCam(SL);
  const pos = fl.geometry.attributes.position; const on = seg(t, tHit, tHit + .5);
  for (let i = 0; i < N; i++) { const life = ((t - tHit) * (.9 + hash(i) * .6) + hash(i + 7)) % 1; const grow = on * (hash(i + 2) < on ? 1 : 0); const a = hash(i + 3) * Math.PI * 2, r = (1 - life) * (.3 + .9 * hash(i + 4)) * grow;
    pos.setXYZ(i, Math.cos(a) * r * 1.2, .6 + life * 2.4 * grow + (grow ? 0 : -50), Math.sin(a) * r * .7); }
  pos.needsUpdate = true; fl.material.uniforms.uOpacity.value = on; ground.material.opacity = .4 + .6 * on; pointL.position.set(0, 1.2, .8); pointL.intensity = 6 * on * (.85 + .15 * Math.sin(t * 23));
}

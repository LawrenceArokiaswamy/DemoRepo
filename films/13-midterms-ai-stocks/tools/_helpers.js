function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c, g }; return t; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function label3d(text, { size = 120, font = BX, color = '#fff', glow = null, pad = 30, h = .3, mult = 1, bg = null, border = null } = {}) {
  const m = document.createElement('canvas').getContext('2d'); m.font = `${size}px ${font}`; const tw = Math.ceil(m.measureText(text).width);
  const cw = tw + pad * 2, ch = Math.ceil(size * 1.45) + pad;
  const tex = canvasTex(cw, ch, (g, w, hh) => {
    if (bg) { rr(g, 6, 6, w - 12, hh - 12, Math.min(40, hh / 2 - 6)); g.fillStyle = bg; g.fill(); if (border) { g.lineWidth = 6; g.strokeStyle = border; g.stroke(); } }
    g.font = `${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = glow; g.shadowBlur = size * .25; }
    g.fillStyle = color; g.fillText(text, w / 2, hh / 2 + size * .04);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false });
  mat.color.setScalar(mult);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * cw / ch, h), mat); mesh.userData.aspect = cw / ch; return mesh;
}
function cardMesh(w, h, pxw, pxh, draw) { const t = canvasTex(pxw, pxh, draw); const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, fog: false }); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); }
// soft glowing points with fake depth of field (circle of confusion grows the sprite and spreads its energy)
const ptsVS = `attribute vec3 color; attribute float size; attribute float phase; uniform float uPx, uFocus, uAper, uTime, uTw, uScale; varying vec3 vC; varying float vA;
  void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float z = max(.0005, -mv.z);
    float s = size * uPx * uScale / z; float coc = abs(1./uFocus - 1./z) * uAper;
    float tw = 1. + uTw * sin(uTime * 3.1 + phase * 6.283);
    gl_PointSize = clamp(s + coc, 1.5, 180.); vA = clamp(s*s / ((s+coc)*(s+coc)), .02, 1.) * tw; vC = color;
    gl_Position = projectionMatrix * mv; }`;
const ptsFS = `uniform float uOpacity; varying vec3 vC; varying float vA;
  void main(){ vec2 d = gl_PointCoord - .5; float r = length(d) * 2.; if (r > 1.) discard;
    float a = exp(-r*r*3.5) + .6 * exp(-r*r*18.); gl_FragColor = vec4(vC * a * vA * uOpacity, 1.); }`;
function glowPoints(pos, col, size, phase) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(size, 1)); g.setAttribute('phase', new THREE.Float32BufferAttribute(phase, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uPx: { value: H / 2 }, uFocus: { value: 4 }, uAper: { value: 30 }, uTime: { value: 0 }, uTw: { value: .25 }, uOpacity: { value: 1 }, uScale: { value: 1 } },
    vertexShader: ptsVS, fragmentShader: ptsFS, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
function dust(n, seed, box, cols, sz, focus, aper, bright = .5) {
  const r = mulberry(seed), p = [], c = [], s = [], ph = [];
  for (let i = 0; i < n; i++) { p.push(lerp(box[0], box[1], r()), lerp(box[2], box[3], r()), lerp(box[4], box[5], r())); const k = cols[Math.floor(r() * cols.length)].clone().multiplyScalar(bright * (.4 + .8 * r())); c.push(k.r, k.g, k.b); s.push(lerp(sz[0], sz[1], r() * r())); ph.push(r()); }
  const d = glowPoints(p, c, s, ph); d.material.uniforms.uFocus.value = focus; d.material.uniforms.uAper.value = aper; return d;
}
// glyph particles (0/1 bits) with per-point position + alpha, written on the CPU every frame
function glyphAtlas(chars) { return canvasTex(64 * chars.length, 64, (g) => { g.font = `58px ${BX}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; for (let i = 0; i < chars.length; i++) g.fillText(chars[i], 32 + i * 64, 35); }); }
function bitCloud(n, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('glyph', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); g.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(n).fill(.010), 1));
  const cc = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const k = hash(i * 1.7) < .7 ? col[0] : col[1]; cc[i * 3] = k.r; cc[i * 3 + 1] = k.g; cc[i * 3 + 2] = k.b; } g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
  const m = new THREE.ShaderMaterial({ uniforms: { uPx: { value: H / 2 }, uAtlas: { value: glyphAtlas('01') }, uFocus: { value: .05 }, uAper: { value: .6 }, uOpacity: { value: 1 } },
    vertexShader: `attribute float alpha; attribute float glyph; attribute float size; attribute vec3 color; uniform float uPx, uFocus, uAper; varying float vG; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float z = max(.0005,-mv.z); float s = size * uPx / z; float coc = abs(1./uFocus - 1./z) * uAper;
        gl_PointSize = clamp(s + coc, 1., 160.); vA = alpha * clamp(s*s/((s+coc)*(s+coc)), .06, 1.); vG = glyph; vC = color; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uAtlas; uniform float uOpacity; varying float vG; varying vec3 vC; varying float vA;
      void main(){ vec2 uv = vec2((vG + gl_PointCoord.x) / 2., 1. - gl_PointCoord.y); float a = texture2D(uAtlas, uv).a; vec2 d = gl_PointCoord - .5; float halo = exp(-dot(d,d) * 14.) * .25;
        gl_FragColor = vec4(vC * (a * 1.8 + halo) * vA * uOpacity, 1.); }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
// polyline helper: arc-length parametrised points along [[x,y],...] (board units) at height z
function poly(pts, z = 0) { const P = pts.map(p => V(p[0], p[1], z)); const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1])); const tot = L[L.length - 1];
  return { P, L, tot, at(s, out = V(0, 0, 0)) { s = clamp(s) * tot; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const k = (s - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]); return out.copy(P[i - 1]).lerp(P[i], clamp(k)); },
    dir(s) { s = clamp(s) * tot; let i = 1; while (i < L.length - 1 && L[i] < s) i++; return P[i].clone().sub(P[i - 1]).normalize(); } }; }
// glowing light trail along a polyline: a flat ribbon whose brightness follows a moving head
function trail(pl, width, col, z) {
  const pos = [], s = [], idx = []; const N = 160;
  for (let i = 0; i <= N; i++) { const u = i / N, p = pl.at(u), d = pl.dir(Math.min(u, .999)); const nx = -d.y * width / 2, ny = d.x * width / 2; pos.push(p.x + nx, p.y + ny, z, p.x - nx, p.y - ny, z); s.push(u, u); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('s', new THREE.Float32BufferAttribute(s, 1)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ uniforms: { uHead: { value: -1 }, uTail: { value: .25 }, uCol: { value: col.clone() }, uBase: { value: 0 }, uT: { value: 0 }, uLen: { value: pl.tot } },
    vertexShader: `attribute float s; varying float vS; void main(){ vS = s; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float uHead, uTail, uBase, uT, uLen; uniform vec3 uCol; varying float vS;
      void main(){ float d = uHead - vS; float a = d >= 0. ? exp(-d / uTail) : exp(d * 400.); a = a * step(-.02, d);
        float dash = .55 + .45 * sin((vS * uLen * 900.) - uT * 30.); float b = uBase * (.6 + .4 * dash);
        gl_FragColor = vec4(uCol * (a * 1.5 + b), 1.); }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(g, m);
}
// Catmull-Rom through timed keys [[t, pos, look], ...]
function camPath(keys, t) {
  if (t <= keys[0][0]) return [keys[0][1].clone(), keys[0][2].clone()];
  if (t >= keys[keys.length - 1][0]) { const k = keys[keys.length - 1]; return [k[1].clone(), k[2].clone()]; }
  let i = 0; while (keys[i + 1][0] < t) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
  const u = (t - k1[0]) / (k2[0] - k1[0]);
  const cr = (a, b, c, d) => { const u2 = u * u, u3 = u2 * u; return b.clone().multiplyScalar(2).add(c.clone().sub(a).multiplyScalar(u)).add(a.clone().multiplyScalar(2).sub(b.clone().multiplyScalar(5)).add(c.clone().multiplyScalar(4)).sub(d).multiplyScalar(u2)).add(b.clone().multiplyScalar(3).sub(a).sub(c.clone().multiplyScalar(3)).add(d).multiplyScalar(u3)).multiplyScalar(.5); };
  return [cr(k0[1], k1[1], k2[1], k3[1]), cr(k0[2], k1[2], k2[2], k3[2])];
}

// ---------------- data ----------------
let F, CAPS, GEO; const FONTS = [[AN, 'fonts/Anton-Regular.ttf'], [BX, 'fonts/BarlowCondensed-ExtraBold.ttf'], [BB, 'fonts/BarlowCondensed-Bold.ttf'], [BS, 'fonts/BarlowCondensed-SemiBold.ttf']];
const QUESTION = 'Can I eat pizza for breakfast?';
const QTOK = [['Can', 8475], ['I', 357], ['eat', 11237], ['pizza', 27941], ['for', 395], ['breakfast', 16356], ['?', 30]];   // GPT-4o word list (o200k_base)
const REPLY = ['Technically,', 'yes!', '🍕', 'Just', 'maybe', 'add', 'some', 'fruit.'];
const word = (id, w) => { const ws = F.words[id]; const k = ws.findIndex(x => x[0].toLowerCase().replace(/[^a-z']/g, '') === w); return k < 0 ? ws[0][1] : ws[k][1]; };
const L0 = id => F.lines[id][0], L1 = id => F.lines[id][1];


// Real-3D scenes for the SOTI film. Every scene is a pure function of time: update(t) → no randomness at render time.
import * as THREE from 'three';
const DPR = Math.max(1, Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
const DPRS = DPR.toFixed(2), LINEBOOST = (DPR > 1 ? 1.4 : 1).toFixed(2);

export const C = {
  blue: new THREE.Color('#009AD4'), sky: new THREE.Color('#2FB7EA'), deep: new THREE.Color('#0C74AA'),
  green: new THREE.Color('#7AC142'), red: new THREE.Color('#ff3d4f'), white: new THREE.Color('#e9f7ff'), warm: new THREE.Color('#ffd9a0'),
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  expoInOut: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  expoOut: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
};
export function rng(seed) { // mulberry32 — deterministic
  return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* ---------- shared materials ---------- */
// Lines that draw themselves: each vertex carries an "ord" (0..1); fragments past uProg are discarded, with a hot leading edge.
function revealLineMat({ color = C.sky, head = C.white, hot = C.red, fogFar = 60, opacity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 1 }, uColor: { value: color.clone() }, uHead: { value: head.clone() }, uHot: { value: hot.clone() },
      uHotMix: { value: 0 }, uHotPulse: { value: 0 }, uOpacity: { value: opacity }, uFogFar: { value: fogFar }, uGain: { value: 1 } },
    vertexShader: `attribute float ord; attribute float hot; varying float vOrd; varying float vHot; varying float vDepth;
      void main(){ vOrd=ord; vHot=hot; vec4 mv=modelViewMatrix*vec4(position,1.); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uProg,uOpacity,uFogFar,uHotMix,uHotPulse,uGain; uniform vec3 uColor,uHead,uHot;
      varying float vOrd; varying float vHot; varying float vDepth;
      void main(){ if(vOrd>uProg) discard; float h=smoothstep(uProg-.035,uProg,vOrd)*step(uProg,.999);
        vec3 base=mix(uColor,uHot,vHot*uHotMix); float glow=1.+vHot*uHotMix*uHotPulse*2.5;
        vec3 c=mix(base*glow,uHead*3.,h); float fog=clamp(1.-vDepth/uFogFar,.08,1.);
        gl_FragColor=vec4(c*uGain*${LINEBOOST},uOpacity*fog*(.55+.45*vHot*uHotMix+.45*h)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
function pointsMat({ size = 3, opacity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: size }, uOpacity: { value: opacity }, uRed: { value: 0 }, uDim: { value: 1 } },
    vertexShader: `attribute vec3 color; attribute float sz; attribute float ph; attribute float red; uniform float uTime,uSize,uRed;
      varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
        float tw=.65+.35*sin(uTime*2.3+ph*6.283); vC=mix(color,vec3(1.,.24,.31),red*uRed); vA=tw;
        gl_PointSize=(uSize*sz*(1.+red*uRed*1.6)*(320./max(1.,-mv.z)))*${DPRS}; }`,
    fragmentShader: `varying vec3 vC; varying float vA; uniform float uOpacity,uDim;
      void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); if(d>.5) discard; float a=smoothstep(.5,.0,d); a=a*a;
        gl_FragColor=vec4(vC*(1.+a*1.5)*uDim,a*vA*uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
// Textured night sky: gradient + faint nebula noise + stars. Never a flat colour.
function skyDome(top = '#06182a', bottom = '#010307', nebula = C.deep, seed = 1) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color(top) }, uBot: { value: new THREE.Color(bottom) }, uNeb: { value: nebula.clone() }, uSeed: { value: seed }, uDim: { value: 1 } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uTop,uBot,uNeb; uniform float uSeed,uDim; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7))+uSeed)*43758.5453); }
      float n(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){ float y=vP.y*.5+.5; vec3 c=mix(uBot,uTop,smoothstep(.2,.9,y));
        float f=n(vP*3.)*.5+n(vP*7.)*.3+n(vP*15.)*.2; c+=uNeb*pow(f,3.)*.35;
        vec3 sp=floor(vP*420.); float s=h(sp); c+=vec3(.8,.9,1.)*step(.9975,s)*(.4+.6*h(sp+1.));
        gl_FragColor=vec4(c*uDim,1.); }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m);
}
function textTexture(lines, { w = 2048, h = 1024, bg = null } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  for (const L of lines) {
    g.font = `${L.weight || 700} ${L.size}px ${L.font || 'Rubik'}`; g.fillStyle = L.color || '#fff'; g.textAlign = L.align || 'center'; g.textBaseline = 'middle';
    if (L.spacing) g.letterSpacing = L.spacing + 'px';
    if (L.glow) { g.shadowColor = L.glow; g.shadowBlur = L.blur || 30; }
    g.fillText(L.text, L.x ?? w / 2, L.y); g.shadowBlur = 0; g.letterSpacing = '0px';
  }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}
// Build a LineSegments geometry from a list of [ax,ay,az,bx,by,bz,ord,hot] segments, subdividing long ones so they draw smoothly.
function segGeometry(segs, maxLen = 0.45) {
  const pos = [], ord = [], hot = [];
  for (const s of segs) {
    const [ax, ay, az, bx, by, bz, o0, o1, hh] = s; const len = Math.hypot(bx - ax, by - ay, bz - az); const n = Math.max(1, Math.ceil(len / maxLen));
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      pos.push(ax + (bx - ax) * u0, ay + (by - ay) * u0, az + (bz - az) * u0, ax + (bx - ax) * u1, ay + (by - ay) * u1, az + (bz - az) * u1);
      const om = o0 + (o1 - o0) * (u0 + u1) / 2; ord.push(om, om); hot.push(hh, hh);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('ord', new THREE.Float32BufferAttribute(ord, 1));
  g.setAttribute('hot', new THREE.Float32BufferAttribute(hot, 1));
  return g;
}

/* ================= HOSPITAL ================= */
export function makeHospital(aspect = 16 / 9) {
  const P = aspect < 1;
  const scene = new THREE.Scene(); scene.add(skyDome('#071a2c', '#010308', C.deep, 3));
  const cam = new THREE.PerspectiveCamera(P ? 46 : 38, aspect, 0.1, 900);
  const R = rng(7); const segs = []; const H = 11; const windows = [];
  const ordOf = (y, x, z) => clamp(0.86 * (y / H) + 0.1 * ((Math.atan2(z, x) / Math.PI + 1) / 2) + R() * 0.02, 0, 0.97);
  const S = (a, b, hot = 0, o = null) => { const o0 = o ?? ordOf(a[1], a[0], a[2]), o1 = o ?? ordOf(b[1], b[0], b[2]); segs.push([...a, ...b, o0, o1, hot]); };
  function block(cx, cz, w, d, floors, fh = 1, y0 = 0, hotFloor = -1) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, top = y0 + floors * fh;
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) S([x, y0, z], [x, top, z]);
    for (let i = 0; i <= floors; i++) {
      const y = y0 + i * fh; const hot = hotFloor >= 0 && (i === hotFloor || i === hotFloor + 1) ? 1 : 0;
      S([x0, y, z0], [x1, y, z0], hot); S([x1, y, z0], [x1, y, z1], hot); S([x1, y, z1], [x0, y, z1], hot); S([x0, y, z1], [x0, y, z0], hot);
    }
    const mull = (ax, az, bx, bz) => { // vertical mullions + window points along a face
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(L / 0.62));
      for (let i = 0; i < floors; i++) {
        const y = y0 + i * fh, hot = i === hotFloor ? 1 : 0;
        for (let k = 1; k < n; k++) { const u = k / n; const x = ax + (bx - ax) * u, z = az + (bz - az) * u; S([x, y + 0.12, z], [x, y + fh - 0.12, z], hot); }
        for (let k = 0; k < n; k++) { const u = (k + 0.5) / n; windows.push([ax + (bx - ax) * u, y + fh * 0.5, az + (bz - az) * u, hot, R()]); }
      }
    };
    mull(x0, z1, x1, z1); mull(x1, z1, x1, z0); mull(x1, z0, x0, z0); mull(x0, z0, x0, z1);
    return top;
  }
  const top = block(0, 0, 6, 4, 10, 1, 0, 3);       // main tower — floor 3 is Ward 4
  block(6.1, 0.6, 5.2, 3.4, 4); block(-5.6, 0.6, 4.4, 3.4, 5); block(0, 3.6, 3.2, 2.2, 1, 1.1); // wings + entrance
  // helipad + cross on roof (drawn last)
  for (let i = 0; i < 48; i++) { const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2;
    S([Math.cos(a0) * 1.5, top + 0.02, Math.sin(a0) * 1.5], [Math.cos(a1) * 1.5, top + 0.02, Math.sin(a1) * 1.5], 0, 0.95 + i / 48 * 0.04); }
  S([-0.45, top + .02, -0.6], [-0.45, top + .02, 0.6], 0, .99); S([0.45, top + .02, -0.6], [0.45, top + .02, 0.6], 0, .99); S([-0.45, top + .02, 0], [0.45, top + .02, 0], 0, .99);
  const cx = [[-.25, 8.2], [.25, 8.2], [.25, 8.75], [.8, 8.75], [.8, 9.25], [.25, 9.25], [.25, 9.8], [-.25, 9.8], [-.25, 9.25], [-.8, 9.25], [-.8, 8.75], [-.25, 8.75]];
  for (let i = 0; i < cx.length; i++) { const a = cx[i], b = cx[(i + 1) % cx.length]; S([a[0], a[1], 2.03], [b[0], b[1], 2.03], 0, 0.93); }
  const bmat = revealLineMat({ color: C.sky, fogFar: 70 }); const building = new THREE.LineSegments(segGeometry(segs), bmat); scene.add(building);

  // ground grid
  const gsegs = []; for (let i = -30; i <= 30; i++) { gsegs.push([i, 0, -30, i, 0, 30, 0, 0, 0], [-30, 0, i, 30, 0, i, 0, 0, 0]); }
  const gmat = revealLineMat({ color: C.deep, fogFar: 45, opacity: 0.35 }); scene.add(new THREE.LineSegments(segGeometry(gsegs, 2), gmat));

  // windows (lights) + ward devices
  const wp = [], wc = [], ws = [], wph = [], wred = [];
  for (const [x, y, z, hot, r] of windows) { wp.push(x, y, z); const c = hot ? C.red : (r > 0.55 ? C.warm : C.sky); wc.push(c.r, c.g, c.b); ws.push(hot ? 0.9 : 0.55); wph.push(r); wred.push(hot); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
  wg.setAttribute('sz', new THREE.Float32BufferAttribute(ws, 1)); wg.setAttribute('ph', new THREE.Float32BufferAttribute(wph, 1)); wg.setAttribute('red', new THREE.Float32BufferAttribute(wred, 1));
  const wmat = pointsMat({ size: 0.16 }); const winPts = new THREE.Points(wg, wmat); scene.add(winPts);
  // 40 scanners inside floor 3
  const dp = [], dc = [], ds = [], dph = [], dr = []; for (let i = 0; i < 40; i++) { const x = -2.5 + (i % 10) * 0.55, z = -1.4 + Math.floor(i / 10) * 0.9; dp.push(x, 3.35 + R() * 0.2, z); dc.push(1, .25, .3); ds.push(1); dph.push(R()); dr.push(1); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('color', new THREE.Float32BufferAttribute(dc, 3));
  dg.setAttribute('sz', new THREE.Float32BufferAttribute(ds, 1)); dg.setAttribute('ph', new THREE.Float32BufferAttribute(dph, 1)); dg.setAttribute('red', new THREE.Float32BufferAttribute(dr, 1));
  const dmat = pointsMat({ size: 0.22 }); dmat.uniforms.uRed.value = 0; const devPts = new THREE.Points(dg, dmat); scene.add(devPts);
  // floor-3 glow volume
  const glowMat = new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(6.08, 0.98, 4.08), glowMat); glow.position.set(0, 3.5, 0); scene.add(glow);
  // drifting dust
  const N = 1400, pp = [], pc = [], psz = [], pph = [], pr = []; for (let i = 0; i < N; i++) { pp.push((R() - .5) * 50, R() * 18, (R() - .5) * 50); const c = C.sky; pc.push(c.r, c.g, c.b); psz.push(0.3 + R() * 0.7); pph.push(R()); pr.push(0); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
  pg.setAttribute('sz', new THREE.Float32BufferAttribute(psz, 1)); pg.setAttribute('ph', new THREE.Float32BufferAttribute(pph, 1)); pg.setAttribute('red', new THREE.Float32BufferAttribute(pr, 1));
  const dust = new THREE.Points(pg, pointsMat({ size: 0.05, opacity: 0.5 })); scene.add(dust);

  function update(t, mode) {
    const mats = [wmat, dmat, dust.material]; mats.forEach((m) => (m.uniforms.uTime.value = t));
    dust.position.y = -((t * 0.25) % 2);
    let a, r, h, ty;
    if (mode === 'online') { // calm, all blue, everything lit, pull back
      const p = ease.out(prog(t, 51.1, 53.6));
      bmat.uniforms.uProg.value = 1; bmat.uniforms.uHotMix.value = 1; bmat.uniforms.uHot.value.copy(C.green); bmat.uniforms.uHotPulse.value = 0.6 + 0.4 * Math.sin(t * 6);
      gmat.uniforms.uProg.value = 1; wmat.uniforms.uRed.value = 0; wmat.uniforms.uOpacity.value = 1; dmat.uniforms.uRed.value = 0; dmat.uniforms.uOpacity.value = 1;
      glowMat.color.copy(C.green); glowMat.opacity = 0.16;
      a = 0.5 + p * 0.5; r = P ? 22 + p * 14 : 13 + p * 13; h = P ? 5 + p * 6 : 4 + p * 5; ty = P ? 5.6 : 4.5;
    } else {
      const draw = ease.inOut(prog(t, 0.15, 7.6)); bmat.uniforms.uProg.value = draw; gmat.uniforms.uProg.value = ease.out(prog(t, 0, 3));
      const died = 0.8 + 2.9;                      // nurse: "...just died!"
      const blueT = prog(t, 11.7 + 1.9, 11.7 + 3.0); // stella: "every device on Ward Four" → red calms to blue
      const hotOn = prog(t, died - 0.3, died + 0.2);
      bmat.uniforms.uHotMix.value = hotOn; bmat.uniforms.uHot.value.copy(C.red).lerp(C.sky, blueT);
      const pulse = 0.5 + 0.5 * Math.sin(t * 9.0) * (Math.sin(t * 23.0) > -0.6 ? 1 : 0.2); // nervous flicker
      bmat.uniforms.uHotPulse.value = (1 - blueT) * pulse + blueT * (0.7 + 0.3 * Math.sin(t * 3));
      wmat.uniforms.uOpacity.value = prog(t, 4, 7.5) * 0.9; wmat.uniforms.uRed.value = hotOn * (1 - blueT);
      dmat.uniforms.uOpacity.value = hotOn; dmat.uniforms.uRed.value = 1 - blueT;
      glowMat.color.copy(C.red).lerp(C.sky, blueT); glowMat.opacity = hotOn * (0.08 + 0.12 * pulse * (1 - blueT) + 0.08 * blueT);
      // camera: slow orbit (call) → push in on floor 3 (Stella)
      const push = ease.inOut(prog(t, 11.7, 17.5)); const rush = ease.in(prog(t, 16.9, 17.586));
      a = -0.95 + t * 0.034; r = P ? 32 - t * 0.3 - push * 12 - rush * 4 : 21 - t * 0.25 - push * 7.5 - rush * 3; h = (P ? 7.4 : 6.2) - t * 0.1 - push * 2.2; ty = (P ? 6.4 : 5.0) - push * (P ? 2.4 : 1.4);
      // handheld nervousness during the call
      const shake = (1 - prog(t, 11, 12.5)) * 0.06; a += Math.sin(t * 1.7) * shake * 0.3; h += Math.sin(t * 2.9) * shake;
    }
    cam.position.set(Math.sin(a) * r, h, Math.cos(a) * r); cam.lookAt(0, ty, 0);
  }
  return { scene, cam, update, bloom: 1.25 };
}

/* ================= BLACK HOLE on a warped grid, with text wrapped around it in 3D ================= */
export function makeBlackHole(aspect = 16 / 9) {
  const P = aspect < 1;
  const scene = new THREE.Scene(); const sky = skyDome('#040b16', '#000104', C.blue, 9); scene.add(sky);
  const cam = new THREE.PerspectiveCamera(P ? 60 : 42, aspect, 0.1, 900);
  // warped grid — vertices displaced in the shader into a gravity well
  const gsegs = []; const N = 44, step = 1;
  for (let i = -N; i <= N; i++) { gsegs.push([i * step, 0, -N * step, i * step, 0, N * step, 0, 0, 0], [-N * step, 0, i * step, N * step, 0, i * step, 0, 0, 0]); }
  const gg = segGeometry(gsegs, 0.25);
  const gmat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDepth: { value: 7 }, uColor: { value: C.blue.clone() }, uHot: { value: C.sky.clone() }, uDim: { value: 1 } },
    vertexShader: `uniform float uTime,uDepth; varying float vR; varying float vD;
      void main(){ vec3 p=position; float r=length(p.xz); vR=r;
        p.y = -uDepth/(1.+r*r*.09) + sin(r*1.1-uTime*3.2)*.12*exp(-r*.06);
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor,uHot; uniform float uDim; varying float vR; varying float vD;
      void main(){ float k=exp(-vR*.13); vec3 c=mix(uColor*.55,uHot*1.8,k); float fog=clamp(1.-vD/70.,0.,1.);
        gl_FragColor=vec4(c*uDim*${LINEBOOST},(.25+.75*k)*fog*uDim); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const grid = new THREE.LineSegments(gg, gmat); grid.position.y = -1.2; scene.add(grid);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(1.45, 64, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); scene.add(hole);
  // accretion disk — differential rotation in the shader
  const R = rng(21), M = 9000, dp = [], dc = [], dsz = [], dph = [], dr = [];
  for (let i = 0; i < M; i++) { const rr = 1.75 + Math.pow(R(), 1.8) * 5.2, a = R() * Math.PI * 2; dp.push(rr, a, (R() - .5) * 0.18 * (rr - 1.4));
    const k = clamp((rr - 1.75) / 5.2); const c = new THREE.Color().copy(C.white).lerp(C.sky, clamp(k * 2)).lerp(C.deep, clamp(k * 1.5 - .5)); dc.push(c.r, c.g, c.b); dsz.push(0.4 + R() * (1.2 - k)); dph.push(R()); dr.push(0); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('color', new THREE.Float32BufferAttribute(dc, 3));
  dg.setAttribute('sz', new THREE.Float32BufferAttribute(dsz, 1)); dg.setAttribute('ph', new THREE.Float32BufferAttribute(dph, 1));
  const dmat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDim: { value: 1 } },
    vertexShader: `attribute vec3 color; attribute float sz; attribute float ph; uniform float uTime; varying vec3 vC;
      void main(){ float r=position.x; float a=position.y+uTime*2.6/pow(r,1.5); vec3 p=vec3(cos(a)*r,position.z,sin(a)*r);
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; vC=color; gl_PointSize=(sz*(26./max(1.,-mv.z))*1.15)*${DPRS}; }`,
    fragmentShader: `varying vec3 vC; uniform float uDim; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; float a=pow(1.-d*2.,2.); gl_FragColor=vec4(vC*.55*uDim,a*.8*uDim); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const disk = new THREE.Points(dg, dmat); disk.rotation.x = 0.18; scene.add(disk);
  // photon ring (billboarded)
  const ringMat = new THREE.ShaderMaterial({ uniforms: { uDim: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vU; uniform float uDim; void main(){ float r=length(vU-.5)*2.; float a=exp(-pow((r-.62)*16.,2.))*.9+exp(-pow((r-.62)*4.,2.))*.12; gl_FragColor=vec4(vec3(.75,.92,1.)*a*uDim,a*uDim); }` });
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 4.7), ringMat); scene.add(ring);
  // wrapped text rings
  const mkRing = (text, radius, height, color, tilt, speed) => {
    const tex = textTexture([{ text: (text + '   ').repeat(3), size: 150, y: 128, weight: 700, color: '#ffffff', spacing: 18, glow: color, blur: 24 }], { w: 8192, h: 256 });
    tex.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(color), transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 160, 1, true), mat);
    const g = new THREE.Group(); g.add(m); g.rotation.z = tilt; g.userData = { m, speed }; scene.add(g); return g;
  };
  const ring1 = mkRing('ANY DEVICE  ·  ANY OS  ·  ANY FORM FACTOR  ·', 3.3, 0.62, '#2FB7EA', 0.22, 0.55);
  const ring2 = mkRing('ANDROID  ·  iOS  ·  iPadOS  ·  macOS  ·  WINDOWS  ·  LINUX  ·  PRINTERS  ·  IoT  ·', 5.0, 0.42, '#009AD4', -0.32, -0.32);

  function update(t, mode) {
    gmat.uniforms.uTime.value = t; dmat.uniforms.uTime.value = t;
    ring1.userData.m.rotation.y = t * ring1.userData.speed; ring2.userData.m.rotation.y = t * ring2.userData.speed;
    let dim = 1;
    if (mode === 'end') { // quiet backdrop for the end type
      const p = prog(t, 53.6, 60); dim = 0.42; ring1.visible = ring2.visible = false; ring.visible = hole.visible = disk.visible = !P;
      const a = 0.4 + p * 0.25; const k = P ? 1.35 : 1; cam.position.set(Math.sin(a) * 15 * k, (9 - p * 2) * k, Math.cos(a) * 15 * k); cam.lookAt(0, -1, 0);
    } else if (mode === 'ticket') {
      dim = 0.55; ring1.visible = ring2.visible = false; ring.visible = hole.visible = disk.visible = true; const p = prog(t, 39.5, 42.9);
      cam.position.set(Math.sin(p * 0.5) * 4, 22, 6 + p * 2); cam.lookAt(0, -2, 0);
    } else {
      ring1.visible = ring2.visible = true; ring.visible = hole.visible = disk.visible = true;
      const p = prog(t, 18, 21.31); const e = ease.out(p);
      const a = -0.9 + e * 1.15 + p * 0.25; const r = (12.5 - e * 4.2) * (P ? 1.3 : 1); const y = (3.2 - e * 1.6) * (P ? 1.4 : 1);
      const B = 60 / 145; const ph = ((t - 18) % B) / B; const kick = Math.exp(-ph * 9) * 0.07 * (t >= 18 ? 1 : 0);
      cam.position.set(Math.sin(a) * r, y + kick, Math.cos(a) * r); cam.lookAt(0, 0.1, 0);
      cam.rotation.z += Math.sin(t * 40) * kick * 0.4;
      // whip out at the end
      const w = ease.in(prog(t, 21.18, 21.31)); cam.rotateY(-w * 1.1);
    }
    gmat.uniforms.uDim.value = dim; dmat.uniforms.uDim.value = dim; ringMat.uniforms.uDim.value = dim; sky.material.uniforms.uDim.value = dim;
    ring.lookAt(cam.position);
  }
  return { scene, cam, update, bloom: 0.95 };
}

/* ================= DATA CONSTELLATION — the camera flies through every managed device ================= */
export function makeConstellation(aspect = 16 / 9) {
  const PT = aspect < 1; const F = PT ? 64 : 55;
  const scene = new THREE.Scene(); scene.add(skyDome('#030b18', '#000003', C.deep, 13));
  const cam = new THREE.PerspectiveCamera(F, aspect, 0.1, 900);
  const R = rng(99); const P = [], Cc = [], S = [], Ph = [], Rd = []; const centers = [];
  for (let k = 0; k < 90; k++) centers.push([(R() - .5) * 70, (R() - .5) * 34, -R() * 250 + 20, 2 + R() * 6]);
  const target = [6, 2, -262];
  for (let i = 0; i < 20000; i++) {
    const c = centers[i % centers.length]; P.push(c[0] + gauss(R) * c[3], c[1] + gauss(R) * c[3] * 0.6, c[2] + gauss(R) * c[3]);
    const col = R() > 0.85 ? C.white : (R() > 0.4 ? C.sky : C.blue); Cc.push(col.r, col.g, col.b); S.push(0.25 + R() * 0.8); Ph.push(R()); Rd.push(0);
  }
  for (let i = 0; i < 40; i++) { P.push(target[0] + gauss(R) * 1.1, target[1] + gauss(R) * 0.7, target[2] + gauss(R) * 1.1); Cc.push(C.sky.r, C.sky.g, C.sky.b); S.push(1.6); Ph.push(R()); Rd.push(1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('sz', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('ph', new THREE.Float32BufferAttribute(Ph, 1)); g.setAttribute('red', new THREE.Float32BufferAttribute(Rd, 1));
  const pm = pointsMat({ size: 0.115 }); const pts = new THREE.Points(g, pm); scene.add(pts);
  // network links
  const segs = []; const n = P.length / 3;
  for (let i = 0; i < 2600; i++) { const a = Math.floor(R() * (n - 40)), b = a + centers.length * (1 + Math.floor(R() * 3)); if (b >= n - 40) continue;
    const d = Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]); if (d > 9) continue;
    segs.push([P[a * 3], P[a * 3 + 1], P[a * 3 + 2], P[b * 3], P[b * 3 + 1], P[b * 3 + 2], 0, 0, 0]); }
  for (let i = 0; i < 70; i++) { const a = n - 40 + (i % 40), b = n - 40 + ((i * 7 + 3) % 40);
    segs.push([P[a * 3], P[a * 3 + 1], P[a * 3 + 2], P[b * 3], P[b * 3 + 1], P[b * 3 + 2], 0, 0, 1]); }
  const lm = revealLineMat({ color: C.deep, fogFar: 140, opacity: 0.55 }); lm.uniforms.uHotMix.value = 1; lm.uniforms.uHotPulse.value = 0.5;
  scene.add(new THREE.LineSegments(segGeometry(segs, 100), lm));

  function update(t, mode) {
    pm.uniforms.uTime.value = t; pm.uniforms.uRed.value = 1;
    const tv = new THREE.Vector3(...target);
    if (mode === 'fly') {
      const p = prog(t, 21.31, 24.62); const f = ease.expoInOut(clamp(p / 0.62));
      const z = 70 - f * 316; const settle = ease.out(prog(t, 22.6, 24.62));
      const pos = new THREE.Vector3(Math.sin(p * 5) * 6 * (1 - settle), Math.cos(p * 4) * 3 * (1 - settle) + 1, z);
      const orbit = settle * 0.7; const near = new THREE.Vector3(tv.x + Math.sin(orbit) * (PT ? 19 : 15), tv.y + 2, tv.z + Math.cos(orbit) * (PT ? 19 : 15));
      cam.position.copy(pos).lerp(near, settle);
      const look = new THREE.Vector3(0, 0, z - 40).lerp(tv, clamp(settle * 1.4));
      cam.lookAt(look);
      const wIn = 1 - ease.out(prog(t, 21.31, 21.5)); cam.rotateY(wIn * 1.0); // whip in
      cam.fov = F + (1 - settle) * 18 * Math.sin(Math.PI * clamp(p / 0.62)); cam.updateProjectionMatrix();
      pm.uniforms.uDim.value = 1; lm.uniforms.uHot.value.copy(C.red); lm.uniforms.uOpacity.value = 0.55;
    } else { // backdrop for diagnostics / remote / flap: slow drift around the ward cluster
      const a = t * 0.06; cam.position.set(tv.x + Math.sin(a) * 11, tv.y + 1.5 + Math.sin(t * 0.3), tv.z + Math.cos(a) * 11); cam.lookAt(tv);
      cam.fov = F + 4; cam.updateProjectionMatrix(); pm.uniforms.uDim.value = 0.32;
      const red = mode === 'flap' ? 1 - prog(t, 34.8, 36.6) : 1; pm.uniforms.uRed.value = red * 0.6;
      lm.uniforms.uHot.value.copy(C.red).lerp(C.sky, 1 - red); lm.uniforms.uOpacity.value = 0.25;
    }
  }
  return { scene, cam, update, bloom: 0.85, threshold: 0.2 };
}

/* ================= CHASE-CAM down a glowing road through a wireframe city ================= */
export function makeRoad(aspect = 16 / 9) {
  const P = aspect < 1; const F = P ? 84 : 62;
  const scene = new THREE.Scene(); scene.add(skyDome('#061a33', '#000206', C.blue, 17));
  const cam = new THREE.PerspectiveCamera(F, aspect, 0.1, 900);
  const roadX = (z) => Math.sin(z * 0.012) * 12 + Math.sin(z * 0.031) * 3;
  const R = rng(5); const segs = [];
  const box = (cx, cz, w, d, h, ord, hot) => { const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const E = [[x0, 0, z0, x1, 0, z0], [x1, 0, z0, x1, 0, z1], [x1, 0, z1, x0, 0, z1], [x0, 0, z1, x0, 0, z0], [x0, h, z0, x1, h, z0], [x1, h, z0, x1, h, z1], [x1, h, z1, x0, h, z1], [x0, h, z1, x0, h, z0],
      [x0, 0, z0, x0, h, z0], [x1, 0, z0, x1, h, z0], [x1, 0, z1, x1, h, z1], [x0, 0, z1, x0, h, z1]];
    for (const e of E) segs.push([...e, ord, ord, hot]);
    for (let y = 2; y < h; y += 2.2) segs.push([x0, y, z1, x1, y, z1, ord, ord, hot], [x1, y, z0, x1, y, z1, ord, ord, hot], [x0, y, z0, x0, y, z1, ord, ord, hot]); };
  for (let z = 10; z > -520; z -= 7) for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
    const off = 7 + k * 9 + R() * 3; const h = 4 + Math.pow(R(), 2) * (k ? 34 : 18); box(roadX(z) + side * off, z + R() * 3, 4 + R() * 3, 4 + R() * 3, h, 0, R() > 0.85 ? 1 : 0); }
  const cm = revealLineMat({ color: C.deep, hot: C.sky, fogFar: 160, opacity: 0.8 }); cm.uniforms.uHotMix.value = 1; cm.uniforms.uHotPulse.value = 0.4;
  scene.add(new THREE.LineSegments(segGeometry(segs, 50), cm));
  // road: glowing edges + centre dashes
  const rs = []; for (let z = 20; z > -540; z -= 1.5) { const x0 = roadX(z), x1 = roadX(z - 1.5);
    rs.push([x0 - 3.2, 0.02, z, x1 - 3.2, 0.02, z - 1.5, 0, 0, 0], [x0 + 3.2, 0.02, z, x1 + 3.2, 0.02, z - 1.5, 0, 0, 0]);
    if (Math.round(z / 1.5) % 3 === 0) rs.push([x0, 0.02, z, x1, 0.02, z - 1.0, 0, 0, 1]); }
  const rm = revealLineMat({ color: C.sky, hot: C.white, fogFar: 140 }); rm.uniforms.uHotMix.value = 1; rm.uniforms.uGain.value = 1.8; scene.add(new THREE.LineSegments(segGeometry(rs, 2), rm));
  // ground grid
  const gs = []; for (let z = 20; z > -540; z -= 4) gs.push([-80, 0, z, 80, 0, z, 0, 0, 0]); for (let x = -80; x <= 80; x += 4) gs.push([x, 0, 20, x, 0, -540, 0, 0, 0]);
  const gm = revealLineMat({ color: C.deep, fogFar: 90, opacity: 0.3 }); scene.add(new THREE.LineSegments(segGeometry(gs, 20), gm));
  // speed streaks
  const ss = []; for (let i = 0; i < 700; i++) { const z = 20 - R() * 560, x = roadX(z) + (R() - .5) * 30, y = 0.5 + R() * 12; ss.push([x, y, z, x, y, z - 4 - R() * 6, 0, 0, R() > .7 ? 1 : 0]); }
  const sm = revealLineMat({ color: C.blue, hot: C.white, fogFar: 60, opacity: 0.8 }); sm.uniforms.uHotMix.value = 1; scene.add(new THREE.LineSegments(segGeometry(ss, 20), sm));
  // the data packet (rollback payload) + trail
  const packet = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.7, 2.2) })); packet.add(core);
  const trailMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vU; void main(){ float a=pow(vU.y,2.)*exp(-pow((vU.x-.5)*5.,2.)); gl_FragColor=vec4(vec3(.35,.75,1.)*1.1*a,a*.8); }` });
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 16), trailMat); trail.rotation.x = -Math.PI / 2; trail.position.z = 7; packet.add(trail);
  scene.add(packet);
  // destination: the hospital, glowing at the end of the road
  const hosp = makeHospital(); const hb = hosp.scene.children.find((o) => o.isLineSegments); const hclone = new THREE.LineSegments(hb.geometry, hb.material.clone());
  hclone.material.uniforms.uProg.value = 1; hclone.material.uniforms.uFogFar.value = 400; hclone.material.uniforms.uGain.value = 1.6; hclone.scale.setScalar(2.2); hclone.position.set(roadX(-470), 0, -470); scene.add(hclone);

  function update(t) {
    const p = prog(t, 31.24, 34.55); const f = ease.in(p) * 0.55 + p * 0.45; const z = 12 - f * 440;
    const pz = z - 12; packet.position.set(roadX(pz), 1.1 + Math.sin(t * 9) * 0.05, pz); core.rotation.set(t * 4, t * 6, 0);
    const dir = Math.atan2(roadX(pz - 2) - roadX(pz), -2); packet.rotation.y = dir;
    cam.position.set(roadX(z) + Math.sin(t * 1.3) * 0.4, 2.3 - p * 0.6, z);
    cam.lookAt(roadX(z - 18), 1.2, z - 18);
    cam.rotation.z += (roadX(z - 10) - roadX(z)) * -0.03;
    cam.fov = F + ease.in(p) * (P ? 14 : 22); cam.updateProjectionMatrix();
  }
  return { scene, cam, update, bloom: 1.25, threshold: 0.2 };
}

/* ================= GLASS SLABS with the proof points ================= */
export function makeSlabs(claims, aspect = 16 / 9) {
  const P = aspect < 1; const SW = P ? 4.6 : 7.2, SH = P ? 7.2 : 4.05, DIST = P ? 18.5 : 8.6, YO = P ? -0.35 : 0;
  const scene = new THREE.Scene(); scene.add(skyDome('#05162a', '#000205', C.blue, 31));
  const cam = new THREE.PerspectiveCamera(P ? 44 : 40, aspect, 0.1, 900);
  const R = rng(41);
  // light curtain behind the glass (so the glass has something to refract against)
  const ls = []; for (let i = 0; i < 260; i++) { const x = (R() - .5) * 90, z = -20 - R() * 100, h = 10 + R() * 40; ls.push([x, -h / 2, z, x, h / 2, z, 0, 0, R() > .75 ? 1 : 0]); }
  const lm = revealLineMat({ color: C.deep, hot: C.sky, fogFar: 160, opacity: 0.7 }); lm.uniforms.uHotMix.value = 1; lm.uniforms.uHotPulse.value = 0.7;
  const curtain = new THREE.LineSegments(segGeometry(ls, 60), lm); scene.add(curtain);
  const bk = []; const bc = [], bs = [], bp = [], br = []; for (let i = 0; i < 900; i++) { bk.push((R() - .5) * 120, (R() - .5) * 60, -30 - R() * 120); const c = R() > .5 ? C.sky : C.blue; bc.push(c.r, c.g, c.b); bs.push(2 + R() * 6); bp.push(R()); br.push(0); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bk, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  bg.setAttribute('sz', new THREE.Float32BufferAttribute(bs, 1)); bg.setAttribute('ph', new THREE.Float32BufferAttribute(bp, 1)); bg.setAttribute('red', new THREE.Float32BufferAttribute(br, 1));
  const bokeh = new THREE.Points(bg, pointsMat({ size: 0.12, opacity: 0.35 })); scene.add(bokeh);

  const glassMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSweep: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec2 vU; void main(){ vU=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime,uSweep; varying vec3 vN; varying vec3 vV; varying vec2 vU;
      void main(){ float fr=pow(1.-abs(dot(vN,vV)),2.5); float sweep=exp(-pow((vU.x+vU.y*.35-uSweep)*7.,2.));
        vec3 c=vec3(.06,.16,.26)+vec3(.45,.8,1.)*fr*1.2+vec3(.8,.95,1.)*sweep*.55;
        gl_FragColor=vec4(c*.7,.08+fr*.32+sweep*.12); }` });
  const slabs = claims.map((cl, i) => {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(SW, SH, 0.14); const glass = new THREE.Mesh(geo, glassMat()); g.add(glass);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: new THREE.Color(0.9, 1.6, 2.1), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })); g.add(edges);
    const tex = textTexture(cl, P ? { w: 1152, h: 1800 } : { w: 2048, h: 1152 });
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(SW * 0.975, SH * 0.975), new THREE.MeshBasicMaterial({ map: tex, color: P ? new THREE.Color(0.5, 0.53, 0.56) : new THREE.Color(0.62, 0.66, 0.7), transparent: true, depthWrite: false })); txt.position.z = 0.08; g.add(txt);
    g.position.set(i % 2 ? 1.4 : -1.4, (i % 2 ? -0.3 : 0.3), -i * 24); g.rotation.y = i % 2 ? -0.1 : 0.1; scene.add(g);
    return { g, glass };
  });
  function update(t, mode) {
    const B = 60 / 145, bar = 4 * B, t0 = 42.828;
    const k = (t - t0) / bar; const i = clamp(Math.floor(k), 0, slabs.length - 1); const f = k - Math.floor(k);
    let idx = i, mv = 0;
    if (k >= 1 && f < 0.28 && k < slabs.length) { mv = ease.expoInOut(f / 0.28); idx = i - 1 + mv; } else if (k < 0) idx = 0; else idx = i;
    if (k < 0.28) { const e = ease.expoOut(clamp(k / 0.28)); idx = -0.9 + e * 0.9; }
    if (mode === 'ba') idx = slabs.length - 1 + ease.in(prog(t, 49.45, 49.9)) * 0.8;
    const i0 = clamp(Math.floor(idx), 0, slabs.length - 1), i1 = clamp(i0 + 1, 0, slabs.length - 1), fr = idx - Math.floor(idx);
    const sx = (j) => slabs[j].g.position.x, sy = (j) => slabs[j].g.position.y;
    const x = sx(i0) + (sx(i1) - sx(i0)) * fr, y = sy(i0) + (sy(i1) - sy(i0)) * fr;
    const z = -idx * 24 + DIST; const swing = Math.sin(fr * Math.PI);
    cam.position.set(x + swing * 3 + Math.sin(t * 0.7) * 0.12, y + YO + Math.sin(t * 0.9) * 0.06, z); cam.lookAt(x, y + YO, z - 9);
    cam.rotation.z += swing * 0.3;
    slabs.forEach((sl, j) => { sl.g.visible = Math.abs(j - idx) < 0.9; sl.glass.material.uniforms.uSweep.value = ((t - t0 - j * bar) / bar) * 2.2 - 0.4; sl.g.rotation.y = (j % 2 ? -0.1 : 0.1) + Math.sin(t * 0.8 + j) * 0.03; });
    bokeh.material.uniforms.uTime.value = t; bokeh.material.uniforms.uDim.value = mode === 'ba' ? 0.6 : 1;
  }
  return { scene, cam, update, bloom: P ? 0.38 : 0.5, threshold: 0.6 };
}

/* ================= LOGO — every device becomes a point of light that flies into the SOTI mark ================= */
export function makeLogo(pathD, { W, H, cx, cy, width, start, lock }) {
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000); cam.position.z = 10;
  // textured backdrop: deep radial glow + faint dot grid
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({ depthWrite: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vU; uniform float uT;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec2 p=vU-vec2(.5,.57); p.x*=.5625; float r=length(p);
        vec3 c=vec3(.002,.008,.018)+vec3(.0,.16,.3)*exp(-r*r*14.)*.32+vec3(.0,.06,.14)*exp(-r*r*3.)*.18;
        vec2 g=fract(vU*vec2(54.,96.))-.5; float dot=smoothstep(.06,.0,length(g))*.06*exp(-r*2.5);
        c+=vec3(.5,.8,1.)*dot; c+=(h(vU*900.+uT)-.5)*.012; gl_FragColor=vec4(c,1.); }` }));
  bg.position.z = -50; scene.add(bg);
  // sample the logo path into points
  const cv = document.createElement('canvas'); const LW = 1600, LH = Math.round(1600 * 49 / 198.5); cv.width = LW; cv.height = LH;
  const g = cv.getContext('2d'); g.scale(LW / 198.5, LH / 49); g.fillStyle = '#fff'; g.fill(new Path2D(pathD));
  const img = g.getImageData(0, 0, LW, LH).data; const cand = [];
  for (let y = 0; y < LH; y += 3) for (let x = 0; x < LW; x += 3) if (img[(y * LW + x) * 4 + 3] > 128) cand.push([x, y]);
  const R = rng(77); const N = Math.min(9000, cand.length); const s = width / LW;
  const tgt = [], src = [], del = [], sz = [], col = [];
  for (let i = 0; i < N; i++) {
    const [x, y] = cand[Math.floor(R() * cand.length)];
    tgt.push((x - LW / 2) * s + (cx - W / 2), (H / 2 - cy) - (y - LH / 2) * s, 0);
    const a = R() * Math.PI * 2, rr = 420 + Math.pow(R(), 0.5) * 900; src.push(Math.cos(a) * rr * 0.75, Math.sin(a) * rr * 1.2 + 80, (R() - .5) * 400);
    del.push((x / LW) * 0.35 + R() * 0.12); sz.push(1.6 + R() * 2.6);
    const c = new THREE.Color().copy(C.white).lerp(C.sky, R() * 0.8); col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tgt, 3)); geo.setAttribute('src', new THREE.Float32BufferAttribute(src, 3));
  geo.setAttribute('del', new THREE.Float32BufferAttribute(del, 1)); geo.setAttribute('sz', new THREE.Float32BufferAttribute(sz, 1)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uT: { value: 0 }, uSweep: { value: -1 }, uFade: { value: 1 } },
    vertexShader: `attribute vec3 src; attribute float del; attribute float sz; attribute vec3 color; uniform float uP,uT,uSweep; varying vec3 vC; varying float vA;
      float eo(float x){ return x>=1.?1.:1.-pow(2.,-10.*x); }
      void main(){ float k=clamp((uP-del)/.62,0.,1.); float e=eo(k);
        float sw=atan(src.y,src.x)+ (1.-e)*2.6; float rad=length(src.xy)*(1.-e);
        vec3 swirl=vec3(cos(sw)*rad, sin(sw)*rad, src.z*(1.-e));
        vec3 p=mix(swirl, position, e); p.xy+= (1.-e)*vec2(sin(uT*3.+del*40.),cos(uT*2.6+del*31.))*18.;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        float band=exp(-pow((position.x/540.-uSweep)*6.,2.));
        vC=color*(1.+band*2.5+(1.-k)*.6); vA=.25+.75*k; gl_PointSize=(sz*(1.+(1.-e)*1.4))*${DPRS}; }`,
    fragmentShader: `varying vec3 vC; varying float vA; uniform float uFade; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; float a=pow(1.-d*2.,1.6); gl_FragColor=vec4(vC,a*vA*uFade); }` });
  scene.add(new THREE.Points(geo, mat));
  function update(t) {
    mat.uniforms.uT.value = t; bg.material.uniforms.uT.value = Math.floor(t * 60);
    mat.uniforms.uP.value = clamp((t - start) / (lock - start)) * 1.0;
    mat.uniforms.uSweep.value = -1.6 + clamp((t - lock + 0.15) / 0.9) * 3.4;
    mat.uniforms.uFade.value = 1 - 0.75 * clamp((t - lock - 0.1) / 0.5);   // crisp vector logo takes over, particles keep a soft glow
  }
  return { scene, cam, update, bloom: 0.9, threshold: 0.25 };
}

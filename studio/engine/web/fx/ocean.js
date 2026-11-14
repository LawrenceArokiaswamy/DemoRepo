// OCEAN (original): Gerstner-wave displaced sea with crest foam + procedural detail normals, and a matching CPU
// height/normal sampler so floating objects ride the same waves. A flat far ring carries the sea to the horizon.
//   const sea = makeOcean(THREE, scene, opts); sea.update(t); sea.heightAt(x, z, t)
export function makeOcean(THREE, scene, { center = [0, 0], near = 140, seg = 280, color = '#1d4d5e', deep = '#0d2a36', foam = '#dfe9ea', y = 0,
  waves = [[1, 0.25, 0.18, 14], [0.6, 0.8, 0.14, 9], [-0.4, 1, 0.1, 5.5], [0.9, -0.4, 0.08, 3.2]], amp = 1, detail = 0.35 } = {}) {
  const W = waves.map(([dx, dz, st, L]) => { const l = Math.hypot(dx, dz), k = 2 * Math.PI / L; return { d: [dx / l, dz / l], k, c: Math.sqrt(9.81 / k), a: st / k, st }; });
  const U = { uT: { value: 0 }, uAmp: { value: amp }, uC: { value: new THREE.Vector2(...center) }, uR: { value: near * 0.42 }, uFoam: { value: new THREE.Color(foam) }, uDeep: { value: new THREE.Color(deep) } };
  const glslW = W.map((w) => `G(p, vec2(${w.d[0].toFixed(4)}, ${w.d[1].toFixed(4)}), ${w.k.toFixed(5)}, ${w.c.toFixed(5)}, ${w.a.toFixed(5)}, d, tn, bn);`).join('\n');
  const vHead = `uniform float uT, uAmp, uR; uniform vec2 uC; varying float vH; varying float vDist;
    void G(vec3 p, vec2 dir, float k, float c, float a, inout vec3 d, inout vec3 tn, inout vec3 bn) {
      float f = k * (dot(dir, p.xz) - c * uT); float aa = a * uAmp * (1.0 - smoothstep(uR * 0.8, uR, length(p.xz - uC)));
      d += vec3(dir.x * aa * cos(f), aa * sin(f), dir.y * aa * cos(f));
      float s = k * aa; tn += vec3(-dir.x * dir.x * s * sin(f), dir.x * s * cos(f), -dir.x * dir.y * s * sin(f)); bn += vec3(-dir.x * dir.y * s * sin(f), dir.y * s * cos(f), -dir.y * dir.y * s * sin(f)); }
    vec3 gerst(vec3 p, out vec3 n) { vec3 d = vec3(0.0), tn = vec3(1.0, 0.0, 0.0), bn = vec3(0.0, 0.0, 1.0); ${glslW} n = normalize(cross(bn, tn)); return p + d; }`;
  const mk = (geo, displaced) => { const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.13, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.2, envMapIntensity: 0.72, normalMap: detailNormals(THREE), normalScale: new THREE.Vector2(detail, detail) });
    m.normalMap.repeat.set(geo.parameters?.width ? geo.parameters.width / 11.3 : 300, geo.parameters?.height ? geo.parameters.height / 9.7 : 300); m.normalMap.rotation = 0.37;
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); m.userData.shader = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + vHead)
        .replace('#include <beginnormal_vertex>', displaced ? 'vec3 gN; vec3 gP = gerst((modelMatrix * vec4(position, 1.0)).xyz, gN); vec3 objectNormal = gN; vH = gP.y; vDist = length(gP.xz - uC);' : 'vec3 objectNormal = vec3(0.0, 1.0, 0.0); vH = 0.0; vDist = 1e4;')
        .replace('#include <begin_vertex>', displaced ? 'vec3 transformed = (inverse(modelMatrix) * vec4(gP, 1.0)).xyz;' : 'vec3 transformed = vec3(position);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFoam, uDeep; uniform float uAmp; varying float vH; varying float vDist;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float foamK = smoothstep(0.22 * uAmp, 0.55 * uAmp, vH); diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, 0.35 * smoothstep(0.0, -0.4 * uAmp, vH)); diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, foamK * 0.55);`); };
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; mesh.position.y = y; scene.add(mesh); return mesh; };
  const ng = new THREE.PlaneGeometry(near, near, seg, seg); ng.rotateX(-Math.PI / 2); ng.translate(center[0], 0, center[1]);
  const nearMesh = mk(ng, true);
  const fg = new THREE.RingGeometry(near * 0.4, 4000, 96, 4); fg.rotateX(-Math.PI / 2); fg.translate(center[0], -0.02, center[1]); const farMesh = mk(fg, false); farMesh.material.normalMap.repeat.set(700, 700);
  const heightAt = (x, z, t) => { let h = 0; const fade = 1 - smooth(U.uR.value * 0.8, U.uR.value, Math.hypot(x - center[0], z - center[1]));
    for (const w of W) { const f = w.k * (w.d[0] * x + w.d[1] * z - w.c * t); h += w.a * U.uAmp.value * fade * Math.sin(f); } return y + h; };
  const slopeAt = (x, z, t) => { const e = 0.5; return [(heightAt(x + e, z, t) - heightAt(x - e, z, t)) / (2 * e), (heightAt(x, z + e, t) - heightAt(x, z - e, t)) / (2 * e)]; };
  return { near: nearMesh, far: farMesh, U, heightAt, slopeAt, update(t) { U.uT.value = t; for (const m of [nearMesh.material, farMesh.material]) m.normalMap.offset.set(t * 0.011, t * 0.017); } };
}
const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
let _dn = null;
export function detailNormals(THREE) {   // tileable ripple normal map (sum of sines on integer frequencies)
  if (_dn) return _dn.clone();
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  const Wv = [[3, 1, 0.9], [1, 4, 0.7], [-5, 2, 0.5], [7, -3, 0.35], [2, -9, 0.28], [11, 5, 0.2], [-13, 7, 0.15], [17, -11, 0.1], [-6, 19, 0.09], [23, 3, 0.06], [-29, -13, 0.05]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let dx = 0, dy = 0; for (const [fx, fy, a] of Wv) { const ph = (fx * x + fy * y) / N * Math.PI * 2 + fx * 1.7, d = Math.cos(ph) * a * 0.12; dx += fx * d * 0.25; dy += fy * d * 0.25; }
    const n = [-dx, -dy, 1], l = Math.hypot(...n), i = (y * N + x) * 4; im.data[i] = (n[0] / l * 0.5 + 0.5) * 255; im.data[i + 1] = (n[1] / l * 0.5 + 0.5) * 255; im.data[i + 2] = (n[2] / l * 0.5 + 0.5) * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); _dn = new THREE.CanvasTexture(c); _dn.wrapS = _dn.wrapT = THREE.RepeatWrapping; return _dn.clone();
}
// SPLASH / SPRAY (deterministic: every particle is a pure function of time, so parallel render chunks agree)
export function makeSprayTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function makeSplash(THREE, scene, tex, { count = 160, seed = 1, color = '#eef4f5' } = {}) {
  const rnd = (i, k) => { const x = Math.sin((i + seed * 31.7) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const P = []; for (let i = 0; i < count; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s);
    const big = i % 5 === 0; P.push({ s, big, ang: rnd(i, 1) * Math.PI * 2, out: 0.3 + rnd(i, 2) * 0.9, up: 0.4 + rnd(i, 3) * 0.9, life: big ? 1.6 + rnd(i, 4) : 0.7 + rnd(i, 5) * 0.8, size: big ? 1.2 + rnd(i, 6) : 0.12 + rnd(i, 7) * 0.25, delay: rnd(i, 8) * 0.18 }); }
  /** events: [{ t0, pos:[x,y,z], power, spread:[sx,sz], dir:[dx,dz] }] */
  return { P, update(t, events) {
    for (const p of P) p.s.visible = false;
    let i = 0; for (const e of events) { const n = Math.floor(P.length / events.length);
      for (let j = 0; j < n; j++, i++) { const p = P[i], sc = e.scale || 1, a = t - e.t0 - p.delay * sc; if (a < 0 || a > p.life * Math.sqrt(sc)) continue; const k = a / (p.life * Math.sqrt(sc)), pw = (e.power || 1) * sc, sp = e.spread || [1, 1], dir = e.dir || [0, 0];
        const vx = (Math.cos(p.ang) * p.out * sp[0] + dir[0]) * 4 * pw, vz = (Math.sin(p.ang) * p.out * sp[1] + dir[1]) * 4 * pw, vy = p.up * 9 * pw * (p.big ? 0.45 : 1);
        const x = e.pos[0] + vx * a * (p.big ? 0.5 : 1), z = e.pos[2] + vz * a * (p.big ? 0.5 : 1), yy = Math.max(e.pos[1] - 0.2, e.pos[1] + vy * a - 0.5 * 9.81 * a * a * (p.big ? 0.25 : 1));
        p.s.visible = true; p.s.position.set(x, yy, z); const sz = p.size * pw * (p.big ? 1.6 : 1) * (1 + k * (p.big ? 2.5 : 0.6)); p.s.scale.set(sz, sz, 1); p.s.material.opacity = (p.big ? 0.42 : 0.85) * (1 - k) * Math.min(1, a * 12); } } } };
}

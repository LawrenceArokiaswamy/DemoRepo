// Motion-graphics style test: readable holds, bright grade, light-sweep / bar-wipe / leak / flare transitions,
// kinetic title, counting stats card with self-drawing icons, sparkle staging reveal, 3-panel split, price shine.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const DUR = 11;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eout = (x) => 1 - Math.pow(1 - x, 3), ein = (x) => x * x * x, eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const $ = (s) => document.querySelector(s);
const pulse = (t, at, k = 10) => (t >= at ? Math.exp(-(t - at) * k) : 0);

/* ---------- photo -> depth mesh ---------- */
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
function depthSampler(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  return (u, v) => { const x = clamp(u) * (W - 1), y = clamp(v) * (H - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const s = (xx, yy) => d[(yy * W + xx) * 4] / 255; return (s(x0, y0) * (1 - fx) + s(x1, y0) * fx) * (1 - fy) + (s(x0, y1) * (1 - fx) + s(x1, y1) * fx) * fy; };
}
function photoMesh(photo, depthImg, near, far, hfov = 92) {
  const D = depthSampler(depthImg), tx = Math.tan((hfov * Math.PI) / 360), ty = tx / (photo.width / photo.height);
  const P = (u, v) => { const inv = 1 / far + D(u, v) * (1 / near - 1 / far), z = 1 / inv; return new THREE.Vector3((2 * u - 1) * tx * z, (1 - 2 * v) * ty * z, -z); };
  const SX = 300, SY = Math.round(SX / (photo.width / photo.height)), pos = new Float32Array((SX + 1) * (SY + 1) * 3), uv = new Float32Array((SX + 1) * (SY + 1) * 2), idx = [];
  for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) { const k = j * (SX + 1) + i, u = i / SX, v = j / SY, p = P(u, v); pos.set([p.x, p.y, p.z], k * 3); uv.set([u, 1 - v], k * 2); }
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = new THREE.Texture(photo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  return { mesh: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })), P, vfov: (2 * Math.atan(ty) * 180) / Math.PI };
}

/* ---------- shots ---------- */
const SH = {
  room: { t0: 2.9, t1: 5.9, photo: '024', after: '024s', near: 1.8, far: 11, p0: [0, 0, 0], p1: [0.1, 0, -0.35], a0: [0.43, 0.5], a1: [0.49, 0.5], z0: 1.16, z1: 1.3, wipe: [0.45, 1.5] },
  k1: { photo: '033', near: 1.6, far: 9, p0: [-0.1, 0, 0], p1: [0.15, 0, -0.3], a0: [0.5, 0.48], a1: [0.56, 0.48], z0: 1.12, z1: 1.3 },
  k2: { photo: '037', near: 0.8, far: 4, p0: [0, 0, 0], p1: [0.05, 0, -0.15], a0: [0.55, 0.52], a1: [0.62, 0.52], z0: 1.25, z1: 1.45 },
  k3: { photo: '042', near: 0.9, far: 4.5, p0: [0, 0, 0], p1: [0.05, 0, -0.2], a0: [0.56, 0.45], a1: [0.62, 0.45], z0: 1.15, z1: 1.32 },
  end: { t0: 8.4, t1: 11, photo: '001', near: 7, far: 60, p0: [0, 0.1, 0], p1: [0, 0.35, -0.8], a0: [0.47, 0.5], a1: [0.47, 0.46], z0: 1.18, z1: 1.32 },
};
const SPLIT = [5.9, 8.4];

/* ---------- post: bright airy grade ---------- */
const POST = { uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uDark: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame,uDark; varying vec2 vUv; float r(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.71)*43758.5453); }
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c=c*1.06+.012; c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.1); c*=vec3(1.02,1.0,.975);
      c*=1.-uDark; c+=(r(vUv*vec2(1080.,1920.))-.5)*.012; gl_FragColor=vec4(c,1.); }` };

/* ---------- timeline ---------- */
const clock = { t: 0 }; const master = gsap.timeline({ paused: true });
master.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = master;

// title letters
const T1 = '31 Carnegie Dr'; $('#t1').innerHTML = [...T1].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
const fmt = (n) => n.toLocaleString('en-US');

let ready = false, renderer, composer, post, cam, scene;
async function build(s) {
  const [ph, dp] = await Promise.all([loadImg(`assets/photos/${s.photo}.jpg`), loadImg(`assets/depth/${s.photo}.png`)]);
  s.g = new THREE.Group(); const pm = photoMesh(ph, dp, s.near, s.far); s.g.add(pm.mesh); s.P = pm.P; s.vfov = pm.vfov;
  if (s.after) { const [pa, da] = await Promise.all([loadImg(`assets/photos/${s.after}.jpg`), loadImg(`assets/depth/${s.after}.png`)]); const am = photoMesh(pa, da, s.near, s.far);
    const m = am.mesh.material; m.depthTest = false; am.mesh.renderOrder = 1; s.uP = { value: 0 };
    m.onBeforeCompile = (sh) => { sh.uniforms.uP = s.uP; sh.fragmentShader = 'uniform float uP;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float ed = vMapUv.x - uP; if (ed > 0.0) discard; diffuseColor.rgb += vec3(1.0,0.88,0.65) * smoothstep(0.016, 0.0, -ed) * 2.0;'); };
    s.g.add(am.mesh); }
  s.g.visible = false; scene.add(s.g);
}
async function init() {
  await Promise.all(['800 80px "Inter Tight"', '900 80px "Inter Tight"', '600 40px "Inter Tight"', 'italic 400 80px "Instrument Serif"', '400 80px "Instrument Serif"'].map((f) => document.fonts.load(f)));
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(60, 1080 / 1920, 0.05, 400);
  for (const k of Object.keys(SH)) await build(SH[k]);
  post = new ShaderPass(POST); composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam)); composer.addPass(post); composer.addPass(new OutputPass());
  ready = true; frame(clock.t); window.__resolveBuild && window.__resolveBuild();
}
function place(s, u, aspect = 1080 / 1920, extra = 1) {
  cam.aspect = aspect; cam.position.set(s.p0[0] + (s.p1[0] - s.p0[0]) * u, s.p0[1] + (s.p1[1] - s.p0[1]) * u, s.p0[2] + (s.p1[2] - s.p0[2]) * u);
  cam.lookAt(s.P(s.a0[0] + (s.a1[0] - s.a0[0]) * u, s.a0[1] + (s.a1[1] - s.a0[1]) * u));
  // vertical fov for portrait; for wide panels keep the same horizontal coverage feel
  const z = (s.z0 + (s.z1 - s.z0) * u) * extra; cam.fov = aspect > 1 ? (2 * Math.atan(Math.tan((46 * Math.PI) / 180) / aspect) * 180) / Math.PI / z : s.vfov / z; cam.updateProjectionMatrix();
}

/* ---------- sparkles (deterministic) ---------- */
const sp = $('#spark').getContext('2d');
function sparkles(t, pts) {
  sp.clearRect(0, 0, 1080, 1920); if (!pts) return;
  for (let i = 0; i < 140; i++) { const h = Math.sin(i * 91.7) * 43758.5453, r1 = h - Math.floor(h), h2 = Math.sin(i * 17.3) * 9631.3, r2 = h2 - Math.floor(h2);
    const tb = pts.t0 + r1 * pts.d, age = t - tb; if (age < 0 || age > 1.1) continue;
    const y = 300 + r2 * 1300 - age * 120, x = pts.x(tb) + (r2 - 0.5) * 60 + Math.sin(age * 6 + i) * 10, a = (1 - age / 1.1) * (0.6 + 0.4 * Math.sin(age * 30 + i)), sz = 2 + r1 * 6;
    const g = sp.createRadialGradient(x, y, 0, x, y, sz * 5); g.addColorStop(0, `rgba(255,245,220,${a})`); g.addColorStop(0.3, `rgba(255,210,140,${a * 0.6})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    sp.fillStyle = g; sp.fillRect(x - sz * 5, y - sz * 5, sz * 10, sz * 10);
    sp.fillStyle = `rgba(255,255,255,${a})`; sp.fillRect(x - sz * 2.2, y - 0.6, sz * 4.4, 1.2); sp.fillRect(x - 0.6, y - sz * 2.2, 1.2, sz * 4.4); }
}

/* ---------- per frame ---------- */
function frame(t) {
  // ---- intro title (0 - 2.9)
  const bIn = back(prog(t, 0.15, 0.55)), out1 = prog(t, 2.55, 2.85);
  $('#badge').style.opacity = (prog(t, 0.15, 0.3) * (1 - out1)).toFixed(3); $('#badge').style.transform = `translateX(-50%) scale(${(0.6 + 0.4 * bIn).toFixed(3)})`;
  const dp = (t * 1.6) % 1; $('#badge .dot').style.boxShadow = `0 0 0 ${(dp * 18).toFixed(1)}px rgba(232,72,60,${(0.6 * (1 - dp)).toFixed(2)})`;
  [...$('#t1').children].forEach((e, i) => { const k = eout(prog(t, 0.45 + i * 0.045, 0.85 + i * 0.045)); e.style.opacity = (k * (1 - out1)).toFixed(3); e.style.transform = `translateY(${(70 * (1 - k)).toFixed(1)}px) rotate(${(8 * (1 - k)).toFixed(1)}deg)`; e.style.filter = `blur(${(8 * (1 - k)).toFixed(1)}px)`; });
  $('#tline').style.transform = `scaleX(${(expo(prog(t, 1.0, 1.6)) * (1 - out1)).toFixed(3)})`;
  $('#t2').style.opacity = (prog(t, 1.25, 1.6) * (1 - out1)).toFixed(3); $('#t2').style.letterSpacing = (0.7 - 0.28 * eout(prog(t, 1.25, 2.1))).toFixed(3) + 'em';
  $('#w1').style.visibility = t < 2.9 ? 'visible' : 'hidden'; $('#w1').style.transform = `scale(${(1.08 - 0.06 * eout(prog(t, 0, 2.9))).toFixed(3)})`;

  // ---- before/after + stats (2.9 - 5.9)
  const R = SH.room, inR = t >= R.t0 && t < R.t1, rev = prog(t, R.t0 + R.wipe[1] - 0.3, R.t0 + R.wipe[1]);
  $('#ba').style.opacity = (inR ? prog(t, R.t0 + 0.15, R.t0 + 0.35) * (1 - prog(t, R.t1 - 0.25, R.t1)) : 0).toFixed(3);
  $('#b-be').style.opacity = (1 - rev).toFixed(3); $('#b-af').style.opacity = rev.toFixed(3); $('#b-af').style.transform = `translateX(-50%) scale(${(1 + 0.25 * pulse(t, R.t0 + R.wipe[1], 6)).toFixed(3)})`;
  $('#vs').style.opacity = (inR ? prog(t, R.t0 + R.wipe[0], R.t0 + R.wipe[0] + 0.3) * (1 - prog(t, R.t1 - 0.25, R.t1)) : 0).toFixed(3);
  const sIn = back(prog(t, 4.35, 4.85)), sOut = prog(t, 5.6, 5.85);
  $('#stats').style.opacity = (prog(t, 4.35, 4.55) * (1 - sOut)).toFixed(3); $('#stats').style.transform = `translateY(${(140 * (1 - sIn)).toFixed(1)}px)`;
  document.querySelectorAll('#stats path').forEach((p, i) => (p.style.strokeDashoffset = (200 * (1 - eout(prog(t, 4.5 + i * 0.1, 5.1 + i * 0.1)))).toFixed(1)));
  $('#n1').textContent = Math.round(4 * eout(prog(t, 4.55, 5.0))); $('#n2').textContent = Math.round(4 * eout(prog(t, 4.65, 5.1))); $('#n3').textContent = fmt(Math.round(3088 * eout(prog(t, 4.75, 5.35))));

  // ---- split kitchen (5.9 - 8.4)
  const inS = t >= SPLIT[0] && t < SPLIT[1];
  ['#sp1', '#sp2', '#sp3'].forEach((id, i) => { const k = eout(prog(t, 6.35 + i * 0.18, 6.75 + i * 0.18)); const e = $(id + ' span'); e.style.opacity = (inS ? k * (1 - prog(t, 8.15, 8.4)) : 0).toFixed(3); e.style.transform = `translateX(${(-80 * (1 - k)).toFixed(1)}px)`; });
  const kk = back(prog(t, 6.0, 6.45)); $('#kt').style.opacity = (inS ? prog(t, 6.0, 6.2) * (1 - prog(t, 7.1, 7.35)) : 0).toFixed(3); $('#kt').style.transform = `scale(${(0.7 + 0.3 * kk).toFixed(3)})`;

  // ---- end (8.4 - 11)
  const eIn = prog(t, 8.55, 8.9); $('#end').style.opacity = eIn.toFixed(3);
  $('#price').textContent = 'C$' + fmt(Math.round(1599000 * expo(prog(t, 8.7, 9.6)) / 1000) * 1000);
  $('#price').style.transform = `scale(${(0.85 + 0.15 * back(prog(t, 8.6, 9.1))).toFixed(3)})`;
  $('.shine').style.left = (-200 + 1500 * eio(prog(t, 9.7, 10.25))) + 'px';
  $('#end .e-addr').style.opacity = prog(t, 9.0, 9.35).toFixed(3); $('#end .e-addr').style.transform = `translateY(${(30 * (1 - eout(prog(t, 9.0, 9.5)))).toFixed(1)}px)`;
  $('#end .e-card').style.opacity = prog(t, 9.3, 9.6).toFixed(3); $('#end .e-card').style.transform = `translateY(${(120 * (1 - back(prog(t, 9.3, 9.8)))).toFixed(1)}px)`;

  // ---- light FX transitions
  $('#flash').style.opacity = Math.max(pulse(t, 0, 7) * 0.7, pulse(t, 2.9, 9) * 0.6, pulse(t, 5.9, 9) * 0.75, pulse(t, 8.4, 9) * 0.6).toFixed(3);
  const fl = (a, d) => { const k = prog(t, a, a + d); return k > 0 && k < 1 ? k : -1; };
  const f1 = [fl(0.05, 0.8), fl(8.2, 0.55)].find((k) => k >= 0); $('#flare').style.opacity = f1 !== undefined ? Math.sin(f1 * Math.PI).toFixed(3) : 0;
  if (f1 !== undefined) $('#flare i').style.transform = `translateX(${(-700 + 1600 * f1).toFixed(0)}px) scaleY(${(0.6 + 0.6 * Math.sin(f1 * Math.PI)).toFixed(2)})`;
  const bw = prog(t, 2.72, 3.12); document.querySelectorAll('#bars i').forEach((e, i) => { const k = eio(clamp(bw * 1.25 - i * 0.12)); e.style.transform = `rotate(18deg) translateX(${(-1700 + 3600 * k).toFixed(0)}px)`; e.style.left = 260 + i * 280 + 'px'; });
  $('#leak').style.opacity = (Math.sin(Math.PI * prog(t, 5.65, 6.3)) * 0.95).toFixed(3); $('#leak').style.transform = `translateX(${(-150 + 300 * prog(t, 5.65, 6.3)).toFixed(0)}px) rotate(${(20 * prog(t, 5.65, 6.3)).toFixed(1)}deg)`;

  if (!ready) return;
  // ---- 3D
  const showGL = t >= 2.9; $('#gl').style.visibility = showGL ? 'visible' : 'hidden';
  for (const k of Object.keys(SH)) SH[k].g.visible = false;
  post.uniforms.uFrame.value = Math.floor(t * 30) % 997;
  if (inR) {
    const u = eio(prog(t, R.t0, R.t1)); R.g.visible = true; place(R, u); R.uP.value = 0.18 + 0.64 * eio(prog(t - R.t0, R.wipe[0], R.wipe[1]));
    post.uniforms.uDark.value = 0; composer.render();
    // sparkles ride the reveal edge
    const ex = (tt) => { const w = 0.18 + 0.64 * eio(prog(tt - R.t0, R.wipe[0], R.wipe[1])); const p = R.P(w, 0.5).project(cam); return (p.x * 0.5 + 0.5) * 1080; };
    sparkles(t, { t0: R.t0 + R.wipe[0], d: R.wipe[1] - R.wipe[0], x: ex });
  } else sparkles(t, null);
  if (inS) { // three panels slide in from the right, each with its own push
    renderer.setScissorTest(true); renderer.setClearColor(0xffffff, 1); renderer.clear();
    const lt = t - SPLIT[0];
    [SH.k1, SH.k2, SH.k3].forEach((s, i) => { const slide = eout(prog(lt, i * 0.12, 0.45 + i * 0.12)); const x = Math.round(1080 * (1 - slide)); const y = 1920 - (i * 644 + 632);
      for (const k of Object.keys(SH)) SH[k].g.visible = SH[k] === s;
      renderer.setViewport(x, y, 1080, 632); renderer.setScissor(x, y, 1080, 632); place(s, eio(prog(lt, 0, 2.5)), 1080 / 632); renderer.render(scene, cam); });
    renderer.setScissorTest(false); renderer.setViewport(0, 0, 1080, 1920);
  }
  if (t >= SH.end.t0) { const s = SH.end; s.g.visible = true; place(s, eout(prog(t, s.t0, s.t1))); post.uniforms.uDark.value = 0.3 * prog(t, 8.6, 9.2); composer.render(); }
}
init();

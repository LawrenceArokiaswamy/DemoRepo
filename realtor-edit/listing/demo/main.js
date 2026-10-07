// Listing-reel style test: listing photos rebuilt as depth meshes, gimbal/FPV camera moves,
// whip transitions with motion blur, and 3D text that lives inside the rooms (occluded by furniture).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const DUR = 11.5;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eout = (x) => 1 - Math.pow(1 - x, 3), ein = (x) => x * x * x;
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ---------- photo → depth mesh ---------- */
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function depthSampler(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  return (u, v) => { const x = clamp(u) * (W - 1), y = clamp(v) * (H - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const s = (xx, yy) => d[(yy * W + xx) * 4] / 255; return (s(x0, y0) * (1 - fx) + s(x1, y0) * fx) * (1 - fy) + (s(x0, y1) * (1 - fx) + s(x1, y1) * fx) * fy; };
}
function photoMesh(photo, depthImg, { near, far, hfov = 92 }) {
  const D = depthSampler(depthImg), tx = Math.tan((hfov * Math.PI) / 360), ty = tx / (photo.width / photo.height);
  const P = (u, v) => { const inv = 1 / far + D(u, v) * (1 / near - 1 / far), z = 1 / inv; return new THREE.Vector3((2 * u - 1) * tx * z, (1 - 2 * v) * ty * z, -z); };
  const SX = 360, SY = Math.round(SX / (photo.width / photo.height)), pos = new Float32Array((SX + 1) * (SY + 1) * 3), uv = new Float32Array((SX + 1) * (SY + 1) * 2), idx = [];
  for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) { const k = j * (SX + 1) + i, u = i / SX, v = j / SY, p = P(u, v); pos.set([p.x, p.y, p.z], k * 3); uv.set([u, 1 - v], k * 2); }
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = new THREE.Texture(photo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })));
  return { group: g, P, vfov: (2 * Math.atan(ty) * 180) / Math.PI };
}

/* ---------- text that lives in the scene ---------- */
function textPlane(lines, { font, size = 220, height, color = '#ffffff', shadow = true }) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = `${font} ${size}px`.replace(/^(\S+) (\S+) /, '$1 $2 ');
  g.font = font.replace('SIZE', size + 'px'); const w = Math.max(...lines.map((l) => g.measureText(l).width));
  c.width = Math.ceil(w + size * 0.6); c.height = Math.ceil(size * 1.15 * lines.length + size * 0.4);
  g.font = font.replace('SIZE', size + 'px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
  if (shadow) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.04; }
  lines.forEach((l, i) => g.fillText(l, c.width / 2, size * 0.2 + size * 1.15 * (i + 0.5)));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry((height * c.width) / c.height, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
  m.renderOrder = 2; return m;
}

/* ---------- post: whip motion blur + grade ---------- */
const POST = { uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 }, uFrame: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uBlur,uFrame; varying vec2 vUv;
    float r(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.71)*43758.5453); }
    void main(){ vec3 c=vec3(0.); float n=0.; for(int i=-12;i<=12;i++){ float w=1.-abs(float(i))/13.; c+=texture2D(tDiffuse,vUv+vec2(float(i)*uBlur/12.,0.)).rgb*w; n+=w; } c/=n;
      c=pow(c,vec3(1.04)); c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.08); c*=vec3(1.02,1.0,.97);
      vec2 q=vUv-.5; c*=1.-dot(q,q)*.55; c+=(r(vUv*vec2(1080.,1920.))-.5)*.018; gl_FragColor=vec4(c,1.); }` };

/* ---------- timeline ---------- */
const clock = { t: 0 }; const master = gsap.timeline({ paused: true });
master.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = master;

let ready = false, renderer, composer, post, cam, S = {};
const WHIP = 0.26, A = [0, 2.7], B = [2.7, 5.4], C = [5.4, 8.0], D = [8.0, 11.5];
async function init() {
  await Promise.all([document.fonts.load('800 80px "Inter Tight"'), document.fonts.load('900 80px "Inter Tight"'), document.fonts.load('italic 400 80px "Instrument Serif"')]);
  const [f1, f2, f3, d1, d2, d3, f4, d4, f5, d5] = await Promise.all(['photos/001.jpg', 'photos/033.jpg', 'photos/016.jpg', 'depth/001.png', 'depth/033.png', 'depth/016.png', 'photos/024.jpg', 'depth/024.png', 'photos/024s.jpg', 'depth/024s.png'].map((p) => loadImg('assets/' + p)));
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  S.a = photoMesh(f1, d1, { near: 7, far: 60 }); S.b = photoMesh(f2, d2, { near: 1.6, far: 9 }); S.c = photoMesh(f3, d3, { near: 1.2, far: 14 });
  S.d = photoMesh(f4, d4, { near: 1.8, far: 11 }); S.e = photoMesh(f5, d5, { near: 1.8, far: 11 });
  // staged "after" mesh drawn over the "before" with a sweeping reveal edge
  { const m = S.e.group.children[0].material; m.depthTest = false; S.e.group.children[0].renderOrder = 1; S.e.uP = { value: 0 };
    m.onBeforeCompile = (sh) => { sh.uniforms.uP = S.e.uP; sh.fragmentShader = 'uniform float uP;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float ed = vMapUv.x - uP; if (ed > 0.0) discard; diffuseColor.rgb += vec3(1.0,0.85,0.6) * smoothstep(0.012, 0.0, -ed) * 1.6;'); }; }
  for (const k of ['a', 'b', 'c', 'd', 'e']) scene.add(S[k].group);
  // facade: script title standing on the lawn in front of the house
  S.a.txt = textPlane(['31 Carnegie'], { font: 'italic 400 SIZE "Instrument Serif"', height: 0.95 }); S.a.base = S.a.P(0.47, 0.93).add(new THREE.Vector3(0, 1.5, 0)); S.a.group.add(S.a.txt);
  // kitchen: "KITCHEN" rises up from behind the island (island occludes its lower half)
  S.b.txt = textPlane(['KITCHEN'], { font: '900 SIZE "Inter Tight"', height: 0.72 }); { const w = S.b.P(0.48, 0.515); S.b.base = w.clone().multiplyScalar(0.84); } S.b.group.add(S.b.txt);
  // hallway: square footage lying on the floor, camera flies over it
  S.c.txt = textPlane(['3,088', 'SQ FT'], { font: '900 SIZE "Inter Tight"', height: 0.9 }); S.c.base = S.c.P(0.63, 0.76).add(new THREE.Vector3(0, 0.02, 0)); S.c.txt.rotation.x = -Math.PI / 2; S.c.group.add(S.c.txt);
  cam = new THREE.PerspectiveCamera(60, 1080 / 1920, 0.05, 200);
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam)); post = new ShaderPass(POST); composer.addPass(post); composer.addPass(new OutputPass());
  ready = true; frame(clock.t); window.__resolveBuild && window.__resolveBuild();
}

const tmp = new THREE.Vector3();
function aim(pos, target, yaw, fov) { cam.position.copy(pos); cam.lookAt(target); cam.rotateY(yaw); cam.fov = fov; cam.updateProjectionMatrix(); }
// whip in/out: yaw offset + blur amount for a shot spanning [s0,s1]
function whip(t, [s0, s1], first, last) {
  const out = last ? 0 : ein(prog(t, s1 - WHIP, s1)), inn = first ? 0 : 1 - eout(prog(t, s0, s0 + WHIP));
  return { yaw: -out * 0.32 + inn * 0.32, blur: Math.max(out, inn) * 0.06 };
}

function frame(t) {
  const tag = document.getElementById('tag'); tag.style.opacity = (prog(t, 0.5, 0.9) * (1 - prog(t, 2.2, 2.5))).toFixed(3); tag.style.letterSpacing = (0.5 - 0.18 * eout(prog(t, 0.5, 1.6))).toFixed(3) + 'em';
  const ba = prog(t, D[0] + 0.3, D[0] + 0.6) * (1 - prog(t, 11.3, 11.5)), rev = prog(t, D[0] + 1.6, D[0] + 2.0);
  document.getElementById('ba').style.opacity = ba.toFixed(3); document.getElementById('b-be').style.opacity = (1 - rev).toFixed(3); document.getElementById('b-af').style.opacity = rev.toFixed(3);
  document.getElementById('vs').style.opacity = (prog(t, D[0] + 1.2, D[0] + 1.6) * (1 - prog(t, 11.3, 11.5))).toFixed(3);
  if (!ready) return;
  const shot = t < A[1] ? 'a' : t < B[1] ? 'b' : t < C[1] ? 'c' : 'd';
  for (const k of ['a', 'b', 'c', 'd']) S[k].group.visible = k === shot; S.e.group.visible = shot === 'd';
  let w;
  if (shot === 'a') { // crane-in on the facade: small move + lens push, speed-ramped
    const u = expoOut(prog(t, 0, 2.5)); w = whip(t, A, true, false);
    aim(tmp.set(0, 0.5 * u, -1.4 * u), S.a.P(0.47, 0.52), w.yaw, S.a.vfov / (1.16 + 0.3 * u));
    const k = eout(prog(t, 0.35, 1.0)); S.a.txt.material.opacity = k; S.a.txt.position.copy(S.a.base).add(new THREE.Vector3(0, -0.6 * (1 - k), 0)); S.a.txt.scale.setScalar(0.85 + 0.15 * k);
  } else if (shot === 'b') { // pan + glide along the island toward the ovens
    const s = t - B[0], u = eio(prog(s, 0, 2.7)); w = whip(t, B, false, false);
    aim(tmp.set(-0.15 + 0.35 * u, 0.0, -0.4 * u), S.b.P(0.41 + 0.25 * u, 0.5), w.yaw, S.b.vfov / (1.1 + 0.2 * u));
    const k = eout(prog(s, 0.4, 1.1)); S.b.txt.material.opacity = Math.min(1, k * 1.5); S.b.txt.position.copy(S.b.base).add(new THREE.Vector3(0, -0.5 * (1 - k), 0)); S.b.txt.lookAt(cam.position);
  } else if (shot === 'c') { // FPV push down the hallway (lens push + short dolly), floor text slides under
    const s = t - C[0], u = eout(prog(s, 0, 2.6)); w = whip(t, C, false, false);
    aim(tmp.set(0.06 * u, -0.08 * u, -0.5 * u), S.c.P(0.63, 0.5 + 0.06 * (1 - u)), w.yaw, S.c.vfov / (1.04 + 0.42 * u));
    const k = eout(prog(s, 0.3, 0.85)); S.c.txt.material.opacity = k; S.c.txt.position.copy(S.c.base); S.c.txt.scale.set(k, k, 1);
  } else { // great room: empty -> virtually staged reveal while the camera drifts toward the fireplace
    const s = t - D[0], u = eio(prog(s, 0, 3.5)); w = whip(t, D, false, true);
    aim(tmp.set(0.12 * u, 0.0, -0.3 * u), S.d.P(0.40 + 0.08 * u, 0.5), w.yaw, S.d.vfov / (1.16 + 0.1 * u));
    S.e.uP.value = 0.18 + 0.62 * eio(prog(s, 0.9, 2.4));
  }
  post.uniforms.uBlur.value = w.blur; post.uniforms.uFrame.value = Math.floor(t * 30) % 997;
  composer.render();
}
init();

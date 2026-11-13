// Studio render core (original code): toon world + ink outlines + lit 2D character cards + cinematic post.
import * as THREE from './lib/three.module.js';
import * as TX from './tex.js';
export { THREE };

export const W = 1080, H = 1920;
const cnv = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({ canvas: cnv, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 3000);

// ---------- materials ----------
const ramp = new THREE.DataTexture(new Uint8Array([92, 92, 92, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const toon = (o = {}) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...o });
export const texMat = (canvas, rx = 1, ry = 1, o = {}) => toon({ map: TX.tex(canvas, rx, ry), ...o });

// ---------- helpers ----------
export const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true; parent.add(m); return m; };
/** box whose UVs tile at `t` metres per texture repeat on every face */
export const tbox = (w, h, d, t = 2) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); } return g; };
export const group = (x = 0, y = 0, z = 0, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

// ---------- normal/depth materials (for ink + lens) ----------
const ndVS = (inst) => `varying vec3 vN; varying float vD; void main(){ mat4 im = ${inst ? 'instanceMatrix' : 'mat4(1.)'}; vN = normalize(normalMatrix*mat3(im)*normal); vec4 mv = modelViewMatrix*im*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
const ndFS = `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`;
export const ND = new THREE.ShaderMaterial({ vertexShader: ndVS(false), fragmentShader: ndFS, side: THREE.DoubleSide });
export const ND_INST = new THREE.ShaderMaterial({ vertexShader: ndVS(true), fragmentShader: ndFS, side: THREE.DoubleSide });
const cardND = (map) => new THREE.ShaderMaterial({ uniforms: { map: { value: map } }, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }` });
export const flatND = (n = [0, 1, 0]) => new THREE.ShaderMaterial({ vertexShader: `varying float vD; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(${(n[0] * 0.5 + 0.5).toFixed(3)},${(n[1] * 0.5 + 0.5).toFixed(3)},${(n[2] * 0.5 + 0.5).toFixed(3)},vD); }` });

// ---------- sky ----------
export const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0.003 }, glow: { value: 0.4 } };
export const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize, glow; varying vec3 vP;
    void main(){ float h = clamp(vP.y, 0., 1.); vec3 c = mix(hor, top, pow(h, .5)); float s = max(dot(normalize(vP), normalize(sunDir)), 0.);
      c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.5, s)*1.6 + glow*pow(s, 18.) + glow*.35*pow(s, 4.)); gl_FragColor = vec4(c, 1.); }` }));
sky.userData.ndSkip = true; scene.add(sky);

// ---------- lights ----------
export const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#ffffff', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog('#ffffff', 50, 900);
export function applyLight(L, focus) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI; scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || L.sun); skyU.glow.value = L.sunGlow ?? 0.4;
  const az = L.az * Math.PI / 180, el = L.el * Math.PI / 180, d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(d); sun.position.copy(focus).addScaledVector(d, 120); sun.target.position.copy(focus);
  const e = L.shadowExt || 25, sc = sun.shadow.camera; sc.left = sc.bottom = -e; sc.right = sc.top = e; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix();
  post.grade(L);
}

// ---------- 2D character / fx cards ----------
const CW = 960, CH = 1600, CARD_H = 2.05;
const cardGeo = new THREE.PlaneGeometry(CARD_H * 0.6, CARD_H); cardGeo.translate(0, CARD_H / 2 - CARD_H * 0.02, 0);
{ const n = cardGeo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.45, 0.89); }
const blobTex = TX.tex(TX.radial('30,20,14', 0.6));
class Card {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = CW; this.c.height = CH; this.g = this.c.getContext('2d');
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 8;
    this.lit = new THREE.MeshLambertMaterial({ map: this.t, transparent: true, alphaTest: 0.03, side: THREE.DoubleSide, emissive: new THREE.Color(0.5, 0.5, 0.5), emissiveMap: this.t });
    this.unlit = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false });
    this.mesh = new THREE.Mesh(cardGeo, this.lit); this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.userData.nd = cardND(this.t);
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; scene.add(this.mesh, this.blob); this.key = null; this.hide();
  }
  hide() { this.mesh.visible = this.blob.visible = false; }
  draw(key, fn) { if (key === this.key) return; this.key = key; const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(g); this.t.needsUpdate = true; }
}
const cards = [];
/** actors: [{key, draw(g), pos:[x,y,z], s, fx, alpha, roll, yaw, ground, blob, add}] */
export function drawCards(list) {
  cards.forEach((c) => c.hide());
  list.forEach((a, i) => { const c = cards[i] || (cards[i] = new Card()); c.draw(a.key, a.draw);
    const m = c.mesh; m.visible = true; m.material = a.fx ? c.unlit : c.lit; m.userData.ndSkip = !!a.fx; m.castShadow = !a.fx; m.receiveShadow = !a.fx;
    c.unlit.blending = a.add ? THREE.AdditiveBlending : THREE.NormalBlending; c.unlit.opacity = a.alpha ?? 1; c.lit.opacity = a.alpha ?? 1;
    m.position.set(...a.pos); const s = a.s || 1; m.scale.set(s * (a.flip ? -1 : 1), s, s);
    m.rotation.set(0, Math.atan2(camera.position.x - a.pos[0], camera.position.z - a.pos[2]) + (a.yaw || 0), a.roll || 0); m.renderOrder = a.fx ? 5 : 2;
    if (!a.fx && a.blob !== false) { c.blob.visible = true; c.blob.position.set(a.pos[0], (a.ground ?? a.pos[1]) + 0.015, a.pos[2]); c.blob.scale.set(1.2 * s, 0.75 * s, 1); } });
}

// ---------- water ----------
export const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#1d5a72') }, shal: { value: new THREE.Color('#3f9bb0') }, skyc: { value: new THREE.Color('#bcd6ea') }, glint: { value: new THREE.Color('#fff6dc') },
  sunDir: skyU.sunDir, camPos: { value: new THREE.Vector3() }, fogCol: { value: new THREE.Color() }, fogNear: { value: 50 }, fogFar: { value: 900 }, wallZ: { value: 4.2 }, wallX: { value: 31 }, amp: { value: 1 } };
export const waterMat = new THREE.ShaderMaterial({ uniforms: waterU,
  vertexShader: `uniform float t, amp; varying vec3 vW; varying float vH;
    float wv(vec2 p){ return sin(p.x*.18+t*1.1)*.22 + sin(p.y*.23-t*1.4+p.x*.07)*.18 + sin((p.x+p.y)*.5+t*2.1)*.07; }
    void main(){ vec4 w = modelMatrix*vec4(position,1.); float h = wv(w.xz)*amp; w.y += h; vH = h; vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float t, fogNear, fogFar, wallZ, wallX, amp; uniform vec3 deep, shal, skyc, glint, sunDir, camPos, fogCol; varying vec3 vW; varying float vH;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec3 V = normalize(camPos - vW); float n1 = noise(vW.xz*.25 + vec2(t*.15, t*.1)), n2 = noise(vW.xz*1.3 - vec2(t*.4, -t*.2));
      vec3 N = normalize(vec3((n1-.5)*.5 + (n2-.5)*.25, 1., (noise(vW.xz*.31+7.)-.5)*.5)); float fres = pow(1. - max(dot(N, V), 0.), 3.);
      vec3 c = mix(shal, deep, smoothstep(-.2, .3, vH*1.5 + n1*.3)); c = mix(c, skyc, fres*.65);
      float crest = smoothstep(.34, .5, vH + n2*.1) * amp; c = mix(c, vec3(.9,.95,.97), crest*.45);
      // foam where waves hit the sea wall (box |z|<wallZ, x<wallX)
      float dw = max(abs(vW.z) - wallZ, vW.x - wallX); float foam = smoothstep(1.4, 0., dw) * (.55 + .45*noise(vW.xz*2. + vec2(t*1.5, 0.)));
      foam *= smoothstep(-.3, .1, dw); c = mix(c, vec3(.95,.98,1.), clamp(foam, 0., 1.)*.85);
      vec3 R = reflect(-normalize(sunDir), N); float sp = pow(max(dot(R, V), 0.), 120.); c += glint * sp * 2.2 * step(.0, sunDir.y);
      float fd = smoothstep(fogNear, fogFar, length(camPos - vW)); c = mix(c, fogCol, fd);
      gl_FragColor = vec4(c, 1.); }` });

// ---------- post pipeline ----------
const RT = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, ...o });
const rtCol = RT(W, H, { samples: 4 }), rtNd = RT(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }), rtInk = RT(W, H), rtA = RT(W / 2, H / 2), rtB = RT(W / 2, H / 2);
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const pass = (u, frag) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }', fragmentShader: frag }))); return s; };
const inkU = { col: { value: rtCol.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 2.4 }, inkFar: { value: 220 },
  sat: { value: 1 }, con: { value: 0 }, shT: { value: new THREE.Color(1, 1, 1) }, hiT: { value: new THREE.Color(1, 1, 1) }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) },
  vig: { value: 0.25 }, flash: { value: 0 }, fade: { value: 0 }, exposure: { value: 1 } };
const inkScene = pass(inkU, `uniform sampler2D col, nd; uniform vec2 res; uniform float px, inkFar, sat, con, vig, flash, fade, exposure; uniform vec3 shT, hiT, lift, gain; varying vec2 vUv;
  float ink(vec2 uv){ vec4 c = texture2D(nd, uv); if (c.a <= 0. || dot(c.rgb,c.rgb) < .001) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.; float e = 0.;
    float r = px * clamp(9./d, .6, 1.3);
    for (int i=0;i<12;i++){ float a = float(i)*.5236; vec2 o = vec2(cos(a), sin(a))*r/res; vec4 s = texture2D(nd, uv+o);
      if (s.a > 0. && dot(s.rgb,s.rgb) < .001) continue; float ds = s.a <= 0. ? 1e5 : s.a;
      e = max(e, smoothstep(.012, .045, (ds-d)/d)); if (abs(ds-d)/d < .04) e = max(e, smoothstep(.86, .62, dot(n, s.rgb*2.-1.))*.8); }
    return e * (1. - smoothstep(inkFar*.35, inkFar, d)*.85); }
  void main(){ vec3 c = texture2D(col, vUv).rgb * exposure; c = mix(c, vec3(.03,.02,.02), ink(vUv));
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    l = dot(c, vec3(.299,.587,.114)); c = mix(c*shT, c*hiT, smoothstep(.04,.7,l));
    vec3 cc = clamp(c,0.,1.); c = mix(c, cc*cc*(3.-2.*cc), con); c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.72), q*vec2(1.,.72))*2.4;
    c = mix(c, vec3(1.), flash); c *= 1. - fade; gl_FragColor = vec4(c, 1.); }`);
const brU = { src: { value: rtInk.texture }, thr: { value: 0.85 } };
const brScene = pass(brU, `uniform sampler2D src; uniform float thr; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; gl_FragColor = vec4(max(c - thr, 0.), 1.); }`);
const blU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const blScene = pass(blU, `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 a = texture2D(src, vUv).rgb*.227;
  a += (texture2D(src, vUv+dir*1.38).rgb + texture2D(src, vUv-dir*1.38).rgb)*.316; a += (texture2D(src, vUv+dir*3.23).rgb + texture2D(src, vUv-dir*3.23).rgb)*.07;
  a += (texture2D(src, vUv+dir*5.5).rgb + texture2D(src, vUv-dir*5.5).rgb)*.03; gl_FragColor = vec4(a, 1.); }`);
const lensU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, glow: { value: rtA.texture }, glowI: { value: 0.6 }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, blur: { value: 0 }, nearK: { value: 1 } };
const lensScene = pass(lensU, `uniform sampler2D src, nd, glow; uniform vec2 res; uniform float focus, blur, nearK, glowI; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 3000.; float k = 1. - focus/d; return k > 0. ? blur*k : min(-k*blur*nearK, blur*1.4); }
  void main(){ float c0 = coc(vUv); vec3 col;
    if (blur < .5 || c0 < .7) col = texture2D(src, vUv).rgb;
    else { vec3 acc = vec3(0.); float ws = 0.; for (int i=0;i<40;i++){ float fi = float(i); float r = sqrt((fi+.5)/40.); float a = fi*2.39996; vec2 o = vec2(cos(a), sin(a))*r*c0/res;
      float cs = coc(vUv+o); float w = smoothstep(r*c0-1.5, r*c0+.5, cs+.5); acc += texture2D(src, vUv+o).rgb*w; ws += w; } col = acc/max(ws, 1e-3); }
    col += texture2D(glow, vUv).rgb * glowI; gl_FragColor = linearToOutputTexel(vec4(col, 1.)); }`);
export const post = {
  grade(L) { inkU.sat.value = L.sat ?? 1.05; inkU.con.value = L.con ?? 0.3; inkU.shT.value.set(L.shT || '#ffffff'); inkU.hiT.value.set(L.hiT || '#ffffff'); inkU.vig.value = L.vig ?? 0.25;
    inkU.lift.value.set(L.lift || '#000000'); inkU.gain.value.set(L.gain || '#ffffff'); inkU.exposure.value = L.exposure ?? 1; brU.thr.value = L.thr ?? 0.85; lensU.glowI.value = L.glowI ?? 0.6; inkU.inkFar.value = L.inkFar ?? 220; },
};
const swapND = (on) => scene.traverse((o) => { if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
  if (on) { o.userData._m = o.material; o.userData._v = o.visible; if (o.userData.ndSkip) { o.visible = false; return; } o.material = o.userData.nd || (o.isInstancedMesh ? ND_INST : ND); }
  else { o.material = o.userData._m; o.visible = o.userData._v; } });

/** render one frame. view: {pos, look, fov, roll, focus, blur, flash, fade} */
export function setView(view) {
  camera.position.set(...view.pos); camera.up.set(0, 1, 0); camera.lookAt(...view.look); camera.rotateZ((view.roll || 0) * Math.PI / 180);
  camera.fov = view.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); sky.position.copy(camera.position);
}
export function render(view) {
  setView(view);
  waterU.camPos.value.copy(camera.position); waterU.fogCol.value.copy(scene.fog.color); waterU.fogNear.value = scene.fog.near; waterU.fogFar.value = scene.fog.far;
  renderer.setRenderTarget(rtCol); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapND(true);
  renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapND(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  inkU.flash.value = view.flash || 0; inkU.fade.value = view.fade || 0; renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  renderer.setRenderTarget(rtA); renderer.render(brScene, fsCam);
  for (let k = 1; k <= 2; k++) { blU.src.value = rtA.texture; blU.dir.value.set(2 * k / W, 0); renderer.setRenderTarget(rtB); renderer.render(blScene, fsCam);
    blU.src.value = rtB.texture; blU.dir.value.set(0, 2 * k / H); renderer.setRenderTarget(rtA); renderer.render(blScene, fsCam); }
  lensU.focus.value = view.focus || 10; lensU.blur.value = view.blur || 0; lensU.nearK.value = view.nearK ?? 1;
  renderer.setRenderTarget(null); renderer.render(lensScene, fsCam);
}

// ---------- camera rig: keyed glides (smootherstep) + impact kicks ----------
const sstep = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t, lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export function camAt(keys, t, kicks = []) {
  let v; if (t <= keys[0].t) v = { ...keys[0] }; else if (t >= keys[keys.length - 1].t) v = { ...keys[keys.length - 1] };
  else for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { const a = keys[i], b = keys[i + 1], k = (b.ease === 'out' ? (x) => 1 - Math.pow(1 - x, 3) : sstep)((t - a.t) / (b.t - a.t));
    v = { pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll || 0, b.roll || 0, k) }; break; }
  for (const kk of kicks) { const d = (t - kk.t) * 30; if (d >= 0 && d < 8) { const s = (Math.floor(d) % 2 ? -1 : 1) * kk.a * (1 - d / 8); v.look = [v.look[0] + s * 0.6, v.look[1] + s, v.look[2] + s * 0.4]; v.roll = (v.roll || 0) + s * 18; } }
  return v;
}
export { sstep, lerp };

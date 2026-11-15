// PAINTERLY STYLE (original, EXPERIMENTAL): one illustrated look for any set.
//   1. materials -> cel-banded toon materials; photo textures sampled at a soft mip (painted, not photographic)
//   2. ink pass  -> dark outlines from depth discontinuities (silhouettes) + lighter interior lines from colour edges,
//                   plus a saturation/warmth lift
//   3. painted sky dome (gradient + sun glow + cel-banded clouds) replaces the photo HDRI background
//   4. lighting presets (key / fill / rim colours, fog matched to the sky)
// Enable per story with  "style": { "preset": "sunset", ... }  (director.js calls applyStyle after business init).
import * as THREE from 'three';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export const PRESETS = {
  golden: { sky: { zenith: '#4f86d9', mid: '#9fc2ee', horizon: '#ffd9a0', sun: '#fff6dc', sunDir: [-0.42, 0.5, -0.76], clouds: '#ffffff', cloudShade: '#c6b7e2' },
            key: { color: '#fff0d8', intensity: 3.6 }, fill: { sky: '#9db8ec', ground: '#8a6c58', intensity: 0.85 }, rim: { color: '#ffe6c0', intensity: 1.8 },
            fog: { color: '#d8e4f2', near: 90, far: 420 }, exposure: 1.08, ink: { color: '#1e1a2c', strength: 0.95, warm: 0.0, sat: 1.12 }, water: { color: '#2f86b8', rough: 0.4, env: 0.3 }, sharpShadows: true },
  sunset: { sky: { zenith: '#3d4a8c', mid: '#c46a8a', horizon: '#ffb070', sun: '#fff0c0', sunDir: [-0.55, 0.18, -0.82], clouds: '#ffcf9e', cloudShade: '#8a5a8a' },
            key: { color: '#ffb36b', intensity: 3.4 }, fill: { sky: '#7b74c2', ground: '#7a4e3c', intensity: 0.95 }, rim: { color: '#ffd6a0', intensity: 1.6 },
            fog: { color: '#e9a07e', near: 70, far: 360 }, exposure: 1.0, ink: { color: '#2a1424', strength: 0.9 }, water: { color: '#2b5f86', rough: 0.42, env: 0.25 } },
  day:    { sky: { zenith: '#3f7fd6', mid: '#86bdf0', horizon: '#dff1ff', sun: '#fffbe8', sunDir: [0.35, 0.62, 0.7], clouds: '#ffffff', cloudShade: '#b9cbe6' },
            key: { color: '#fff1d6', intensity: 3.0 }, fill: { sky: '#a9c8f0', ground: '#8a7458', intensity: 1.0 }, rim: { color: '#ffffff', intensity: 0.8 },
            fog: { color: '#cfe4f5', near: 90, far: 420 }, exposure: 1.0, ink: { color: '#1f2433', strength: 0.85 }, water: { color: '#1f7fae', rough: 0.35, env: 0.35 } },
  // Visual standard v2 (experimental): an evening interior; the 'sun' is cool moonlight through the windows, warmth comes from practical lights
  interior_evening: { sky: { zenith: '#0e1636', mid: '#2a3a6e', horizon: '#3a4a7e', sun: '#c8d6ff', sunDir: [0.15, 0.45, -0.88], clouds: '#3a4a7e', cloudShade: '#1b2556' },
            key: { color: '#9fb6ff', intensity: 1.1 }, fill: { sky: '#ffd9a8', ground: '#3a2a22', intensity: 0.55 }, rim: { color: '#ffb070', intensity: 0.5 }, rimHeight: 0.3,
            fog: { color: '#2a1f2a', near: 14, far: 42 }, exposure: 1.05, ink: { color: '#1e1418', strength: 0.75, sat: 1.08, warm: 0.02 }, water: { color: '#2f86b8', rough: 0.4, env: 0.3 } },
  night:  { sky: { zenith: '#0d1440', mid: '#1f2f72', horizon: '#3b5aa0', sun: '#e8f0ff', sunDir: [0.2, 0.55, -0.8], clouds: '#5a6fb0', cloudShade: '#1b2556' },
            key: { color: '#9fb8ff', intensity: 1.6 }, fill: { sky: '#3a4fa0', ground: '#1a1f3a', intensity: 0.8 }, rim: { color: '#c8d8ff', intensity: 1.0 },
            fog: { color: '#22305e', near: 60, far: 300 }, exposure: 1.05, ink: { color: '#0a0c1a', strength: 0.9 }, water: { color: '#16285a', rough: 0.4, env: 0.2 } },
};

let GM = null;   // shared 3-band gradient (shadow / mid / lit)
export function toonGradient(bands = [0.56, 0.8, 1.0]) {
  if (GM) return GM; const d = new Uint8Array(bands.length * 4); bands.forEach((b, i) => d.set([b * 255, b * 255, b * 255, 255], i * 4));
  GM = new THREE.DataTexture(d, bands.length, 1); GM.minFilter = GM.magFilter = THREE.NearestFilter; GM.needsUpdate = true; return GM;
}
// soft-mip sampling + small saturation lift on the colour map: photo detail reads as painted
export function paintMap(mat, bias = 2.6, sat = 1.12) {
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
    `#ifdef USE_MAP
       vec4 sampledDiffuseColor = texture2D( map, vMapUv, ${bias.toFixed(2)} );
       float _l = dot( sampledDiffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
       sampledDiffuseColor.rgb = mix( vec3( _l ), sampledDiffuseColor.rgb, ${sat.toFixed(2)} );
       diffuseColor *= sampledDiffuseColor;
     #endif`); };
  mat.customProgramCacheKey = () => `paint${bias}${sat}`; return mat;
}
// ---- painted textures (procedural, inked seams) replacing photographic maps, chosen by the map's source id
const PAINT = new Map();
const rnd = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
function paintedStone(g, S) { g.fillStyle = '#d9c29a'; g.fillRect(0, 0, S, S); const rows = 8, h = S / rows;
  for (let r = 0; r < rows; r++) { const off = (r % 2) * 0.5, n = 4; for (let c = -1; c <= n; c++) { const x0 = (c + off) * S / n, w = S / n, k = rnd(r * 13 + c * 7 + 3);
    g.fillStyle = `hsl(${32 + k * 10}, ${30 + k * 14}%, ${66 + (k - 0.5) * 14}%)`; g.fillRect(x0 + 4, r * h + 4, w - 8, h - 8);
    g.fillStyle = 'rgba(255,245,220,0.35)'; g.fillRect(x0 + 6, r * h + 6, w - 12, 6);   // lit top edge
    g.fillStyle = 'rgba(90,60,40,0.18)'; g.fillRect(x0 + 6, r * h + h - 14, w - 12, 8); // shadow lip
    if (k > 0.7) { g.strokeStyle = 'rgba(60,40,30,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + w * 0.3, r * h + h * 0.3); g.lineTo(x0 + w * 0.45, r * h + h * 0.55); g.stroke(); } } }
  g.strokeStyle = '#4a3428'; g.lineWidth = 6; for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(0, r * h); g.lineTo(S, r * h); g.stroke(); }
  for (let r = 0; r < rows; r++) { const off = (r % 2) * 0.5; for (let c = 0; c <= 4; c++) { const x = ((c + off) % 4) * S / 4; g.beginPath(); g.moveTo(x, r * h); g.lineTo(x, r * h + h); g.stroke(); } } }
function paintedPlanks(g, S) { const n = 8, w = S / n;
  for (let i = 0; i < n; i++) { const k = rnd(i * 5 + 1); g.fillStyle = `hsl(${24 + k * 8}, ${42 + k * 10}%, ${52 + (k - 0.5) * 12}%)`; g.fillRect(0, i * w, S, w);
    g.strokeStyle = 'rgba(70,40,25,0.25)'; g.lineWidth = 3; for (let j = 0; j < 3; j++) { const y = i * w + w * (0.25 + j * 0.25) + (rnd(i * 9 + j) - 0.5) * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(S * 0.3, y + 5, S * 0.6, y - 5, S, y); g.stroke(); }
    g.fillStyle = 'rgba(255,235,200,0.22)'; g.fillRect(0, i * w + 3, S, 5); const cut = rnd(i * 3 + 2) * S; g.fillStyle = '#3a2418'; g.fillRect(cut, i * w, 5, w);
    for (const x of [cut - 18, cut + 18]) { g.beginPath(); g.arc(x, i * w + w * 0.3, 3.5, 0, 7); g.arc(x, i * w + w * 0.7, 3.5, 0, 7); g.fill(); } }
  g.strokeStyle = '#3a2418'; g.lineWidth = 5; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(0, i * w); g.lineTo(S, i * w); g.stroke(); } }
function paintedFlat(g, S, base) { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * 0.08})`; g.beginPath(); g.arc(rnd(i * 3) * S, rnd(i * 7) * S, 6 + rnd(i * 11) * 26, 0, 7); g.fill(); } }
export function paintedTexture(src, orig) {
  const kind = /castle_wall|rock_face|stone/.test(src) ? 'stone' : /plank|wood/.test(src) ? 'planks' : /plaster/.test(src) ? 'plaster' : /sand|gravel/.test(src) ? 'sand' : null; if (!kind) return null;
  if (!PAINT.has(kind)) { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    if (kind === 'stone') paintedStone(g, 512); else if (kind === 'planks') paintedPlanks(g, 512); else paintedFlat(g, 512, kind === 'plaster' ? '#f1e7d4' : '#d9c39a');
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; PAINT.set(kind, t); }
  const t = PAINT.get(kind).clone(); t.repeat.copy(orig.repeat); t.offset.copy(orig.offset); t.rotation = orig.rotation; t.needsUpdate = true; return t;
}
export function toToon(m, o = {}) {
  const t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: toonGradient(), transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest,
    side: m.side, vertexColors: m.vertexColors, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity, fog: m.fog, depthWrite: m.depthWrite });
  // kit textures (style/painted.js, userData.painted) are already painted: no mip-blur
  const painted = m.map && m.map.userData && m.map.userData.src && o.paintTextures !== false ? paintedTexture(m.map.userData.src, m.map) : null;
  if (painted) t.map = painted; else if (m.map && !(m.map.userData && m.map.userData.painted)) paintMap(t, o.mapBias, o.mapSat); t.name = (m.name || '') + '|toon'; return t;
}
const isCard = (m) => m.map && m.map.isCanvasTexture && m.emissiveMap === m.map;   // 2D character cards keep their own look
const isCustom = (m) => Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile');   // custom-shader materials (e.g. the ocean's Gerstner waves) keep theirs

class InkPass extends Pass {
  constructor(w, h, o) { super();
    this.u = { tDiffuse: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(w, h) }, near: { value: 0.02 }, far: { value: 200 },
      ink: { value: new THREE.Color(o.color || '#24161e') }, strength: { value: o.strength ?? 0.9 }, px: { value: o.px ?? (w / 1080) * 1.6 },
      dEdge: { value: o.depthEdge ?? 0.06 }, cEdge: { value: o.colorEdge ?? 0.22 }, cW: { value: o.colorWeight ?? 0.45 }, sat: { value: o.sat ?? 1.18 }, warm: { value: o.warm ?? 0.04 } };
    this.q = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: this.u,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 res; uniform float near, far, strength, px, dEdge, cEdge, cW, sat, warm; uniform vec3 ink; varying vec2 vUv;
        float ld(vec2 uv){ float z = texture2D(tDepth, uv).x; if (z >= 0.99999) return log(far * 4.0); float vz = near * far / ((far - near) * z - far); return log(-vz); }
        float lum(vec2 uv){ return dot(texture2D(tDiffuse, uv).rgb, vec3(.299, .587, .114)); }
        void main(){ vec2 o = px / res; vec3 c = texture2D(tDiffuse, vUv).rgb;
          float d00 = ld(vUv - o), d10 = ld(vUv + vec2(0., -o.y)), d20 = ld(vUv + vec2(o.x, -o.y)), d01 = ld(vUv + vec2(-o.x, 0.)), d21 = ld(vUv + vec2(o.x, 0.)), d02 = ld(vUv + vec2(-o.x, o.y)), d12 = ld(vUv + vec2(0., o.y)), d22 = ld(vUv + o);
          float gx = (d20 + 2.*d21 + d22) - (d00 + 2.*d01 + d02), gy = (d02 + 2.*d12 + d22) - (d00 + 2.*d10 + d20);
          float de = smoothstep(dEdge, dEdge * 2.2, sqrt(gx*gx + gy*gy));
          float l00 = lum(vUv - o), l20 = lum(vUv + vec2(o.x, -o.y)), l02 = lum(vUv + vec2(-o.x, o.y)), l22 = lum(vUv + o), l10 = lum(vUv + vec2(0., -o.y)), l12 = lum(vUv + vec2(0., o.y)), l01 = lum(vUv + vec2(-o.x, 0.)), l21 = lum(vUv + vec2(o.x, 0.));
          float cx = (l20 + 2.*l21 + l22) - (l00 + 2.*l01 + l02), cy = (l02 + 2.*l12 + l22) - (l00 + 2.*l10 + l20);
          float ce = smoothstep(cEdge, cEdge * 2.0, sqrt(cx*cx + cy*cy)) * cW;
          float e = clamp(max(de, ce), 0., 1.) * strength;
          float l = dot(c, vec3(.299, .587, .114)); c = mix(vec3(l), c, sat); c += vec3(warm, warm * 0.4, -warm * 0.6) * (1. - l);
          gl_FragColor = vec4(mix(c, ink, e), 1.); }` })); }
  render(renderer, writeBuffer, readBuffer) { this.u.tDiffuse.value = readBuffer.texture; this.u.tDepth.value = readBuffer.depthTexture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.q.render(renderer); }
}

function paintedSky(scene, camera, S) {
  const u = { zen: { value: new THREE.Color(S.zenith) }, mid: { value: new THREE.Color(S.mid) }, hor: { value: new THREE.Color(S.horizon) }, sunC: { value: new THREE.Color(S.sun) },
    sunD: { value: new THREE.Vector3(...S.sunDir).normalize() }, cl: { value: new THREE.Color(S.clouds) }, clS: { value: new THREE.Color(S.cloudShade) }, t: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(150, 48, 32), new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 zen, mid, hor, sunC, cl, clS, sunD; uniform float t; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= .5; } return s; }
      void main(){ vec3 d = normalize(vD); float y = d.y;
        vec3 c = y < 0.12 ? mix(hor, mid, smoothstep(-0.02, 0.12, y)) : mix(mid, zen, smoothstep(0.12, 0.62, y));
        float sd = max(dot(d, sunD), 0.); c += sunC * (pow(sd, 900.) * 1.6 + pow(sd, 24.) * 0.35 + pow(sd, 4.) * 0.12);
        vec2 p = d.xz / max(0.08, d.y + 0.18) * 1.4 + vec2(t * 0.01, 0.);
        float k = fbm(p * 0.55) * smoothstep(0.02, 0.22, y) * (1. - smoothstep(0.55, 0.85, y));
        float band = step(0.47, k) + step(0.57, k) * 0.6;   // cel-banded clouds
        vec3 cc = mix(clS, cl, clamp(0.3 + pow(sd, 3.) * 0.9 + (k - 0.47) * 2.4 + step(0.57, k) * 0.25, 0., 1.));
        c = mix(c, cc, clamp(band, 0., 1.) * 0.9);
        gl_FragColor = vec4(c, 1.); }` }));
  m.renderOrder = -10; m.frustumCulled = false; m.onBeforeRender = () => { m.position.copy(camera.position); m.updateMatrixWorld(); m.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, m.matrixWorld); }; scene.add(m); return { mesh: m, u };
}

// apply the style to the current scene (call once, after the set and business have built their objects)
export function applyStyle(C, cfg = {}) {
  const P = { ...PRESETS[cfg.preset || 'sunset'], ...(cfg.override || {}) }, { scene, camera, composer, renderer } = C;
  const cache = new Map(), skip = new Set(cfg.skipNames || []);
  scene.traverse((o) => { if (!o.isMesh || o.userData.keepMaterial || skip.has(o.name)) return;
    const conv = (m) => { if (!m || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial) || isCard(m) || isCustom(m)) return m;
      if (!cache.has(m)) cache.set(m, toToon(m, cfg)); return cache.get(m); };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
  // custom-shader water keeps its geometry/waves but loses the photographic mirror look
  if (P.water) scene.traverse((o) => { const m = o.material; if (o.isMesh && m && m.isMeshPhysicalMaterial && isCustom(m)) { m.color.set(P.water.color); m.roughness = P.water.rough; m.clearcoat = 0; m.envMapIntensity = P.water.env; if (m.normalScale) m.normalScale.multiplyScalar(0.6); m.needsUpdate = true; } });
  // lights: re-colour the set's lights, add a rim light opposite the key
  const lights = []; scene.traverse((o) => { if (o.isLight) lights.push(o); });
  const key = lights.find((l) => l.isDirectionalLight && l.castShadow) || lights.find((l) => l.isDirectionalLight);
  if (key) { key.color.set(P.key.color); key.intensity = P.key.intensity; const sd = new THREE.Vector3(...P.sky.sunDir).normalize(); key.position.copy(key.target.position).addScaledVector(sd, 140);
    if (cfg.shadowBox) { const [cx, cy, cz, r] = cfg.shadowBox; key.target.position.set(cx, cy, cz); key.position.set(cx, cy, cz).addScaledVector(sd, 140); Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 60, far: 240 }); key.shadow.camera.updateProjectionMatrix(); }
    key.target.updateMatrixWorld(); }
  for (const l of lights) if (l.isHemisphereLight) { l.color.set(P.fill.sky); l.groundColor.set(P.fill.ground); l.intensity = P.fill.intensity; }
  const rim = new THREE.DirectionalLight(P.rim.color, P.rim.intensity); const rd = new THREE.Vector3(...P.sky.sunDir).multiplyScalar(-1); rd.y = P.rimHeight ?? 0.12;   // low, grazing rim: edges glow, but upward surfaces (decks) keep their shadows
  rim.position.copy(rd.normalize().multiplyScalar(100)); scene.add(rim);
  scene.environmentIntensity = (scene.environmentIntensity ?? 1) * 0.35; scene.background = null; const sky = paintedSky(scene, camera, P.sky);
  if (scene.fog) { scene.fog.color.set(P.fog.color); scene.fog.near = P.fog.near; scene.fog.far = P.fog.far; }
  renderer.toneMappingExposure = P.exposure; if (P.sharpShadows) { renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.needsUpdate = true; }
  // ink pass right after the scene render (needs the scene depth): depth textures on both composer targets
  for (const rt of [composer.renderTarget1, composer.renderTarget2]) { rt.depthTexture = new THREE.DepthTexture(rt.width, rt.height); rt.depthTexture.type = THREE.UnsignedIntType; }
  const ink = new InkPass(composer.renderTarget1.width, composer.renderTarget1.height, { ...P.ink, ...(cfg.ink || {}) }); ink.u.near.value = camera.near; ink.u.far.value = camera.far;
  composer.insertPass(ink, 1);
  // ambient occlusion (Visual standard v2, experimental): contact shading that grounds characters and props
  if (cfg.ao) { const ao = new GTAOPass(scene, camera, composer.renderTarget1.width, composer.renderTarget1.height); Object.assign(ao.blendIntensity !== undefined ? ao : {}, { blendIntensity: cfg.ao.intensity ?? 0.9 });
    ao.updateGtaoMaterial({ radius: cfg.ao.radius ?? 0.35, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: cfg.ao.samples ?? 12 }); composer.insertPass(ao, 2);
    const aoRender = ao.render.bind(ao); ao.render = (...a) => { const hid = []; scene.traverse((o) => { if ((o.isSprite || (o.material && o.material.transparent && (o.material.blending === THREE.AdditiveBlending || o.material.depthWrite === false))) && o.visible) { o.visible = false; hid.push(o); } });
      aoRender(...a); for (const o of hid) o.visible = true; }; }   // glow sprites must not occlude (they read as dark quads)   // after the ink pass (ink reads the render pass depth)
  return { preset: P, sky, ink, key, rim, converted: cache.size };
}

// PBR stage (original code): Poly Haven CC0 models/textures/HDRI, ACES tone mapping, soft shadows, bloom + DOF + grade.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { THREE };

export const W = 1080, H = 1920;
export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(35, W / H, 0.02, 200);

const gl = new GLTFLoader(), texL = new THREE.TextureLoader();
export const loadModel = (id) => new Promise((res, rej) => gl.load(`./assets/models/${id}/${id}.gltf`, (g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); res(g.scene); }, undefined, rej));
export const pbr = (id, rep = [1, 1], o = {}) => { const t = (k, srgb) => { const x = texL.load(`./assets/textures/${id}/${k}.jpg`); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(...rep); x.anisotropy = 8; if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  return new THREE.MeshStandardMaterial({ map: t('diff', true), normalMap: t('nor'), roughnessMap: t('rough'), aoMap: t('ao'), ...o }); };
export async function loadHDRI(path, intensity = 1) {
  const hdr = await new RGBELoader().loadAsync(path); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; scene.environmentIntensity = intensity; hdr.dispose(); pm.dispose();
}

// post: render -> bloom -> lens (bokeh) -> grade (split-tone, contrast, vignette, grain) -> output
export const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.24, 0.5, 0.96); composer.addPass(bloom);
export const bokeh = new BokehPass(scene, camera, { focus: 2.0, aperture: 0.0012, maxblur: 0.006 }); composer.addPass(bokeh);
export const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, shT: { value: new THREE.Color('#d7dcf2') }, hiT: { value: new THREE.Color('#fff2e0') }, con: { value: 0.18 }, vig: { value: 0.32 }, flash: { value: 0 }, t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 shT, hiT; uniform float con, vig, flash, t; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + t*7.13)*43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299,.587,.114));
      c = mix(c*shT, c*hiT, smoothstep(.05,.75,l)); vec3 cc = clamp(c,0.,1.); c = mix(c, cc*cc*(3.-2.*cc), con);
      vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.3; c += (h(vUv*1000.)-.5)*.018; c = mix(c, vec3(1.), flash);
      gl_FragColor = vec4(c, 1.); }` });
composer.addPass(grade); composer.addPass(new OutputPass());

// 2D character card, lit by the scene (standard material so it takes the key light, env light and received shadows)
export function makeCard(widthM, heightM, canvas) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(widthM, heightM); geo.translate(0, heightM / 2, 0);
  { const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.35, 0.94); }
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, roughness: 0.85, metalness: 0, emissive: new THREE.Color(0.2, 0.19, 0.18), emissiveMap: t, envMapIntensity: 0.35 });
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
  scene.add(m); return { mesh: m, tex: t };
}
const sstep = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
export const lerp = (a, b, k) => a + (b - a) * k, lerp3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
export function camKeys(keys, t) { let v; if (t <= keys[0].t) v = keys[0]; else if (t >= keys[keys.length - 1].t) v = keys[keys.length - 1];
  else for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { const a = keys[i], b = keys[i + 1], k = (b.ease === 'out' ? (x) => 1 - Math.pow(1 - x, 3) : sstep)((t - a.t) / (b.t - a.t));
    v = { pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll || 0, b.roll || 0, k), focus: lerp(a.focus, b.focus, k), ap: lerp(a.ap ?? 0.0012, b.ap ?? 0.0012, k) }; break; }
  return { ...v }; }
export { sstep };

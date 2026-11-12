import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = innerWidth, H = innerHeight;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, x) => a + (b - a) * x, seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => (x = clamp(x), x * x * (3 - 2 * x)), eo = x => 1 - Math.pow(1 - clamp(x), 3), ei = x => Math.pow(clamp(x), 3);
const eio = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), eo5 = x => 1 - Math.pow(1 - clamp(x), 5);
const back = (x, s = 1.6) => (x = clamp(x) - 1, 1 + x * x * ((s + 1) * x + s));
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const GOLD = new THREE.Color('#FFC23D'), GOLD2 = new THREE.Color('#FFE08A'), CYAN = new THREE.Color('#3AD6FF'), VIOLET = new THREE.Color('#6B4DFF');
const CSS = { gold: '#FFC93C', gold2: '#FFE38F', cyan: '#4FDCFF', white: '#FFFFFF', yel: '#FFD23F', red: '#FF4B4B' };
const AN = 'Anton', BX = 'BarlowXB', BB = 'BarlowB', BS = 'BarlowS', EMO = '"Noto Color Emoji"';

// ---------------- renderer + post ----------------
const glc = document.getElementById('gl'), uic = document.getElementById('ui');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
uic.width = W; uic.height = H; const X = uic.getContext('2d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, .02, 400);
camera.setViewOffset(W, H, 36, 0, W, H);               // everything sits ~36 px left of centre: the right edge belongs to Instagram's buttons
scene.fog = new THREE.FogExp2(0x050817, .02);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .9, .55, .9);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1.25, 1.15, .95) }, uDesat: { value: 0 }, uCA: { value: .0015 }, uVig: { value: .55 }, uTime: { value: 0 }, uStreak: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uFlash, uDesat, uCA, uVig, uTime, uStreak; uniform vec3 uFlashCol;
    void main(){ vec2 d = vUv - .5; float r2 = dot(d,d);
      vec3 c;
      if (uStreak > 0.) { c = vec3(0.); for (int i = 0; i < 8; i++) { float k = float(i) / 7.; vec2 uv = .5 + d * (1. - uStreak * .09 * k); c += texture2D(tDiffuse, uv).rgb; } c /= 8.; }
      else { c.r = texture2D(tDiffuse, vUv - d * uCA * (1. + r2*4.)).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv + d * uCA * (1. + r2*4.)).b; }
      c += vec3(.010, .014, .040) * (1. - vUv.y * .6);            // navy lift in the shadows
      float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(c, vec3(l) * vec3(.85,.95,1.15), uDesat);
      vec2 dv = d; dv.x *= 1.2; c *= 1. - uVig * smoothstep(.18, .75, length(dv));
      c = mix(c, uFlashCol, uFlash);
      gl_FragColor = vec4(c, 1.); }`
});
composer.addPass(grade); composer.addPass(new OutputPass());

function bgTex(top, mid, bot) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(.55, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

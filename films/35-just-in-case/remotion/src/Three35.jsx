// 2.5D shots in three.js: the still is split (layers.py) into a depth-displaced background and a cut-out subject
// on its own depth-displaced mesh. The camera really moves through the scene (parallax), the subject layer bends
// from the feet (sway/dance), breathes, heaves; rain falls in 3D in front of and behind the subject.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, staticFile, useCurrentFrame, delayRender, continueRender } from 'remotion';

const W = 1080, H = 1920, FPS = 30;
const PH = 2.0, PW = PH * 1296 / 2316;          // plane size in world units (image aspect)

const VERT = `
uniform sampler2D depthMap; uniform float depthAmt; uniform float zOff;
uniform float swayA; uniform float bobA; uniform float feetY; uniform float headY; uniform float pivotX;
uniform float breath; uniform float chestY; uniform float heave;
varying vec2 vUv;
void main(){
  vUv = uv; vec3 p = position;
  float d = texture2D(depthMap, uv).r;
  p.z += d * depthAmt + zOff;
  float h = clamp((uv.y - feetY) / (headY - feetY), 0.0, 1.0);
  p.x += swayA * pow(h, 1.4);                         // bend from the feet: a lean that grows with height
  p.y += bobA * h;                                    // rise and fall
  float c = exp(-pow((uv.y - chestY) / 0.10, 2.0));   // breathing: chest/shoulders swell and lift
  p.x += (p.x - pivotX) * breath * c * 0.6;
  p.y += heave * smoothstep(chestY - 0.12, chestY + 0.1, uv.y) * h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG_BG = `
uniform sampler2D map; uniform float time; uniform float ripple; uniform float rippleY; varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  if (ripple > 0.0 && uv.y < rippleY) {                // wet ground shimmer (reflections wobble)
    float k = (rippleY - uv.y) / rippleY;
    uv.x += ripple * k * sin(uv.y * 180.0 + time * 6.0) * 0.004;
    uv.y += ripple * k * sin(uv.x * 140.0 - time * 5.0) * 0.002;
  }
  gl_FragColor = texture2D(map, uv);
}`;
const FRAG_FG = `uniform sampler2D map; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.02) discard; gl_FragColor = c; }`;

const loadTex = (url) => new Promise((res) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; res(t); }));

export const ThreeShot = ({ id, t0, dur, cfg }) => {
  const ref = useRef(null); const S = useRef(null);
  const [ready, setReady] = useState(false);
  const [h0] = useState(() => delayRender('three ' + id));
  const frame = useCurrentFrame(); const t = frame / FPS;

  useEffect(() => {
    (async () => {
      const base = `L/${id}`;
      const [bg, fg, dep] = await Promise.all([loadTex(staticFile(`${base}/bg.jpg`)), loadTex(staticFile(`${base}/fg.png`)), loadTex(staticFile(`${base}/depth.png`))]);
      dep.colorSpace = THREE.NoColorSpace;
      const renderer = new THREE.WebGLRenderer({ canvas: ref.current, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
      const cam = new THREE.PerspectiveCamera(30, W / H, 0.01, 50);
      const geo = new THREE.PlaneGeometry(PW, PH, 180, 320);
      const common = (map, frag, extra) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, transparent: frag === FRAG_FG,
        uniforms: { map: { value: map }, depthMap: { value: dep }, depthAmt: { value: cfg.depth ?? 0.35 }, zOff: { value: 0 }, swayA: { value: 0 }, bobA: { value: 0 },
          feetY: { value: cfg.feetY ?? 0.1 }, headY: { value: cfg.headY ?? 0.85 }, pivotX: { value: 0 }, breath: { value: 0 }, chestY: { value: cfg.chestY ?? 0.6 }, heave: { value: 0 },
          time: { value: 0 }, ripple: { value: cfg.ripple ?? 0 }, rippleY: { value: cfg.rippleY ?? 0.2 }, ...extra } });
      const bgM = common(bg, FRAG_BG); const fgM = common(fg, FRAG_FG); fgM.uniforms.zOff.value = 0.015;
      scene.add(new THREE.Mesh(geo, bgM)); const fgMesh = new THREE.Mesh(geo, fgM); fgMesh.renderOrder = 2; scene.add(fgMesh);
      // 3D rain: thin streaks scattered through depth, some in front of her, some behind
      let rain = null;
      if (cfg.rain) {
        const n = cfg.rain, pos = new Float32Array(n * 6), seeds = [];
        for (let i = 0; i < n; i++) seeds.push([Math.random() * PW * 1.6 - PW * 0.8, Math.random() * 3 - 1, Math.random() * 1.1 - 0.15, 0.6 + Math.random() * 0.8]);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        rain = { g, pos, seeds, mesh: new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: cfg.rainOp ?? 0.45 })) };
        rain.mesh.renderOrder = 3; scene.add(rain.mesh);
      }
      // glows (hazard light, lamp): additive sprites that pulse
      const glows = (cfg.glows || []).map((gl) => {
        const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
        const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, gl.col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        sp.position.set((gl.u - 0.5) * PW, (gl.v - 0.5) * PH, 0.4); sp.scale.set(gl.s, gl.s, 1); sp.renderOrder = 4; scene.add(sp); return { sp, gl };
      });
      S.current = { renderer, scene, cam, bgM, fgM, rain, glows };
      setReady(true); continueRender(h0);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const h = delayRender('frame');
    const { renderer, scene, cam, bgM, fgM, rain, glows } = S.current;
    const u = Math.max(0, Math.min(1, (t - t0) / dur)), e = u * u * (3 - 2 * u), lt = t - t0;
    // camera: dolly in + a slow lateral arc so near and far separate
    const dist0 = cfg.dist ?? 3.6, dz = cfg.dolly ?? 0.35, arc = cfg.arc ?? 0.12;
    const cx = (cfg.camX ?? 0) + arc * (e - 0.5), cy = (cfg.camY ?? 0) + (cfg.lift ?? 0) * (e - 0.5);
    cam.position.set(cx, cy, dist0 - dz * e); cam.lookAt((cfg.lookX ?? 0) + cx * 0.25, (cfg.lookY ?? 0), 0);
    cam.fov = 2 * Math.atan((PH * (cfg.fill ?? 0.92)) / 2 / (dist0 - (cfg.depth ?? 0.35) * 0.5)) * 180 / Math.PI; cam.updateProjectionMatrix();
    // subject motion
    const beat = cfg.waltz ? (lt / cfg.waltz) * 2 * Math.PI : 0;        // one sway cycle per waltz bar
    const sway = cfg.waltz ? cfg.swayAmt * Math.sin(beat) : (cfg.swayAmt ?? 0) * Math.sin(lt * 1.3);
    const bob = cfg.waltz ? cfg.bobAmt * Math.abs(Math.sin(beat * 1.5)) : 0;
    const breath = (cfg.breathAmt ?? 0.006) * Math.sin(lt * 2 * Math.PI / (cfg.breathT ?? 3.6));
    const heave = (cfg.heaveAmt ?? 0) * Math.max(0, Math.sin(lt * 2 * Math.PI / (cfg.heaveT ?? 1.4))) ** 2;
    for (const m of [fgM]) { m.uniforms.swayA.value = sway; m.uniforms.bobA.value = bob; m.uniforms.breath.value = breath; m.uniforms.heave.value = heave; m.uniforms.pivotX.value = ((cfg.pivotU ?? 0.5) - 0.5) * PW; }
    bgM.uniforms.time.value = lt;
    if (rain) {
      const { pos, seeds, g } = rain;
      seeds.forEach(([x, y, z, sp], i) => {
        const yy = ((y - lt * 5.5 * sp) % 3 + 3) % 3 - 1.4, L = 0.07 * sp;
        pos.set([x + yy * 0.08, yy, z, x + (yy + L) * 0.08, yy + L, z], i * 6);
      });
      g.attributes.position.needsUpdate = true;
    }
    glows.forEach(({ sp, gl }) => { const on = gl.blink ? (Math.sin(lt * 2 * Math.PI / gl.blink) > 0 ? 1 : 0.15) : (0.85 + 0.15 * Math.sin(lt * 7.3) * Math.sin(lt * 2.9)); sp.material.opacity = gl.op * on; });
    renderer.render(scene, cam);
    continueRender(h);
  }, [frame, ready]);

  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} /></AbsoluteFill>;
};

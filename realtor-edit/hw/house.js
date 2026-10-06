// "Architectural hologram" house: glass walls, glowing gold edges, warm interior light. Pure function of time.
import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = (x) => 1 - Math.pow(1 - x, 3);
function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const GOLD = new THREE.Color('#ffc46b'), CYAN = new THREE.Color('#7fd8ff'), WARM = new THREE.Color('#ffb15a'), GREEN = new THREE.Color('#5be3a2');

export function makeHouse(TL, DPR = 1) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080d, 0.018);
  const cam = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 400);

  // ---------- sky: deep dusk gradient + stars (textured, never flat) ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float uT; float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){ float y=vP.y; vec3 c=mix(vec3(.02,.03,.05),vec3(.03,.06,.11),smoothstep(-.1,.6,y)); c+=vec3(.35,.16,.05)*exp(-pow((y-.02)*7.,2.))*.55;
        vec3 sp=floor(vP*360.); float s=h(sp); c+=vec3(.8,.9,1.)*step(.9982,s)*smoothstep(.05,.5,y)*(.5+.5*sin(uT*2.+s*50.)); gl_FragColor=vec4(c,1.); }` }));
  scene.add(sky);

  // ---------- reflective ground with fading grid ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.ShaderMaterial({ transparent: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec3 vW; void main(){ vec2 g=abs(fract(vW.xz*.5)-.5); float line=smoothstep(.485,.5,max(g.x,g.y)); float d=length(vW.xz);
      vec3 c=vec3(.012,.018,.026)+vec3(.9,.62,.3)*line*.18*exp(-d*.06)+vec3(.35,.18,.07)*exp(-d*d*.004)*.35; gl_FragColor=vec4(c,1.); }` }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // ---------- light rig ----------
  scene.add(new THREE.HemisphereLight(0x8aa4c8, 0x2a1a10, 1.1)); scene.add(new THREE.AmbientLight(0x403028, 0.6));
  const key = new THREE.DirectionalLight(0xffd7a3, 0.8); key.position.set(-8, 12, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fbfff, 0.5); rim.position.set(10, 6, -12); scene.add(rim);

  // ---------- materials ----------
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fc7e6, transparent: true, opacity: 0.06, roughness: 0.15, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const solid = new THREE.MeshStandardMaterial({ color: 0x1d2630, roughness: 0.6, metalness: 0.2 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2017, roughness: 0.35, metalness: 0.1 });
  const edgeMat = (c = GOLD, o = 0.9) => new THREE.LineBasicMaterial({ color: c.clone().multiplyScalar(1.6), transparent: true, opacity: o });
  const house = new THREE.Group(); scene.add(house);
  const edgeGroup = new THREE.Group(); house.add(edgeGroup);
  function box(w, h, d, x, y, z, mat = solid, edge = GOLD, eo = 0.85, parent = house) {
    const g = new THREE.BoxGeometry(w, h, d); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); parent.add(m);
    if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat(edge, eo)); m.add(e); m.userData.edge = e; }
    return m;
  }
  // floor slab + walls (house footprint 12 x 9, facade at z=+4.5)
  box(12.6, 0.3, 9.6, 0, 0.15, 0, floorMat, GOLD, 0.6);
  const WH = 3.0, T = 0.12;
  box(12, WH, T, 0, 0.3 + WH / 2, -4.5, glass);                 // back wall
  box(T, WH, 9, -6, 0.3 + WH / 2, 0, glass); box(T, WH, 9, 6, 0.3 + WH / 2, 0, glass);  // sides
  // front facade with door + garage openings: left (garage 3.4 wide), centre door 1.2, right glass
  box(1.2, WH, T, -5.4, 0.3 + WH / 2, 4.5, glass); box(1.8, WH, T, -0.9 - 0.9 + 0.0 - 0.1, 0.3 + WH / 2, 4.5, glass);
  box(4.6, WH, T, 3.7, 0.3 + WH / 2, 4.5, glass); box(1.3, 0.7, T, 0.75, 0.3 + WH - 0.35, 4.5, glass);
  // interior walls
  box(T, WH, 4.2, -1.4, 0.3 + WH / 2, -2.4, glass, CYAN, 0.45); box(5.6, WH, T, -3.2, 0.3 + WH / 2, -0.3, glass, CYAN, 0.45);
  box(T, WH, 4.0, 2.6, 0.3 + WH / 2, 2.5, glass, CYAN, 0.45);
  // roof: cantilevered slab + upper volume
  const roof = box(13.6, 0.28, 10.4, 0.2, 0.3 + WH + 0.14, 0.2, solid, GOLD, 0.9);
  const upper = box(6.2, 2.6, 5.2, -2.6, 0.3 + WH + 0.28 + 1.3, -1.6, glass, GOLD, 0.8);
  const upperRoof = box(6.6, 0.22, 5.6, -2.6, 0.3 + WH + 0.28 + 2.6 + 0.11, -1.6, solid, GOLD, 0.9);
  const roofParts = [roof, upper, upperRoof].map((m) => ({ m, y: m.position.y }));

  // ---------- rooms & props ----------
  // front door (hinged at x=0.15), garage door (segments), backyard slider
  const doorPivot = new THREE.Group(); doorPivot.position.set(0.15, 0.3, 4.5); house.add(doorPivot);
  const door = box(1.2, 2.3, 0.08, 0.6, 1.15, 0, new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.5 }), GOLD, 1, doorPivot);
  box(0.06, 0.06, 0.18, 1.05, 1.1, 0.06, new THREE.MeshBasicMaterial({ color: 0xffd27a }), null, 0, door); // handle
  const garage = new THREE.Group(); garage.position.set(-3.2, 0.3, 4.52); house.add(garage);
  const gsegs = []; for (let i = 0; i < 5; i++) gsegs.push(box(3.4, 0.5, 0.06, 0, 0.25 + i * 0.5, 0, new THREE.MeshStandardMaterial({ color: 0x2b3440, roughness: 0.5 }), GOLD, 0.9, garage));
  const slider = box(2.2, 2.3, 0.05, 3.0, 1.45, -4.45, glass, CYAN, 0.9);
  // kitchen (back-left): island, fridge, range, microwave
  const kitchenLight = new THREE.PointLight(0xffb36b, 0, 9, 1.6); kitchenLight.position.set(-3.6, 2.6, -2.4); house.add(kitchenLight);
  box(2.6, 0.95, 1.1, -3.6, 0.3 + 0.475, -2.2, new THREE.MeshStandardMaterial({ color: 0x8f877a, roughness: 0.35 }), GOLD, 0.7);
  const fridge = box(0.9, 2.1, 0.75, -5.4, 0.3 + 1.05, -3.9, new THREE.MeshStandardMaterial({ color: 0xc7ccd1, metalness: 0.6, roughness: 0.25 }), CYAN, 0.9);
  const range = box(0.9, 0.9, 0.7, -4.1, 0.3 + 0.45, -4.05, new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.5, roughness: 0.3 }), CYAN, 0.9);
  const burners = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 32), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0 })); r.rotation.x = -Math.PI / 2; r.position.set(-4.1 + (i % 2 ? 0.2 : -0.2), 0.3 + 0.91, -4.05 + (i < 2 ? 0.15 : -0.15)); house.add(r); burners.push(r); }
  const micro = box(0.7, 0.42, 0.45, -3.0, 0.3 + 1.6, -4.15, new THREE.MeshStandardMaterial({ color: 0x24282d, metalness: 0.5 }), CYAN, 0.9);
  const microGlow = box(0.42, 0.26, 0.01, -3.05, 0.3 + 1.6, -3.92, new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0 }), null);
  // laundry (front-right): washer with spinning drum
  const washer = box(0.85, 0.9, 0.75, 5.1, 0.3 + 0.45, 3.6, new THREE.MeshStandardMaterial({ color: 0xeef1f3, roughness: 0.35 }), CYAN, 0.9);
  const drum = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 12, 40), new THREE.MeshBasicMaterial({ color: 0x7fd8ff })); drum.position.set(5.1, 0.3 + 0.45, 3.2); drum.rotation.y = 0; house.add(drum);
  const drumFill = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: 0x245a7a, transparent: true, opacity: 0.7 })); drumFill.position.set(5.1, 0.75, 3.215); house.add(drumFill);
  // bathroom sink cabinet (front-right, next to laundry) + faucet + drip
  const sinkLight = new THREE.PointLight(0x9fdcff, 0, 6, 1.6); sinkLight.position.set(4.3, 1.9, 1.4); house.add(sinkLight);
  const cab = box(1.2, 0.85, 0.55, 4.3, 0.3 + 0.425, 0.8, new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 0.5 }), GOLD, 0.9);
  const cabL = new THREE.Group(); cabL.position.set(3.7, 0.3, 1.08); house.add(cabL); box(0.6, 0.8, 0.04, 0.3, 0.42, 0, new THREE.MeshStandardMaterial({ color: 0x4a3828 }), GOLD, 1, cabL);
  const cabR = new THREE.Group(); cabR.position.set(4.9, 0.3, 1.08); house.add(cabR); box(0.6, 0.8, 0.04, -0.3, 0.42, 0, new THREE.MeshStandardMaterial({ color: 0x4a3828 }), GOLD, 1, cabR);
  box(1.3, 0.06, 0.6, 4.3, 0.3 + 0.88, 0.8, new THREE.MeshStandardMaterial({ color: 0xb9b4ab, roughness: 0.5 }), CYAN, 0.6);
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9dee3, metalness: 0.9, roughness: 0.15 })); faucet.position.set(4.3, 0.3 + 1.0, 0.62); house.add(faucet);
  const pipe = box(0.06, 0.6, 0.06, 4.3, 0.3 + 0.3, 0.7, new THREE.MeshStandardMaterial({ color: 0xb08850, metalness: 0.8, roughness: 0.3 }), null);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x9fdcff, transmission: 0, roughness: 0.05, metalness: 0, emissive: 0x2a7aa8, emissiveIntensity: 0.6 })); house.add(drip);
  // living room (back-right): TV on wall, thermostat; ceiling stain above living room
  const livingLight = new THREE.PointLight(0xffc78a, 0, 10, 1.5); livingLight.position.set(3.4, 2.6, -2.0); house.add(livingLight);
  const tv = box(2.0, 1.15, 0.06, 3.2, 0.3 + 1.6, -4.36, new THREE.MeshStandardMaterial({ color: 0x0b0f14, metalness: 0.4, roughness: 0.2 }), GOLD, 0.8);
  const holes = []; for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0 })); h.position.set(3.2 + (i % 2 ? 0.45 : -0.45), 0.3 + 1.6 + (i < 2 ? 0.28 : -0.28), -4.42); house.add(h); holes.push(h); }
  const holeRings = holes.map((h) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.08, 24), new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0 })); r.position.copy(h.position); r.position.z += 0.005; house.add(r); return r; });
  const thermo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 40), new THREE.MeshStandardMaterial({ color: 0x1a1f25, metalness: 0.7, roughness: 0.2 })); thermo.rotation.x = Math.PI / 2; thermo.position.set(5.2, 0.3 + 1.5, -4.4); house.add(thermo);
  const thermoRing = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.095, 40), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0 })); thermoRing.position.set(5.2, 0.3 + 1.5, -4.37); house.add(thermoRing);
  // ceiling plane over living room with a spreading water stain (canvas texture)
  const sc = document.createElement('canvas'); sc.width = sc.height = 512; const sg = sc.getContext('2d');
  const grad = sg.createRadialGradient(256, 256, 20, 256, 256, 240); grad.addColorStop(0, 'rgba(150,104,48,.9)'); grad.addColorStop(0.55, 'rgba(170,125,64,.55)'); grad.addColorStop(0.8, 'rgba(120,84,40,.6)'); grad.addColorStop(1, 'rgba(120,84,40,0)');
  sg.fillStyle = grad; sg.beginPath(); for (let a = 0; a <= 64; a++) { const an = a / 64 * Math.PI * 2, r = 200 + 30 * Math.sin(an * 5) + 18 * Math.sin(an * 11); sg.lineTo(256 + Math.cos(an) * r, 256 + Math.sin(an) * r); } sg.fill();
  const stainTex = new THREE.CanvasTexture(sc); stainTex.colorSpace = THREE.SRGBColorSpace;
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.1), new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.9, side: THREE.DoubleSide })); ceiling.rotation.x = Math.PI / 2; ceiling.position.set(3.1, 0.3 + WH - 0.02, -2.4); house.add(ceiling);
  const stain = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: stainTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); stain.rotation.x = Math.PI / 2; stain.position.set(3.6, 0.3 + WH - 0.035, -2.6); house.add(stain);
  const scanBeam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); scanBeam.position.set(3.6, 0.3 + WH - 1.2, -2.6); house.add(scanBeam);
  const entryLight = new THREE.PointLight(0xffc27a, 0, 8, 1.5); entryLight.position.set(0.6, 2.4, 3.2); house.add(entryLight);
  // window glows (warm interior bloom)
  const glows = []; [[-3.6, 1.6, -4.42, 3.6, 1.6], [3.4, 1.9, 4.44, 3.6, 1.8], [-2.6, 4.9, 1.02, 5.4, 1.6]].forEach(([x, y, z, w, h]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffb66a, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.position.set(x, y, z); house.add(m); glows.push(m); });
  // glowing light pools that mark the active room
  const pool = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uO: { value: 0 }, uT: { value: 0 } }, vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vU; uniform float uO,uT; void main(){ vec2 c=vU-.5; float r=length(c*vec2(1.,1.)); float a=smoothstep(.5,.0,r)*.55+smoothstep(.02,.0,abs(max(abs(c.x),abs(c.y))-.47))*.9; a*=uO*(.8+.2*sin(uT*3.)); gl_FragColor=vec4(vec3(1.,.72,.38)*a,a); }` }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.32, z); house.add(m); return m; };
  const pools = [pool(-1.2, 3.4, 5.5, 2.6), pool(-3.7, -2.6, 4.6, 3.8), pool(4.5, 2.2, 3.0, 4.2), pool(3.4, -2.4, 5.4, 4.0), pool(3.4, -3.4, 5.0, 2.2)];
  // dust motes in the light
  const R = rng(9), N = 900, pp = new Float32Array(N * 3), ps = new Float32Array(N);
  for (let i = 0; i < N; i++) { pp[i * 3] = (R() - .5) * 26; pp[i * 3 + 1] = R() * 8; pp[i * 3 + 2] = (R() - .5) * 22; ps[i] = R(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('ph', new THREE.BufferAttribute(ps, 1));
  const dust = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 } },
    vertexShader: `attribute float ph; uniform float uT; varying float vA; void main(){ vec3 p=position; p.y=mod(p.y+uT*.12+ph*8.,8.); p.x+=sin(uT*.3+ph*20.)*.3;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; vA=.35+.65*sin(uT*1.5+ph*30.); gl_PointSize=(1.5+ph*2.5)*(14./max(1.,-mv.z))*${DPR.toFixed(2)}; }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(1.,.8,.55,(1.-d*2.)*vA*.6); }` }));
  scene.add(dust);
  // "assemble from light" for the end: every edge line fades/draws in
  const allEdges = []; house.traverse((o) => { if (o.isLineSegments) allEdges.push(o); });

  // ---------- camera path (pinned to her words) ----------
  const tp = TL.tips, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const K = [
    { t: 0.0, p: V(16, 9, 22), l: V(0, 2, 0), f: 45 },
    { t: 7.8, p: V(11, 6.5, 16), l: V(0, 1.8, 1), f: 45 },
    { t: TL.walk + 0.2, p: V(6, 4.5, 14), l: V(0.4, 1.6, 3.6), f: 44 },
    { t: tp[0] - 0.2, p: V(5.5, 8.5, 14), l: V(0, 1.0, 2.6), f: 44 },
    { t: tp[0] + 2.4, p: V(4.0, 8.0, 12.5), l: V(0.2, 0.9, 3.4), f: 42 },        // front door
    { t: tp[0] + 4.6, p: V(-5.5, 8.5, 13.5), l: V(-3.0, 0.9, 3.6), f: 42 },      // garage
    { t: tp[0] + 7.4, p: V(9.0, 8.0, -12.0), l: V(2.6, 0.9, -3.4), f: 42 },      // backyard slider (from the back)
    { t: tp[1] + 0.5, p: V(-12.0, 10.0, 4.0), l: V(-3.8, 0.8, -2.6), f: 40 },    // kitchen
    { t: tp[1] + 5.4, p: V(-10.0, 9.0, -6.0), l: V(-4.0, 0.8, -3.2), f: 40 },
    { t: tp[1] + 6.6, p: V(11.5, 8.0, 10.0), l: V(5.0, 0.6, 3.2), f: 38 },       // laundry
    { t: tp[2] + 0.4, p: V(11.0, 7.5, 6.0), l: V(4.3, 0.6, 1.0), f: 38 },        // sink
    { t: tp[2] + 3.2, p: V(8.5, 4.8, 5.0), l: V(4.3, 0.5, 1.0), f: 38 },
    { t: tp[3] + 0.3, p: V(11.0, 7.0, 5.0), l: V(3.4, 2.6, -2.4), f: 40 },       // ceiling slab
    { t: tp[3] + 6.0, p: V(9.0, 8.5, 2.0), l: V(3.4, 2.8, -2.4), f: 40 },
    { t: tp[4] + 0.4, p: V(5.0, 6.5, 8.0), l: V(3.4, 1.6, -4.0), f: 40 },        // living wall
    { t: tp[4] + 9.0, p: V(2.5, 5.5, 5.0), l: V(3.4, 1.8, -4.2), f: 40 },
    { t: TL.allDone, p: V(11, 12, 15), l: V(0, 1.0, 0), f: 44 },
    { t: TL.endcard, p: V(-12, 10, 15), l: V(0, 1.4, 0), f: 44 },
    { t: 76.0, p: V(-15, 11, 17), l: V(0, 1.8, 0), f: 42 },
  ];
  const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
  function camAt(t) {
    let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++;
    const a = K[i], b = K[i + 1]; const u = eio(clamp((t - a.t) / (b.t - a.t)));
    tmpP.lerpVectors(a.p, b.p, u); tmpL.lerpVectors(a.l, b.l, u);
    const back = 1 + 0.55 * smooth(prog(t, TL.tips[0] - 0.8, TL.tips[0] + 0.2)) * (1 - smooth(prog(t, TL.allDone - 0.4, TL.allDone + 0.6)));
    tmpP.sub(tmpL).multiplyScalar(back).add(tmpL);
    cam.position.copy(tmpP); cam.lookAt(tmpL); cam.fov = a.f + (b.f - a.f) * u; cam.updateProjectionMatrix();
    // living handheld breath
    cam.position.y += Math.sin(t * 0.9) * 0.02; cam.rotation.z += Math.sin(t * 0.7) * 0.004;
    const off = 360 * smooth(prog(t, TL.tips[0] - 0.8, TL.tips[0] + 0.2)) * (1 - smooth(prog(t, TL.allDone - 0.2, TL.allDone + 0.8))) + 300 * smooth(prog(t, TL.checklist - 0.5, TL.checklist + 0.5));
    cam.setViewOffset(1080, 1920, 0, off, 1080, 1920);
  }

  function update(t) {
    sky.material.uniforms.uT.value = t; dust.material.uniforms.uT.value = t;
    camAt(t);
    // dollhouse: roof lifts off for the tour, settles back for the finale
    const lift = smooth(prog(t, TL.tips[0] - 0.9, TL.tips[0] + 0.3)) * (1 - smooth(prog(t, TL.allDone - 0.2, TL.allDone + 1.2)));
    roofParts.forEach(({ m, y }, i) => { m.position.y = y + lift * (7 + i * 1.5); m.visible = lift < 0.98; });
    const tipIdx = TL.tips.reduce((k, x, i) => (t >= x - 0.3 ? i : k), -1);
    pools.forEach((p, i) => { p.material.uniforms.uT.value = t; const on = tipIdx === i && t < TL.ticks[i] + 0.4 ? 1 : 0; p.material.uniforms.uO.value += 0; p.material.uniforms.uO.value = on * smooth(prog(t, TL.tips[i] - 0.3, TL.tips[i] + 0.5)); });
    ceiling.visible = stain.visible = tipIdx === 3 && t < TL.ticks[3] + 0.4; ceiling.position.y = 0.3 + WH + 0.35 * smooth(prog(t, TL.tips[3], TL.tips[3] + 1)); stain.position.y = ceiling.position.y + 0.02;
    ceiling.material.transparent = true; ceiling.material.opacity = 0.8 * smooth(prog(t, TL.tips[3] - 0.2, TL.tips[3] + 0.6));
    const T0 = tp, ic = TL.icons;
    const roomI = (i, k) => { const on = prog(t, T0[i] - 0.2, T0[i] + 0.8) * (1 - prog(t, TL.ticks[i] + 0.3, TL.ticks[i] + 1.3)); const seen = prog(t, T0[i], T0[i] + 0.8); return k * (0.25 * seen + 0.75 * on) * (1 - 0.0 * ad0); };
    const ad0 = 0;
    // window glow + house slowly "comes alive"
    glows.forEach((g, i) => (g.material.opacity = 0.07 + 0.06 * prog(t, 1.4 + i * 0.4, 3 + i * 0.4)));
    // tip 1: door swings, garage rolls up, slider glides
    doorPivot.rotation.y = -1.45 * eout(prog(t, T0[0] + 0.2, T0[0] + 1.6));
    entryLight.intensity = roomI(0, 3.5);
    const gu = eio(prog(t, ic[0][2].t - 0.1, ic[0][2].t + 1.6)); gsegs.forEach((s, i) => { s.position.y = 0.25 + i * 0.5 + gu * (2.6 - i * 0.12); s.position.z = gu * 0.4; s.rotation.x = -gu * 1.2 * (i / 4); });
    slider.position.x = 3.0 - 1.9 * eio(prog(t, ic[0][3].t, ic[0][3].t + 1.2));
    // tip 2: kitchen lights, burners, microwave, washer spin
    kitchenLight.intensity = roomI(1, 3);
    const fr = prog(t, ic[1][0].t, ic[1][0].t + 0.4); fridge.userData.edge.material.color.copy(CYAN).lerp(GREEN, fr).multiplyScalar(1.6);
    burners.forEach((b, i) => (b.material.opacity = prog(t, ic[1][1].t + i * 0.08, ic[1][1].t + 0.3 + i * 0.08) * (0.75 + 0.25 * Math.sin(t * 20 + i))));
    microGlow.material.opacity = 0.85 * prog(t, ic[1][2].t, ic[1][2].t + 0.3);
    const wsp = prog(t, ic[1][3].t, ic[1][3].t + 0.5); drum.rotation.z = (t - ic[1][3].t) * 9 * wsp; drumFill.rotation.z = drum.rotation.z;
    drum.material.color.copy(CYAN).lerp(GREEN, wsp);
    // tip 3: sink — cabinet doors open, slow-motion drip, then "no leaks"
    sinkLight.intensity = roomI(2, 2);
    const co = eout(prog(t, ic[2][0].t, ic[2][0].t + 1)); cabL.rotation.y = -1.3 * co; cabR.rotation.y = 1.3 * co;
    const dt = ((t - T0[2] - 0.6) % 1.6 + 1.6) % 1.6; const fall = clamp(dt / 1.1);
    drip.position.set(4.3, 0.3 + 0.92 - fall * fall * 0.9, 0.66); drip.scale.setScalar(t > T0[2] + 0.6 && t < T0[3] ? (fall < 1 ? 1 : 0) : 0);
    // tip 4: ceiling — scan beam, stain spreads
    const C = TL.ceiling; scanBeam.material.opacity = 0.0 * prog(t, C.t, C.t + 0.6) * (1 - prog(t, C.out - 0.3, C.out));
    scanBeam.position.x = 3.6 + Math.sin((t - C.t) * 1.4) * 0.9 * (1 - prog(t, C.stain - 0.4, C.stain));
    stain.material.opacity = 0.9 * eout(prog(t, C.stain - 0.2, C.stain + 1.4)); stain.scale.setScalar(0.5 + 0.7 * eout(prog(t, C.stain - 0.2, C.stain + 2.4)));
    livingLight.intensity = Math.max(roomI(3, 3.5), roomI(4, 3.5));
    // tip 5: thermostat glows; TV lifts off, holes revealed
    const F = TL.fixtures; thermoRing.material.opacity = prog(t, F.t, F.t + 0.5) * (0.7 + 0.3 * Math.sin(t * 5));
    const tvo = eio(prog(t, F.holes, F.holes + 1.0)); tv.position.y = 0.3 + 1.6 + tvo * 1.1; tv.position.z = -4.36 + tvo * 0.9; tv.rotation.x = tvo * 0.25; tv.visible = tvo < 0.999 || t < F.holes + 0.9;
    holes.forEach((h, i) => (h.material.opacity = prog(t, F.holes + 0.5 + i * 0.1, F.holes + 0.7 + i * 0.1)));
    holeRings.forEach((r, i) => { const p = prog(t, F.holes + 0.55 + i * 0.1, F.holes + 1.2 + i * 0.1); r.material.opacity = p * (1 - prog(t, F.out - 0.2, F.out)) * (0.6 + 0.4 * Math.sin(t * 7)); r.scale.setScalar(1 + 0.3 * Math.sin(t * 7)); });
    // all done: everything glows green-gold, house turns slowly
    const ad = prog(t, TL.allDone, TL.allDone + 1); allEdges.forEach((e) => (e.material.opacity = 0.85 + 0.15 * ad));
    house.rotation.y = 0.2 * eio(prog(t, TL.allDone, 76));
    // end: house re-assembles from light (edges draw in, solids fade)
    const ea = prog(t, TL.endcard, TL.endcard + 0.01);
    return ad;
  }
  return { scene, cam, update };
}

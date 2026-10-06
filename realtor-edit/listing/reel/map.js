// Location sequence: aerial "drone" fly-in over a stylised night city to the home, amenity pins pop on the voiceover.
// Illustrative layout (no real street data available in this environment) — labels carry names only, no distances.
export function makeMap(THREE, renderer) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070b12); scene.fog = new THREE.FogExp2(0x0a1220, 0.00028);
  const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 1, 6000);
  const R = ((s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(7);
  // ground with a soft street grid
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.ShaderMaterial({ fog: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec3 vW; void main(){ vec2 g=abs(fract(vW.xz/90.)-.5); float l=smoothstep(.47,.5,max(g.x,g.y)); vec2 g2=abs(fract(vW.xz/450.)-.5); float L=smoothstep(.485,.5,max(g2.x,g2.y));
      float d=length(vW.xz); vec3 c=vec3(.06,.09,.14)+vec3(.45,.55,.7)*l*.18+vec3(1.,.75,.4)*L*.55; c*=exp(-d*.0003); gl_FragColor=vec4(c,1.); }` }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // blocks of houses (instanced), leaving parks and the school site open
  const parks = [[-520, -380, 260], [640, 420, 300]], open = (x, z) => parks.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r) || Math.hypot(x, z) < 40;
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.8, emissive: 0x3a2a14, emissiveIntensity: 0.35 });
  const N = 9000, inst = new THREE.InstancedMesh(geo, mat, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(); let n = 0;
  // suburban rows: houses lined up along both sides of every street in a 90 m grid
  for (let gx = -1800; gx < 1800; gx += 90) for (let gz = -1800; gz < 1800; gz += 90) for (let side = 0; side < 2; side++) for (let k = 0; k < 6 && n < N; k++) {
    const x = gx + 12 + k * 13, z = gz + (side ? 20 : 70); if (open(x, z) || R() < 0.06) continue;
    const h = 6 + R() * 3; m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(11, h * 1.3, 14)); inst.setMatrixAt(n, m4); inst.setColorAt(n, col.setHSL(0.08, 0.15, 0.6 + R() * 0.15)); n++; }
  inst.count = n; scene.add(inst);
  // park greens
  parks.forEach(([x, z, r]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color: 0x1f5a35, transparent: true, opacity: 0.55 })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.5, z); scene.add(p); });
  scene.add(new THREE.HemisphereLight(0xa8c0ff, 0x202020, 1.8)); const sun = new THREE.DirectionalLight(0xffd2a0, 1.4); sun.position.set(-400, 600, 300); scene.add(sun);
  // highways: glowing ribbons
  const roads = [];
  function highway(pts, color, w = 34) { const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 1.5, z)));
    const g = new THREE.TubeGeometry(curve, 200, w / 2, 8, false); const mm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, fog: false });
    const mesh = new THREE.Mesh(g, mm); mesh.scale.y = 0.2; mesh.renderOrder = 2; scene.add(mesh); roads.push(mesh); return mesh; }
  const H403 = highway([[-2600, 900], [-1200, 520], [0, 640], [1400, 760], [2800, 1200]], 0xffb04a);
  const H407 = highway([[-2600, -900], [-800, -700], [600, -820], [2600, -640]], 0x6fc7ff);
  const HQEW = highway([[-2600, 1500], [-600, 1300], [900, 1420], [2800, 1700]], 0xff7a59);
  // home beacon
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 600, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  beam.position.set(0, 300, 0); scene.add(beam);
  const home = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 26), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb050, emissiveIntensity: 1.2 })); home.position.y = 9; scene.add(home);
  const ring = new THREE.Mesh(new THREE.RingGeometry(30, 36, 64), new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 2; scene.add(ring);
  // amenity pins (local times match the VO words)
  const PINS = [
    { t: 1.0, name: 'Parks & trails', x: -520, z: -380, c: '#7be0a0' },
    { t: 2.0, name: 'Schools', x: 380, z: -620, c: '#9ec9ff' },
    { t: 3.2, name: 'Oakville Trafalgar Hospital', x: -900, z: 520, c: '#ff8b8b' },
    { t: 5.7, name: 'Hwy 403', x: 0, z: 640, c: '#ffb04a', road: H403 },
    { t: 6.95, name: 'Hwy 407', x: 600, z: -820, c: '#6fc7ff', road: H407 },
    { t: 8.3, name: 'QEW', x: 900, z: 1420, c: '#ff7a59', road: HQEW },
  ];
  const host = document.getElementById('map-t'); host.textContent = '';
  const title = document.createElement('div'); title.textContent = 'LOCATION'; title.style.cssText = 'position:absolute;left:0;right:0;top:0;text-align:center'; host.appendChild(title);
  const note = document.createElement('div'); note.textContent = 'Illustrative map'; note.style.cssText = 'position:absolute;left:0;right:0;top:1440px;text-align:center;font-size:22px;letter-spacing:.2em;font-weight:500;color:rgba(255,255,255,.55)'; host.appendChild(note);
  PINS.forEach((p) => { const head = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16), new THREE.MeshBasicMaterial({ color: p.c, fog: false })); const stem = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 140, 8), new THREE.MeshBasicMaterial({ color: p.c, fog: false }));
    stem.position.y = 70; head.position.y = 150; p.g = new THREE.Group(); p.g.add(stem, head); p.g.position.set(p.x, 0, p.z); p.g.scale.setScalar(0.001); scene.add(p.g);
    p.el = document.createElement('div'); p.el.style.cssText = `position:absolute;left:70px;top:${740 + PINS.indexOf(p) * 92}px;white-space:nowrap;display:flex;align-items:center;gap:22px;padding:14px 30px 14px 20px;border-radius:44px;background:rgba(10,12,18,.66);border:1px solid rgba(255,255,255,.18);font-size:40px;font-weight:800;color:#fff;letter-spacing:.01em;opacity:0`;
    p.el.innerHTML = `<i style="width:26px;height:26px;border-radius:50%;background:${p.c};box-shadow:0 0 18px ${p.c}"></i>${p.name}`; host.appendChild(p.el); });
  const clamp = (x) => Math.min(1, Math.max(0, x)), eout = (x) => 1 - Math.pow(1 - x, 3), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const v = new THREE.Vector3();
  function render(lt, dur, { yaw, blur }) {
    // drone path: high wide approach -> dive to the home -> slow orbit while pins appear -> pull out to show highways
    const a = eio(clamp(lt / 2.2)), b = eout(clamp((lt - 3.9) / 3.6));
    const ang = 0.6 + lt * 0.11, alt = 1500 - 1050 * a + 950 * b, dist = 1500 - 950 * a + 650 * b;
    cam.position.set(Math.sin(ang) * dist, alt, Math.cos(ang) * dist); cam.lookAt(0, 0, 0); cam.rotateY(yaw); cam.updateProjectionMatrix();
    beam.material.opacity = 0.5 * clamp((lt - 0.6) / 0.6); ring.material.opacity = 0.9 * clamp((lt - 0.8) / 0.4); ring.scale.setScalar(1 + 0.25 * Math.sin(lt * 4));
    title.style.opacity = clamp(lt / 0.4) * (1 - clamp((lt - dur + 0.3) / 0.3));
    PINS.forEach((p) => { const k = eout(clamp((lt - p.t) / 0.4)); p.g.scale.setScalar(Math.max(0.001, k * (1 + 0.6 * clamp(alt / 1500))));
      if (p.road) p.road.material.opacity = 0.9 * k;
      p.el.style.opacity = k; p.el.style.transform = `translateX(${(-60 * (1 - k)).toFixed(1)}px)`; });
    const gl = document.getElementById('gl'); gl.style.filter = blur > 0.002 ? `blur(${(blur * 200).toFixed(1)}px)` : 'none';
    renderer.render(scene, cam);
  }
  return { render };
}

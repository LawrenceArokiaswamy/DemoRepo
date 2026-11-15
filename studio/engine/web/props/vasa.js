// VASA (1628) ship runtime (original): loads the Blender-built GLB (studio/engine/blender/build_vasa.py) and gives the story
// simple, reusable controls. Ship-local frame (ship.body children): x = toward the bow, y = up (y = 0 at the design waterline),
// z = starboard (port side = -z). Hierarchy: root (world position + heading) > heel (roll about the keel line, + = toward PORT)
// > body (GLB, keel at y = -4.8).
//   const V = await loadVasa(THREE, pbr); scene.add(V.root); V.set({ x, z, heading, heel, sink, pitch }); V.ports(row, k01); V.wreck(true)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export const VASA = { L: 47, B: 11.7, WL: 4.8, deckY: 10.45 - 4.8 + 0.18, lowerDeckY: 5.25 - 4.8 + 0.18, upperGunDeckY: 7.55 - 4.8 + 0.18 };
export async function loadVasa(THREE, pbr, o = {}) {
  const g = await new Promise((res, rej) => new GLTFLoader().load(o.url || '/engine/web/props/models/vasa.glb', res, undefined, rej));
  const root = new THREE.Group(), heel = new THREE.Group(), body = g.scene; root.add(heel); heel.add(body); body.position.y = -VASA.WL; root.name = 'Vasa';
  const lids = [], guns = [], parts = { sails: [], rig: [], flags: [], gold: [] }; let deckMat = null;
  body.traverse((m) => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true;
    const n = m.name;
    if (/^PortLid_/.test(n)) lids.push(m); if (/^Cannon_/.test(n)) guns.push(m);
    if (/^Sail/.test(n)) parts.sails.push(m); if (/^(Mast|Top|Yard|Shroud|Stay|Bowsprit)/.test(n)) parts.rig.push(m); if (/^(Flag|Pennant|EnsignStaff|Lantern)/.test(n)) parts.flags.push(m);
    if (m.material && m.material.name === 'deck' && !m.geometry.attributes.uv) { const P = m.geometry.attributes.position, uv = new Float32Array(P.count * 2);   // planar plank UVs (planks run bow-stern)
      for (let i = 0; i < P.count; i++) { uv[2 * i] = P.getZ(i) * 0.5; uv[2 * i + 1] = P.getX(i) * 0.12; } m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
    if (m.material && m.material.name === 'deck' && pbr) { deckMat = deckMat || pbr('wood_planks', [0.25, 0.25], { roughness: 0.85, color: '#d2b088' }); m.material = deckMat; }
    if (m.material && m.material.name === 'sail') { m.material.side = THREE.DoubleSide; }
    if (m.material && /Hull|Deck/.test(n)) m.material.side = THREE.DoubleSide;
  });
  // painted stern carvings (original design: gilded figures, columns, royal arms, on red)
  const sp = body.getObjectByName('SternPanel');
  const paintStern = (wreck) => { const c = document.createElement('canvas'); c.width = 512; c.height = 768; const x = c.getContext('2d');
    x.fillStyle = wreck ? '#463d34' : '#8f2b25'; x.fillRect(0, 0, 512, 768);
    const gold = wreck ? '#7a6d5c' : '#e0b04a', goldD = wreck ? '#5a4f42' : '#9c7020';
    x.strokeStyle = gold; x.lineWidth = 14; x.strokeRect(14, 14, 484, 740);
    for (const cx of [70, 190, 322, 442]) { x.fillStyle = gold; x.fillRect(cx - 14, 120, 28, 560); for (let y = 140; y < 680; y += 46) { x.fillStyle = goldD; x.fillRect(cx - 18, y, 36, 8); } }   // carved columns
    for (const [cx, cy] of [[130, 470], [382, 470], [130, 640], [382, 640]]) { x.fillStyle = wreck ? '#1a1612' : '#2a1b17'; x.beginPath(); x.roundRect(cx - 36, cy - 44, 72, 88, 16); x.fill(); x.strokeStyle = gold; x.lineWidth = 8; x.stroke(); }   // stern windows
    x.fillStyle = gold; x.beginPath(); x.ellipse(256, 300, 92, 120, 0, 0, 7); x.fill(); x.fillStyle = wreck ? '#2a2420' : '#1f5aa8'; x.beginPath(); x.ellipse(256, 300, 70, 96, 0, 0, 7); x.fill();   // royal arms shield
    x.fillStyle = gold; x.fillRect(250, 210, 12, 180); x.fillRect(190, 292, 132, 12);   // cross on the shield
    x.beginPath(); x.moveTo(190, 176); for (const [px, py] of [[205, 140], [228, 168], [256, 128], [284, 168], [307, 140], [322, 176]]) x.lineTo(px, py); x.closePath(); x.fill();   // crown
    for (const s of [-1, 1]) { x.fillStyle = gold; x.beginPath(); x.ellipse(256 + s * 150, 300, 34, 90, s * 0.2, 0, 7); x.fill(); x.beginPath(); x.ellipse(256 + s * 150, 200, 28, 30, 0, 0, 7); x.fill(); }   // supporting lions (stylised)
    x.fillStyle = gold; x.beginPath(); x.moveTo(20, 60); x.quadraticCurveTo(256, -10, 492, 60); x.lineTo(492, 96); x.quadraticCurveTo(256, 30, 20, 96); x.fill();   // top scroll
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; return t; };
  const sternMat = new THREE.MeshToonMaterial({ map: paintStern(false), side: THREE.DoubleSide }); if (sp) { sp.material = sternMat; sp.userData.keepMaterial = true; }
  // gunport lids hinge at their top edge: reparent each into a pivot so it can swing out and up
  const LID = lids.map((m) => { const bb = new THREE.Box3().setFromObject(m); const h = bb.max.y - bb.min.y, side = m.position.z < 0 ? -1 : 1, row = +m.name.split('_')[1], k = +m.name.split('_')[3];
    const piv = new THREE.Group(); piv.position.copy(m.position).add(new THREE.Vector3(0, h / 2, 0)); m.parent.add(piv); piv.add(m); m.position.set(0, -h / 2, 0); return { m, piv, side, row, k }; });
  const GUN = guns.map((m) => ({ m, p0: m.position.clone(), side: m.position.z < 0 ? -1 : 1, row: +m.name.split('_')[1], k: +m.name.split('_')[3] }));
  const V = { root, heel, body, parts, LID, GUN, sternMat,
    set({ x = 0, y = 0, z = 0, heading = 0, heel: h = 0, pitch = 0, sink = 0 } = {}) { root.position.set(x, y - sink, z); root.rotation.set(0, heading, 0); heel.rotation.set(-h, 0, pitch); root.updateMatrixWorld(true); },
    // open fraction per row (0 closed .. 1 open); guns run out with the lid (row 0 = lower gun deck); stagger = per-port delay along the hull
    ports(row, k01, stagger = 0) { for (const L of LID) if (L.row === row) { const kk = Math.max(0, Math.min(1, k01 * (1 + stagger) - stagger * (L.k / 11))); L.piv.rotation.x = -L.side * 1.2 * kk; }
      for (const G of GUN) if (G.row === row) { const kk = Math.max(0, Math.min(1, k01 * (1 + stagger) - stagger * (G.k / 11))); G.m.position.z = G.p0.z - G.side * (1 - kk) * 1.1; } },
    wreck(on) {   // the 1961 hull: masts, rig, sails, flags gone; gilding blackened (waterlogged oak)
      for (const m of [...parts.sails, ...parts.rig, ...parts.flags]) m.visible = !on;
      
      sternMat.map = paintStern(on); sternMat.needsUpdate = true; V.isWreck = on;
      for (const L of LID) L.m.visible = !on;   // most port lids were lost by 1961
      body.traverse((m) => { if (!m.isMesh || !m.material || m.userData.keepMaterial) return; for (const mt of [].concat(m.material)) { if (!mt.color) continue; if (!mt.userData.c0) mt.userData.c0 = mt.color.clone();
        mt.color.copy(on ? mt.userData.c0.clone().lerp(new THREE.Color('#4a4036'), 0.7) : mt.userData.c0); } }); },
    // a world point on the weather deck: u = 0 stern .. 1 bow, v = -1 port rail .. +1 starboard rail
    deckPoint(u, v = 0) { const x = -VASA.L / 2 + u * VASA.L, w = 4.3 * (1 - Math.max(0, (u - 0.75) / 0.25) ** 1.6 * 0.7); return new THREE.Vector3(x, VASA.deckY, v * w); },
  };
  return V;
}

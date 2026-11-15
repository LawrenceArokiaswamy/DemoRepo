// look-dev for Episode 2: ship + harbour + 1628 costumes (one frame per camera)
let S = null;
export async function init(C) {
  const THREE = C.THREE; const { pbr } = await import('/engine/web/stage.js'); const { loadVasa } = await import('/engine/web/props/vasa.js'); const CP = await import('/engine/web/character_cplus.js');
  S = { V: await loadVasa(THREE, pbr), ST: C.SET }; C.scene.add(S.V.root); C.camera.far = 2500; C.camera.updateProjectionMatrix();
  S.V.set({ x: -80, z: -5.0, heading: 0, heel: 0 }); S.V.ports(0, 1, 0.5); S.V.ports(1, 1, 0.5);
  S.chars = []; const kinds = ['sailor1628', 'officer1628', 'council1628', 'shipwright1628', 'sailor1628'];
  for (const [i, k] of kinds.entries()) { const ch = await CP.loadCPlus(THREE, { url: `/engine/web/characters/cplus_${k}.glb`, face: { stache: /officer|council/.test(k) } }); S.chars.push(ch);
    S.V.body.parent.add(ch.root); const p = S.V.deckPoint(0.45 + i * 0.03, -0.5 + i * 0.25); ch.root.position.copy(p); ch.root.rotation.y = -Math.PI / 2 + 0.5; ch.pose({ face: i === 1 ? 'concern' : 'neutral' }); }
}
export function frameOf(name) { S.V.root.updateMatrixWorld(true); return name === 'deck' ? S.V.heel.matrixWorld.clone() : S.V.root.matrixWorld.clone(); }
export function frame(t, C) { S.ST.sea.near.receiveShadow = false; S.ST.sea.update(t + 10); for (const ch of S.chars) ch.update(C.camera, 4); }

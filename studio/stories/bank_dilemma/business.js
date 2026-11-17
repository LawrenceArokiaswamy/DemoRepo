// BANK DILEMMA business (2026-11-17): stages charsys 2D actors as lit cards inside the 3D bank set and directs the camera from plan.json.
// Reusable pieces (candidates for engine promotion): actor cards with per-shot resolution, high-res face "windows" for close-ups,
// view selection from camera vs. facing (front / 3-4 / profile / back), eye-lines to world targets, 2D key/rim lighting matched to the
// set's key light, envelope lip-sync, symbolic camera targets with auto focus, and a thrown 3D prop handed off from a 2D hand.
import * as THREE from 'three';
import { makeCard, bokeh } from '/engine/web/stage.js';
import { BANK, makeDuffel } from '/engine/web/sets/bank.js';
import { drawCharacter, drawArmOnly, skeleton } from '/dev/charsys/charsys.js';
import { loadChar, stateAt, poseFrom, blinkAt } from '/dev/charsys/perform.js';
const J = async (p) => (await fetch(p)).json();
const STORY = new URLSearchParams(location.search).get('story'), PLAN = await J(STORY + '/plan.json'), ENV = await J('/stories/bank_dilemma/audio/env.json');
const MR = 0.27;   // metres per head radius (adult ~1.75 m)
const L = (a, b, k) => a + (b - a) * k, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ss = (x) => { x = cl(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const CH = {}, ACT = {}; let bag, CTXr, A_blob;
const PAIR = { sam: -1.35, robber: 1.35 };   // pair card layout (R, card-local x)

const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(20,14,10,0.7)'); r.addColorStop(0.5, 'rgba(20,14,10,0.35)'); r.addColorStop(1, 'rgba(20,14,10,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
// ---------------- hybrid photoreal plates: AI-painted plate per camera, projected onto the 3D layout (depth/shadow proxy) ----------------
const PLATES = {}, ORIG = new Map(); let SETOBJ = [], plateKey = null, catcher;
const projMat = (tex) => new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, vp: { value: new THREE.Matrix4() }, gain: { value: 1 } },
  vertexShader: 'varying vec4 vW; void main(){ vW = modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * viewMatrix * vW; }',
  fragmentShader: 'uniform sampler2D map; uniform mat4 vp; uniform float gain; varying vec4 vW; void main(){ vec4 c = vp * vW; if (c.w <= 0.0) { gl_FragColor = vec4(0.05, 0.05, 0.05, 1.); return; } vec2 uv = clamp(c.xy / c.w * 0.5 + 0.5, 0.001, 0.999); gl_FragColor = vec4(texture2D(map, uv).rgb * gain, 1.); }' });
function setPlate(sh, CTX) {
  const key = sh.plate ? sh.plate.file : null; if (key === plateKey) return; plateKey = key;
  const on = !!key, P = on ? PLATES[key] : null;
  if (on) { const pc = new THREE.PerspectiveCamera(sh.plate.cam.fov, 1080 / 1920, 0.05, 200); pc.position.set(...sh.plate.cam.pos); pc.lookAt(...sh.plate.cam.look); pc.updateMatrixWorld(); pc.updateProjectionMatrix();
    P.mat.uniforms.vp.value.multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse); P.mat.uniforms.gain.value = sh.plate.gain ?? 1; }
  for (const root of SETOBJ) root.traverse((o) => {
    if (!ORIG.has(o)) ORIG.set(o, { vis: o.visible, mat: o.material });
    const or = ORIG.get(o), fx = o.isSprite || o.isPoints || (o.material && !Array.isArray(o.material) && (o.material.transparent || o.material.isMeshBasicMaterial && !o.isMesh));
    if (o.isLight) return;
    if (!on) { o.visible = or.vis; if (o.isMesh) o.material = or.mat; return; }
    if (fx) { o.visible = false; return; } if (o.isMesh) { o.material = P.mat; o.castShadow = false; } });
  catcher.visible = on; const r = CTX.renderer;
  if (on) { r.toneMapping = THREE.NoToneMapping; CTX.bloom.strength = 0.1; CTX.grade.uniforms.shT.value.set('#f4f6fa'); CTX.grade.uniforms.hiT.value.set('#fffcf6'); CTX.grade.uniforms.con.value = 0.06; CTX.grade.uniforms.vig.value = 0.2;
    BANK.lights.key.position.set(-1.5, 12, 3); BANK.lights.key.target.position.set(0, 0, -3); BANK.lights.key.target.updateMatrixWorld(); }
}
export async function init(CTX) {
  CTXr = CTX; SETOBJ = [...CTX.scene.children];
  catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.34 })); catcher.rotation.x = -Math.PI / 2; catcher.position.set(0, 0.006, -2); catcher.receiveShadow = true; catcher.visible = false; CTX.scene.add(catcher);
  const tl = new THREE.TextureLoader(); for (const sh of PLAN.shots) if (sh.plate && !PLATES[sh.plate.file]) { const tex = await tl.loadAsync(STORY + '/' + sh.plate.file); tex.colorSpace = THREE.SRGBColorSpace; PLATES[sh.plate.file] = { tex, mat: projMat(tex) }; }
  for (const a of Object.values(PLAN.actors)) for (const id of a.ids || [a.id]) CH[id] = CH[id] || await loadChar(id);
  for (const [key, a] of Object.entries(PLAN.actors)) { const wR = a.kind === 'pair' ? 9.5 : 6.4, hR = 8.2, c = document.createElement('canvas'), w = document.createElement('canvas');
    c.width = 2; c.height = 2; w.width = 2; w.height = 2; const card = makeCard(1, 1, c), win = makeCard(1, 1, w); win.mesh.castShadow = false; win.mesh.visible = false;
    for (const m of [card.mesh, win.mesh]) { m.material.emissive.setRGB(0.2, 0.19, 0.19); }
    const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.75 })); blob.rotation.x = -Math.PI / 2; blob.position.set(a.x, 0.008, a.z); A_blob = blob; blob.scale.set(a.kind === 'pair' ? 1.3 : 0.55, a.kind === 'pair' ? 0.6 : 0.42, 1); CTX.scene.add(blob);
    ACT[key] = { blob: A_blob, key, ...a, wR, hR, c, g: c.getContext('2d'), card, w, wg: w.getContext('2d'), win, res: 0, seed: Object.keys(ACT).length * 3 + 2 }; }
  bag = makeDuffel('#2c3a52'); bag.scale.set(1, 0.6, 1); bag.visible = false;
  CTX.grade.uniforms.shT.value.set('#aebfdc'); CTX.grade.uniforms.hiT.value.set('#ffeedd'); CTX.grade.uniforms.con.value = 0.28; CTX.grade.uniforms.vig.value = 0.42;
  CTX.bloom.strength = 0.32; CTX.bloom.threshold = 0.9; CTX.renderer.toneMappingExposure = 0.88;
}
// ---------------- geometry helpers ----------------
const shotAt = (t) => PLAN.shots.find((s) => t >= s.a && t < s.b) || PLAN.shots[PLAN.shots.length - 1];
const groundR = 0.3;   // card bottom margin below the feet (R)
function cardBasis(A, camPos) { const ry = Math.atan2(camPos.x - A.x, camPos.z - A.z); return { ry, right: new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)), nrm: new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)) }; }
const local2world = (A, B, xR, yR, z = 0) => new THREE.Vector3(A.x, 0, A.z).addScaledVector(B.right, xR * MR).add(new THREE.Vector3(0, yR * MR, 0)).addScaledVector(B.nrm, z);
function viewFor(A, camPos, camRight) {   // which drawing of the character the camera sees: front, 3/4, profile, back; and its screen direction
  const toCam = Math.atan2(camPos.x - A.x, camPos.z - A.z); let d = toCam - A.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); const ad = Math.abs(d);
  const F = new THREE.Vector3(Math.sin(A.facing), 0, Math.cos(A.facing)), dir = F.dot(camRight) >= 0 ? 1 : -1;
  if (ad > 2.15) return { yaw: 0, dir, back: true }; return { yaw: cl((ad - 0.18) / 1.25), dir, back: false }; }
// ---------------- acting ----------------
function envAt(name, t0, t) { const e = ENV[name], i = Math.floor((t - t0) * ENV.fps); return i >= 0 && i < e.length ? e[i] : -1; }
function lipSync(id, st, t) { for (const d of PLAN.dialogue) { if (d.who !== id) continue; const v = envAt(d.env, d.at, t); if (v < 0) continue; const f = st.face;
  f.jaw = Math.max(f.jaw * 0.4, v * 0.62); f.mouthW = L(f.mouthW, 1.0 + 0.25 * Math.sin(t * 23), 0.6); f.round = v > 0.2 ? 0.35 * (0.5 + 0.5 * Math.sin(t * 17)) : f.round; f.teeth = Math.max(f.teeth, 0.6); if (v < 0.08) f.jaw *= 0.2; } }
function headWorld(A, B, t, which) {   // world position of an actor's head centre (which: sam/robber for the pair card)
  const id = A.kind === 'pair' ? (which === 'robber' ? 'masked_robber' : 'sam_ortiz') : A.id, C = CH[id], st = stateAt(C, PLAN.scripts[id], t), p = poseFrom(C, st, t, { yaw: 0 }), K = skeleton(C, p);
  const ox = A.kind === 'pair' ? PAIR[which === 'robber' ? 'robber' : 'sam'] : 0; return local2world(A, B, ox + K.headC[0], -K.headC[1]); }
function target(name, t, camPos) {   // symbolic look/eye-line targets
  if (Array.isArray(name)) return new THREE.Vector3(...name);
  const [kind, who] = name.includes(':') ? name.split(':') : ['head', name];
  if (who === 'bag') return bag.visible ? bag.position.clone() : new THREE.Vector3(0.7, 0.2, -2.2);
  if (who === 'wide') return new THREE.Vector3(3, 1.2, 2);
  const key = who === 'sam' || who === 'robber' ? 'pair' : Object.keys(PLAN.actors).find((k) => k === who) || who, A = ACT[key]; if (!A) return new THREE.Vector3(0, 1.4, 0);
  const B = cardBasis(A, camPos); if (kind === 'mid') return headWorld(A, B, t, 'sam').lerp(headWorld(A, B, t, 'robber'), 0.5).add(new THREE.Vector3(0, -0.15, 0));
  const h = headWorld(A, B, t, who); if (kind === 'eyes') h.y += 0.02 * MR; return h; }
function lookParams(A, which, st, t, camPos, camRight) {   // eye direction toward a world target, in the card's screen space
  const step = st.step?.look; if (!step) return; const h = headWorld(A, cardBasis(A, camPos), t, which), tg = target(step, t, camPos), d = tg.clone().sub(h);
  const toCam = camPos.clone().sub(h).normalize(), side = d.dot(camRight), dist = d.length(), toward = d.normalize().dot(toCam);
  const lx = cl(side / Math.max(0.5, dist) * 1.6, -1, 1) * (1 - 0.6 * Math.max(0, toward)), ly = cl(-(tg.y - h.y) / Math.max(0.6, dist) * 1.2, -0.8, 0.9);
  const dart = Math.sin(t * 2.3 + A.seed) > 0.97 ? 0.12 : 0;   // occasional eye darts
  st.face.look = [L(st.face.look[0], lx, 0.85) + dart, L(st.face.look[1], ly, 0.85)]; }
// ---------------- 2D lighting matched to the 3D key light ----------------
const tmpA = document.createElement('canvas'), tmpB = document.createElement('canvas');
function lightCanvas(cv, g, toPx, S, lightSide, back, rimCol, shadeCol, strength = 1) {   // toPx(xR,yR) maps actor space -> canvas px
  const W = cv.width, H = cv.height; for (const t of [tmpA, tmpB]) { if (t.width !== W || t.height !== H) { t.width = W; t.height = H; } }
  const a = tmpA.getContext('2d'); a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, W, H);
  const [x0] = toPx(-3, 0), [x1] = toPx(3, 0), gr = a.createLinearGradient(lightSide > 0 ? x1 : x0, 0, lightSide > 0 ? x0 : x1, 0);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,1)'); gr.addColorStop(1, shadeCol); a.fillStyle = gr; a.fillRect(0, 0, W, H);
  a.globalCompositeOperation = 'destination-in'; a.drawImage(cv, 0, 0); g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = (0.55 + 0.35 * back) * strength; g.drawImage(tmpA, 0, 0); g.restore();
  // rim: silhouette minus a copy shifted away from the light
  const b = tmpB.getContext('2d'), off = Math.max(1.5, S * 0.055); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); b.globalCompositeOperation = 'source-in'; b.fillStyle = rimCol; b.fillRect(0, 0, W, H);
  b.globalCompositeOperation = 'destination-out'; b.drawImage(cv, -lightSide * off, off * 0.35); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (0.25 + 0.6 * back) * strength; g.drawImage(tmpB, 0, 0); g.restore(); }
// ---------------- drawing an actor (single or the hostage pair) in any canvas window ----------------
function drawActor(A, g, S, gx, gy, t, view, camPos, camRight) {   // (gx, gy) = canvas px of the card's ground origin; S = px per R
  const blink = (seed) => blinkAt(seed, t);
  if (A.kind !== 'pair') { const C = CH[A.id], st = stateAt(C, PLAN.scripts[A.id], t); lipSync(A.id, st, t); lookParams(A, A.key, st, t, camPos, camRight); const p = poseFrom(C, st, t, { ...view, blink: blink(A.seed) }); p.noShadow = true;
    if (A.dogtags) p.dogtags = A.dogtags; drawCharacter(g, C, p, t, S, [gx, gy]); return; }
  // hostage pair: robber (behind, right) -> Sam -> robber's arms on top (gun hand at Sam's temple, bag in the other hand until the throw)
  const Sm = CH.sam_ortiz, Rb = CH.masked_robber, stS = stateAt(Sm, PLAN.scripts.sam_ortiz, t), stR = stateAt(Rb, PLAN.scripts.masked_robber, t); lipSync('masked_robber', stR, t);
  lookParams(A, 'sam', stS, t, camPos, camRight); lookParams(A, 'robber', stR, t, camPos, camRight);
  const vS = { ...view, blink: blink(11) }, vR = { ...view, blink: blink(17), dir: -view.dir * 0 + (view.dir || 1) * -1 };   // robber turns his body toward Sam
  vR.yaw = Math.max(view.yaw, 0.28);
  const pS = poseFrom(Sm, stS, t, vS), pR = poseFrom(Rb, stR, t, vR); pS.noShadow = pR.noShadow = true; const KS = skeleton(Sm, pS), KR = skeleton(Rb, pR);
  const xs = gx + PAIR.sam * S, xr = gx + PAIR.robber * S, head = [(xs + KS.headC[0] * S - xr) / S, KS.headC[1]];
  const tr = Math.sin(t * 31) * 0.02 + Math.sin(t * 7) * 0.015;   // nervous gun hand
  const B = PLAN.bag, wind = ss((t - (B.release - 0.45)) / 0.35), fling = ss((t - (B.release - 0.1)) / 0.2), held = t < B.release;
  const bagHand = [KR.shoulders[1][0] + 0.45 + wind * 0.4 - fling * 1.2, KR.hipY + 0.35 - wind * 0.9 - fling * 1.2];
  pR.hands = [[head[0] + 1.62, head[1] + 0.06 + tr], held || t < B.release + 0.4 ? bagHand : [KR.shoulders[1][0] + 0.3, KR.hipY + 0.2]];
  pR.holding = [`pistol`, held ? 'duffel' : null]; pR.aim = [Math.PI + 0.05, 0]; pR.armBend = [1, -1]; pR.skipArms = [0, 1];
  drawCharacter(g, Rb, pR, t, S, [xr, gy]); drawCharacter(g, Sm, pS, t, S, [xs, gy]); drawArmOnly(g, Rb, pR, 1, S, [xr, gy]); drawArmOnly(g, Rb, pR, 0, S, [xr, gy]);
  A.bagHandR = [PAIR.robber + bagHand[0], -bagHand[1]]; }
function ensure(cv, tex, W, H) { if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; tex.dispose(); } }
// ---------------- per frame ----------------
export function frame(wt, CTX, t) {
  const { camera } = CTX, sh = shotAt(t), K = sh.keys; setPlate(sh, CTX); const PL = !!sh.plate; let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const k0 = K[i], k1 = K[Math.min(i + 1, K.length - 1)], u = k1 === k0 ? 0 : ss((t - k0.t) / (k1.t - k0.t));
  const camPos = new THREE.Vector3(...k0.pos).lerp(new THREE.Vector3(...k1.pos), u);
  // subtle handheld breathing in close shots (smooth, never jittery)
  if (sh.id !== 'S2') camPos.add(new THREE.Vector3(Math.sin(t * 0.9) * 0.006, Math.sin(t * 1.3 + 1) * 0.005, 0));
  camera.position.copy(camPos); camera.up.set(0, 1, 0);
  // bag physics: hand -> ballistic arc -> land -> slide and settle (3D prop, real shadow)
  const B = PLAN.bag;
  if (t >= B.release) { bag.visible = true; const P = ACT.pair, BB = cardBasis(P, camPos), h = P.bagHandR ? local2world(P, BB, P.bagHandR[0], P.bagHandR[1], 0.12) : new THREE.Vector3(0.2, 1.2, -6);
    const land = new THREE.Vector3(B.land_at[0], 0.11, B.land_at[1]), rest = new THREE.Vector3(B.rest_at[0], 0.11, B.rest_at[1]);
    if (t < B.land) { const k = (t - B.release) / (B.land - B.release); bag.position.lerpVectors(h, land, k); bag.position.y = L(h.y, land.y, k) + Math.sin(Math.PI * k) * 1.1; bag.rotation.set(k * 2.2, k * 3.0, 0.4 * k); }
    else { const k = 1 - Math.pow(1 - cl((t - B.land) / (B.rest - B.land)), 2.4); bag.position.lerpVectors(land, rest, k); bag.position.y = 0.11 + Math.max(0, Math.sin(Math.PI * cl((t - B.land) / 0.18))) * 0.06; bag.rotation.set(2.2 + 0.0 * k, 3.0 + 0.8 * k, 0.0); bag.rotation.x = Math.PI * 0.5 * 0 + 0.0; } }
  else bag.visible = false;
  const lookPt = typeof L === 'function' && Array.isArray(k0.look) && Array.isArray(k1.look) ? new THREE.Vector3(...k0.look).lerp(new THREE.Vector3(...k1.look), u) : target(k0.look, t, camPos).lerp(target(k1.look, t, camPos), u);
  camera.lookAt(lookPt); camera.fov = L(k0.fov, k1.fov, u); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize(), camF = new THREE.Vector3(); camera.getWorldDirection(camF); camF.setY(0).normalize();
  bokeh.uniforms.focus.value = camPos.distanceTo(lookPt); bokeh.uniforms.aperture.value = sh.ap ?? 0.001; bokeh.uniforms.maxblur.value = 0.008;
  // key light direction (toward the light) for the 2D lighting pass
  const Ld = BANK.lights.key.position.clone().sub(BANK.lights.key.target.position).setY(0).normalize(), lightSide = Ld.dot(camRight) >= 0 ? 1 : -1, back = cl(-Ld.dot(camF) * -1);
  for (const A of Object.values(ACT)) {
    if (PLAN.hideActors) { A.card.mesh.visible = A.win.mesh.visible = false; A.blob.visible = false; continue; }
    const Bs = cardBasis(A, camPos), view = viewFor(A, camPos, camRight), res = sh.res?.[A.key] ?? (camPos.distanceTo(new THREE.Vector3(A.x, 1, A.z)) < 7 ? 120 : 80);
    const W = Math.round(A.wR * res), H = Math.round(A.hR * res); ensure(A.c, A.card.tex, W, H); const g = A.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const gx = W / 2, gy = H - groundR * res; drawActor(A, g, res, gx, gy, t, view, camPos, camRight);
    lightCanvas(A.c, g, (x, y) => [gx + x * res, gy + y * res], res, lightSide, Math.max(0, Ld.dot(camF)), PL ? 'rgb(255,250,240)' : 'rgb(255,214,160)', PL ? 'rgba(170,180,200,1)' : 'rgba(120,135,170,1)', PL ? 0.35 : 1);
    { const f = PL ? (sh.cardBright ?? 0.62) : (sh.fill?.[A.key] ?? 0.2); for (const mm of [A.card.mesh, A.win.mesh]) mm.material.emissive.setRGB(f, f * 0.97, f * 0.95); }
    A.card.tex.needsUpdate = true; const m = A.card.mesh; m.scale.set(A.wR * MR, A.hR * MR, 1); m.position.set(A.x, -groundR * MR, A.z); m.rotation.set(0, Bs.ry, 0); m.updateMatrixWorld();
    // high-res face window for close-ups (exactly overlays the body card)
    const wn = sh.win?.[A.key];
    if (wn) { const who = wn.on === 'sam' ? 'sam' : wn.on === 'robber' ? 'robber' : A.key, C = CH[A.kind === 'pair' ? (who === 'robber' ? 'masked_robber' : 'sam_ortiz') : A.id];
      const st = stateAt(C, PLAN.scripts[C.id], t), Kp = skeleton(C, poseFrom(C, st, t, view)), cx = (A.kind === 'pair' ? PAIR[who] : 0) + Kp.headC[0], cy = Kp.headC[1] + 0.35;
      const size = wn.size, WR = Math.round(size * wn.res); ensure(A.w, A.win.tex, WR, WR); const wg = A.wg; wg.setTransform(1, 0, 0, 1, 0, 0); wg.clearRect(0, 0, WR, WR);
      const ox = WR / 2 - cx * wn.res, oy = WR / 2 - cy * wn.res; drawActor(A, wg, wn.res, ox, oy, t, view, camPos, camRight);
      lightCanvas(A.w, wg, (x, y) => [ox + x * wn.res, oy + y * wn.res], wn.res, lightSide, Math.max(0, Ld.dot(camF)), PL ? 'rgb(255,250,240)' : 'rgb(255,214,160)', PL ? 'rgba(170,180,200,1)' : 'rgba(120,135,170,1)', PL ? 0.35 : 1);
      A.win.tex.needsUpdate = true; const wm = A.win.mesh; wm.visible = true; wm.scale.set(size * MR, size * MR, 1); const p = local2world(A, Bs, cx, -(cy + size / 2), 0.004); wm.position.copy(p); wm.rotation.set(0, Bs.ry, 0);
       }
    else A.win.mesh.visible = false;
  }
  BANK.tick(t);
}

// Cinematic edit: 3D house world + cutout presenter + kinetic type. GSAP timeline (absolute times) + per-frame render.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeHouse } from './house.js';

const TL = window.TL, WORDS = window.WORDS, IC = window.ICONS, DUR = 75.8;
const $ = (s) => document.querySelector(s);
const icon = (n) => `<svg viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
const fillIcons = () => document.querySelectorAll('.ico[data-i]').forEach((e) => (e.innerHTML = icon(e.dataset.i)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const EASE = 'expo.out';
const wAt = (word, after) => { const w = WORDS.find((x) => x.s >= after - 1e-3 && x.w.toLowerCase().replace(/[.,!?]/g, '') === word); return w ? w.s : after; };
const SWAP = wAt('this', 1.0);          // "Don't forget to do THIS" — the room falls away
const PRES = TL.tips[0] - 0.45;         // she steps into presenter position

/* ---------- timelines ---------- */
const tl = gsap.timeline({ paused: true });
const clock = { t: 0 };
const master = gsap.timeline({ paused: true });
master.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => { tl.seek(clock.t, false); frame(clock.t); } }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = master;
const at = (s, t, v) => tl.to(s, v, t), fromTo = (s, t, a, b) => tl.fromTo(s, a, b, t), set = (s, t, v) => tl.set(s, v, t);
const maskIn = (s, t, d = 0.75) => fromTo(s, t, { yPercent: 115, opacity: 1 }, { yPercent: 0, duration: d, ease: EASE });
const maskOut = (s, t, d = 0.4) => at(s, t, { yPercent: -115, duration: d, ease: 'expo.in' });
const glassIn = (s, t, d = 0.6) => fromTo(s, t, { opacity: 0, y: 50, scale: 0.88, filter: 'blur(14px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: d, ease: EASE });
const glassOut = (s, t, d = 0.3) => at(s, t, { opacity: 0, y: -30, scale: 0.94, filter: 'blur(10px)', duration: d, ease: 'power2.in' });

/* ---------- her: hero → presenter ---------- */
set('#cut-wrap', 0, { scale: 1, x: 0, y: 0 });
at('#cut-wrap', PRES, { scale: 0.62, duration: 0.9, ease: 'expo.inOut' });
/* cold open: two shock reactions, then her — "Don't / forget / to do THIS" */
const HB = 0.62, HC = SWAP;
fromTo('#hA', 0, { scale: 1.32 }, { scale: 1.06, duration: HB, ease: 'expo.out' });
set('#hB', HB, { visibility: 'visible' }); fromTo('#hB', HB, { scale: 1.38 }, { scale: 1.1, duration: HC - HB, ease: 'expo.out' });
fromTo('#hk1', 0, { opacity: 0, scale: 2.4, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.2, ease: 'power4.out' });
set('#hk1', HB, { opacity: 0 });
fromTo('#hk2', HB, { opacity: 0, scale: 2.4, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.2, ease: 'power4.out' });
fromTo('#hook', SWAP - 0.02, { scale: 1, opacity: 1, filter: 'blur(0px)' }, { scale: 1.35, opacity: 0, filter: 'blur(26px)', duration: 0.55, ease: 'expo.in' });
set('#hook', SWAP + 0.6, { visibility: 'hidden' }); set('#orig-wrap', 0, { visibility: 'hidden' });
/* the real room drops away at "this" */
fromTo('#orig-wrap', SWAP - 0.02, { scale: 1, opacity: 1, filter: 'blur(0px)' }, { scale: 1.35, opacity: 0, filter: 'blur(26px)', duration: 0.55, ease: 'expo.in' });
fromTo('#bt-this', SWAP, { opacity: 0, scale: 1.35, filter: 'blur(20px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: EASE });
at('#bt-this', TL.walk - 0.35, { opacity: 0, scale: 0.9, filter: 'blur(14px)', duration: 0.35, ease: 'power2.in' });
fromTo('#bt-walk .a', TL.walk, { opacity: 0, letterSpacing: '0.6em', filter: 'blur(12px)' }, { opacity: 1, letterSpacing: '0.24em', filter: 'blur(0px)', duration: 0.9, ease: EASE });
fromTo('#bt-walk .b', TL.walk + 0.15, { opacity: 0, y: 60, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: EASE });
set('#bt-walk', TL.walk, { opacity: 1 }); at('#bt-walk', PRES - 0.05, { opacity: 0, y: -40, filter: 'blur(12px)', duration: 0.4, ease: 'power2.in' });

/* ---------- chips ---------- */
const chips = $('#chips');
function chip(html, cls, x, y, tIn, tOut) { const e = document.createElement('div'); e.className = `chip glass ${cls}`; e.innerHTML = html; e.style.left = x + 'px'; e.style.top = y + 'px'; chips.appendChild(e);
  fromTo(e, tIn, { opacity: 0, scale: 0.5, xPercent: -50, yPercent: -50, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'back.out(2.2)' });
  at(e, tOut, { opacity: 0, scale: 0.8, filter: 'blur(8px)', duration: 0.25, ease: 'power2.in' }); }
chip('<span class="ico" data-i="triangle-alert"></span>Seller MIA?', 'warn', 300, 1260, TL.mia, TL.walk - 0.2);
chip('<span class="ico" data-i="triangle-alert"></span>Lawyer MIA?', 'warn', 780, 1260, TL.lawyer, TL.walk - 0.2);
chip('<span class="ico" data-i="calendar-days"></span>1–2 days before closing', 'goldc', 540, 1270, TL.days, PRES);

/* ---------- presenter UI: pill, titles, numerals ---------- */
const TITLES = [['Check one', 'Doors <em>&amp; locks</em>'], ['Check two', 'Kitchen <em>&amp; laundry</em>'], ['Check three', 'Sinks <em>&amp; faucets</em>'], ['Check four', 'The <em>ceiling</em>'], ['Check five', 'Fixtures <em>&amp; walls</em>']];
glassIn('#pill', TL.tips[0] - 0.1); glassOut('#pill', TL.allDone + 0.2);
$('#ti-k').innerHTML = '<span></span>'; $('#ti-t').innerHTML = '<span></span>';
TL.tips.forEach((t, i) => {
  tl.call(() => setTitle(i), null, t - 0.02);
  maskIn('#ti-k span', t, 0.6); maskIn('#ti-t span', t + 0.08, 0.8); maskOut('#ti-k span', t + 2.9); maskOut('#ti-t span', t + 2.95);
  fromTo('#bignum', t, { opacity: 0, x: 120, filter: 'blur(14px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.8, ease: EASE });
  at('#bignum', t + 2.9, { opacity: 0, x: -60, filter: 'blur(10px)', duration: 0.4, ease: 'power2.in' });
});
function setTitle(i) { $('#ti-k span').textContent = TITLES[i][0]; $('#ti-t span').innerHTML = TITLES[i][1]; $('#bignum-t').textContent = '0' + (i + 1); $('#pl-k').textContent = `Check ${i + 1} of 5`; }
const tipAt = (t) => { let k = -1; TL.tips.forEach((x, i) => { if (t >= x - 0.02) k = i; }); return k; };

/* ---------- icon tiles ---------- */
const row = $('#icons');
TL.icons.forEach((grp, gi) => grp.forEach((ic, k) => {
  const e = document.createElement('div'); e.className = 'ib'; e.innerHTML = `<div class="ib-b glass"><span class="ico" data-i="${ic.i}"></span></div><div class="ib-l">${ic.l}</div>`; row.appendChild(e);
  set(e, 0, { display: 'none' }); set(e, grp[0].t - 0.02, { display: 'flex' });
  fromTo(e, ic.t, { opacity: 0, y: 60, scale: 0.4, rotationX: -60 }, { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.6, ease: 'back.out(1.8)' });
  fromTo(e.querySelector('.ico'), ic.t + 0.05, { rotation: -25, scale: 0.6 }, { rotation: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1,.45)' });
  at(e, TL.ticks[gi] - 0.08, { opacity: 0, y: -40, scale: 0.7, filter: 'blur(6px)', duration: 0.28, ease: 'power2.in' });
  set(e, TL.ticks[gi] + 0.25, { display: 'none' });
}));

/* ---------- floating B-roll screens (3D tilt, drift) ---------- */
TL.broll.forEach((b, i) => {
  const el = document.getElementById('b' + i); if (!el) return;
  if (i === 7) { set(el, 0, { display: 'none' }); return; }        // CTA uses the phone instead
  const side = i % 2 ? -1 : 1;
  fromTo(el, b.t, { opacity: 0, rotationY: 38 * side, rotationX: 8, z: -500, x: 260 * side, filter: 'blur(16px)' },
    { opacity: 1, rotationY: 12 * side, rotationX: 2, z: 0, x: 0, filter: 'blur(0px)', duration: 0.7, ease: EASE });
  at(el, b.t + 0.7, { rotationY: 4 * side, duration: b.d - 1.0, ease: 'none' });
  at(el, b.t + b.d - 0.3, { opacity: 0, rotationY: -30 * side, x: -320 * side, z: -300, filter: 'blur(12px)', duration: 0.3, ease: 'power2.in' });
  fromTo(el.querySelector('video'), b.t, { scale: 1.15 }, { scale: 1.0, duration: b.d, ease: 'none' });
});

/* ---------- tags that point at the 3D house ---------- */
const tags = $('#tags');
function tag(html, cls, x, y, tIn, tOut) { const e = document.createElement('div'); e.className = `tag glass ${cls}`; e.innerHTML = html; e.style.left = x + 'px'; e.style.top = y + 'px'; tags.appendChild(e);
  fromTo(e, tIn, { opacity: 0, scale: 0.6, xPercent: -50, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(2)' });
  at(e, tOut, { opacity: 0, scale: 0.85, filter: 'blur(8px)', duration: 0.25, ease: 'power2.in' }); }
TL.ticks.forEach((t, i) => tag('<span class="ico" data-i="circle-check-big"></span>Checked', 'ok', 540, 250, t - 0.05, t + 1.0));
const C = TL.ceiling, F = TL.fixtures;
tag('<span class="ico" data-i="arrow-up"></span>Look up', '', 540, 560, C.t + 0.4, C.stain - 0.1);
tag('<span class="ico" data-i="droplet"></span>Water stain?', 'bad', 540, 600, C.stain + 0.1, C.out);
tag('<span class="ico" data-i="search"></span>Changed since your visit?', '', 540, 700, C.changes, C.out);
tag('<span class="ico" data-i="thermometer"></span>Smart thermostat — still there?', '', 540, 580, F.t + 0.2, F.out);
tag('<span class="ico" data-i="frame"></span>Wall-mount holes — patched?', 'bad', 540, 670, F.holes + 0.3, F.out);
tag('<span class="ico" data-i="house"></span>Any major changes?', '', 540, 760, F.major, F.out);

/* ---------- scroll checklist: all five ---------- */
const LIST = ['Doors & locks', 'Kitchen & laundry', 'Sinks & faucets', 'Ceilings', 'Fixtures & walls'];
$('#list .ls-rows').innerHTML = LIST.map((l) => `<div class="lr"><div class="ck"><span class="ico" data-i="check"></span></div>${l}</div>`).join('');
glassIn('#list', TL.allDone - 0.1, 0.6);
fromTo('#list .lr', TL.allDone + 0.15, { opacity: 0, y: 70, rotationX: -50 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.5, stagger: 0.16, ease: 'back.out(1.6)' });
fromTo('#list .ck', TL.allDone + 0.3, { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.16, ease: 'back.out(3)' });
glassOut('#list', TL.checklist - 0.4);

/* ---------- Instagram DM: viewer types CHECKLIST, she replies ---------- */
const send = wAt('send', 68.5);
glassIn('#phone', TL.checklist - 0.2, 0.7);
fromTo('#m1', TL.checklist + 0.3, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' });
fromTo('#m2', TL.dm - 0.5, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' });
fromTo('#m3', send - 0.3, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' });
fromTo('#m4', send + 0.5, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' });
fromTo('.ph-msgs', send - 0.4, { y: 0 }, { y: -40, duration: 0.6, ease: EASE });
glassOut('#phone', TL.endcard - 0.3);
/* ---------- end ---------- */
fromTo('#end', TL.endcard, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE });
fromTo('.end-card', TL.endcard, { scale: 0.8, rotationX: 30, filter: 'blur(14px)' }, { scale: 1, rotationX: 0, filter: 'blur(0px)', duration: 0.9, ease: 'back.out(1.4)' });
fromTo('.end-n, .end-b, .end-h', TL.endcard + 0.3, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.14, ease: EASE });

/* ---------- captions: 1–3 word punches ---------- */
const KEY = /^(this|walkthrough|closing|locks|garage|remotes|backyard|doors?|kitchen|appliances|washer|dryer|sinks|leakages?|faucets|ceiling|leakage|changes|thermostat|holes|wall|mount|checklist|dm|text|m\.i\.a\.?|lawyer|seller|important|excellent)$/i;
const words = []; for (let i = 0; i < WORDS.length; i++) { const w = WORDS[i]; if (w.w === 'M' && WORDS[i + 1] && WORDS[i + 1].w.startsWith('.')) { words.push({ w: 'M.I.A.', s: w.s, e: WORDS[i + 2].e }); i += 2; continue; } words.push({ ...w }); }
const phrases = []; let cur = [];
words.forEach((w, i) => { cur.push(w); const txt = cur.map((x) => x.w).join(' '); const n = words[i + 1];
  if (/[.,!?]$/.test(w.w) || cur.length >= 3 || txt.length > 15 || !n || n.s - w.e > 0.4) { phrases.push(cur); cur = []; } });
const capEl = $('#caption'); let capKey = -1;
function renderCaptions(t) {
  if (t < HC) { if (capKey !== -1) { capEl.innerHTML = ''; capKey = -1; } return; }
  let pi = -1; for (let i = 0; i < phrases.length; i++) if (t >= phrases[i][0].s - 0.06) pi = i;
  const ph = phrases[pi]; const live = ph && t <= ph[ph.length - 1].e + 0.35;
  if (!live) { if (capKey !== -1) { capEl.innerHTML = ''; capKey = -1; } return; }
  if (pi !== capKey) { capKey = pi; capEl.innerHTML = ph.map((w) => `<span class="w${KEY.test(w.w.replace(/[.,!?]+$/, '')) || /^m\.i\.a/i.test(w.w) ? ' k' : ''}">${w.w.replace(/[,]$/, '')}</span>`).join(' '); }
  const sp = capEl.children;
  ph.forEach((w, j) => { const e = sp[j]; if (!e) return; const lt = t - w.s; const p = clamp((lt + 0.05) / 0.14); const o = p < 1 ? 1 + 0.55 * (1 - p) : 1;
    e.style.opacity = lt < -0.05 ? 0 : clamp((lt + 0.05) / 0.06); e.style.transform = `translateY(${(1 - p) * 18}px) scale(${o.toFixed(3)})`; e.style.filter = `blur(${((1 - p) * 6).toFixed(1)}px)`; });
}

/* ---------- Three.js world ---------- */
let ready = false, renderer, composer, bloom, fx, H;
const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
const FINAL = { uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uCA: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame,uCA; varying vec2 vUv; float r(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.61)*43758.5453); }
    void main(){ vec2 c=vUv-.5; float d=dot(c,c); vec2 o=c*d*uCA; vec3 col=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
      col*=1.-d*.6; col+=(r(vUv*vec2(1080.,1920.))-.5)*.025; gl_FragColor=vec4(col,1.); }` };
async function init() {
  await Promise.all(['400', '700', '800', '900'].map((w) => document.fonts.load(`${w} 40px "Inter Tight"`)).concat([document.fonts.load('400 40px "Instrument Serif"'), document.fonts.load('italic 400 40px "Instrument Serif"')]));
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(DPR); renderer.setSize(1080, 1920, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  H = makeHouse(TL, DPR);
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(H.scene, H.cam));
  bloom = new UnrealBloomPass(new THREE.Vector2(540 * DPR, 960 * DPR), 0.9, 0.6, 0.55); composer.addPass(bloom);
  fx = new ShaderPass(FINAL); composer.addPass(fx); composer.addPass(new OutputPass());
  H.update(0); renderer.compile(H.scene, H.cam);
  ready = true; tl.seek(clock.t, false); frame(clock.t); window.__resolveBuild && window.__resolveBuild();
}

/* ---------- per frame ---------- */
const cuts = [0, ...TL.cuts];
const hits = [SWAP, TL.walk, ...TL.tips, TL.allDone, TL.checklist, TL.endcard];
const env = (t, h, k) => (t >= h ? Math.exp(-(t - h) * k) : 0);
function frame(t) {
  renderCaptions(t);
  // hero punch-ins on cuts (before presenter mode)
  let seg = 0; for (let i = 0; i < cuts.length; i++) if (t >= cuts[i]) seg = i;
  const z = t < PRES ? (seg % 2 ? 1.06 : 1.0) + (t - cuts[seg]) * 0.004 : 1 + Math.sin(t * 0.6) * 0.004;
  $('#cut-inner').style.transform = `scale(${z.toFixed(4)})`;
  const k = tipAt(t); if (k >= 0 && $('#bignum-t').textContent !== '0' + (k + 1)) setTitle(k);
  // progress bars
  document.querySelectorAll('.pl-bars i').forEach((b, i) => { b.className = t >= TL.ticks[i] ? 'done' : (k === i ? 'now' : ''); });
  // phone typing
  const typed = 'CHECKLIST'.slice(0, Math.floor(clamp((t - (TL.dm - 0.35)) / 0.7) * 9)); const m2 = $('#m2t'); if (m2.textContent !== typed) m2.textContent = typed;
  $('.caret').style.opacity = t < TL.dm + 0.5 && Math.floor(t * 3) % 2 === 0 ? 1 : 0;
  // flash + light leak + grain
  let fl = 0; for (const h of hits) fl = Math.max(fl, env(t, h, 9) * (h === SWAP ? 0.85 : 0.22));
  fl = Math.max(fl, env(t, HB, 14) * 0.55);
  // handheld impact shake on the cold-open cuts
  const sk = Math.max(env(t, 0, 7), env(t, HB, 7)) * (t < SWAP ? 1 : 0);
  const shake = sk > 0.01 ? `translate(${(Math.sin(t * 97) * 22 * sk).toFixed(1)}px, ${(Math.cos(t * 83) * 16 * sk).toFixed(1)}px) rotate(${(Math.sin(t * 61) * 0.6 * sk).toFixed(2)}deg)` : 'none';
  $('#hook').style.transform = shake; $('#orig-wrap').style.translate = sk > 0.01 ? `${(Math.sin(t * 97) * 18 * sk).toFixed(1)}px ${(Math.cos(t * 83) * 12 * sk).toFixed(1)}px` : '0px 0px';
  $('#flash').style.opacity = fl.toFixed(3);
  $('#leak').style.opacity = (0.25 + 0.25 * Math.sin(t * 0.5) + Math.max(...hits.map((h) => env(t, h, 3))) * 0.5).toFixed(3);
  const fr = Math.floor(t * 30); $('#grain').style.transform = `translate(${((fr * 73) % 300) - 150}px, ${((fr * 151) % 300) - 150}px)`;
  let ca = 0; for (const h of hits) ca = Math.max(ca, env(t, h, 10));
  $('#front').style.filter = ca > 0.05 ? `drop-shadow(${-5 * ca}px 0 0 rgba(255,60,60,.5)) drop-shadow(${5 * ca}px 0 0 rgba(60,200,255,.5))` : 'none';
  if (!ready) return;
  H.update(t);
  fx.uniforms.uFrame.value = fr % 977; fx.uniforms.uCA.value = 0.02 + ca * 0.06;
  composer.render();
}
fillIcons();
init();

// SOTI — "Ward Four". Master timeline: one GSAP timeline drives the DOM; its onUpdate renders Three.js for the same instant.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeHospital, makeBlackHole, makeConstellation, makeRoad, makeSlabs, clamp, prog, ease, rng } from './scenes.js';

const CU = window.CUES, VO = window.VO, SC = CU.SCENES, EV = CU.EVENTS, B = CU.B;
const $ = (s) => document.querySelector(s);
const FRAME = 1 / CU.FPS;

/* ---------------- master timeline (registered synchronously) ---------------- */
const tl = gsap.timeline({ paused: true });
const clockObj = { t: 0 };
tl.to(clockObj, { t: CU.DUR, duration: CU.DUR, ease: 'none', onUpdate: () => frame(clockObj.t) }, 0);
window.__timelines = window.__timelines || {};
window.__timelines['main'] = tl;

/* ---------------- DOM helpers ---------------- */
const at = (sel, time, vars) => tl.to(sel, { ...vars }, time);
const fromTo = (sel, time, a, b) => tl.fromTo(sel, a, b, time);
const set = (sel, time, vars) => tl.set(sel, vars, time);

/* ---------------- chips that pop on spoken words ---------------- */
const chipsEl = $('#chips');
function chip(text, cls, x, y, tIn, tOut, icon = '') {
  const el = document.createElement('div'); el.className = `chip glass ${cls}`; el.innerHTML = `${icon}<span>${text}</span>`;
  el.style.left = x + 'px'; el.style.top = y + 'px'; chipsEl.appendChild(el);
  fromTo(el, tIn, { opacity: 0, scale: 0.4, xPercent: -50, yPercent: -50, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.28, ease: 'back.out(2.2)' });
  at(el, tOut, { opacity: 0, scale: 0.6, duration: 0.12, ease: 'power2.in' });
}
const wordTime = (clip, idx) => CU.VO[clip] + VO[clip].words[idx].s;
const N0 = CU.VO.nurse, P0 = CU.VO.stella_promise, SIL = CU.SILENCE[0];
// nurse — red chips, level rows left/right of centre
chip('⚠ 40 SCANNERS DOWN', 'red', 520, 470, wordTime('nurse', 8), 11.2);
chip('MEDS BLOCKED', 'red', 1400, 470, wordTime('nurse', 13), 11.2);
chip('PATIENTS WAITING', 'red', 520, 600, wordTime('nurse', 17), 11.2);
chip('IT ON-SITE · 47 MIN', 'red', 1400, 600, wordTime('nurse', 23), 11.2);
// Stella — blue chips
chip('CALL CONNECTED', 'blue', 520, 470, wordTime('stella_promise', 1), SIL);
chip('40 DEVICES VISIBLE', 'blue', 1400, 470, wordTime('stella_promise', 8), SIL);
chip('WARD 4 · FLOOR 3', 'blue', 520, 600, wordTime('stella_promise', 10), SIL);
chip('PATIENT SAFETY · P1', 'blue', 1400, 600, wordTime('stella_promise', 15), SIL);
chip('STELLA IS ON IT', 'blue', 960, 735, wordTime('stella_promise', 17), SIL);
// post-drop status chips
chip('40 / 40 ONLINE', 'blue', 560, 760, SC.online[0] + 0.25, SC.online[1] - 0.05);
chip('✓ SLA MET', 'blue', 1360, 760, SC.online[0] + 0.45, SC.online[1] - 0.05);

/* ---------------- HUD, call card, Stella card ---------------- */
fromTo('#hud', 0.25, { opacity: 0 }, { opacity: 1, duration: 0.6 });
set('#hud', SIL, { opacity: 0 }); set('#hud', CU.D, { opacity: 1 }); at('#hud', SC.end[0] - 0.1, { opacity: 0, duration: 0.15 });
fromTo('#call', 0.45, { opacity: 0, y: -30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.8)' });
// morph: the call card becomes Stella's card
at('#call', 11.25, { width: 560, marginLeft: -280, borderColor: 'rgba(47,183,234,.7)', opacity: 0, duration: 0.3, ease: 'power3.inOut' });
fromTo('#stella', 11.45, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' });
set('#stella', SIL, { opacity: 0 });

/* ---------------- reticle (Location identified) ---------------- */
const s1 = CU.VO.s1;
fromTo('#reticle', s1 - 0.15, { opacity: 0, scale: 2.4, rotation: -90 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.42, ease: 'expo.out' });
fromTo('#reticle .r-label', s1 + 0.25, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)' });
set('#reticle', SC.diag[0], { opacity: 0 });

/* ---------------- diagnostics ---------------- */
fromTo('#diag', SC.diag[0], { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'expo.out' });
fromTo('#diag .metric', SC.diag[0] + 0.1, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.07, ease: 'back.out(2)' });
fromTo('#diag .row', SC.diag[0] + 0.55, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.12 });
fromTo('#diag .scanbar', SC.diag[0] + 0.2, { top: -140 }, { top: 760, duration: 1.4, ease: 'power1.inOut' });
fromTo('#rootcause', CU.VO.s2 + 0.75, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.16, ease: 'power4.in' });
// morph: panel collapses into the CONNECT button
at('#diag > *', SC.remote[0] - 0.22, { opacity: 0, duration: 0.1 });
at('#diag', SC.remote[0] - 0.2, { width: 560, height: 130, marginTop: -65, marginLeft: -280, borderRadius: 65, duration: 0.22, ease: 'expo.in' });
set('#diag', SC.remote[0], { opacity: 0 });

/* ---------------- remote control: cursor clicks a button that morphs into the device ---------------- */
set('#remote', SC.remote[0], { opacity: 1 });
const c1 = EV.click1, c2 = EV.click2;
fromTo('#cursor', SC.remote[0] + 0.05, { opacity: 0, x: 1560, y: 980 }, { opacity: 1, x: 990, y: 560, duration: c1 - SC.remote[0] - 0.12, ease: 'power3.out' });
at('#cursor', c1, { scale: 0.82, duration: 0.06 }); at('#cursor', c1 + 0.07, { scale: 1, duration: 0.1 });
fromTo('#ripple', c1, { width: 0, height: 0, marginLeft: 0, marginTop: 0, opacity: 0.9 }, { width: 340, height: 340, marginLeft: -170, marginTop: -170, opacity: 0, duration: 0.45, ease: 'power2.out' });
at('#rbtn .rb-txt', c1 + 0.04, { opacity: 0, duration: 0.08 });
at('#rbtn', c1 + 0.05, { width: 450, height: 690, marginLeft: -225, marginTop: -365, borderRadius: 52, duration: 0.42, ease: 'expo.inOut' });
fromTo('#dscreen', c1 + 0.3, { opacity: 0 }, { opacity: 1, duration: 0.15 });
at('#cursor', c1 + 0.12, { x: 1230, y: 700, duration: 0.5, ease: 'power2.inOut' });
fromTo('#ds-live', CU.VO.s3 + 0.1, { opacity: 0 }, { opacity: 1, duration: 0.1 });
at('#dscreen', CU.VO.s3 + 0.1, { borderColor: 'rgba(47,183,234,.9)', duration: 0.2 });
at('#ds-err', c2 - 0.75, { opacity: 0, y: -20, duration: 0.18 });
fromTo('#ds-fix', c2 - 0.6, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)' });
at('#cursor', c2 - 0.5, { x: 975, y: 560, duration: 0.42, ease: 'power3.inOut' });
at('#cursor', c2, { scale: 0.82, duration: 0.06 }); at('#cursor', c2 + 0.07, { scale: 1, duration: 0.1 });
at('#rollbtn', c2, { scale: 0.94, duration: 0.06 }); at('#rollbtn', c2 + 0.06, { scale: 1.06, boxShadow: '0 0 90px rgba(47,183,234,1)', duration: 0.12 });
set('#remote', SC.road[0], { opacity: 0 }); set('#cursor', SC.road[0], { opacity: 0 });

/* ---------------- split-flap counter ---------------- */
const flapNum = $('#flapnum'), flapWord = $('#flapword'), tiles = $('#tiles');
const mkCell = (row, cls = '') => { const c = document.createElement('div'); c.className = 'fc ' + cls; c.innerHTML = '<span></span><div class="flip"></div>'; row.appendChild(c); return c; };
const numCells = [mkCell(flapNum), mkCell(flapNum), mkCell(flapNum, 'slash'), mkCell(flapNum), mkCell(flapNum)];
numCells[2].querySelector('span').textContent = '/'; numCells[3].querySelector('span').textContent = '4'; numCells[4].querySelector('span').textContent = '0';
const wordCells = Array.from({ length: 7 }, () => mkCell(flapWord));
const tileEls = Array.from({ length: 40 }, () => { const d = document.createElement('div'); d.className = 'tile'; tiles.appendChild(d); return d; });
const tileOn = Array.from({ length: 40 }, (_, k) => EV.flap_start + (EV.flap_full - EV.flap_start) * Math.pow((k + 1) / 40, 0.8));
set('#flap', SC.flap[0], { opacity: 1 });
fromTo('#flapnum', SC.flap[0], { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'expo.out' });
fromTo('#tiles', SC.flap[0] + 0.1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 });
// morph: tiles gather into one locked device
at('#flapnum, #flapword', SC.lock[0] - 0.18, { opacity: 0, scale: 0.7, duration: 0.15 });
at('#tiles', SC.lock[0] - 0.2, { scale: 0.2, y: -260, opacity: 0, duration: 0.22, ease: 'expo.in' });
set('#flap', SC.lock[0], { opacity: 0 });

/* ---------------- lockdown ---------------- */
set('#lock', SC.lock[0], { opacity: 1 });
fromTo('#lockdev', SC.lock[0], { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' });
fromTo('#shackle', SC.lock[0], { y: -18 }, { y: -18, duration: 0.01 });
at('#shackle', EV.lockshut, { y: 0, duration: 0.07, ease: 'power4.in' });
at('#lockdev', EV.lockshut + 0.07, { scale: 1.06, duration: 0.05 }); at('#lockdev', EV.lockshut + 0.12, { scale: 1, duration: 0.15 });
set('#lock', SC.ticket[0], { opacity: 0 });

/* ---------------- incident ticket ---------------- */
fromTo('#ticket', SC.ticket[0], { opacity: 0, y: 40, rotationX: 12 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.35, ease: 'expo.out' });
fromTo('#ticket .t-row', SC.ticket[0] + 0.2, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.2, stagger: 0.16, ease: 'back.out(2)' });
fromTo('#stamp', EV.stamp, { opacity: 0, scale: 2.6 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power4.in' });
at('#ticket', EV.stamp + 0.09, { x: 10, duration: 0.03 }); at('#ticket', EV.stamp + 0.12, { x: -6, duration: 0.04 }); at('#ticket', EV.stamp + 0.16, { x: 0, duration: 0.05 });
at('#ticket', SC.slabs[0] - 0.15, { opacity: 0, scale: 0.9, duration: 0.12 });

/* ---------------- before / after glass slider ---------------- */
fromTo('#ba', SC.ba[0], { opacity: 0, scale: 0.85, rotationY: -18 }, { opacity: 1, scale: 1, rotationY: 0, duration: 0.3, ease: 'expo.out' });
const baP = { x: 0 };
fromTo(baP, SC.ba[0] + 0.35, { x: 0 }, { x: 100, duration: 1.05, ease: 'power3.inOut', onUpdate: () => {
  $('#ba-after').style.clipPath = `inset(0 ${100 - baP.x}% 0 0)`; $('#ba-handle').style.left = `${baP.x}%`; } });
set('#ba', SC.online[0], { opacity: 0 });

/* ---------------- end type, word-synced to the beat, then logo ---------------- */
const slam = (sel, time) => fromTo(sel, time, { opacity: 0, scale: 1.7, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.16, ease: 'power4.out' });
slam('.et.w1', EV.end_w1); slam('.et.w2', EV.end_w2); slam('.et.w3', EV.end_w3);
at('.et', EV.logo - 0.16, { scaleY: 0.02, opacity: 0, filter: 'blur(10px)', duration: 0.16, ease: 'expo.in', stagger: 0.02 });
fromTo('#endlogo', EV.logo, { opacity: 0, scale: 1.25, filter: 'blur(24px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out' });
fromTo('#tagline span', EV.tagline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.22, ease: 'expo.out' });
fromTo('#tagline i', EV.tagline, { scaleY: 0 }, { scaleY: 1, duration: 0.25 });
fromTo('#url', EV.tagline + 0.6, { opacity: 0 }, { opacity: 1, duration: 0.4 });

/* ---------------- captions from real word timestamps ---------------- */
function phrases(clip, hot) {
  const W = VO[clip].words, out = []; let cur = [];
  W.forEach((w, i) => { cur.push({ ...w, i, hot: hot.includes(i) }); if (/[.!?]$/.test(w.w) || i === W.length - 1) { out.push(cur); cur = []; } });
  return out.map((ws) => ({ clip, ws, t0: CU.VO[clip] + ws[0].s - 0.05 }));
}
const capPhrases = [...phrases('nurse', [8, 13, 16, 17, 25]), ...phrases('stella_promise', [10, 11, 15, 17, 18])];
const sysClips = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
const capEl = $('#caption'), sysEl = $('#sysline'); let capKey = null, sysKey = null;

function renderCaptions(t) {
  // spoken story lines (pre-drop)
  let ph = null;
  if (t < SIL) for (const p of capPhrases) if (t >= p.t0) ph = p;
  if (ph && ph.clip === 'nurse' && t > N0 + VO.nurse.dur + 0.4) ph = null;
  const key = ph ? ph.clip + ph.t0 : null;
  if (key !== capKey) { capKey = key; capEl.className = ph ? (ph.clip === 'nurse' ? 'nurse' : 'stella') : ''; capEl.innerHTML = ph ? ph.ws.map((w) => `<span class="w${w.hot ? ' hot' : ''}">${w.w.replace(/^4\.?$/, (m) => m.replace('4', 'Four'))}</span>`).join('') : ''; }
  if (ph) {
    const spans = capEl.children; const shake = ph.clip === 'nurse' ? 1 : 0;
    ph.ws.forEach((w, k) => { const lt = t - (CU.VO[ph.clip] + w.s); const s = spans[k]; if (!s) return;
      const p = clamp(lt / 0.14); const e = p < 1 ? 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2) : 1;
      const jit = shake ? Math.sin(t * 61 + k * 3) * 1.6 * (1 - p * 0.5) : 0;
      s.style.opacity = lt < 0 ? 0 : clamp(lt / 0.06); s.style.transform = `translate(${jit}px, ${(1 - clamp(lt / 0.14)) * 18}px) scale(${lt < 0 ? 0.6 : 0.6 + 0.4 * e})`;
      s.style.filter = `blur(${(1 - clamp(lt / 0.1)) * 6}px)`; });
  }
  // system lines (post-drop): typed per word with a prompt
  let sc = null; for (const c of sysClips) { const s = CU.VO[c]; if (t >= s - 0.05 && t < s + VO[c].dur + 0.9) sc = c; }
  if (sc !== sysKey) { sysKey = sc; sysEl.innerHTML = sc ? `<span class="pr">▍STELLA</span>` + VO[sc].words.map((w) => `<span class="w">${w.w.replace(/[.,]$/, '').toUpperCase().replace(/^4$/, 'FOUR')}</span>`).join('') : ''; }
  if (sc) VO[sc].words.forEach((w, k) => { const lt = t - (CU.VO[sc] + w.s); const s = sysEl.querySelectorAll('.w')[k]; if (!s) return;
    s.style.opacity = lt < 0 ? 0 : 1; s.style.transform = `translateY(${(1 - clamp(lt / 0.1)) * 14}px)`; s.style.textShadow = `0 0 ${24 + (1 - clamp(lt / 0.25)) * 40}px rgba(47,183,234,.95)`; });
}

/* ---------------- HUD per-frame ---------------- */
const LABELS = [[0, "ST. MARY'S GENERAL · WARD 4 · NIGHT"], [SC.stella[0], 'SOTI ONE · STELLA CONNECTED'], [SC.blackhole[0], 'SOTI ONE PLATFORM'], [SC.constellation[0], 'SOTI XSIGHT · LIVE VIEW'],
  [SC.diag[0], 'SOTI XSIGHT · DIAGNOSTICS'], [SC.remote[0], 'SOTI XSIGHT · REMOTE CONTROL'], [SC.road[0], 'SOTI MOBICONTROL · XTREME HUB · 10X'], [SC.flap[0], 'SOTI MOBICONTROL · FLEET STATUS'],
  [SC.lock[0], 'SOTI MOBICONTROL · LOCKDOWN'], [SC.ticket[0], 'SOTI XSIGHT · INCIDENT MANAGEMENT'], [SC.slabs[0], 'WHY SOTI'], [SC.ba[0], 'SOTI SNAP'], [SC.online[0], 'SOTI ONE PLATFORM · ALL CLEAR']];
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
function renderHUD(t) {
  const s = 7 * 60 + 12 + t; $('#clock').textContent = `03:${pad(s / 60)}:${pad(s % 60)}`;
  const slaStart = N0, frozen = t >= EV.stamp; const rem = Math.max(0, 300 - (Math.min(t, EV.stamp) - slaStart));
  const slaEl = $('#sla'); slaEl.textContent = t < slaStart ? '05:00.0' : `${pad(rem / 60)}:${pad(rem % 60)}.${Math.floor((rem * 10) % 10)}`;
  slaEl.classList.toggle('met', frozen);
  let lab = LABELS[0][1], labT = 0; for (const [tt, l] of LABELS) if (t >= tt) { lab = l; labT = tt; }
  const hl = $('#hudlabel'); const lt = t - labT; const n = Math.floor(clamp(lt / 0.25) * lab.length);
  const gl = '█▓▒░<>/#'; hl.textContent = lab.slice(0, n) + (n < lab.length ? gl[Math.floor(t * 60) % gl.length] : '');
  $('#hudstatus').textContent = t < P0 ? 'STELLA · STANDBY' : t < CU.D ? 'STELLA · LISTENING' : t < EV.stamp ? 'STELLA · RESOLVING P1' : 'STELLA · RESOLVED ✓';
  $('#livedot').style.opacity = Math.floor(t * 2) % 2 ? 0.25 : 1;
  $('#calltime').textContent = `00:${pad(Math.max(0, t - 0.45))}`;
}

/* ---------------- waveforms (from the real voice loudness envelopes) ---------------- */
const cw = $('#callwave').getContext('2d'), orb = $('#orb').getContext('2d');
const envAt = (clip, t) => { const e = VO[clip].env, i = Math.floor((t - CU.VO[clip]) * 60); return i >= 0 && i < e.length ? e[i] : 0; };
function renderWaves(t) {
  if (t < 11.6) { cw.clearRect(0, 0, 560, 90); const bars = 70;
    for (let i = 0; i < bars; i++) { const v = envAt('nurse', t - (bars - i) * 0.018); const h = 4 + v * 78 * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7)));
      cw.fillStyle = i > bars - 6 ? '#ffd5d9' : `rgba(255,${80 + i},${95 + i},${0.35 + i / bars * 0.65})`; cw.fillRect(i * 8, 45 - h / 2, 5, h); } }
  if (t > 11.3 && t < CU.D) { orb.clearRect(0, 0, 220, 220); const v = envAt('stella_promise', t);
    const g = orb.createRadialGradient(110, 110, 10, 110, 110, 100); g.addColorStop(0, 'rgba(220,245,255,.95)'); g.addColorStop(0.35, 'rgba(47,183,234,.8)'); g.addColorStop(1, 'rgba(0,154,212,0)');
    orb.fillStyle = g; orb.beginPath(); orb.arc(110, 110, 46 + v * 42, 0, Math.PI * 2); orb.fill();
    orb.strokeStyle = 'rgba(160,225,255,.8)'; orb.lineWidth = 2; orb.beginPath();
    for (let a = 0; a <= 64; a++) { const an = a / 64 * Math.PI * 2; const rr = 70 + v * 26 * Math.sin(an * 5 + t * 8) + 4 * Math.sin(an * 9 - t * 5); const x = 110 + Math.cos(an) * rr, y = 110 + Math.sin(an) * rr; a ? orb.lineTo(x, y) : orb.moveTo(x, y); }
    orb.stroke(); }
}

/* ---------------- diagnostics graph ---------------- */
const gctx = $('#graph').getContext('2d');
function renderGraph(t) {
  if (t < SC.diag[0] || t > SC.remote[0]) return; const p = ease.out(prog(t, SC.diag[0] + 0.15, SC.diag[0] + 1.6));
  gctx.clearRect(0, 0, 1040, 210); gctx.strokeStyle = 'rgba(160,225,255,.12)'; gctx.lineWidth = 1;
  for (let y = 30; y < 210; y += 45) { gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(1040, y); gctx.stroke(); }
  const R = rng(3); const pts = []; for (let i = 0; i <= 60; i++) { const x = i / 60 * 1040; const spike = i > 34 ? Math.min(1, (i - 34) / 3) : 0; pts.push([x, 190 - (8 + R() * 10) - spike * (130 + R() * 30)]); }
  const n = Math.floor(p * 60); gctx.lineWidth = 4; gctx.strokeStyle = '#2FB7EA'; gctx.beginPath();
  for (let i = 0; i <= n; i++) { const [x, y] = pts[i]; if (i > 34) gctx.strokeStyle = '#ff3d4f'; i ? gctx.lineTo(x, y) : gctx.moveTo(x, y); } gctx.stroke();
  if (n > 34) { const x = pts[35][0]; gctx.setLineDash([6, 8]); gctx.strokeStyle = 'rgba(255,61,79,.8)'; gctx.lineWidth = 2; gctx.beginPath(); gctx.moveTo(x, 20); gctx.lineTo(x, 200); gctx.stroke(); gctx.setLineDash([]);
    gctx.fillStyle = '#ff3d4f'; gctx.font = '600 18px JetBrains Mono'; gctx.fillText('02:58 · UPDATE 4.2.1 PUSHED', x + 14, 40); }
}

/* ---------------- split-flap per-frame ---------------- */
function renderFlap(t) {
  if (t < SC.flap[0] - 0.1 || t > SC.lock[0] + 0.1) return;
  let n = 0, last = -9; tileOn.forEach((tt, k) => { const on = t >= tt; if (on) { n++; last = tt; } tileEls[k].classList.toggle('on', on); });
  const d = [Math.floor(n / 10), n % 10]; const fp = clamp((t - last) / 0.07);
  [0, 1].forEach((i) => { numCells[i].querySelector('span').textContent = d[i]; const f = numCells[i].querySelector('.flip');
    const changes = i === 1 || n % 10 === 0; f.style.transform = `rotateX(${changes ? -90 * fp : -90}deg)`; f.style.opacity = changes && fp < 1 ? 1 : 0; });
  const target = t < EV.flap_full + 0.15 ? 'OFFLINE' : ' ONLINE'; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  wordCells.forEach((c, i) => { const ts = EV.flap_full + 0.15 + i * 0.035; let ch = target[i];
    if (t >= EV.flap_full + 0.15 && t < ts + 0.22) ch = chars[(Math.floor(t * 60) * 7 + i * 13) % 26];
    c.querySelector('span').textContent = ch; c.style.color = target === ' ONLINE' && t >= ts + 0.22 ? '#7AC142' : (target === 'OFFLINE' ? '#ff3d4f' : '#fff');
    c.querySelector('.flip').style.opacity = 0; });
}

/* ---------------- transitions & finishing (per-frame, deterministic) ---------------- */
const hits = CU.HITS;
const env = (t, h, k) => (t >= h ? Math.exp(-(t - h) * k) : 0);
function renderFX(t) {
  // 1-frame flashes on the big hits (+ a longer bloom-out on the drop)
  const flashHits = [CU.D, SC.flap[0], SC.end[0], EV.stamp, EV.logo];
  let fl = 0; for (const h of flashHits) if (t >= h && t < h + FRAME) fl = 1;
  fl = Math.max(fl, env(t, CU.D, 7) * 0.75, env(t, SC.road[1] - 0.02, 14) * 0.6 * (t < SC.road[1] + 0.3 ? 1 : 0));
  $('#flash').style.opacity = fl;
  // iris (close → open around a cut)
  const irisCuts = [SC.diag[0], SC.ticket[0], SC.online[0]];
  let r = 2000; for (const c of irisCuts) { if (t > c - 0.2 && t < c) r = Math.min(r, 1300 * ease.in(1 - (t - (c - 0.2)) / 0.2)); if (t >= c && t < c + 0.28) r = Math.min(r, 1300 * ease.out((t - c) / 0.28)); }
  const endIris = t > 59.45 ? 1300 * (1 - ease.in(prog(t, 59.45, 59.98))) : 2000; r = Math.min(r, endIris);
  const ir = $('#iris'); if (r < 1999) { ir.style.opacity = 1; ir.style.background = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 2}px)`; } else ir.style.opacity = 0;
  // flood: the ROLL BACK button floods the screen with SOTI blue, then drains away to reveal the road
  const fd = $('#flood'); const f0 = EV.click2 + 0.05;
  if (t >= f0 && t < SC.road[0]) fd.style.clipPath = `circle(${ease.in(prog(t, f0, SC.road[0])) * 120}% at 50.4% 51.5%)`;
  else if (t >= SC.road[0] && t < SC.road[0] + 0.3) fd.style.clipPath = `inset(0 0 0 ${ease.out(prog(t, SC.road[0], SC.road[0] + 0.3)) * 100}%)`;
  else fd.style.clipPath = 'circle(0% at 50% 50%)';
  // whip blur on cuts
  const whips = [SC.constellation[0], SC.flap[0], SC.slabs[0], SC.slabs[0] + 4 * B, SC.slabs[0] + 8 * B, SC.slabs[0] + 12 * B, SC.ba[0]];
  let wb = 0; for (const w of whips) wb = Math.max(wb, Math.exp(-Math.pow((t - w) / 0.06, 2)));
  const gl = $('#gl'); gl.style.filter = wb > 0.02 ? `blur(${wb * 10}px) brightness(${1 + wb * 0.5})` : 'none'; gl.style.transform = wb > 0.02 ? `scale(${1 + wb * 0.04}) translateX(${wb * 30}px)` : 'none';
  // chromatic aberration on the UI layer (hits)
  let ca = 0; for (const h of hits) ca = Math.max(ca, env(t, h, 10));
  $('#ui').style.filter = ca > 0.05 ? `drop-shadow(${-6 * ca}px 0 0 rgba(255,0,70,.55)) drop-shadow(${6 * ca}px 0 0 rgba(0,210,255,.55))` : 'none';
  // film grain: deterministic offset per frame
  const fr = Math.floor(t * 60); const gx = ((fr * 73) % 300) - 150, gy = ((fr * 151) % 300) - 150; $('#grain').style.transform = `translate(${gx * 0.3}px, ${gy * 0.3}px)`;
  return ca;
}

/* ---------------- Three.js ---------------- */
let ready = false, renderer, composer, renderPass, bloom, fx, S = {};
const finalShader = {
  uniforms: { tDiffuse: { value: null }, uCA: { value: 0 }, uFrame: { value: 0 }, uGrain: { value: 0.06 }, uDim: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA,uFrame,uGrain,uDim; varying vec2 vUv;
    float rnd(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.618)*43758.5453); }
    void main(){ vec2 c=vUv-.5; float d=dot(c,c); vec2 o=c*d*uCA;
      vec3 col=vec3(texture2D(tDiffuse,vUv+o).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-o).b);
      col*=uDim*(1.-d*.9); col+=(rnd(vUv*vec2(1920.,1080.))-.5)*uGrain; gl_FragColor=vec4(col,1.); }`,
};
const CLAIMS = [
  [{ text: '1 IT PERSON.', size: 190, y: 380, weight: 900 }, { text: '100,000 DEVICES.', size: 190, y: 600, weight: 900, color: '#8fdcff', glow: 'rgba(47,183,234,.45)', blur: 18 },
    { text: '“…allows a single IT person to manage over 100,000 Android devices.” — Delivery Hero', size: 46, y: 850, weight: 400, color: '#bfe6ff' }],
  [{ text: '10X', size: 430, y: 450, weight: 900, color: '#7fd6ff', glow: '#2FB7EA', blur: 50 }, { text: 'FASTER DATA DELIVERY', size: 120, y: 760, weight: 700 },
    { text: 'SOTI XTreme Technology · SOTI MobiControl', size: 46, y: 920, weight: 400, color: '#bfe6ff' }],
  [{ text: 'LIVE VIEW.', size: 220, y: 400, weight: 900, color: '#8fdcff', glow: 'rgba(47,183,234,.45)', blur: 18 }, { text: 'THE FIRST OF ITS KIND.', size: 130, y: 640, weight: 700 },
    { text: 'SOTI XSight Live View · patent pending', size: 46, y: 860, weight: 400, color: '#bfe6ff' }],
  [{ text: 'BEYOND MDM.', size: 200, y: 400, weight: 900 }, { text: 'BEYOND EMM.', size: 200, y: 640, weight: 900, color: '#8fdcff', glow: 'rgba(47,183,234,.45)', blur: 18 },
    { text: 'The SOTI ONE Platform — one platform for every business-critical device', size: 44, y: 880, weight: 400, color: '#bfe6ff' }],
];

async function init() {
  await Promise.all(['300', '400', '500', '700', '900'].map((w) => document.fonts.load(`${w} 40px Rubik`)).concat([document.fonts.load('400 20px "JetBrains Mono"'), document.fonts.load('600 20px "JetBrains Mono"')]));
  const logo = await fetch('assets/soti-logo.svg').then((r) => r.text()).catch(() => '');
  $('#logo-svg').innerHTML = logo.replace(/<title>.*?<\/title>/, '');
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  S = { hospital: makeHospital(), blackhole: makeBlackHole(), constellation: makeConstellation(), road: makeRoad(), slabs: makeSlabs(CLAIMS) };
  composer = new EffectComposer(renderer); renderPass = new RenderPass(S.hospital.scene, S.hospital.cam); composer.addPass(renderPass);
  bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), 1.2, 0.55, 0.12); composer.addPass(bloom);
  fx = new ShaderPass(finalShader); composer.addPass(fx); composer.addPass(new OutputPass());
  // warm up every scene once so shader compilation does not happen mid-render
  for (const k in S) { S[k].update(0, ''); renderer.compile(S[k].scene, S[k].cam); }
  ready = true; frame(clockObj.t); window.__resolveBuild && window.__resolveBuild();
}

function pick(t) {
  if (t < SIL) return [S.hospital, 'call'];
  if (t < CU.D) return [null, 'silence'];
  if (t < SC.constellation[0]) return [S.blackhole, 'drop'];
  if (t < SC.diag[0]) return [S.constellation, 'fly'];
  if (t < SC.road[0]) return [S.constellation, 'bg'];
  if (t < SC.flap[0]) return [S.road, ''];
  if (t < SC.ticket[0]) return [S.constellation, 'flap'];
  if (t < SC.slabs[0]) return [S.blackhole, 'ticket'];
  if (t < SC.ba[0]) return [S.slabs, ''];
  if (t < SC.online[0]) return [S.slabs, 'ba'];
  if (t < SC.end[0]) return [S.hospital, 'online'];
  return [S.blackhole, 'end'];
}

function frame(t) {
  renderCaptions(t); renderHUD(t); renderWaves(t); renderGraph(t); renderFlap(t);
  const caUI = renderFX(t);
  if (!ready) return;
  const [sc, mode] = pick(t);
  if (!sc) { renderer.setClearColor(0x000000, 1); renderer.clear(); return; }
  sc.update(t, mode);
  renderPass.scene = sc.scene; renderPass.camera = sc.cam;
  // beat pulse on bloom after the drop
  const beatPh = t >= CU.D ? ((t - CU.D) % B) / B : 1; const kick = t >= CU.D && t < SC.end[0] ? Math.exp(-beatPh * 7) : 0;
  bloom.strength = sc.bloom * (1 + kick * 0.25) * (mode === 'call' ? 0.9 : 1);
  bloom.threshold = sc.threshold ?? 0.1;
  let ca = 0.06 + kick * 0.12; for (const h of hits) ca += env(t, h, 9) * 1.4;
  fx.uniforms.uCA.value = ca * 0.05; fx.uniforms.uFrame.value = Math.floor(t * 60) % 977;
  fx.uniforms.uDim.value = mode === 'call' ? clamp(t / 0.6) : 1;
  composer.render();
}

init();

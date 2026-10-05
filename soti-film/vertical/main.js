// SOTI — "Ward Four" (9:16, Apple-style motion). Master timeline seeks `tl` (DOM) and renders Three.js for the same instant.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeHospital, makeBlackHole, makeConstellation, makeRoad, makeSlabs, makeLogo, clamp, prog, ease, rng } from './scenes.js';

const CU = window.CUES, VO = window.VO, SC = CU.SCENES, EV = CU.EVENTS, B = CU.B;
const W = 1080, H = 1920, ASPECT = W / H;
const $ = (s) => document.querySelector(s);
const FRAME = 1 / CU.FPS;
const EASE = 'expo.out', SPRING = 'back.out(1.4)';
const LOGO_START = EV.logo - 0.42;    // particles begin to gather while the end type exits

/* ---------------- timelines ---------------- */
const OFF = window.T_OFFSET || 0, RDUR = window.T_DUR || CU.DUR;
const tl = gsap.timeline({ paused: true });
const clockObj = { t: 0 };
const master = gsap.timeline({ paused: true });
master.to(clockObj, { t: RDUR, duration: RDUR, ease: 'none', onUpdate: () => { const T = clockObj.t + OFF; tl.seek(T, false); frame(T); } }, 0);
window.__timelines = window.__timelines || {};
window.__timelines['main'] = master;
const at = (sel, time, vars) => tl.to(sel, { ...vars }, time);
const fromTo = (sel, time, a, b) => tl.fromTo(sel, a, b, time);
const set = (sel, time, vars) => tl.set(sel, vars, time);
// Apple-style entrance: rise + de-blur + settle
const rise = (sel, time, dur = 0.7, extra = {}) => fromTo(sel, time, { opacity: 0, y: 40, scale: 0.96, filter: 'blur(14px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: dur, ease: EASE, ...extra });
const sink = (sel, time, dur = 0.25) => at(sel, time, { opacity: 0, y: -24, scale: 0.98, filter: 'blur(10px)', duration: dur, ease: 'power3.in' });

/* ---------------- chips ---------------- */
const chipsEl = $('#chips');
function chip(text, cls, x, y, tIn, tOut) {
  const el = document.createElement('div'); el.className = `chip glass ${cls}`; el.innerHTML = `<i></i><span>${text}</span>`;
  el.style.left = x + 'px'; el.style.top = y + 'px'; chipsEl.appendChild(el);
  fromTo(el, tIn, { opacity: 0, scale: 0.6, xPercent: -50, yPercent: -50, filter: 'blur(12px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(2)' });
  at(el, tOut, { opacity: 0, scale: 0.85, filter: 'blur(8px)', duration: 0.18, ease: 'power2.in' });
}
const wordTime = (clip, idx) => CU.VO[clip] + VO[clip].words[idx].s;
const N0 = CU.VO.nurse, P0 = CU.VO.stella_promise, SIL = CU.SILENCE[0];
const ROW1 = 640, ROW2 = 736, LX = 300, RX = 780;
chip('40 scanners down', 'red', LX, ROW1, wordTime('nurse', 8), 11.2);
chip('Meds blocked', 'red', RX, ROW1, wordTime('nurse', 13), 11.2);
chip('Patients waiting', 'red', LX, ROW2, wordTime('nurse', 17), 11.2);
chip('IT on-site · 47 min', 'red', RX, ROW2, wordTime('nurse', 23), 11.2);
chip('Call connected', 'blue', LX, ROW1, wordTime('stella_promise', 1), SIL);
chip('40 devices visible', 'blue', RX, ROW1, wordTime('stella_promise', 8), SIL);
chip('Ward 4 · Floor 3', 'blue', LX, ROW2, wordTime('stella_promise', 10), SIL);
chip('Patient safety · P1', 'blue', RX, ROW2, wordTime('stella_promise', 15), SIL);
chip('Stella is on it', 'blue', 540, 832, wordTime('stella_promise', 17), SIL);
chip('40 / 40 online', 'blue', LX, 1210, SC.online[0] + 0.25, SC.online[1] - 0.05);
chip('SLA met', 'blue', RX, 1210, SC.online[0] + 0.45, SC.online[1] - 0.05);

/* ---------------- HUD / call / Stella ---------------- */
fromTo('#hud', 0.3, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
set('#hud', SIL, { opacity: 0 }); set('#hud', CU.D, { opacity: 1 }); at('#hud', SC.end[0] - 0.15, { opacity: 0, duration: 0.2 });
fromTo('#call', 0.4, { opacity: 0, y: -60, scale: 0.86, filter: 'blur(16px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: SPRING });
// morph: call card → Stella card (shape tween, then content swap)
at('#call', 11.15, { width: 780, left: 150, borderRadius: 60, opacity: 0, filter: 'blur(10px)', duration: 0.38, ease: 'power3.inOut' });
fromTo('#stella', 11.38, { opacity: 0, scale: 0.9, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: SPRING });
set('#stella', SIL, { opacity: 0 });
fromTo('#lightleak', 11.4, { opacity: 0 }, { opacity: 0.8, duration: 1.2 }); set('#lightleak', SIL, { opacity: 0 });

/* ---------------- reticle ---------------- */
const s1 = CU.VO.s1;
fromTo('#reticle', s1 - 0.18, { opacity: 0, scale: 2.2, rotation: -45 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: EASE });
rise('#reticle .r-label', s1 + 0.25, 0.5);
set('#reticle', SC.diag[0], { opacity: 0 });

/* ---------------- diagnostics ---------------- */
rise('#diag', SC.diag[0], 0.55);
fromTo('#diag .metric', SC.diag[0] + 0.08, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: EASE });
fromTo('#diag .row', SC.diag[0] + 0.5, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: EASE });
fromTo('#diag .sheen', SC.diag[0] + 0.15, { left: -300 }, { left: 1100, duration: 1.1, ease: 'power2.inOut' });
fromTo('#rootcause', CU.VO.s2 + 0.75, { opacity: 0, scale: 1.25, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'back.out(2.4)' });
at('#diag > *', SC.remote[0] - 0.24, { opacity: 0, duration: 0.1 });
at('#diag', SC.remote[0] - 0.22, { width: 620, height: 140, left: 230, top: 790, borderRadius: 70, duration: 0.24, ease: 'expo.in' });
set('#diag', SC.remote[0], { opacity: 0 });

/* ---------------- remote control ---------------- */
set('#remote', SC.remote[0], { opacity: 1 });
const c1 = EV.click1, c2 = EV.click2;
fromTo('#cursor', SC.remote[0] + 0.05, { opacity: 0, x: 900, y: 1480 }, { opacity: 1, x: 560, y: 872, duration: c1 - SC.remote[0] - 0.12, ease: 'power3.out' });
at('#cursor', c1, { scale: 0.84, duration: 0.06 }); at('#cursor', c1 + 0.07, { scale: 1, duration: 0.14, ease: SPRING });
fromTo('#ripple', c1, { width: 0, height: 0, marginLeft: 0, marginTop: 0, opacity: 1 }, { width: 420, height: 420, marginLeft: -210, marginTop: -210, opacity: 0, duration: 0.6, ease: 'power2.out' });
at('#rbtn .rb-txt', c1 + 0.03, { opacity: 0, scale: 0.9, duration: 0.1 });
at('#rbtn', c1 + 0.05, { width: 560, height: 1000, marginLeft: -280, marginTop: -500, borderRadius: 76, duration: 0.5, ease: 'expo.inOut' });
fromTo('#dscreen', c1 + 0.32, { opacity: 0 }, { opacity: 1, duration: 0.2 });
at('#cursor', c1 + 0.12, { x: 860, y: 1200, duration: 0.5, ease: 'power2.inOut' });
fromTo('#ds-live', CU.VO.s3 + 0.1, { opacity: 0 }, { opacity: 1, duration: 0.15 });
at('#dscreen', CU.VO.s3 + 0.1, { boxShadow: 'inset 0 0 0 2px rgba(47,183,234,.9)', duration: 0.3 });
at('#ds-err', c2 - 0.75, { opacity: 0, y: -24, filter: 'blur(8px)', duration: 0.22 });
fromTo('#ds-fix', c2 - 0.6, { opacity: 0, y: 40, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: EASE });
at('#cursor', c2 - 0.5, { x: 552, y: 902, duration: 0.42, ease: 'power3.inOut' });
at('#cursor', c2, { scale: 0.84, duration: 0.06 }); at('#cursor', c2 + 0.07, { scale: 1, duration: 0.12 });
at('#rollbtn', c2, { scale: 0.95, duration: 0.06 }); at('#rollbtn', c2 + 0.06, { scale: 1.04, boxShadow: '0 0 120px rgba(47,183,234,1)', duration: 0.14 });
set('#remote', SC.road[0], { opacity: 0 }); set('#cursor', SC.road[0], { opacity: 0 });

/* ---------------- split-flap ---------------- */
const flapNum = $('#flapnum'), flapWord = $('#flapword'), tiles = $('#tiles');
const mkCell = (row, cls = '') => { const c = document.createElement('div'); c.className = 'fc ' + cls; c.innerHTML = '<span></span>'; row.appendChild(c); return c; };
const numCells = [mkCell(flapNum), mkCell(flapNum), mkCell(flapNum, 'slash'), mkCell(flapNum), mkCell(flapNum)];
numCells[2].querySelector('span').textContent = '/'; numCells[3].querySelector('span').textContent = '4'; numCells[4].querySelector('span').textContent = '0';
const wordCells = Array.from({ length: 7 }, () => mkCell(flapWord));
const tileEls = Array.from({ length: 40 }, () => { const d = document.createElement('div'); d.className = 'tile'; tiles.appendChild(d); return d; });
const tileOn = Array.from({ length: 40 }, (_, k) => EV.flap_start + (EV.flap_full - EV.flap_start) * Math.pow((k + 1) / 40, 0.8));
set('#flap', SC.flap[0], { opacity: 1 });
fromTo('#flapnum .fc', SC.flap[0], { opacity: 0, y: 60, rotationX: -70 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.55, stagger: 0.04, ease: EASE });
fromTo('#flapword .fc', SC.flap[0] + 0.12, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.03, ease: EASE });
fromTo('#tiles .tile', SC.flap[0] + 0.1, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.4, stagger: { each: 0.008, from: 'center' }, ease: SPRING });
at('#flapnum, #flapword', SC.lock[0] - 0.2, { opacity: 0, scale: 0.8, filter: 'blur(10px)', duration: 0.18 });
at('#tiles', SC.lock[0] - 0.22, { scale: 0.25, y: -320, opacity: 0, duration: 0.24, ease: 'expo.in' });
set('#flap', SC.lock[0], { opacity: 0 });

/* ---------------- lockdown ---------------- */
set('#lock', SC.lock[0], { opacity: 1 });
fromTo('#lockdev', SC.lock[0], { scale: 0.3, opacity: 0, filter: 'blur(16px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'back.out(1.6)' });
fromTo('#shackle', SC.lock[0], { y: -20 }, { y: -20, duration: 0.01 });
at('#shackle', EV.lockshut, { y: 0, duration: 0.08, ease: 'power4.in' });
at('#lockdev', EV.lockshut + 0.08, { scale: 1.05, duration: 0.06 }); at('#lockdev', EV.lockshut + 0.14, { scale: 1, duration: 0.3, ease: SPRING });
set('#lock', SC.ticket[0], { opacity: 0 });

/* ---------------- ticket ---------------- */
rise('#ticket', SC.ticket[0], 0.6);
fromTo('#ticket .t-row', SC.ticket[0] + 0.18, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: EASE });
fromTo('#stamp', EV.stamp, { opacity: 0, scale: 2.4, rotation: -2 }, { opacity: 1, scale: 1, rotation: -10, duration: 0.11, ease: 'power4.in' });
at('#ticket', EV.stamp + 0.11, { y: 10, duration: 0.04 }); at('#ticket', EV.stamp + 0.15, { y: 0, duration: 0.3, ease: SPRING });
sink('#ticket', SC.slabs[0] - 0.18, 0.15);

/* ---------------- before / after ---------------- */
fromTo('#ba', SC.ba[0], { opacity: 0, scale: 0.88, rotationY: -14, filter: 'blur(14px)' }, { opacity: 1, scale: 1, rotationY: 0, filter: 'blur(0px)', duration: 0.5, ease: EASE });
const baP = { x: 0 };
fromTo(baP, SC.ba[0] + 0.35, { x: 0 }, { x: 100, duration: 1.05, ease: 'power3.inOut', onUpdate: () => {
  $('#ba-after').style.clipPath = `inset(0 ${100 - baP.x}% 0 0)`; $('#ba-handle').style.left = `${baP.x}%`; } });
set('#ba', SC.online[0], { opacity: 0 });

/* ---------------- end type: masked rise, word-synced to the beat ---------------- */
const lineRise = (sel, time) => fromTo(sel, time, { opacity: 1, yPercent: 105, filter: 'blur(6px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.42, ease: 'expo.out' });
lineRise('.et.w1', EV.end_w1); lineRise('.et.w2', EV.end_w2); lineRise('.et.w3', EV.end_w3);
fromTo('.et.w3', EV.end_w3 + 0.1, { backgroundPosition: '0 0' }, { backgroundPosition: '0 0', duration: 0.01 });
at('.et', LOGO_START - 0.12, { yPercent: -105, filter: 'blur(8px)', duration: 0.26, ease: 'expo.in', stagger: 0.03 });
set('.et', LOGO_START + 0.2, { opacity: 0 });

/* ---------------- end lockup ---------------- */
set('#endlogo', LOGO_START, { opacity: 1 });
fromTo('#logo-svg', EV.logo + 0.38, { opacity: 0, filter: 'blur(14px)', scale: 1.03 }, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.5, ease: EASE });
fromTo('#logo-sheen', EV.logo + 0.62, { backgroundPosition: '120% 0' }, { backgroundPosition: '-40% 0', duration: 1.0, ease: 'power2.inOut' });
fromTo('#lock-line', EV.tagline, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.out' });
fromTo('#tag-eyebrow span', EV.tagline + 0.05, { opacity: 0, letterSpacing: '0.7em', filter: 'blur(8px)' }, { opacity: 1, letterSpacing: '0.32em', filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' });
const TAG = ['Connecting', 'Everything.'];
$('#tagline').innerHTML = TAG.map((l) => `<span class="ln"><span>${l}</span></span>`).join('');
fromTo('#tagline .ln span', EV.tagline + 0.18, { yPercent: 110, filter: 'blur(6px)' }, { yPercent: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.14, ease: 'expo.out' });
fromTo('#url', EV.tagline + 0.75, { opacity: 0, y: 24, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: SPRING });

/* ---------------- captions: keynote karaoke from real word timestamps ---------------- */
function phrases(clip, hot) {
  const Wd = VO[clip].words, out = []; let cur = [];
  Wd.forEach((w, i) => { cur.push({ ...w, i, hot: hot.includes(i) }); if (/[.!?]$/.test(w.w) || i === Wd.length - 1) { out.push(cur); cur = []; } });
  return out.map((ws) => ({ clip, ws, t0: CU.VO[clip] + ws[0].s - 0.12 }));
}
const capPhrases = [...phrases('nurse', [8, 13, 16, 17, 25]), ...phrases('stella_promise', [10, 11, 15, 17, 18])];
const sysClips = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
const capEl = $('#caption'), sysEl = $('#sysline'), sysT = $('#sys-t'); let capKey = null, sysKey = null;
const pretty = (w) => w.replace(/^4\.?$/, (m) => m.replace('4', 'Four'));

function renderCaptions(t) {
  let ph = null;
  if (t < SIL) for (const p of capPhrases) if (t >= p.t0) ph = p;
  if (ph && ph.clip === 'nurse' && t > N0 + VO.nurse.dur + 0.4) ph = null;
  const key = ph ? ph.clip + ph.t0 : null;
  if (key !== capKey) { capKey = key; capEl.className = ph ? (ph.clip === 'nurse' ? 'nurse' : 'stella') : '';
    capEl.innerHTML = ph ? ph.ws.map((w) => `<span class="w${w.hot ? ' hot' : ''}">${pretty(w.w)}</span>`).join(' ') : ''; }
  if (ph) {
    const spans = capEl.children; const nervous = ph.clip === 'nurse';
    ph.ws.forEach((w, k) => { const s = spans[k]; if (!s) return;
      const enter = clamp((t - ph.t0 - k * 0.025) / 0.35); const e = ease.expoOut(enter);
      const lt = t - (CU.VO[ph.clip] + w.s); const lit = clamp(lt / 0.12);
      const jit = nervous && lit > 0 ? Math.sin(t * 57 + k * 2.3) * 1.2 * (1 - clamp(lt / 0.5)) : 0;
      s.style.opacity = (0.2 + 0.8 * lit) * e;
      s.style.transform = `translate(${jit}px, ${(1 - e) * 26 - lit * 0}px) scale(${0.985 + 0.015 * lit})`;
      s.style.filter = `blur(${(1 - e) * 8}px)`; s.classList.toggle('lit', lit > 0.5); });
  }
  // post-drop system lines: label + masked word rise
  let sc = null; for (const c of sysClips) { const s = CU.VO[c]; if (t >= s - 0.08 && t < s + VO[c].dur + 0.85) sc = c; }
  if (t >= SC.end[0] - FRAME) sc = null;
  if (sc !== sysKey) { sysKey = sc; sysT.innerHTML = sc ? VO[sc].words.map((w, i) => { let x = w.w.replace(/[.,]$/, '').replace(/^4$/, 'Four'); if (i === 0) x = x[0].toUpperCase() + x.slice(1); if (i === VO[sc].words.length - 1) x += '.'; return `<span class="m"><span class="w">${x}</span></span>`; }).join(' ') : ''; }
  if (sc) { const s0 = CU.VO[sc], end = s0 + VO[sc].dur + 0.85; const inP = ease.expoOut(clamp((t - s0 + 0.08) / 0.35)), outP = clamp((t - (end - 0.2)) / 0.2);
    sysEl.style.opacity = inP * (1 - outP); sysEl.style.transform = `translateY(${(1 - inP) * 20 - outP * 14}px)`;
    sysT.querySelectorAll('.w').forEach((s, k) => { const lt = t - (s0 + VO[sc].words[k].s); const p = ease.expoOut(clamp(lt / 0.32));
      s.style.transform = `translateY(${(1 - p) * 105}%)`; s.style.opacity = lt < -0.02 ? 0 : 1; }); }
  else sysEl.style.opacity = 0;
}

/* ---------------- eyebrow + HUD ---------------- */
const LABELS = [[SC.blackhole[0], 'SOTI ONE Platform'], [SC.constellation[0], 'SOTI XSight · Live View'], [SC.diag[0], 'SOTI XSight · Diagnostics'],
  [SC.remote[0], 'SOTI XSight · Remote Control'], [SC.road[0], 'SOTI MobiControl · XTreme Hub'], [SC.flap[0], 'SOTI MobiControl'],
  [SC.lock[0], 'SOTI MobiControl · Lockdown'], [SC.ticket[0], 'SOTI XSight · Incident Management'], [SC.slabs[0], 'Why SOTI'], [SC.ba[0], 'SOTI Snap'], [SC.online[0], 'SOTI ONE Platform']];
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
const ebEl = $('#eyebrow'), ebT = $('#eb-text');
function renderHUD(t) {
  const s = 7 * 60 + 12 + t; $('#clock').textContent = `03:${pad(s / 60)}:${pad(s % 60)}`;
  const frozen = t >= EV.stamp; const rem = Math.max(0, 300 - (Math.min(t, EV.stamp) - N0));
  const slaEl = $('#sla'); slaEl.textContent = t < N0 ? '5:00.0' : `${Math.floor(rem / 60)}:${pad(rem % 60)}.${Math.floor((rem * 10) % 10)}`; slaEl.classList.toggle('met', frozen);
  $('#livedot').style.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2));
  $('#calltime').textContent = `0:${pad(Math.max(0, t - 0.4))}`;
  let lab = null, labT = 0, nextT = 99; for (let i = 0; i < LABELS.length; i++) if (t >= LABELS[i][0]) { lab = LABELS[i][1]; labT = LABELS[i][0]; nextT = LABELS[i + 1] ? LABELS[i + 1][0] : SC.end[0]; }
  if (!lab || t >= SC.end[0]) { ebEl.style.opacity = 0; return; }
  if (ebT.textContent !== lab) ebT.textContent = lab;
  const pin = ease.expoOut(clamp((t - labT) / 0.45)), pout = clamp((t - (nextT - 0.12)) / 0.12);
  ebEl.style.opacity = pin * (1 - pout); ebEl.style.transform = `translateY(${(1 - pin) * 16}px)`; ebEl.style.filter = `blur(${(1 - pin) * 8 + pout * 6}px)`;
}

/* ---------------- waveforms ---------------- */
const cw = $('#callwave').getContext('2d'), orb = $('#orb').getContext('2d');
const envAt = (clip, t) => { const e = VO[clip].env, i = Math.floor((t - CU.VO[clip]) * 60); return i >= 0 && i < e.length ? e[i] : 0; };
function renderWaves(t) {
  if (t < 11.6) { cw.clearRect(0, 0, 760, 110); const bars = 56;
    for (let i = 0; i < bars; i++) { const v = envAt('nurse', t - (bars - i) * 0.02); const h = 6 + v * 92 * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7)));
      const g = cw.createLinearGradient(0, 55 - h / 2, 0, 55 + h / 2); g.addColorStop(0, '#ffd2cd'); g.addColorStop(1, '#ff453a');
      cw.globalAlpha = 0.3 + 0.7 * (i / bars); cw.fillStyle = g; const x = i * 13.6, r = 3.5;
      cw.beginPath(); cw.roundRect(x, 55 - h / 2, 7, h, r); cw.fill(); } cw.globalAlpha = 1; }
  if (t > 11.2 && t < CU.D) { orb.clearRect(0, 0, 260, 260); const v = envAt('stella_promise', t);
    for (let k = 3; k >= 0; k--) { const g = orb.createRadialGradient(130, 130, 4, 130, 130, 110);
      g.addColorStop(0, 'rgba(235,250,255,.95)'); g.addColorStop(0.35, `rgba(47,183,234,${0.5 - k * 0.1})`); g.addColorStop(1, 'rgba(0,154,212,0)');
      orb.fillStyle = g; orb.beginPath();
      for (let a = 0; a <= 72; a++) { const an = a / 72 * Math.PI * 2; const rr = 52 + k * 10 + v * (26 + k * 8) * (0.6 + 0.4 * Math.sin(an * (3 + k) + t * (4 + k))); const x = 130 + Math.cos(an) * rr, y = 130 + Math.sin(an) * rr; a ? orb.lineTo(x, y) : orb.moveTo(x, y); }
      orb.closePath(); orb.fill(); } }
}

/* ---------------- diagnostics graph ---------------- */
const gctx = $('#graph').getContext('2d');
function renderGraph(t) {
  if (t < SC.diag[0] || t > SC.remote[0]) return; const p = ease.out(prog(t, SC.diag[0] + 0.15, SC.diag[0] + 1.6));
  gctx.clearRect(0, 0, 860, 260);
  const R = rng(3); const pts = []; for (let i = 0; i <= 60; i++) { const x = i / 60 * 860; const spike = i > 34 ? Math.min(1, (i - 34) / 3) : 0; pts.push([x, 236 - (10 + R() * 12) - spike * (160 + R() * 30)]); }
  const n = Math.floor(p * 60);
  const area = gctx.createLinearGradient(0, 30, 0, 250); area.addColorStop(0, 'rgba(255,69,58,.35)'); area.addColorStop(1, 'rgba(255,69,58,0)');
  if (n > 1) { gctx.beginPath(); gctx.moveTo(pts[0][0], 250); for (let i = 0; i <= n; i++) gctx.lineTo(pts[i][0], pts[i][1]); gctx.lineTo(pts[n][0], 250); gctx.closePath(); gctx.fillStyle = area; gctx.fill(); }
  gctx.lineWidth = 5; gctx.lineJoin = 'round'; gctx.lineCap = 'round';
  for (let i = 1; i <= n; i++) { gctx.strokeStyle = i > 34 ? '#ff6b61' : '#5cc8f2'; gctx.beginPath(); gctx.moveTo(...pts[i - 1]); gctx.lineTo(...pts[i]); gctx.stroke(); }
  if (n > 36) { const x = pts[35][0]; gctx.fillStyle = '#ff6b61'; gctx.beginPath(); gctx.arc(x, pts[35][1], 9, 0, Math.PI * 2); gctx.fill();
    gctx.font = '600 24px Inter'; gctx.fillText('02:58 · update pushed', Math.min(x + 18, 600), 40); }
}

/* ---------------- split-flap per-frame ---------------- */
function renderFlap(t) {
  if (t < SC.flap[0] - 0.1 || t > SC.lock[0] + 0.1) return;
  let n = 0, last = -9; tileOn.forEach((tt, k) => { const on = t >= tt; if (on) { n++; last = tt; } tileEls[k].classList.toggle('on', on); });
  const d = [Math.floor(n / 10), n % 10]; const fp = clamp((t - last) / 0.08);
  [0, 1].forEach((i) => { const sp = numCells[i].querySelector('span'); sp.textContent = d[i];
    const changes = i === 1 || n % 10 === 0; const sq = changes && fp < 1 ? Math.abs(1 - 2 * fp) * 0.85 + 0.15 : 1;
    sp.style.display = 'inline-block'; sp.style.transform = `scaleY(${sq})`; });
  const target = t < EV.flap_full + 0.15 ? 'OFFLINE' : ' ONLINE'; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  wordCells.forEach((c, i) => { const ts = EV.flap_full + 0.15 + i * 0.035; let ch = target[i];
    if (t >= EV.flap_full + 0.15 && t < ts + 0.22) ch = chars[(Math.floor(t * 60) * 7 + i * 13) % 26];
    c.querySelector('span').textContent = ch; c.style.color = target === ' ONLINE' && t >= ts + 0.22 ? '#a6e07a' : (target === 'OFFLINE' ? '#ff6b61' : '#fff'); });
}

/* ---------------- transitions & finishing ---------------- */
const hits = CU.HITS;
const env = (t, h, k) => (t >= h ? Math.exp(-(t - h) * k) : 0);
const FLOOD_AT = [50, 47.6];  // % — centre of the ROLL BACK button
function renderFX(t) {
  const flashHits = [CU.D, SC.flap[0], SC.end[0], EV.stamp];
  let fl = 0; for (const h of flashHits) if (t >= h && t < h + FRAME) fl = 1;
  fl = Math.max(fl, env(t, CU.D, 7) * 0.7, env(t, SC.road[1] - 0.02, 14) * 0.55 * (t < SC.road[1] + 0.3 ? 1 : 0), env(t, EV.logo + 0.3, 9) * 0.18 * (t < EV.logo + 0.9 ? 1 : 0));
  $('#flash').style.opacity = fl;
  const irisCuts = [SC.diag[0], SC.ticket[0], SC.online[0]];
  let r = 2400; for (const c of irisCuts) { if (t > c - 0.2 && t < c) r = Math.min(r, 1150 * ease.in(1 - (t - (c - 0.2)) / 0.2)); if (t >= c && t < c + 0.3) r = Math.min(r, 1150 * ease.out((t - c) / 0.3)); }
  if (t > 59.45) r = Math.min(r, 1150 * (1 - ease.in(prog(t, 59.45, 59.98))));
  const ir = $('#iris'); if (r < 2399) { ir.style.opacity = 1; ir.style.background = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 2}px)`; } else ir.style.opacity = 0;
  const fd = $('#flood'); const f0 = EV.click2 + 0.05;
  if (t >= f0 && t < SC.road[0]) fd.style.clipPath = `circle(${ease.in(prog(t, f0, SC.road[0])) * 120}% at ${FLOOD_AT[0]}% ${FLOOD_AT[1]}%)`;
  else if (t >= SC.road[0] && t < SC.road[0] + 0.32) fd.style.clipPath = `inset(${ease.out(prog(t, SC.road[0], SC.road[0] + 0.32)) * 100}% 0 0 0)`;
  else fd.style.clipPath = 'circle(0% at 50% 50%)';
  const whips = [SC.constellation[0], SC.flap[0], SC.slabs[0], SC.slabs[0] + 4 * B, SC.slabs[0] + 8 * B, SC.slabs[0] + 12 * B, SC.ba[0]];
  let wb = 0; for (const w of whips) wb = Math.max(wb, Math.exp(-Math.pow((t - w) / 0.06, 2)));
  const gl = $('#gl'); gl.style.filter = wb > 0.02 ? `blur(${wb * 10}px) brightness(${1 + wb * 0.5})` : 'none'; gl.style.transform = wb > 0.02 ? `scale(${1 + wb * 0.05}) translateY(${-wb * 40}px)` : 'none';
  let ca = 0; for (const h of hits) ca = Math.max(ca, env(t, h, 10));
  $('#ui').style.filter = ca > 0.05 ? `drop-shadow(${-5 * ca}px 0 0 rgba(255,0,70,.5)) drop-shadow(${5 * ca}px 0 0 rgba(0,210,255,.5))` : 'none';
  const fr = Math.floor(t * 60); $('#grain').style.transform = `translate(${(((fr * 73) % 300) - 150) * 0.3}px, ${(((fr * 151) % 300) - 150) * 0.3}px)`;
}

/* ---------------- Three.js ---------------- */
let ready = false, renderer, composer, renderPass, bloom, fx, S = {};
const finalShader = {
  uniforms: { tDiffuse: { value: null }, uCA: { value: 0 }, uFrame: { value: 0 }, uGrain: { value: 0.05 }, uDim: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA,uFrame,uGrain,uDim; varying vec2 vUv;
    float rnd(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233))+uFrame*.618)*43758.5453); }
    void main(){ vec2 c=vUv-.5; float d=dot(c,c); vec2 o=c*d*uCA;
      vec3 col=vec3(texture2D(tDiffuse,vUv+o).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-o).b);
      col*=uDim*(1.-d*.8); col+=(rnd(vUv*vec2(1080.,1920.))-.5)*uGrain; gl_FragColor=vec4(col,1.); }`,
};
const CLAIMS = [
  [{ text: '1 IT person.', size: 150, y: 560, weight: 800, font: 'Inter Tight', spacing: -6 }, { text: '100,000', size: 230, y: 790, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -10 },
    { text: 'devices.', size: 150, y: 990, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -6 },
    { text: '“…a single IT person to manage over', size: 46, y: 1260, weight: 400, font: 'Inter', color: '#cfe9f7' }, { text: '100,000 Android devices.” — Delivery Hero', size: 46, y: 1322, weight: 400, font: 'Inter', color: '#cfe9f7' }],
  [{ text: '10x', size: 520, y: 760, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -26 }, { text: 'faster data', size: 140, y: 1120, weight: 700, font: 'Inter Tight', spacing: -5 },
    { text: 'delivery.', size: 140, y: 1270, weight: 700, font: 'Inter Tight', spacing: -5 }, { text: 'SOTI XTreme Technology', size: 46, y: 1460, weight: 400, font: 'Inter', color: '#cfe9f7' }],
  [{ text: 'Live View.', size: 190, y: 620, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -8 }, { text: 'The first', size: 140, y: 900, weight: 700, font: 'Inter Tight', spacing: -5 },
    { text: 'of its kind.', size: 140, y: 1050, weight: 700, font: 'Inter Tight', spacing: -5 }, { text: 'SOTI XSight Live View · patent pending', size: 44, y: 1300, weight: 400, font: 'Inter', color: '#cfe9f7' }],
  [{ text: 'Beyond', size: 180, y: 560, weight: 800, font: 'Inter Tight', spacing: -7 }, { text: 'MDM.', size: 180, y: 740, weight: 800, font: 'Inter Tight', spacing: -7 },
    { text: 'Beyond', size: 180, y: 960, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -7 }, { text: 'EMM.', size: 180, y: 1140, weight: 800, font: 'Inter Tight', color: '#a8e2fa', spacing: -7 },
    { text: 'One platform for every business-critical device', size: 42, y: 1390, weight: 400, font: 'Inter', color: '#cfe9f7' }],
];

async function init() {
  const faces = ['300', '400', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px "Inter Tight"`)).concat(['400', '500', '600'].map((w) => document.fonts.load(`${w} 20px Inter`)), [document.fonts.load('400 20px "JetBrains Mono"')]);
  await Promise.all(faces);
  const logo = await fetch('assets/soti-logo.svg').then((r) => r.text()).catch(() => '');
  const pathD = (logo.match(/ d="([^"]+)"/) || [])[1] || '';
  const svg = logo.replace(/<title>.*?<\/title>/, '').replace('<svg ', '<svg ').replace('role="img">', 'role="img"><defs><linearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3f5ff"/><stop offset="1" stop-color="#8fd6f4"/></linearGradient></defs>');
  $('#logo-svg').innerHTML = svg;
  const maskSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 198.5 49'><path d='${pathD}' fill='black'/></svg>`;
  $('#logo-sheen').style.setProperty('--logo-mask', `url("data:image/svg+xml;utf8,${encodeURIComponent(maskSvg)}")`);
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  S = { hospital: makeHospital(ASPECT), blackhole: makeBlackHole(ASPECT), constellation: makeConstellation(ASPECT), road: makeRoad(ASPECT), slabs: makeSlabs(CLAIMS, ASPECT),
    logo: makeLogo(pathD, { W, H, cx: 540, cy: 820, width: 820, start: LOGO_START, lock: EV.logo + 0.42 }) };
  composer = new EffectComposer(renderer); renderPass = new RenderPass(S.hospital.scene, S.hospital.cam); composer.addPass(renderPass);
  bloom = new UnrealBloomPass(new THREE.Vector2(540, 960), 1.2, 0.55, 0.12); composer.addPass(bloom);
  fx = new ShaderPass(finalShader); composer.addPass(fx); composer.addPass(new OutputPass());
  for (const k in S) { S[k].update(0, ''); renderer.compile(S[k].scene, S[k].cam); }
  ready = true; tl.seek(clockObj.t + OFF, false); frame(clockObj.t + OFF); window.__resolveBuild && window.__resolveBuild();
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
  if (t < LOGO_START) return [S.blackhole, 'end'];
  return [S.logo, ''];
}

function frame(t) {
  renderCaptions(t); renderHUD(t); renderWaves(t); renderGraph(t); renderFlap(t); renderFX(t);
  if (!ready) return;
  const [sc, mode] = pick(t);
  if (!sc) { renderer.setClearColor(0x000000, 1); renderer.clear(); return; }
  sc.update(t, mode);
  renderPass.scene = sc.scene; renderPass.camera = sc.cam;
  const beatPh = t >= CU.D ? ((t - CU.D) % B) / B : 1; const kick = t >= CU.D && t < SC.end[0] ? Math.exp(-beatPh * 7) : 0;
  bloom.strength = sc.bloom * (1 + kick * 0.22) * (mode === 'call' ? 0.9 : 1); bloom.threshold = sc.threshold ?? 0.1;
  let ca = 0.05 + kick * 0.1; for (const h of hits) ca += env(t, h, 9) * 1.3;
  fx.uniforms.uCA.value = ca * 0.05; fx.uniforms.uFrame.value = Math.floor(t * 60) % 977;
  fx.uniforms.uDim.value = mode === 'call' ? clamp(t / 0.6) : 1;
  composer.render();
}

init();

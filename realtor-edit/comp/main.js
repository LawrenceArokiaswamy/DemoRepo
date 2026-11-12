// Nest With Nayaki — Final Walk-Through. One GSAP timeline at absolute times (seek-safe) + per-frame captions/zoom.
(function () {
  const TL = window.TL, WORDS = window.WORDS, IC = window.ICONS;
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const DUR = 75.8, EASE = 'expo.out', SPRING = 'back.out(1.6)';
  const icon = (n) => `<svg viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
  const fillIcons = (root = document) => root.querySelectorAll('.ico[data-i]').forEach((e) => (e.innerHTML = icon(e.dataset.i)));

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
  window.__timelines = window.__timelines || {}; window.__timelines['main'] = tl;
  const at = (sel, t, v) => tl.to(sel, v, t), fromTo = (sel, t, a, b) => tl.fromTo(sel, a, b, t), set = (sel, t, v) => tl.set(sel, v, t);
  const rise = (sel, t, d = 0.6) => fromTo(sel, t, { opacity: 0, y: 40, scale: 0.96, filter: 'blur(10px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: d, ease: EASE });
  const sink = (sel, t, d = 0.28) => at(sel, t, { opacity: 0, y: 24, scale: 0.97, filter: 'blur(8px)', duration: d, ease: 'power2.in' });
  const pop = (sel, t) => fromTo(sel, t, { opacity: 0, scale: 0.5, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(2.2)' });

  /* ---------- B-roll cards (wrapper animates; the <video> is the timed clip) ---------- */
  const holder = $('#brolls');
  TL.broll.forEach((b, i) => {
    const w = document.getElementById('b' + i); const v = w.querySelector('video');
    if (window.PREVIEW) v.src = `proxy/broll/${b.src}.webm`;
    fromTo(w, b.t, { opacity: 0, y: 50, scale: 0.9, rotation: i % 2 ? 1.5 : -1.5, filter: 'blur(12px)' }, { opacity: 1, y: 0, scale: 1, rotation: 0, filter: 'blur(0px)', duration: 0.5, ease: EASE });
    fromTo(v, b.t, { scale: 1.12 }, { scale: 1.0, duration: b.d, ease: 'none' });   // gentle Ken Burns
    at(w, b.t + b.d - 0.25, { opacity: 0, scale: 0.94, y: -20, filter: 'blur(8px)', duration: 0.25, ease: 'power2.in' });
  });

  /* ---------- hook ---------- */
  fromTo('.h1', 0.12, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: EASE });
  fromTo('.h2', 0.32, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: EASE });
  $('#mia1').innerHTML = `<span class="ico" data-i="triangle-alert"></span>Seller MIA?`; $('#mia1').classList.add('warn');
  $('#mia2').innerHTML = `<span class="ico" data-i="triangle-alert"></span>Lawyer MIA?`; $('#mia2').classList.add('warn');
  pop('#mia1', TL.mia); pop('#mia2', TL.lawyer);
  at('.h1, .h2', TL.walk - 0.35, { yPercent: -110, duration: 0.35, ease: 'expo.in' });
  sink('#mia', TL.walk - 0.25);

  /* ---------- walk-through ---------- */
  rise('#walk', TL.walk);
  fromTo('#walk .w-t em', TL.walk + 0.25, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: 0.6 });
  $('#days').innerHTML = `<span class="ico" data-i="calendar-days"></span>1–2 days before closing`;
  set('#days', 0, { top: 975 }); pop('#days', TL.days);
  sink('#walk', TL.tips[0] - 0.3); sink('#days', TL.tips[0] - 0.3);

  /* ---------- tracker ---------- */
  const TK = [['door-open', 'Doors'], ['refrigerator', 'Kitchen'], ['droplet', 'Sinks'], ['lamp-ceiling', 'Ceilings'], ['frame', 'Walls']];
  $('#tracker').innerHTML = TK.map(([i, l], k) => `<div class="tk" id="tk${k}"><div class="tk-b"><span class="ico" data-i="${i}"></span><div class="ok"><span class="ico" data-i="check"></span></div></div><div class="tk-l">${l}</div></div>`).join('');
  fromTo('#tracker', TL.tips[0] - 0.25, { opacity: 0, y: -40, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: EASE });
  TL.ticks.forEach((t, k) => {
    fromTo(`#tk${k} .ok`, t, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2.6)' });
    fromTo(`#tk${k} .tk-b`, t, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1 });
  });
  at('#tracker', TL.allDone + 1.6, { opacity: 0, y: -30, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in' });

  /* ---------- tips ---------- */
  const TIPS = [['Doors & locks', 'Every door, every remote'], ['Kitchen & laundry', 'All appliances working'], ['Sinks & faucets', 'No active leaks'], ['Ceilings', 'Signs of leakage'], ['Fixtures & walls', 'Nothing missing or damaged']];
  TL.tips.forEach((t, i) => {
    tl.call(() => { $('#t-num').textContent = '0' + (i + 1); $('#t-k').textContent = `Check ${i + 1} of 5`; $('#t-t').textContent = TIPS[i][0]; }, null, t - 0.01);
    rise('#tip', t, 0.55); fromTo('#t-num', t + 0.05, { rotation: -20, scale: 0.6 }, { rotation: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' });
    sink('#tip', t + 2.5);
  });
  // tip text must also be right when seeking backwards / jumping (render workers seek arbitrary frames)
  const tipAt = (t) => { let k = -1; TL.tips.forEach((x, i) => { if (t >= x - 0.01) k = i; }); return k; };

  /* ---------- icon rows ---------- */
  const row = $('#icons');
  TL.icons.forEach((grp, gi) => grp.forEach((ic, k) => {
    const el = document.createElement('div'); el.className = 'ib'; el.id = `ib${gi}_${k}`;
    el.innerHTML = `<div class="ib-b"><span class="ico" data-i="${ic.i}"></span></div><div class="ib-l">${ic.l}</div>`; row.appendChild(el);
    set(el, 0, { display: 'none' }); set(el, grp[0].t - 0.02, { display: 'flex' });
    fromTo(el, ic.t, { opacity: 0, y: 40, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' });
    fromTo(el.querySelector('.ico'), ic.t + 0.05, { rotation: -14 }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, .5)' });
    at(el, TL.ticks[gi] - 0.05, { opacity: 0, y: -20, scale: 0.85, duration: 0.25, ease: 'power2.in' });
    set(el, TL.ticks[gi] + 0.25, { display: 'none' });
  }));

  /* ---------- tip 4: ceiling ---------- */
  const C = TL.ceiling;
  rise('#ceil', C.t, 0.6); pop('#lookup', C.t + 0.35);
  fromTo('#mag', C.t + 0.5, { x: 0, y: 0 }, { x: 310, y: -50, duration: Math.max(0.6, C.stain - C.t - 0.5), ease: 'power2.inOut' });
  fromTo('#stainblob', C.stain, { scale: 0.6, opacity: 0.4, transformOrigin: '610px 150px' }, { scale: 1, opacity: 1, duration: 0.6, ease: EASE });
  pop('#stain-tag', C.stain + 0.1);
  fromTo('#drip', C.stain + 0.2, { y: 0, opacity: 1 }, { y: 120, opacity: 0, duration: 0.9, ease: 'power2.in', repeat: 3, repeatDelay: 0.25 });
  fromTo('#ceil-cap', C.changes, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE });
  sink('#ceil', C.out);

  /* ---------- tip 5: fixtures & walls ---------- */
  const F = TL.fixtures;
  rise('#fix', F.t, 0.6); rise('#fx-thermo', F.t + 0.1, 0.55);
  fromTo('#thermo-arc', F.t + 0.3, { strokeDasharray: '0 603' }, { strokeDasharray: '420 603', duration: 0.9, ease: EASE });
  rise('#fx-wall', F.holes - 0.35, 0.5);
  at('#tv', F.holes + 0.05, { y: -300, rotation: -8, opacity: 0, duration: 0.6, ease: 'power3.in' });
  fromTo('#fx-wall .hole', F.holes + 0.45, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: 'back.out(3)' });
  fromTo('#fix-cap', F.major, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE });
  sink('#fix', F.out);

  /* ---------- all done ---------- */
  fromTo('#done', TL.allDone, { opacity: 0, scale: 0.7, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(1.8)' });
  sink('#done', TL.checklist - 0.35);

  /* ---------- CTA ---------- */
  fromTo('#doc', TL.checklist - 0.15, { opacity: 0, y: 60, rotation: -8, filter: 'blur(10px)' }, { opacity: 1, y: 0, rotation: -2, filter: 'blur(0px)', duration: 0.6, ease: EASE });
  fromTo('#doc .doc-l', TL.checklist + 0.15, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.09, ease: EASE });
  fromTo('#dm', TL.dm, { opacity: 0, scale: 0.6, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(2)' });
  fromTo('#dm .dm-w', TL.dm + 0.6, { scale: 1 }, { scale: 1.06, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  sink('#doc', TL.broll[7].t - 0.3); sink('#dm', TL.endcard - 0.3);

  /* ---------- end card ---------- */
  fromTo('#end', TL.endcard, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE });
  fromTo('.end-card', TL.endcard, { scale: 0.85, filter: 'blur(12px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.7, ease: SPRING });
  fromTo('.end-n, .end-b, .end-h', TL.endcard + 0.25, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: EASE });
  sink('#topshade', TL.tips[0] - 0.3, 0.5);

  fillIcons();

  /* ---------- per-frame: punch-in zoom, background soften, captions ---------- */
  const marks = [0, ...TL.cuts, ...TL.tips].filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b);
  const overlays = [...TL.broll.map((b) => [b.t, b.t + b.d]), [TL.ceiling.t, TL.ceiling.out + 0.25], [TL.fixtures.t, TL.fixtures.out + 0.25],
    [TL.allDone, TL.checklist - 0.1], [TL.checklist - 0.15, TL.broll[7].t], [TL.endcard, DUR + 2]];
  const softAt = (t) => { let v = 0; for (const [a, b] of overlays) { const i = Math.min(1, Math.max(0, (t - a) / 0.3)), o = Math.min(1, Math.max(0, (b - t) / 0.3)); if (t >= a && t <= b) v = Math.max(v, Math.min(i, o)); } return v; };
  const arw = $('#aroll-wrap'), dim = $('#dim');

  const KEY = /^(walkthrough|walk|closing|locks|garage|remotes|backyard|doors?|kitchen|appliances|washer|dryer|sinks|leakages?|faucets|ceiling|changes|thermostat|holes|wall|mount|checklist|dm|text|m\.i\.a\.?|lawyer)$/i;
  const words = []; for (let i = 0; i < WORDS.length; i++) {   // merge "M" ".I" ".A" → "M.I.A."
    const w = WORDS[i]; if (w.w === 'M' && WORDS[i + 1] && WORDS[i + 1].w.startsWith('.')) { words.push({ w: 'M.I.A.', s: w.s, e: WORDS[i + 2].e }); i += 2; continue; } words.push({ ...w }); }
  const phrases = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); const txt = cur.map((x) => x.w).join(' '); const next = words[i + 1];
    if (/[.,!?]$/.test(w.w) || cur.length >= 4 || txt.length > 20 || !next || next.s - w.e > 0.45) { phrases.push(cur); cur = []; } });
  const capEl = $('#caption'); let capKey = -1;

  function frame(t) {
    // zoom: alternate 1.00 / 1.09 at every cut & tip (hides jump cuts), slow drift inside; punchy open
    let seg = 0; for (let i = 0; i < marks.length; i++) if (t >= marks[i]) seg = i;
    const segT = t - marks[seg]; let z = (seg % 2 ? 1.09 : 1.0) + Math.min(segT, 6) * 0.004;
    if (seg === 0) z = 1.14 - 0.08 * Math.min(1, segT / 1.2) + segT * 0.004;
    const s = softAt(t);
    arw.style.transform = `scale(${z.toFixed(4)})`; arw.style.filter = s > 0.01 ? `blur(${(s * 14).toFixed(1)}px) saturate(${1 - s * 0.3})` : 'none';
    dim.style.opacity = (s * 0.85).toFixed(3);
    // tip card text when seeking
    const k = tipAt(t); if (k >= 0 && $('#t-t').textContent !== TIPS[k][0]) { $('#t-num').textContent = '0' + (k + 1); $('#t-k').textContent = `Check ${k + 1} of 5`; $('#t-t').textContent = TIPS[k][0]; }
    // tracker highlight
    TK.forEach((_, i) => $('#tk' + i).classList.toggle('on', t >= TL.tips[i] - 0.05 && t < TL.ticks[i]));
    // captions
    let pi = -1; for (let i = 0; i < phrases.length; i++) if (t >= phrases[i][0].s - 0.08) pi = i;
    const ph = phrases[pi]; const live = ph && t <= ph[ph.length - 1].e + 0.5 && t < DUR - 0.1;
    if (!live) { if (capKey !== -1) { capEl.innerHTML = ''; capKey = -1; } return; }
    if (pi !== capKey) { capKey = pi; capEl.innerHTML = ph.map((w) => `<span class="w${KEY.test(w.w.replace(/[,!?]$/, '').replace(/\.$/, '')) || /^m\.i\.a/i.test(w.w) ? ' k' : ''}">${w.w}</span>`).join(' '); }
    const sp = capEl.children;
    ph.forEach((w, j) => { const e = sp[j]; if (!e) return; const lt = t - w.s; const p = Math.min(1, Math.max(0, (lt + 0.06) / 0.16));
      e.style.opacity = p; e.style.transform = `translateY(${(1 - p) * 22}px) scale(${0.9 + 0.1 * p})`; });
  }
  frame(0);
})();

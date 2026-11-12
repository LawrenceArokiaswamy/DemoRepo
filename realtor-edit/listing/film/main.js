// Cinematic listing film: speed-ramped FPV clips, beat-cut spin / whip / zoom-through transitions, minimal luxury type.
const C = window.CUTS, DUR = window.DUR, TR = 0.2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), prog = (t, a, b) => clamp((t - a) / (b - a));
const eout = (x) => 1 - Math.pow(1 - x, 3), ein = (x) => x * x * x, eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const $ = (s) => document.querySelector(s);
// transition into each clip (index = incoming clip)
const KIND = ['none', 'zoom', 'whip', 'spin', 'whip', 'zoom', 'spin', 'whip', 'zoom', 'spin', 'whip', 'zoom'];
const LAB = { 0: 'VIRTUAL TWILIGHT', 3: 'VIRTUALLY STAGED', 5: 'VIRTUALLY STAGED', 9: 'VIRTUALLY STAGED', 11: 'VIRTUAL TWILIGHT' };
function fx(kind, k, dir) { // k: 0..1 strength, dir: -1 outgoing, +1 incoming
  if (kind === 'spin') return { tf: `rotate(${(dir * -14 * k).toFixed(2)}deg) scale(${(1 + 0.32 * k).toFixed(3)})`, blur: 14 * k };
  if (kind === 'whip') return { tf: `translateX(${(dir * -260 * k).toFixed(0)}px) scale(${(1 + 0.12 * k).toFixed(3)})`, blur: 18 * k, bx: true };
  if (kind === 'zoom') return { tf: `scale(${(dir < 0 ? 1 + 0.9 * k : 1 + 0.45 * k).toFixed(3)})`, blur: 12 * k };
  return { tf: 'none', blur: 0 };
}
const clock = { t: 0 }; const tl = gsap.timeline({ paused: true });
tl.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => frame(clock.t) }, 0);
window.__timelines = { main: tl };
function frame(t) {
  let flash = 0;
  C.forEach(([a, b], i) => {
    const e = document.getElementById('w' + i), on = t >= a && t < b; e.style.visibility = on ? 'visible' : 'hidden'; if (!on) return;
    const outK = i < C.length - 1 ? ein(prog(t, b - TR, b)) : 0, inK = i > 0 ? 1 - eout(prog(t, a, a + TR)) : 0;
    const o = fx(KIND[i + 1] || 'none', outK, -1), n = fx(KIND[i], inK, 1);
    let base = '';
    if (i === 9) base = `scale(${(1.04 + 0.12 * eio(prog(t, a, b))).toFixed(3)}) `;            // bedroom: digital push-in
    if (i === 0) base = `scale(${(1.06 - 0.04 * prog(t, a, b)).toFixed(3)}) `;
    const tf = base + (outK > 0.001 ? o.tf : '') + ' ' + (inK > 0.001 ? n.tf : '');
    e.style.transform = tf.trim() || 'none';
    const bl = Math.max(outK > 0.001 ? o.blur : 0, inK > 0.001 ? n.blur : 0); e.style.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px) brightness(${(1 + bl / 60).toFixed(3)})` : 'none';
    if (i > 0) flash = Math.max(flash, (t >= a ? Math.exp(-(t - a) * 16) : 0) * (KIND[i] === 'zoom' ? 0.28 : 0.1));
  });
  // drop flash on the first interior cut
  flash = Math.max(flash, t >= C[1][0] ? Math.exp(-(t - C[1][0]) * 10) * 0.55 : 0);
  $('#flash').style.opacity = flash.toFixed(3);
  // opening title
  const oOut = prog(t, 3.2, 3.5);
  $('#open .o-k').style.opacity = (prog(t, 0.5, 1.0) * (1 - oOut)).toFixed(3); $('#open .o-k').style.letterSpacing = (0.9 - 0.28 * eout(prog(t, 0.5, 1.8))).toFixed(3) + 'em';
  $('#open .o-t').style.opacity = (prog(t, 0.9, 1.6) * (1 - oOut)).toFixed(3); $('#open .o-t').style.transform = `translateY(${(26 * (1 - eout(prog(t, 0.9, 1.8)))).toFixed(1)}px)`; $('#open .o-t').style.filter = `blur(${(10 * (1 - prog(t, 0.9, 1.6)) + 8 * oOut).toFixed(1)}px)`;
  $('#open .o-l').style.transform = `scaleX(${(eout(prog(t, 1.5, 2.3)) * (1 - oOut)).toFixed(3)})`;
  $('#open .o-s').style.opacity = (prog(t, 1.9, 2.5) * (1 - oOut)).toFixed(3);
  // small disclosure labels
  const ci = C.findIndex(([a, b]) => t >= a && t < b), lab = LAB[ci];
  if (lab) { $('#lab').textContent = lab; const [a, b] = C[ci]; $('#lab').style.opacity = (prog(t, a + 0.25, a + 0.5) * (1 - prog(t, b - 0.3, b - 0.1)) * (ci === 11 && t > 28.9 ? 0 : 1)).toFixed(3); } else $('#lab').style.opacity = 0;
  // end card
  const eIn = prog(t, 29.0, 29.9); $('#end').style.opacity = eIn.toFixed(3); $('#enddim').style.opacity = prog(t, 28.6, 29.6).toFixed(3);
  $('#end .e-p').style.transform = `translateY(${(30 * (1 - eout(prog(t, 29.0, 30.0)))).toFixed(1)}px)`; $('#end .e-p').style.filter = `blur(${(10 * (1 - prog(t, 29.0, 29.8))).toFixed(1)}px)`;
  $('#end .e-s').style.opacity = prog(t, 29.8, 30.4).toFixed(3); $('#end .e-l').style.transform = `scaleX(${eout(prog(t, 30.2, 31.0)).toFixed(3)})`;
  ['.e-n', '.e-b', '.e-h'].forEach((s, k) => { const el = $('#end ' + s); el.style.opacity = prog(t, 30.6 + k * 0.25, 31.1 + k * 0.25).toFixed(3); el.style.transform = `translateY(${(20 * (1 - eout(prog(t, 30.6 + k * 0.25, 31.3 + k * 0.25)))).toFixed(1)}px)`; });
}
frame(0);

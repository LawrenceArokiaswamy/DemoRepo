// LIP-SYNC (original). Word timings (from tools/align.py) + loudness envelope -> expressive mouth shapes.
// Text is converted to visemes with light English spelling rules; visemes are co-articulated (blended with
// neighbours), lead the audio by ~40 ms, and the jaw opening is scaled by loudness. Emphasis peaks drive brows/nods.
export const VIS = {
  rest: { open: 0, w: 1 }, MBP: { open: 0, w: 0.9, press: 1 }, FV: { open: 0.07, w: 0.95, bite: 1 }, TH: { open: 0.2, w: 0.95, tongue: 0.9, teeth: 0.5 },
  CDN: { open: 0.22, w: 1, teeth: 0.8 }, CH: { open: 0.24, w: 0.76, round: 0.45, teeth: 0.9 }, L: { open: 0.34, w: 0.95, tongue: 0.6 }, R: { open: 0.24, w: 0.8, round: 0.4 },
  WQ: { open: 0.2, w: 0.62, round: 1 }, U: { open: 0.34, w: 0.72, round: 0.7 }, O: { open: 0.66, w: 0.8, round: 0.65 }, AI: { open: 0.88, w: 1.1, teeth: 0.2 },
  E: { open: 0.46, w: 1.2, teeth: 0.6 }, I: { open: 0.34, w: 1.15, teeth: 0.6 },
};
const KEYS = ['open', 'w', 'round', 'teeth', 'tongue', 'bite', 'press'];
const DICT = { the: 'TH E', this: 'TH I CDN', is: 'I CDN', his: 'I CDN', to: 'CDN U', two: 'CDN WQ', of: 'O FV', a: 'AI', was: 'WQ O CDN', were: 'WQ R', one: 'WQ O CDN',
  through: 'TH R WQ', thousand: 'TH AI WQ CDN AI CDN', water: 'WQ O CDN R', work: 'WQ R CDN', they: 'TH E', them: 'TH E MBP', their: 'TH E R', you: 'E WQ', ha: 'AI', oh: 'O WQ',
  ruin: 'R WQ I CDN', about: 'AI MBP AI WQ CDN', all: 'O L', little: 'L I CDN L', white: 'WQ AI CDN', lime: 'L AI MBP', sloppy: 'CDN L O MBP E', roman: 'R O MBP AI CDN', builder: 'MBP I L CDN R',
  later: 'L E CDN R', years: 'E R CDN', concrete: 'CDN O CDN CDN R E CDN', heals: 'E L CDN', itself: 'I CDN CDN E L FV', stone: 'CDN CDN O CDN', seal: 'CDN E L', crack: 'CDN R AI CDN' };
const RULES = [['tch', 'CH'], ['ch', 'CH'], ['sh', 'CH'], ['th', 'TH'], ['ph', 'FV'], ['wh', 'WQ'], ['qu', 'CDN WQ'], ['ck', 'CDN'], ['ng', 'CDN'], ['oo', 'WQ'], ['ou', 'AI WQ'], ['ow', 'O WQ'],
  ['ee', 'E'], ['ea', 'E'], ['ie', 'E'], ['ey', 'E'], ['ai', 'E'], ['ay', 'E'], ['oa', 'O'], ['au', 'O'], ['aw', 'O'], ['oi', 'O E'], ['oy', 'O E'], ['er', 'R'], ['ir', 'R'], ['ur', 'R'], ['ar', 'AI R'], ['or', 'O R'],
  ['a', 'AI'], ['e', 'E'], ['i', 'I'], ['o', 'O'], ['u', 'U'], ['y', 'E'], ['m', 'MBP'], ['b', 'MBP'], ['p', 'MBP'], ['f', 'FV'], ['v', 'FV'], ['w', 'WQ'], ['r', 'R'], ['l', 'L'], ['j', 'CH'], ['h', '']];
const VOWEL = new Set(['AI', 'E', 'I', 'O', 'U', 'WQ']);
export function g2v(word) {
  let s = word.toLowerCase().replace(/[^a-z]/g, ''); if (!s) return []; if (DICT[s]) return DICT[s].split(' ');
  if (s.length > 2 && s.endsWith('e') && !/[aeiou]/.test(s[s.length - 2])) s = s.slice(0, -1);
  const out = []; let i = 0;
  while (i < s.length) { let hit = null; for (const [k, v] of RULES) if (s.startsWith(k, i)) { hit = [k, v]; break; }
    if (hit) { if (hit[1]) out.push(...hit[1].split(' ')); i += hit[0].length; } else { out.push('CDN'); i++; } }
  return out.filter((v, j) => j === 0 || v !== out[j - 1]);
}
/** words: [{w,start,end}] (seconds, audio time); env: {rate, data[]} loudness 0..1; offset: scene time of audio t=0 */
export function makeSpeech(words, env, { offset = 0, lead = 0.04, gain = 1 } = {}) {
  const segs = [];
  for (const wd of words) { const seq = g2v(wd.w); if (!seq.length) continue; const wts = seq.map((v) => (VOWEL.has(v) ? 1.6 : v === 'MBP' ? 1.1 : 1)), tot = wts.reduce((a, b) => a + b, 0);
    let t = wd.start + offset - lead; const len = wd.end - wd.start; seq.forEach((v, j) => { const d = len * wts[j] / tot; segs.push({ v, t0: t, t1: t + d }); t += d; }); }
  const envAt = (t) => { const x = (t - offset) * env.rate, i = Math.floor(x); if (i < 0 || i >= env.data.length - 1) return 0; return env.data[i] + (env.data[i + 1] - env.data[i]) * (x - i); };
  const avgEnv = (t) => { let s = 0; for (let k = -5; k <= 5; k++) s += envAt(t + k * 0.05); return s / 11; };
  let j0 = 0;
  return { segs, envAt, at(t) {
    while (j0 > 0 && segs[j0].t0 > t - 0.3) j0--; while (j0 < segs.length - 1 && segs[j0].t1 < t - 0.3) j0++;
    const acc = Object.fromEntries(KEYS.map((k) => [k, 0])); let W = 0;
    for (let j = j0; j < segs.length && segs[j].t0 < t + 0.3; j++) { const s = segs[j], c = (s.t0 + s.t1) / 2, hw = (s.t1 - s.t0) / 2 + 0.045, d = Math.abs(t - c); if (d > hw) continue;
      let wgt = 1 - d / hw; if (s.v === 'MBP' || s.v === 'FV') wgt *= 2.2; const V = VIS[s.v]; for (const k of KEYS) acc[k] += (V[k] ?? (k === 'w' ? 1 : 0)) * wgt; W += wgt; }
    const e = envAt(t + 0.02);
    if (W < 0.15) { const k = W / 0.15; for (const key of KEYS) acc[key] = acc[key] + (VIS.rest[key] ?? (key === 'w' ? 1 : 0)) * (0.15 - W); W = 0.15; }
    const m = Object.fromEntries(KEYS.map((k) => [k, acc[k] / W])); m.open *= Math.max(0.35, Math.min(1.3, 0.4 + 0.85 * e)) * gain;
    // hard articulation: lips must fully seal on m/b/p and touch the teeth on f/v, whatever the neighbours are doing
    let close = 0, bite = 0;
    for (let j = j0; j < segs.length && segs[j].t0 < t + 0.3; j++) { const sg = segs[j]; if (sg.v !== 'MBP' && sg.v !== 'FV') continue;
      const c = (sg.t0 + sg.t1) / 2, hw = (sg.t1 - sg.t0) / 2 + 0.025, d = Math.abs(t - c); if (d < hw) { const q = 1 - (d / hw) ** 2; if (sg.v === 'MBP') close = Math.max(close, q); else bite = Math.max(bite, q); } }
    m.open *= 1 - close; m.press = Math.max(m.press || 0, close); m.teeth *= 1 - close; if (bite > 0) { m.open = m.open + (0.07 - m.open) * bite; m.bite = Math.max(m.bite || 0, bite); }
    const emph = Math.max(0, Math.min(1, (e - avgEnv(t) - 0.04) * 3.2)); return { mouth: m, emph, loud: e, talking: e > 0.04 || W > 0.15 }; } };
}
/** layer speech onto an emotional mouth: keeps smile/asymmetry (emotion), takes shape + jaw from speech */
export function applySpeech(mouth, sp, k = 1) {
  if (!sp || k <= 0) return mouth; const s = sp.mouth, o = { ...mouth };
  o.open = mouth.open * (1 - k) + (s.open + mouth.open * 0.2) * k; o.w = mouth.w * (1 - k + k * s.w); o.round = (mouth.round || 0) * (1 - k) + s.round * k;
  o.teeth = Math.max(mouth.teeth * (1 - k), s.teeth * k); o.tongue = (mouth.tongue || 0) * (1 - k) + s.tongue * k; o.bite = s.bite * k; o.press = s.press * k; o.smile = mouth.smile * (1 - 0.3 * k); return o;
}

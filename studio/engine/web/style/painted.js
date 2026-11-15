// PAINTED-LOOK TEXTURE KIT (original, procedural canvas; Visual standard v2). Stylised "hand-painted" surfaces: soft value
// gradients, a few shape-designed details, worn edges and ink accents, so materials read as designed rather than flat colour.
// Every function returns a THREE.CanvasTexture (sRGB, repeat wrapping). Deterministic (seeded), so renders are repeatable.
let THREE = null; export const initPainted = (T) => { THREE = T; };
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function tex(S, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); draw(g, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const vgrad = (g, S, a, b) => { const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, S, S); };
const blots = (g, S, n, col, r0, r1, seed = 1) => { for (let i = 0; i < n; i++) { g.fillStyle = col; g.globalAlpha = 0.05 + R(i + seed) * 0.08; g.beginPath(); g.ellipse(R(i * 3 + seed) * S, R(i * 7 + seed) * S, r0 + R(i * 11 + seed) * r1, (r0 + R(i * 13 + seed) * r1) * 0.6, R(i) * 3, 0, 7); g.fill(); } g.globalAlpha = 1; };
// warm wood floor: planks with grain strokes, per-plank value shifts, dark seams, a lighter worn centre stripe
export const woodFloor = (rep = [4, 4]) => tex(512, (g, S) => { const n = 6, w = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const v = 0.85 + R(i * 5 + j) * 0.3, off = j * S / 2 + R(i) * S * 0.3;
    g.fillStyle = `rgb(${150 * v | 0},${92 * v | 0},${55 * v | 0})`; g.fillRect(i * w, off % S, w, S / 2); g.fillRect(i * w, (off % S) - S, w, S / 2);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(70,38,20,${0.12 + R(i * 9 + k) * 0.12})`; g.lineWidth = 1 + R(k + i) * 2; g.beginPath(); const x = i * w + 6 + R(i * 17 + k) * (w - 12); g.moveTo(x, 0); g.bezierCurveTo(x + 6, S * 0.3, x - 6, S * 0.6, x + 3, S); g.stroke(); }
    g.fillStyle = 'rgba(40,20,12,0.85)'; g.fillRect(i * w, off % S, w, 3); }
  for (let i = 0; i <= n; i++) { g.fillStyle = 'rgba(35,18,10,0.9)'; g.fillRect(i * w - 2, 0, 4, S); }
  blots(g, S, 60, '#ffe0b0', 20, 60, 3); }, rep);
// patterned wallpaper (original damask-like motif) on a deep colour with vertical value gradient
export const wallpaper = (base = '#2f5a52', motif = '#5f8f7a', rep = [6, 2]) => tex(512, (g, S) => { vgrad(g, S, base, shade(base, -0.25));
  g.fillStyle = motif; g.globalAlpha = 0.55; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = x * S / 2 + (y % 2) * S / 4 + S / 8, cy = y * S / 2 + S / 4;
    g.beginPath(); g.ellipse(cx, cy, S * 0.05, S * 0.12, 0, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * S * 0.07, cy + S * 0.03, S * 0.035, S * 0.07, s * 0.6, 0, 7); g.fill(); }
    g.beginPath(); g.arc(cx, cy - S * 0.15, S * 0.025, 0, 7); g.fill(); } g.globalAlpha = 1; blots(g, S, 40, '#000', 30, 80, 9); }, rep);
// raised wooden wall panels (wainscot): bevel highlight top-left, shadow bottom-right, ink outline
export const panels = (base = '#5a3424', rep = [8, 1]) => tex(512, (g, S) => { g.fillStyle = base; g.fillRect(0, 0, S, S); const m = S * 0.12;
  g.fillStyle = shade(base, 0.12); g.fillRect(m, m, S - 2 * m, S - 2 * m); g.strokeStyle = shade(base, 0.35); g.lineWidth = 8; g.beginPath(); g.moveTo(m, S - m); g.lineTo(m, m); g.lineTo(S - m, m); g.stroke();
  g.strokeStyle = shade(base, -0.45); g.beginPath(); g.moveTo(S - m, m); g.lineTo(S - m, S - m); g.lineTo(m, S - m); g.stroke(); g.strokeStyle = 'rgba(25,12,8,0.8)'; g.lineWidth = 3; g.strokeRect(m - 4, m - 4, S - 2 * m + 8, S - 2 * m + 8);
  blots(g, S, 30, '#ffd9a0', 20, 50, 5); }, rep);
// velvet upholstery: deep colour with soft sheen bands and button tufts
export const velvet = (base = '#7a1f2a', rep = [3, 1]) => tex(256, (g, S) => { vgrad(g, S, shade(base, 0.25), shade(base, -0.3));
  for (let y = 1; y < 3; y++) for (let x = 0; x < 3; x++) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc((x + (y % 2) * 0.5 + 0.25) * S / 3, y * S / 3, 5, 0, 7); g.fill(); } }, rep);
// linen tablecloth: warm cream, soft fold shading, subtle weave
export const linen = (rep = [1, 1]) => tex(256, (g, S) => { vgrad(g, S, '#fbf3e2', '#e8dcc2'); for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(150,120,90,${0.06 + R(i) * 0.05})`; g.fillRect(i * S / 10 + R(i * 3) * 8, 0, 6 + R(i * 5) * 10, S); }
  for (let y = 0; y < S; y += 4) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y, S, 1); } }, rep);
// night city seen through the windows: deep blue gradient, layered skyline silhouettes, lit windows, soft bokeh lights
export const nightCity = () => tex(1024, (g, S) => { vgrad(g, S, '#0e1636', '#2a3a6e');
  const layer = (base, h, col, seed, lit) => { for (let x = 0, i = 0; x < S; i++) { const w = 40 + R(i + seed) * 90, hh = h + R(i * 3 + seed) * h; g.fillStyle = col; g.fillRect(x, S - hh, w, hh);
      if (lit) for (let k = 0; k < (w * hh) / 900; k++) { g.fillStyle = R(k + i * 7) > 0.4 ? '#ffd27a' : '#7fb0ff'; g.globalAlpha = 0.65 + R(k * 3 + i) * 0.35; g.fillRect(x + 6 + R(k * 5 + i) * (w - 14), S - hh + 8 + R(k * 11 + i) * (hh - 16), 5, 7); } g.globalAlpha = 1; x += w + 4; } };
  layer(S, S * 0.25, '#1b2550', 1, true); layer(S, S * 0.16, '#121a3c', 7, true);
  for (let i = 0; i < 60; i++) { const r = 8 + R(i * 3) * 26; const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); const c = R(i) > 0.5 ? '255,200,120' : '140,180,255'; gr.addColorStop(0, `rgba(${c},0.55)`); gr.addColorStop(1, `rgba(${c},0)`);
    g.save(); g.translate(R(i * 7) * S, S * (0.45 + R(i * 11) * 0.5)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.restore(); } });
// framed painting (original abstract landscapes), for wall dressing
export const painting = (seed = 1) => tex(256, (g, S) => { const sky = ['#e9b77a', '#9ec2d6', '#d98a6a'][seed % 3]; vgrad(g, S, sky, '#f3e2c0');
  g.fillStyle = ['#4f6b4a', '#5a5f7a', '#6b4a3a'][seed % 3]; g.beginPath(); g.moveTo(0, S * 0.7); for (let x = 0; x <= S; x += 16) g.lineTo(x, S * (0.6 - 0.12 * Math.sin(x * 0.02 + seed))); g.lineTo(S, S); g.lineTo(0, S); g.fill();
  g.fillStyle = 'rgba(255,240,200,0.8)'; g.beginPath(); g.arc(S * (0.3 + 0.4 * R(seed)), S * 0.28, S * 0.07, 0, 7); g.fill(); });
// soft radial glow sprite (lamp halos, phone glow, candle flames)
export const glow = (rgb = '255,200,120') => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.25, `rgba(${rgb},0.45)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
export function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(gg)},${f(b)})`; }

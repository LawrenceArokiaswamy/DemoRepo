// Procedural painted textures (original code). Every painter returns a canvas.
import * as THREE from './lib/three.module.js';

export const rng = (seed) => { let s = (seed * 9301 + 49297) % 233280 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const jitter = (c, r, k) => c.map((v) => Math.max(0, Math.min(255, v + (r() - 0.5) * k)));

const speckle = (g, w, h, r, n, base, k, size = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = rgb(jitter(base, r, k), 0.35 + r() * 0.4); const s = 1 + r() * size; g.fillRect(r() * w, r() * h, s, s); } };
const blobPath = (g, x, y, rad, r, n = 7) => { g.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = rad * (0.7 + r() * 0.5); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * (0.75 + r() * 0.3); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); };

/** Roman concrete: tuff/rubble aggregate in a lime-ash matrix, with white lime clasts. */
export function concrete(seed, { weathered = false, wet = false, clasts = 1, size = 1024 } = {}) {
  const [c, g] = canvas(size, size), r = rng(seed), S = size / 1024;
  const base = weathered ? hex('#8d877b') : wet ? hex('#7d776c') : hex('#bdb29e');
  g.fillStyle = rgb(base); g.fillRect(0, 0, size, size);
  // matrix mottling
  for (let i = 0; i < 90; i++) { const x = r() * size, y = r() * size, rr = (30 + r() * 120) * S; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, rgb(jitter(base, r, 40), 0.35)); gr.addColorStop(1, rgb(base, 0)); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  speckle(g, size, size, r, 9000 * S * S, base, 70, 3 * S);
  // aggregate: tuff (red-brown), grey rubble, dark volcanic
  const ag = weathered ? ['#6e5a4c', '#5f5a52', '#4a453f', '#7a6d5e'] : wet ? ['#6d5646', '#5e584f', '#47423c'] : ['#8c6a52', '#7d766c', '#5b554d', '#9a8268'];
  for (let i = 0; i < 230 * S * S; i++) { const x = r() * size, y = r() * size, rad = (6 + Math.pow(r(), 2) * 34) * S; const col = hex(ag[(r() * ag.length) | 0]);
    blobPath(g, x, y, rad, r); g.fillStyle = rgb(jitter(col, r, 25)); g.fill(); g.lineWidth = 1.5 * S; g.strokeStyle = rgb(jitter(col, r, 10).map((v) => v * 0.6), 0.8); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; blobPath(g, x - rad * 0.2, y - rad * 0.25, rad * 0.45, r, 5); g.fill(); }
  // lime clasts: the white lumps
  for (let i = 0; i < 120 * clasts * S * S; i++) { const x = r() * size, y = r() * size, rad = (3 + Math.pow(r(), 2.2) * 16) * S;
    blobPath(g, x, y, rad, r, 6); g.fillStyle = weathered ? '#dcd8cc' : '#f6f3ea'; g.fill(); g.lineWidth = 1 * S; g.strokeStyle = 'rgba(120,110,95,0.5)'; g.stroke(); }
  if (weathered) {
    for (let i = 0; i < 70; i++) { const x = r() * size; g.fillStyle = `rgba(50,45,40,${0.05 + r() * 0.1})`; g.fillRect(x, 0, (2 + r() * 10) * S, size); }
    for (let i = 0; i < 40; i++) { blobPath(g, r() * size, r() * size * 0.7, (8 + r() * 30) * S, r); g.fillStyle = 'rgba(40,36,32,0.18)'; g.fill(); }
  }
  return c;
}

/** Cut ashlar stone blocks with mortar joints. */
export function ashlar(seed, { tone = '#c9b48f', rows = 6, size = 1024 } = {}) {
  const [c, g] = canvas(size, size), r = rng(seed), base = hex(tone), rh = size / rows;
  g.fillStyle = '#6e604c'; g.fillRect(0, 0, size, size);
  for (let y = 0; y < rows; y++) { let x = -(y % 2) * rh * 0.9; while (x < size) { const w = rh * (1.4 + r() * 1.1), col = jitter(base, r, 26);
    g.fillStyle = rgb(col); g.fillRect(x + 4, y * rh + 4, w - 8, rh - 8);
    const gr = g.createLinearGradient(0, y * rh, 0, y * rh + rh); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.16)'); g.fillStyle = gr; g.fillRect(x + 4, y * rh + 4, w - 8, rh - 8);
    speckle(g, 0, 0, r, 0, col, 0); for (let k = 0; k < 260; k++) { g.fillStyle = rgb(jitter(col, r, 50), 0.3); g.fillRect(x + 4 + r() * (w - 8), y * rh + 4 + r() * (rh - 8), 2, 2); }
    if (r() < 0.35) { g.strokeStyle = 'rgba(60,50,40,0.5)'; g.lineWidth = 2; g.beginPath(); const cx = x + r() * w, cy = y * rh + 6; g.moveTo(cx, cy); g.lineTo(cx + (r() - 0.5) * 30, cy + rh * 0.4); g.stroke(); }
    x += w; } }
  return c;
}

/** Wooden planks with grain and dark seams. */
export function planks(seed, { tone = '#9a6a3e', n = 6, size = 512, vertical = false } = {}) {
  const [c, g] = canvas(size, size), r = rng(seed), base = hex(tone), pw = size / n;
  for (let i = 0; i < n; i++) { const col = jitter(base, r, 34); g.fillStyle = rgb(col); g.fillRect(i * pw, 0, pw, size);
    for (let k = 0; k < 26; k++) { const x = i * pw + r() * pw; g.strokeStyle = rgb(col.map((v) => v * (0.7 + r() * 0.2)), 0.5); g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= size; y += 32) g.lineTo(x + Math.sin(y * 0.02 + k) * 3, y); g.stroke(); }
    if (r() < 0.6) { const ky = r() * size; g.fillStyle = rgb(col.map((v) => v * 0.55)); g.beginPath(); g.ellipse(i * pw + pw * 0.5, ky, pw * 0.12, pw * 0.2, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(25,14,8,0.9)'; g.fillRect(i * pw, 0, 3, size);
    for (const y of [size * 0.08, size * 0.92]) { g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(i * pw + pw * 0.5, y, 3, 0, 7); g.fill(); } }
  if (vertical) return c;
  const [c2, g2] = canvas(size, size); g2.translate(size, 0); g2.rotate(Math.PI / 2); g2.drawImage(c, 0, 0); return c2;
}

export function sand(seed, size = 512) { const [c, g] = canvas(size, size), r = rng(seed), base = hex('#d8c39a'); g.fillStyle = rgb(base); g.fillRect(0, 0, size, size); speckle(g, size, size, r, 12000, base, 60, 2.5); return c; }
export function rock(seed, size = 512) { const [c, g] = canvas(size, size), r = rng(seed), base = hex('#8a8173'); g.fillStyle = rgb(base); g.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) { blobPath(g, r() * size, r() * size, 8 + r() * 40, r); g.fillStyle = rgb(jitter(base, r, 50), 0.5); g.fill(); } speckle(g, size, size, r, 6000, base, 70, 3); return c; }
export function rust(seed, size = 256) { const [c, g] = canvas(size, size), r = rng(seed), base = hex('#8a4a26'); g.fillStyle = rgb(base); g.fillRect(0, 0, size, size); speckle(g, size, size, r, 5000, base, 90, 4); return c; }
export function cloth(seed, tone, size = 256) { const [c, g] = canvas(size, size), r = rng(seed), base = hex(tone); g.fillStyle = rgb(base); g.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 3) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(0, i, size, 1); g.fillRect(i, 0, 1, size); } return c; }
export function radial(col = '20,14,10', a = 0.55, size = 128) { const [c, g] = canvas(size, size), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.6, `rgba(${col},${a * 0.45})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, size, size); return c; }
/** painted cloud (soft stacked puffs, lit from the top) */
export function cloud(seed, warm = false) { const [c, g] = canvas(640, 320), r = rng(seed);
  const puffs = []; for (let i = 0; i < 9; i++) puffs.push([110 + r() * 420, 170 + (r() - 0.3) * 70, 50 + r() * 70]);
  for (const [x, y, rr] of puffs) { g.beginPath(); g.arc(x, y + 14, rr, 0, 7); g.fillStyle = warm ? 'rgba(214,150,140,0.9)' : 'rgba(172,190,214,0.9)'; g.fill(); }
  for (const [x, y, rr] of puffs) { const gr = g.createRadialGradient(x - rr * 0.2, y - rr * 0.4, rr * 0.1, x, y, rr); gr.addColorStop(0, warm ? '#fff3e0' : '#ffffff'); gr.addColorStop(1, warm ? '#f2c9a8' : '#e2ebf6'); g.beginPath(); g.arc(x, y, rr * 0.92, 0, 7); g.fillStyle = gr; g.fill(); }
  return c; }

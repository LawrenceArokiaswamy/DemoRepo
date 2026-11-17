// render_canvas.mjs <page.html> <outdir> <frames: a-b or list> [fps=30]   (charsys dev): serves studio/, calls window.drawFrame(t), saves JPEGs
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright'); import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [,, page, out, spec, fpsA] = process.argv; const fps = +(fpsA || 30); const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const frames = spec.includes('-') ? (() => { const [a, b] = spec.split('-').map(Number); return Array.from({ length: b - a + 1 }, (_, i) => a + i); })() : spec.split(',').map(Number);
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', (e) => console.error('PAGEERROR', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/dev/charsys/${page}`); await pg.waitForFunction(() => window.ready, null, { timeout: 120000 });
fs.mkdirSync(out, { recursive: true }); const t0 = Date.now();
for (const f of frames) { const url = await pg.evaluate((t) => window.drawFrame(t), f / fps); fs.writeFileSync(path.join(out, `f${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64')); }
console.log(`done ${frames.length} frames, ${((Date.now() - t0) / 1000 / frames.length).toFixed(2)} s/frame`); await b.close(); srv.close();

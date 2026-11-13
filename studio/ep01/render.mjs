// Frame renderer (original). usage: node render.mjs <outdir> <"a-b" | "1,2,3"> [quality]   env RESUME=1 skips existing frames
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [,, outdir, spec, qual = '0.95'] = process.argv; fs.mkdirSync(outdir, { recursive: true });
const frames = spec.split(',').flatMap((p) => { if (!p.includes('-')) return [+p]; const [a, b] = p.split('-').map(Number); return Array.from({ length: b - a + 1 }, (_, i) => a + i); });
const root = path.resolve('web'), types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); pg.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 240000 });
const err = await pg.evaluate(() => window.err); if (err) { console.log('LOAD ERROR', err); process.exit(1); }
const t0 = Date.now(); let n = 0;
for (const f of frames) { const out = path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`); if (process.env.RESUME && fs.existsSync(out)) continue;
  const d = await pg.evaluate(([f, q]) => { window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', q); }, [f, +qual]);
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); n++; }
console.log(`done ${n} frames, ${n ? ((Date.now() - t0) / n / 1000).toFixed(2) : 0} s/frame`); await b.close(); srv.close();

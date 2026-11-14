// Frame renderer (original). Serves studio/ and drives engine/web/director.html in headless Chromium (SwiftShader WebGL).
// usage: node render.mjs <story-slug> <outdir> <"a-b" | "1,2,3"> [jpegQuality]     env RESUME=1 skips existing frames
//        node render.mjs <story-slug> --cues <out.json>                              exports the story's sound cue sheet
//        node render.mjs <story-slug> --info                                          prints TOTAL frames
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [,, slug, a2, a3, qual = '0.95'] = process.argv; const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mjs': 'text/javascript' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); pg.on('console', (m) => { if (m.type() === 'error' || process.env.LOG) console.log('CONSOLE', m.text()); });
await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/web/director.html?story=/stories/${slug}`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 300000 });
const err = await pg.evaluate(() => window.err); if (err) { console.log('LOAD ERROR', err); process.exit(1); }
const done = async () => { await b.close(); srv.close(); };
if (a2 === '--info') { console.log(JSON.stringify({ total: await pg.evaluate(() => window.TOTAL) })); await done(); process.exit(0); }
if (a2 === '--cues') { fs.writeFileSync(a3, await pg.evaluate(() => JSON.stringify(window.cues()))); console.log('cues', a3); await done(); process.exit(0); }
const outdir = a2; fs.mkdirSync(outdir, { recursive: true });
const frames = a3.split(',').flatMap((p) => { if (!p.includes('-')) return [+p]; const [x, y] = p.split('-').map(Number); return Array.from({ length: y - x + 1 }, (_, i) => x + i); });
const t0 = Date.now(); let n = 0;
for (const f of frames) { const out = path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`); if (process.env.RESUME && fs.existsSync(out)) continue;
  const d = await pg.evaluate(([f, q]) => { window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', q); }, [f, +qual]);
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); n++; }
console.log(`done ${n} frames, ${n ? ((Date.now() - t0) / n / 1000).toFixed(2) : 0} s/frame`); await done();

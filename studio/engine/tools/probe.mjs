// probe.mjs <slug> <frame> <actor> <attachFrame>: prints an actor's card position in world and in the attach frame's local coords
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [,, slug, f, actor, att, pt] = process.argv; const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await b.newPage({ viewport: { width: 540, height: 960 } });
await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/web/director.html?story=/stories/${slug}`); await pg.waitForFunction(() => window.ready, null, { timeout: 300000 });
console.log(await pg.evaluate(([f, actor, att, pt]) => { window.renderFrame(+f); const C = window.CTX, A = C.ACT[actor], p = A.card.mesh.position.clone(), w = C.worldT(+f / C.FPS);
  const M = window.biz.frameOf(att, w).invert(), l = p.clone().applyMatrix4(M); const q = pt ? new C.THREE.Vector3(...pt.split(",").map(Number)).applyMatrix4(M).toArray().map((x) => +x.toFixed(2)) : null; return JSON.stringify({ point: q, world: p.toArray().map((x) => +x.toFixed(2)), local: l.toArray().map((x) => +x.toFixed(2)), all: Object.fromEntries(Object.entries(C.ACT).filter(([k]) => !k.startsWith('extra')).map(([k, a]) => [k, a.card.mesh.position.clone().applyMatrix4(M).toArray().map((x) => +x.toFixed(1))])) }); }, [f, actor, att, pt]));
await b.close(); srv.close();

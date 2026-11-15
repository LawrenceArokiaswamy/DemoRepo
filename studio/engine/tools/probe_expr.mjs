// probe_expr.mjs <slug> <frame> "<js expression using C (director CTX)>": renders the frame state and prints the expression's JSON value
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [,, slug, f, expr] = process.argv; const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await b.newPage({ viewport: { width: 360, height: 640 } });
await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/web/director.html?story=/stories/${slug}&scale=0.33`); await pg.waitForFunction(() => window.ready, null, { timeout: 300000 });
console.log(await pg.evaluate(([f, expr]) => { window.renderFrame(+f); const C = window.CTX, V = () => new C.THREE.Vector3(), wp = (o) => o.getWorldPosition(V()).toArray().map((x) => +x.toFixed(2)); return JSON.stringify(eval(expr)); }, [f, expr]));
await b.close(); srv.close();

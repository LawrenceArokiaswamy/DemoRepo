// check_faces.mjs: runs the automated facial checks (geometry + pixel distinctness) and the quiz key; writes out/face_checks.json, out/quiz_key.json
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright'); import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r)); const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://127.0.0.1:${srv.address().port}/dev/charsys/acting.html?mode=quiz`); await pg.waitForFunction(() => window.ready);
const rep = await pg.evaluate(() => window.runChecks()); fs.writeFileSync('out/face_checks.json', rep);
const key = await pg.evaluate(() => { window.drawFrame(0); return JSON.stringify(window.quizKey, null, 1); }); fs.writeFileSync('out/quiz_key.json', key); console.log(rep); await b.close(); srv.close();

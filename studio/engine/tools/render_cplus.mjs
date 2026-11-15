// node render_cplus.mjs <out.png> : renders the C+ character concept sheet
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../design'), out = process.argv[2] || path.join(here, 'concept_cplus.png');
const bg = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'preview_bg_deck.jpg')).toString('base64');
const b = await chromium.launch(); const pg = await b.newPage(); pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await pg.goto('file://' + path.join(here, 'concept_cplus.html')); await pg.waitForFunction(() => window.ready);
await pg.evaluate((bg) => window.renderCPlus(bg), bg); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/png'));
fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', out); await b.close();

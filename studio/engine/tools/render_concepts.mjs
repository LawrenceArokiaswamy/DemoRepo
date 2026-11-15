// node render_concepts.mjs <outdir> : renders the three concept review sheets (A, B, C) to PNG
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../design'), out = process.argv[2] || here;
const bg = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'preview_bg_deck.jpg')).toString('base64');
const BLURB = {
  A: ['One-piece "pebble bean": head and body are a single soft shape. The costume is painted on as colour bands, and identity comes from the helmet or hat silhouette.',
      'Floating mitten hands give big, clear gestures with no arms to animate. Huge round eyes and bar brows read instantly at phone size.',
      'Cheapest to produce and to vary: new characters are mostly a new hat, palette and band pattern. The most readable of the three, the least nuanced in body acting.'],
  B: ['Big round head on a pear-shaped body: friendly, warm, and recognisably "pebble-folk", the evolution of our Episode 1 characters.',
      'Mitten hands with a thumb on soft tapered arms, short legs and chunky boots. The costume pieces (shoulder plate, banded armour, pleated tunic) define the period.',
      'Oval eyes with a heavy upper lid, tuft brows and a nose bump give more nuance than A while staying simple. A balanced middle ground for many periods and roles.'],
  C: ['More deliberate proportions: a shaped head with a jaw, a neck, a V-shaped torso, readable elbows and knees, and four-finger hands. It can act with posture, not just the face.',
      'Stronger costumes (banded armour, pteruges, cape, sandal straps, plumed crest) give a "film" feel and suit heroic or dramatic stories.',
      'Almond eyes with irises, angular brows and a drawn nose allow subtler acting. The costliest to design, rig and animate, and it needs the most care to stay appealing and not stiff.'],
};
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
await pg.goto('file://' + path.join(here, 'concepts.html')); await pg.waitForFunction(() => window.ready);
for (const k of ['A', 'B', 'C']) { await pg.evaluate(([k, bg, bl]) => window.renderSheet(k, bg, bl), [k, bg, BLURB[k]]);
  const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/png')); fs.writeFileSync(path.join(out, `concept_${k}.png`), Buffer.from(d.split(',')[1], 'base64')); console.log('sheet', k); }
await b.close();

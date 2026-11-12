import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const [dir, ...ts] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
for (const t of ts) console.log(t, JSON.stringify(await page.evaluate(t => { window.render(+t); const g = window.DBG; return { shot: g.ST.shot, flash: g.ST.flash, desat: g.ST.desat, ca: g.ST.ca, cam: g.camera.position.toArray().map(x => +x.toFixed(2)), fog: g.scene.fog.density }; }, t)));
await browser.close(); closeServer();

import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const [dir, ...ts] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
for (const t of ts) console.log(t, await page.evaluate(t => { window.render(+t); const g = window.DBG.grade ? window.DBG.grade.uniforms : null; const c = document.createElement('canvas'); c.width = 54; c.height = 96; const x = c.getContext('2d'); x.drawImage(document.getElementById('gl'), 0, 0, 54, 96); const d = x.getImageData(0, 0, 54, 96).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return JSON.stringify({ mean: s / (d.length / 4), flash: g && g.uFlash.value, col: g && g.uFlashCol.value.toArray(), bloom: window.DBG.bloom && window.DBG.bloom.strength }); }, t));
await browser.close(); closeServer();

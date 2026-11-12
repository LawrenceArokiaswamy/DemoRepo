import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const { browser, page } = await openDemo(process.argv[2], { w: 1080, h: 1920 });
console.log(await page.evaluate(() => window.SH.map(s => `${s.name} ${s.t0.toFixed(2)}-${Math.min(s.t1, window.DUR).toFixed(2)} (${(Math.min(s.t1, window.DUR) - s.t0).toFixed(2)})`).join('\n')));
await browser.close(); closeServer();

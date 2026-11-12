// node tools/evalpage.mjs <demo> "<js expression>"   (run from $LIB)
import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const [dir, expr] = process.argv.slice(2);
const { page, browser } = await openDemo(dir, { w: 1080, h: 1920 });
console.log(JSON.stringify(await page.evaluate(expr), null, 1));
await browser.close(); closeServer();

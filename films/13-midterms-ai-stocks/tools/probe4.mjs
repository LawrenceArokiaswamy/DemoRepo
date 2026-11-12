import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const [dir, t, out] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
const info = await page.evaluate(t => { window.render(+t); const S = window.DBG.scene; let m = null; S.traverse(o => { if (!m && o.isMesh && o.geometry.type === 'ExtrudeGeometry' && o.parent.visible) m = o.material; });
  return JSON.stringify({ col: m.color.getHexString(), em: m.emissive.getHexString(), ei: m.emissiveIntensity, env: m.envMapIntensity, rough: m.roughness, metal: m.metalness, type: m.type }); }, t);
console.log(info); await page.screenshot({ path: out, type: 'jpeg' }); await browser.close(); closeServer();

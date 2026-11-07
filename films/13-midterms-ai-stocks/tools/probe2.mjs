import { openDemo, closeServer } from '/root/lemo-opuscar/core/render/page.mjs';
const [dir, set, t] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
const r = await page.evaluate(([set, t]) => {
  const mean = () => { window.render(+t); const c = document.createElement('canvas'); c.width = 54; c.height = 96; const g = c.getContext('2d'); g.drawImage(document.getElementById('gl'), 0, 0, 54, 96); const d = g.getImageData(0, 0, 54, 96).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return +(s / (d.length / 4) / 3).toFixed(1); };
  const S = window.DBG.scene.children.find(o => o.visible !== undefined && o.children && o.type === 'Group' && o.userData && o.userData.tr && o.userData.P && o === o) ;
  const out = { all: mean() }; const grp = window.DBG.scene.children.filter(o => o.type === 'Group');
  const g = grp.find(o => o.userData && o.userData.tr && window.DBG.scene && o.userData.marker !== undefined === (set === 'octchart')) ;
  g.children.forEach((c, i) => { const v = c.visible; c.visible = false; const m = mean(); c.visible = v; out[i + ':' + c.type] = m; });
  return out; }, [set, t]);
console.log(JSON.stringify(r)); await browser.close(); closeServer();

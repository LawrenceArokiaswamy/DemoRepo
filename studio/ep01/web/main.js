import { THREE, applyLight, render, setView, drawCards, camAt } from './core.js';
import { world } from './world.js';
import { TOTAL, FPS, shotAt, LIGHTS, viewAt, stateAt, actorsAt, fxAt } from './episode.js';

window.renderFrame = (f) => {
  const t = f / FPS, sh = shotAt(t), L = LIGHTS[sh.light], v = viewAt(t, camAt);
  applyLight(L, new THREE.Vector3(...v.shadowFocus));
  world.update(stateAt(t), t);
  setView(v); drawCards([...actorsAt(t), ...fxAt(t)]);
  render(v);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;

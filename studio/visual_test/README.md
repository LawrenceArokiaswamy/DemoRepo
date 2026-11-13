# Visual-quality breakthrough test: "Pip vs the alarm clock" (8 s)

- Character: AI-illustrated (GPT Image 2.6 via Higgsfield; 3 images, 8.25 credits): design sheet, 8-expression sheet, body-parts sheet
  (`char_source/`). Split automatically (`cut.py`), joints measured from the art, rigged as a 2D cut-out puppet (`web/puppet.js`).
- Environment: Poly Haven CC0 models, PBR textures and HDRI (`fetch.py` downloads them into `web/assets/`; not committed, ~78 MB).
  Rendered with three.js r160 PBR + ACES, soft shadows, bloom, depth of field, grade (`web/stage.js`, `web/set.js`).
- three.js r160 (MIT) goes in `web/lib/` (`npm pack three@0.160.0`; copy `build/three.module.js` and `examples/jsm`).
- Sound: synthesized (`sfx2.py`). Render: `node render.mjs frames "0-239"` (~5.6 s/frame, CPU only).

# Soldier scene v2 (improvement pass on the third-party cartoon-short-kit example)

Benchmark/learning project, not an original episode.
- Base: `cartoon-short-kit` (Google Drive zip, no license file) + `toon.ts` from mromidev/claude-animated-shorts (MIT).
  The kit's own code has no license: keep this internal; do not publish or redistribute it.
- `web/lib/three.module.js` (three.js r160, MIT) is not committed: `npm pack three@0.160.0` and copy `package/build/three.module.js` into `web/lib/`.
- Render: `node render.mjs frames "0-591"` (Playwright Chromium, SwiftShader, ~2.8 s/frame); stills QA: `python3 qa.py <dir> sheet.jpg 6`.

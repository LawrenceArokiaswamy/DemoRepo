#!/usr/bin/env bash
# One-time setup for a fresh cloud session: three.js r160 (MIT) + Playwright, CC0 assets from Poly Haven. Free; no credits.
set -e; HERE=$(cd "$(dirname "$0")" && pwd); WEB=$HERE/../web
if [ ! -f "$WEB/lib/three.module.js" ]; then
  tmp=$(mktemp -d); (cd "$tmp" && npm init -y >/dev/null && npm install three@0.160.0 >/dev/null)
  mkdir -p "$WEB/lib"; cp "$tmp/node_modules/three/build/three.module.js" "$WEB/lib/"; cp -r "$tmp/node_modules/three/examples/jsm" "$WEB/lib/jsm"; rm -rf "$tmp"; echo "three.js r160 installed"
fi
[ -d "$HERE/node_modules/playwright" ] || (cd "$HERE" && npm init -y >/dev/null 2>&1; npm install playwright@1 >/dev/null 2>&1 || true)
python3 -m pip install --quiet numpy pillow 2>/dev/null || true
python3 "$HERE/fetch_assets.py" "$WEB/assets"

#!/bin/bash
# Installs the "effects" video skill (.claude/skills/effects) in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# MediaPipe face tracking needs the EGL/GLES system libraries.
if ! ldconfig -p | grep -q 'libEGL.so.1'; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1 || {
    apt-get update -q >/dev/null 2>&1
    apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1
  }
fi

# Builds the skill's Python venv (numpy, opencv, pillow, mediapipe); prints READY when done.
bash "$CLAUDE_PROJECT_DIR/.claude/skills/effects/scripts/setup.sh"

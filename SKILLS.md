# Skills and tools used for the video projects

These load automatically from `.claude/skills/` in any session on this repo:

| Skill | What it does | Source |
|---|---|---|
| `lemo-opuscar` | Code-rendered short films in 60+ styles (paper, woodcut, engraving, dark keynote, etc.) | https://github.com/lemomo-ai/lemo-opuscar |
| `remotion-*` (5 skills) | Remotion animation know-how: captions, transitions, 3D, rendering | https://github.com/remotion-dev/skills |
| `effects` | 42 talking-head video effects | https://github.com/Vibha-Ramprakash/claude-video-effects |

The Lemo-Opuscar *library* (render engine, voices, sampler) lives outside the repo at
`/root/lemo-opuscar`. The cloud environment's setup script installs it in each new session.

Voice: Fish Audio (network secret on api.fish.audio). Film sources are in `films/`.

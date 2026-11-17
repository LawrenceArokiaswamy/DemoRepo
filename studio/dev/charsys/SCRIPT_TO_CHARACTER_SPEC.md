# Script → characters: extraction and reuse specification

**Pipeline:**
```
SCRIPT → identify characters → LOOKUP (reuse) → new design only if needed → OWNER APPROVAL → rig/assets → blocking → animation → render
```

## 1. Identify the characters (Claude, per script)
- List every **on-screen** character: named, described ("a guard"), or implied by the action ("someone knocks" may stay off-screen; decide and note it).
- Merge mentions of the same person.
- For each character, fill this record, using **only** what the script or research supports:

| Field | Source and rule |
|---|---|
| `id` | lowercase snake_case, stable across episodes (`theo`, `marcus_legionary`) |
| `name`, `aliases` | from the script; aliases are the ways the script refers to them |
| `age`, `life_stage` | stated or implied (child / teen / young adult / adult / elderly); otherwise `adult` |
| `gender_presentation` | **only if specified or clearly implied**; otherwise leave neutral and choose neutral defaults |
| `period`, `region` | the episode's setting, **as specific as possible** (century, decade, place) |
| `occupation`, `role` | from the script |
| `clothing`, `accessories` | the script first, then period research (§3), then neutral defaults |
| `hair`, `facial_hair`, `age_features` | as above; age features follow `life_stage` (wrinkles, posture) |
| `build` | `adult` / `slim_tall` / `stocky` / `elderly` / `child`, plus `body_overrides` when the story needs it (e.g. "a giant of a man") |
| `personality`, `motion` | how they move and react (`young_adult` / `elderly` / `child` / `soldier` / `poised`, or a new preset) |
| `unique_features` | anything the story depends on (a scar, an eyepatch, a lantern) |
| `uncertain` | every detail chosen without direct evidence, so the owner can see it |

**Defaults policy:**
- Choose plain, neutral defaults.
- Do not add stereotyped traits (accent props, exaggerated ethnic or gender markers) that the story doesn't need.
- Distinguish characters through **silhouette** (build, height, costume shape), **palette** and **face tuning**, not caricature.

## 2. Look up before designing (mandatory)
- `python3 studio/dev/charsys/lookup.py "<name / aliases / description>"`.
- **An approved match → REUSE it**, the same id and version. Costume variants (e.g. Theo in a coat) become a new **version or outfit** of the same id, never a new person.
- **A draft match → ask the owner:** reuse or design anew.
- **No match → draft a new `character.json`** from existing components, render its sheet and submit it for approval.
- **Never silently create a replacement** for an existing character.

## 3. Historical research (historical episodes)
- Research the **specific century, place and role**: clothing, armour, headgear, footwear, hair and beard fashion, accessories, status markers.
- Record the sources in `source.references` and the unresolved points in `source.uncertain`.
- **Example (done):** legionary c. AD 100–115.
  - Lorica segmentata (in use from the early 1st century AD to the mid-3rd).
  - Imperial-type helmet, focale, cingulum with apron, gladius on the right.
  - Caligae.
  - Clean-shaven (beards became common later, under Hadrian).
  - No crest for a legionary in battle.
  - Uncertain: tunic colour, shield blazon.
- Not "a generic gladiator".
- Keep the house style: distinctions come through shape and colour, not texture detail.

## 4. Output
- `library/<id>/character.json` (schema below).
- `library/<id>/turnaround_expressions.png`, rendered.
- A short approval request: who, why new, what was assumed, cost (0 credits for assembled characters).

## 5. `character.json` schema
- `id`, `name`, `aliases[]`, `version`, `status` (`draft` | `approved` | `retired`), `description`.
- `attributes{age, life_stage, gender_presentation, period, region, occupation, role}`.
- Body and motion:
  - `build`, `body_overrides{}`, `scale`;
  - `motion` (the preset name).
- Components:
  - `garment`, `hair`, `facialHair`, `footwear`, `headgear?`, `glasses?`, `earrings?`, `prop?`;
  - `raster?{hair_front, hair_34, torso, torso34}` (approved raster parts).
- Look:
  - `colors{skin, main, sleeve?, hair, brow?, shoe, …garment-specific}`;
  - `face{wide, eyeSize, eyeSep, eyeY, sparkle, browThick, browW, mouthW, mouthY, wrinkles, blush}`;
  - `line_art{…}` (the shared house spec).
- Provenance: `source{script, references[], uncertain[]}`.

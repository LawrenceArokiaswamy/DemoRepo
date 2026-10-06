# 31 Carnegie Dr listing reel — working notes

Photos-only listing reel in the style of the "3173 Sunflower" sample: depth-parallax camera moves,
whip transitions, 3D text placed in rooms, before/after virtual staging, map, AI voiceover, music.
Branding: Nayaki Penumarthy, Royal LePage Certified Realty. ~60s, 9:16, 1080p.

## Inputs
- Listing photo zip (84 files, FVM001–FVM084, 2048x1365). Not committed (re-attach in a new session).
- Listing facts: C$1,599,000 · 4 bed · 4 bath · ~3,088 sq ft above grade · Seven Oaks, Oakville ·
  great room w/ gas fireplace · centre island + walk-in pantry · primary w/ ensuite + WIC ·
  2nd-floor laundry · double garage · near parks, schools, shopping, OTMH, 403/407/QEW.

## Shot list (photo → scene)
001 facade · 005 steps · 013 foyer · 016 stairs · 020 dining · 024 great room (staged) · 026 breakfast (staged) ·
033 kitchen · 037 cooktop · 038 appliances · 042 pantry · 045 primary · 053 ensuite · 049 tub · 051 shower ·
056 bedroom (staged) · 072 office · 069 laundry · 009 backyard.
Depth maps: `python3 -I scripts/depth.py da2s.onnx depth/ raw/FVM0xx.jpg ...`
(Depth Anything V2 small ONNX: huggingface.co/onnx-community/depth-anything-v2-small, onnx/model.onnx).

## Higgsfield (Starter plan; Kling Pro needs Plus → using Kling std 720p)
Budget approved: 50 credits. Spent so far: 12.25 (3 staging × 2, 1 Kling std × 6.25).
Media IDs: FVM026 f0528d25-e4d2-4417-92c5-8aef8afa67af · FVM056 aa1ce50c-a3f9-483d-b8ef-3c16ba693337 ·
FVM024 7ae73384-49a6-46bd-8e00-db1d99133733 · hero_001 3a7274c6-8b5e-4ccc-be9f-078ce7fb9aee ·
hero_033 06a0195e-4511-4072-95d0-9ec5d2559832 · hero_045 b71624f9-2d95-4e73-b5c8-048c79b8662b
(hero crops: crop=768:1365:X:0 → 1080x1920; X 001=470, 033=760, 045=640).
Jobs: staged 026 265a5c96-104a-435d-9af3-a0e55fb9eb7f · staged 056 53619f8c-462c-40fb-a717-54ce01339698 ·
staged 024 bc3565d5-ef25-47d2-bafb-33bcfe8e63c5 · Kling facade d3d38cbb-29c5-476e-b3be-7fcc60fb7936.
To do: Kling std for kitchen, primary, staged great room (~18.75 credits).
Downloads need network access to d8j0ntlcm91z4.cloudfront.net; uploads need upload.higgsfield.ai.

## Script (draft, AI voice via Fish Audio, env FISH_API_KEY)
Some homes make you choose — space or location. 31 Carnegie gives you both.
Over three thousand square feet in Oakville's Seven Oaks. Soaring ceilings. Hardwood throughout.
A great room built around the fire. A kitchen island big enough for everyone's opinions — and a walk-in pantry to match.
Upstairs, a primary retreat with a spa ensuite. Four bedrooms. Laundry right where it belongs.
Minutes to parks, schools, Oakville Trafalgar hospital, and the 403, 407 and QEW.
Some homes knock quietly. This one won't wait. 31 Carnegie Drive — call Nayaki today.

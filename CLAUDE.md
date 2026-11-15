# Project instructions

## Video production (mandatory)
Before beginning any video production task, read `STUDIO_PRODUCTION_BIBLE.md` and the relevant episode production records (`studio/episodes/`). Follow the documented creative standards, production workflow, budget constraints, and quality gates. Record meaningful decisions and update the documentation after completing production milestones.

## Standing rules
- Never spend Higgsfield credits or add paid services without the owner's explicit approval; quote costs first (`get_cost: true`).
- Never publish anything; deliver to the owner for approval.
- Every finished episode follows the permanent workflow and mandatory release gate (Bible §H). It gets a complete publishing package in `studio/final_videos/EPxx_Name/` (Bible §K): thumbnail, vertical cover, 3 titles, description, exactly 5 hashtags, tags, metadata. Only approved, upload-ready videos go in `final_videos/`; videos are not auto-committed (`*.mp4` gitignored there).
- Treat Claude usage as a limited production resource: reuse tools, batch renders, no unneeded redesign or research cycles (Bible §J).
- The topic backlog (`studio/content/backlog.json`) is permanent: never remove or silently replace topics.
- Keep committed files under 50 MB; full-quality masters stay out of git.

# Plan

Approved by Morgan on 2026-10-31. Rules are in `docs/DECISIONS.md` (D-003 to D-011); this file holds the build order and how each step is checked.

Planning pages (answers saved in each page's database):
- Round 1: https://claude.ai/artifact/TmJCuUPdreS2mc57AmVgk6 (summary: `docs/planning/round1-answers.md`)
- Review 1 and round 2: https://claude.ai/artifact/HJtJeNtgCbPRjDRkw5Dooz
- Final plan and approval: https://claude.ai/artifact/5aAstu32A4aXw875Es5Grc

## Steps to the first playable version

1. **Engine core.** Board, units, movement, combat, both Commander damage presets, deck, hand, energy, initiative, deck-out damage, seeded random streams, action log, unit tests and one determinism test. Morgan checks: a short summary page and a written play-by-play of one match.
2. **Harness + AI.** Rule-based AI that sees only its own information; batch runner with seat swapping and action/round caps; report against the D-008 targets for both presets. Morgan checks: the report page.
3. **Content.** Two factions × 8 cards as data entries; Stone Wall, Forest, a grow card, one structure, one equipment. Tune until the harness meets the targets. Morgan checks: card list page and tuned report.
4. **Phone UI.** Layout A, long-press inspect, autosave per action, desktop scaling, art from the private art repo, Vercel deploy from `main`, rename decision. Morgan checks: full matches on the phone against the AI; findings recorded (only Morgan's playtests decide "fun").

## Later, in rough order

Commander abilities; attack previews and combat log; escalation if the harness shows long games; replay viewer; one elemental terrain interaction; hotseat; guided first match; more factions; constructed decks or a roguelite run.

## How we work

One branch and draft PR per step. Local checks before every push. HANDOFF at every checkpoint. Rule changes update DECISIONS in the same change. Design forks go to Morgan; small choices are made and reported.

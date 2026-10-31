# Handoff

Updated: 2026-10-31. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Phase 2, harness + AI (`docs/plan.md`). Rules: DECISIONS D-003 to D-011; engine defaults D-012 (Proposed).

## Just done

- 2026-10-31 Phase 2: rule-based AI (`src/ai/`, sees only its own information), harness (`src/sim/`), `npm run sim`. Report `docs/reports/phase2-harness.md`: both presets meet the combat-end and median-round targets; breach first-player win rate is 35% because of the round 1 energy bonus (53% without it).
- 2026-10-31 Phase 1 engine core: `src/engine/` (board, movement, combat, both Commander presets, deck/hand/energy/initiative, deck-out, seeded RNG, action log, replay), 32 tests, sample match in `docs/reports/phase1-sample-match.md`. PRs #1 and #2 merged.
- 2026-10-31 Final plan approved; DECISIONS D-003 to D-011 and `docs/plan.md` written. Planning pages are linked from the plan.
- 2026-10-31 Repo bootstrapped: AI-Master-Instructions v0.5.0 (core, node-web, game), concept v0.2 added, drift-check CI.

## Next

1. Merge the phase 2 PR when CI is green (Morgan's standing go-ahead, AGENTS.md).
2. Phase 3: two factions × 8 cards as data (Ironbound, Verdant), Stone Wall, Forest + grow card, one structure, one equipment; extend the engine for terrain/structure/equipment cards; tune to the D-008 targets with `npm run sim`.

## Open questions

- Round 1 energy bonus (D-005): drop or change it? Measured: breach first-player win 35% with it, 53% without (placeholder cards). Recheck with phase 3 cards.
- Private art repo (D-011): this session's GitHub access cannot create repos (403). Morgan creates a private `riftfront-art` repo; needed by phase 4.
- Vercel project (D-010): set up at phase 4, deploying from `main` only.

## Decisions since the last plan update

- 2026-10-31 D-001 to D-011 accepted (plan approval). D-012 engine defaults Proposed.
- 2026-10-31 Morgan: Claude may open and merge PRs once a design is approved and checks pass.

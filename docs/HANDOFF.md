# Handoff

Updated: 2026-10-31. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Phase 3, content (`docs/plan.md`). Rules: DECISIONS D-003 to D-011, D-014; engine and content rules D-012, D-013 (Proposed).

## Just done

- 2026-10-31 Phase 3: Ironbound and Verdant (8 cards each, `src/content/factions.ts`); engine support for walls, Forest, Woodland, Siege, structures, equipment (D-013); tuned 3 cards (D-014). Reports: `docs/reports/phase3-harness.md`, `phase3-cards.md`, `phase3-sample-match.md`. PRs #3 and #4 merged.
- 2026-10-31 Phase 2: rule-based AI (`src/ai/`, sees only its own information), harness (`src/sim/`), `npm run sim`. Report `docs/reports/phase2-harness.md`: both presets meet the combat-end and median-round targets; breach first-player win rate is 35% because of the round 1 energy bonus (53% without it).
- 2026-10-31 Phase 1 engine core: `src/engine/` (board, movement, combat, both Commander presets, deck/hand/energy/initiative, deck-out, seeded RNG, action log, replay), 32 tests, sample match in `docs/reports/phase1-sample-match.md`. PRs #1 and #2 merged.
- 2026-10-31 Final plan approved; DECISIONS D-003 to D-011 and `docs/plan.md` written. Planning pages are linked from the plan.
- 2026-10-31 Repo bootstrapped: AI-Master-Instructions v0.5.0 (core, node-web, game), concept v0.2 added, drift-check CI.

## Next

1. Merge the D-005 bonus PR when CI is green (Morgan's standing go-ahead, AGENTS.md).
2. Phase 4: phone UI (layout A, long-press inspect, autosave per action), React + Vite, Vercel deploy from `main`. Morgan created the private `riftfront-art` repo and approved creating the Vercel project.

## Open questions

- Unblocked Lane favours Ironbound 62–64% (walls shut lanes). Morgan: leave it for now; breach is the default.
- Vercel project (D-010): set up at phase 4, deploying from `main` only.

## Decisions since the last plan update

- 2026-10-31 D-001 to D-011 accepted (plan approval). D-012 engine defaults Proposed.
- 2026-10-31 D-005 revised: round 1 energy bonus dropped (Morgan). Working title stays "Riftfront".
- 2026-10-31 Morgan: Claude may open and merge PRs once a design is approved and checks pass.

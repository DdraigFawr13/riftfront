# Handoff

Updated: 2026-10-31. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Phase 1, engine core (`docs/plan.md`). Rules: DECISIONS D-003 to D-011; engine defaults D-012 (Proposed).

## Just done

- 2026-10-31 Phase 1 engine core: `src/engine/` (board, movement, combat, both Commander presets, deck/hand/energy/initiative, deck-out, seeded RNG, action log, replay), 32 tests, sample match in `docs/reports/phase1-sample-match.md`. PR #1 merged.
- 2026-10-31 Final plan approved; DECISIONS D-003 to D-011 and `docs/plan.md` written. Planning pages are linked from the plan.
- 2026-10-31 Repo bootstrapped: AI-Master-Instructions v0.5.0 (core, node-web, game), concept v0.2 added, drift-check CI.

## Next

1. Merge the phase 1 PR when CI is green (Morgan's standing go-ahead, AGENTS.md).
2. Phase 2: rule-based AI (own information only, separate seeded stream) and the batch harness with seat swapping; report rounds, end causes and first-player rate against the D-008 targets for both presets.

## Open questions

- Private art repo (D-011): this session's GitHub access cannot create repos (403). Morgan creates a private `riftfront-art` repo; needed by phase 4.
- Vercel project (D-010): set up at phase 4, deploying from `main` only.

## Decisions since the last plan update

- 2026-10-31 D-001 to D-011 accepted (plan approval). D-012 engine defaults Proposed.
- 2026-10-31 Morgan: Claude may open and merge PRs once a design is approved and checks pass.

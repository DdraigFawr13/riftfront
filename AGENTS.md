# Agent instructions

Riftfront is a browser-first 1v1 tactical card battler: decks, Commanders, four lanes on an 8x4 grid, and mutable terrain. Owner: Morgan. Stage: plan approved 2026-10-31 (`docs/plan.md`); phase 1, engine core, is next.

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/plan.md`: build steps. `docs/concept.md` is the original proposal; DECISIONS overrides it.

## Local checks (run before pushing)

- Every push: `node .claude/master/sync.mjs --check`.
- Once code exists, the npm check script is added here and to CI.

## What CI runs

- **CI** (`ci.yml`): the master drift check on every PR update and `main` push. Markdown-only changes skip it.
- **Prune merged branches** (synced): deletes merged PR branches.
- No deploys yet.

## Project rules

- The concept doc is a proposal, not a spec. Only entries in DECISIONS are settled; tunable values (breach columns, HP, costs) stay config, not constants.
- Commander damage mode (`territorial_breach` | `unblocked_lane`) is a rules preset, never hard-coded into card effects. Why: the owner wants both compared in playtest (concept section 15).

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.

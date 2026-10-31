# Agent instructions

Riftfront is a browser-first 1v1 tactical card battler: decks, Commanders, four lanes on an 8x4 grid, and mutable terrain. Owner: Morgan. Stage: plan approved 2026-10-31 (`docs/plan.md`); phase 4 (phone UI) in progress.

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/plan.md`: build steps. `docs/concept.md` is the original proposal; DECISIONS overrides it.

## Local checks (run before pushing)

- Every push: `npm run check` (Prettier check, typecheck, Vitest), `npm run build` (includes the 90 KB first-load budget) and `node .claude/master/sync.mjs --check`.
- UI changes: `npm run dev`, then look at it at 844×390 (phone landscape) before calling it done (VER-06).
- Play-by-play of a seeded Ironbound vs Verdant match: `npm run sample -- <seed> [territorial_breach|unblocked_lane]`. Card list: `npm run cards`.
- AI-vs-AI report for both presets (about 1.5 min for 400 games each): `npm run sim -- [games] [seedStart]`. Run it locally, never in CI (CI-04).

## What CI runs

- **CI** (`ci.yml`): `npm ci`, drift check, `npm run check` and `npm run build` on every PR update and `main` push. Markdown and `docs/` changes skip it.
- **Prune merged branches** (synced): deletes merged PR branches.
- **Deploys:** Vercel project `riftfront` (team Golden Goose Engineering Group) at https://riftfront-golden-goose-engineering-group.vercel.app, not linked to Git. After each merge to `main`, Claude deploys that merge commit to production through the Vercel API and checks the live bundle hash matches a local build of the same commit (CI-05). No preview deploys.

## Project rules

- The concept doc is a proposal, not a spec. Only entries in DECISIONS are settled; tunable values (breach columns, HP, costs) stay config, not constants.
- Commander damage mode (`territorial_breach` | `unblocked_lane`) is a rules preset, never hard-coded into card effects. Why: the owner wants both compared in playtest (concept section 15).

- The engine (`src/engine/`) is pure TypeScript: no UI, DOM, clock or `Math.random` imports (GAME-01, GAME-02).
- Edits to files Prettier has formatted: use the Edit tool or re-read the file first, and fail loudly when a replacement matches nothing (LESSONS "tooling", ×2).
- Merging: once Morgan has approved a design, Claude opens the PR for it and merges it when checks pass. (Morgan, 2026-10-31)

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.

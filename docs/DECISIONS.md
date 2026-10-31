# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

All numbers below are starting values held in config; the harness and playtests may tune them (a tuned value updates its entry). Source of each: the planning forms linked in `docs/plan.md`.

## D-001 Commander damage: breach first, unblocked lane kept

- **Status:** Accepted (2026-10-31)
- **Decision:** The default preset is Territorial Breach (rules in D-004). Unblocked Lane stays available as a configurable preset for comparison.
- **Why:** Morgan's choice in concept v0.2 section 15; breach should make board position matter, but may only make matches longer, so both stay testable.

## D-002 Everything else in the concept is Proposed

- **Status:** SUPERSEDED by D-003 to D-011 (2026-10-31): the plan was approved on the final planning page.
- **Decision:** All other content of `docs/concept.md` was Proposed until approved in the workshop.
- **Why:** the concept was exploratory.

## D-003 Match shape

- **Status:** Accepted (2026-10-31)
- **Decision:** Target 10–15 minutes per match against the AI. Commander 20 HP. Both Commanders at 0 in the same combat is a draw.
- **Why:** round 1. 25 HP with breach at column 7 was estimated to overshoot the target length.

## D-004 Breach rules

- **Status:** Accepted (2026-10-31)
- **Decision:** A unit damages the enemy Commander when it stands in column 6 or beyond (left player) / column 3 or below (right player), is eligible to attack, and has no blocker ahead in its lane. Blockers: enemy units, enemy structures, Stone Walls, any terrain that blocks movement. Damage equals the unit's Attack, every round it stays unblocked. A player cannot deploy into a lane ahead of an enemy intruder in that lane. Ranged units obey the same threshold.
- **Why:** rounds 1 and review 1. Without the deploy restriction the defender's own deploy zone sits ahead of every intruder, so one cheap card per round blocks any breach.

## D-005 Round structure and initiative

- **Status:** Accepted (2026-10-31)
- **Decision:** Each round: both draw 1; energy refills (starts 2, +1 per round, cap 8); players alternate single actions (play a card, reposition or re-stance a unit, or pass); passing locks you out for the round; then movement, simultaneous combat, cleanup. Initiative alternates each round; the second player in round 1 gets +1 energy that round. Undo only cancels targeting before confirming.
- **Why:** rounds 1 and review 1. Pass lockout stops both players waiting each other out; alternating initiative plus the round 1 bonus offsets acting order.

## D-006 Decks, hand and anti-stall

- **Status:** Accepted (2026-10-31)
- **Decision:** 16-card decks (8 unique × 2). Opening hand 5, with one redraw of any cards. When the deck is empty, each missed draw deals rising damage to that Commander (1, 2, 3…). This is the only anti-stall in the first version; escalating damage is added only if the harness shows long games.
- **Why:** review 1 and final page. 8–12 cards across 18–24-card decks forced 3–6 copies each. Estimate: the deck empties around round 12 and an untouched Commander falls around round 17.

## D-007 Movement and combat

- **Status:** Accepted (2026-10-31)
- **Decision:** Melee units auto-advance when they have no target and the next tile is free; each unit's stance can be changed. Ranged units hold. When two enemy units both want the same empty tile, the initiative holder takes it. One Range stat (Reach is range 2). Targets come from one board snapshot; damage is simultaneous; no automatic retaliation. Guard takes an attack aimed at a friendly unit in the same column of an adjacent lane. Lanes are the core; only specific abilities cross lanes.
- **Why:** rounds 1 and review 1. The round 1 collision rule ("fight across the gap") deadlocked at melee range 1 (LESSONS).

## D-008 Build order and simulation

- **Status:** Accepted (2026-10-31)
- **Decision:** Build in order: engine core, simulation harness + rule-based AI, content, phone UI. The AI sees only what a player sees. Shuffling and AI use separate seeded random streams; every match is a seed plus an action log (replay viewer later). Harness swaps seats and caps actions and rounds. Tuning targets: at least 60% of games end by breach, first player wins 45–55%, median 8–10 rounds.
- **Why:** rounds 1 and review 1. Measures pacing in both presets before any UI; targets define "working" before tuning.

## D-009 First-version content

- **Status:** Accepted (2026-10-31)
- **Decision:** Ironbound vs Verdant, 8 unique cards each (placeholder names until the setting pass). Stone Wall, Forest and a grow-a-forest card; one structure and one equipment card. Later: Commander abilities, attack previews and combat log, elemental terrain.
- **Why:** review 1. Verdant's identity is terrain, so Forest is pulled into the first version.

## D-010 Platform and stack

- **Status:** Accepted (2026-10-31)
- **Decision:** Phone landscape first; desktop also works. Layout A: board left, hand stacked right; long-press to inspect. Autosave after every action. TypeScript; the engine is a pure TS module with no UI imports; React + Vite UI; Vitest. Playtest builds deploy to Vercel from `main` at phase 4.
- **Why:** rounds 1, review 1 and final page. Phones evict background tabs, so matches must resume.

## D-011 Setting, style and art

- **Status:** Accepted (2026-10-31)
- **Decision:** Setting: The War Table, two map-makers commanding toy armies on a living map whose terrain is inked onto it. Style: ink and paper (map, parchment, stamped tokens). Art lives in a separate private repo with a per-asset licence ledger; each licence must allow use in a published web game. "Riftfront" is the working title; rename at phase 4.
- **Why:** review 1 and final page. This repo is public, and many free packs forbid sharing raw files.

## D-012 Engine details chosen in phase 1

- **Status:** Proposed (2026-10-31). Small forks picked as defaults (WS-02); the harness or Morgan can change any of them.
- **Decision:**
  - A unit card defaults to "hold" if its range is 2 or more, otherwise "advance".
  - Reposition is one tile forward or back in the unit's own lane, once per round, not on the deploy round; lanes stay fixed (D-007).
  - Changing stance costs an action.
  - A breaching unit attacks the Commander rather than a unit.
  - Ranged units have no minimum range yet, and no unit attacks enemies behind it.
  - When two Guards could intercept, the lower lane does; each Guard intercepts once per round.
  - Both players draw in round 1.
  - Energy refills each round and does not carry over.
  - Safety caps: 40 actions per round, and a draw after 40 rounds.
- **Why:** the concept left these open; each is the simplest version consistent with D-004 to D-007.

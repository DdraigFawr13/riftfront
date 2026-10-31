# Riftfront round 1 answers (owner: Morgan), 2026-10-31

Context: 1v1 tactical card battler, browser. 8 columns x 4 lanes. Left deploys cols 1-3, right cols 6-8, cols 4-5 neutral. Commander sits off-board. Units have Attack, Health, Range, Move; persistent damage. Round: refresh (draw 1, energy), planning (players alternate single actions until both pass), movement (melee auto-advances when no target and next tile free; ranged holds), combat (all targets picked from one snapshot, damage simultaneous, no free retaliation, units hit nearest enemy ahead in lane), cleanup. Summoning fatigue unless Rush. Territorial Breach: a unit that reaches the breach column with no enemy defender ahead in its lane damages the enemy Commander. Alternative preset: Unblocked Lane (damage from anywhere if lane is empty). Decks 18-24 cards for MVP, 2 factions (armor/guard faction vs growth/terrain faction). Concept doc header says "desktop-oriented UI that can adapt to tablets".

Answers:
- Match length vs AI: 10-15 minutes
- Breach column: 6 for left attacker / 3 for right attacker (first enemy deploy column)
- Commander HP: 20
- Anti-stall: escalating Commander damage after round N
- Both Commanders reach 0 in same combat: draw
- Passing: pass locks you out for the rest of the round
- Turn model: alternating single actions
- Undo: cancel targeting before confirming only
- Energy: starts 2, +1 per round, cap 8
- Melee: auto-advance, stance changeable per unit
- Head-on collision for one empty tile: neither moves, they fight across the gap next round
- Reach merged into one Range stat
- Guard: protects units in adjacent lanes
- Blockers that stop a breach in their lane: enemy units, enemy structures, Stone Wall terrain, any terrain that blocks movement
- Lanes: units mostly stay in lane, "lanes are the point" (note: "although some abilities can move across lanes")
- First build: engine + AI-vs-AI simulation harness, then UI
- Priorities NOW: simulation runner, board/movement/combat/breach (both modes), 8-12 cards 2 factions, rule-based AI, seeded replays. SOON: commander abilities, terrain (forest, wall, one elemental), structures and equipment, attack previews and combat log. LATER: local hotseat, guided first match.
- Main device for first playtests: phone, landscape
- Art: free-licence art packs
- Setting/tone: "Give me many concepts and options to pick from"
- Anything else / inspirations: blank

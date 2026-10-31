# RIFTFRONT — Game Concept & Prototype Proposal v0.2

> **Status note (2026-10-31):** this is the original v0.2 proposal, kept for reference. Where it differs, `docs/DECISIONS.md` wins.

**Status:** Exploratory design; territorial breach selected for the first playtest, with immediate unblocked-lane damage preserved as an alternative.  
**Genre:** 1v1 tactical card battler with mutable terrain, commanders, and deck customization.  
**Platform target:** Browser-first, desktop-oriented UI that can adapt to tablets.  
**Pitch:** Build a deck, command a faction, deploy creatures across four battle lanes, and reshape the board with spells, structures, and terrain. The first prototype tests winning by pushing units deep into enemy territory and damaging the opposing Commander; a simpler unblocked-lane damage rule remains available if playtesting favors it.

## 1. Design pillars

1. **Cards create tactics, not merely stats.** Placement, range, terrain, formations, and timing change card value.
2. **A small battlefield with meaningful decisions.** A fixed 8-column x 4-row grid is readable but permits tactical depth.
3. **Faction direction without rigid decks.** Commanders provide identity; neutral and limited off-faction cards allow experimentation.
4. **Combos across systems.** Units, equipment, statuses, spells, and terrain can interact; important interactions must be legible in the UI.
5. **Playable solo first.** Local human-vs-AI with deterministic rules precedes networked multiplayer.

## 2. Three design variants to test

- **Formation Battler:** Four lanes; front/middle/rear ranks. Minimal movement, automatic row combat. Easiest to implement and quickest to play, but grid depth may be underused.
- **Tactical Skirmish — recommended baseline:** 8x4 grid, unit movement and range, four lanes, deployable terrain and structures, alternating small action turns, simultaneous end-of-round attacks. More strategic depth without real-time networking.
- **Living Battlefield:** Add extensive terrain propagation, altered lines of sight, elemental transformations, and environmental control. Excellent potential for expansion, high complexity and testing cost.

Proposed hybrid: **Tactical Skirmish rules + a small, curated subset of Living Battlefield interactions.**

## 3. Board, Commander damage, and victory conditions

- Eight columns numbered 1–8, four rows (lanes) numbered 1–4.
- Left player deployment: columns 1–3. Right player deployment: columns 6–8. Columns 4–5 are contested neutral ground.
- One unit (or occupying structure) per tile; terrain modifiers can coexist with a unit. Terrain and units are independent layers.
- Each player has a **Commander/Core** outside the board with a proposed **25 health**. Reduce the opposing Commander to zero health to win.
- **Primary mode for first playtest — Territorial Breach:** A left-player unit must reach column **7 or 8** to attack the right Commander; a right-player unit must reach column **1 or 2** to attack the left Commander. The attacker must still be eligible to attack during that combat phase, and must have **no opposing defender ahead of it in the same lane**. These precise breach thresholds are recommended starting values, not locked balance values.
- **Both melee and ranged units obey the Commander breach threshold.** Range lets a ranged unit attack units at a distance; it does not let that unit snipe the Commander from its home side of the board.
- An opposing unit *behind* an intruder does not automatically cancel an otherwise valid Commander attack. It may still attack or intercept via a specific ability. Whether special Guard effects can protect a Commander across positions is left to playtest.
- **Explicit fallback — Unblocked Lane:** A ready unit can instead damage the opposing Commander from any column if its lane is unblocked, without needing to cross the board. This returns the game toward faster formation/card-centric play. The fallback is **preserved, not chosen**, and should be available as a rules preset during prototype testing.
- Keep Commander attack eligibility as a configurable rule (for example, `commanderDamageMode: "territorial_breach" | "unblocked_lane"`) rather than hard-coding it into card effects. Targeting, damage, victory, and combat logging should otherwise use the same underlying engine.
- Initial terrain: mostly clear tiles, with a small number of mirrored or neutral obstacles for fairness. No random map advantages in the first prototype.

## 4. Round structure (recommended)

1. **Refresh:** Both players draw 1 card, gain energy up to the round's maximum, reduce commander cooldowns, and resolve start-of-round effects.
2. **Planning actions:** Players alternate **one action at a time** until both pass. An action can play one card, reposition one unit, or activate a commander ability. Mana is spent for cards and commander skills; a limited action budget may be added after testing. Initiative alternates between players each round.
3. **Movement/advance:** As the initial hybrid behavior, melee and mobile units advance toward the opposing Commander when no valid target is available and the next tile is free; ranged/support units hold by default unless explicitly ordered forward. Speed is a separate unit stat (usually 1; mobile units may move 2). Lateral moves or overrides use a player action. Resolve movement with documented, deterministic ordering to avoid unit overlaps.
4. **Combat:** Determine all valid targets from a common board snapshot; each ready unit generates at most one attack. Apply attack damage simultaneously. There is **no automatic retaliation**; a defender damages its attacker only if its own attack targets that unit or a keyword grants a counterattack.
5. **Cleanup:** Resolve death, end-of-round effects, temporary terrain expiry, and win conditions.

**Explicit alternative for an early prototype:** Full player turns followed by simultaneous combat. It is faster to code but gives the second acting player more perfect information; alternate action turns are the preferred test.

## 5. Movement, attack ranges, and lane rules

- Each unit has separate **Attack, Health, Range, and Movement** properties. Default attacks prioritize the nearest valid enemy **ahead** in the same lane; attacks behind the unit may be allowed against nearby passed enemies if there is no eligible forward target. Special keywords permit vertical targeting, diagonals, area damage, or wider facing arcs.
- **Melee:** range 1 tile horizontally, usually Move 1, and automatic forward advance while no valid target is available. Strong at holding the front; susceptible to ranged units and kiting.
- **Reach:** range 2. Can attack from behind a friendly frontliner if its path is unobstructed or the keyword explicitly permits attacking over allies.
- **Ranged:** default maximum range 2–4; fires along the lane, normally at the nearest valid enemy. Holds position by default; player actions or spells can advance it to exploit a breach. Friendly units do not block shots by default; hostile units and solid cover do. Cannot use its standard ranged attack while adjacent to an enemy unless it has a special ability. The exact minimum range requires testing.
- **Flying:** ignores ground movement penalties and can bypass ground units while moving; it does not automatically ignore anti-air defenders or damage the Commander through an occupied lane.
- **Guard:** intercepts the first eligible hostile attack targeting another unit in that lane, subject to range.
- **Trample:** any damage beyond the target's remaining HP flows to the next valid defender, then the Commander only if the breach rule is met.
- **Piercing:** passes through a specified number of units or cover objects.
- **Flank:** changes lanes or attacks adjacent lanes under specified conditions.
- **Rush:** can move or attack on the round it is deployed, bypassing standard summoning fatigue.
- **Counterstrike:** responds to a received attack even if it has already attacked (explicit exception to the no-retaliation default).

**Playtest choice, not a permanent lock:** Hybrid movement (automatic melee/mobile advance, ranged hold, manual repositioning) is the recommended prototype behavior. Keep unit stance/advance policy data-driven to compare against more direct control if it feels too passive. Damage remains persistent between rounds unless healing or effects restore health. Attacks are resolved simultaneously, and defenders do not get free retaliation.

## 6. Card types

| Type | Role | Example |
|---|---|---|
| Unit | Occupies a tile, attacks and blocks | Iron Vanguard: 2 attack, 5 HP, Guard |
| Spell | One-shot instant or delayed effect | Chain Bolt: 2 damage, arcs through conductive terrain |
| Equipment | Modifies one unit | Hook Spear: grants Reach and +1 attack |
| Terrain | Modifies a tile or set of tiles | Thorn Grove: cover; burns when ignited |
| Structure | Stationary unit/board effect | Arc Tower: fires when a spell is played |
| Tactic | Alters attack sequence or movement | Forced March: advance friendly units in one lane |

Optional later types: traps, persistent enchantments, summons generated by other cards, artifacts attached to Commander, global weather, and quests/objectives.

## 7. Terrain interaction model

MVP terrain tags:

- **Forest:** partial cover against ranged attacks; flammable.
- **Stone Wall:** blocks movement and ranged line of sight; destructible.
- **Water:** slows normal movement; conducts electricity.
- **Conduit:** linked terrain capable of carrying lightning or magic effects.
- **Burning:** a temporary hazard that deals 1 damage at cleanup for two rounds.

Three initial combinations to verify: Fire + Forest -> Burning; Lightning + Water -> chain damage to occupants on connected water tiles; Stone Wall + Siege attack -> wall destruction and opened line. More systemic propagation should be postponed until these are understandable and fun.

## 8. Factions and commander prototypes

| Faction | Theme | Commander skill (proposed) |
|---|---|---|
| Ironbound Legion | Armor, Guard, equipment, fortifications | Fortify: grant nearby allied units 2 armor, 3-round cooldown |
| Verdant Covenant | Growth, terrain, healing, swarms | Overgrowth: grow a forest and summon a 1/1 sprout, 3-round cooldown |
| Ashen Pact | Fire, sacrifice, aggression, explosive terrain | Kindling: damage an ally to ignite its tile and nearby enemies, 3-round cooldown |
| Storm Archive | Spells, conduction, repositioning, precision | Surge: repeat or redirect the next lightning spell, 3-round cooldown |
| Umbral Court | Stealth, traps, resurrection, attrition | Reclaim: revive a low-cost fallen unit with reduced HP, 4-round cooldown |
| Skyborne Clans | Flying, mobility, reach, evasive raids | Tailwind: move two allied units and grant one Flying for a round, 3-round cooldown |

Suggested constructed deck rules for later testing: 30 cards; select one faction/Commander; at least 8 cards from that faction; unlimited neutral cards; up to 4 cards from one secondary faction; maximum 2 copies per non-unique card. Commander power also costs energy and has a cooldown. These limits are **placeholders** to stress-test meaningful faction identities and flexible building.

## 9. Sample combined interaction

A Verdant player creates a Thorn Grove in the center lane and positions an archer behind it. The grove provides partial cover. The Ashen opponent casts Ember Seed on the grove; it transforms into Burning and begins harming any unit standing there. The Verdant player uses Forced March to leave the tile and advance a frontliner into a breach position. Next round, the Ashen player can close the lane with a Stone Wall; the Verdant player can equip a Siege Hammer to destroy the wall and restore pressure.

The purpose of this example is to demonstrate that card value changes according to spatial context, not only card cost and raw attack power.

## 10. Deck format, progression, and modes

**Initial mode:** local single-player skirmish versus deterministic AI, using two fixed starter decks. No collectible economy or multiplayer server is required.

**Next mode:** constructed decks with faction/Commander selection, a card collection, deck validation, and adjustable AI difficulty.

**Optional later mode:** roguelite PvE run. Pick a faction and commander, begin with a smaller starter deck, draft one of several cards after each battle, acquire relics and card upgrades, then fight bosses whose terrain and lane mechanics change. This is a separate mode, not the definition of the core combat engine.

**Later still:** asynchronous or live PvP only after balance, deterministic simulation, reconnect handling, and authoritative turn validation are mature.

## 11. MVP / vertical slice

Build the smallest complete match that demonstrates tactical cardplay:

- 8x4 grid, 25-HP Commanders, 2 playable factions (Ironbound vs Verdant).
- Two fixed 18–24-card test decks; deck construction deferred.
- 8–12 unique cards initially covering basic melee, ranged, Guard, Reach, one equipment, two spells, terrain, and a structure.
- A single commander ability for each faction with cooldown and mana cost.
- Deterministic turn manager, movement, targeting, simultaneous damage, persistent unit health, death, breach and victory. Include both `territorial_breach` and `unblocked_lane` Commander attack rule presets so they can be compared without rewriting combat.
- Forest and wall terrain plus one elemental terrain interaction.
- Click-to-play cards, board highlights, attack previews, combat log, undo of uncommitted actions, and a simple rule-based AI.
- Unit tests for combat order, targeting, keywords, terrain interactions, both-side symmetry, and Commander damage under **both** breach and unblocked-lane rules.

**Exit criterion:** A full human-vs-AI match is understandable and enjoyable without requiring special explanations for every attack. Melee, ranged and terrain each produce meaningful tactical decisions.

## 12. Proposed implementation

Use a **pure TypeScript rules engine**, separate from rendering. A React + Vite application can host the UI, with CSS/SVG for the first board and PixiJS or a comparable renderer only if animations warrant it. Use Vitest to test deterministic game mechanics. Save game-state snapshots and an event/action log for replays, debugging, AI simulations and future multiplayer compatibility.

Suggested source boundaries:

```text
src/
  engine/       state, actions, turn phases, targeting, damage, movement, keywords
  content/      data-defined cards, factions, terrain, effects
  ai/           rules-based opponent and scoring
  ui/           board, cards, HUD, targeting previews, combat log
  tests/        combat scenarios, symmetry, interactions, match simulations
```

All card effects should use a consistent typed effect/trigger format where possible. Avoid allowing every new card to inject arbitrary UI logic into the rules engine. Avoid networking, monetization, and content production until the gameplay loop has been validated.

## 13. Design questions for the next workshop

1. Test whether **Territorial Breach** makes matches more tactically engaging or merely longer than **Unblocked Lane**. Keep both available; the user has chosen breach as the initial experiment, **not rejected** the fallback.
2. Is a breach threshold of column 7/2 appropriate, or should reaching the first enemy deployment column (6/3) suffice?
3. Does hybrid automatic advance feel purposeful, or would players prefer greater direct movement control?
4. Confirm how blockers, Guard, friendly units, and terrain affect Commander attack eligibility; define exceptions for Flying, Siege, and Piercing.
5. Would you rather begin with **constructed decks** or a **roguelite draft run** after validating combat? What is the desired match length: **10–15** or **20–30 minutes**?

## 14. Deliberately excluded from initial prototype

Online multiplayer; complex particle effects; procedural map generation; six complete factions; hundreds of cards; card packs or economies; AI-generated card content; extensive terrain chemistry; ranked PvP; crafting and permanent progression systems.

---

## 15. Decision log and handoff (2026-10-31)

**Confirmed player preference:** Try **Territorial Breach** first: units must advance into the opposing backfield to hurt the Commander. **Do not discard** the alternative in which an unblocked unit deals Commander damage without advancing; preserve it as a configurable fallback for later comparison.

**Working combat baseline:** 8×4 grid; four lanes; deployment columns 1–3 versus 6–8; contested columns 4–5; optional starting breach thresholds 7 (left attacker) and 2 (right attacker). Units have Attack, Health, Range, and Movement, with persistent damage. Melee typically advances on its own; ranged typically holds. Players can reposition units during alternating planning actions. Attacks are determined from a shared snapshot and damage is applied simultaneously; there is no free retaliation. Units ordinarily attack the nearest valid enemy ahead in their lane. All values are tunable, and the alternate direct-damage mode stays viable.

**Priority for the next chat:** Prototype the Commander damage predicate in both modes; demonstrate three or four concrete board states (open lane, defended lane, ranged behind melee, and a unit that has slipped past a defender) and validate movement/targeting edge cases. Then establish the actual phase timing, costs, and match pacing before building a large card pool.

**Recommendation for implementation approval:** Build the Tactical Skirmish vertical slice first. Keep Commander damage mode, breach depth, movement behavior, combat timing, terrain effects, faction restrictions, and deck progression configurable so testing can resolve open questions without a rewrite.

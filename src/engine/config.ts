import type { CommanderDamageMode } from "./types.ts";

/** Every tunable number lives here (AGENTS.md project rules). Columns and lanes are 0-indexed. */
export interface RulesConfig {
  columns: number;
  lanes: number;
  /** Deploy columns per player, inclusive range. */
  deployZone: [[number, number], [number, number]];
  /** Where a player may place terrain: their deploy zone plus the neutral columns (D-013). */
  terrainZone: [[number, number], [number, number]];
  /** First column (0-indexed) of the enemy backfield that counts as a breach, per attacking player. */
  breachColumn: [number, number];
  commanderDamageMode: CommanderDamageMode;
  commanderHp: number;
  startEnergy: number;
  energyPerRound: number;
  energyCap: number;
  /** Extra energy for the player acting second in round 1 (D-005). */
  secondPlayerRound1Bonus: number;
  openingHand: number;
  drawPerRound: number;
  /** Damage from the nth missed draw is n * deckOutStep (D-006). */
  deckOutStep: number;
  /** Safety caps for the harness (D-008); a capped round ends with both players passed. */
  maxActionsPerRound: number;
  maxRounds: number;
}

export const RULES_VERSION = "0.2.0";

/** D-003 to D-007 starting values. Breach at board columns 6 / 3 is index 5 / 2. */
export const DEFAULT_RULES: RulesConfig = {
  columns: 8,
  lanes: 4,
  deployZone: [
    [0, 2],
    [5, 7],
  ],
  terrainZone: [
    [0, 4],
    [3, 7],
  ],
  breachColumn: [5, 2],
  commanderDamageMode: "territorial_breach",
  commanderHp: 20,
  startEnergy: 2,
  energyPerRound: 1,
  energyCap: 8,
  secondPlayerRound1Bonus: 1,
  openingHand: 5,
  drawPerRound: 1,
  deckOutStep: 1,
  maxActionsPerRound: 40,
  maxRounds: 40,
};

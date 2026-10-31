/** Player 0 deploys on the left and advances toward higher columns; player 1 the reverse. */
export type PlayerId = 0 | 1;
export type Stance = "advance" | "hold";
export type CommanderDamageMode = "territorial_breach" | "unblocked_lane";

export interface UnitCard {
  id: string;
  name: string;
  faction: string;
  kind: "unit";
  cost: number;
  attack: number;
  health: number;
  range: number;
  move: number;
  /** Defaults to "hold" for range >= 2, else "advance". */
  stance?: Stance;
  keywords?: Keyword[];
}
export type Keyword = "guard" | "rush";
/** Phase 1 only has units; terrain, structures and equipment arrive with phase 3 content (D-009). */
export type Card = UnitCard;
export type CardDb = Readonly<Record<string, Card>>;

export interface Unit {
  uid: number;
  cardId: string;
  owner: PlayerId;
  lane: number;
  col: number;
  attack: number;
  health: number;
  range: number;
  move: number;
  stance: Stance;
  keywords: Keyword[];
  deployedRound: number;
  repositionedRound: number;
}

export interface Terrain {
  kind: string;
  /** Blocks movement, ranged fire and Commander attacks in its lane (D-004). */
  blocksMovement: boolean;
}

export interface PlayerState {
  hp: number;
  energy: number;
  deck: string[];
  hand: string[];
  discard: string[];
  missedDraws: number;
  mulliganed: boolean;
  passed: boolean;
}

export type EndReason = "commander" | "deckout" | "round_cap";
export interface Outcome {
  winner: PlayerId | "draw";
  reason: EndReason;
  round: number;
}

export interface MatchState {
  rulesVersion: string;
  config: import("./config.ts").RulesConfig;
  cards: CardDb;
  seed: number;
  /** State of the shuffle stream; the AI keeps its own stream (D-008). */
  shuffleRng: number;
  phase: "mulligan" | "planning" | "over";
  round: number;
  firstPlayer: PlayerId;
  initiative: PlayerId;
  active: PlayerId;
  actionsThisRound: number;
  players: [PlayerState, PlayerState];
  units: Unit[];
  /** Keyed by `${lane},${col}`. */
  terrain: Record<string, Terrain>;
  nextUid: number;
  outcome: Outcome | null;
  /** Commander damage dealt to each player, by source; the harness reports how games end from it. */
  damageTaken: [Record<string, number>, Record<string, number>];
  events: GameEvent[];
}

export type Action =
  | { type: "mulligan"; player: PlayerId; handIndexes: number[] }
  | { type: "play"; player: PlayerId; handIndex: number; lane: number; col: number }
  | { type: "stance"; player: PlayerId; uid: number; stance: Stance }
  | { type: "reposition"; player: PlayerId; uid: number; step: 1 | -1 }
  | { type: "pass"; player: PlayerId };

export type GameEvent =
  | { t: "round"; round: number; initiative: PlayerId }
  | { t: "draw"; player: PlayerId; cardId: string }
  | { t: "missed_draw"; player: PlayerId; damage: number }
  | { t: "energy"; player: PlayerId; energy: number }
  | { t: "mulligan"; player: PlayerId; count: number }
  | { t: "play"; player: PlayerId; cardId: string; uid: number; lane: number; col: number }
  | { t: "stance"; uid: number; stance: Stance }
  | { t: "reposition"; uid: number; from: number; to: number }
  | { t: "pass"; player: PlayerId }
  | { t: "action_cap"; round: number }
  | { t: "move"; uid: number; lane: number; from: number; to: number }
  | { t: "attack"; uid: number; target: number; damage: number; guardedBy?: number }
  | { t: "commander_hit"; uid: number; player: PlayerId; damage: number }
  | { t: "death"; uid: number }
  | { t: "end"; outcome: Outcome };

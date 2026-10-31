/** Player 0 deploys on the left and advances toward higher columns; player 1 the reverse. */
export type PlayerId = 0 | 1;
export type Stance = "advance" | "hold";
export type CommanderDamageMode = "territorial_breach" | "unblocked_lane";

interface CardBase {
  id: string;
  name: string;
  faction: string;
  cost: number;
  /** One line of rules text for the UI and reports. */
  text?: string;
}

/** A unit, or a structure: a unit that never moves (D-009). */
export interface UnitCard extends CardBase {
  kind: "unit" | "structure";
  attack: number;
  health: number;
  range: number;
  move: number;
  /** Defaults to "hold" for range >= 2, else "advance". */
  stance?: Stance;
  keywords?: Keyword[];
}
/**
 * guard: takes a hit aimed at a friend in the same column of an adjacent lane.
 * rush: acts on the round it is deployed. siege: double damage to walls and structures.
 * woodland: +1 attack while standing in Forest.
 */
export type Keyword = "guard" | "rush" | "siege" | "woodland";

export interface TerrainDef {
  kind: string;
  blocksMovement: boolean;
  /** Walls have health and can be attacked by the other player's units. */
  hp?: number;
  /** Damage removed from each ranged (range 2+) attack on a unit standing here. */
  rangedCover?: number;
}
export interface TerrainCard extends CardBase {
  kind: "terrain";
  terrain: TerrainDef;
  /** single: the target tile. column3: the target tile and the same column in adjacent lanes. */
  shape: "single" | "column3";
}
export interface EquipmentCard extends CardBase {
  kind: "equipment";
  mods: { attack?: number; health?: number; range?: number; keywords?: Keyword[] };
}
export type Card = UnitCard | TerrainCard | EquipmentCard;
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
  /** Structures never move, reposition or change stance. */
  structure: boolean;
  deployedRound: number;
  repositionedRound: number;
}

/** Terrain on a tile. Blocking terrain stops movement, ranged fire and Commander attacks (D-004). */
export interface Terrain extends TerrainDef {
  /** Who placed it; the other player's units can attack it if it has hp. */
  owner?: PlayerId;
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
  | { t: "terrain"; player: PlayerId; cardId: string; kind: string; lane: number; col: number }
  | { t: "equip"; player: PlayerId; cardId: string; uid: number }
  | { t: "stance"; uid: number; stance: Stance }
  | { t: "reposition"; uid: number; from: number; to: number }
  | { t: "pass"; player: PlayerId }
  | { t: "action_cap"; round: number }
  | { t: "move"; uid: number; lane: number; from: number; to: number }
  | { t: "attack"; uid: number; target: number; damage: number; guardedBy?: number }
  | { t: "attack_terrain"; uid: number; kind: string; lane: number; col: number; damage: number }
  | { t: "terrain_destroyed"; kind: string; lane: number; col: number }
  | { t: "commander_hit"; uid: number; player: PlayerId; damage: number }
  | { t: "death"; uid: number }
  | { t: "end"; outcome: Outcome };

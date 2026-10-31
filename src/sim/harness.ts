import { createRuleAi, type Ai } from "../ai/rule-ai.ts";
import {
  applyAction,
  createMatch,
  deriveSeed,
  type CardDb,
  type CommanderDamageMode,
  type EndReason,
  type PlayerId,
  type RulesConfig,
} from "../engine/index.ts";

export interface GameResult {
  seed: number;
  /** Which deck sat on the left; seats swap every other game (D-008). */
  leftDeck: "A" | "B";
  firstPlayer: PlayerId;
  winner: PlayerId | "draw";
  reason: EndReason;
  rounds: number;
  /** Total Commander damage dealt in the match, by source (breach, unblocked, deckout). */
  damageBySource: Record<string, number>;
}

export interface BatchOptions {
  games: number;
  seedStart?: number;
  cards: CardDb;
  decks: { A: string[]; B: string[] };
  config?: Partial<RulesConfig>;
  /** Hard cap on decisions per game, so a broken AI can't hang the harness. */
  maxDecisions?: number;
  makeAi?: (seed: number) => Ai;
}

export function runGame(seed: number, o: BatchOptions, swap: boolean): GameResult {
  const decks: [string[], string[]] = swap ? [o.decks.B, o.decks.A] : [o.decks.A, o.decks.B];
  let s = createMatch({ seed, cards: o.cards, decks, config: o.config });
  const make = o.makeAi ?? ((sd: number) => createRuleAi(sd));
  const ais = [make(deriveSeed(seed, "ai-0")), make(deriveSeed(seed, "ai-1"))] as const;
  const cap = o.maxDecisions ?? 5000;
  for (let i = 0; s.phase !== "over"; i++) {
    if (i >= cap) throw new Error(`Game ${seed} exceeded ${cap} decisions`);
    s = applyAction(s, ais[s.active].decide(s));
  }
  const outcome = s.outcome!;
  const damageBySource: Record<string, number> = {};
  for (const taken of s.damageTaken)
    for (const [k, v] of Object.entries(taken)) damageBySource[k] = (damageBySource[k] ?? 0) + v;
  return {
    seed,
    leftDeck: swap ? "B" : "A",
    firstPlayer: s.firstPlayer,
    winner: outcome.winner,
    reason: outcome.reason,
    rounds: outcome.round,
    damageBySource,
  };
}

export function runBatch(o: BatchOptions): GameResult[] {
  const start = o.seedStart ?? 1;
  return Array.from({ length: o.games }, (_, i) => runGame(start + i, o, i % 2 === 1));
}

export interface Summary {
  mode: CommanderDamageMode;
  games: number;
  medianRounds: number;
  meanRounds: number;
  roundsHistogram: Record<number, number>;
  /** Share of games ended by combat damage to a Commander (D-008 target: at least 60%). */
  combatEndRate: number;
  deckoutEndRate: number;
  roundCapRate: number;
  drawRate: number;
  /** First player's wins over decisive games (target 45–55%). */
  firstPlayerWinRate: number;
  deckAWinRate: number;
  damageShare: Record<string, number>;
}

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? (a[m] as number) : ((a[m - 1] as number) + (a[m] as number)) / 2;
};

export function summarize(mode: CommanderDamageMode, results: GameResult[]): Summary {
  const n = results.length;
  const rate = (f: (r: GameResult) => boolean) => results.filter(f).length / n;
  const decisive = results.filter((r) => r.winner !== "draw");
  const hist: Record<number, number> = {};
  for (const r of results) hist[r.rounds] = (hist[r.rounds] ?? 0) + 1;
  const dmg: Record<string, number> = {};
  for (const r of results)
    for (const [k, v] of Object.entries(r.damageBySource)) dmg[k] = (dmg[k] ?? 0) + v;
  const totalDmg = Object.values(dmg).reduce((a, b) => a + b, 0) || 1;
  const deckAWins = decisive.filter(
    (r) => (r.winner === 0 && r.leftDeck === "A") || (r.winner === 1 && r.leftDeck === "B"),
  ).length;
  return {
    mode,
    games: n,
    medianRounds: median(results.map((r) => r.rounds)),
    meanRounds: results.reduce((a, r) => a + r.rounds, 0) / n,
    roundsHistogram: hist,
    combatEndRate: rate((r) => r.reason === "commander"),
    deckoutEndRate: rate((r) => r.reason === "deckout"),
    roundCapRate: rate((r) => r.reason === "round_cap"),
    drawRate: rate((r) => r.winner === "draw"),
    firstPlayerWinRate: decisive.length
      ? decisive.filter((r) => r.winner === r.firstPlayer).length / decisive.length
      : 0,
    deckAWinRate: decisive.length ? deckAWins / decisive.length : 0,
    damageShare: Object.fromEntries(Object.entries(dmg).map(([k, v]) => [k, v / totalDmg])),
  };
}

/** D-008 tuning targets. */
export const TARGETS = {
  combatEndRate: 0.6,
  firstPlayerWinRate: [0.45, 0.55] as const,
  medianRounds: [8, 10] as const,
};

export function targetChecks(s: Summary): { name: string; value: string; ok: boolean }[] {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return [
    {
      name: "Games ended by combat (≥ 60%)",
      value: pct(s.combatEndRate),
      ok: s.combatEndRate >= TARGETS.combatEndRate,
    },
    {
      name: "First player wins (45–55%)",
      value: pct(s.firstPlayerWinRate),
      ok:
        s.firstPlayerWinRate >= TARGETS.firstPlayerWinRate[0] &&
        s.firstPlayerWinRate <= TARGETS.firstPlayerWinRate[1],
    },
    {
      name: "Median rounds (8–10)",
      value: String(s.medianRounds),
      ok: s.medianRounds >= TARGETS.medianRounds[0] && s.medianRounds <= TARGETS.medianRounds[1],
    },
  ];
}

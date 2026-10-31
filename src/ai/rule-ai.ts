import {
  applyAction,
  canAct,
  inBreachZone,
  laneBlockedAhead,
  legalActions,
  nextRandom,
  other,
  previewRoundEnd,
  type Action,
  type MatchState,
  type PlayerId,
  type Unit,
} from "../engine/index.ts";
import { observe, type Observation } from "./observe.ts";

/**
 * Scoring weights for the rule-based AI. Kept as data so the harness can compare variants;
 * they are starting guesses, not tuned values.
 */
export interface AiWeights {
  hp: number;
  unitPower: number;
  advance: number;
  breachThreat: number;
  /** Value of each own wall per point of its health. */
  wallHp: number;
  /** Value of each own Forest tile, plus the same again if a Woodland unit stands in it. */
  forest: number;
  /** A play must beat passing by this much, so the AI doesn't act for noise. */
  minGain: number;
}
export const DEFAULT_WEIGHTS: AiWeights = {
  hp: 3,
  unitPower: 1,
  advance: 0.25,
  breachThreat: 2,
  wallHp: 0.3,
  forest: 0.5,
  minGain: 0.01,
};

export interface Ai {
  decide(s: MatchState): Action;
}

/** Board value for player `me` after the round resolves: positive is good for `me`. */
export function evaluate(s: MatchState, me: PlayerId, w: AiWeights = DEFAULT_WEIGHTS): number {
  if (s.outcome) {
    if (s.outcome.winner === "draw") return 0;
    return s.outcome.winner === me ? 1e6 : -1e6;
  }
  const them = other(me);
  let score = (s.players[me].hp - s.players[them].hp) * w.hp;
  const unitValue = (u: Unit) => {
    const forwardCols = u.owner === 0 ? u.col : s.config.columns - 1 - u.col;
    let v = (u.attack + u.health / 2) * w.unitPower + forwardCols * w.advance;
    // A unit already in the breach zone with an open lane hits the Commander next round.
    if (canAct({ ...s, round: s.round + 1 }, u) && inBreachZone(s, u) && !laneBlockedAhead(s, u))
      v += u.attack * w.breachThreat;
    return v;
  };
  for (const u of s.units) score += u.owner === me ? unitValue(u) : -unitValue(u);
  // Terrain pays off over later rounds, which the one-round preview cannot see.
  for (const [key, t] of Object.entries(s.terrain)) {
    if (t.owner === undefined) continue;
    let v = 0;
    if (t.hp !== undefined) v = t.hp * w.wallHp;
    if (t.kind === "forest") {
      const [lane, col] = key.split(",").map(Number);
      const here = s.units.find((u) => u.lane === lane && u.col === col);
      v = w.forest + (here?.owner === t.owner && here.keywords.includes("woodland") ? w.forest : 0);
    }
    score += t.owner === me ? v : -v;
  }
  return score;
}

/**
 * Greedy one-step AI. For each candidate it previews the end of the round with the engine's own
 * movement and combat, then picks the best; ties break on its own seeded stream (D-008).
 * Candidates are plays, holding units switching to advance, and repositions; none of these can
 * cycle, so the AI always passes eventually.
 */
export function createRuleAi(seed: number, w: AiWeights = DEFAULT_WEIGHTS): Ai {
  let rng = seed;
  const pick = <T>(items: T[]): T => {
    const [r, next] = nextRandom(rng);
    rng = next;
    return items[Math.floor(r * items.length)] as T;
  };
  return {
    decide(s) {
      const obs = observe(s, s.active);
      return obs.state.phase === "mulligan" ? mulligan(obs) : plan(obs, w, pick);
    },
  };
}

function mulligan(obs: Observation): Action {
  const hand = obs.state.players[obs.me].hand;
  const cost = (id: string) => obs.state.cards[id]?.cost ?? 0;
  const cheap = hand.filter((id) => cost(id) <= 2).length;
  const handIndexes = cheap >= 2 ? [] : hand.flatMap((id, i) => (cost(id) >= 4 ? [i] : []));
  return { type: "mulligan", player: obs.me, handIndexes };
}

function plan(obs: Observation, w: AiWeights, pick: <T>(items: T[]) => T): Action {
  const s = obs.state;
  const me = obs.me;
  const pass: Action = { type: "pass", player: me };
  const base = evaluate(previewRoundEnd(s), me, w);
  let best: Action[] = [];
  let bestScore = base + w.minGain;
  for (const a of legalActions(s)) {
    if (a.type === "pass" || a.type === "mulligan") continue;
    if (a.type === "stance" && a.stance !== "advance") continue;
    const score = evaluate(previewRoundEnd(applyAction(s, a)), me, w);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = [a];
    } else if (Math.abs(score - bestScore) <= 1e-9) best.push(a);
  }
  return best.length ? pick(best) : pass;
}

import {
  blockedByIntruder,
  canAct,
  forward,
  inBounds,
  inDeployZone,
  other,
  terrainAt,
  unitAt,
} from "./board.ts";
import { DEFAULT_RULES, RULES_VERSION, type RulesConfig } from "./config.ts";
import { checkOutcome, resolveCombat, resolveMovement } from "./resolve.ts";
import { deriveSeed, nextRandom, shuffle } from "./rng.ts";
import type { Action, CardDb, MatchState, PlayerId, PlayerState } from "./types.ts";

export class IllegalActionError extends Error {}

export interface MatchSetup {
  seed: number;
  cards: CardDb;
  decks: [string[], string[]];
  config?: Partial<RulesConfig>;
}

export function createMatch(setup: MatchSetup): MatchState {
  const config = { ...DEFAULT_RULES, ...setup.config };
  for (const deck of setup.decks)
    for (const id of deck) if (!setup.cards[id]) throw new Error(`Unknown card ${id}`);
  let rng = deriveSeed(setup.seed, "shuffle");
  const [coin, afterCoin] = nextRandom(rng);
  rng = afterCoin;
  const firstPlayer: PlayerId = coin < 0.5 ? 0 : 1;
  const players = setup.decks.map((d) => {
    const [deck, next] = shuffle(d, rng);
    rng = next;
    const p: PlayerState = {
      hp: config.commanderHp,
      energy: 0,
      deck,
      hand: [],
      discard: [],
      missedDraws: 0,
      mulliganed: false,
      passed: false,
    };
    p.hand = p.deck.splice(0, config.openingHand);
    return p;
  }) as [PlayerState, PlayerState];
  return {
    rulesVersion: RULES_VERSION,
    config,
    cards: setup.cards,
    seed: setup.seed,
    shuffleRng: rng,
    phase: "mulligan",
    round: 0,
    firstPlayer,
    initiative: firstPlayer,
    active: firstPlayer,
    actionsThisRound: 0,
    players,
    units: [],
    terrain: {},
    nextUid: 1,
    outcome: null,
    damageTaken: [{}, {}],
    events: [],
  };
}

/** The one simulation function for preview and commit (GAME-02). Returns a new state. */
export function applyAction(state: MatchState, action: Action): MatchState {
  if (state.phase === "over") throw new IllegalActionError("The match is over.");
  if (action.player !== state.active) throw new IllegalActionError("Not this player's turn.");
  const s = structuredClone(state);
  const me = s.players[action.player];
  if (s.phase === "mulligan") {
    if (action.type !== "mulligan") throw new IllegalActionError("Mulligan first.");
    const idx = [...new Set(action.handIndexes)].sort((a, b) => b - a);
    if (idx.some((i) => i < 0 || i >= me.hand.length))
      throw new IllegalActionError("Bad hand index.");
    const returned = idx.map((i) => me.hand.splice(i, 1)[0] as string);
    const [deck, next] = shuffle([...me.deck, ...returned], s.shuffleRng);
    s.shuffleRng = next;
    me.deck = deck;
    me.hand.push(...me.deck.splice(0, returned.length));
    me.mulliganed = true;
    s.events.push({ t: "mulligan", player: action.player, count: returned.length });
    const o = other(action.player);
    if (!s.players[o].mulliganed) s.active = o;
    else startRound(s);
    return s;
  }
  if (action.type === "mulligan") throw new IllegalActionError("Mulligan is over.");
  if (me.passed) throw new IllegalActionError("This player has passed.");
  switch (action.type) {
    case "pass":
      me.passed = true;
      s.events.push({ t: "pass", player: action.player });
      break;
    case "play": {
      const cardId = me.hand[action.handIndex];
      const card = cardId ? s.cards[cardId] : undefined;
      if (!cardId || !card) throw new IllegalActionError("No such card in hand.");
      if (card.cost > me.energy) throw new IllegalActionError("Not enough energy.");
      const why = deployProblem(s, action.player, action.lane, action.col);
      if (why) throw new IllegalActionError(why);
      me.energy -= card.cost;
      me.hand.splice(action.handIndex, 1);
      const uid = s.nextUid++;
      s.units.push({
        uid,
        cardId,
        owner: action.player,
        lane: action.lane,
        col: action.col,
        attack: card.attack,
        health: card.health,
        range: card.range,
        move: card.move,
        stance: card.stance ?? (card.range >= 2 ? "hold" : "advance"),
        keywords: [...(card.keywords ?? [])],
        deployedRound: s.round,
        repositionedRound: 0,
      });
      s.events.push({
        t: "play",
        player: action.player,
        cardId,
        uid,
        lane: action.lane,
        col: action.col,
      });
      break;
    }
    case "stance": {
      const u = s.units.find((v) => v.uid === action.uid && v.owner === action.player);
      if (!u) throw new IllegalActionError("No such unit.");
      if (u.stance === action.stance) throw new IllegalActionError("Already in that stance.");
      u.stance = action.stance;
      s.events.push({ t: "stance", uid: u.uid, stance: u.stance });
      break;
    }
    case "reposition": {
      const u = s.units.find((v) => v.uid === action.uid && v.owner === action.player);
      if (!u) throw new IllegalActionError("No such unit.");
      if (!canAct(s, u)) throw new IllegalActionError("Units can't reposition on deploy.");
      if (u.repositionedRound === s.round) throw new IllegalActionError("Already repositioned.");
      const to = u.col + forward(u.owner) * action.step;
      if (
        !inBounds(s, u.lane, to) ||
        unitAt(s, u.lane, to) ||
        terrainAt(s, u.lane, to)?.blocksMovement
      )
        throw new IllegalActionError("Tile not free.");
      s.events.push({ t: "reposition", uid: u.uid, from: u.col, to });
      u.col = to;
      u.repositionedRound = s.round;
      break;
    }
  }
  s.actionsThisRound++;
  if (s.actionsThisRound >= s.config.maxActionsPerRound) {
    s.players.forEach((p) => (p.passed = true));
    s.events.push({ t: "action_cap", round: s.round });
  }
  const o = other(action.player);
  if (!s.players[o].passed) s.active = o;
  else if (!me.passed) s.active = action.player;
  else resolveRound(s);
  return s;
}

function deployProblem(s: MatchState, p: PlayerId, lane: number, col: number): string | null {
  if (!inBounds(s, lane, col) || !inDeployZone(s, p, col)) return "Outside your deploy zone.";
  if (unitAt(s, lane, col)) return "Tile occupied.";
  if (terrainAt(s, lane, col)?.blocksMovement) return "Terrain blocks this tile.";
  if (blockedByIntruder(s, p, lane, col)) return "Can't deploy ahead of an enemy intruder.";
  return null;
}

/** Every legal action for the active player; the AI and the harness choose from this list. */
export function legalActions(s: MatchState): Action[] {
  if (s.phase === "over") return [];
  const p = s.active;
  const me = s.players[p];
  if (s.phase === "mulligan") {
    // Full search over subsets is 2^5; offer keep-all, redraw-all and each single card.
    const all = me.hand.map((_, i) => i);
    return [
      { type: "mulligan", player: p, handIndexes: [] },
      ...all.map((i) => ({ type: "mulligan" as const, player: p, handIndexes: [i] })),
      { type: "mulligan", player: p, handIndexes: all },
    ];
  }
  const out: Action[] = [{ type: "pass", player: p }];
  me.hand.forEach((cardId, handIndex) => {
    const card = s.cards[cardId];
    if (!card || card.cost > me.energy || me.hand.indexOf(cardId) !== handIndex) return;
    for (let lane = 0; lane < s.config.lanes; lane++)
      for (let col = 0; col < s.config.columns; col++)
        if (!deployProblem(s, p, lane, col))
          out.push({ type: "play", player: p, handIndex, lane, col });
  });
  for (const u of s.units.filter((v) => v.owner === p)) {
    out.push({
      type: "stance",
      player: p,
      uid: u.uid,
      stance: u.stance === "hold" ? "advance" : "hold",
    });
    if (!canAct(s, u) || u.repositionedRound === s.round) continue;
    for (const step of [1, -1] as const) {
      const to = u.col + forward(p) * step;
      if (
        inBounds(s, u.lane, to) &&
        !unitAt(s, u.lane, to) &&
        !terrainAt(s, u.lane, to)?.blocksMovement
      )
        out.push({ type: "reposition", player: p, uid: u.uid, step });
    }
  }
  return out;
}

function resolveRound(s: MatchState): void {
  resolveMovement(s);
  resolveCombat(s);
  if (s.phase !== "over") startRound(s);
}

function startRound(s: MatchState): void {
  s.round++;
  if (s.round > s.config.maxRounds) {
    s.outcome = { winner: "draw", reason: "round_cap", round: s.round - 1 };
    s.phase = "over";
    s.events.push({ t: "end", outcome: s.outcome });
    return;
  }
  s.phase = "planning";
  s.initiative = s.round % 2 === 1 ? s.firstPlayer : other(s.firstPlayer);
  s.active = s.initiative;
  s.actionsThisRound = 0;
  s.events.push({ t: "round", round: s.round, initiative: s.initiative });
  for (const p of [s.initiative, other(s.initiative)]) {
    const me = s.players[p];
    me.passed = false;
    for (let i = 0; i < s.config.drawPerRound; i++) {
      const cardId = me.deck.shift();
      if (cardId) {
        me.hand.push(cardId);
        s.events.push({ t: "draw", player: p, cardId });
      } else {
        me.missedDraws++;
        const damage = me.missedDraws * s.config.deckOutStep;
        me.hp -= damage;
        s.damageTaken[p].deckout = (s.damageTaken[p].deckout ?? 0) + damage;
        s.events.push({ t: "missed_draw", player: p, damage });
      }
    }
    const base = s.config.startEnergy + (s.round - 1) * s.config.energyPerRound;
    const bonus = s.round === 1 && p !== s.initiative ? s.config.secondPlayerRound1Bonus : 0;
    me.energy = Math.min(s.config.energyCap, base) + bonus;
    s.events.push({ t: "energy", player: p, energy: me.energy });
  }
  checkOutcome(s, "deckout");
}

/**
 * Preview the end of the current round (movement then combat) without starting the next one.
 * The AI and, later, the UI's attack previews use this, so previews run the real rules (GAME-02).
 */
export function previewRoundEnd(state: MatchState): MatchState {
  const s = structuredClone(state);
  s.events = [];
  resolveMovement(s);
  resolveCombat(s);
  return s;
}

/** Re-run a match from its setup and action log (D-008). */
export function replay(setup: MatchSetup, actions: Action[]): MatchState {
  return actions.reduce(applyAction, createMatch(setup));
}

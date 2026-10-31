import { describe, expect, it } from "vitest";
import { TEST_CARDS, TEST_DECK } from "../content/test-cards.ts";
import { canHitCommander, findTarget } from "./board.ts";
import { applyAction, createMatch, legalActions, replay, IllegalActionError } from "./match.ts";
import { resolveCombat, resolveMovement } from "./resolve.ts";
import { shuffle } from "./rng.ts";
import type { RulesConfig } from "./config.ts";
import type { Action, MatchState, PlayerId, Unit } from "./types.ts";

const setup = (seed = 1, config: Partial<RulesConfig> = {}) => ({
  seed,
  cards: TEST_CARDS,
  decks: [TEST_DECK, TEST_DECK] as [string[], string[]],
  config,
});

/** A match in round 1 planning, after both players keep their hands. */
function started(seed = 1, config: Partial<RulesConfig> = {}): MatchState {
  let s = createMatch(setup(seed, config));
  s = applyAction(s, { type: "mulligan", player: s.active, handIndexes: [] });
  return applyAction(s, { type: "mulligan", player: s.active, handIndexes: [] });
}

/** An empty board in round 2 with units placed directly; placed units can act. */
function board(
  units: Partial<Unit>[],
  config: Partial<RulesConfig> = {},
  initiative: PlayerId = 0,
) {
  const s = started(1, config);
  s.round = 2;
  s.initiative = initiative;
  s.units = units.map((u, i) => ({
    uid: i + 1,
    cardId: "footman",
    owner: 0,
    lane: 0,
    col: 0,
    attack: 2,
    health: 3,
    range: 1,
    move: 1,
    stance: "advance",
    keywords: [],
    deployedRound: 1,
    repositionedRound: 0,
    ...u,
  }));
  return s;
}
const pos = (s: MatchState, uid: number) => s.units.find((u) => u.uid === uid)?.col;
const passBoth = (s: MatchState) => {
  s = applyAction(s, { type: "pass", player: s.active });
  return applyAction(s, { type: "pass", player: s.active });
};

describe("setup and economy", () => {
  it("shuffles to a permutation", () => {
    const [out] = shuffle(TEST_DECK, 42);
    expect([...out].sort()).toEqual([...TEST_DECK].sort());
  });

  it("deals 5, mulligans keep hand size, and draws 1 in round 1", () => {
    let s = createMatch(setup());
    expect(s.players[0].hand).toHaveLength(5);
    s = applyAction(s, { type: "mulligan", player: s.active, handIndexes: [0, 1, 2] });
    expect(s.players[s.firstPlayer].hand).toHaveLength(5);
    s = applyAction(s, { type: "mulligan", player: s.active, handIndexes: [] });
    expect(s.phase).toBe("planning");
    expect(s.players[0].hand).toHaveLength(6);
    expect(s.players[0].deck).toHaveLength(10);
  });

  it("gives the round 1 second player +1 energy, then ramps to the cap (D-005)", () => {
    let s = started();
    const first = s.initiative;
    const second = first === 0 ? 1 : 0;
    expect(s.players[first].energy).toBe(2);
    expect(s.players[second].energy).toBe(3);
    for (let r = 2; r <= 9; r++) {
      s = passBoth(s);
      expect(s.round).toBe(r);
      expect(s.players[0].energy).toBe(Math.min(8, 1 + r));
    }
  });

  it("alternates initiative each round", () => {
    let s = started();
    const first = s.initiative;
    s = passBoth(s);
    expect(s.initiative).not.toBe(first);
    expect(s.active).toBe(s.initiative);
  });

  it("locks a player out after passing while the other keeps acting", () => {
    let s = started();
    const a = s.active;
    s = applyAction(s, { type: "pass", player: a });
    const b = s.active;
    expect(b).not.toBe(a);
    const play = legalActions(s).find((x) => x.type === "play") as Action;
    s = applyAction(s, play);
    expect(s.active).toBe(b);
    expect(() => applyAction(s, { type: "pass", player: a })).toThrow(IllegalActionError);
  });

  it("deals rising damage for missed draws (D-006)", () => {
    let s = started();
    s.players.forEach((p) => (p.deck = []));
    s = passBoth(s);
    expect(s.players[0].hp).toBe(19);
    s = passBoth(s);
    expect(s.players[0].hp).toBe(17);
    expect(s.damageTaken[0].deckout).toBe(3);
  });

  it("ends in a draw when both Commanders fall together", () => {
    let s = started();
    s.players.forEach((p) => ((p.deck = []), (p.hp = 1)));
    s = passBoth(s);
    expect(s.outcome).toEqual({ winner: "draw", reason: "deckout", round: 2 });
  });
});

describe("deploying", () => {
  it("only allows your own deploy zone and empty tiles", () => {
    const s = started();
    const p = s.active;
    const plays = legalActions(s).filter((a) => a.type === "play");
    const cols = new Set(plays.map((a) => (a.type === "play" ? a.col : -1)));
    expect([...cols].sort()).toEqual(p === 0 ? [0, 1, 2] : [5, 6, 7]);
  });

  it("forbids deploying ahead of an enemy intruder in that lane (D-004)", () => {
    const s = board([{ owner: 0, lane: 1, col: 5 }]);
    s.active = 1;
    s.players[1].energy = 8;
    s.players[1].hand = ["footman"];
    const cols = legalActions(s)
      .filter((a) => a.type === "play" && a.lane === 1)
      .map((a) => (a.type === "play" ? a.col : -1));
    expect(cols).toEqual([]);
    const other = legalActions(s).filter((a) => a.type === "play" && a.lane === 2);
    expect(other).toHaveLength(3);
  });

  it("allows deploying behind an intruder", () => {
    const s = board([{ owner: 0, lane: 1, col: 6 }]);
    s.active = 1;
    s.players[1].energy = 8;
    s.players[1].hand = ["footman"];
    const cols = legalActions(s)
      .filter((a) => a.type === "play" && a.lane === 1)
      .map((a) => (a.type === "play" ? a.col : -1));
    expect(cols).toEqual([5]);
  });
});

describe("movement (D-007)", () => {
  it("does not move a unit on the round it is deployed", () => {
    let s = started();
    const p = s.active;
    const play = legalActions(s).find(
      (a) => a.type === "play" && TEST_CARDS[s.players[p].hand[a.handIndex] ?? ""]?.id !== "rider",
    ) as Action & { type: "play" };
    s = applyAction(s, play);
    s = applyAction(s, { type: "pass", player: s.active });
    s = applyAction(s, { type: "pass", player: s.active });
    expect(s.units[0]?.col).toBe(play.col);
  });

  it("advances melee units and holds ranged ones", () => {
    const s = board([
      { owner: 0, lane: 0, col: 0 },
      { owner: 0, lane: 1, col: 0, range: 3, stance: "hold" },
    ]);
    resolveMovement(s);
    expect(pos(s, 1)).toBe(1);
    expect(pos(s, 2)).toBe(0);
  });

  it("stops advancing once a target is in range", () => {
    const s = board([
      { owner: 0, lane: 0, col: 2 },
      { owner: 1, lane: 0, col: 3, stance: "hold" },
    ]);
    resolveMovement(s);
    expect(pos(s, 1)).toBe(2);
  });

  it("gives a contested tile to the initiative holder", () => {
    for (const initiative of [0, 1] as const) {
      const s = board(
        [
          { owner: 0, lane: 0, col: 3 },
          { owner: 1, lane: 0, col: 5 },
        ],
        {},
        initiative,
      );
      resolveMovement(s);
      expect(s.units.find((u) => u.owner === initiative)?.col).toBe(4);
      expect(s.units.find((u) => u.owner !== initiative)?.col).toBe(initiative === 0 ? 5 : 3);
    }
  });

  it("lets a column of friendly units advance together, whatever the array order", () => {
    const s = board([
      { owner: 0, lane: 0, col: 1 },
      { owner: 0, lane: 0, col: 2 },
    ]);
    resolveMovement(s);
    expect([pos(s, 1), pos(s, 2)]).toEqual([2, 3]);
  });

  it("moves Move 2 units two tiles", () => {
    const s = board([{ owner: 1, lane: 2, col: 7, move: 2 }]);
    resolveMovement(s);
    expect(pos(s, 1)).toBe(5);
  });

  it("does not walk into blocking terrain", () => {
    const s = board([{ owner: 0, lane: 0, col: 2 }]);
    s.terrain["0,3"] = { kind: "wall", blocksMovement: true };
    resolveMovement(s);
    expect(pos(s, 1)).toBe(2);
  });

  it("repositions one tile, once per round, as an action", () => {
    let s = board([{ owner: 0, lane: 0, col: 2 }]);
    s.active = 0;
    s = applyAction(s, { type: "reposition", player: 0, uid: 1, step: -1 });
    expect(pos(s, 1)).toBe(1);
    s.active = 0;
    expect(() => applyAction(s, { type: "reposition", player: 0, uid: 1, step: 1 })).toThrow(
      IllegalActionError,
    );
  });
});

describe("combat (D-007)", () => {
  it("applies damage simultaneously, so two units can kill each other", () => {
    const s = board([
      { owner: 0, lane: 0, col: 3, attack: 3, health: 3 },
      { owner: 1, lane: 0, col: 4, attack: 3, health: 3 },
    ]);
    resolveCombat(s);
    expect(s.units).toHaveLength(0);
  });

  it("gives no free retaliation to a unit out of range", () => {
    const s = board([
      { owner: 0, lane: 0, col: 1, range: 3, attack: 2 },
      { owner: 1, lane: 0, col: 4, attack: 5 },
    ]);
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === 1)?.health).toBe(3);
    expect(s.units.find((u) => u.uid === 2)?.health).toBe(1);
  });

  it("fires past friendly units but not through blocking terrain", () => {
    const s = board([
      { owner: 0, lane: 0, col: 1, range: 3 },
      { owner: 0, lane: 0, col: 2 },
      { owner: 1, lane: 0, col: 4 },
    ]);
    expect(findTarget(s, s.units[0] as Unit)).toMatchObject({ kind: "unit", unit: { uid: 3 } });
    s.terrain["0,3"] = { kind: "wall", blocksMovement: true };
    expect(findTarget(s, s.units[0] as Unit)).toBeNull();
  });

  it("lets a Guard take a hit aimed at a unit in the same column of an adjacent lane", () => {
    const s = board([
      { owner: 0, lane: 1, col: 3, attack: 2 },
      { owner: 1, lane: 1, col: 4 },
      { owner: 1, lane: 2, col: 4, keywords: ["guard"], health: 5, stance: "hold" },
    ]);
    s.units[2]!.attack = 0;
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === 3)?.health).toBe(3); // the Guard took the 2
    expect(s.units.find((u) => u.uid === 2)?.health).toBe(3); // the protected unit is untouched
  });

  it("does not let a Guard in another column intercept", () => {
    const s = board([
      { owner: 0, lane: 1, col: 3, attack: 2 },
      { owner: 1, lane: 1, col: 4, attack: 0 },
      { owner: 1, lane: 2, col: 5, keywords: ["guard"], attack: 0 },
    ]);
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === 2)?.health).toBe(1);
  });
});

describe("Commander damage", () => {
  it("breaches at column 6 with an open lane ahead, for its Attack (D-004)", () => {
    const s = board([{ owner: 0, lane: 0, col: 5, attack: 3 }]);
    resolveCombat(s);
    expect(s.players[1].hp).toBe(17);
    expect(s.damageTaken[1].breach).toBe(3);
  });

  it("does not breach short of the threshold", () => {
    const s = board([{ owner: 0, lane: 0, col: 4 }]);
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(false);
  });

  it("is blocked by an enemy unit or blocking terrain ahead, not by one behind", () => {
    const s = board([
      { owner: 0, lane: 0, col: 5 },
      { owner: 1, lane: 0, col: 3 },
    ]);
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(true);
    s.units[1]!.col = 7;
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(false);
    s.units[1]!.col = 3;
    s.terrain["0,6"] = { kind: "wall", blocksMovement: true };
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(false);
  });

  it("applies the same threshold to ranged units", () => {
    const s = board([{ owner: 0, lane: 0, col: 2, range: 4 }]);
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(false);
  });

  it("is symmetric for the right player (column 3)", () => {
    const s = board([{ owner: 1, lane: 3, col: 2, attack: 3 }]);
    resolveCombat(s);
    expect(s.players[0].hp).toBe(17);
    s.units[0]!.col = 3;
    expect(canHitCommander(s, s.units[0] as Unit)).toBe(false);
  });

  it("hits from any column in the unblocked_lane preset (D-001)", () => {
    const s = board([{ owner: 0, lane: 0, col: 0 }], { commanderDamageMode: "unblocked_lane" });
    resolveCombat(s);
    expect(s.players[1].hp).toBe(18);
    expect(s.damageTaken[1].unblocked).toBe(2);
  });

  it("keeps a breaching unit in place to hit again next round", () => {
    const s = board([{ owner: 0, lane: 0, col: 5 }]);
    resolveMovement(s);
    expect(pos(s, 1)).toBe(5);
  });

  it("ends the match when a Commander falls", () => {
    const s = board([{ owner: 0, lane: 0, col: 6, attack: 3 }]);
    s.players[1].hp = 3;
    resolveCombat(s);
    expect(s.outcome).toEqual({ winner: 0, reason: "commander", round: 2 });
  });
});

describe("determinism (GAME-06)", () => {
  it("replays to the identical state from the same seed and actions", () => {
    const actions: Action[] = [];
    let s = createMatch(setup(99));
    for (let i = 0; i < 400 && s.phase !== "over"; i++) {
      const legal = legalActions(s);
      const a = legal[(i * 7) % legal.length] as Action;
      actions.push(a);
      s = applyAction(s, a);
    }
    expect(replay(setup(99), actions)).toEqual(s);
  });
});

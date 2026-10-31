import { describe, expect, it } from "vitest";
import { CARDS, DECKS } from "../content/factions.ts";
import { findTarget } from "./board.ts";
import { applyAction, createMatch, legalActions, IllegalActionError } from "./match.ts";
import { resolveCombat, resolveMovement } from "./resolve.ts";
import type { MatchState, PlayerId, Unit } from "./types.ts";

/** Round 2 planning with an empty board; `p` is active with 8 energy and the given hand. */
function table(p: PlayerId, hand: string[]): MatchState {
  let s = createMatch({ seed: 1, cards: CARDS, decks: [DECKS.ironbound, DECKS.verdant] });
  while (s.phase === "mulligan")
    s = applyAction(s, { type: "mulligan", player: s.active, handIndexes: [] });
  s.round = 2;
  s.active = p;
  s.initiative = p;
  s.players[p].energy = 8;
  s.players[p].hand = hand;
  return s;
}
function unit(s: MatchState, u: Partial<Unit>): Unit {
  const full: Unit = {
    uid: s.nextUid++,
    cardId: "ib_footman",
    owner: 0,
    lane: 0,
    col: 0,
    attack: 2,
    health: 4,
    range: 1,
    move: 1,
    stance: "advance",
    keywords: [],
    structure: false,
    deployedRound: 1,
    repositionedRound: 0,
    ...u,
  };
  s.units.push(full);
  return full;
}
const play = (s: MatchState, p: PlayerId, lane: number, col: number) =>
  applyAction(s, { type: "play", player: p, handIndex: 0, lane, col });

describe("decks (D-006, D-009)", () => {
  it("are 16 cards of 8 unique × 2 per faction", () => {
    for (const deck of Object.values(DECKS)) {
      expect(deck).toHaveLength(16);
      expect(new Set(deck).size).toBe(8);
    }
  });
});

describe("Stone Wall (D-013)", () => {
  it("can be built in your half, not the enemy's", () => {
    const s = table(0, ["ib_wall"]);
    expect(() => play(s, 0, 1, 4)).not.toThrow();
    expect(() => play(s, 0, 1, 5)).toThrow(IllegalActionError);
  });

  it("can't be built ahead of an enemy intruder", () => {
    const s = table(1, ["ib_wall"]);
    unit(s, { owner: 0, lane: 2, col: 5 });
    expect(() => play(s, 1, 2, 6)).toThrow(IllegalActionError);
    expect(() => play(s, 1, 2, 4)).not.toThrow();
  });

  it("blocks movement and breaches, and is attacked and destroyed by enemies", () => {
    let s = table(1, ["ib_wall"]);
    s = play(s, 1, 0, 6);
    const attacker = unit(s, { owner: 0, lane: 0, col: 5, attack: 3 });
    expect(findTarget(s, attacker)).toEqual({ kind: "terrain", lane: 0, col: 6 });
    resolveMovement(s);
    expect(attacker.col).toBe(5);
    resolveCombat(s);
    expect(s.players[1].hp).toBe(20);
    expect(s.terrain["0,6"]?.hp).toBe(3);
    resolveCombat(s);
    expect(s.terrain["0,6"]).toBeUndefined();
  });

  it("takes double damage from Siege", () => {
    let s = table(1, ["ib_wall"]);
    s = play(s, 1, 0, 6);
    unit(s, { owner: 0, lane: 0, col: 5, attack: 3, keywords: ["siege"] });
    resolveCombat(s);
    expect(s.terrain["0,6"]).toBeUndefined();
  });

  it("is never attacked by its owner's units, and blocks their fire", () => {
    let s = table(0, ["ib_wall"]);
    s = play(s, 0, 0, 3);
    const archer = unit(s, { owner: 0, lane: 0, col: 1, range: 4 });
    unit(s, { owner: 1, lane: 0, col: 5 });
    expect(findTarget(s, archer)).toBeNull();
  });
});

describe("Forest and Woodland (D-013)", () => {
  it("Spreading Grove plants the target tile and the same column in adjacent lanes", () => {
    const s = play(table(1, ["vd_grove"]), 1, 0, 5);
    expect(Object.keys(s.terrain).sort()).toEqual(["0,5", "1,5"]);
  });

  it("can be planted under a unit, and gives Woodland units +1 attack", () => {
    let s = table(1, ["vd_forest"]);
    const thorn = unit(s, { owner: 1, lane: 1, col: 4, attack: 3, keywords: ["woodland"] });
    s = play(s, 1, 1, 4);
    const enemy = unit(s, { owner: 0, lane: 1, col: 3, health: 10, attack: 0 });
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === enemy.uid)?.health).toBe(6);
    expect(thorn.uid).toBeGreaterThan(0);
  });

  it("reduces ranged hits on units standing in it by 1, but not melee hits", () => {
    let s = table(1, ["vd_forest"]);
    s = play(s, 1, 2, 5);
    const target = unit(s, { owner: 1, lane: 2, col: 5, health: 10, attack: 0 });
    unit(s, { owner: 0, lane: 2, col: 2, range: 3, attack: 2 });
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === target.uid)?.health).toBe(9);
    unit(s, { owner: 0, lane: 2, col: 4, attack: 2 });
    resolveCombat(s);
    expect(s.units.find((u) => u.uid === target.uid)?.health).toBe(6);
  });
});

describe("structures and equipment (D-013)", () => {
  it("Watchtower never moves, repositions or changes stance", () => {
    let s = table(0, ["ib_tower"]);
    s = play(s, 0, 3, 2);
    const tower = s.units[0]!;
    expect(tower.structure).toBe(true);
    tower.deployedRound = 1;
    s.active = 0;
    expect(legalActions(s).filter((a) => "uid" in a && a.uid === tower.uid)).toEqual([]);
    resolveMovement(s);
    expect(s.units[0]!.col).toBe(2);
  });

  it("Siege also doubles damage to structures", () => {
    let s = table(1, ["ib_tower"]);
    s = play(s, 1, 0, 6);
    s.units[0]!.attack = 0;
    unit(s, { owner: 0, lane: 0, col: 5, attack: 3, keywords: ["siege"] });
    resolveCombat(s);
    expect(s.units.find((u) => u.owner === 1)).toBeUndefined();
  });

  it("Hook Spear adds +1 attack and +1 range to one of your units only", () => {
    let s = table(0, ["ib_spear"]);
    const u = unit(s, { owner: 0, lane: 1, col: 2 });
    unit(s, { owner: 1, lane: 2, col: 5 });
    expect(() => play(s, 0, 2, 5)).toThrow(IllegalActionError);
    s = play(s, 0, 1, 2);
    const equipped = s.units.find((v) => v.uid === u.uid)!;
    expect([equipped.attack, equipped.range]).toEqual([3, 2]);
  });
});

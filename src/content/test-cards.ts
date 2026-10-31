import type { CardDb } from "../engine/types.ts";

/**
 * Placeholder cards for engine tests and the phase 1 sample match only. Real faction content is
 * phase 3 (D-009). Stats are illustrative, not balanced.
 */
export const TEST_CARDS: CardDb = {
  militia: {
    id: "militia",
    name: "Militia",
    faction: "test",
    kind: "unit",
    cost: 1,
    attack: 1,
    health: 2,
    range: 1,
    move: 1,
  },
  footman: {
    id: "footman",
    name: "Footman",
    faction: "test",
    kind: "unit",
    cost: 2,
    attack: 2,
    health: 3,
    range: 1,
    move: 1,
  },
  vanguard: {
    id: "vanguard",
    name: "Vanguard",
    faction: "test",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 5,
    range: 1,
    move: 1,
    keywords: ["guard"],
  },
  archer: {
    id: "archer",
    name: "Archer",
    faction: "test",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 2,
    range: 3,
    move: 1,
  },
  rider: {
    id: "rider",
    name: "Rider",
    faction: "test",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 3,
    range: 1,
    move: 2,
    keywords: ["rush"],
  },
  brute: {
    id: "brute",
    name: "Brute",
    faction: "test",
    kind: "unit",
    cost: 4,
    attack: 4,
    health: 5,
    range: 1,
    move: 1,
  },
};

const UNIQUE = ["militia", "footman", "vanguard", "archer", "rider", "brute", "footman", "militia"];
/** 16 cards: 8 slots × 2 copies (D-006 shape). */
export const TEST_DECK: string[] = [...UNIQUE, ...UNIQUE];

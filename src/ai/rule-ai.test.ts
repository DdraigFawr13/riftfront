import { describe, expect, it } from "vitest";
import { TEST_CARDS, TEST_DECK } from "../content/test-cards.ts";
import { applyAction, createMatch, legalActions, type MatchState } from "../engine/index.ts";
import { createRuleAi } from "./rule-ai.ts";

const start = (seed: number): MatchState =>
  createMatch({ seed, cards: TEST_CARDS, decks: [TEST_DECK, TEST_DECK] });

describe("rule-based AI", () => {
  it("only chooses legal actions and finishes a match", () => {
    let s = start(3);
    const ais = [createRuleAi(1), createRuleAi(2)];
    for (let i = 0; i < 3000 && s.phase !== "over"; i++) {
      const a = ais[s.active]!.decide(s);
      expect(legalActions(s)).toContainEqual(a);
      s = applyAction(s, a);
    }
    expect(s.phase).toBe("over");
  });

  it("decides the same whatever the opponent holds or the deck order (D-008)", () => {
    let s = start(5);
    while (s.phase === "mulligan")
      s = applyAction(s, { type: "mulligan", player: s.active, handIndexes: [] });
    const me = s.active;
    const them = me === 0 ? 1 : 0;
    const variant = structuredClone(s);
    variant.players[them].hand = ["brute", "brute", "brute", "brute", "brute", "brute"];
    variant.players[them].deck = [];
    variant.players[me].deck = [...variant.players[me].deck].reverse();
    expect(createRuleAi(9).decide(variant)).toEqual(createRuleAi(9).decide(s));
  });

  it("is deterministic for the same seed", () => {
    const s = start(11);
    expect(createRuleAi(4).decide(s)).toEqual(createRuleAi(4).decide(s));
  });
});

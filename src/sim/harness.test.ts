import { describe, expect, it } from "vitest";
import { TEST_CARDS, TEST_DECK } from "../content/test-cards.ts";
import { runBatch, summarize, targetChecks } from "./harness.ts";

const opts = { games: 4, cards: TEST_CARDS, decks: { A: TEST_DECK, B: TEST_DECK } };

describe("harness", () => {
  it("swaps seats every other game and reproduces results from the same seeds", () => {
    const a = runBatch(opts);
    expect(a.map((r) => r.leftDeck)).toEqual(["A", "B", "A", "B"]);
    expect(runBatch(opts)).toEqual(a);
  });

  it("summarizes rates over the batch and checks them against the targets", () => {
    const s = summarize("territorial_breach", runBatch(opts));
    expect(s.games).toBe(4);
    expect(s.combatEndRate + s.deckoutEndRate + s.roundCapRate).toBeCloseTo(1);
    expect(targetChecks(s)).toHaveLength(3);
  });
});

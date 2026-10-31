import { describe, expect, it } from "vitest";
import { yourView } from "./text.ts";

describe("event lines from the player's point of view", () => {
  it.each([
    ["Left plays Your Iron Footman at lane 1 col 2", "You play Iron Footman at lane 1 col 2"],
    ["Right plays Enemy Thornback at lane 2 col 7", "Enemy plays Thornback at lane 2 col 7"],
    ["Left redraws 0 card(s)", "You redraw 0 card(s)"],
    [
      "Your Rider breaks through and hits the Right Commander for 2",
      "Your Rider breaks through and hits the enemy Commander for 2",
    ],
    [
      "Enemy Treant breaks through and hits the Left Commander for 4",
      "Enemy Treant breaks through and hits your Commander for 4",
    ],
    ["— Round 3 (Right acts first)", "— Round 3 (enemy acts first)"],
    ["Left wins in round 9 (commander)", "You win in round 9 (commander)"],
  ])("%s", (raw, want) => expect(yourView(raw)).toBe(want));
});

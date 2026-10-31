/**
 * Plays one seeded match between two naive bots and prints a play-by-play. The bots are a stand-in
 * for the phase 2 AI: each plays its most expensive affordable card on a random legal tile, else
 * passes. Usage: npm run sample -- [seed] [territorial_breach|unblocked_lane]
 */
import { TEST_CARDS, TEST_DECK } from "../src/content/test-cards.ts";
import {
  applyAction,
  createMatch,
  describeEvent,
  deriveSeed,
  legalActions,
  nextRandom,
  renderBoard,
  type Action,
  type CommanderDamageMode,
} from "../src/engine/index.ts";

const seed = Number(process.argv[2] ?? 7);
const mode = (process.argv[3] ?? "territorial_breach") as CommanderDamageMode;
let s = createMatch({
  seed,
  cards: TEST_CARDS,
  decks: [TEST_DECK, TEST_DECK],
  config: { commanderDamageMode: mode },
});
let botRng = deriveSeed(seed, "bot");
const names = new Map<number, string>();
const lines: string[] = [];
let printed = 0;

while (s.phase !== "over") {
  const legal = legalActions(s);
  let action: Action = legal[0] as Action;
  if (s.phase === "planning") {
    const plays = legal.filter((a) => a.type === "play");
    const cost = (a: Action) =>
      a.type === "play" ? (TEST_CARDS[s.players[a.player].hand[a.handIndex] ?? ""]?.cost ?? 0) : 0;
    const best = Math.max(-1, ...plays.map(cost));
    const pool = plays.filter((a) => cost(a) === best);
    if (pool.length) {
      const [r, next] = nextRandom(botRng);
      botRng = next;
      action = pool[Math.floor(r * pool.length)] as Action;
    } else action = { type: "pass", player: s.active };
  }
  const roundBefore = s.round;
  s = applyAction(s, action);
  for (const e of s.events.slice(printed)) {
    if (e.t === "play")
      names.set(e.uid, `${e.player === 0 ? "L" : "R"}-${TEST_CARDS[e.cardId]?.name}#${e.uid}`);
    if (e.t === "round" && roundBefore > 0)
      lines.push(
        `Board after round ${e.round - 1} (HP includes round ${e.round} draw damage):`,
        "```",
        renderBoard(s),
        "```",
      );
    if (e.t !== "energy" && e.t !== "draw") lines.push(`- ${describeEvent(s, e, names)}`);
  }
  printed = s.events.length;
}
lines.push("```", renderBoard(s), "```");
console.log(`# Sample match: seed ${seed}, ${mode}\n`);
console.log(lines.join("\n"));

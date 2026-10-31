/**
 * Plays one seeded Ironbound (left) vs Verdant (right) match between two rule-based AIs and prints
 * a play-by-play. Usage: npm run sample -- [seed] [territorial_breach|unblocked_lane]
 */
import { createRuleAi } from "../src/ai/rule-ai.ts";
import { CARDS, DECKS } from "../src/content/factions.ts";
import {
  applyAction,
  createMatch,
  describeEvent,
  deriveSeed,
  renderBoard,
  type CommanderDamageMode,
} from "../src/engine/index.ts";

const seed = Number(process.argv[2] ?? 7);
const mode = (process.argv[3] ?? "territorial_breach") as CommanderDamageMode;
let s = createMatch({
  seed,
  cards: CARDS,
  decks: [DECKS.ironbound, DECKS.verdant],
  config: { commanderDamageMode: mode },
});
const ais = [createRuleAi(deriveSeed(seed, "ai-0")), createRuleAi(deriveSeed(seed, "ai-1"))];
const names = new Map<number, string>();
const lines: string[] = [];
let printed = 0;

while (s.phase !== "over") {
  const roundBefore = s.round;
  s = applyAction(s, ais[s.active]!.decide(s));
  for (const e of s.events.slice(printed)) {
    if (e.t === "play")
      names.set(e.uid, `${e.player === 0 ? "L" : "R"}-${CARDS[e.cardId]?.name}#${e.uid}`);
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
console.log(`# Sample match: seed ${seed}, ${mode}, Ironbound (left) vs Verdant (right)\n`);
console.log(lines.join("\n"));

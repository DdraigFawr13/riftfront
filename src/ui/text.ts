import { CARDS } from "../content/factions.ts";
import type { Card, Keyword } from "../engine/index.ts";

export const KEYWORDS: Record<Keyword, string> = {
  guard: "Guard: takes a hit aimed at a friend in the same column of the next lane.",
  rush: "Rush: can move and attack the round it arrives.",
  siege: "Siege: double damage to walls and structures.",
  woodland: "Woodland: +1 attack while standing in Forest.",
};

/** Two-letter stamp for a token, from the card name: "Iron Footman" -> "IF". */
export function stamp(cardId: string): string {
  const name = CARDS[cardId]?.name ?? "?";
  const words = name.split(" ");
  return words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : name.slice(0, 2);
}

export function cardLine(c: Card): string {
  if (c.kind === "unit" || c.kind === "structure")
    return `${c.attack} attack · ${c.health} health · range ${c.range}${c.kind === "unit" ? ` · move ${c.move}` : " · never moves"}`;
  if (c.kind === "terrain")
    return c.terrain.blocksMovement ? `Wall · ${c.terrain.hp} health` : "Forest";
  return "Equipment";
}

const YOU_VERBS: Record<string, string> = {
  plays: "play",
  redraws: "redraw",
  passes: "pass",
  places: "place",
  equips: "equip",
  has: "have",
  takes: "take",
  wins: "win",
};

/** Turn the engine's neutral log line ("Left plays …") into the player's view ("You play …"). */
export function yourView(line: string): string {
  return line
    .replace(/the Left Commander/g, "your Commander")
    .replace(/the Right Commander/g, "the enemy Commander")
    .replace(/^Left (\w+)/, (_, v: string) => `You ${YOU_VERBS[v] ?? v}`)
    .replace(/^Right\b/, "Enemy")
    .replace(/^(You \w+|Enemy \w+) (?:Your|Enemy) /, "$1 ")
    .replace(/\(Left acts first\)/, "(you act first)")
    .replace(/\(Right acts first\)/, "(enemy acts first)");
}

import type { GameEvent, MatchState } from "./types.ts";

const side = (p: number) => (p === 0 ? "Left" : "Right");
/** Board columns and lanes are shown 1-indexed, as in the design docs. */
const at = (lane: number, col: number) => `lane ${lane + 1} col ${col + 1}`;

/** One log line per event, so every consequence is visible (GAME-04). */
export function describeEvent(s: MatchState, e: GameEvent, names: Map<number, string>): string {
  const n = (uid: number) => names.get(uid) ?? `#${uid}`;
  switch (e.t) {
    case "round":
      return `— Round ${e.round} (${side(e.initiative)} acts first)`;
    case "draw":
      return `${side(e.player)} draws ${s.cards[e.cardId]?.name ?? e.cardId}`;
    case "missed_draw":
      return `${side(e.player)} has no cards to draw and takes ${e.damage}`;
    case "energy":
      return `${side(e.player)} has ${e.energy} energy`;
    case "mulligan":
      return `${side(e.player)} redraws ${e.count} card(s)`;
    case "play":
      return `${side(e.player)} plays ${n(e.uid)} at ${at(e.lane, e.col)}`;
    case "stance":
      return `${n(e.uid)} switches to ${e.stance}`;
    case "reposition":
      return `${n(e.uid)} repositions to col ${e.to + 1}`;
    case "pass":
      return `${side(e.player)} passes`;
    case "action_cap":
      return `Action cap reached in round ${e.round}`;
    case "move":
      return `${n(e.uid)} advances to ${at(e.lane, e.to)}`;
    case "attack":
      return e.guardedBy
        ? `${n(e.uid)} attacks; ${n(e.guardedBy)} guards and takes ${e.damage}`
        : `${n(e.uid)} hits ${n(e.target)} for ${e.damage}`;
    case "commander_hit":
      return `${n(e.uid)} breaks through and hits the ${side(e.player)} Commander for ${e.damage}`;
    case "death":
      return `${n(e.uid)} is destroyed`;
    case "end":
      return e.outcome.winner === "draw"
        ? `Draw in round ${e.outcome.round} (${e.outcome.reason})`
        : `${side(e.outcome.winner)} wins in round ${e.outcome.round} (${e.outcome.reason})`;
  }
}

/** Plain-text board: `>` is a left unit, `<` a right unit, then card initial and health. */
export function renderBoard(s: MatchState): string {
  const rows: string[] = [];
  const head = Array.from({ length: s.config.columns }, (_, c) => ` ${c + 1}  `).join("");
  rows.push(`     ${head}`);
  for (let lane = 0; lane < s.config.lanes; lane++) {
    let row = `L${lane + 1} |`;
    for (let col = 0; col < s.config.columns; col++) {
      const u = s.units.find((v) => v.lane === lane && v.col === col);
      const t = s.terrain[`${lane},${col}`];
      const cell = u
        ? `${u.owner === 0 ? ">" : "<"}${(s.cards[u.cardId]?.name ?? "?")[0]}${u.health}`
        : t
          ? `#${t.kind[0]}`
          : " .";
      row += cell.padEnd(4);
    }
    rows.push(row);
  }
  rows.push(`HP left ${s.players[0].hp} · right ${s.players[1].hp}`);
  return rows.join("\n");
}

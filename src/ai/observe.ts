import type { MatchState, PlayerId } from "../engine/index.ts";

/**
 * What player `p` may know (D-008): the board, both Commanders' HP and energy, their own hand, and
 * card counts. The opponent's hand and both deck orders are removed, so an AI built on this view
 * cannot cheat even by accident. The event log is dropped to keep previews cheap.
 */
export interface Observation {
  me: PlayerId;
  state: MatchState;
  opponentHandSize: number;
  deckSizes: [number, number];
}

export function observe(s: MatchState, p: PlayerId): Observation {
  const view = structuredClone({ ...s, events: [] });
  const o = p === 0 ? 1 : 0;
  view.players[o].hand = [];
  view.players[o].deck = [];
  view.players[p].deck = [];
  view.shuffleRng = 0;
  return {
    me: p,
    state: view,
    opponentHandSize: s.players[o].hand.length,
    deckSizes: [s.players[0].deck.length, s.players[1].deck.length],
  };
}

export * from "./types.ts";
export * from "./config.ts";
export {
  createMatch,
  applyAction,
  legalActions,
  previewRoundEnd,
  replay,
  IllegalActionError,
} from "./match.ts";
export type { MatchSetup } from "./match.ts";
export {
  canAct,
  canHitCommander,
  effectiveAttack,
  findTarget,
  inBreachZone,
  laneBlockedAhead,
  other,
  tileKey,
} from "./board.ts";
export { describeEvent, renderBoard } from "./format.ts";
export { deriveSeed, nextRandom } from "./rng.ts";

import type { MatchState, PlayerId, Terrain, Unit } from "./types.ts";

export const forward = (p: PlayerId): 1 | -1 => (p === 0 ? 1 : -1);
export const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);
export const tileKey = (lane: number, col: number): string => `${lane},${col}`;

export function inBounds(s: MatchState, lane: number, col: number): boolean {
  return lane >= 0 && lane < s.config.lanes && col >= 0 && col < s.config.columns;
}
export function unitAt(s: MatchState, lane: number, col: number): Unit | undefined {
  return s.units.find((u) => u.lane === lane && u.col === col);
}
export function terrainAt(s: MatchState, lane: number, col: number): Terrain | undefined {
  return s.terrain[tileKey(lane, col)];
}
export function inDeployZone(s: MatchState, p: PlayerId, col: number): boolean {
  const [lo, hi] = s.config.deployZone[p];
  return col >= lo && col <= hi;
}

/** A unit can move and attack from the round after it was deployed, or at once with Rush. */
export function canAct(s: MatchState, u: Unit): boolean {
  return u.deployedRound < s.round || u.keywords.includes("rush");
}

/** Is there an enemy unit or blocking terrain anywhere ahead of `u` in its lane? (D-004) */
export function laneBlockedAhead(s: MatchState, u: Unit): boolean {
  const f = forward(u.owner);
  for (let c = u.col + f; c >= 0 && c < s.config.columns; c += f) {
    if (terrainAt(s, u.lane, c)?.blocksMovement) return true;
    const v = unitAt(s, u.lane, c);
    if (v && v.owner !== u.owner) return true;
  }
  return false;
}

export function inBreachZone(s: MatchState, u: Unit): boolean {
  const t = s.config.breachColumn[u.owner];
  return u.owner === 0 ? u.col >= t : u.col <= t;
}

/** The Commander damage predicate, in both presets (D-001, D-004). */
export function canHitCommander(s: MatchState, u: Unit): boolean {
  if (!canAct(s, u) || laneBlockedAhead(s, u)) return false;
  return s.config.commanderDamageMode === "unblocked_lane" || inBreachZone(s, u);
}

export type Target = { kind: "commander" } | { kind: "unit"; unit: Unit };

/**
 * One attack per unit: the enemy Commander if the breach predicate holds, otherwise the nearest
 * enemy ahead in its lane within range. Friendly units don't block fire; blocking terrain does.
 */
export function findTarget(s: MatchState, u: Unit): Target | null {
  if (!canAct(s, u) || u.attack <= 0) return null;
  if (canHitCommander(s, u)) return { kind: "commander" };
  const f = forward(u.owner);
  for (let d = 1; d <= u.range; d++) {
    const c = u.col + f * d;
    if (!inBounds(s, u.lane, c) || terrainAt(s, u.lane, c)?.blocksMovement) return null;
    const v = unitAt(s, u.lane, c);
    if (v && v.owner !== u.owner) return { kind: "unit", unit: v };
  }
  return null;
}

/** Deploy restriction (D-004): no deploying into a lane ahead of an enemy intruder in that lane. */
export function blockedByIntruder(s: MatchState, p: PlayerId, lane: number, col: number): boolean {
  return s.units.some(
    (u) =>
      u.owner !== p &&
      u.lane === lane &&
      inDeployZone(s, p, u.col) &&
      (u.owner === 0 ? col > u.col : col < u.col),
  );
}

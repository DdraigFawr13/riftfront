import {
  canAct,
  effectiveAttack,
  findTarget,
  forward,
  inBounds,
  other,
  terrainAt,
  unitAt,
} from "./board.ts";
import type { MatchState, PlayerId, Unit } from "./types.ts";

/** These functions mutate a draft state; applyAction clones before calling them. */

function wantsToStep(s: MatchState, u: Unit): number | null {
  if (u.structure || u.stance !== "advance" || !canAct(s, u) || findTarget(s, u)) return null;
  const to = u.col + forward(u.owner);
  if (!inBounds(s, u.lane, to) || terrainAt(s, u.lane, to)?.blocksMovement) return null;
  return to;
}

/**
 * Advance phase (D-007). Units step one tile at a time, up to their Move. Within a step, units
 * that want the same tile are resolved by initiative; moves into tiles vacated in the same step
 * chain, so the result does not depend on array order.
 */
export function resolveMovement(s: MatchState): void {
  const maxMove = Math.max(0, ...s.units.filter((u) => !u.structure).map((u) => u.move));
  for (let step = 1; step <= maxMove; step++) {
    const intents = new Map<number, number>();
    for (const u of s.units) {
      if (u.move < step) continue;
      const to = wantsToStep(s, u);
      if (to !== null) intents.set(u.uid, to);
    }
    // Contested tiles: two enemy units want the same empty tile; the initiative holder takes it.
    const byTile = new Map<string, Unit[]>();
    for (const u of s.units) {
      const to = intents.get(u.uid);
      if (to === undefined) continue;
      const k = `${u.lane},${to}`;
      byTile.set(k, [...(byTile.get(k) ?? []), u]);
    }
    for (const group of byTile.values()) {
      if (group.length < 2) continue;
      const winner = group.find((u) => u.owner === s.initiative) ?? group[0];
      for (const u of group) if (u !== winner) intents.delete(u.uid);
    }
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const u of [...s.units].sort((a, b) => a.uid - b.uid)) {
        const to = intents.get(u.uid);
        if (to === undefined || unitAt(s, u.lane, to)) continue;
        s.events.push({ t: "move", uid: u.uid, lane: u.lane, from: u.col, to });
        u.col = to;
        intents.delete(u.uid);
        progressed = true;
      }
    }
  }
}

/**
 * Combat (D-007): targets from one snapshot, Guard interception, simultaneous damage. Terrain
 * effects (D-013): Woodland +1 attack in Forest, Forest cover against ranged hits, Siege doubles
 * damage to walls and structures.
 */
export function resolveCombat(s: MatchState): void {
  const attackers = [...s.units].sort((a, b) => a.uid - b.uid);
  const planned = attackers.map((u) => ({
    u,
    atk: effectiveAttack(s, u),
    target: findTarget(s, u),
  }));
  const unitDamage = new Map<number, number>();
  const terrainDamage = new Map<string, number>();
  const commanderDamage: [number, number] = [0, 0];
  const usedGuards = new Set<number>();
  for (const { u, atk, target } of planned) {
    if (!target) continue;
    const siege = u.keywords.includes("siege") ? 2 : 1;
    if (target.kind === "commander") {
      const victim = other(u.owner);
      commanderDamage[victim] += atk;
      s.events.push({ t: "commander_hit", uid: u.uid, player: victim, damage: atk });
      continue;
    }
    if (target.kind === "terrain") {
      const key = `${target.lane},${target.col}`;
      const dmg = atk * siege;
      terrainDamage.set(key, (terrainDamage.get(key) ?? 0) + dmg);
      const kind = terrainAt(s, target.lane, target.col)?.kind ?? "terrain";
      s.events.push({
        t: "attack_terrain",
        uid: u.uid,
        kind,
        lane: target.lane,
        col: target.col,
        damage: dmg,
      });
      continue;
    }
    const x = target.unit;
    const guard = s.units
      .filter(
        (g) =>
          g.owner === x.owner &&
          g.uid !== x.uid &&
          g.keywords.includes("guard") &&
          !usedGuards.has(g.uid) &&
          g.col === x.col &&
          Math.abs(g.lane - x.lane) === 1,
      )
      .sort((a, b) => a.lane - b.lane)[0];
    const hit = guard ?? x;
    if (guard) usedGuards.add(guard.uid);
    let dmg = atk * (hit.structure ? siege : 1);
    if (u.range >= 2) dmg = Math.max(0, dmg - (terrainAt(s, hit.lane, hit.col)?.rangedCover ?? 0));
    unitDamage.set(hit.uid, (unitDamage.get(hit.uid) ?? 0) + dmg);
    s.events.push({
      t: "attack",
      uid: u.uid,
      target: hit.uid,
      damage: dmg,
      ...(guard ? { guardedBy: guard.uid } : {}),
    });
  }
  for (const u of s.units) u.health -= unitDamage.get(u.uid) ?? 0;
  for (const u of s.units.filter((v) => v.health <= 0)) {
    s.events.push({ t: "death", uid: u.uid });
    s.players[u.owner].discard.push(u.cardId);
  }
  s.units = s.units.filter((u) => u.health > 0);
  for (const [key, dmg] of terrainDamage) {
    const t = s.terrain[key];
    if (!t || t.hp === undefined) continue;
    t.hp -= dmg;
    if (t.hp <= 0) {
      const [lane, col] = key.split(",").map(Number) as [number, number];
      delete s.terrain[key];
      s.events.push({ t: "terrain_destroyed", kind: t.kind, lane, col });
    }
  }
  const source = s.config.commanderDamageMode === "unblocked_lane" ? "unblocked" : "breach";
  for (const p of [0, 1] as PlayerId[]) {
    if (!commanderDamage[p]) continue;
    s.players[p].hp -= commanderDamage[p];
    s.damageTaken[p][source] = (s.damageTaken[p][source] ?? 0) + commanderDamage[p];
  }
  checkOutcome(s, "commander");
}

export function checkOutcome(s: MatchState, reason: "commander" | "deckout"): void {
  if (s.outcome) return;
  const dead = s.players.map((p) => p.hp <= 0);
  if (!dead[0] && !dead[1]) return;
  const winner = dead[0] && dead[1] ? "draw" : dead[0] ? 1 : 0;
  s.outcome = { winner, reason, round: s.round };
  s.phase = "over";
  s.events.push({ t: "end", outcome: s.outcome });
}

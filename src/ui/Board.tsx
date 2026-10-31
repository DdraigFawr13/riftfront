import { useEffect, useRef, useState } from "react";
import { canAct, effectiveAttack, type MatchState, type Unit } from "../engine/index.ts";
import { CardArt } from "./art.tsx";
import { useLongPress } from "./useLongPress.ts";

export type Inspect =
  | { kind: "card"; cardId: string }
  | { kind: "unit"; uid: number }
  | { kind: "tile"; lane: number; col: number };

interface Props {
  s: MatchState;
  targets: Set<string>;
  selectedUid: number | null;
  pendingTile: string | null;
  onTile: (lane: number, col: number) => void;
  onInspect: (i: Inspect) => void;
}

/** What the last action did, read from the new events, so the board can animate it. */
interface Fx {
  id: number;
  arrived: Set<number>;
  unitHits: Map<number, number>;
  tileHits: Map<string, number>;
  planted: Set<string>;
}
const NO_FX: Fx = {
  id: 0,
  arrived: new Set(),
  unitHits: new Map(),
  tileHits: new Map(),
  planted: new Set(),
};
const FX_MS = 1100;

function useFx(s: MatchState): Fx {
  const seen = useRef(s.events.length);
  const counter = useRef(0);
  const [fx, setFx] = useState<Fx>(NO_FX);
  useEffect(() => {
    if (!fx.id) return;
    const t = window.setTimeout(() => setFx(NO_FX), FX_MS);
    return () => window.clearTimeout(t);
  }, [fx.id]);
  useEffect(() => {
    const fresh = s.events.slice(seen.current);
    seen.current = s.events.length;
    if (!fresh.length) return;
    counter.current += 1;
    const next: Fx = {
      id: counter.current,
      arrived: new Set(),
      unitHits: new Map(),
      tileHits: new Map(),
      planted: new Set(),
    };
    for (const e of fresh) {
      if (e.t === "play") next.arrived.add(e.uid);
      if (e.t === "attack")
        next.unitHits.set(e.target, (next.unitHits.get(e.target) ?? 0) + e.damage);
      if (e.t === "attack_terrain") {
        const k = `${e.lane},${e.col}`;
        next.tileHits.set(k, (next.tileHits.get(k) ?? 0) + e.damage);
      }
      if (e.t === "terrain") next.planted.add(`${e.lane},${e.col}`);
    }
    setFx(next);
  }, [s]);
  return fx;
}

export function Board({ s, targets, selectedUid, pendingTile, onTile, onInspect }: Props) {
  const fx = useFx(s);
  const tiles = [];
  for (let lane = 0; lane < s.config.lanes; lane++)
    for (let col = 0; col < s.config.columns; col++) {
      const key = `${lane},${col}`;
      tiles.push(
        <Tile
          key={key}
          s={s}
          lane={lane}
          col={col}
          fx={fx}
          target={targets.has(key)}
          pending={pendingTile === key}
          selectedUid={selectedUid}
          onTile={onTile}
          onInspect={onInspect}
        />,
      );
    }
  return (
    <div className="board" role="grid" aria-label="Battlefield">
      {tiles}
    </div>
  );
}

function Tile(props: {
  s: MatchState;
  lane: number;
  col: number;
  fx: Fx;
  target: boolean;
  pending: boolean;
  selectedUid: number | null;
  onTile: (lane: number, col: number) => void;
  onInspect: (i: Inspect) => void;
}) {
  const { s, lane, col, fx } = props;
  const key = `${lane},${col}`;
  const unit = s.units.find((u) => u.lane === lane && u.col === col);
  const terrain = s.terrain[key];
  const zone =
    col <= s.config.deployZone[0][1]
      ? "z-you"
      : col >= s.config.deployZone[1][0]
        ? "z-foe"
        : "z-mid";
  const breach =
    col === s.config.breachColumn[0]
      ? " breach-foe"
      : col === s.config.breachColumn[1]
        ? " breach-you"
        : "";
  const press = useLongPress(
    () => props.onTile(lane, col),
    () => props.onInspect(unit ? { kind: "unit", uid: unit.uid } : { kind: "tile", lane, col }),
  );
  const tileHit = fx.tileHits.get(key);
  const cls = [
    "tile",
    zone + breach,
    terrain ? `t-${terrain.kind}` : "",
    terrain && terrain.owner !== undefined ? (terrain.owner === 0 ? "t-you" : "t-foe") : "",
    fx.planted.has(key) ? "planted" : "",
    tileHit ? "shake" : "",
    props.target ? "target" : "",
    props.pending ? "pending" : "",
  ];
  return (
    <button
      type="button"
      className={cls.join(" ")}
      aria-label={`Lane ${lane + 1}, column ${col + 1}`}
      {...press}
    >
      {terrain && (
        <CardArt id={terrain.kind === "wall" ? "ib_wall" : "vd_forest"} className="terrain-art" />
      )}
      {terrain?.kind === "wall" && <span className="wall-hp">{terrain.hp}</span>}
      {tileHit && (
        <span key={fx.id} className="dmg">
          −{tileHit}
        </span>
      )}
      {unit && (
        <Token
          s={s}
          u={unit}
          selected={props.selectedUid === unit.uid}
          arrived={fx.arrived.has(unit.uid)}
          hit={fx.unitHits.get(unit.uid)}
          fxId={fx.id}
        />
      )}
    </button>
  );
}

function Token(props: {
  s: MatchState;
  u: Unit;
  selected: boolean;
  arrived: boolean;
  hit?: number;
  fxId: number;
}) {
  const { s, u } = props;
  const cls = [
    "token",
    u.owner === 0 ? "you" : "foe",
    u.structure ? "structure" : "",
    canAct(s, u) ? "" : "fresh",
    props.selected ? "selected" : "",
    props.arrived ? "arrive" : "",
    props.hit ? "shake" : "",
  ];
  return (
    <span className={cls.join(" ")}>
      <CardArt id={u.cardId} />
      <span className="atk">{effectiveAttack(s, u)}</span>
      <span className="hp">{u.health}</span>
      {u.stance === "hold" && !u.structure && (
        <span className="hold" title="Holding">
          H
        </span>
      )}
      {props.hit !== undefined && (
        <span key={props.fxId} className="dmg">
          −{props.hit}
        </span>
      )}
    </span>
  );
}

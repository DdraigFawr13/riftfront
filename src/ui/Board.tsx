import { canAct, effectiveAttack, type MatchState, type Unit } from "../engine/index.ts";
import { stamp } from "./text.ts";
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

export function Board({ s, targets, selectedUid, pendingTile, onTile, onInspect }: Props) {
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
  target: boolean;
  pending: boolean;
  selectedUid: number | null;
  onTile: (lane: number, col: number) => void;
  onInspect: (i: Inspect) => void;
}) {
  const { s, lane, col } = props;
  const unit = s.units.find((u) => u.lane === lane && u.col === col);
  const terrain = s.terrain[`${lane},${col}`];
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
  const cls = [
    "tile",
    zone + breach,
    terrain ? `t-${terrain.kind}` : "",
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
      {terrain?.kind === "wall" && <span className="wall-hp">{terrain.hp}</span>}
      {unit && <Token s={s} u={unit} selected={props.selectedUid === unit.uid} />}
    </button>
  );
}

function Token({ s, u, selected }: { s: MatchState; u: Unit; selected: boolean }) {
  const cls = [
    "token",
    u.owner === 0 ? "you" : "foe",
    u.structure ? "structure" : "",
    canAct(s, u) ? "" : "fresh",
    selected ? "selected" : "",
  ];
  return (
    <span className={cls.join(" ")}>
      <span className="stamp">{stamp(u.cardId)}</span>
      <span className="atk">{effectiveAttack(s, u)}</span>
      <span className="hp">{u.health}</span>
      {u.stance === "hold" && !u.structure && (
        <span className="hold" title="Holding">
          H
        </span>
      )}
    </span>
  );
}

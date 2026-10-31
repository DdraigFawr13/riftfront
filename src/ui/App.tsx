import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRuleAi } from "../ai/rule-ai.ts";
import { CARDS } from "../content/factions.ts";
import {
  applyAction,
  canAct,
  describeEvent,
  deriveSeed,
  effectiveAttack,
  legalActions,
  type Action,
  type CommanderDamageMode,
  type MatchState,
} from "../engine/index.ts";
import { Board, type Inspect } from "./Board.tsx";
import {
  loadSave,
  newSave,
  rebuild,
  writeSave,
  type Faction,
  type Save,
  type Storage,
} from "./session.ts";
import { cardLine, KEYWORDS, stamp, yourView } from "./text.ts";
import { useLongPress } from "./useLongPress.ts";

const YOU = 0;
const AI_DELAY_MS = 450;
const FACTIONS: Record<Faction, string> = {
  ironbound: "Ironbound: guards, walls, a watchtower and wall-breakers.",
  verdant: "Verdant: plants Forest; Woodland units hit harder inside it.",
};

function storage(): Storage {
  try {
    const ls = window.localStorage;
    ls.getItem("probe");
    return ls;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

type Selection = { type: "card"; handIndex: number } | { type: "unit"; uid: number } | null;

export function App() {
  const store = useMemo(storage, []);
  const [boot] = useState(() => loadSave(store, Date.now()));
  const [save, setSave] = useState<Save | null>(boot.save);
  const [match, setMatch] = useState<MatchState | null>(boot.state);
  const [notice, setNotice] = useState<string | undefined>(boot.notice);
  const [menu, setMenu] = useState(!boot.state);

  const act = (a: Action) => {
    if (!match || !save) return;
    const next = applyAction(match, a);
    const nextSave = { ...save, actions: [...save.actions, a] };
    setMatch(next);
    setSave(nextSave);
    if (!writeSave(store, nextSave))
      setNotice("This browser isn't saving; the match will be lost if the tab closes.");
  };

  const start = (faction: Faction, mode: CommanderDamageMode) => {
    const fresh = newSave(Date.now() % 2147483647, mode, faction);
    writeSave(store, fresh);
    setSave(fresh);
    setMatch(rebuild(fresh));
    setMenu(false);
  };

  if (menu || !match || !save)
    return (
      <Menu
        canContinue={!!match}
        onContinue={() => setMenu(false)}
        onStart={start}
        notice={notice}
      />
    );
  return (
    <Game
      match={match}
      save={save}
      act={act}
      notice={notice}
      clearNotice={() => setNotice(undefined)}
      openMenu={() => setMenu(true)}
    />
  );
}

function Menu(props: {
  canContinue: boolean;
  onContinue: () => void;
  onStart: (f: Faction, m: CommanderDamageMode) => void;
  notice?: string;
}) {
  const [faction, setFaction] = useState<Faction>("ironbound");
  const [mode, setMode] = useState<CommanderDamageMode>("territorial_breach");
  return (
    <main className="menu">
      <h1>Riftfront</h1>
      <p className="tag">Two map-makers, two toy armies, one war table.</p>
      {props.notice && <p className="notice">{props.notice}</p>}
      <div className="menu-cols">
        <fieldset>
          <legend>Your army</legend>
          {(Object.keys(FACTIONS) as Faction[]).map((f) => (
            <label key={f} className={faction === f ? "choice on" : "choice"}>
              <input
                type="radio"
                name="faction"
                checked={faction === f}
                onChange={() => setFaction(f)}
              />
              {FACTIONS[f]}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Commander damage</legend>
          <label className={mode === "territorial_breach" ? "choice on" : "choice"}>
            <input
              type="radio"
              name="mode"
              checked={mode === "territorial_breach"}
              onChange={() => setMode("territorial_breach")}
            />
            Breach: reach column 6 with an open lane ahead to hit the enemy Commander.
          </label>
          <label className={mode === "unblocked_lane" ? "choice on" : "choice"}>
            <input
              type="radio"
              name="mode"
              checked={mode === "unblocked_lane"}
              onChange={() => setMode("unblocked_lane")}
            />
            Unblocked lane: any unit with an open lane ahead hits the Commander.
          </label>
        </fieldset>
      </div>
      <div className="menu-actions">
        {props.canContinue && (
          <button type="button" className="btn ghost" onClick={props.onContinue}>
            Continue match
          </button>
        )}
        <button type="button" className="btn" onClick={() => props.onStart(faction, mode)}>
          {props.canContinue ? "Start a new match" : "Start match"}
        </button>
      </div>
      <p className="fine">
        You play the left side against the AI. Your match saves after every move.
      </p>
    </main>
  );
}

function Game(props: {
  match: MatchState;
  save: Save;
  act: (a: Action) => void;
  notice?: string;
  clearNotice: () => void;
  openMenu: () => void;
}) {
  const s = props.match;
  const [sel, setSel] = useState<Selection>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const ai = useRef(createRuleAi(deriveSeed(props.save.seed, `ai-${props.save.actions.length}`)));
  const yourTurn = s.phase === "planning" && s.active === YOU;

  // The AI plays the right side, after a short pause so its moves can be followed.
  useEffect(() => {
    if (s.phase === "over" || s.active === YOU) return;
    const t = window.setTimeout(() => props.act(ai.current.decide(s)), AI_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [s]);
  useEffect(() => {
    setSel(null);
    setPending(null);
  }, [s]);

  const legal = useMemo(() => (yourTurn ? legalActions(s) : []), [s, yourTurn]);
  const targets = useMemo(() => {
    const out = new Set<string>();
    if (sel?.type === "card")
      for (const a of legal)
        if (a.type === "play" && a.handIndex === sel.handIndex) out.add(`${a.lane},${a.col}`);
    return out;
  }, [legal, sel]);

  const onTile = (lane: number, col: number) => {
    if (!yourTurn) return;
    const key = `${lane},${col}`;
    if (sel?.type === "card" && targets.has(key)) {
      setPending({ type: "play", player: YOU, handIndex: sel.handIndex, lane, col });
      return;
    }
    setPending(null);
    const u = s.units.find(
      (v) => v.lane === lane && v.col === col && v.owner === YOU && !v.structure,
    );
    setSel(u ? { type: "unit", uid: u.uid } : null);
  };

  const me = s.players[YOU];
  const foe = s.players[1];
  const selUnit = sel?.type === "unit" ? s.units.find((u) => u.uid === sel.uid) : undefined;
  const unitActions = selUnit
    ? legal.filter((a) => (a.type === "stance" || a.type === "reposition") && a.uid === selUnit.uid)
    : [];
  const pendingTile = pending?.type === "play" ? `${pending.lane},${pending.col}` : null;
  const status =
    s.phase === "over"
      ? "Match over"
      : s.phase === "mulligan"
        ? "Choose cards to redraw"
        : yourTurn
          ? me.passed
            ? "Waiting"
            : "Your move"
          : me.passed
            ? "You passed; the enemy is moving"
            : "The enemy is moving";

  return (
    <div className="game">
      <header className="topbar">
        <span className="side-you">You {me.hp} ♥</span>
        <span className="energy" aria-label={`${me.energy} energy`}>
          ⚡{me.energy}
        </span>
        <span className="status">
          Round {Math.max(1, s.round)} · {status}
        </span>
        <span className="side-foe">
          Enemy {foe.hp} ♥ · {foe.hand.length} cards
        </span>
        <button type="button" className="menu-btn" onClick={props.openMenu} aria-label="Menu">
          ☰
        </button>
      </header>
      <section className="field">
        <Board
          s={s}
          targets={targets}
          selectedUid={selUnit?.uid ?? null}
          pendingTile={pendingTile}
          onTile={onTile}
          onInspect={setInspect}
        />
      </section>
      <aside className="side">
        <div className="hand" aria-label="Your hand">
          {me.hand.map((id, i) => (
            <HandCard
              key={`${id}-${i}`}
              cardId={id}
              affordable={(CARDS[id]?.cost ?? 99) <= me.energy}
              selected={sel?.type === "card" && sel.handIndex === i}
              disabled={!yourTurn}
              onTap={() => {
                setPending(null);
                setSel(
                  sel?.type === "card" && sel.handIndex === i
                    ? null
                    : { type: "card", handIndex: i },
                );
              }}
              onInspect={() => setInspect({ kind: "card", cardId: id })}
            />
          ))}
          {me.hand.length === 0 && <p className="empty">No cards in hand.</p>}
        </div>
        {selUnit && unitActions.length > 0 && (
          <div className="unit-actions">
            {unitActions.map((a, i) => (
              <button key={i} type="button" className="btn small" onClick={() => props.act(a)}>
                {a.type === "stance"
                  ? a.stance === "hold"
                    ? "Hold position"
                    : "Advance"
                  : a.type === "reposition" && a.step === 1
                    ? "Step forward"
                    : "Step back"}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn pass"
          disabled={!yourTurn}
          onClick={() => props.act({ type: "pass", player: YOU })}
        >
          Pass
        </button>
        <Ticker s={s} />
      </aside>
      {pending && (
        <div className="confirm" role="dialog" aria-label="Confirm move">
          <span>
            Play {CARDS[me.hand[(pending as { handIndex: number }).handIndex] ?? ""]?.name} at lane{" "}
            {(pending as { lane: number }).lane + 1}, column {(pending as { col: number }).col + 1}?
          </span>
          <button type="button" className="btn" onClick={() => props.act(pending)}>
            Confirm
          </button>
          <button type="button" className="btn ghost" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      )}
      {s.phase === "mulligan" && s.active === YOU && <Mulligan s={s} act={props.act} />}
      {inspect && <Inspector s={s} what={inspect} close={() => setInspect(null)} />}
      {s.outcome && <EndScreen s={s} openMenu={props.openMenu} />}
      {props.notice && (
        <div className="toast" role="status" onClick={props.clearNotice}>
          {props.notice}
        </div>
      )}
      <div className="rotate">
        <p>Turn your phone sideways to play.</p>
      </div>
    </div>
  );
}

function HandCard(props: {
  cardId: string;
  affordable: boolean;
  selected: boolean;
  disabled: boolean;
  onTap: () => void;
  onInspect: () => void;
}) {
  const c = CARDS[props.cardId]!;
  const press = useLongPress(() => !props.disabled && props.onTap(), props.onInspect);
  const cls = [
    "card",
    `f-${c.faction}`,
    props.selected ? "selected" : "",
    props.affordable ? "" : "dear",
  ];
  return (
    <button type="button" className={cls.join(" ")} aria-pressed={props.selected} {...press}>
      <span className="cost">{c.cost}</span>
      <span className="name">{c.name}</span>
      <span className="line">
        {c.kind === "unit" || c.kind === "structure"
          ? `${c.attack}/${c.health} r${c.range}`
          : c.kind}
      </span>
    </button>
  );
}

function Mulligan({ s, act }: { s: MatchState; act: (a: Action) => void }) {
  const [marked, setMarked] = useState<number[]>([]);
  const hand = s.players[YOU].hand;
  return (
    <div className="overlay">
      <div className="panel">
        <h2>Opening hand</h2>
        <p>
          Tap the cards you want to redraw, once. You go{" "}
          {s.firstPlayer === YOU ? "first" : "second"} in round 1.
        </p>
        <div className="mull">
          {hand.map((id, i) => (
            <button
              key={i}
              type="button"
              className={marked.includes(i) ? "card marked" : "card"}
              onClick={() =>
                setMarked(marked.includes(i) ? marked.filter((x) => x !== i) : [...marked, i])
              }
            >
              <span className="cost">{CARDS[id]?.cost}</span>
              <span className="name">{CARDS[id]?.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => act({ type: "mulligan", player: YOU, handIndexes: marked })}
        >
          {marked.length ? `Redraw ${marked.length}` : "Keep all"}
        </button>
      </div>
    </div>
  );
}

function Inspector({ s, what, close }: { s: MatchState; what: Inspect; close: () => void }) {
  let body: ReactNode;
  if (what.kind === "card") {
    const c = CARDS[what.cardId]!;
    body = (
      <>
        <h2>{c.name}</h2>
        <p className="meta">
          Cost {c.cost} · {c.kind} · {c.faction}
        </p>
        <p>{cardLine(c)}</p>
        {c.text && <p>{c.text}</p>}
        {"keywords" in c && c.keywords?.map((k) => <p key={k}>{KEYWORDS[k]}</p>)}
      </>
    );
  } else if (what.kind === "unit") {
    const u = s.units.find((v) => v.uid === what.uid);
    const c = u ? CARDS[u.cardId] : undefined;
    body =
      u && c ? (
        <>
          <h2>
            {u.owner === YOU ? "Your" : "Enemy"} {c.name}
          </h2>
          <p>
            {effectiveAttack(s, u)} attack · {u.health} health · range {u.range}
            {u.structure ? " · never moves" : ` · move ${u.move}`}
          </p>
          {!u.structure && <p>Stance: {u.stance === "hold" ? "holding position" : "advancing"}</p>}
          {!canAct(s, u) && <p>Just arrived: acts next round.</p>}
          {u.keywords.map((k) => (
            <p key={k}>{KEYWORDS[k]}</p>
          ))}
          {s.terrain[`${u.lane},${u.col}`] && <TerrainNote s={s} lane={u.lane} col={u.col} />}
        </>
      ) : (
        <p>That unit is gone.</p>
      );
  } else {
    body = s.terrain[`${what.lane},${what.col}`] ? (
      <TerrainNote s={s} lane={what.lane} col={what.col} />
    ) : (
      <p>
        Open ground, lane {what.lane + 1}, column {what.col + 1}.
        {what.col === s.config.breachColumn[0] &&
          " Your units here with an open lane ahead hit the enemy Commander."}
      </p>
    );
  }
  return (
    <div className="overlay" onClick={close}>
      <div className="panel inspect">
        {body}
        <p className="fine">Tap anywhere to close.</p>
      </div>
    </div>
  );
}

function TerrainNote({ s, lane, col }: { s: MatchState; lane: number; col: number }) {
  const t = s.terrain[`${lane},${col}`]!;
  const whose = t.owner === YOU ? "Your" : "Enemy";
  return t.kind === "wall" ? (
    <p>
      {whose} Stone Wall, {t.hp} health. Blocks movement, shots and breaches in this lane.
    </p>
  ) : (
    <p>{whose} Forest. Ranged hits on units here deal 1 less; Woodland units here get +1 attack.</p>
  );
}

function Ticker({ s }: { s: MatchState }) {
  const names = useMemo(() => {
    const m = new Map<number, string>();
    for (const e of s.events)
      if (e.t === "play")
        m.set(
          e.uid,
          `${e.player === YOU ? "Your" : "Enemy"} ${CARDS[e.cardId]?.name ?? stamp(e.cardId)}`,
        );
    return m;
  }, [s]);
  const lines = s.events
    .filter((e) => e.t !== "draw" && e.t !== "energy")
    .slice(-5)
    .map((e) => yourView(describeEvent(s, e, names)));
  return (
    <ol className="ticker" aria-label="Recent events">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ol>
  );
}

function EndScreen({ s, openMenu }: { s: MatchState; openMenu: () => void }) {
  const o = s.outcome!;
  const title = o.winner === "draw" ? "Draw" : o.winner === YOU ? "Victory" : "Defeat";
  const why =
    o.reason === "deckout"
      ? "a Commander ran out of cards"
      : o.reason === "round_cap"
        ? "the round limit"
        : "Commander damage";
  return (
    <div className="overlay">
      <div className="panel">
        <h2>{title}</h2>
        <p>
          Round {o.round}, by {why}. Your Commander {s.players[YOU].hp} ♥, enemy {s.players[1].hp}{" "}
          ♥.
        </p>
        <button type="button" className="btn" onClick={openMenu}>
          New match
        </button>
      </div>
    </div>
  );
}

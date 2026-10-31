import { CARDS, DECKS } from "../content/factions.ts";
import {
  replay,
  RULES_VERSION,
  type Action,
  type CommanderDamageMode,
  type MatchSetup,
  type MatchState,
} from "../engine/index.ts";

export type Faction = keyof typeof DECKS;

/**
 * A saved match is its setup plus the action log, so it replays exactly (D-008). The human always
 * sits on the left (player 0). Bump SAVE_VERSION when this shape changes, and teach upgradeSave
 * to read the old one (GAME-05).
 */
export const SAVE_VERSION = 1;
export const SAVE_KEY = "riftfront.save";

export interface Save {
  saveVersion: 1;
  rulesVersion: string;
  seed: number;
  mode: CommanderDamageMode;
  humanFaction: Faction;
  actions: Action[];
}

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const otherFaction = (f: Faction): Faction => (f === "ironbound" ? "verdant" : "ironbound");

export function newSave(seed: number, mode: CommanderDamageMode, humanFaction: Faction): Save {
  return { saveVersion: 1, rulesVersion: RULES_VERSION, seed, mode, humanFaction, actions: [] };
}

export function setupFor(save: Save): MatchSetup {
  return {
    seed: save.seed,
    cards: CARDS,
    decks: [DECKS[save.humanFaction], DECKS[otherFaction(save.humanFaction)]],
    config: { commanderDamageMode: save.mode },
  };
}

export function rebuild(save: Save): MatchState {
  return replay(setupFor(save), save.actions);
}

/** Older save shapes are upgraded here. Version 1 is the first, so there is nothing to upgrade. */
function upgradeSave(raw: unknown): Save | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<Save>;
  if (s.saveVersion !== SAVE_VERSION || !Array.isArray(s.actions) || typeof s.seed !== "number")
    return null;
  return s as Save;
}

export interface Loaded {
  save: Save | null;
  state: MatchState | null;
  /** Set when a save existed but could not be resumed; it was kept under `keptAs`. */
  notice?: string;
  keptAs?: string;
}

/**
 * Resume the saved match if it still replays under the current rules. A save that can't be read
 * or replayed is never overwritten silently: it is copied to a dated key and the player is told.
 */
export function loadSave(storage: Storage, now: number): Loaded {
  let text: string | null = null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return { save: null, state: null };
  }
  if (!text) return { save: null, state: null };
  let save: Save | null = null;
  let reason = "it could not be read";
  try {
    save = upgradeSave(JSON.parse(text));
    if (save && save.rulesVersion !== RULES_VERSION) {
      reason = `it was made with rules ${save.rulesVersion}, and this version is ${RULES_VERSION}`;
      save = null;
    }
    if (save) return { save, state: rebuild(save) };
  } catch {
    reason = "it no longer replays under the current rules";
  }
  const keptAs = `${SAVE_KEY}.unreadable-${now}`;
  try {
    storage.setItem(keptAs, text);
  } catch {
    /* storage full or blocked: the original key is still untouched */
  }
  return {
    save: null,
    state: null,
    keptAs,
    notice: `Your last match couldn't be resumed because ${reason}. It was kept, not deleted.`,
  };
}

export function writeSave(storage: Storage, save: Save): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

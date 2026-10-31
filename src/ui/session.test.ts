import { describe, expect, it } from "vitest";
import { createRuleAi } from "../ai/rule-ai.ts";
import { applyAction } from "../engine/index.ts";
import { loadSave, newSave, rebuild, SAVE_KEY, writeSave, type Storage } from "./session.ts";

function memory(): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe("saves (GAME-05)", () => {
  it("resume to the same state after every action", () => {
    const store = memory();
    const save = newSave(21, "territorial_breach", "verdant");
    let s = rebuild(save);
    const ai = createRuleAi(1);
    for (let i = 0; i < 25 && s.phase !== "over"; i++) {
      const a = ai.decide(s);
      s = applyAction(s, a);
      save.actions.push(a);
      writeSave(store, save);
    }
    const loaded = loadSave(store, 0);
    expect(loaded.state).toEqual(s);
  });

  it("keep an unreadable save under a dated key instead of overwriting it", () => {
    const store = memory();
    store.setItem(SAVE_KEY, "{not json");
    const loaded = loadSave(store, 123);
    expect(loaded.state).toBeNull();
    expect(loaded.notice).toMatch(/kept/);
    expect(store.getItem(`${SAVE_KEY}.unreadable-123`)).toBe("{not json");
    expect(store.getItem(SAVE_KEY)).toBe("{not json");
  });

  it("refuse a save from another rules version, and keep it", () => {
    const store = memory();
    const save = { ...newSave(1, "territorial_breach", "ironbound"), rulesVersion: "0.0.1" };
    writeSave(store, save);
    const loaded = loadSave(store, 5);
    expect(loaded.state).toBeNull();
    expect(loaded.notice).toMatch(/rules 0\.0\.1/);
    expect(store.getItem(`${SAVE_KEY}.unreadable-5`)).not.toBeNull();
  });

  it("start fresh when there is no save or storage is blocked", () => {
    expect(loadSave(memory(), 0).state).toBeNull();
    const blocked: Storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadSave(blocked, 0)).toEqual({ save: null, state: null });
    expect(writeSave(blocked, newSave(1, "territorial_breach", "ironbound"))).toBe(false);
  });
});

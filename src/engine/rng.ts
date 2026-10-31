/** Seeded PRNG (mulberry32). The engine never reads Math.random or the clock (GAME-01). */
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Derive an independent stream seed from a base seed and a label, so streams don't share state. */
export function deriveSeed(seed: number, label: string): number {
  let h = seed | 0;
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 0x5bd1e995) | 0;
  return (h ^ (h >>> 13)) | 0;
}

/** Fisher-Yates shuffle; returns the shuffled copy and the advanced stream state. */
export function shuffle<T>(items: readonly T[], state: number): [T[], number] {
  const out = items.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const [r, n] = nextRandom(s);
    s = n;
    const j = Math.floor(r * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return [out, s];
}

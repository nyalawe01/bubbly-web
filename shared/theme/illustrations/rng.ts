// shared/theme/illustrations/rng.ts
// Deterministic seeded RNG so a composed layout is unique per (theme, surface,
// user) yet stable across reloads. mulberry32 PRNG + a tiny string hash seed.

/** Small, fast 32-bit string hash (FNV-1a-ish) → uint32 seed. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — returns a function producing floats in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seedStr: string) {
  const rand = mulberry32(hashString(seedStr));
  return {
    next: rand,
    /** float in [min,max) */
    range: (min: number, max: number) => min + rand() * (max - min),
    /** int in [min,max] inclusive */
    int: (min: number, max: number) => Math.floor(min + rand() * (max - min + 1)),
    pick: <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)],
    chance: (p: number) => rand() < p,
  };
}

export type Rng = ReturnType<typeof makeRng>;

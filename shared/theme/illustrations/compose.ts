// shared/theme/illustrations/compose.ts
//
// Turns (theme, surface[, user]) into a stable-but-unique scatter of DIFFERENT
// motifs — biased to edges/corners, anti-repeat, with the occasional secondary
// (accent2) motif. Seeded so every surface differs yet is stable on reload and
// can be personalized per student later (pass userId into the seed).

import { THEMES } from "../themes";
import type { ThemeName } from "../types";
import { getMotifSet } from "./motifs";
import { makeRng } from "./rng";

export interface Placement {
  /** inner SVG markup (uses currentColor + the __A2__ secondary slot). */
  markup: string;
  x: number; // 0..100 (% from left)
  y: number; // 0..100 (% from top)
  size: number; // relative px size
  rotation: number; // degrees
  /** when true, primary/secondary colors are swapped for variety. */
  secondary: boolean;
}

// Placement zones, weighted toward edges/corners so the center (content) stays clear.
type Zone = [xMin: number, xMax: number, yMin: number, yMax: number, weight: number];
const ZONES: Zone[] = [
  [1, 18, 1, 18, 3], // TL
  [82, 99, 1, 18, 3], // TR
  [1, 18, 82, 99, 3], // BL
  [82, 99, 82, 99, 3], // BR
  [22, 78, 1, 12, 2], // top edge
  [22, 78, 88, 99, 2], // bottom edge
  [1, 12, 22, 78, 2], // left edge
  [88, 99, 22, 78, 2], // right edge
  [38, 62, 40, 60, 0.6], // center (rare)
];

function pickZone(rng: ReturnType<typeof makeRng>): Zone {
  const total = ZONES.reduce((s, z) => s + z[4], 0);
  let r = rng.next() * total;
  for (const z of ZONES) {
    r -= z[4];
    if (r <= 0) return z;
  }
  return ZONES[0];
}

export interface ComposeOpts {
  count?: number;
  sizeMin?: number;
  sizeMax?: number;
  userId?: string;
  seedSalt?: string;
}

export function compose(theme: ThemeName, surface: string, opts: ComposeOpts = {}): Placement[] {
  const motifs = getMotifSet(THEMES[theme].assets.motifSet);
  const count = opts.count ?? 7;
  const sizeMin = opts.sizeMin ?? 46;
  const sizeMax = opts.sizeMax ?? 96;
  const rng = makeRng(`${theme}|${surface}|${opts.userId || ""}|${opts.seedSalt || ""}`);

  // Anti-repeat: walk a shuffled index list so consecutive motifs differ, and no
  // motif repeats until the whole set has been used.
  const order: number[] = motifs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }

  const placements: Placement[] = [];
  for (let i = 0; i < count; i++) {
    const motif = motifs[order[i % order.length]];
    const z = pickZone(rng);
    placements.push({
      markup: motif(),
      x: rng.range(z[0], z[1]),
      y: rng.range(z[2], z[3]),
      size: rng.range(sizeMin, sizeMax),
      rotation: rng.range(-28, 28),
      secondary: rng.chance(0.22),
    });
  }
  return placements;
}

/** A bespoke empty-state vignette: 3 deliberately-scaled motifs, center-weighted. */
export function heroArt(theme: ThemeName, opts: { userId?: string } = {}): Placement[] {
  const motifs = getMotifSet(THEMES[theme].assets.motifSet);
  const rng = makeRng(`${theme}|hero|${opts.userId || ""}`);
  const order = motifs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Large soft focal + two smaller accents, spread around the hero text.
  return [
    { markup: motifs[order[0]](), x: 22, y: 30, size: 120, rotation: rng.range(-16, 16), secondary: false },
    { markup: motifs[order[1]](), x: 76, y: 60, size: 92, rotation: rng.range(-20, 20), secondary: true },
    { markup: motifs[order[2]](), x: 60, y: 20, size: 64, rotation: rng.range(-24, 24), secondary: false },
  ];
}

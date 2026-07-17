// shared/theme/illustrations/motifs.ts
//
// Code-drawn SVG motif library — the visual vocabulary per theme. Each motif is
// a function returning INNER svg markup in a 100x100 coordinate space, using
// `currentColor` for the primary stroke/fill and the literal token `__A2__`
// wherever the secondary (accent2) color should be substituted at render time.
// No image files anywhere — everything is generated.

export type Motif = (size?: number) => string;

const S = 'stroke="currentColor" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
const S2 = 'stroke="__A2__" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor"';
const F2 = 'fill="__A2__"';

// ---- Geometric family (focus / dark / mono) ----------------------------------
const ring: Motif = () => `<circle cx="50" cy="50" r="34" ${S}/><circle cx="50" cy="50" r="18" ${S}/>`;
const dotGrid: Motif = () => {
  let o = "";
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o += `<circle cx="${25 + c * 25}" cy="${25 + r * 25}" r="4" ${F}/>`;
  return o;
};
const arc: Motif = () => `<path d="M20 80 A60 60 0 0 1 80 20" ${S}/>`;
const plusMark: Motif = () => `<path d="M50 24V76M24 50H76" ${S}/>`;
const triangle: Motif = () => `<path d="M50 22 L78 74 L22 74 Z" ${S}/>`;
const waveLine: Motif = () => `<path d="M14 50 Q32 26 50 50 T86 50" ${S}/>`;
const hatch: Motif = () => `<path d="M26 74 L74 26 M40 80 L80 40 M20 60 L60 20" ${S}/>`;
const squareR: Motif = () => `<rect x="30" y="30" width="40" height="40" rx="6" transform="rotate(18 50 50)" ${S}/>`;
const halfCircle: Motif = () => `<path d="M22 60 A28 28 0 0 1 78 60" ${S}/>`;
const circleCluster: Motif = () => `<circle cx="40" cy="42" r="14" ${S}/><circle cx="62" cy="58" r="10" ${S2}/>`;
const crosshair: Motif = () => `<circle cx="50" cy="50" r="22" ${S}/><path d="M50 18V32M50 68V82M18 50H32M68 50H82" ${S}/>`;
const bracket: Motif = () => `<path d="M40 26H26V74H40 M60 26H74V74H60" ${S}/>`;
const concentricDots: Motif = () => `<circle cx="50" cy="50" r="6" ${F}/><circle cx="50" cy="50" r="26" ${S2}/>`;
const chevrons: Motif = () => `<path d="M32 34 L50 52 L68 34 M32 54 L50 72 L68 54" ${S}/>`;

const GEO = [ring, dotGrid, arc, plusMark, triangle, waveLine, hatch, squareR, halfCircle, circleCluster, crosshair, bracket, concentricDots, chevrons];

// ---- Nature family (forest) --------------------------------------------------
const leaf: Motif = () => `<path d="M50 82 C24 66 24 30 50 18 C76 30 76 66 50 82 Z" ${S}/><path d="M50 24 V78" ${S}/>`;
const branch: Motif = () => `<path d="M50 84 V30" ${S}/><path d="M50 52 C36 44 32 34 34 28 M50 44 C64 36 68 26 66 20 M50 60 C40 54 36 46 38 42" ${S2}/>`;
const pine: Motif = () => `<path d="M50 20 L66 44 H54 L70 66 H30 L46 44 H34 Z" ${S}/><path d="M50 66 V84" ${S}/>`;
const hill: Motif = () => `<path d="M14 74 Q34 50 52 66 T88 60" ${S}/>`;
const sprout: Motif = () => `<path d="M50 82 V46" ${S}/><path d="M50 56 C34 54 28 40 30 30 C44 32 52 44 50 56 Z" ${S2}/><path d="M50 50 C66 48 72 36 70 26 C56 28 48 40 50 50 Z" ${S}/>`;
const fern: Motif = () => `<path d="M50 84 C42 60 42 36 50 18" ${S}/><path d="M50 34 L38 28 M50 44 L36 40 M50 54 L38 52 M50 30 L62 24 M50 40 L64 38 M50 50 L62 50" ${S2}/>`;
const seed: Motif = () => `<ellipse cx="50" cy="52" rx="16" ry="24" ${S}/><path d="M50 30 V70" ${S2}/>`;
const mushroom: Motif = () => `<path d="M28 48 A22 18 0 0 1 72 48 Z" ${S}/><path d="M42 48 V72 H58 V48" ${S}/>`;
const grassTuft: Motif = () => `<path d="M40 80 C38 60 40 46 44 34 M50 80 C50 58 50 42 50 28 M60 80 C62 60 60 46 56 36" ${S}/>`;
const berry: Motif = () => `<circle cx="42" cy="58" r="9" ${F2}/><circle cx="60" cy="54" r="9" ${F2}/><path d="M42 49 L48 30 M60 45 L54 30" ${S}/>`;
const windCurl: Motif = () => `<path d="M20 44 H62 A10 10 0 1 0 52 34" ${S}/><path d="M20 60 H50 A8 8 0 1 1 42 68" ${S2}/>`;
const acorn: Motif = () => `<path d="M34 44 A16 16 0 0 0 66 44 Z" ${F}/><path d="M34 44 Q50 34 66 44" ${S2}/><path d="M50 60 V72" ${S}/>`;

const FOREST = [leaf, branch, pine, hill, sprout, fern, seed, mushroom, grassTuft, berry, windCurl, acorn];

// ---- Cozy family -------------------------------------------------------------
const steam: Motif = () => `<path d="M40 70 C30 58 50 50 40 36 C34 28 46 22 42 14 M60 70 C50 58 70 50 60 36 C54 28 66 22 62 14" ${S}/>`;
const mug: Motif = () => `<path d="M30 40 H64 V64 A10 10 0 0 1 54 74 H40 A10 10 0 0 1 30 64 Z" ${S}/><path d="M64 46 H74 A8 8 0 0 1 74 62 H64" ${S2}/>`;
const bookOpen: Motif = () => `<path d="M50 30 C40 24 26 24 20 28 V70 C26 66 40 66 50 72 C60 66 74 66 80 70 V28 C74 24 60 24 50 30 Z" ${S}/><path d="M50 30 V72" ${S2}/>`;
const candle: Motif = () => `<path d="M50 30 C56 36 56 44 50 46 C44 44 44 36 50 30 Z" ${F2}/><rect x="42" y="48" width="16" height="30" rx="3" ${S}/>`;
const yarn: Motif = () => `<circle cx="50" cy="50" r="26" ${S}/><path d="M32 40 Q50 58 68 42 M30 54 Q50 68 70 52 M40 30 Q52 50 62 68" ${S2}/>`;
const moonSoft: Motif = () => `<path d="M62 26 A28 28 0 1 0 62 74 A22 22 0 1 1 62 26 Z" ${F}/>`;
const heartSoft: Motif = () => `<path d="M50 74 C24 56 26 32 42 32 C50 32 50 40 50 42 C50 40 50 32 58 32 C74 32 76 56 50 74 Z" ${S}/>`;
const teapot: Motif = () => `<path d="M28 50 A22 16 0 0 0 72 50 Z" ${S}/><path d="M28 50 Q18 46 20 40 M50 34 V50 M42 30 H58" ${S2}/>`;
const cloudSoft: Motif = () => `<path d="M30 62 A14 14 0 0 1 42 40 A16 16 0 0 1 70 44 A12 12 0 0 1 70 62 Z" ${S}/>`;
const zzz: Motif = () => `<path d="M30 40 H46 L30 56 H46 M52 30 H64 L52 44 H64 M66 22 H74 L66 32 H74" ${S2}/>`;
const spool: Motif = () => `<rect x="34" y="30" width="32" height="40" rx="4" ${S}/><path d="M34 40 H66 M34 60 H66" ${S2}/>`;
const star4: Motif = () => `<path d="M50 22 C52 42 58 48 78 50 C58 52 52 58 50 78 C48 58 42 52 22 50 C42 48 48 42 50 22 Z" ${F2}/>`;

const COZY = [steam, mug, bookOpen, candle, yarn, moonSoft, heartSoft, teapot, cloudSoft, zzz, spool, star4];

// ---- Night family ------------------------------------------------------------
const star5: Motif = () => `<path d="M50 20 L58 42 L82 42 L62 56 L70 78 L50 64 L30 78 L38 56 L18 42 L42 42 Z" ${F}/>`;
const crescent: Motif = () => `<path d="M64 24 A30 30 0 1 0 64 76 A24 24 0 1 1 64 24 Z" ${F}/>`;
const constellation: Motif = () => `<path d="M26 34 L46 50 L64 40 L78 62" ${S2}/><circle cx="26" cy="34" r="4" ${F}/><circle cx="46" cy="50" r="4" ${F}/><circle cx="64" cy="40" r="4" ${F}/><circle cx="78" cy="62" r="4" ${F}/>`;
const sparkle4: Motif = () => `<path d="M50 24 L54 46 L76 50 L54 54 L50 76 L46 54 L24 50 L46 46 Z" ${F2}/>`;
const tinyDot: Motif = () => `<circle cx="50" cy="50" r="6" ${F}/>`;
const shootingStar: Motif = () => `<path d="M24 72 L60 36" ${S2}/><path d="M60 24 L64 40 L80 44 L64 48 L60 64 L56 48 L40 44 L56 40 Z" ${F}/>`;
const planetRing: Motif = () => `<circle cx="50" cy="50" r="18" ${F}/><ellipse cx="50" cy="50" rx="34" ry="12" transform="rotate(-20 50 50)" ${S2}/>`;
const cloudNight: Motif = () => `<path d="M28 62 A13 13 0 0 1 40 42 A15 15 0 0 1 68 46 A11 11 0 0 1 68 62 Z" ${S}/>`;
const burstStar: Motif = () => `<path d="M50 26 V74 M26 50 H74 M33 33 L67 67 M67 33 L33 67" ${S2}/>`;
const dotCluster: Motif = () => `<circle cx="38" cy="42" r="5" ${F}/><circle cx="60" cy="38" r="3" ${F}/><circle cx="54" cy="60" r="4" ${F}/><circle cx="34" cy="62" r="3" ${F}/>`;
const comet: Motif = () => `<circle cx="66" cy="34" r="10" ${F}/><path d="M58 42 L28 72 M62 46 L38 70 M54 40 L34 60" ${S2}/>`;
const twinkle: Motif = () => `<path d="M50 30 V70 M30 50 H70" ${S}/><circle cx="50" cy="50" r="3" ${F2}/>`;

const NIGHT = [star5, crescent, constellation, sparkle4, tinyDot, shootingStar, planetRing, cloudNight, burstStar, dotCluster, comet, twinkle];

// ---- Playful family ----------------------------------------------------------
const squiggle: Motif = () => `<path d="M18 50 Q30 30 42 50 T66 50 T90 50" ${S}/>`;
const asterisk: Motif = () => `<path d="M50 24V76M28 37L72 63M72 37L28 63" ${S}/>`;
const heartBold: Motif = () => `<path d="M50 76 C22 56 24 30 42 30 C50 30 50 40 50 44 C50 40 50 30 58 30 C76 30 78 56 50 76 Z" ${F2}/>`;
const zigzag: Motif = () => `<path d="M20 40 L34 60 L48 40 L62 60 L76 40" ${S}/>`;
const blob: Motif = () => `<path d="M40 24 C64 18 84 34 78 54 C74 74 50 82 34 72 C16 60 16 32 40 24 Z" ${S2}/>`;
const spiral: Motif = () => `<path d="M50 50 m0 0 a6 6 0 1 1 -6 6 a14 14 0 1 0 14 -14 a24 24 0 1 1 -24 24" ${S}/>`;
const lightning: Motif = () => `<path d="M54 18 L32 54 H48 L44 82 L70 44 H52 Z" ${F}/>`;
const confetti: Motif = () => `<path d="M28 34 L38 30 L34 42 Z" ${F}/><path d="M64 60 L74 56 L70 68 Z" ${F2}/><path d="M60 28 L70 26 L66 38 Z" ${S}/>`;
const circlePair: Motif = () => `<circle cx="40" cy="48" r="16" ${S}/><circle cx="64" cy="54" r="12" ${F2}/>`;
const loop: Motif = () => `<path d="M28 62 C28 34 72 34 72 62 C72 78 44 78 44 58 C44 44 60 44 60 58" ${S}/>`;
const starBounce: Motif = () => `<path d="M50 22 L57 44 L80 44 L61 58 L68 80 L50 66 L32 80 L39 58 L20 44 L43 44 Z" ${S2}/>`;
const plusBold: Motif = () => `<path d="M50 26 V74 M26 50 H74" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>`;

const PLAYFUL = [squiggle, asterisk, heartBold, zigzag, blob, spiral, lightning, confetti, circlePair, loop, starBounce, plusBold];

/** Motif library keyed by a theme's assets.motifSet. */
export const MOTIF_SETS: Record<string, Motif[]> = {
  focus: [ring, dotGrid, arc, plusMark, waveLine, halfCircle, circleCluster, crosshair, concentricDots, chevrons, triangle, bracket],
  dark: [ring, arc, waveLine, crosshair, concentricDots, dotGrid, halfCircle, chevrons, circleCluster, plusMark, squareR, bracket],
  mono: [squareR, hatch, bracket, plusMark, triangle, dotGrid, chevrons, halfCircle, crosshair, ring, arc, waveLine],
  forest: FOREST,
  cozy: COZY,
  night: NIGHT,
  playful: PLAYFUL,
};

export function getMotifSet(motifSet: string): Motif[] {
  return MOTIF_SETS[motifSet] || GEO;
}

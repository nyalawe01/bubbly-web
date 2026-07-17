// shared/theme/types.ts
//
// The canonical theme shape, shared by web (Next.js) and mobile (Expo).
// A theme is a BUNDLE — not just colors, but typography, shape, motion and
// asset (illustration motif) keys too. This is the single source of truth;
// web derives CSS variables from it and mobile derives a flat token object.

export type ThemeName = "focus" | "dark";
export type ThemePreference = ThemeName | "system";
export type MotionIntensity = "calm" | "normal" | "lively";
export type FontPref = "sans" | "serif";

export interface Theme {
  id: ThemeName;
  name: string;
  mood: string;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    text2: string;
    accent: string;
    accent2: string;
    accentSoft: string;
    accentInk: string;
  };
  typography: {
    /** Logical font role for display/wordmark/headings — 'serif' | 'sans' | 'rounded' | 'mono'. */
    displayFont: "serif" | "sans" | "rounded" | "mono";
    /** Logical font role for body/UI text. */
    bodyFont: "serif" | "sans" | "rounded" | "mono";
    displayWeight: number;
    tracking: string; // letter-spacing, e.g. "-0.01em"
  };
  shape: {
    radius: string; // primary radius, e.g. "16px"
    radiusSm: string;
  };
  motion: {
    ease: string; // cubic-bezier(...)
    intensity: MotionIntensity;
  };
  assets: {
    motifSet: string; // key into the illustration motif library
    ambientSound?: string;
  };
}

/** The flat, fully-derived token set every existing consumer already reads
 *  (mobile ThemeProvider.tokens.*, web CSS vars). Derived from a Theme bundle
 *  by deriveTokens() so the bundle stays the one source of truth. */
export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceHover: string;
  bgSidebar: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;
  bgActive: string;
  foreground: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  accentSoft: string;
  accentInk: string;
  btnPrimary: string;
  btnPrimaryForeground: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
}

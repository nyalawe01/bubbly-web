// shared/theme/themes.ts
//
// The theme bundles — the ONE canonical source consumed by web + mobile.
// Web derives CSS custom properties (THEME_CSS_VARS); mobile derives a flat
// token object (THEME_TOKENS). Nothing else defines colors.
//
// Only two themes are offered: Light and Dark. (The key for Light stays "focus"
// so previously-saved preferences keep resolving.)

import type { Theme, ThemeName, ThemeTokens, ThemePreference, MotionIntensity } from "./types";

export const DEFAULT_THEME: ThemeName = "focus";

const SEMANTIC = { success: "#22c55e", danger: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

export const THEMES: Record<ThemeName, Theme> = {
  // Light — Premium minimalist (Notion/Linear style): crisp white, deep zinc text, stark contrast.
  focus: {
    id: "focus", name: "Light", mood: "Clean, pristine daylight.",
    colors: {
      bg: "#FFFFFF", surface: "#FFFFFF", surface2: "#F4F4F5", border: "#E4E4E7",
      text: "#09090B", text2: "#71717A",
      accent: "#18181B", accent2: "#27272A", accentSoft: "#F4F4F5", accentInk: "#FFFFFF",
    },
    typography: { displayFont: "sans", bodyFont: "sans", displayWeight: 600, tracking: "-0.02em" },
    shape: { radius: "12px", radiusSm: "8px" },
    motion: { ease: "cubic-bezier(0.16,1,0.3,1)", intensity: "calm" },
    assets: { motifSet: "focus" },
  },
  // Dark — Premium dark mode: deep OLED blacks, subtle zinc surfaces, bright white accents.
  dark: {
    id: "dark", name: "Dark", mood: "Deep space focus.",
    colors: {
      bg: "#000000", surface: "#09090B", surface2: "#18181B", border: "#27272A",
      text: "#FAFAFA", text2: "#A1A1AA",
      accent: "#FFFFFF", accent2: "#E4E4E7", accentSoft: "#27272A", accentInk: "#000000",
    },
    typography: { displayFont: "sans", bodyFont: "sans", displayWeight: 600, tracking: "-0.02em" },
    shape: { radius: "12px", radiusSm: "8px" },
    motion: { ease: "cubic-bezier(0.16,1,0.3,1)", intensity: "calm" },
    assets: { motifSet: "dark" },
  },
};

export const THEME_LABELS: Record<ThemeName, string> = Object.fromEntries(
  (Object.keys(THEMES) as ThemeName[]).map((k) => [k, THEMES[k].name])
) as Record<ThemeName, string>;

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/** Themes whose background is dark — used for status bar / art opacity tuning. */
export const DARK_THEMES: ThemeName[] = ["dark"];

const ART_OPACITY: Record<ThemeName, string> = {
  focus: "0.06", dark: "0.08",
};

const MOTION_LIFT: Record<MotionIntensity, string> = { calm: "1", normal: "2", lively: "3.5" };

/** Logical font role → the base CSS font-family variable set once in app/layout. */
export function fontRoleVar(role: Theme["typography"]["displayFont"]): string {
  return `var(--font-${role})`;
}

/** Derives the flat token object every consumer reads (mobile tokens, web colors). */
export function deriveTokens(theme: Theme): ThemeTokens {
  const c = theme.colors;
  return {
    background: c.bg,
    surface: c.surface,
    surfaceHover: c.surface2,
    bgSidebar: c.surface,
    bgCard: c.surface,
    bgInput: c.surface2,
    bgHover: c.surface2,
    bgActive: c.accentSoft,
    foreground: c.text,
    textPrimary: c.text,
    textSecondary: c.text2,
    border: c.border,
    borderStrong: c.border,
    accent: c.accent,
    accentHover: c.accent2,
    accentForeground: c.accentInk,
    accentSoft: c.accentSoft,
    accentInk: c.accentInk,
    btnPrimary: c.accent,
    btnPrimaryForeground: c.accentInk,
    ...SEMANTIC,
    radiusSm: theme.shape.radiusSm,
    radiusMd: theme.shape.radius,
    radiusLg: `calc(${theme.shape.radius} * 1.5)`,
  };
}

export const THEME_TOKENS: Record<ThemeName, ThemeTokens> = Object.fromEntries(
  THEME_NAMES.map((k) => [k, deriveTokens(THEMES[k])])
) as Record<ThemeName, ThemeTokens>;

/** The CSS custom properties for a theme (web). Single source — no hand-mirrored blocks. */
export function cssVarsFor(name: ThemeName): Record<string, string> {
  const t = THEMES[name];
  const tok = THEME_TOKENS[name];
  return {
    "--background": tok.background,
    "--surface": tok.surface,
    "--surface-hover": tok.surfaceHover,
    "--bg-sidebar": tok.bgSidebar,
    "--bg-card": tok.bgCard,
    "--bg-input": tok.bgInput,
    "--bg-hover": tok.bgHover,
    "--bg-active": tok.bgActive,
    "--foreground": tok.foreground,
    "--text-primary": tok.textPrimary,
    "--text-secondary": tok.textSecondary,
    "--border": tok.border,
    "--border-strong": tok.borderStrong,
    "--accent": tok.accent,
    "--accent-hover": tok.accentHover,
    "--accent-foreground": tok.accentForeground,
    "--accent-soft": tok.accentSoft,
    "--accent-ink": tok.accentInk,
    "--btn-primary": tok.btnPrimary,
    "--btn-primary-foreground": tok.btnPrimaryForeground,
    "--success": tok.success,
    "--danger": tok.danger,
    "--warning": tok.warning,
    "--info": tok.info,
    "--radius-sm": tok.radiusSm,
    "--radius-md": tok.radiusMd,
    "--radius-lg": tok.radiusLg,
    "--font-display": fontRoleVar(t.typography.displayFont),
    "--display-weight": String(t.typography.displayWeight),
    "--display-tracking": t.typography.tracking,
    "--font-ai": "var(--font-serif)",
    "--motion-lift": MOTION_LIFT[t.motion.intensity],
    "--motion-ease": t.motion.ease,
    "--art-opacity": ART_OPACITY[name],
  };
}

export const THEME_CSS_VARS: Record<ThemeName, Record<string, string>> = Object.fromEntries(
  THEME_NAMES.map((k) => [k, cssVarsFor(k)])
) as Record<ThemeName, Record<string, string>>;

/** Resolves "system" to Light (focus) or Dark based on OS preference. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ThemeName {
  if (preference !== "system") return preference;
  return systemPrefersDark ? "dark" : DEFAULT_THEME;
}

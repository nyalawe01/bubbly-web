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
  // Light — warm Claude-like: cream paper, dark-brown ink, clay accent.
  focus: {
    id: "focus", name: "Light", mood: "Clean, warm daylight.",
    colors: {
      bg: "#FFFFFF", surface: "#FFFFFF", surface2: "#F4F4F5", border: "#E6E6E6",
      text: "#1A1A1A", text2: "#6B6B6B",
      accent: "#C15F3C", accent2: "#D99A6C", accentSoft: "#F3E8E2", accentInk: "#FFFFFF",
    },
    typography: { displayFont: "serif", bodyFont: "sans", displayWeight: 500, tracking: "-0.01em" },
    shape: { radius: "16px", radiusSm: "10px" },
    motion: { ease: "cubic-bezier(0.16,1,0.3,1)", intensity: "calm" },
    assets: { motifSet: "focus" },
  },
  dark: {
    id: "dark", name: "Dark", mood: "Warm low-light focus.",
    colors: {
      bg: "#2B2B2B", surface: "#333333", surface2: "#3C3C3C", border: "rgba(255,255,255,0.10)",
      text: "#ECECEC", text2: "#9A9A9A",
      accent: "#D97757", accent2: "#E0A886", accentSoft: "rgba(217,119,87,0.16)", accentInk: "#2B2B2B",
    },
    typography: { displayFont: "serif", bodyFont: "sans", displayWeight: 500, tracking: "-0.01em" },
    shape: { radius: "16px", radiusSm: "10px" },
    motion: { ease: "cubic-bezier(0.16,1,0.3,1)", intensity: "normal" },
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

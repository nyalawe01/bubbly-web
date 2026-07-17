"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  THEME_LABELS,
  THEME_NAMES,
  THEME_CSS_VARS,
  THEMES,
  DARK_THEMES,
  resolveTheme,
  type ThemeName,
  type ThemePreference,
  type FontPref,
  type MotionIntensity,
} from "@/shared/constants/themes";
import { createClient } from "@/app/utils/supabase";

const STORAGE_KEY = "bubbly_theme";
const LEGACY_STORAGE_KEY = "studix_theme";
const FONT_KEY = "bubbly_font";
const VALID_PREFERENCES = new Set<string>(["system", ...THEME_NAMES]);

/** Tailwind arbitrary-value class strings backed by the CSS vars applied to <html>.
 *  Same key shape every component already consumed via a `colors` prop. */
export const colors = {
  bgApp: "bg-[var(--background)]",
  bgSidebar: "bg-[var(--bg-sidebar)]",
  bgCard: "bg-[var(--bg-card)]",
  bgInput: "bg-[var(--bg-input)]",
  bgHover: "hover:bg-[var(--bg-hover)]",
  bgActive: "bg-[var(--bg-active)] text-[var(--text-primary)]",
  textPrimary: "text-[var(--text-primary)]",
  textSecondary: "text-[var(--text-secondary)]",
  borderBase: "border-[var(--border)]",
  borderFocus: "border-[var(--border-strong)]",
  btnPrimary: "bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:opacity-90",
};

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ThemeName;
  motionIntensity: MotionIntensity;
  fontPref: FontPref;
  setPreference: (pref: ThemePreference) => void;
  setFontPref: (f: FontPref) => void;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPrefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies a theme's CSS variables directly to <html> — the bundle is the single
 *  source, so there are no hand-mirrored per-theme CSS blocks to drift. */
function applyThemeVars(name: ThemeName) {
  const root = document.documentElement;
  const vars = THEME_CSS_VARS[name];
  for (const k in vars) root.style.setProperty(k, vars[k]);
  root.setAttribute("data-theme", name);
  // Keep Tailwind's `dark:` variants in sync with the app's dark themes.
  root.classList.toggle("dark", DARK_THEMES.includes(name));
}

function applyFontPref(f: FontPref) {
  // UI body font follows the user's choice; AI response font stays serif (--font-ai).
  document.documentElement.style.setProperty("--font-body", f === "serif" ? "var(--font-serif)" : "var(--font-sans)");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [fontPref, setFontPrefState] = useState<FontPref>("sans");
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const syncedFromDb = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const storedFont = localStorage.getItem(FONT_KEY) as FontPref | null;
    setSystemPrefersDark(getSystemPrefersDark());
    if (stored && VALID_PREFERENCES.has(stored)) setPreferenceState(stored as ThemePreference);
    if (storedFont === "sans" || storedFont === "serif") setFontPrefState(storedFont);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);

    // Reconcile against Supabase user_preferences (last write wins; local paints first).
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("user_preferences")
          .select("theme, font_pref")
          .eq("user_id", user.id)
          .maybeSingle();
        syncedFromDb.current = true;
        if (data?.theme && !stored && VALID_PREFERENCES.has(data.theme)) {
          setPreferenceState(data.theme);
          localStorage.setItem(STORAGE_KEY, data.theme);
        }
        if ((data?.font_pref === "sans" || data?.font_pref === "serif") && !storedFont) {
          setFontPrefState(data.font_pref);
          localStorage.setItem(FONT_KEY, data.font_pref);
        }
      } catch {
        /* offline / not signed in — localStorage is the fallback */
      }
    })();

    return () => mq.removeEventListener("change", handler);
  }, []);

  const persist = useCallback(async (patch: { theme?: string; font_pref?: string }) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() });
    } catch {
      /* fallback already in localStorage */
    }
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem(STORAGE_KEY, pref);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    persist({ theme: pref });
  }, [persist]);

  const setFontPref = useCallback((f: FontPref) => {
    setFontPrefState(f);
    localStorage.setItem(FONT_KEY, f);
    persist({ font_pref: f });
  }, [persist]);

  const theme = resolveTheme(preference, systemPrefersDark);
  const firstRun = useRef(true);

  useEffect(() => {
    applyThemeVars(theme);
    // Pop the icon chips on an actual user theme change (skip the initial mount).
    if (firstRun.current) { firstRun.current = false; return; }
    const root = document.documentElement;
    root.classList.add("theme-swapping");
    const t = setTimeout(() => root.classList.remove("theme-swapping"), 460);
    return () => clearTimeout(t);
  }, [theme]);
  useEffect(() => { applyFontPref(fontPref); }, [fontPref]);

  return (
    <ThemeContext.Provider
      value={{
        preference,
        theme,
        motionIntensity: THEMES[theme].motion.intensity,
        fontPref,
        setPreference,
        setFontPref,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export { THEME_LABELS };
export type { ThemeName, ThemePreference };

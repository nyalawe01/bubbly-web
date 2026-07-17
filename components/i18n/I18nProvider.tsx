"use client";
// components/i18n/I18nProvider.tsx
//
// Web adapter over the shared i18n catalog. Provides t() for the SYSTEM/UI
// language only. This never affects the AI response language (the model replies
// in the language the student writes in). Persists to Supabase user_preferences
// .ui_language with a localStorage fallback; defaults to the device locale.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  translate,
  normalizeLocale,
  RTL_LANGS,
  DEFAULT_LANG,
  type Lang,
  type MessageKey,
} from "@/shared/i18n/catalog";
import { createClient } from "@/app/utils/supabase";

const STORAGE_KEY = "bubbly_ui_lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    const initial = stored || normalizeLocale(typeof navigator !== "undefined" ? navigator.language : "en");
    setLangState(initial);

    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("user_preferences").select("ui_language").eq("user_id", user.id).maybeSingle();
        if (data?.ui_language && !stored) {
          const l = normalizeLocale(data.ui_language);
          setLangState(l);
          localStorage.setItem(STORAGE_KEY, l);
        }
      } catch {
        /* fallback: localStorage / device locale */
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from("user_preferences").upsert({ user_id: user.id, ui_language: l, updated_at: new Date().toISOString() });
      } catch {
        /* fallback already stored locally */
      }
    })();
  }, []);

  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

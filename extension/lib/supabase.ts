// extension/lib/supabase.ts
//
// Mirrors mobile/lib/supabase.ts's pattern (AsyncStorage there, chrome.storage
// here) — same persistSession/autoRefreshToken setup, so a signed-in user
// gets the same "instant login on reopen" behavior already built for web and
// mobile. detectSessionInUrl is off because the extension parses the OAuth
// redirect itself (see lib/googleAuth.ts), not via a page load.
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import { browser } from "wxt/browser";

const chromeStorageAdapter: SupportedStorage = {
  getItem: async (key) => {
    const result = await browser.storage.local.get(key);
    return (result[key] as string) ?? null;
  },
  setItem: async (key, value) => {
    await browser.storage.local.set({ [key]: value });
  },
  removeItem: async (key) => {
    await browser.storage.local.remove(key);
  },
};

export const supabase = createClient(import.meta.env.WXT_SUPABASE_URL, import.meta.env.WXT_SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

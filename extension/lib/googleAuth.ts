// extension/lib/googleAuth.ts
//
// The extension's equivalent of mobile's OAuth-in-a-browser-tab flow
// (mobile/app/(auth)/login.tsx handleGoogleAuth) — same idea, different
// native API: chrome.identity.launchWebAuthFlow instead of
// expo-web-browser's openAuthSessionAsync. Supabase hands back an OAuth
// provider URL (skipBrowserRedirect so it doesn't try to navigate this
// context itself); Chrome opens it in a real browser window and resolves
// with the final redirect back to this extension's own
// https://<id>.chromiumapp.org/ URI, exactly like mobile parsing its
// bubbly://auth/callback redirect.
//
// Setup required once: add chrome.identity.getRedirectURL() (printed to the
// console on first run) to Supabase's Auth -> URL Configuration allow-list —
// same step that was needed for bubbly://auth/callback and the Vercel domain.
import { supabase } from "./supabase";

// The one value needed to complete the one-time Supabase setup step — surfaced
// here (not just buried in a console.log) since SignIn renders it directly so
// nobody has to dig through devtools to find it.
export function getExtensionRedirectUrl(): string {
  return chrome.identity.getRedirectURL();
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = getExtensionRedirectUrl();
  console.log("[bubbly] OAuth redirect URI (must be in Supabase's Auth redirect allow-list):", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Could not start Google sign-in");

  const resultUrl = await chrome.identity.launchWebAuthFlow({
    url: data.url,
    interactive: true,
  });
  if (!resultUrl) throw new Error("Google sign-in was cancelled.");

  const url = new URL(resultUrl);
  const params = url.hash ? new URLSearchParams(url.hash.slice(1)) : new URLSearchParams();
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    throw new Error("Google sign-in didn't return a session. Please try again.");
  }

  const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) throw sessionError;
}

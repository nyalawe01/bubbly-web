// extension/lib/googleDrive.ts
//
// Same approach as mobile/lib/googleDrive.ts (Drive REST API directly — no
// picker SDK exists outside a full web page), swapped to this extension's
// own OAuth primitive (chrome.identity.launchWebAuthFlow, see
// lib/googleAuth.ts) instead of expo-web-browser. Supabase only returns
// provider_token right at the OAuth redirect, not refreshed with the
// session — cached in memory for this side panel's lifetime and
// re-requested when missing, same limitation mobile and web both work around.
import { supabase } from "./supabase";
import { getExtensionRedirectUrl } from "./googleAuth";

const DRIVE_SCOPES = "email profile https://www.googleapis.com/auth/drive.readonly";

let cachedDriveToken: string | null = null;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

async function requestDriveAccessToken(): Promise<string> {
  const redirectTo = getExtensionRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, scopes: DRIVE_SCOPES, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Could not start Google Drive access");

  const resultUrl = await chrome.identity.launchWebAuthFlow({ url: data.url, interactive: true });
  if (!resultUrl) throw new Error("Google Drive access was cancelled.");

  const url = new URL(resultUrl);
  const params = url.hash ? new URLSearchParams(url.hash.slice(1)) : new URLSearchParams();
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const providerToken = params.get("provider_token");

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }
  if (!providerToken) {
    throw new Error("bubbly needs permission to read your Google Drive. Please try connecting again.");
  }
  cachedDriveToken = providerToken;
  return providerToken;
}

export async function ensureDriveAccessToken(): Promise<string> {
  if (cachedDriveToken) return cachedDriveToken;
  return requestDriveAccessToken();
}

export async function listDriveFiles(query: string): Promise<DriveFile[]> {
  const token = await ensureDriveAccessToken();
  const q = query.trim()
    ? `name contains '${query.trim().replace(/'/g, "\\'")}' and trashed = false`
    : "trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType)&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) {
    cachedDriveToken = null;
    throw new Error("Google Drive access expired. Please reconnect.");
  }
  if (!res.ok) throw new Error(`Drive request failed (${res.status})`);
  const data = await res.json();
  return (data.files || []).filter((f: DriveFile) => f.mimeType !== "application/vnd.google-apps.folder");
}

export async function downloadDriveFileAsBlob(file: DriveFile): Promise<Blob> {
  const token = await ensureDriveAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) {
    cachedDriveToken = null;
    throw new Error("Google Drive access expired. Please reconnect.");
  }
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return res.blob();
}

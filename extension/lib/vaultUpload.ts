// extension/lib/vaultUpload.ts
//
// Mirrors mobile's apiUploadToVault/apiUploadBlobToVault (mobile/lib/api.ts)
// — same /api/upload endpoint, same Bearer-token auth, same "just uploads to
// Vault, doesn't thread file content into the message" behavior mobile's
// chat composer already has (web/mobile both keep this lightweight; neither
// injects raw file content into the chat message either).
import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.WXT_API_URL;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function uploadFileToVault(file: File): Promise<string> {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
  return data.document.id as string;
}

export async function uploadBlobToVault(blob: Blob, name: string): Promise<string> {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append("file", blob, name);
  const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
  return data.document.id as string;
}

// extension/lib/api.ts
//
// Mirrors mobile/lib/api.ts's authHeaders() pattern — the backend's
// createSupabaseServerClient (lib/supabase/server.ts in the web repo)
// already prioritizes a Bearer Authorization header over cookies, since it
// was built for mobile. This file must only ever run in the background
// service worker: extension pages are exempt from CORS for hosts declared
// in host_permissions (see wxt.config.ts), but content scripts are NOT —
// routing every backend call through here is what keeps the web app's
// next.config.ts/middleware.ts untouched.
import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.WXT_API_URL;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// Streams the response, invoking onChunk as text arrives — mirrors the same
// streaming contract web (app/chat/page.tsx) and mobile (sessions/[id].tsx)
// already consume from this endpoint.
export async function streamChat(
  { message, history, modelType }: { message: string; history: ChatMessage[]; modelType: "instant" | "expert" | "vision" },
  onChunk: (fullTextSoFar: string) => void
): Promise<string> {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history, modelType }),
  });
  if (!res.ok) throw new Error((await res.text()) || "Chat request failed");
  if (!res.body) return res.text();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(full);
  }
  return full;
}

// /api/summary expects pre-uploaded Vault document IDs (`sources`), not raw
// text — a mismatch for "summarize whatever's on this tab right now" without
// a heavier upload-then-reference round trip. Reusing /api/chat with a
// summarization-flavored prompt instead keeps this a zero-backend-change MVP,
// same as the page-aware Q&A path.
export function summarizePagePrompt(text: string): string {
  return `Summarize this page for me. Here's its content:\n\n${text.slice(0, 12000)}`;
}

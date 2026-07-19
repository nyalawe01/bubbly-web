// extension/lib/chatSessions.ts
//
// Mirrors mobile/lib/chatSessions.ts exactly — same chat_sessions table web
// and mobile already share (id, user_id, title, pinned, history jsonb,
// created_at, updated_at), same message shape ({role:"user"|"ai", text}).
// The extension didn't persist anything before this — closing the side
// panel lost the conversation, and it couldn't show up in web/mobile's
// recents. This makes a chat started in any of the three clients visible
// in all of them, for the same account.
import { supabase } from "./supabase";
import { streamChat as apiStreamChat, type ChatMessage } from "./api";

export type { ChatMessage };

export interface ChatSessionSummary {
  id: string;
  title: string;
  updated_at: string;
}

export interface ChatSessionRow extends ChatSessionSummary {
  history: ChatMessage[];
}

export async function listChatSessions(userId: string): Promise<ChatSessionSummary[]> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function getChatSession(id: string): Promise<ChatSessionRow | null> {
  const { data, error } = await supabase.from("chat_sessions").select("id, title, updated_at, history").eq("id", id).single();
  if (error) throw error;
  return data as ChatSessionRow | null;
}

export async function createChatSession(userId: string, firstMessage: ChatMessage): Promise<ChatSessionRow> {
  const fallbackTitle = firstMessage.text.slice(0, 60) || "New Chat";
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, title: fallbackTitle, history: [firstMessage] })
    .select("id, title, updated_at, history")
    .single();
  if (error) throw error;
  return data as ChatSessionRow;
}

export async function saveChatHistory(id: string, history: ChatMessage[]) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ history, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// Re-exported so callers only need one import for "run a chat turn and
// persist it" — kept separate from ./api since that file must stay
// transport-only (no Supabase writes) for the background-worker/side-panel
// CORS-exemption reasoning documented there.
export const streamChat = apiStreamChat;

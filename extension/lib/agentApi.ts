// extension/lib/agentApi.ts
//
// Calls the two new backend routes (app/api/agent/classify, app/api/agent/
// plan) — same Bearer-token auth pattern as lib/api.ts's streamChat.
import { supabase } from "./supabase";
import type { InteractiveElement } from "./extractInteractive";
import type { AgentAction } from "./agentActions";

const API_BASE_URL = import.meta.env.WXT_API_URL;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function classifyIsPageAction(message: string): Promise<boolean> {
  try {
    const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
    const res = await fetch(`${API_BASE_URL}/api/agent/classify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return !!data.isAction;
  } catch {
    // Fail closed, same posture as the backend route itself.
    return false;
  }
}

export async function planPageActions(instruction: string, elements: InteractiveElement[]): Promise<AgentAction[]> {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  const res = await fetch(`${API_BASE_URL}/api/agent/plan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ instruction, elements }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't plan those actions.");
  return data.actions || [];
}

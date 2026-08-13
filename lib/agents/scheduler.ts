import { createClient } from "@supabase/supabase-js";
import { executeAgent } from "./executor";

// Background Job Runner for Agents
// In a real environment, this would run on a cron job via Edge Functions or similar.

export async function tickAgents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs admin to bypass RLS for orchestration
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("[Scheduler] Ticking agents...");

  // 1. Fetch enabled scheduled agents
  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .eq("is_enabled", true)
    .eq("trigger_type", "scheduled");

  if (error || !agents) {
    console.error("[Scheduler] Error fetching agents", error);
    return;
  }

  // 2. Fetch all users to run against (in a scalable system, we'd chunk this)
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users?.users) return;

  for (const agent of agents) {
    // Basic cron evaluation would go here. For now, we simulate triggering them.
    console.log(`[Scheduler] Evaluating agent: ${agent.name}`);
    
    // Trigger the agent for each user
    for (const user of users.users) {
      await executeAgent(agent.id, user.id, "scheduled", supabase);
    }
  }
}

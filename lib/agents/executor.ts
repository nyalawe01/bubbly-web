

// The core engine for running an agent
export async function executeAgent(agentId: string, userId: string, triggerReason: string, supabaseAdmin: any) {
  try {
    // 1. Fetch Agent
    const { data: agent } = await supabaseAdmin.from("agents").select("*").eq("id", agentId).single();
    if (!agent) return;

    // 2. Create Run Record
    const { data: run } = await supabaseAdmin.from("agent_runs").insert({
      agent_id: agent.id,
      user_id: userId,
      trigger_reason: triggerReason,
      status: "running"
    }).select().single();

    if (!run) return;

    // 3. Gather Context (mocked for simplicity)
    const context = {
      last_activity: "2026-08-10T12:00:00Z", // 3 days ago
      upcoming_deadlines: [],
      recent_performance: {}
    };

    // 4. Agent Specific Logic
    let actions: any[] = [];
    let summary = "";

    if (agent.name === "inactivity_monitor") {
      // Simulate inactivity check
      summary = "User has been inactive for 3 days. Generating catch-up plan.";
      actions.push({ type: "generate_catch_up_plan", urgent: true });
    } else if (agent.name === "study_streak") {
      summary = "User studied today. Streak maintained at 5 days.";
      actions.push({ type: "notify", message: "Nice work! You've studied 5 days in a row." });
    }

    // 5. Update Run Record
    await supabaseAdmin.from("agent_runs").update({
      status: "completed",
      input_context: context,
      output_summary: summary,
      actions_taken: actions,
      completed_at: new Date().toISOString()
    }).eq("id", run.id);

    console.log(`[Executor] Agent ${agent.name} completed for user ${userId}`);
    
  } catch (error) {
    console.error("[Executor] Failed:", error);
    await supabaseAdmin.from("agent_runs").update({ status: "failed" }).eq("agent_id", agentId).eq("user_id", userId);
  }
}

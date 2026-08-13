import { createClient } from "@supabase/supabase-js";
import { evaluateAction } from "../policy/engine";

export async function executeTaskStep(taskId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Get task and pending steps
  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  if (!task || task.status !== "in_progress") return;

  const { data: steps } = await supabase
    .from("task_steps")
    .select("*")
    .eq("task_id", taskId)
    .eq("status", "pending")
    .order("step_order", { ascending: true });

  if (!steps || steps.length === 0) {
    await supabase.from("tasks").update({ status: "completed", progress: 1.0 }).eq("id", taskId);
    return;
  }

  const nextStep = steps[0];
  
  // 2. Evaluate Policy
  const riskAssessment = evaluateAction(task.user_id, nextStep.action_type, nextStep.action_payload);
  if (riskAssessment === "requires_approval") {
    await supabase.from("tasks").update({ status: "waiting_for_user" }).eq("id", taskId);
    await supabase.from("notifications").insert({
      user_id: task.user_id,
      task_id: taskId,
      title: "Action requires your approval",
      body: `EduOS wants to execute: ${nextStep.title}. Please approve.`,
    });
    return;
  }

  // 3. Execute Step
  await supabase.from("task_steps").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", nextStep.id);
  
  try {
    if (nextStep.action_type === "generate_artifact") {
      // Stub for calling artifact generation
      console.log("Generating artifact:", nextStep.action_payload);
    } else if (nextStep.action_type === "notify_user") {
      await supabase.from("notifications").insert({
        user_id: task.user_id,
        task_id: taskId,
        title: "Task Update",
        body: nextStep.action_payload.message || nextStep.title,
      });
    } else if (nextStep.action_type === "wait_for_review") {
      await supabase.from("tasks").update({ status: "waiting_for_user" }).eq("id", taskId);
      return; // Stop here until user continues
    }
    
    // 4. Mark complete and move to next
    await supabase.from("task_steps").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", nextStep.id);
    
    // Calculate new progress
    const { data: allSteps } = await supabase.from("task_steps").select("status").eq("task_id", taskId);
    if (allSteps) {
       const completed = allSteps.filter(s => s.status === 'completed').length;
       await supabase.from("tasks").update({ progress: completed / allSteps.length }).eq("id", taskId);
    }
    
    // Recursive call to execute next step
    await executeTaskStep(taskId);

  } catch (err) {
    console.error("Step execution failed:", err);
    await supabase.from("task_steps").update({ status: "failed" }).eq("id", nextStep.id);
    await supabase.from("tasks").update({ status: "failed" }).eq("id", taskId);
  }
}

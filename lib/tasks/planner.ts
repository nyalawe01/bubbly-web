import { callModel } from "@/lib/llm/model";
import { createClient } from "@supabase/supabase-js";

export async function planTask(userId: string, objective: string, context: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const prompt = `
You are a task planner for a student. The student wants to achieve this objective:
"${objective}"

Context:
${JSON.stringify(context)}

Generate a structured task plan. Return a JSON object with this exact schema:
{
  "title": "Task Title",
  "steps": [
    {
      "order": 1,
      "title": "Step Title",
      "action": "generate_artifact" | "notify_user" | "wait_for_review" | "execute_search",
      "payload": { ... specifics for the action ... }
    }
  ]
}
`;

  try {
    const rawOutput = await callModel(prompt, "gpt-4o");
    const jsonStart = rawOutput.indexOf("{");
    const jsonEnd = rawOutput.lastIndexOf("}");
    const jsonStr = rawOutput.substring(jsonStart, jsonEnd + 1);
    const plan = JSON.parse(jsonStr);

    const { data: task, error: taskError } = await supabase.from("tasks").insert({
      user_id: userId,
      title: plan.title,
      description: objective,
      status: "in_progress",
    }).select().single();

    if (taskError || !task) throw taskError;

    const steps = plan.steps.map((s: any) => ({
      task_id: task.id,
      step_order: s.order,
      title: s.title || `Step ${s.order}`,
      action_type: s.action,
      action_payload: s.payload,
      status: "pending"
    }));

    await supabase.from("task_steps").insert(steps);

    return task;
  } catch (err) {
    console.error("Failed to plan task:", err);
    throw err;
  }
}

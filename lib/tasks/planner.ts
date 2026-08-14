import { callModel, chatModelFor } from "@/lib/ai/models";
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
    const chatModel = chatModelFor("expert");
    const rawOutput: any = await callModel(chatModel, {
      messages: [{ role: "system", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const plan = typeof rawOutput === "string" ? JSON.parse(rawOutput) : rawOutput;

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

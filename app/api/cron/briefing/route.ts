import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callModel, chatModelFor } from "@/lib/ai/models";

// Note: In Vercel, this is triggered via a cron schedule defined in vercel.json.
// e.g. "crons": [{ "path": "/api/cron/briefing", "schedule": "0 8 * * *" }]
// We use the service role key to bypass RLS and act on behalf of the system.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  // Basic security: require a CRON_SECRET if in production,
  // or allow if we just want to manually trigger it.
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users who have active tasks or deadlines today
    const { data: users, error: userErr } = await supabase.from("users").select("id, name");
    
    if (userErr || !users) {
      throw new Error("Could not fetch users");
    }

    let notificationsCreated = 0;

    for (const user of users) {
      // Fetch user's pending tasks and recent notifications
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "in_progress"]);
      
      if (!tasks || tasks.length === 0) continue;

      const chatModel = chatModelFor("instant");
      const prompt = `
You are the EduOS Morning Briefing assistant for a student named ${user.name || "Student"}.
They have the following pending tasks:
${JSON.stringify(tasks.map(t => ({ title: t.title, description: t.description, status: t.status, progress: t.progress })))}

Write a very short, encouraging 2-sentence morning briefing summarizing what they need to focus on today. Do not use generic greetings, just get straight to the point.
`;
      const aiResponse = await callModel(chatModel, {
        messages: [{ role: "system", content: prompt }],
        temperature: 0.7
      });

      const message = typeof aiResponse === "string" ? aiResponse : aiResponse.content || "Ready for today's tasks?";

      // Insert into notifications
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Morning Briefing",
        message: message,
        read: false
      });

      notificationsCreated++;
    }

    return NextResponse.json({ success: true, notificationsCreated });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

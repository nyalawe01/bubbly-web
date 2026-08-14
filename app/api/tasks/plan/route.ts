import { NextRequest, NextResponse } from "next/server";
import { planTask } from "@/lib/tasks/planner";

export async function POST(req: NextRequest) {
  try {
    const { taskId, objective, notebookId } = await req.json();

    if (!taskId || !objective) {
      return NextResponse.json({ error: "Missing taskId or objective" }, { status: 400 });
    }

    // Call the planner
    await planTask(taskId, objective, { notebookId });
    
    return NextResponse.json({ success: true, taskId });
  } catch (error: any) {
    console.error("Task planning error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

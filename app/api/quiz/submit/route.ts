import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateStudentPerformance } from "@/lib/performance/service";

export async function POST(request: Request) {
  try {
    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quiz_id, notebook_id, answers, total_questions } = await request.json();

    // Calculate score
    let correct = 0;
    const answerRecords = answers.map((a: any) => {
      const is_correct = a.selected_answer === a.correct_answer;
      if (is_correct) correct++;
      return {
        ...a,
        is_correct,
        topic_tags: a.topic_tags || [],
      };
    });
    const score_percentage = total_questions > 0 ? (correct / total_questions) * 100 : 0;

    // Create session
    const { data: session, error: sessionErr } = await supabase
      .from("quiz_sessions")
      .insert({
        user_id: user.id,
        quiz_artifact_id: quiz_id,
        notebook_id,
        status: "completed",
        completed_at: new Date().toISOString(),
        score_percentage,
        total_questions,
        correct_answers: correct,
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    // Insert answers
    const answersToInsert = answerRecords.map((a: any) => ({
      session_id: session.id,
      question_index: a.question_index,
      question_text: a.question_text,
      selected_answer: a.selected_answer,
      correct_answer: a.correct_answer,
      is_correct: a.is_correct,
      topic_tags: a.topic_tags,
    }));
    await supabase.from("quiz_answers").insert(answersToInsert);

    // After this, in the background or API route, we need to update student performance.
    if (notebook_id) {
      await updateStudentPerformance(supabase, user.id, notebook_id, answerRecords);
    }

    return NextResponse.json({ success: true, session_id: session.id });
  } catch (error: any) {
    console.error("Quiz submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

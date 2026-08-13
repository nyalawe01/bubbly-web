import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateStudentPerformance } from "@/lib/performance/service";

export async function POST(request: Request) {
  try {
    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session_id, card, rating, notebook_id } = await request.json();

    // SRS Logic (Simplified SM-2)
    // Rating 1 (Again): Interval resets to 10 minutes.
    // Rating 2 (Hard): Interval multiplies by 1.2.
    // Rating 3 (Good): Interval multiplies by 2.0.
    // Rating 4 (Easy): Interval multiplies by 2.5.
    
    // For simplicity, we just calculate absolute next_review_at from now based on assumed initial interval of 1 day.
    let multiplier = 0;
    if (rating === 1) multiplier = 10 / (24 * 60); // 10 minutes in days
    else if (rating === 2) multiplier = 1.2;
    else if (rating === 3) multiplier = 2.0;
    else if (rating === 4) multiplier = 2.5;

    const next_review_at = new Date();
    next_review_at.setMinutes(next_review_at.getMinutes() + (multiplier * 24 * 60));

    // Save review
    await supabase.from("flashcard_reviews").insert({
      session_id,
      card_index: card.originalIndex,
      front_text: card.front,
      back_text: card.back,
      difficulty_rating: rating,
      next_review_at: next_review_at.toISOString()
    });

    // Update performance
    // A card rated "Again" or "Hard" counts as an incorrect attempt. "Good" or "Easy" counts as correct.
    if (notebook_id) {
      await updateStudentPerformance(supabase, user.id, notebook_id, [
        {
          topic_tags: card.topics || ["General"],
          is_correct: rating >= 3
        }
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Flashcard submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

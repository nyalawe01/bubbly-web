import { SupabaseClient } from "@supabase/supabase-js";

export async function updateStudentPerformance(
  supabase: SupabaseClient,
  user_id: string,
  notebook_id: string,
  answers: { topic_tags: string[]; is_correct: boolean }[]
) {
  if (!notebook_id) return;

  // 1. Group answers by topic
  const topicStats: Record<string, { total: number; correct: number }> = {};
  for (const a of answers) {
    const tags = a.topic_tags || ["General"];
    const tag = tags.length > 0 ? tags[0] : "General"; // simplified to primary tag
    
    if (!topicStats[tag]) topicStats[tag] = { total: 0, correct: 0 };
    topicStats[tag].total += 1;
    if (a.is_correct) topicStats[tag].correct += 1;
  }

  // 2. Update each topic
  for (const [topic, stats] of Object.entries(topicStats)) {
    const { data: existing } = await supabase
      .from("student_performance")
      .select("*")
      .eq("user_id", user_id)
      .eq("notebook_id", notebook_id)
      .eq("topic", topic)
      .single();

    if (existing) {
      const newTotal = existing.total_attempts + stats.total;
      const newCorrect = existing.correct_attempts + stats.correct;
      const newMastery = newTotal > 0 ? newCorrect / newTotal : 0;
      
      // Decay confidence if last practiced > 7 days ago
      const daysSince = existing.last_practiced_at 
        ? (Date.now() - new Date(existing.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      const recencyBonus = Math.max(0, 1.0 - (daysSince * 0.1));
      const conf = (newMastery * 0.7) + (recencyBonus * 0.3);
      
      await supabase.from("student_performance").update({
        total_attempts: newTotal,
        correct_attempts: newCorrect,
        mastery_level: newMastery,
        confidence_score: conf,
        last_practiced_at: new Date().toISOString()
      }).eq("id", existing.id);
    } else {
      const newMastery = stats.total > 0 ? stats.correct / stats.total : 0;
      const conf = (newMastery * 0.7) + (1.0 * 0.3);
      
      await supabase.from("student_performance").insert({
        user_id,
        notebook_id,
        topic,
        total_attempts: stats.total,
        correct_attempts: stats.correct,
        mastery_level: newMastery,
        confidence_score: conf,
      });
    }
  }
}

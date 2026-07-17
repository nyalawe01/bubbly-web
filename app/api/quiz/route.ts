// app/api/quiz/route.ts
//
// IMPORTANT: this file MUST be named "route.ts", not "routes.ts". Next.js App
// Router only registers files literally named route.ts as endpoints — the old
// "routes.ts" was invisible to the framework, meaning /api/quiz was 404ing.
// Delete the old routes.ts file after adding this one.

import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSourceContent } from "@/lib/ai/vault";
import { QUIZ_CONTRACT } from "@/lib/ai/prompts";

const QUESTION_COUNTS: Record<string, number> = { fewer: 20, standard: 25, more: 35 };

export async function POST(request: Request) {
  try {
    const { questionCount, difficulty, topic, sources, minQuestions } = await request.json();

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let numQuestions = QUESTION_COUNTS[questionCount] ?? QUESTION_COUNTS.standard;
    if (minQuestions && minQuestions > numQuestions) numQuestions = minQuestions;

    const sourceContent = sources?.length ? await fetchSourceContent(supabase, sources, user.id, 50) : '';

    const difficultyMap: Record<string, string> = {
      easy: "basic and fundamental concepts",
      medium: "intermediate concepts with some complexity",
      hard: "advanced concepts requiring deep understanding",
    };

    const openai = getClient(MODELS.generator.provider);

    const systemPrompt = `${QUIZ_CONTRACT}

Generate exactly ${numQuestions} questions at ${difficultyMap[difficulty] || 'medium'} difficulty.`;

    let userPrompt = `Generate a quiz on the topic: ${topic || 'general knowledge'}.
Exactly ${numQuestions} questions at ${difficulty} difficulty.`;

    if (sourceContent) {
      userPrompt += `\n\nCONTEXT:\n${sourceContent.slice(0, 8000)}`;
    }

    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const quiz = JSON.parse(response.choices[0]?.message?.content || '{}');

    await supabase.from('quiz_history').insert({
      user_id: user.id,
      title: quiz.title || 'Generated Quiz',
      questions: quiz.questions,
      question_count: numQuestions,
      difficulty,
      topic,
      sources,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      quiz,
      metadata: { questionCount: numQuestions, difficulty, topic },
    });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz', success: false },
      { status: 500 }
    );
  }
}
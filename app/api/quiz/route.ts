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
import { postProcessQuiz } from "@/lib/ai/quiz";

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

    // Diagrams the model is allowed to reference — only images actually extracted from
    // these source documents (direct uploads + DOCX/PPTX embedded media; PDFs don't
    // extract images yet). Offering them by URL lets the model ask a genuine "label this
    // part" / "what does this part do" question instead of only ever working from text.
    let documentImages: { url: string; ai_description: string | null }[] = [];
    if (sources?.length) {
      const { data: images } = await supabase
        .from('vault_document_images')
        .select('url, ai_description')
        .eq('user_id', user.id)
        .in('document_id', sources)
        .limit(10);
      documentImages = images || [];
    }

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

    if (documentImages.length) {
      userPrompt += `\n\nDOCUMENT IMAGES (only use these exact URLs for "diagram" questions, and only if a question` +
        ` about the image is genuinely answerable — skip decorative/irrelevant ones):\n` +
        documentImages
          .map((img, i) => `${i + 1}. imageUrl: ${img.url}\n   description: ${img.ai_description || "(no description)"}`)
          .join("\n");
    }

    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // Groq's on-demand tier caps requests at 12,000 tokens/min, and max_tokens counts
      // against that cap as RESERVED, not just what's actually generated. 8000 was fine
      // with the old short prompt; the richer QUIZ_CONTRACT + a full 8000-char CONTEXT
      // block was tipping real (source-grounded) requests over the limit and 500ing.
      // 6000 comfortably covers even a 35-question, all-types quiz (~5000 tokens observed).
      max_tokens: 6000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const rawQuiz = JSON.parse(response.choices[0]?.message?.content || '{}');
    const quiz = postProcessQuiz(rawQuiz, documentImages.map((img) => img.url));

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
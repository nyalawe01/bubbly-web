// app/api/flashcards/route.ts
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSourceContent } from "@/lib/ai/vault";
import { FLASHCARD_CONTRACT } from "@/lib/ai/prompts";

const CARD_COUNTS: Record<string, number> = { fewer: 8, standard: 15, more: 30 };

export async function POST(request: Request) {
  try {
    const { cardCount, difficulty, topic, sources } = await request.json();

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sourceContent = sources?.length ? await fetchSourceContent(supabase, sources, user.id, 50) : '';

    const numCards = CARD_COUNTS[cardCount] ?? CARD_COUNTS.standard;

    const systemPrompt = `${FLASHCARD_CONTRACT}

Generate exactly ${numCards} flashcards for study.`;

    let userPrompt = `Create flashcards for the topic: ${topic || 'general study'}.
Difficulty: ${difficulty || 'medium'}. Generate ${numCards} cards.`;

    if (sourceContent) {
      userPrompt += `\n\nCONTEXT:\n${sourceContent.slice(0, 8000)}`;
    }

    const response = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const flashcards = JSON.parse(response.choices[0]?.message?.content || '{}');

    await supabase.from('flashcard_history').insert({
      user_id: user.id,
      title: flashcards.title || 'Generated Flashcards',
      cards: flashcards.cards,
      card_count: numCards,
      difficulty,
      topic,
      sources,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      flashcards,
      metadata: { cardCount: numCards, difficulty, topic },
    });
  } catch (error: any) {
    console.error('Flashcard Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards', success: false },
      { status: 500 }
    );
  }
}
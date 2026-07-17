// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSourceContent } from "@/lib/ai/vault";
import { SUMMARY_CONTRACT, GENERATED_CONTEXT_RULES } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { topic, sources, length } = await request.json();

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sourceContent = sources?.length ? await fetchSourceContent(supabase, sources, user.id, 50) : '';

    const openai = getClient(MODELS.generator.provider);

    const systemPrompt = `${SUMMARY_CONTRACT}

${GENERATED_CONTEXT_RULES}`;

    let userPrompt = `Summarize the topic: ${topic || 'general knowledge'}. Length: ${length === 'detailed' ? 'detailed' : 'brief'}.`;

    if (sourceContent) {
      userPrompt += `\n\nCONTEXT:\n${sourceContent.slice(0, 8000)}`;
    }

    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(response.choices[0]?.message?.content || '{}');

    await supabase.from('summary_history').insert({
      user_id: user.id,
      topic,
      summary: JSON.stringify(summary),
      sources,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      summary,
      metadata: {
        topic: topic
      }
    });

  } catch (error: any) {
    console.error('Summary Generation Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to generate summary',
      success: false
    }, { status: 500 });
  }
}

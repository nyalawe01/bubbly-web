// app/api/slides/route.ts
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SLIDE_OUTLINE_PROMPT, SLIDE_RENDER_PROMPT } from "@/lib/ai/prompts";
import { fetchSourceContent } from "@/lib/ai/vault";

const SLIDE_COUNTS: Record<string, number> = { short: 6, default: 12, long: 16 };

export async function POST(request: Request) {
  try {
    const { format, language, length, description, sources } = await request.json();

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numSlides = SLIDE_COUNTS[length] ?? SLIDE_COUNTS.default;

    // Pull the student's own notes for this deck, if any Vault sources were selected —
    // grounds the outline in real material instead of the model inventing content.
    const sourceContent = sources?.length ? await fetchSourceContent(supabase, sources, user.id, 60) : "";

    const formatNote =
      format === 'detailed'
        ? 'a comprehensive deck meant to be read on its own, with fuller text per slide'
        : 'clean presenter slides — short talking points, not full paragraphs';

    // ---- PASS 1: OUTLINE ----
    // Decides structure AND, per-slide, whether a chart/diagram is actually warranted.
    // This is what stops every slide from getting a decorative visual — the decision
    // is made once, with full context, instead of improvised per-slide by a model
    // trying to look impressive.
    const outlineUser = `Topic/description: ${description || 'General educational presentation'}
Language: ${language || 'English'}
Style: ${formatNote}
Target slide count: ${numSlides}
${sourceContent ? `\nSource material (ground the outline in this, don't invent facts outside it):\n${sourceContent.slice(0, 8000)}` : ''}`;

    const outlineResponse = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: SLIDE_OUTLINE_PROMPT },
        { role: "user", content: outlineUser },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const outline = JSON.parse(outlineResponse.choices[0]?.message?.content || '{}');
    const outlineSlides: any[] = outline.slides || [];

    if (outlineSlides.length === 0) {
      throw new Error("Outline generation failed to produce any slides.");
    }

    // ---- PASS 2: RENDER EACH SLIDE, IN PARALLEL ----
    // Each call only knows about ITS slide's assigned visual type, so a "concept"
    // slide physically cannot end up with a chart bolted on.
    const renderedSlides = await Promise.all(
      outlineSlides.map(async (slide: any) => {
        try {
          const renderResponse = await callModel(MODELS.generator, {
            messages: [
              { role: "system", content: SLIDE_RENDER_PROMPT },
              {
                role: "user",
                content: `Deck title: ${outline.title}\nDeck language: ${language || 'English'}\nDeck style: ${formatNote}\n\nThis slide's outline entry:\n${JSON.stringify(
                  slide
                )}${sourceContent ? `\n\nSource material for factual grounding:\n${sourceContent.slice(0, 4000)}` : ''}`,
              },
            ],
            max_tokens: 800,
            temperature: 0.3,
            response_format: { type: "json_object" },
          });

          const rendered = JSON.parse(renderResponse.choices[0]?.message?.content || '{}');

          return {
            id: slide.id,
            title: rendered.title || slide.title,
            bullets: rendered.bullets || [],
            type: rendered.chart ? 'chart' : rendered.diagram ? 'diagram' : 'text',
            speakerNotes: rendered.speakerNotes || '',
            chart: rendered.chart || null,
            diagram: rendered.diagram || null,
          };
        } catch (e) {
          console.warn(`Slide ${slide.id} render failed, falling back to outline text:`, e);
          return {
            id: slide.id,
            title: slide.title,
            bullets: slide.keyPoints || [],
            type: 'text',
            speakerNotes: '',
            chart: null,
            diagram: null,
          };
        }
      })
    );

    renderedSlides.sort((a, b) => a.id - b.id);

    await supabase.from('slide_history').insert({
      user_id: user.id,
      title: outline.title || 'Generated Slides',
      slides: renderedSlides,
      format,
      language,
      slide_count: renderedSlides.length,
      sources,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      slides: { title: outline.title, slides: renderedSlides },
      metadata: { format, language, length, slideCount: renderedSlides.length },
    });
  } catch (error: any) {
    console.error('Slides Generation Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate slides',
        success: false,
      },
      { status: 500 }
    );
  }
}
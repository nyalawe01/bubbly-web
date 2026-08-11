// app/api/source-guide/route.ts
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { fileId, fileName, content } = await request.json();

    if (!fileId || !content) {
      return NextResponse.json({ error: 'File ID and content are required' }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }); },
        },
      }
    );

    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate source guide
    const systemPrompt = `You are an expert study guide creator. Analyze the provided document content and generate a helpful source guide.

    Format the response as JSON with:
    {
      "summary": "A 1-2 sentence summary of the document",
      "suggestions": [
        {
          "text": "A question or topic for further exploration",
          "type": "terminology|formula|explanation|concept|question"
        }
      ]
    }

    Generate 5-7 suggestions that help the user understand the document better.
    Suggestions should be questions like "What is X?" or "Explain how Y works?" or "What are the key differences between A and B?"
    Also include clarification prompts that would help the user learn from the AI.`;

    const userPrompt = `Analyze this document and generate a source guide:

    Document: ${fileName}
    Content: ${content.slice(0, 8000)}

    Generate 5-7 suggestions that would help a student understand this document better.`;

    const response = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const guideData = JSON.parse(response.choices[0]?.message?.content || '{}');

    // Save to database
    const { data: guide, error } = await supabase
      .from('source_guides')
      .insert({
        file_id: fileId,
        user_id: user.id,
        summary: guideData.summary || 'No summary available.',
        suggestions: guideData.suggestions || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Still return the guide data even if save fails
    }

    return NextResponse.json({
      success: true,
      guide: guideData
    });

  } catch (error: any) {
    console.error('Source Guide Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate source guide',
      success: false
    }, { status: 500 });
  }
}
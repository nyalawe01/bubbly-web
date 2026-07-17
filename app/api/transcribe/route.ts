// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    
    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterKey,
    });

    // Convert audio to base64
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    // Derive the real container format from the upload so we don't mislabel it.
    // Web records webm; mobile (expo-audio) records m4a/mp4. Map to what the
    // model accepts, defaulting to wav.
    const name = (audio.name || "").toLowerCase();
    const type = (audio.type || "").toLowerCase();
    let audioFormat = "wav";
    if (type.includes("mp4") || type.includes("m4a") || name.endsWith(".m4a") || name.endsWith(".mp4")) audioFormat = "m4a";
    else if (type.includes("mpeg") || type.includes("mp3") || name.endsWith(".mp3")) audioFormat = "mp3";
    else if (type.includes("wav") || name.endsWith(".wav")) audioFormat = "wav";
    else if (type.includes("webm")) audioFormat = "webm";

    const response = await openai.chat.completions.create({
      model: "microsoft/mai-transcribe-1.5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this audio with automatic language detection and punctuation. Return only the transcribed text."
            },
            {
              // input_audio is an OpenRouter extension not in the OpenAI SDK types.
              type: "input_audio",
              input_audio: {
                data: base64Audio,
                format: audioFormat
              }
            } as any
          ]
        }
      ]
    });

    const transcribedText = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      text: transcribedText,
    });

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Transcription failed',
      success: false
    }, { status: 500 });
  }
}
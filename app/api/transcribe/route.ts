// app/api/transcribe/route.ts
//
// Transcribes voice-recorded messages. Moved from OpenRouter's
// microsoft/mai-transcribe-1.5 (a chat-completions "input_audio" extension) to
// Groq's whisper-large-v3-turbo — a real audio-transcription endpoint, not a
// chat-completion shape, so it uses openai.audio.transcriptions.create() rather
// than callModel()'s chat-completion wrapper. ~9x cheaper than OpenAI's own
// Whisper ($0.04/hr vs $0.36/hr), consolidates onto a key we already hold, and
// runs on Groq's LPU hardware at ~217-228x real-time.
import { NextResponse } from "next/server";
import { toFile } from "openai";
import { getClient } from "@/lib/ai/models";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    // Derive a sensible filename+extension so Groq can infer the container format —
    // web records webm; mobile (expo-audio) records m4a/mp4.
    const name = (audio.name || "").toLowerCase();
    const type = (audio.type || "").toLowerCase();
    let ext = "wav";
    if (type.includes("mp4") || type.includes("m4a") || name.endsWith(".m4a") || name.endsWith(".mp4")) ext = "m4a";
    else if (type.includes("mpeg") || type.includes("mp3") || name.endsWith(".mp3")) ext = "mp3";
    else if (type.includes("webm")) ext = "webm";
    else if (type.includes("wav") || name.endsWith(".wav")) ext = "wav";

    const arrayBuffer = await audio.arrayBuffer();
    const file = await toFile(Buffer.from(arrayBuffer), `audio.${ext}`);

    const groq = getClient("groq");
    const response = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
    });

    return NextResponse.json({
      success: true,
      text: response.text || '',
    });

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({
      error: error.message || 'Transcription failed',
      success: false
    }, { status: 500 });
  }
}

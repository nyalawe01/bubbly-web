// app/api/transcribe/route.ts
//
// Transcribes voice-recorded messages via Groq's whisper-large-v3-turbo — a real
// audio-transcription endpoint, not a chat-completion shape, so it uses
// openai.audio.transcriptions.create() rather than callModel()'s chat-completion
// wrapper. ~9x cheaper than OpenAI's own Whisper ($0.04/hr vs $0.36/hr),
// consolidates onto a key we already hold, and runs on Groq's LPU hardware at
// ~217-228x real-time. (Previously routed through an OpenRouter chat-completions
// "input_audio" model.)
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
    // verbose_json surfaces Whisper's own per-segment avg_logprob/no_speech_prob —
    // a real confidence proxy from the same call, no extra request, no vendor
    // change. Callers that only read `text` (dictation) are unaffected; the voice
    // call's confidence-gating (sessions/[id].tsx) uses the extra fields.
    const response: any = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
    } as any);

    const segments: any[] = response.segments || [];
    // Duration-weighted average — a long confident segment shouldn't be diluted
    // by a one-word trailing segment the same as it would be with a flat mean.
    let avgLogprob: number | null = null;
    let noSpeechProb: number | null = null;
    if (segments.length) {
      let totalDuration = 0;
      let logprobSum = 0;
      let noSpeechSum = 0;
      for (const seg of segments) {
        const duration = Math.max((seg.end ?? 0) - (seg.start ?? 0), 0.01);
        totalDuration += duration;
        logprobSum += (seg.avg_logprob ?? -1) * duration;
        noSpeechSum += (seg.no_speech_prob ?? 0) * duration;
      }
      avgLogprob = logprobSum / totalDuration;
      noSpeechProb = noSpeechSum / totalDuration;
    }

    return NextResponse.json({
      success: true,
      text: response.text || '',
      avgLogprob,
      noSpeechProb,
    });

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({
      error: error.message || 'Transcription failed',
      success: false
    }, { status: 500 });
  }
}

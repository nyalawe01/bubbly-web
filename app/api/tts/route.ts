// app/api/tts/route.ts
//
// Text-to-speech for voice-tutor mode's spoken AI replies. Calls Gemini's TTS
// models directly over REST rather than through the @google/genai SDK — the
// pinned SDK version here (0.3.1) predates TTS support, and upgrading it
// risks the embeddings/image routes that already depend on it working exactly
// as they do today. A plain fetch() avoids that risk entirely; the JSON shape
// below is Gemini's current documented generateContent contract.
//
// Gemini's TTS output is raw PCM (24kHz, mono, 16-bit) — not a playable file
// by itself, so this wraps it in a standard 44-byte WAV header before
// returning it, so any client can just play the response as a normal .wav.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TTS_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-tts"];
// Gemini TTS models output raw Linear16 PCM audio at these parameters.
// If the TTS model changes, verify its output format — incorrect values
// will produce distorted or silent audio.
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function wrapPcmAsWav(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8;
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

async function synthesize(text: string, apiKey: string): Promise<Buffer> {
  let lastError: any = null;
  for (const model of TTS_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`${model} responded ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error(`${model} returned no audio data`);
      return Buffer.from(b64, "base64");
    } catch (err) {
      lastError = err;
      console.warn(`TTS model ${model} failed, trying next fallback.`, err);
    }
  }
  throw lastError || new Error("All TTS models failed");
}

// Gemini's controllable TTS reads style/pace/tone from a natural-language
// prefix on the SAME text blob — there's no separate "style" API field, so
// this is baked directly into what gets synthesized (confirmed against
// Google's documented speech-generation guidance, not assumed). Default is a
// warm, patient tutor voice; "gentle" softens it further for a low-confidence
// hedge, so admitting uncertainty doesn't come out sounding as blunt as the
// rest of the reply.
const STYLE_PREFIXES: Record<string, string> = {
  default: "Say in a warm, patient, encouraging tutor's voice, at a relaxed conversational pace: ",
  gentle: "Say gently and a little more slowly, like softly checking in with someone: ",
};

export async function POST(request: Request) {
  try {
    const { text, style } = await request.json();
    if (!text || !text.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing required API key" }, { status: 500 });

    const { getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prefix = STYLE_PREFIXES[style as string] || STYLE_PREFIXES.default;
    // Gemini TTS has a practical input ceiling per call — a long tutoring
    // explanation is still just a few sentences, but guard against anything
    // pathological getting sent through.
    function truncateAtSentence(text: string, maxLen: number): string {
      if (text.length <= maxLen) return text;
      const truncated = text.slice(0, maxLen);
      // Find the last sentence-ending punctuation
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('! '),
        truncated.lastIndexOf('? '),
        truncated.lastIndexOf('.\\n'),
        truncated.lastIndexOf('!\\n'),
        truncated.lastIndexOf('?\\n'),
      );
      if (lastSentenceEnd > maxLen * 0.5) return truncated.slice(0, lastSentenceEnd + 1).trim();
      return truncated.trim();
    }
    const pcm = await synthesize(prefix + truncateAtSentence(text.trim(), 4000), apiKey);
    const wav = wrapPcmAsWav(pcm);

    return new Response(wav, {
      headers: { "Content-Type": "audio/wav", "Content-Length": String(wav.length) },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: error.message || "Speech generation failed." }, { status: 500 });
  }
}

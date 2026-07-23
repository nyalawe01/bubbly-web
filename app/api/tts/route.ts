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

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing required API key" }, { status: 500 });

    const { getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Gemini TTS has a practical input ceiling per call — a long tutoring
    // explanation is still just a few sentences, but guard against anything
    // pathological getting sent through.
    const pcm = await synthesize(text.trim().slice(0, 4000), apiKey);
    const wav = wrapPcmAsWav(pcm);

    return new Response(wav, {
      headers: { "Content-Type": "audio/wav", "Content-Length": String(wav.length) },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: error.message || "Speech generation failed." }, { status: 500 });
  }
}

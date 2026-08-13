// app/api/image/route.ts
//
// AI image generation. Primary model is ByteDance Seedream 4.5 via fal.ai's
// synchronous REST endpoint; if fal is unset or errors, it automatically falls
// back to Google Imagen (via @google/genai + GEMINI_API_KEY, the same client
// used for embeddings). Either way the finished bytes are stored in the Supabase
// Storage bucket "generated-images" (owner-write RLS, public read — see
// supabase/migrations/0003_generated_images_storage.sql) and a public URL is
// returned. Model choices live in lib/ai/models.ts (IMAGE_MODEL).
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IMAGE_MODEL } from "@/lib/ai/models";

// fal's predefined image_size presets — map the caller's aspect ratio onto one.
const FAL_IMAGE_SIZE: Record<string, string> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
};

interface GeneratedImage {
  bytes: string; // base64
  mimeType: string;
}

/** Seedream 4.5 via fal.ai's synchronous endpoint. Returns null (never throws) so the
 *  caller can fall back to Imagen on any failure — missing key, network, bad response. */
async function generateWithFal(prompt: string, aspectRatio?: string): Promise<GeneratedImage | null> {
  const falKey = process.env.FAL_KEY;
  if (!falKey || !falKey.trim()) return null;

  try {
    const response = await fetch(`https://fal.run/${IMAGE_MODEL.primary.model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: FAL_IMAGE_SIZE[aspectRatio || "1:1"] || "square_hd",
        num_images: 1,
      }),
    });

    if (!response.ok) {
      console.warn(`fal Seedream returned ${response.status}, falling back to Imagen.`);
      return null;
    }

    const data = await response.json();
    const imageUrl: string | undefined = data?.images?.[0]?.url;
    if (!imageUrl) return null;

    // fal hosts the result on its own CDN; re-download and re-host in our bucket so the
    // URL is owned by us and doesn't expire.
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;
    const arrayBuffer = await imageResponse.arrayBuffer();
    const mimeType = imageResponse.headers.get("content-type") || "image/png";
    return { bytes: Buffer.from(arrayBuffer).toString("base64"), mimeType };
  } catch (e) {
    console.warn("fal Seedream generation failed, falling back to Imagen:", e);
    return null;
  }
}

/** Google Gemini fallback — native image generation via generateContent. Tries each model in turn
 *  until one returns inline image bytes. (The old Imagen generateImages path 404s on current keys, and
 *  Google's free tier returns 429 limit:0 — this only yields images when the project has billing on.) */
async function generateWithGoogle(prompt: string): Promise<GeneratedImage | null> {
  const googleKey = process.env.GEMINI_API_KEY;
  if (!googleKey) return null;

  const ai = new GoogleGenAI({ apiKey: googleKey });
  for (const model of IMAGE_MODEL.fallback.models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseModalities: ["IMAGE"] },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const data = part.inlineData?.data;
        if (data) {
          return { bytes: data, mimeType: part.inlineData?.mimeType || "image/png" };
        }
      }
    } catch (e) {
      console.warn(`Gemini image model ${model} failed:`, e);
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { prompt, aspectRatio } = await request.json();
    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
    }

    const trimmedPrompt = String(prompt).trim();
    if (trimmedPrompt.length > 1000) {
      return NextResponse.json({ error: "Prompt must be 1000 characters or fewer" }, { status: 400 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Seedream first for quality; Gemini native image if fal is unavailable so this never fully breaks.
    const generated =
      (await generateWithFal(trimmedPrompt, aspectRatio)) ?? (await generateWithGoogle(trimmedPrompt));

    if (!generated) {
      throw new Error("Image generation failed — neither fal.ai nor Google image was available.");
    }

    const extension = generated.mimeType.split("/")[1] || "png";
    const path = `${user.id}/${Date.now()}.${extension}`;
    const buffer = Buffer.from(generated.bytes, "base64");

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(path, buffer, { contentType: generated.mimeType, upsert: false });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage.from("generated-images").getPublicUrl(path);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrlData.publicUrl,
      metadata: { prompt: trimmedPrompt },
    });
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image", success: false }, { status: 500 });
  }
}

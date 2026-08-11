// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { callModel, MODELS } from "@/lib/ai/models";

import * as mammothModule from 'mammoth';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';

const mammoth = (mammothModule as any).default || mammothModule;
// The old text-embedding-004 / embedding-001 models 404 on current Gemini keys.
// gemini-embedding-001 is live but defaults to 3072 dims; the vault_embeddings
// column is vector(768), so we force 768-dim output to match (and avoid the
// dimension-mismatch insert error that was 500ing every upload).
const EMBEDDING_MODELS = ['gemini-embedding-001', 'gemini-embedding-2'];
const EMBED_DIM = 768;

// Diagram-question support (see lib/ai/quiz.ts): images extracted from a source
// document get persisted to Storage + vault_document_images so the quiz generator
// can later reuse the EXACT image ("label the parts of this diagram") instead of
// only working from OCR'd text. PDFs are NOT covered here — only direct raster
// image uploads and images embedded inside DOCX/PPTX (both are cheap: the bytes
// are already sitting right there, unlike PDF which would need page rendering).
const MAX_EXTRACTED_IMAGES = 5;
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

interface PendingImage {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  description?: string | null;
}

/** One short fast vision call for images that didn't already go through the main
 *  OCR pass (i.e. DOCX/PPTX embedded media). Never throws — a missing caption just
 *  means the diagram question prompt gets less context, not a failed upload. */
async function describeImage(openai: OpenAI, buffer: Buffer, mimeType: string): Promise<string | null> {
  const visionModels = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
  ];
  for (const visionModel of visionModels) {
    try {
      const response = await openai.chat.completions.create({
        model: visionModel,
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image in one short sentence. If it's a labeled diagram (e.g. anatomy, a cycle, a process), say so and name a few of the labeled parts.",
              },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      });
      const desc = response.choices[0]?.message?.content?.trim();
      if (desc) return desc;
    } catch {
      continue;
    }
  }
  return null;
}

/** Uploads one extracted image to the vault-diagrams bucket (same
 *  upload-then-getPublicUrl pattern as app/api/image/route.ts) and rows it in
 *  vault_document_images. Best-effort — a failure here must not fail the upload. */
async function persistDocumentImage(
  supabase: any,
  openai: OpenAI | null,
  userId: string,
  documentId: string,
  image: PendingImage
): Promise<void> {
  try {
    const ext = image.mimeType.split('/')[1] || 'png';
    const path = `${userId}/${documentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('vault-diagrams')
      .upload(path, image.buffer, { contentType: image.mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from('vault-diagrams').getPublicUrl(path);
    const description = image.description ?? (openai ? await describeImage(openai, image.buffer, image.mimeType) : null);

    await supabase.from('vault_document_images').insert({
      document_id: documentId,
      user_id: userId,
      url: publicUrlData.publicUrl,
      ai_description: description,
    });
  } catch (e) {
    console.warn(`Failed to persist document image (${image.filename}):`, e);
  }
}

function chunkText(text: string, maxChars = 2500) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

async function generateAISummary(text: string): Promise<string> {
  try {
    // Routed through MODELS.chatExpert (centralized) instead of a hardcoded model
    // string — swapping the Expert tier used to silently miss this call site.
    const response = await callModel(MODELS.chatExpert, {
      messages: [
        {
          role: "system",
          content:
            "You are an AI that generates concise 5-line summaries of documents. Provide only the summary, no other text. Keep it to exactly 5 lines maximum.",
        },
        { role: "user", content: `Summarize this document in exactly 5 lines or less:\n\n${text.slice(0, 8000)}` },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });
    return response.choices[0]?.message?.content || "No summary generated.";
  } catch (error) {
    console.error("Summary generation failed:", error);
    return "Summary generation failed.";
  }
}

/** Embeds every chunk, discovering the first working Gemini embedding model from
 *  the FIRST real chunk instead of burning a separate throwaway "ping" call. Saves
 *  one full API round-trip on every single upload. */
async function embedChunks(ai: GoogleGenAI, chunks: string[]): Promise<number[][]> {
  let activeModel = '';
  const results: number[][] = [];

  for (const chunk of chunks) {
    if (!activeModel) {
      for (const model of EMBEDDING_MODELS) {
        try {
          const result = await ai.models.embedContent({ model, contents: chunk, config: { outputDimensionality: EMBED_DIM } });
          const values = result.embeddings?.[0]?.values || [];
          if (values.length) {
            activeModel = model;
            results.push(values);
            break;
          }
        } catch {
          continue;
        }
      }
      if (!activeModel) throw new Error("No compatible Google embedding model available.");
    } else {
      const result = await ai.models.embedContent({ model: activeModel, contents: chunk, config: { outputDimensionality: EMBED_DIM } });
      results.push(result.embeddings?.[0]?.values || []);
    }
  }

  return results;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const googleKey = process.env.GEMINI_API_KEY;

    if (!googleKey) throw new Error("Missing API Keys");

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    let textContent = "";
    const pendingImages: PendingImage[] = [];
    console.log(`Processing file: ${fileName} (${mimeType})`);

    if (fileName.match(/\.(xls|xlsx|csv)$/i)) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      textContent = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return `--- Sheet: ${name} ---\n` + XLSX.utils.sheet_to_csv(sheet);
      }).join('\n\n');
    } else if (fileName.match(/\.(doc|docx)$/i)) {
      const docxData = await mammoth.extractRawText({ buffer });
      textContent = docxData.value;
      // DOCX is an OOXML zip — mammoth only pulls text, so unzip separately to also
      // grab any embedded images for diagram questions. Legacy .doc isn't a zip and
      // will throw here; that's fine, images are a bonus, not required.
      try {
        const zip = new AdmZip(buffer);
        zip.getEntries().forEach((entry) => {
          if (pendingImages.length >= MAX_EXTRACTED_IMAGES) return;
          if (!entry.entryName.startsWith("word/media/")) return;
          const ext = entry.entryName.split(".").pop()?.toLowerCase();
          if (ext && MIME_BY_EXT[ext]) {
            pendingImages.push({
              buffer: entry.getData(),
              mimeType: MIME_BY_EXT[ext],
              filename: entry.entryName.split("/").pop() || "image",
            });
          }
        });
      } catch {
        // Not a valid zip (legacy .doc) or extraction failed — ignore, text already captured.
      }
    } else if (fileName.match(/\.(ppt|pptx)$/i)) {
      try {
        const zip = new AdmZip(buffer);
        let pptxText = `--- Presentation: ${fileName} ---\n`;
        zip.getEntries().forEach((entry) => {
          if (entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")) {
            const xml = entry.getData().toString('utf8');
            const matches = xml.match(/<a:t>(.*?)<\/a:t>/g);
            if (matches) pptxText += matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
          } else if (entry.entryName.startsWith("ppt/media/") && pendingImages.length < MAX_EXTRACTED_IMAGES) {
            const ext = entry.entryName.split(".").pop()?.toLowerCase();
            if (ext && MIME_BY_EXT[ext]) {
              pendingImages.push({
                buffer: entry.getData(),
                mimeType: MIME_BY_EXT[ext],
                filename: entry.entryName.split("/").pop() || "image",
              });
            }
          }
        });
        textContent = pptxText;
      } catch (e) {
        throw new Error("Failed to extract PPTX text.");
      }
    } else if (fileName.match(/\.(zip)$/i)) {
      const zip = new AdmZip(buffer);
      let zipText = `--- ZIP ARCHIVE CONTENTS: ${fileName} ---\n\n`;
      zip.getEntries().forEach((entry) => {
        if (!entry.isDirectory) {
          const name = entry.entryName;
          if (name.match(/\.(txt|md|csv|json|js|ts|html|css|svg)$/i)) {
            zipText += `>>> File: ${name}\n${entry.getData().toString('utf8')}\n\n`;
          }
        }
      });
      textContent = zipText;
    } else if (fileName.match(/\.(svg)$/i)) {
      textContent = new TextDecoder("utf-8").decode(arrayBuffer);
    } else if (fileName.match(/\.(pdf|png|jpg|jpeg|webp|gif)$/i)) {
      const openai = new OpenAI({ baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", apiKey: googleKey });
      const prompt =
        "Extract and transcribe all text from this file exactly as it appears. If there are tables, charts, or diagrams, describe them and extract their data. Return only raw extracted text.";

      const visionModels = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
      ];

      for (const visionModel of visionModels) {
        try {
          const response = await openai.chat.completions.create({
            model: visionModel,
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${buffer.toString("base64")}` },
                  },
                ],
              },
            ],
          });
          textContent = response.choices[0]?.message?.content || "";
          if (textContent) break;
        } catch (e: any) {
          console.warn(`Vision model ${visionModel} failed.`);
        }
      }

      // Direct raster image upload (not PDF — PDF diagram extraction isn't supported yet):
      // persist the original bytes too, reusing the OCR pass above as the caption instead
      // of spending a second vision call on it.
      if (!fileName.match(/\.pdf$/i) && textContent) {
        pendingImages.push({
          buffer,
          mimeType: mimeType || "image/jpeg",
          filename: file.name,
          description: textContent.slice(0, 300),
        });
      }
    } else {
      textContent = new TextDecoder("utf-8").decode(arrayBuffer);
    }

    textContent = textContent.trim();
    if (!textContent) throw new Error("Document extraction failed.");

    const aiSummary = await generateAISummary(textContent);

    const { data: docData, error: docError } = await supabase
      .from('vault_documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || "unknown",
        file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        ai_summary: aiSummary,
        // Full extracted text so the Vault preview modal can render the real document
        // without reconstructing it from embedding chunks. Older documents predating
        // this column got it on their row, so the vault page falls back to the chunks.
        file_content: textContent,
      })
      .select()
      .single();

    if (docError) throw new Error(`Database Error: ${docError.message}`);

    if (pendingImages.length) {
      const openaiForCaptions = new OpenAI({ baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", apiKey: googleKey });
      await Promise.all(
        pendingImages.map((image) => persistDocumentImage(supabase, openaiForCaptions, user.id, docData.id, image))
      );
    }

    const ai = new GoogleGenAI({ apiKey: googleKey });
    const chunks = chunkText(textContent);
    const vectors = await embedChunks(ai, chunks);

    const embeddingsToInsert = chunks.map((chunk, i) => ({
      document_id: docData.id,
      user_id: user.id,
      content: chunk,
      embedding: vectors[i] || [],
    }));

    const { error: vecError } = await supabase.from('vault_embeddings').insert(embeddingsToInsert);
    if (vecError) throw new Error(`Vector DB Error: ${vecError.message}`);

    return NextResponse.json({
      success: true,
      document: { ...docData, ai_summary: aiSummary },
    });
  } catch (error: any) {
    console.error("Omni-Parser Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}
// lib/ai/ingestion.ts
//
// Shared document-ingestion core, factored out of app/api/upload/route.ts so the
// EXACT same proven pipeline (PDF/image OCR, DOCX, PPTX, XLSX/CSV, SVG, ZIP, text)
// is reused by the Vault upload path AND the chat-attachment bridge
// (app/api/chat/attachments/). Keeping these in one module guarantees chat-attached
// files are processed identically to Vault uploads — closing the "AI ignores what the
// student pastes in" trust gap with zero divergent logic.
//
// Exported surface:
//  - extractFileContent(file, opts) -> { textContent, pendingImages }
//  - generateAISummary(text, opts)   -> string
//  - chunkText(text, maxChars)       -> string[]
//  - embedChunks(ai, chunks)         -> number[][]
//  - persistDocumentImages(...)      -> void (Vault-only side effect)
//  - EMBED_DIM constant + MIME_BY_EXT + MAX_EXTRACTED_IMAGES
//
// Functions that touch Supabase (persistDocumentImages, embed inserts, vault row
// writes) are intentionally kept at the CALL SITES rather than here, because the chat
// attachment path stores context TEMPORARILY (no vault_documents row), whereas the
// Vault path does the full write. This module owns EXTRACTION; callers own PERSIST.

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import * as mammothModule from "mammoth";
import * as XLSX from "xlsx";
import AdmZip from "adm-zip";
import { callModel, MODELS } from "./models";

const mammoth = (mammothModule as any).default || mammothModule;

export const MAX_EXTRACTED_IMAGES = 5;
export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
};

export const EMBEDDING_MODELS = ["gemini-embedding-001", "gemini-embedding-2"];
export const EMBED_DIM = 768;

export interface PendingImage {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  description?: string | null;
}

const DEFAULT_CHUNK = 2500;
const DEFAULT_SUMMARY_LIMIT = 8000;
const DEFAULT_TEXT_CAP = 30000;

export interface ExtractionOpts {
  limit?: number; // cap on the returned textContent (chars). Default DEFAULT_TEXT_CAP.
  skipImages?: boolean; // chat attachments don't need diagram images persisted
}

export interface ExtractionResult {
  textContent: string;
  pendingImages: PendingImage[];
}

/** The core parser: given a File, return its extracted text + any diagram images
 *  embedded in docx/pptx (or the raster bytes for direct image uploads). */
export async function extractFileContent(file: File, opts: ExtractionOpts = {}): Promise<ExtractionResult> {
  const googleKey = process.env.GEMINI_API_KEY;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type.toLowerCase();
  const fileName = (file.name || "").toLowerCase();

  let textContent = "";
  const pendingImages: PendingImage[] = [];
  const limit = opts.limit ?? DEFAULT_TEXT_CAP;

  if (fileName.match(/\.(xls|xlsx|csv)$/i)) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    textContent = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `--- Sheet: ${name} ---\n` + XLSX.utils.sheet_to_csv(sheet);
    }).join("\n\n");
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
      // Not a valid zip (legacy .doc) — ignore, text is already captured.
    }
  } else if (fileName.match(/\.(ppt|pptx)$/i)) {
    try {
      const zip = new AdmZip(buffer);
      let pptxText = `--- Presentation: ${fileName} ---\n`;
      zip.getEntries().forEach((entry) => {
        if (entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")) {
          const xml = entry.getData().toString("utf8");
          const matches = xml.match(/<a:t>(.*?)<\/a:t>/g);
          if (matches) pptxText += matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ") + "\n";
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
    } catch {
      throw new Error("Failed to extract PPTX text.");
    }
  } else if (fileName.match(/\.(zip)$/i)) {
    const zip = new AdmZip(buffer);
    let zipText = `--- ZIP ARCHIVE CONTENTS: ${fileName} ---\n\n`;
    zip.getEntries().forEach((entry) => {
      if (!entry.isDirectory) {
        const name = entry.entryName;
        if (name.match(/\.(txt|md|csv|json|js|ts|html|css|svg)$/i)) {
          zipText += `>>> File: ${name}\n${entry.getData().toString("utf8")}\n\n`;
        }
      }
    });
    textContent = zipText;
  } else if (fileName.match(/\.(svg)$/i)) {
    textContent = new TextDecoder("utf-8").decode(arrayBuffer);
  } else if (fileName.match(/\.(pdf|png|jpg|jpeg|webp|gif)$/i)) {
    if (!googleKey) throw new Error("Missing GEMINI_API_KEY for vision extraction.");
    const openai = new OpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: googleKey,
    });
    // One short fast vision call per model until one returns text. Never throws —
    // a failed vision pass just yields empty text (the caller decides what to do).
    const prompt =
      "Extract and transcribe all text from this file exactly as it appears. If there are tables, charts, or diagrams, describe them and extract their data. Return only raw extracted text.";

    const visionModels = ["gemini-3.6-flash", "gemini-3.5-flash"];

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
                  image_url: { url: `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}` },
                },
              ],
            },
          ],
        });
        textContent = response.choices[0]?.message?.content || "";
        if (textContent) break;
      } catch {
        continue;
      }
    }

    // Direct raster image upload (not PDF — PDF diagram extraction isn't supported yet):
    // capture the original bytes for diagram use, reusing the OCR pass above as the
    // caption instead of spending a second vision call on it.
    if (!opts.skipImages && !fileName.match(/\.pdf$/i) && textContent) {
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
  if (!textContent) {
    // Don't throw — a chat attachment that yields nothing should produce an empty
    // context + a clear message, not a 500 that kills the whole send.
    return { textContent: "", pendingImages: [] };
  }

  return { textContent: textContent.slice(0, limit), pendingImages };
}

/** 5-line AI summary via the centralized Expert tier (same helper the Vault route used). */
export async function generateAISummary(text: string): Promise<string> {
  try {
    const response = await callModel(MODELS.chatExpert, {
      messages: [
        { role: "system", content: "You are an AI that generates concise 5-line summaries of documents. Provide only the summary, no other text. Keep it to exactly 5 lines maximum." },
        { role: "user", content: `Summarize this document in exactly 5 lines or less:\n\n${text.slice(0, DEFAULT_SUMMARY_LIMIT)}` },
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

export function chunkText(text: string, maxChars = DEFAULT_CHUNK) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

/** Embeds every chunk, discovering the first working Gemini embedding model from the
 *  FIRST real chunk instead of burning a separate throwaway "ping" call on every upload. */
export async function embedChunks(ai: GoogleGenAI, chunks: string[]): Promise<number[][]> {
  let activeModel = "";
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

/** One short fast vision call for images that didn't already go through the main
 *  OCR pass (i.e. DOCX/PPTX embedded media). Never throws — a missing caption just
 *  means the diagram question prompt gets less context, not a failed upload. */
export async function describeImage(openai: OpenAI, buffer: Buffer, mimeType: string): Promise<string | null> {
  const visionModels = ["gemini-3.6-flash", "gemini-3.5-flash"];
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
export async function persistDocumentImage(
  supabase: any,
  openai: OpenAI | null,
  userId: string,
  documentId: string,
  image: PendingImage
): Promise<void> {
  try {
    const ext = image.mimeType.split("/")[1] || "png";
    const path = `${userId}/${documentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("vault-diagrams")
      .upload(path, image.buffer, { contentType: image.mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from("vault-diagrams").getPublicUrl(path);
    const description = image.description ?? (openai ? await describeImage(openai, image.buffer, image.mimeType) : null);

    await supabase.from("vault_document_images").insert({
      document_id: documentId,
      user_id: userId,
      url: publicUrlData.publicUrl,
      ai_description: description,
    });
  } catch (e) {
    console.warn(`Failed to persist document image (${image.filename}):`, e);
  }
}

// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function chunkText(text: string, maxChars = 2500) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

async function generateAISummary(text: string, openRouterKey: string): Promise<string> {
  try {
    const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: openRouterKey });
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
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

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const googleKey = process.env.GEMINI_API_KEY;

    if (!openRouterKey || !googleKey) throw new Error("Missing API Keys");

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
    } else if (fileName.match(/\.(ppt|pptx)$/i)) {
      try {
        const zip = new AdmZip(buffer);
        let pptxText = `--- Presentation: ${fileName} ---\n`;
        zip.getEntries().forEach((entry) => {
          if (entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")) {
            const xml = entry.getData().toString('utf8');
            const matches = xml.match(/<a:t>(.*?)<\/a:t>/g);
            if (matches) pptxText += matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
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
      const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: openRouterKey });
      const prompt =
        "Extract and transcribe all text from this file exactly as it appears. If there are tables, charts, or diagrams, describe them and extract their data. Return only raw extracted text.";

      const visionModels = [
        "google/gemini-2.5-flash",
        "google/gemini-1.5-flash:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
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
    } else {
      textContent = new TextDecoder("utf-8").decode(arrayBuffer);
    }

    textContent = textContent.trim();
    if (!textContent) throw new Error("Document extraction failed.");

    const aiSummary = await generateAISummary(textContent, openRouterKey);

    const { data: docData, error: docError } = await supabase
      .from('vault_documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || "unknown",
        file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        ai_summary: aiSummary,
      })
      .select()
      .single();

    if (docError) throw new Error(`Database Error: ${docError.message}`);

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
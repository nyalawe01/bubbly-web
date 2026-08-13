// lib/ai/generate.ts
//
// Shared, server-side generation cores for each Notebook asset type. Extracted
// from the per-type API routes so the background orchestrator
// (app/api/notebook/generate) and the legacy routes can share one implementation.
// Each returns { title, content, metadataLabel } — content is the raw generated
// payload stored on notebook_assets.content; metadataLabel is a short display line.

import { callModel, MODELS } from "@/lib/ai/models";
import { fetchSourceContent } from "@/lib/ai/vault";
import { postProcessQuiz } from "@/lib/ai/quiz";
import {
  QUIZ_CONTRACT,
  FLASHCARD_CONTRACT,
  SUMMARY_CONTRACT,
  EXAM_CONTRACT,
  SLIDE_OUTLINE_PROMPT,
  SLIDE_RENDER_PROMPT,
  GLOBAL_STYLE,
  GENERATED_CONTEXT_RULES,
} from "@/lib/ai/prompts";

export interface GenResult {
  title: string;
  content: any;
  metadataLabel: string;
}

function validateFlashcards(result: any): void {
  if (!result?.cards || !Array.isArray(result.cards)) throw new Error('Invalid flashcard response: missing cards array');
  result.cards = result.cards.filter((c: any) => c?.front && c?.back);
  if (!result.cards.length) throw new Error('No valid flashcards generated');
}

function validateSlides(result: any): void {
  if (!result?.slides && !Array.isArray(result)) throw new Error('Invalid slides response: missing slides array');
  const slides = result.slides || result;
  if (!Array.isArray(slides) || !slides.length) throw new Error('No valid slides generated');
}

function validateSummary(result: any): void {
  if (!result?.sections && !result?.content && !result?.summary) throw new Error('Invalid summary response: missing content');
}

function validateExam(result: any): void {
  if (!result?.questions || !Array.isArray(result.questions)) throw new Error('Invalid exam response: missing questions array');
  if (!result.questions.length) throw new Error('No exam questions generated');
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: "basic and fundamental concepts",
  medium: "intermediate concepts with some complexity",
  hard: "advanced concepts requiring deep understanding",
};

async function complete(system: string, user: string, maxTokens: number) {
  // The model occasionally returns a 200 with whitespace-only (or otherwise
  // unparseable) content — a transient hiccup, not a prompt-shape bug. Retry once
  // before surfacing, so a single bad completion doesn't 500 the whole generator.
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const content = (response.choices?.[0]?.message?.content ?? "").trim();
    if (!content) continue;
    try {
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Malformed JSON — retry once rather than failing the whole generation.
    }
  }
  throw new Error("Model returned no usable JSON content");
}

// ---------------- QUIZ ----------------
const QUIZ_COUNTS: Record<string, number> = { fewer: 20, standard: 25, more: 35 };

export async function generateQuizContent(supabase: any, userId: string, config: any, numQuestionsOverride?: number): Promise<GenResult> {
  const numQuestions = numQuestionsOverride ?? QUIZ_COUNTS[config.questionCount] ?? QUIZ_COUNTS.standard;
  const sourceContent = config.sources?.length ? await fetchSourceContent(supabase, config.sources, userId, 50) : "";

  // Diagrams the model may reference — only images actually extracted from these
  // source documents (see app/api/upload/route.ts). PDFs don't extract images yet.
  let documentImages: { url: string; ai_description: string | null }[] = [];
  if (config.sources?.length) {
    const { data: images } = await supabase
      .from("vault_document_images")
      .select("url, ai_description")
      .eq("user_id", userId)
      .in("document_id", config.sources)
      .limit(10);
    documentImages = images || [];
  }

  const system = `${QUIZ_CONTRACT}\n\nGenerate exactly ${numQuestions} questions at ${
    DIFFICULTY_MAP[config.difficulty] || "medium"
  } difficulty.`;
  let user = `Generate a quiz on the topic: ${config.topic || "general knowledge"}.\nExactly ${numQuestions} questions at ${
    config.difficulty || "medium"
  } difficulty.`;
  if (sourceContent) user += `\n\nCONTEXT:\n${sourceContent.slice(0, 16000)}`;
  if (documentImages.length) {
    user += `\n\nDOCUMENT IMAGES (only use these exact URLs for "diagram" questions, and only if a question` +
      ` about the image is genuinely answerable — skip decorative/irrelevant ones):\n` +
      documentImages
        .map((img, i) => `${i + 1}. imageUrl: ${img.url}\n   description: ${img.ai_description || "(no description)"}`)
        .join("\n");
  }

  // max_tokens 6000: enough for a real 35-question, all-types quiz (~5000 tokens
  // observed) — deliberately NOT shrunk to fit Groq's gpt-oss-120b free-tier 8K
  // tokens/min cap, since a large quiz's prompt + 6000 can exceed that on its own.
  // That's fine: callModel()'s fallback ladder treats Groq's 413 ("too large") as a
  // failover trigger, so oversized requests transparently retry on the Gemini
  // candidate instead of truncating output to force-fit the smaller tier.
  const rawQuiz = await complete(system, user, 6000);
  const quiz = postProcessQuiz(rawQuiz, documentImages.map((img) => img.url));
  return {
    title: quiz.title || "Quiz",
    content: quiz,
    metadataLabel: `${quiz.questions?.length ?? numQuestions} questions · ${config.difficulty || "medium"}`,
  };
}

// ---------------- FLASHCARDS ----------------
const CARD_COUNTS: Record<string, number> = { fewer: 8, standard: 15, more: 30 };

export async function generateFlashcardsContent(supabase: any, userId: string, config: any): Promise<GenResult> {
  const numCards = CARD_COUNTS[config.cardCount] ?? CARD_COUNTS.standard;
  const sourceContent = config.sources?.length ? await fetchSourceContent(supabase, config.sources, userId, 50) : "";
  const system = `${FLASHCARD_CONTRACT}\n\nGenerate exactly ${numCards} flashcards for study.`;
  let user = `Create flashcards for the topic: ${config.topic || "general study"}.\nDifficulty: ${
    config.difficulty || "medium"
  }. Generate ${numCards} cards.`;
  if (sourceContent) user += `\n\nCONTEXT:\n${sourceContent.slice(0, 16000)}`;
  const flashcards = await complete(system, user, 4000);
  validateFlashcards(flashcards);
  return {
    title: flashcards.title || "Flashcards",
    content: flashcards,
    metadataLabel: `${flashcards.cards?.length ?? numCards} cards · ${config.difficulty || "medium"}`,
  };
}

// ---------------- SUMMARY ----------------
export async function generateSummaryContent(supabase: any, userId: string, config: any): Promise<GenResult> {
  const sourceContent = config.sources?.length ? await fetchSourceContent(supabase, config.sources, userId, 50) : "";
  const system = `${SUMMARY_CONTRACT}\n\n${GENERATED_CONTEXT_RULES}`;
  let user = `Summarize the topic: ${config.topic || "general knowledge"}. Length: ${
    config.length === "detailed" ? "detailed" : "brief"
  }.`;
  if (sourceContent) user += `\n\nCONTEXT:\n${sourceContent.slice(0, 16000)}`;
  const summary = await complete(system, user, 3000);
  validateSummary(summary);
  return {
    title: summary.title || `Summary: ${config.topic || "Untitled"}`,
    content: summary,
    metadataLabel: config.topic || "Summary",
  };
}

// ---------------- SLIDES ----------------
const SLIDE_COUNTS: Record<string, number> = { short: 6, default: 12, long: 16 };

export async function generateSlidesContent(supabase: any, userId: string, config: any): Promise<GenResult> {
  const numSlides = SLIDE_COUNTS[config.length] ?? SLIDE_COUNTS.default;
  const sourceContent = config.sources?.length ? await fetchSourceContent(supabase, config.sources, userId, 60) : "";
  const formatNote =
    config.format === "detailed"
      ? "a comprehensive deck meant to be read on its own, with fuller text per slide"
      : "clean presenter slides — short talking points, not full paragraphs";

  const outlineUser = `Topic/description: ${config.description || "General educational presentation"}
Language: ${config.language || "English"}
Style: ${formatNote}
Target slide count: ${numSlides}
${sourceContent ? `\nSource material (ground the outline in this, don't invent facts outside it):\n${sourceContent.slice(0, 16000)}` : ""}`;

  const outline = await complete(SLIDE_OUTLINE_PROMPT, outlineUser, 2000);
  validateSlides(outline);
  const outlineSlides: any[] = outline.slides || [];
  if (outlineSlides.length === 0) throw new Error("Outline generation failed to produce any slides.");

  const renderedSlides = await Promise.all(
    outlineSlides.map(async (slide: any) => {
      try {
        const renderResponse = await callModel(MODELS.generator, {
          messages: [
            { role: "system", content: SLIDE_RENDER_PROMPT },
            {
              role: "user",
              content: `Deck title: ${outline.title}\nDeck language: ${config.language || "English"}\nDeck style: ${formatNote}\n\nThis slide's outline entry:\n${JSON.stringify(
                slide
              )}${sourceContent ? `\n\nSource material for factual grounding:\n${sourceContent.slice(0, 4000)}` : ""}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: "json_object" },
        });
        const content = renderResponse.choices[0]?.message?.content || "{}";
        const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        const rendered = JSON.parse(cleaned);
        return {
          id: slide.id,
          title: rendered.title || slide.title,
          bullets: rendered.bullets || [],
          type: rendered.chart ? "chart" : rendered.diagram ? "diagram" : "text",
          speakerNotes: rendered.speakerNotes || "",
          chart: rendered.chart || null,
          diagram: rendered.diagram || null,
        };
      } catch {
        return { id: slide.id, title: slide.title, bullets: slide.keyPoints || [], type: "text", speakerNotes: "", chart: null, diagram: null };
      }
    })
  );
  renderedSlides.sort((a, b) => a.id - b.id);

  return {
    title: outline.title || "Slides",
    content: { title: outline.title || "Slides", slides: renderedSlides },
    metadataLabel: `${renderedSlides.length} slides`,
  };
}

// ---------------- EXAM / GUIDE ----------------
export async function generateExamContent(supabase: any, userId: string, config: any): Promise<GenResult> {
  const documentContext = config.sources?.length ? await fetchSourceContent(supabase, config.sources, userId, 50) : "";
  if (!documentContext) throw new Error("Select at least one source to generate an exam.");
  const examType = config.examType === "guide" ? "guide" : "exam";
  const base = `CONTEXT:\n${documentContext}\n\n`;

  if (examType === "guide") {
    const system = `${GLOBAL_STYLE}

${GENERATED_CONTEXT_RULES}

You're turning the student's own notes into a structured study guide. Format with ## main topics,
### subtopics, **bold** key definitions, bullet lists, numbered steps for processes, tables for
comparisons, and a few practice questions at the end. Turn messy notes into a clean, easy-to-study outline.`;
    const response = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: base + "Generate a comprehensive, well-structured study guide based on the context above." },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content || "";
    return { title: "Study Guide", content: { text }, metadataLabel: "Study Guide" };
  }

  const system = `${EXAM_CONTRACT}\n\n${GENERATED_CONTEXT_RULES}`;
  const count = config.config?.count;
  let user = `${base}Generate a practice exam worth ${count ? count * 2 : 20} total marks, difficulty level: ${
    config.config?.difficulty || "medium"
  }.`;
  
  if (config?.types?.length) {
    user += `\nGenerate ONLY the following question types: ${config.types.join(', ')}.`;
  }
  
  const exam = await complete(system, user, 4000);
  validateExam(exam);
  return {
    title: exam.title || "Practice Exam",
    content: exam,
    metadataLabel: `${exam.totalMarks ?? 20} marks · ${exam.suggestedMinutes ?? 30} min`,
  };
}

// ---------------- DISPATCH ----------------
export async function generateAsset(type: string, supabase: any, userId: string, config: any): Promise<GenResult> {
  switch (type) {
    case "quiz": return generateQuizContent(supabase, userId, config);
    case "flashcards": return generateFlashcardsContent(supabase, userId, config);
    case "summary": return generateSummaryContent(supabase, userId, config);
    case "slides": return generateSlidesContent(supabase, userId, config);
    case "exam":
    case "guide": return generateExamContent(supabase, userId, { ...config, examType: type === "guide" ? "guide" : config.examType });
    default: throw new Error(`Unknown asset type: ${type}`);
  }
}

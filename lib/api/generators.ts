// lib/api/generators.ts
//
// Thin client-side wrappers around the generator API routes. Each uploads any
// raw File[] to the vault first (turning them into source IDs), then POSTs the
// route's actual expected payload shape — this is the layer that fixes the
// modal <-> API field-name mismatches (count -> questionCount/cardCount, etc.)
// without touching every modal's internals.

import { uploadFilesToVault } from "./vaultUpload";

interface BaseConfig {
  files?: File[];
  sources?: string[];
}

async function resolveSources(config: BaseConfig): Promise<string[]> {
  if (config.sources?.length) return config.sources;
  if (config.files?.length) return uploadFilesToVault(config.files);
  return [];
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request to ${url} failed`);
  }
  return data;
}

export async function generateQuiz(config: { count: string; difficulty: string; topic: string; files?: File[] }) {
  const sources = await resolveSources(config);
  return postJson("/api/quiz", {
    questionCount: config.count,
    difficulty: config.difficulty,
    topic: config.topic,
    sources,
  });
}

export async function generateFlashcards(config: { count: string; difficulty: string; topic: string; files?: File[] }) {
  const sources = await resolveSources(config);
  return postJson("/api/flashcards", {
    cardCount: config.count,
    difficulty: config.difficulty,
    topic: config.topic,
    sources,
  });
}

export async function generateSlides(config: {
  format: string;
  language: string;
  length: string;
  description: string;
  files?: File[];
}) {
  const sources = await resolveSources(config);
  return postJson("/api/slides", {
    format: config.format,
    language: config.language,
    length: config.length,
    description: config.description,
    sources,
  });
}

export async function generateSummary(config: { topic: string; files?: File[] }) {
  const sources = await resolveSources(config);
  return postJson("/api/summary", { topic: config.topic, sources });
}

export async function generateExam(config: {
  examType: "guide" | "exam";
  files?: File[];
  sources?: string[];
  config?: { count?: number; difficulty?: string; types?: string[] };
}) {
  const sourceIds = await resolveSources(config);
  if (!sourceIds.length) throw new Error("Select at least one source to generate an exam.");
  return postJson("/api/exam", { sourceIds, examType: config.examType, config: config.config });
}

// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CHAT_SYSTEM_PROMPT, diagramAddendum, imageAddendum, webSearchAddendum, tutorAddendum } from "@/lib/ai/prompts";
import { classifyIntent, type RouteDecision } from "@/lib/ai/router";
import { embedText, fetchVaultContext, formatVaultContextBlock } from "@/lib/ai/vault";
import { callModel, chatModelFor } from "@/lib/ai/models";
import { matchCache, writeCache } from "@/lib/ai/cache";

export async function POST(request: Request) {
  try {
    const { message, history, modelType, files, attachment_context, generateDiagram, generateImage, mode, incognito, responseLanguage } = await request.json();

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const googleKey = process.env.GEMINI_API_KEY;

    if (!googleKey) {
      return NextResponse.json({ error: "Missing required API Keys" }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Quota guardrail (Phase 1.5) ----
    // Per-user daily cap so a runaway session can't rack up unbounded costs.
    // Logged reads are async/fire-and-forget — never block the user.
    const { count: todaysMessages } = await supabase
      .from("usage_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_name", "chat_message")
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if ((todaysMessages ?? 0) >= 50) {
      return NextResponse.json(
        { error: "Daily study limit reached. Your limit resets tomorrow." },
        { status: 429 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: googleKey });

    // Base URL for this route's own internal self-calls (/api/search, /api/image).
    // NEXTAUTH_URL wins if explicitly set; otherwise VERCEL_URL is auto-injected by
    // Vercel on every deployment (no config needed) so these resolve correctly in
    // production instead of silently trying localhost from inside the server.
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Run the independent pre-steps CONCURRENTLY so the reply starts fast:
    //  - Embedding the message, used for BOTH Vault retrieval and (below) the
    //    semantic cache check — computed once, never twice.
    //  - Vault retrieval (vector search on that embedding): the silent RAG half,
    //    scoped to this user so no one's notes leak into another student's context.
    //  - Intent classification (Groq 8b-instant): decides web-search/image/diagram.
    // If the UI explicitly asked for a diagram, skip classification entirely.
    const embedPromise = embedText(ai, message);
    const retrievalPromise = embedPromise.then((queryEmbedding) =>
      queryEmbedding.length
        ? fetchVaultContext(supabase, queryEmbedding, user.id, { matchCount: 5, matchThreshold: 0.35 })
        : []
    );
    // Client fast-paths skip the classifier when intent is unambiguous. Image wins over diagram
    // if both somehow fire (a picture request should never be forced into mermaid mode).
    const routePromise: Promise<RouteDecision> = generateImage
      ? Promise.resolve({ needsWebSearch: false, needsDiagram: false, needsImage: true, searchQuery: null, imagePrompt: message, modelHint: "vision" })
      : generateDiagram
      ? Promise.resolve({ needsWebSearch: false, needsDiagram: true, needsImage: false, searchQuery: null, imagePrompt: null, modelHint: "instant" })
      : classifyIntent(message);

    const [queryEmbedding, vaultChunks, route] = await Promise.all([embedPromise, retrievalPromise, routePromise]);

    // "auto" (also the default when the client sends nothing) defers to the
    // classifier's modelHint instead of a fixed tier — an explicit model choice
    // always wins and skips this entirely.
    const resolvedModelType = !modelType || modelType === "auto" ? route.modelHint : modelType;

    // Semantic cache: only for a fresh, context-free, plain-chat turn — no history
    // (avoids serving a reply that depended on prior context to an unrelated
    // follow-up), no Vault notes involved (never cross-student-leak private
    // content), no web-search/diagram/image intent, and only the (possibly
    // auto-resolved) "instant" tier. See lib/ai/cache.ts +
    // supabase/migrations/0008_ai_response_cache.sql.
    // Incognito turns skip the cache both ways: no read (an incognito question
    // shouldn't surface an answer cached from a non-incognito context) and no
    // write (keeps incognito content from ever entering the shared cache other
    // students' similar questions could otherwise hit).
    const cacheEligible =
      !incognito &&
      mode !== "tutor" &&
      (!history || history.length === 0) &&
      vaultChunks.length === 0 &&
      !route.needsWebSearch &&
      !route.needsDiagram &&
      !route.needsImage &&
      resolvedModelType === "instant";

    if (cacheEligible && queryEmbedding.length) {
      const { hit, payload } = await matchCache(supabase, "chat", queryEmbedding);
      if (hit && payload?.text) {
        const cachedStream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(payload.text));
            controller.close();
          },
        });
        return new Response(cachedStream, {
          headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", "Connection": "keep-alive" },
        });
      }
    }

    // Kept separate from CHAT_SYSTEM_PROMPT (not concatenated into one string)
    // so the per-turn part (vault/search/mode context) stays out of the stable
    // prefix — it differs on every single call, and the ~1.8k-token stable prompt
    // falls comfortably over Gemini's prompt-caching minimum.
    let systemAddenda = formatVaultContextBlock(vaultChunks);

    // ---- Chat-attachment context (Phase 1 P0) ----
    // Files attached inline to THIS message are processed by /api/chat/attachments/process
    // (which runs the same extraction as the Vault). The frontend sends the already-
    // extracted content here; we surface it as a labeled context block so the model
    // genuinely reads the attachment, and list it in Sources for transparency.
    let attachmentContext = "";
    let attachmentSources: any[] = [];
    if (Array.isArray(attachment_context) && attachment_context.length > 0) {
      attachmentContext = "\n\n[SOURCE: THIS MESSAGE'S ATTACHMENT(S)]\nThe student attached the following files to this message. Read their content to answer — do not summarize the file list as your answer.\n" +
        (attachment_context as any[])
          .map((f) => {
            const name = f?.file_name || f?.name || "attachment";
            const body = (f?.content || "").slice(0, 16000);
            return `<ATTACHED FILE: ${name}> type=${f?.file_type || "unknown"}\n${body}\n</ATTACHED FILE>`;
          })
          .join("\n\n");
      attachmentSources = attachment_context.map((f: any) => ({
        type: "attachment",
        title: f?.file_name || f?.name || "Attachment",
        snippet: (f?.content || "").slice(0, 150),
      }));
      systemAddenda += attachmentContext;
    }

    // Real sources shown to the student at the end of the reply — one entry per
    // distinct Vault file actually retrieved (deduped, same convention as
    // formatVaultContextBlock) plus every web result actually used. Sent to the
    // client as a trailing [SOURCES] tag once the reply finishes streaming.
    const seenFiles = new Set<string>();
    const fileSources = vaultChunks
      .filter((c: any) => {
        const name = c.file_name || "Untitled";
        if (seenFiles.has(name)) return false;
        seenFiles.add(name);
        return true;
      })
      .map((c: any) => ({ type: "file", title: c.file_name || "Untitled", snippet: (c.content || "").slice(0, 150) }));

    let webSources: any[] = [];
    let searchFailed = false;
    if (route.needsWebSearch) {
      try {
        const searchResponse = await fetch(
          `${baseUrl}/api/search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: route.searchQuery || message }),
          }
        );
        const searchData = await searchResponse.json();
        if (searchData.results?.length > 0) {
          systemAddenda += webSearchAddendum(searchData.results);
          webSources = searchData.results.map((r: any) => ({
            type: "web",
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            domain: r.domain,
          }));
        }
      } catch (searchError) {
        console.warn("Web search failed:", searchError);
        searchFailed = true;
      }
    }

    const combinedSources = [...fileSources, ...attachmentSources, ...webSources];

    if (route.needsDiagram) {
      systemAddenda += diagramAddendum();
    }

    if (route.needsImage) {
      systemAddenda += imageAddendum();
    }

    if (mode === "tutor") {
      systemAddenda += tutorAddendum(typeof responseLanguage === "string" ? responseLanguage : undefined);
    }

    if (searchFailed) {
      systemAddenda += `\n[Note: Web search was attempted but failed. Answer from your knowledge and note that current web sources could not be consulted.]`;
    }

    // Kick off image generation in parallel with the chat completion below —
    // /api/image requires auth, so forward this request's own auth (cookie or
    // bearer token) into the internal call.
    const imagePromise = route.needsImage
      ? (async () => {
          try {
            const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
            const cookieHeader = request.headers.get("cookie");
            if (cookieHeader) forwardHeaders["cookie"] = cookieHeader;
            const authHeader = request.headers.get("authorization");
            if (authHeader) forwardHeaders["authorization"] = authHeader;

            const imageResponse = await fetch(`${baseUrl}/api/image`, {
              method: "POST",
              headers: forwardHeaders,
              body: JSON.stringify({ prompt: route.imagePrompt || message }),
            });
            const imageData = await imageResponse.json();
            return imageData?.success ? { url: imageData.imageUrl, prompt: route.imagePrompt || message } : null;
          } catch (imageError) {
            console.warn("Image generation failed:", imageError);
            return null;
          }
        })()
      : Promise.resolve(null);

    // Attachment NAMES are already surfaced via attachment_context above with the
    // file content; the legacy `files` names-only list is no longer needed for grounding.

    const formattedHistory =
      history?.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })) || [];
    formattedHistory.push({ role: "user", content: message });

    const chatModel = chatModelFor(resolvedModelType);

    // Single plain-string system message for every tier. The old code split the
    // system prompt into a content-array with an Anthropic-style cache_control
    // breakpoint for the (then OpenRouter-only) expert/vision tiers — but every LLM
    // tier now runs on the OpenAI-compatible shape via callModel() (Groq and
    // Gemini), and Gemini's OpenAI-compatible endpoint does not consume
    // cache_control; prompt caching is automatic. A plain string is what all
    // candidates expect, so there's nothing to gain from a different shape.
    const systemMessage = { role: "system", content: CHAT_SYSTEM_PROMPT + systemAddenda };

    // Pick the chat tier: instant/default -> Groq GPT-OSS 120B (fast, falls back to
    // Gemini Flash on a rate limit/deprecation), expert -> Gemini Pro, vision ->
    // Gemini Flash. Groq's near-instant first token is what makes this feel like
    // ChatGPT. (See lib/ai/models.ts.) callModel() fails over on a rejected
    // create() call — that happens before any stream bytes are consumed, so this
    // is safe for the streaming case too, never a mid-stream provider switch.
    const completionStream: any = await callModel(chatModel, {
      messages: [
        systemMessage as any,
        ...formattedHistory,
      ],
      temperature: 0.5,
      max_tokens: 2048, // Lowered from 8192 — a concise prompt doesn't need runway to ramble.
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          let raw = "";
          let sentLength = 0;
          let diagramData: any = null;
          let questionsData: any = null;
          let realUsage: any = null;

          // Tags the MODEL can emit inline that must be lifted out of the visible
          // text and turned into structured payloads (a diagram to render, or a
          // question form to pop up). Whichever appears first stops the visible flush.
          const earliestTag = (s: string): number => {
            const found = ["[DIAGRAM]", "[QUESTIONS]"]
              .map((t) => s.indexOf(t))
              .filter((i) => i !== -1);
            return found.length ? Math.min(...found) : -1;
          };

          for await (const chunk of completionStream) {
            if (chunk.usage) realUsage = chunk.usage;
            const delta = chunk.choices?.[0]?.delta?.content || "";
            if (!delta) continue;
            raw += delta;

            const tagIndex = earliestTag(raw);

            if (tagIndex === -1) {
              // Nothing tag-like yet — but guard against flushing a partial prefix
              // like "[QUESTION" right before the closing bracket arrives next chunk.
              // (Longest tag name is 9 chars, so allow up to 10.)
              const guardMatch = /\[[A-Z]{0,10}$/.exec(raw.slice(sentLength));
              const safeEnd = guardMatch ? sentLength + guardMatch.index : raw.length;
              if (safeEnd > sentLength) {
                controller.enqueue(encoder.encode(raw.slice(sentLength, safeEnd)));
                sentLength = safeEnd;
              }
            } else if (sentLength < tagIndex) {
              // Flush everything up to the tag, then stop flushing — the tag's
              // contents stay buffered until the stream ends and we can parse it,
              // instead of leaking raw "[DIAGRAM]{...}" / "[QUESTIONS]{...}" text.
              controller.enqueue(encoder.encode(raw.slice(sentLength, tagIndex)));
              sentLength = tagIndex;
            }
          }

          const remainder = raw.slice(sentLength);
          const diagramMatch = remainder.match(/\[DIAGRAM\]\s*(\{[\s\S]*\})/);
          const questionsMatch = remainder.match(/\[QUESTIONS\]\s*(\{[\s\S]*\})/);
          let finalPlainText: string | null = null;
          if (diagramMatch) {
            try {
              diagramData = JSON.parse(diagramMatch[1]);
            } catch {
              // Not valid JSON after all — flush it as plain text so nothing is lost.
              controller.enqueue(encoder.encode(remainder));
            }
          } else if (questionsMatch) {
            try {
              questionsData = JSON.parse(questionsMatch[1]);
            } catch {
              controller.enqueue(encoder.encode(remainder));
            }
          } else if (remainder.trim()) {
            controller.enqueue(encoder.encode(remainder));
            finalPlainText = raw; // the full plain-text reply, not just this last chunk
          }

          // Cache write on a miss — only the plain-text case (no diagram/questions/image
          // tag), and only when this turn was cache-eligible to begin with.
          if (cacheEligible && finalPlainText) {
            writeCache(supabase, "chat", message, queryEmbedding, { text: finalPlainText }, completionStream._modelUsed);
          }

          if (diagramData) {
            controller.enqueue(encoder.encode(`[DIAGRAM]${JSON.stringify(diagramData)}`));
          }
          if (questionsData) {
            controller.enqueue(encoder.encode(`[QUESTIONS]${JSON.stringify(questionsData)}`));
          }

          const imageData = await imagePromise;
          if (imageData) {
            controller.enqueue(encoder.encode(`[IMAGE]${JSON.stringify(imageData)}`));
          }

          if (combinedSources.length) {
            controller.enqueue(encoder.encode(`[SOURCES]${JSON.stringify(combinedSources)}`));
          }

          controller.close();
          
          supabase.from("usage_events").insert({
            user_id: user.id,
            feature_name: "chat_message",
            model_used: chatModel?.[0]?.model || "unknown",
            provider: chatModel?.[0]?.provider || "unknown",
            tokens_used: realUsage?.total_tokens || Math.ceil((message + systemAddenda).length / 4),
            estimated_cost: realUsage?.total_tokens 
              ? realUsage.total_tokens * 0.0001 
              : Math.ceil((message + systemAddenda).length / 1000) * 0.0004,
            metadata: {
              incognito: !!incognito,
              has_web_search: !!route.needsWebSearch,
              has_attachment: Array.isArray(attachment_context) && attachment_context.length > 0,
            },
          }).then(() => {}, () => {});

        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Execution failed." }, { status: 500 });
  }
}
# Bubbly

**The AI workspace built for the modern student.**

Chat with an AI tutor that generates quizzes, flashcards, slides, and exams from your own notes — free to start, on the web, on mobile, and right inside your browser.

Bubbly (internally codenamed *EduOS*) is a full-stack academic intelligence platform: a Next.js web app, an Expo React Native mobile app, and a WXT browser extension, all sharing one Supabase backend, one AI layer, and one design system.

---

## Highlights

- **AI tutor chat** with three model pills — *Instant*, *Expert*, and *Vision* — plus an **Automatic** mode that classifies each message and picks the best model, tool, and language for the job.
- **Study material generators** — quizzes, flashcards, slides, summaries, and full exams generated from your own uploaded documents.
- **The Vault** — a personal document store with AI-generated summaries, used as the retrieval source for grounded, citation-backed answers.
- **Web search, diagrams, and images** — the router decides per message whether to search the web, draw a diagram (Mermaid), or generate an image, all without you lifting a finger.
- **Voice-to-voice tutor** — talk it through instead of typing it (mobile + web voice features).
- **Three surfaces, one brain** — the same chat, Vault, and generators on desktop, in your pocket, and as a side panel in your browser.
- **30 UI languages** with full RTL support (Arabic, Persian, Hebrew, Urdu) — the AI itself always replies in the language you write in.
- **Theming** — multiple built-in themes with light/dark modes and four logical font roles, applied before first paint (no flash).

---

## Platforms

| Surface | Tech | Status |
| --- | --- | --- |
| **Web / Command Center** | Next.js 15 (App Router, React 19, Tailwind) | `app/` — main app in this repo |
| **Mobile / On-the-Go Companion** | Expo React Native (expo-router) | `mobile/` — separate git repo |
| **Browser / Real-Time Companion** | WXT Chrome side-panel extension | `extension/` — ships its own README |

The browser extension reuses the same backend (`app/api/chat`) with the same Bearer-token auth as mobile — there is no separate API to maintain.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| **Framework** | Next.js 15.5 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 3 + `tailwind-merge`, `clsx`, Framer Motion / GSAP |
| **Backend** | Supabase (Postgres 17, Auth, Storage) + Next.js API Routes |
| **AI models** | Groq (primary) → OpenRouter (failover), Gemini, fal.ai — see [AI model tiers](#ai-model-tiers) |
| **Auth** | Supabase Auth (email + Google OAuth) via `@supabase/ssr` |
| **Monorepo** | npm workspaces (`shared/` shared package) |
| **Mobile** | Expo SDK 54, React Native, expo-router, Reanimated, Moti |
| **Extension** | WXT, Chrome MV3 side panel |
| **Tooling** | ESLint 9 (flat config), TypeScript 5.3 |

---

## AI Model Tiers

One place — [`lib/ai/models.ts`](lib/ai/models.ts) — decides which model runs each job, with **cross-provider failover** built in. Every tier is an ordered list of candidates; a capacity/quota/deprecation error on one provider (402/404/413/429/5xx) automatically falls through to the next, so a single vendor's rate limit never takes down a feature.

| Tier | Models | Used for |
| --- | --- | --- |
| `chatFast` | GPT-OSS 120B (Groq) → Gemini Flash (OpenRouter) | Everyday chat |
| `chatExpert` | DeepSeek (OpenRouter) | The "Expert" pill — deeper reasoning |
| `chatVision` | Gemini Flash (OpenRouter) | Image-understanding chat |
| `router` | GPT-OSS 20B (Groq) | Intent classification (search / image / diagram / model hint) |
| `generator` | GPT-OSS 120B (Groq) → Gemini Flash (OpenRouter) | Quizzes, flashcards, slides, summaries, exams |
| `generatorPrecise` | Gemini Flash → DeepSeek (OpenRouter) | AI grading — where a wrong answer is a trust failure |

Image generation is separate: **ByteDance Seedream 4.5** via fal.ai (primary) with a **Gemini Imagen** fallback.

> These tiers were hardened after two real incidents — Groq's on-demand token caps 500'ing every generator at once, and Groq deprecating two models with no code-level warning. See the header comment in `lib/ai/models.ts` for the full story.

---

## Getting Started

### Prerequisites

- Node.js 18.18+ (or your project-manager's preferred version)
- A Supabase project (or the [Supabase CLI](https://supabase.com/docs/guides/cli) for local dev)
- API keys for the AI providers you want to use (Groq is enough to start; see [Environment variables](#environment-variables))

### Install & run

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the public marketing page, and sign in at `/login` to reach the app.

### Local Supabase

```bash
supabase start
supabase db reset   # applies supabase/migrations/ + seed.sql
```

The schema is built entirely from versioned migrations in [`supabase/migrations/`](supabase/migrations/) — 15 files covering users, the Vault, notebook assets, chat sessions, AI response caching, generated-image storage, classes, and preferences. Migration filenames are ordered and descriptive; read them in sequence to understand the data model.

---

## Environment Variables

See [`.env.example`](.env.example) for the full annotated list. Copy it to `.env.local` and fill in real values — **never commit `.env.local`**.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | account admin | Server-only; account deletion / export |
| `GROQ_API_KEY` | chat/generators | Primary LLM tier |
| `OPENROUTER_API_KEY` | failover | Failover tier + Expert/Vision |
| `GEMINI_API_KEY` | embeddings, TTS, images | Vault embeddings, response cache, image fallback, vision OCR |
| `FAL_KEY` | image gen | Primary image generation (Seedream 4.5) |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | optional | Web speech / streaming |
| `NEXTAUTH_URL` | optional | Public origin for links (defaults to `http://localhost:3000`) |

> **AI provider failover order:** Groq → OpenRouter for chat/generators. Gemini powers embeddings, image/TTS/OCR fallbacks. A mix of keys keeps every feature alive.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (`next build`) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint over the workspace |

---

## Project Structure

```text
eduos-web/
├── app/                  # Next.js App Router
│   ├── page.tsx          # Public landing page
│   ├── chat/             # The main app (chat + generators + Vault)
│   ├── vault/            # Document Vault
│   ├── exams/            # Exam generation
│   ├── login/            # Auth entry
│   ├── help/             # Support / help center
│   ├── privacy/ terms/   # Legal pages
│   └── api/              # Route handlers (the backend)
│       ├── chat/         # Chat + streaming + titles
│       ├── quiz/         # Quiz generation + grading
│       ├── flashcards/ slides/ summary/ exam/
│       ├── notebook/     # Notebook chat + generation + qchat
│       ├── image/        # Image generation (fal → Gemini fallback)
│       ├── search/       # Web search
│       ├── scisketch/    # Science sketching / diagrams
│       ├── transcribe/ tts/   # Voice
│       ├── grade/ agent/ drive/ upload/ account/ source-guide/
├── components/           # React components
│   ├── landing/          # Marketing site sections
│   ├── chat/             # Chat view + composer
│   ├── sidebar/          # Sidebar, recents, notebooks
│   ├── modals/           # Quiz, flashcards, slides, exam, sources, settings…
│   ├── theme/            # ThemeProvider + theme init script
│   ├── i18n/             # i18n adapter (web)
│   └── ui/               # Icons, buttons, logo, motion primitives
├── lib/                  # Server-side logic
│   ├── ai/               # models, router, prompts, generate, quiz, vault, cache
│   ├── api/              # vaultUpload, generators
│   ├── supabase/         # Server Supabase client
│   └── exportChat.ts artifacts.ts utils.ts
├── shared/               # @bubbly/shared workspace package
│   ├── types/            # Shared TypeScript types
│   ├── i18n/             # Single translation catalog (30 languages)
│   ├── constants/ theme/ utils/ lib/
├── supabase/             # Supabase config + migrations + seed
├── mobile/               # Expo React Native app (separate repo, gitignored)
├── extension/            # WXT browser extension (own README)
├── middleware.ts         # Supabase session refresh
└── next.config.ts        # Next.js config
```

### The `shared/` package

Web and mobile share code through the `@bubbly/shared` workspace package:

- **`shared/i18n/catalog.ts`** — the *one* translation catalog consumed by both adapters. 30 UI languages; keys are namespaced by feature and missing keys fall back to English. This is **system/UI language only** — it never touches the AI's response language (the model replies in whatever language the student writes in).
- **`shared/types/`** — chat, message, generator-config, Vault, design-token, and API response types.
- **`shared/constants/`, `shared/theme/`** — design tokens and theme definitions, single source of truth.

---

## How It Works (request flow)

```text
            ┌────────────────────────────────────────────────┐
   Browser  │  Next.js (App Router)                          │
   Mobile   │                                                │
 Extension  │  ┌────────────┐   ┌─────────────┐              │
   ───────► │  │  app/api/* │──►│  lib/ai/    │              │
            │  │  routes    │   │  models.ts  │───► Groq ──┐ │
            │  └────────────┘   │  router.ts  │───► OpenR  ├─┤
            │                   │  prompts.ts │───► Gemini │ │
            │                   └─────────────┘   fal.ai   ┘ │
            │        ▲              │                        │
            │        │              ▼                        │
            │  ┌────────────┐  ┌────────────┐                │
            │  │  Supabase  │  │  Vault     │ (RAG source)   │
            │  │  (auth/db/ │  │  retrieval │                │
            │  │   storage) │  └────────────┘                │
            │  └────────────┘                                │
            └────────────────────────────────────────────────┘
```

1. A message hits the chat route (`app/api/chat/route.ts`).
2. The **router** (`lib/ai/router.ts`) classifies intent in parallel with Vault retrieval — web search? diagram? image? which model tier?
3. The main generation call runs through `callModel()` (`lib/ai/models.ts`), trying each tier candidate in order.
4. Generated assets (quizzes, flashcards, slides, exams, summaries) are stored and returned to the client; Vault documents are summarized and indexed for retrieval-augmented chat.

---

## Deployment

Designed to deploy to **Vercel**:

- `VERCEL_URL` is set automatically on deploy (used to build the app's public origin).
- Build-time Google Fonts fetches are intentionally avoided on the landing page — `next/font/google` network fetches were the root cause of a past Vercel build failure (see the note in `app/page.tsx`).
- The `mobile/` directory is gitignored here (it lives in its own repo) so it never bloats web builds.
- Supabase handles Postgres, Auth, and Storage; migrations are versioned in `supabase/migrations/`.

---

## Contributing

1. Read [`AGENTS.md`](AGENTS.md) — this repo pins a specific Next.js version whose APIs differ from standard Next.js; the versioned docs live in `node_modules/next/dist/docs/`.
2. Read `lib/ai/models.ts` before touching anything AI-related — model tiering and failover are load-bearing.
3. Keep system prompts centralized in `lib/ai/prompts.ts`, translations in `shared/i18n/catalog.ts`, and types in `shared/types/`.
4. Run `npm run lint` before opening a PR.

---

## License

Private / proprietary — no license is specified in this repository. Ask the maintainers before reusing any part of it.

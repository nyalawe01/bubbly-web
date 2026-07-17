-- 0008_ai_response_cache.sql
--
-- Lightweight semantic cache for context-free AI responses. Deliberately SHARED
-- across users (no user_id) — the savings come from cross-student reuse of common
-- questions ("what is mitosis") and common generator configs ("quiz on cell
-- biology, medium, 25 questions"). Callers (app/api/chat/route.ts,
-- app/api/notebook/generate/route.ts) are responsible for only checking/writing
-- this cache when the request has NO private Vault/source context — a response
-- generated from one student's private notes must never be served to another
-- student, so this table must never be written to (or read from) for those calls.

create table if not exists public.ai_response_cache (
  id uuid primary key default gen_random_uuid(),
  scope text not null,               -- 'chat' | 'quiz' | 'flashcards' | 'slides' | 'summary'
  key_text text not null,            -- normalized text that was embedded (message, or a topic+config composite)
  embedding vector(768) not null,
  payload jsonb not null,            -- chat: {text}; generators: {title, content, metadataLabel}
  model_used text,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz
);

create index if not exists ai_response_cache_scope_idx on public.ai_response_cache (scope);

alter table public.ai_response_cache enable row level security;

-- Shared, non-personal cache: any authenticated student may read or add entries.
-- Content here is restricted by application logic to context-free, generic
-- academic requests, so there's nothing user-specific to protect with per-row RLS.
drop policy if exists "Authenticated can read response cache" on public.ai_response_cache;
create policy "Authenticated can read response cache" on public.ai_response_cache
  for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated can insert response cache" on public.ai_response_cache;
create policy "Authenticated can insert response cache" on public.ai_response_cache
  for insert with check (auth.uid() is not null);

drop policy if exists "Authenticated can update response cache" on public.ai_response_cache;
create policy "Authenticated can update response cache" on public.ai_response_cache
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Mirrors match_documents' shape/pattern, filtered by scope instead of by user.
drop function if exists match_response_cache(vector, text, float);
create or replace function match_response_cache(
  query_embedding vector(768),
  match_scope text,
  match_threshold float
)
returns table (id uuid, payload jsonb, model_used text, similarity float)
language sql stable
as $$
  select
    ai_response_cache.id,
    ai_response_cache.payload,
    ai_response_cache.model_used,
    1 - (ai_response_cache.embedding <=> query_embedding) as similarity
  from ai_response_cache
  where ai_response_cache.scope = match_scope
    and 1 - (ai_response_cache.embedding <=> query_embedding) > match_threshold
  order by ai_response_cache.embedding <=> query_embedding
  limit 1;
$$;

-- 0015_response_cache_hardening.sql
--
-- Hardens ai_response_cache (0008) against cache poisoning, adds the missing
-- pgvector indexes, creates the "generated-images" storage bucket that 0003
-- only wrote policies for, and constrains chat_sessions.mode to real values.
--
-- PROBLEM (0008): the shared, cross-user cache was INSERT-able by any
-- authenticated user and UPDATE-able across ALL rows. Nothing DB-side stopped
-- a user from inserting a poisoned payload ("what is mitosis" -> wrong answer)
-- that the semantic matcher then served to every student, or from overwriting
-- an existing good entry. "Only store context-free responses" was an app-level
-- invariant with no enforcement here.
--
-- FIX:
--   1. New rows are attributed to their inserter (owner_id = auth.uid()).
--   2. UPDATE/DELETE are restricted to the row's owner. Cross-user reads stay
--      (that's the whole point of the shared cache), but nobody can mutate
--      someone else's entry. Existing pre-migration rows have owner_id NULL
--      and are therefore immutable to everyone (read-only orphans).
--   3. A SECURITY DEFINER bump_response_cache_hit() lets any authenticated
--      user still increment hit_count/last_hit_at on shared rows (the app's
--      fire-and-forget counter) WITHOUT needing UPDATE privilege on the row —
--      it can only touch the counter columns, never payload/model_used.
--   4. CHECK constraints pin scope to known values and payload to a JSON object.

create extension if not exists vector;

alter table public.ai_response_cache
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;

create index if not exists ai_response_cache_owner_idx on public.ai_response_cache (owner_id);

-- Anyone authenticated may keep reading/inserting (shared cache), but inserts
-- must be attributable to the caller.
drop policy if exists "Authenticated can insert response cache" on public.ai_response_cache;
create policy "Authenticated can insert response cache" on public.ai_response_cache
  for insert with check (auth.uid() is not null and owner_id = auth.uid());

drop policy if exists "Authenticated can update response cache" on public.ai_response_cache;
create policy "Owner can update own response cache entries" on public.ai_response_cache
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 0008 had no DELETE policy at all (unbounded growth); the owner may now clean
-- up their own contributions.
drop policy if exists "Owner can delete own response cache entries" on public.ai_response_cache;
create policy "Owner can delete own response cache entries" on public.ai_response_cache
  for delete using (auth.uid() = owner_id);

alter table public.ai_response_cache
  add constraint ai_response_cache_scope_check
  check (scope in ('chat', 'quiz', 'flashcards', 'slides', 'summary'));

alter table public.ai_response_cache
  add constraint ai_response_cache_payload_check
  check (payload is not null and jsonb_typeof(payload) = 'object');

-- Counter bump that bypasses row-level UPDATE RLS but is narrowly scoped to the
-- hit_count/last_hit_at columns. Security definer runs as the table owner
-- (postgres); callers still need to be authenticated (granted below).
create or replace function public.bump_response_cache_hit(p_row_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_response_cache
  set hit_count = hit_count + 1, last_hit_at = now()
  where id = p_row_id;
$$;

revoke all on function public.bump_response_cache_hit(uuid) from public;
grant execute on function public.bump_response_cache_hit(uuid) to authenticated;

-- ============================================================
-- PGVECTOR INDEXES (assessment item: exact scans are O(n) as volume grows).
-- match_documents/match_response_cache sort by the cosine distance operator
-- (<=>), so the cosine opclass is the right one for both.
-- ============================================================
create index if not exists vault_embeddings_embedding_hnsw_idx
  on vault_embeddings using hnsw (embedding vector_cosine_ops);

create index if not exists ai_response_cache_embedding_hnsw_idx
  on ai_response_cache using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- STORAGE: "generated-images" bucket was never created in any migration —
-- 0003 only added INSERT/DELETE policies on storage.objects. A fresh database
-- had no bucket, so image uploads silently failed. Create it idempotently,
-- matching how 0013 handles "vault-diagrams".
-- ============================================================
insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', true)
on conflict (id) do nothing;

-- ============================================================
-- chat_sessions.mode CHECK: the mobile app (mobile/lib/chatSessions.ts
-- setChatSessionMode) writes 'chat' | 'voice_tutor' — pin it so a stray value
-- can't silently break the "study sessions" filter that will read this column.
-- ============================================================
alter table public.chat_sessions
  add constraint chat_sessions_mode_check
  check (mode in ('chat', 'voice_tutor'));

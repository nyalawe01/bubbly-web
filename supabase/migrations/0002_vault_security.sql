-- 0002_vault_security.sql
--
-- Fixes a cross-tenant data leak: vault_documents/vault_embeddings inserts never
-- set user_id, and every read (Vault page, chat RAG retrieval, quiz/flashcard/
-- slide/summary/exam source lookups) queried them with no owner filter at all —
-- meaning every student could see, generate study material from, and delete
-- every other student's uploaded documents. The application code has been fixed
-- to set/filter user_id everywhere; this migration adds RLS as the enforcement
-- layer so a future missed filter fails closed instead of leaking data again.
--
-- Run this against your Supabase project (SQL editor or `supabase db push`)
-- alongside 0001_bubbly_foundation.sql. Safe to re-run — uses IF NOT EXISTS /
-- DROP POLICY IF EXISTS throughout.

-- Ensure the columns the application now relies on actually exist (they were
-- already referenced by pre-existing delete-by-user_id calls, so this should
-- be a no-op on an already-correct schema).
alter table vault_documents add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table vault_embeddings add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists vault_documents_user_id_idx on vault_documents(user_id);
create index if not exists vault_embeddings_user_id_idx on vault_embeddings(user_id);

alter table vault_documents enable row level security;
alter table vault_embeddings enable row level security;

drop policy if exists "Owner can manage own vault documents" on vault_documents;
create policy "Owner can manage own vault documents" on vault_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owner can manage own vault embeddings" on vault_embeddings;
create policy "Owner can manage own vault embeddings" on vault_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Also enable RLS on quiz_history (pre-existing table, created before this
-- migration set) for the same defense-in-depth reasoning.
alter table quiz_history enable row level security;
drop policy if exists "Owner can manage own quiz history" on quiz_history;
create policy "Owner can manage own quiz history" on quiz_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Redefine match_documents to require and filter by p_user_id. If your existing
-- function has a different signature, drop it first (the old unscoped version
-- must not remain callable, since it's the vector-search path used by chat RAG).
drop function if exists match_documents(vector, float, int);
create or replace function match_documents(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (content text, document_id uuid, similarity float)
language sql stable
as $$
  select
    vault_embeddings.content,
    vault_embeddings.document_id,
    1 - (vault_embeddings.embedding <=> query_embedding) as similarity
  from vault_embeddings
  where vault_embeddings.user_id = p_user_id
    and 1 - (vault_embeddings.embedding <=> query_embedding) > match_threshold
  order by vault_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

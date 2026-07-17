-- 0004_match_documents_filename.sql
--
-- lib/ai/vault.ts's formatVaultContextBlock() now tags each retrieved chunk with its
-- source filename (e.g. "[src=1 | Biology Ch.4 Notes]") so the model can cite honestly
-- per GENERATED_CONTEXT_RULES. match_documents previously only returned content — add
-- a join to vault_documents for file_name.

drop function if exists match_documents(vector, float, int, uuid);
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (content text, document_id uuid, file_name text, similarity float)
language sql stable
as $$
  select
    vault_embeddings.content,
    vault_embeddings.document_id,
    vault_documents.file_name,
    1 - (vault_embeddings.embedding <=> query_embedding) as similarity
  from vault_embeddings
  join vault_documents on vault_documents.id = vault_embeddings.document_id
  where vault_embeddings.user_id = p_user_id
    and 1 - (vault_embeddings.embedding <=> query_embedding) > match_threshold
  order by vault_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

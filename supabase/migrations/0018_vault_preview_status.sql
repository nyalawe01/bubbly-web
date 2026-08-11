-- 0018_vault_preview_status.sql
--
-- Vault integrity (Phase 2, Week 1-2). Adds the columns the preview-fallback
-- UI and backfill script rely on:
--   - preview_status : 'ready' | 'pending' | 'unavailable' | 'broken'
--                      drives the Vault document viewer rendering path.
--   - last_accessed  : when the document was last opened, so the backfill
--                      script can heal the documents users actually see first.
--
-- Both use IF NOT EXISTS so this is a no-op on a schema that already has them.

alter table vault_documents add column if not exists preview_status text not null default 'pending';
alter table vault_documents add column if not exists last_accessed  timestamptz;

create index if not exists vault_documents_preview_status_idx on vault_documents (preview_status);
create index if not exists vault_documents_last_accessed_idx  on vault_documents (last_accessed desc nulls last);

-- 0019_vault_originals_storage.sql
--
-- Stores the original uploaded file bytes in a private Supabase storage bucket
-- (vault-originals) so a broken preview can be re-extracted with full fidelity
-- later (the backfill script re-runs ingestion from these). Path is scoped to
-- `${user.id}/${document.id}/${filename}` (unguessable UUID prefixes).
--
-- A storage_path column on vault_documents records where each original lives so
-- the preview/repair flow can find it without a storage listing.

alter table vault_documents add column if not exists storage_path text;

-- Private bucket: original files are NOT public (unlike extracted diagrams).
insert into storage.buckets (id, name, public)
values ('vault-originals', 'vault-originals', false)
on conflict (id) do nothing;

-- Owner can upload into their own UUID-scoped prefix.
drop policy if exists "Owner can upload own vault originals" on storage.objects;
create policy "Owner can upload own vault originals" on storage.objects
  for insert
  with check (
    bucket_id = 'vault-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read their own originals.
drop policy if exists "Owner can read own vault originals" on storage.objects;
create policy "Owner can read own vault originals" on storage.objects
  for select
  using (
    bucket_id = 'vault-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own originals.
drop policy if exists "Owner can delete own vault originals" on storage.objects;
create policy "Owner can delete own vault originals" on storage.objects
  for delete
  using (
    bucket_id = 'vault-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

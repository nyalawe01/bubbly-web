-- 0013_vault_document_images.sql
--
-- Persists extracted images from uploaded documents (direct image uploads,
-- and images embedded in DOCX/PPTX via word/media|ppt/media) so the quiz
-- generator can reuse the ACTUAL diagram from a source document (e.g. "label
-- the parts of this heart") instead of only ever working from OCR'd text.
-- PDF diagram extraction is deliberately NOT part of this — PDFs still only
-- go through vision-OCR-to-text, no page-rendering/region-detection yet.
--
-- Mirrors 0003_generated_images_storage.sql's storage-bucket-policy pattern
-- (new bucket "vault-diagrams", path scoped to `${user.id}/...`) and the
-- owner-only RLS pattern used throughout (see 0002_vault_security.sql).
--
-- PRODUCT-SECURITY DECISION (documented, not changed here): this bucket is
-- public-read even though the images are extracted from users' PRIVATE uploaded
-- documents, because the quiz generator hands the raw image URLs to the LLM and
-- bakes them into quiz JSON that the UI loads directly. Moving to private +
-- signed URLs is a refactor across app/api/quiz, app/api/notebook/generate and
-- the quiz renderers, so the risk was accepted for now. Mitigations: paths are
-- scoped to `${user.id}/...` (unguessable UUID prefix), and the public flag only
-- means "fetchable without auth" — it is NOT read for arbitrary storage.objects
-- rows (those stay owner-scoped). Revisit signed URLs if any diagram is ever
-- classified sensitive.

create table if not exists vault_document_images (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references vault_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  ai_description text,
  created_at timestamptz not null default now()
);

create index if not exists vault_document_images_document_id_idx on vault_document_images(document_id);
create index if not exists vault_document_images_user_id_idx on vault_document_images(user_id);

alter table vault_document_images enable row level security;

drop policy if exists "Owner can manage own vault document images" on vault_document_images;
create policy "Owner can manage own vault document images" on vault_document_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for the extracted image bytes. Create it here (idempotent)
-- rather than requiring a manual dashboard step, matching how "generated-images"
-- already works. Public read (URLs are shared into quiz JSON/UI), owner-only write.
insert into storage.buckets (id, name, public)
values ('vault-diagrams', 'vault-diagrams', true)
on conflict (id) do nothing;

drop policy if exists "Owner can upload own vault diagrams" on storage.objects;
create policy "Owner can upload own vault diagrams" on storage.objects
  for insert
  with check (
    bucket_id = 'vault-diagrams'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner can delete own vault diagrams" on storage.objects;
create policy "Owner can delete own vault diagrams" on storage.objects
  for delete
  using (
    bucket_id = 'vault-diagrams'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

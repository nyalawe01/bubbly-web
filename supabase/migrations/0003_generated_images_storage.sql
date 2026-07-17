-- 0003_generated_images_storage.sql
--
-- The "generated-images" bucket (created via the Storage API, public read)
-- still needs an explicit RLS policy for writes — storage.objects is
-- RLS-protected regardless of the bucket's public flag. app/api/image/route.ts
-- uploads to `${user.id}/${filename}`, so scope INSERT to that same prefix.

drop policy if exists "Owner can upload own generated images" on storage.objects;
create policy "Owner can upload own generated images" on storage.objects
  for insert
  with check (
    bucket_id = 'generated-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner can delete own generated images" on storage.objects;
create policy "Owner can delete own generated images" on storage.objects
  for delete
  using (
    bucket_id = 'generated-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

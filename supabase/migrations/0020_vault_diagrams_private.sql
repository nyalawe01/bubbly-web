-- Make vault-diagrams bucket private to prevent unauthorized access to
-- images extracted from users' private documents.
UPDATE storage.buckets SET public = false WHERE id = 'vault-diagrams';

-- Allow authenticated users to read only their own images.
CREATE POLICY "Users can view own diagram images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vault-diagrams'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

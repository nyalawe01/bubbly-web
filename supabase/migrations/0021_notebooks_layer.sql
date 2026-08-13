-- 0021_notebooks_layer.sql
--
-- Phase 3: Notebooks as the Organizing Layer
-- Transforms Notebooks from a cosmetic label into the central organizing structure.

-- 1. Create notebooks table
CREATE TABLE IF NOT EXISTS public.notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  course_code text,
  instructor text,
  term text,
  color_hex text DEFAULT '#6C47FF',
  is_archived boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notebooks_user_id_idx ON public.notebooks(user_id);

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own notebooks" ON public.notebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own notebooks" ON public.notebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own notebooks" ON public.notebooks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own notebooks" ON public.notebooks
  FOR DELETE USING (auth.uid() = user_id);


-- 2. Create notebook_documents junction table
CREATE TABLE IF NOT EXISTS public.notebook_documents (
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.vault_documents(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (notebook_id, document_id)
);

ALTER TABLE public.notebook_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read notebook_documents" ON public.notebook_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );

CREATE POLICY "Owner can insert notebook_documents" ON public.notebook_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );

CREATE POLICY "Owner can delete notebook_documents" ON public.notebook_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );


-- 3. Create notebook_artifacts junction table
CREATE TABLE IF NOT EXISTS public.notebook_artifacts (
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES public.notebook_assets(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (notebook_id, artifact_id)
);

ALTER TABLE public.notebook_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read notebook_artifacts" ON public.notebook_artifacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );

CREATE POLICY "Owner can insert notebook_artifacts" ON public.notebook_artifacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );

CREATE POLICY "Owner can delete notebook_artifacts" ON public.notebook_artifacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
  );


-- 4. Add notebook_id to chat_sessions
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS notebook_id uuid REFERENCES public.notebooks(id) ON DELETE SET NULL;

-- 5. Realtime publication (optional but useful for live updates)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notebooks;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_documents;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_artifacts;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;

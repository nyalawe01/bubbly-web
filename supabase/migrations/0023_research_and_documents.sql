-- 0023_research_and_documents.sql
-- Phase 5: Research & Document Workspace

-- 1. research_sessions
CREATE TABLE IF NOT EXISTS public.research_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  query text NOT NULL,
  results_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access research_sessions" ON public.research_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note: 'document' and 'presentation' don't need a schema change since they 
-- use the generic `notebook_assets` table. We just need to add them in application code.

-- 2. artifact_versions (for document history)
CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.notebook_assets(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access artifact_versions" ON public.artifact_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notebook_assets WHERE id = asset_id AND owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.notebook_assets WHERE id = asset_id AND owner_id = auth.uid())
  );

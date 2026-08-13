-- Phase 14: Knowledge Graph & Semantic Memory

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL, -- lowercase, trimmed, for dedup
  type TEXT, -- term, person, process, theory, formula, etc.
  definition TEXT,
  owner_id UUID, -- null for system concepts, set for user-specific
  first_seen_document_id UUID,
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (normalized_name, owner_id)
);

CREATE TABLE concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  target_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  relationship_type TEXT, -- 'relates_to', 'is_a', 'part_of', 'causes', 'uses', 'improves', etc.
  strength FLOAT DEFAULT 0.5, -- 0.0 to 1.0, how often this relationship appears
  first_seen_document_id UUID,
  last_seen_document_id UUID,
  occurrence_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_concept_id, target_concept_id, relationship_type)
);

CREATE TABLE document_concepts (
  document_id UUID REFERENCES vault_documents(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  relevance_score FLOAT, -- how central this concept is to the document
  mention_count INTEGER DEFAULT 1,
  PRIMARY KEY (document_id, concept_id)
);

-- Enable RLS
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_concepts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own concepts (or global system concepts where owner_id IS NULL)
CREATE POLICY "Users can access their own concepts" ON concepts 
  FOR ALL USING (owner_id = auth.uid() OR owner_id IS NULL);

-- Concept relationships inherit from the source concept's owner
CREATE POLICY "Users can access relationships of their concepts" ON concept_relationships 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM concepts WHERE concepts.id = concept_relationships.source_concept_id AND (concepts.owner_id = auth.uid() OR concepts.owner_id IS NULL))
  );

-- Document concepts inherit from document ownership
CREATE POLICY "Users can access their document concepts" ON document_concepts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vault_documents WHERE vault_documents.id = document_concepts.document_id AND vault_documents.user_id = auth.uid())
  );

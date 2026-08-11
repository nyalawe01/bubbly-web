// lib/artifacts/service.ts
//
// Single write path to the unified notebook_assets table. Every generator
// (quiz, flashcards, summary, study_guide, exam_prep, slides, notes) must create
// and read its output through this module — never touch notebook_assets (or the
// legacy generator tables) directly. That keeps storage uniform and lets the
// artifact-uniformity test enforce one shape for every artifact type.
//
// The table columns map to the Artifact model as follows:
//   id          <- gen_random_uuid()
//   user_id     <- ownerId
//   type        <- artifact_type
//   title       <- title
//   content     <- content (the generated payload: quiz questions, flashcard pairs, ...)
//   config      <- { source_document_ids, ...metadata }
//   state       <- interactive progress (quiz scores, per-question chats, ...)
//   status      <- 'ready' | 'generating' | 'failed'
import { SupabaseClient } from "@supabase/supabase-js";

export type ArtifactType =
  | "quiz"
  | "flashcards"
  | "summary"
  | "study_guide"
  | "exam_prep"
  | "slides"
  | "notes";

export type ArtifactStatus = "ready" | "generating" | "failed";

export interface Artifact {
  id: string;
  owner_id: string;
  artifact_type: ArtifactType;
  title: string;
  content: any;
  source_document_ids: string[];
  metadata: Record<string, any>;
  status: ArtifactStatus;
  created_at: string;
  updated_at: string;
}

interface CreateArtifactInput {
  ownerId: string;
  type: ArtifactType;
  title: string;
  content: any;
  sourceDocumentIds?: string[];
  metadata?: Record<string, any>;
}

interface UpdateArtifactInput {
  title?: string;
  content?: any;
  sourceDocumentIds?: string[];
  metadata?: Record<string, any>;
  status?: ArtifactStatus;
  state?: Record<string, any>;
}

// Transform a notebook_assets row into the uniform Artifact shape. The service
// (service-role) rows carry user_id directly, so no join is needed.
function rowToArtifact(row: any): Artifact {
  const config = row.config || {};
  return {
    id: row.id,
    owner_id: row.user_id,
    artifact_type: row.type,
    title: row.title,
    content: row.content,
    source_document_ids: config.source_document_ids || [],
    metadata: config.metadata || {},
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function artifactToRow(input: CreateArtifactInput) {
  return {
    user_id: input.ownerId,
    type: input.type,
    title: input.title,
    content: input.content,
    config: {
      source_document_ids: input.sourceDocumentIds || [],
      metadata: input.metadata || {},
    },
  };
}

export class ArtifactService {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateArtifactInput): Promise<Artifact> {
    const { data, error } = await this.supabase
      .from("notebook_assets")
      .insert(artifactToRow(input))
      .select()
      .single();
    if (error) throw new Error(`Failed to create artifact: ${error.message}`);
    return rowToArtifact(data);
  }

  // Insert a placeholder row (status 'generating') for background generation;
  // the orchestrator flips it to 'ready' when the model returns.
  async createPlaceholder(
    ownerId: string,
    type: ArtifactType,
    title: string,
    sourceDocumentIds: string[] = []
  ): Promise<Artifact> {
    const { data, error } = await this.supabase
      .from("notebook_assets")
      .insert({
        user_id: ownerId,
        type,
        title,
        status: "generating",
        config: { source_document_ids: sourceDocumentIds, metadata: {} },
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create artifact placeholder: ${error.message}`);
    return rowToArtifact(data);
  }

  async markReady(id: string, title: string, content: any): Promise<void> {
    const { error } = await this.supabase
      .from("notebook_assets")
      .update({ status: "ready", title, content, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Failed to mark artifact ready: ${error.message}`);
  }

  async markFailed(id: string, message: string): Promise<void> {
    const { error } = await this.supabase
      .from("notebook_assets")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Failed to mark artifact failed: ${error.message}`);
  }

  async getById(artifactId: string, ownerId: string): Promise<Artifact | null> {
    const { data, error } = await this.supabase
      .from("notebook_assets")
      .select("*")
      .eq("id", artifactId)
      .eq("user_id", ownerId)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch artifact: ${error.message}`);
    return data ? rowToArtifact(data) : null;
  }

  async list(ownerId: string, filters?: { type?: ArtifactType; status?: ArtifactStatus }): Promise<Artifact[]> {
    let query = this.supabase
      .from("notebook_assets")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });
    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list artifacts: ${error.message}`);
    return (data || []).map(rowToArtifact);
  }

  async update(artifactId: string, ownerId: string, updates: UpdateArtifactInput): Promise<Artifact | null> {
    const patch: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.state !== undefined) patch.state = updates.state;

    // config is a JSONB object — merge rather than replace so callers can update
    // source_document_ids or metadata independently without clobbering the other.
    const wantsConfigUpdate =
      updates.sourceDocumentIds !== undefined || updates.metadata !== undefined;
    if (wantsConfigUpdate) {
      const existingConfig = await this.getConfig(artifactId, ownerId);
      patch.config = {
        source_document_ids:
          updates.sourceDocumentIds !== undefined
            ? updates.sourceDocumentIds
            : existingConfig.source_document_ids || [],
        metadata:
          updates.metadata !== undefined
            ? updates.metadata
            : existingConfig.metadata || {},
      };
    }

    const { data, error } = await this.supabase
      .from("notebook_assets")
      .update(patch)
      .eq("id", artifactId)
      .eq("user_id", ownerId)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Failed to update artifact: ${error.message}`);
    return data ? rowToArtifact(data) : null;
  }

  // Read just the config sub-object for an artifact (used by update merging and
  // any caller that needs source_document_ids / metadata without the full row).
  async getConfig(artifactId: string, ownerId: string): Promise<{ source_document_ids: string[]; metadata: Record<string, any> }> {
    const { data, error } = await this.supabase
      .from("notebook_assets")
      .select("config")
      .eq("id", artifactId)
      .eq("user_id", ownerId)
      .maybeSingle();
    if (error) throw new Error(`Failed to read artifact config: ${error.message}`);
    const config = (data?.config || {}) as { source_document_ids?: string[]; metadata?: Record<string, any> };
    return { source_document_ids: config.source_document_ids || [], metadata: config.metadata || {} };
  }

  async delete(artifactId: string, ownerId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from("notebook_assets")
      .delete()
      .eq("id", artifactId)
      .eq("user_id", ownerId);
    if (error) throw new Error(`Failed to delete artifact: ${error.message}`);
    return (count ?? 0) > 0;
  }
}

import { SupabaseClient } from "@supabase/supabase-js";

export interface NotebookContext {
  notebook: {
    id: string;
    title: string;
    description: string;
    course_code: string;
  };
  documents: {
    id: string;
    file_name: string;
    ai_summary: string;
  }[];
  artifacts: {
    id: string;
    type: string;
    title: string;
    status: string;
  }[];
  total_sources: number;
}

export async function buildNotebookContext(
  supabase: SupabaseClient,
  notebookId: string,
  ownerId: string
): Promise<NotebookContext | null> {
  // 1. Fetch Notebook (check ownership OR if it is shared with the user)
  const { data: notebook, error: notebookError } = await supabase
    .from("notebooks")
    .select("id, title, description, course_code, user_id")
    .eq("id", notebookId)
    .single();

  if (notebookError || !notebook) {
    console.error("Failed to fetch notebook context:", notebookError);
    return null;
  }

  // Check if owner
  let hasAccess = notebook.user_id === ownerId;

  // If not owner, check shared resources
  if (!hasAccess) {
    const { data: shared } = await supabase
      .from("shared_resources")
      .select("permission")
      .eq("resource_type", "notebook")
      .eq("resource_id", notebookId)
      .eq("shared_with_user_id", ownerId)
      .single();
    
    if (shared) {
      hasAccess = true;
    }
  }

  // If still no access, check if it's a classroom notebook they belong to
  if (!hasAccess) {
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("id")
      .eq("notebook_id", notebookId)
      .single();
    
    if (classroom) {
      const { data: member } = await supabase
        .from("classroom_members")
        .select("id")
        .eq("classroom_id", classroom.id)
        .eq("user_id", ownerId)
        .single();
      
      if (member) hasAccess = true;
    }
  }

  if (!hasAccess) return null;

  // 2. Fetch linked Documents
  const { data: linkedDocs, error: docsError } = await supabase
    .from("notebook_documents")
    .select("document_id, vault_documents(id, file_name, ai_summary)")
    .eq("notebook_id", notebookId);

  let documents: NotebookContext["documents"] = [];
  if (!docsError && linkedDocs) {
    documents = linkedDocs
      .map((row: any) => row.vault_documents)
      .filter(Boolean)
      .map((doc: any) => ({
        id: doc.id,
        file_name: doc.file_name,
        ai_summary: doc.ai_summary,
      }));
  }

  // 3. Fetch linked Artifacts
  const { data: linkedArtifacts, error: artifactsError } = await supabase
    .from("notebook_artifacts")
    .select("artifact_id, notebook_assets(id, type, title, status)")
    .eq("notebook_id", notebookId);

  let artifacts: NotebookContext["artifacts"] = [];
  if (!artifactsError && linkedArtifacts) {
    artifacts = linkedArtifacts
      .map((row: any) => row.notebook_assets)
      .filter(Boolean)
      .map((asset: any) => ({
        id: asset.id,
        type: asset.type,
        title: asset.title,
        status: asset.status,
      }));
  }

  return {
    notebook: {
      id: notebook.id,
      title: notebook.title,
      description: notebook.description || "",
      course_code: notebook.course_code || "",
    },
    documents,
    artifacts,
    total_sources: documents.length + artifacts.length,
  };
}

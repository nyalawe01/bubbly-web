import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Brain, BookOpen, Layers, Edit, Trash, Plus } from "lucide-react";
import { StrengthenTopicButton } from "@/components/ui/StrengthenTopicButton";

export default async function NotebookPage({ params }: { params: { id: string } }) {
  const { supabase, getUser } = await createSupabaseServerClient();
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Notebook
  const { data: notebook, error: notebookError } = await supabase
    .from("notebooks")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (notebookError || !notebook) {
    notFound();
  }

  // 2. Fetch linked Documents
  const { data: linkedDocs } = await supabase
    .from("notebook_documents")
    .select("document_id, added_at, vault_documents(*)")
    .eq("notebook_id", params.id)
    .order("added_at", { ascending: false });

  // 3. Fetch linked Artifacts
  const { data: linkedArtifacts } = await supabase
    .from("notebook_artifacts")
    .select("artifact_id, added_at, notebook_assets(*)")
    .eq("notebook_id", params.id)
    .order("added_at", { ascending: false });
  // 4. Fetch student performance
  const { data: performances } = await supabase
    .from("student_performance")
    .select("*")
    .eq("notebook_id", params.id)
    .order("mastery_level", { ascending: false });

  const documents = linkedDocs?.map((row) => row.vault_documents) || [];
  const artifacts = linkedArtifacts?.map((row) => row.notebook_assets) || [];

  const quizzes = artifacts.filter(a => a.type === 'quiz');
  const flashcards = artifacts.filter(a => a.type === 'flashcards');
  const summaries = artifacts.filter(a => a.type === 'summary');
  const others = artifacts.filter(a => !['quiz', 'flashcards', 'summary'].includes(a.type));

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9F9FA] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <header className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: notebook.color_hex || '#6C47FF' }}
              />
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {notebook.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {notebook.course_code && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {notebook.course_code}
                </span>
              )}
              {notebook.term && <span>{notebook.term}</span>}
              {notebook.instructor && <span>• Prof: {notebook.instructor}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all">
              Add Content
            </button>
            <Link
              href={`/chat?notebook_id=${notebook.id}`}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
            >
              <Brain className="w-4 h-4" />
              Study This Notebook
            </Link>
          </div>
        </header>

        {/* Summary Card */}
        {notebook.description && (
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Overview</h3>
            <p className="text-gray-600 leading-relaxed">{notebook.description}</p>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-4 py-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
            <Plus className="w-4 h-4" /> Generate Study Guide
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
            <Plus className="w-4 h-4" /> Create Flashcards
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
            <Plus className="w-4 h-4" /> Take a Quiz
          </button>
        </div>

        {/* Your Progress Section */}
        {performances && performances.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-gray-400" /> Your Progress
              </h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
              {performances.map((perf: any) => {
                const pct = Math.round(perf.mastery_level * 100);
                return (
                  <div key={perf.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-800">{perf.topic}</span>
                      <span className="text-gray-500">{pct}% Mastery</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${pct < 50 ? 'bg-amber-500' : pct < 80 ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    {pct < 50 && (
                      <StrengthenTopicButton notebookId={params.id} topic={perf.topic} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Documents Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-400" /> Documents
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{documents.length}</span>
            </h2>
          </div>
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{doc.file_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                  {doc.ai_summary && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{doc.ai_summary}</p>
                  )}
                  <button className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all" title="Remove from Notebook">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 border border-gray-200 border-dashed rounded-xl">
              <p className="text-gray-500">No documents linked to this notebook yet.</p>
            </div>
          )}
        </section>

        {/* Artifacts Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-gray-400" /> Study Artifacts
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{artifacts.length}</span>
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Quizzes */}
            {quizzes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Quizzes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quizzes.map((q: any) => (
                    <Link href={`/artifacts/quiz/${q.id}/take`} key={q.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 shadow-sm transition-all cursor-pointer block">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{q.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{new Date(q.created_at).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Flashcards */}
            {flashcards.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Flashcards</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {flashcards.map((f: any) => (
                    <Link href={`/artifacts/flashcards/${f.id}/practice`} key={f.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 shadow-sm transition-all cursor-pointer block">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{f.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Summaries */}
            {summaries.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Summaries</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {summaries.map((s: any) => (
                    <div key={s.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 shadow-sm transition-all cursor-pointer">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{s.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Others */}
            {others.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Other Artifacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {others.map((o: any) => (
                    <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 shadow-sm transition-all cursor-pointer">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{o.title}</h4>
                      <div className="inline-block px-2 py-0.5 mt-2 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full uppercase tracking-wider">
                        {o.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {artifacts.length === 0 && (
              <div className="p-8 text-center bg-gray-50 border border-gray-200 border-dashed rounded-xl">
                <p className="text-gray-500">No study artifacts have been generated for this notebook yet.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

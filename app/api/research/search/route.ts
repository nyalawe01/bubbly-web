import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { query, scope, notebook_id } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = [];

    // 1. Vault Search
    if (scope === "vault" || scope === "both") {
      // In a full implementation we'd do a pgvector similarity search here.
      // For now, we do an ilike search on document titles and summaries.
      let dbQuery = supabase
        .from("vault_documents")
        .select("id, file_name, ai_summary")
        .eq("owner_id", user.id)
        .or(`file_name.ilike.%${query}%,ai_summary.ilike.%${query}%`)
        .limit(5);

      const { data: docs, error: vaultErr } = await dbQuery;
      
      if (!vaultErr && docs) {
        docs.forEach((d) => {
          results.push({
            id: d.id,
            source: "vault",
            title: d.file_name,
            snippet: d.ai_summary || "No summary available.",
            url: `/vault`,
            relevance: 0.95
          });
        });
      }
    }

    // 2. Web Search
    if (scope === "web" || scope === "both") {
      // Mock web search since we don't have a configured web search API key (Exa/Tavily)
      const mockWebResults = [
        {
          id: `web-${Date.now()}-1`,
          source: "web",
          title: `Research insights for: ${query}`,
          snippet: `This is a simulated web search result for "${query}". In production, this would be fetched from Exa or Tavily API.`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
          relevance: 0.85
        },
        {
          id: `web-${Date.now()}-2`,
          source: "web",
          title: `Academic overview of ${query}`,
          snippet: `A comprehensive academic overview and explanation of ${query}, including key properties and definitions.`,
          url: `https://scholar.example.com/search?q=${encodeURIComponent(query)}`,
          relevance: 0.80
        }
      ];
      results.push(...mockWebResults);
    }

    // 3. Save Research Session
    await supabase.from("research_sessions").insert({
      user_id: user.id,
      notebook_id: notebook_id || null,
      query,
      results_json: results
    });

    // 4. Return ranked results (mock rank by relevance)
    results.sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Research search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

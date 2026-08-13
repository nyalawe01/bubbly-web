import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exportArtifactToMarkdown } from "@/lib/export/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const format = searchParams.get("format") || "markdown";

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: asset, error } = await supabase
      .from("notebook_assets")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (error || !asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    // For now, we only support markdown natively. In production, we'd use PDF/DOCX generators.
    const markdownContent = await exportArtifactToMarkdown(asset);

    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${asset.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md"`,
      },
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

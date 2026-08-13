// app/api/test/artifacts/route.ts
//
// Test-only endpoint (Phase 2, Step 3.4). Returns the raw notebook_assets rows
// for the calling user so the artifact-uniformity spec can assert that every
// generator wrote through the unified store with an identical shape. Enabled in
// any non-production environment (dev/CI); hard-disabled in production so it can
// never be called on a live deployment.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled" }, { status: 404 });
  }

  try {
    const { supabase, getUser } = await createSupabaseServerClient(new Request("http://localhost"));
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("notebook_assets")
      .select("id, user_id, type, title, content, config, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ artifacts: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}

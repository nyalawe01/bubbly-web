// app/api/account/export/route.ts
//
// Account-level data export ("Export data" in Settings). Uses the same auth
// pattern as app/api/account/delete/route.ts, but deliberately does NOT use the
// service-role/admin client that route needs — every table here is read through
// the caller's own RLS-scoped session client, so a bug here can only ever return
// the signed-in user's own rows, never anyone else's.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const USER_SCOPED_TABLES = [
  "chat_sessions",
  "quiz_history",
  "flashcard_history",
  "slide_history",
  "summary_history",
  "exam_history",
  "vault_documents",
] as const;

export async function GET(request: Request) {
  try {
    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await Promise.all(
      USER_SCOPED_TABLES.map((table) => supabase.from(table).select("*").eq("user_id", user.id))
    );

    const payload: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, user_metadata: user.user_metadata },
    };
    USER_SCOPED_TABLES.forEach((table, i) => {
      const { data, error } = results[i];
      if (error) console.warn(`[account/export] ${table} query failed:`, error.message);
      payload[table] = data || [];
    });

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bubbly-data-export-${user.id}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Account Export Error:", error);
    return NextResponse.json({ error: error.message || "Failed to export data" }, { status: 500 });
  }
}

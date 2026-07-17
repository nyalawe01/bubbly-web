// app/api/account/delete/route.ts
//
// Account deletion requires the Supabase service role key (auth.admin.* is not
// callable with the anon key — it was previously being called client-side from
// app/chat/page.tsx, which cannot work and would be a serious privilege-escalation
// risk if it ever did, since admin.deleteUser takes an arbitrary user id). This
// route derives the id to delete strictly from the caller's own verified session
// — never from the request body — so one user can never delete another's account.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Clean up owned data first — in case FK constraints aren't set to cascade.
    await adminClient.from("vault_embeddings").delete().eq("user_id", user.id);
    await adminClient.from("vault_documents").delete().eq("user_id", user.id);
    await adminClient.from("quiz_history").delete().eq("user_id", user.id);
    await adminClient.from("flashcard_history").delete().eq("user_id", user.id);
    await adminClient.from("slide_history").delete().eq("user_id", user.id);
    await adminClient.from("summary_history").delete().eq("user_id", user.id);
    await adminClient.from("exam_history").delete().eq("user_id", user.id);
    await adminClient.from("study_sessions").delete().eq("user_id", user.id);
    await adminClient.from("user_preferences").delete().eq("user_id", user.id);

    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Account Deletion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete account", success: false }, { status: 500 });
  }
}

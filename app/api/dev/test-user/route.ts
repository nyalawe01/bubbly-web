// app/api/dev/test-user/route.ts
//
// E2E test helper (Phase 1.4). Creates an ephemeral account for the Playwright
// suite WITHOUT going through the real signup flow (which would require email
// confirmation + a mail provider). Gated behind TEST_USER_SECRET so it can never be
// used on a real deployment without the secret configured in CI.
//
// The endpoint mints a user with email_confirm=true (skipping the confirmation
// step) and DELETE-then-RECREATE it each call so test runs are idempotent. It
// returns { email, password } which the test uses to sign in through the real
// /login page — exercising the full auth UI and leaving a real session cookie.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// No hardcoded default: the endpoint stays shut unless TEST_USER_SECRET is
// explicitly configured (env var locally, GitHub secret in CI). Fail closed.
const SECRET = process.env.TEST_USER_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (
      !SECRET ||
      body.secret !== SECRET ||
      (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_ROUTES)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const email = `bub-playwright-${Date.now()}@bubly.test`;
    const password = "Bubbly!Playwright1";

    // Idempotent reset: if a user with this email somehow exists, remove it first.
    await admin.auth.admin.deleteUser(email).catch(() => {});

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { full_name: "Bubbly Playwright" },
    });
    if (error || !data?.user) {
      console.error("test-user creation failed:", error);
      return NextResponse.json({ error: error?.message || "create failed" }, { status: 500 });
    }

    return NextResponse.json({ email, password, userId: data.user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

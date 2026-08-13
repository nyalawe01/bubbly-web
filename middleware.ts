// middleware.ts
//
// Required by @supabase/ssr: refreshes the Supabase session cookie on every
// request. Without this, the browser's auth cookie goes stale once the access
// token expires (~1hr default) — server-side API routes (lib/supabase/server.ts's
// cookie path) then see getUser() return null even though the user is still
// "logged in" client-side, since only an actual Supabase SDK call triggers a
// refresh, and a plain fetch() to an API route never makes one. This surfaced as
// every generator (quiz/flashcards/summary/slides/exam) failing with
// "Unauthorized" once a session aged past its token lifetime.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Middleware: Supabase env vars missing, skipping session refresh.");
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // The actual call that triggers a silent token refresh + rewritten cookies
  // when the access token is expired but the refresh token is still valid.
  try {
    await supabase.auth.getUser();
  } catch (e) {
    // If Supabase is unreachable or the refresh fails, let the request proceed
    // rather than crashing the entire middleware pipeline. The downstream route
    // will handle the unauthenticated state normally.
    console.warn("Middleware: session refresh failed, proceeding without refresh:", (e as Error)?.message);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimization files —
    // must include API routes, since that's exactly where the stale-cookie
    // failures were happening. Static assets (.css/.js/.woff2/.ico/.pdf) skip
    // the getUser() refresh: they can't hold an auth session worth refreshing,
    // and excluding them keeps cold static loads from paying a JWT decode.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|woff2|ico|pdf|svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};

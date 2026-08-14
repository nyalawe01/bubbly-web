// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  if (code) {
    // Await the cookie store promise to satisfy Next.js guidelines
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      // If the user signed in with Google, save their provider_token (access token) to user_plugins
      if (session.provider_token) {
        await supabase.from("user_plugins").upsert({
          user_id: session.user.id,
          plugin_id: "google_drive",
          enabled: true,
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token,
          settings: {}
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("OAuth code exchange failed:", error?.message, error);
  }

  // Redirect back to the login screen on authentication error loops
  return NextResponse.redirect(`${origin}/login?error=Auth_failed`);
}
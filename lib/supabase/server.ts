// lib/supabase/server.ts
//
// Single factory for API routes: web calls carry a Supabase session cookie,
// mobile calls carry an `Authorization: Bearer <access_token>` header instead
// (React Native has no cookie jar shared with the browser). Every route should
// go through this instead of hand-rolling its own cookie plumbing.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient(request?: Request): Promise<{
  supabase: SupabaseClient;
  getUser: () => Promise<User | null>;
}> {
  const bearerToken = request?.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];

  if (bearerToken) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });
    return {
      supabase,
      getUser: async () => (await supabase.auth.getUser(bearerToken)).data.user,
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  });

  return {
    supabase,
    getUser: async () => (await supabase.auth.getUser()).data.user,
  };
}

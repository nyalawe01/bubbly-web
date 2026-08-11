// lib/supabase/admin.ts
//
// SERVICE-ROLE client — server-only. The anon-key server client (lib/supabase/server.ts)
// cannot create users or mint sessions for test users; that requires the project's
// service_role key. Importing this file anywhere client-side would leak the key, so
// it is deliberately kept out of the client bundle and only consumed by API routes
// that need administrative actions (today: the E2E test-user fixture endpoint).
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceRole) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRole);
}

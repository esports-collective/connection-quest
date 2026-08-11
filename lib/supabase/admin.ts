import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER ONLY. Bypasses RLS and can create auth
 * users. Never import this into a client component. Returns null if the
 * SUPABASE_SERVICE_ROLE_KEY env var isn't configured.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    // Quests tables live in the `quests` schema of the shared staff-app project.
    db: { schema: "quests" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

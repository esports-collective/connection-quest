import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // The Quests tables live in the `quests` schema of the shared staff-app
    // Supabase project. Auth still uses the auth schema regardless.
    { db: { schema: "quests" } },
  );
}

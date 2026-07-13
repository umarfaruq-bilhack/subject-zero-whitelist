import { createClient } from "@supabase/supabase-js";

// Public client - safe for browser use, RLS should restrict writes to inserts only.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client with the service role key - never import this in a
// client component. Used by API routes for reads that bypass RLS (admin panel).
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

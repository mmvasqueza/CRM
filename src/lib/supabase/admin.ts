import "server-only";
import { createClient } from "@supabase/supabase-js";
import { parseServerEnv } from "@/lib/env";

// Admin client: the secret key BYPASSES row-level security. Server-only by construction (the
// import above breaks any build that pulls this file into browser code — constitution P15).
// Use it only where the plan says "service role": intake, alert dispatch, member invites.
export function createAdminSupabase() {
  const { supabaseUrl, supabaseSecretKey } = parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

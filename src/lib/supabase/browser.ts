import { createBrowserClient } from "@supabase/ssr";
import { readPublicEnv } from "@/lib/env";

// Supabase client for Client Components: publishable key only, the signed-in user's own session.
export function createBrowserSupabase() {
  const { supabaseUrl, supabasePublishableKey } = readPublicEnv();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}

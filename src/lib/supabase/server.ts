import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readPublicEnv } from "@/lib/env";

// Supabase client for Server Components, Server Actions and Route Handlers. It acts AS the
// signed-in user (publishable key + session cookies), so row-level security applies.
export async function createServerSupabase() {
  const { supabaseUrl, supabasePublishableKey } = readPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The session refresh is written by the
          // proxy (T017) on the same request instead, so skipping it here loses nothing.
        }
      },
    },
  });
}

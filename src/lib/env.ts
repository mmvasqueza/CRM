import { z } from "zod";

// Environment variables are checked once, at the boundary (constitution P9). A bad setting fails
// fast with the variable's NAME only: values can be secrets, so they never reach an error message.

type Source = Readonly<Record<string, string | undefined>>;

// Each key must carry its own Supabase prefix. An allow-list, not a deny-list: a legacy JWT key
// (possibly the RLS-bypassing service_role) can never pass as the browser key (decision 2026-11-25).
const PUBLISHABLE_PREFIX = "sb_publishable_";
const SECRET_PREFIX = "sb_secret_";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith(PUBLISHABLE_PREFIX),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().startsWith(SECRET_PREFIX),
});

export interface PublicEnv {
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
}

export interface ServerEnv extends PublicEnv {
  readonly supabaseSecretKey: string;
}

function invalidEnvError(issues: readonly z.core.$ZodIssue[]): Error {
  const names = [...new Set(issues.map((issue) => String(issue.path[0])))];
  return new Error(`Invalid environment variable(s): ${names.join(", ")}`);
}

function parse<T extends z.ZodType>(schema: T, source: Source): z.infer<T> {
  // Surrounding spaces are dropped, and an empty value counts as missing (`KEY=` in a .env file).
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([name, value]) => [
      name,
      value?.trim() || undefined,
    ]),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) throw invalidEnvError(result.error.issues);
  return result.data;
}

export function parsePublicEnv(source: Source): PublicEnv {
  const env = parse(publicSchema, source);
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function parseServerEnv(source: Source): ServerEnv {
  const env = parse(serverSchema, source);
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
  };
}

// Next.js copies NEXT_PUBLIC_* values into browser code only where they are written out in full,
// so each variable is named literally here (never read through a loop or a variable name).
export function readPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

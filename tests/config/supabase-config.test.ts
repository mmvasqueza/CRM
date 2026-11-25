// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// T003 — local Supabase auth settings that AC9 (no sign-up) and AC28 (24 h invitations) rely on.
// Supabase CLI 3.x writes `supabase/config.jsonc` (JSON with comments and trailing commas);
// TypeScript's config parser reads that dialect, so no extra dependency is needed.
const CONFIG_PATH = resolve(process.cwd(), "supabase/config.jsonc");

interface SupabaseConfig {
  auth: {
    enable_signup: boolean;
    enable_anonymous_sign_ins: boolean;
    email: { enabled: boolean; otp_expiry: number };
  };
  local_smtp: { enabled: boolean };
}

function loadConfig(): SupabaseConfig {
  const parsed = ts.parseConfigFileTextToJson(
    CONFIG_PATH,
    readFileSync(CONFIG_PATH, "utf8"),
  );
  if (parsed.error) {
    throw new Error(
      `supabase/config.jsonc does not parse: ${String(parsed.error.messageText)}`,
    );
  }
  return parsed.config as SupabaseConfig;
}

describe("supabase/config.jsonc", () => {
  const config = loadConfig();

  it("disables self-service sign-up, so only invited people get in (AC9)", () => {
    expect(config.auth.enable_signup).toBe(false);
    expect(config.auth.enable_anonymous_sign_ins).toBe(false);
  });

  it("keeps email sign-in on, so invitations and sign-in links can be sent", () => {
    expect(config.auth.email.enabled).toBe(true);
  });

  it("expires invitation and sign-in links after 24 hours (AC28)", () => {
    expect(config.auth.email.otp_expiry).toBe(86_400);
  });

  it("keeps the local mail catcher on so invitation emails can be tested", () => {
    expect(config.local_smtp.enabled).toBe(true);
  });

  it("has no legacy config.toml beside it that could be read instead", () => {
    expect(existsSync(resolve(process.cwd(), "supabase/config.toml"))).toBe(
      false,
    );
  });
});

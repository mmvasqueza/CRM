// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "./env";

// T004 — environment variables are checked once, at the boundary (constitution P9, P15).
const PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-value",
};
const SERVER = { ...PUBLIC, SUPABASE_SECRET_KEY: "sb_secret_test-value" };

// The shape of Supabase's legacy keys (a JWT), built here instead of written out so secret
// scanners do not mistake a test value for a real key. It carries no claims and no signature.
const b64 = (text: string) => Buffer.from(text).toString("base64url");
const jwtHead = b64(JSON.stringify({ alg: "HS256" }));
const fakeJwt = `${jwtHead}.${b64("{}")}.x`;

describe("parsePublicEnv", () => {
  it("returns the browser-safe Supabase settings when they are valid", () => {
    expect(parsePublicEnv(PUBLIC)).toEqual({
      supabaseUrl: "http://127.0.0.1:54321",
      supabasePublishableKey: "sb_publishable_test-value",
    });
  });

  it("throws naming the variable when one is missing", () => {
    expect(() =>
      parsePublicEnv({ ...PUBLIC, NEXT_PUBLIC_SUPABASE_URL: undefined }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws naming the variable when the URL is not a URL", () => {
    expect(() =>
      parsePublicEnv({ ...PUBLIC, NEXT_PUBLIC_SUPABASE_URL: "not a url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws naming the variable when the key is empty", () => {
    expect(() =>
      parsePublicEnv({ ...PUBLIC, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("refuses a secret key placed in a browser variable", () => {
    expect(() =>
      parsePublicEnv({
        ...PUBLIC,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_leaked",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("refuses a legacy JWT key (it may be the RLS-bypassing service_role)", () => {
    expect(() =>
      parsePublicEnv({
        ...PUBLIC,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fakeJwt,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it.each(["localhost:54321", "javascript:alert(1)", "ftp://example.com"])(
    "refuses a URL that is not http(s): %s",
    (url) => {
      expect(() =>
        parsePublicEnv({ ...PUBLIC, NEXT_PUBLIC_SUPABASE_URL: url }),
      ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    },
  );

  it("treats a value of only spaces as missing", () => {
    expect(() =>
      parsePublicEnv({
        ...PUBLIC,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "   ",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("drops stray spaces and line breaks around a valid value", () => {
    expect(
      parsePublicEnv({
        ...PUBLIC,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_test-value\r\n",
      }).supabasePublishableKey,
    ).toBe("sb_publishable_test-value");
  });

  it("lists every invalid variable, not only the first", () => {
    expect(() => parsePublicEnv({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });
});

describe("parseServerEnv", () => {
  it("adds the secret key to the public settings", () => {
    expect(parseServerEnv(SERVER)).toEqual({
      supabaseUrl: "http://127.0.0.1:54321",
      supabasePublishableKey: "sb_publishable_test-value",
      supabaseSecretKey: "sb_secret_test-value",
    });
  });

  it("throws naming the variable when the secret key is missing", () => {
    expect(() =>
      parseServerEnv({ ...SERVER, SUPABASE_SECRET_KEY: undefined }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("refuses a publishable key where the secret key belongs", () => {
    expect(() =>
      parseServerEnv({ ...SERVER, SUPABASE_SECRET_KEY: "sb_publishable_x" }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("refuses a secret key that is not a Supabase secret key", () => {
    expect(() =>
      parseServerEnv({
        ...SERVER,
        SUPABASE_SECRET_KEY: jwtHead,
      }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("never echoes a value in the error message", () => {
    const leaked = "sb_publishable_should-not-appear";
    let message = "";
    try {
      parseServerEnv({ ...SERVER, SUPABASE_SECRET_KEY: leaked });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("SUPABASE_SECRET_KEY");
    expect(message).not.toContain(leaked);
  });
});

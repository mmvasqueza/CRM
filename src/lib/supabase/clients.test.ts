// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// T004 — the three Supabase clients read only checked settings, and only the admin client
// gets the secret key. The libraries are replaced by spies: what is under test is our wiring.
// Typed like the real factories (url, key, options) so the recorded calls can be inspected.
type Factory = (url: string, key: string, options?: unknown) => object;
const ssr = vi.hoisted(() => ({
  createBrowserClient: vi.fn<Factory>(() => ({ kind: "browser" })),
  createServerClient: vi.fn<Factory>(() => ({ kind: "server" })),
}));
const supabaseJs = vi.hoisted(() => ({
  createClient: vi.fn<Factory>(() => ({ kind: "admin" })),
}));
const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [{ name: "sb", value: "session" }]),
  set: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ssr);
vi.mock("@supabase/supabase-js", () => supabaseJs);
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("server-only", () => ({}));

const URL_ = "http://127.0.0.1:54321";
const PUBLISHABLE = "sb_publishable_test-value";
const SECRET = "sb_secret_test-value";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", PUBLISHABLE);
  vi.stubEnv("SUPABASE_SECRET_KEY", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("createBrowserSupabase", () => {
  it("uses the URL and the publishable key, never the secret", async () => {
    const { createBrowserSupabase } = await import("./browser");

    createBrowserSupabase();

    expect(ssr.createBrowserClient).toHaveBeenCalledWith(URL_, PUBLISHABLE);
    expect(JSON.stringify(ssr.createBrowserClient.mock.calls)).not.toContain(
      SECRET,
    );
  });

  it("throws naming the variable when the browser settings are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { createBrowserSupabase } = await import("./browser");

    expect(() => createBrowserSupabase()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(ssr.createBrowserClient).not.toHaveBeenCalled();
  });
});

describe("createServerSupabase", () => {
  it("uses the publishable key and the request cookies (the user's own session)", async () => {
    const { createServerSupabase } = await import("./server");

    await createServerSupabase();

    expect(ssr.createServerClient).toHaveBeenCalledTimes(1);
    const [url, key, options] = ssr.createServerClient.mock.calls[0] as [
      string,
      string,
      { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } },
    ];
    expect(url).toBe(URL_);
    expect(key).toBe(PUBLISHABLE);
    expect(options.cookies.getAll()).toEqual([
      { name: "sb", value: "session" },
    ]);
  });

  it("writes refreshed session cookies back to the response", async () => {
    const { createServerSupabase } = await import("./server");
    await createServerSupabase();
    const options = ssr.createServerClient.mock.calls[0]?.[2] as {
      cookies: { setAll: (c: unknown[]) => void };
    };

    options.cookies.setAll([
      { name: "sb", value: "fresh", options: { httpOnly: true } },
    ]);

    expect(cookieStore.set).toHaveBeenCalledWith("sb", "fresh", {
      httpOnly: true,
    });
  });

  it("does not fail a page render when cookies cannot be written there", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    const { createServerSupabase } = await import("./server");
    await createServerSupabase();
    const options = ssr.createServerClient.mock.calls[0]?.[2] as {
      cookies: { setAll: (c: unknown[]) => void };
    };

    expect(() =>
      options.cookies.setAll([{ name: "sb", value: "fresh", options: {} }]),
    ).not.toThrow();
  });
});

describe("createAdminSupabase", () => {
  it("uses the secret key and keeps no session of its own", async () => {
    const { createAdminSupabase } = await import("./admin");

    createAdminSupabase();

    expect(supabaseJs.createClient).toHaveBeenCalledWith(URL_, SECRET, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  });

  it("throws naming the variable when the secret key is missing", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const { createAdminSupabase } = await import("./admin");

    expect(() => createAdminSupabase()).toThrow(/SUPABASE_SECRET_KEY/);
    expect(supabaseJs.createClient).not.toHaveBeenCalled();
  });
});

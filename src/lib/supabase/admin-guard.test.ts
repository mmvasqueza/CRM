// @vitest-environment node
import { describe, expect, it } from "vitest";

// T004 — the admin client carries the secret key and the user client reads session cookies, so
// neither may ever be bundled into browser code: both import `server-only`, which throws when
// loaded outside the server build. No mock here — the real package is under test.
describe.each(["./admin", "./server"])("Supabase client %s", (path) => {
  it("refuses to load outside the server", async () => {
    await expect(import(path)).rejects.toThrow(/Client Component/);
  });
});

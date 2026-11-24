import { defineConfig, devices } from "@playwright/test";

// End-to-end tests (constitution P8). CI runs `pnpm test:e2e` on Linux after `supabase start`;
// there the app is served from a production build, locally from the dev server.
const PORT = 3000;
// `localhost`, not 127.0.0.1: the Next dev server treats the IP as a cross-origin host.
const baseURL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: isCI
      ? `pnpm build && pnpm start -p ${PORT}`
      : `pnpm dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});

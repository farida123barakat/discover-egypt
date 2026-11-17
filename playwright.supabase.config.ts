import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against a REAL Supabase (local stack from `npx supabase start`): sign-up with email
 * confirmation, password sign-in, reset, sign-out, private data and storage, admin roles, plus the
 * recorded demo tour. CI starts Supabase and passes its URL and keys (see .github/workflows/ci.yml).
 */
const PORT = 3200;
const need = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) throw new Error(`Start local Supabase first (npx supabase start) and set ${missing.join(", ")}.`);

const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

export default defineConfig({
  testDir: "e2e-supabase",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-supabase" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", launchOptions },
  projects: [
    { name: "real-backend", use: { ...devices["Desktop Chrome"], launchOptions }, testIgnore: /demo\.spec\.ts/ },
    // The demo tour runs last and is recorded: 1280×800 video, slowed down so people can follow it.
    {
      name: "demo",
      dependencies: ["real-backend"],
      testMatch: /demo\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, video: { mode: "on", size: { width: 1280, height: 800 } }, launchOptions: { ...launchOptions, slowMo: 180 } },
      retries: 0,
      timeout: 240_000,
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      DEMO_LOCAL_MODE: "false",
      CRON_SECRET: "local-cron-secret-for-tests",
    },
  },
});

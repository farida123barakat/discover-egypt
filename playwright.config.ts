import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build in local demo mode (no Supabase needed).
 * CHROME_PATH lets CI or sandboxes use an installed Chrome instead of downloading one.
 */
const PORT = 3200;
const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", launchOptions },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DEMO_LOCAL_MODE: "true",
      LOCAL_ADMIN_PASSWORD: "e2e-admin-password-123",
      SESSION_SECRET: "e2e-session-secret-that-is-long-enough-123456",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});

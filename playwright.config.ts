import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against one production build, served twice: in local demo mode (port 3200,
 * the admin and forms work against a local file) and front-end only (port 3400, no database at all,
 * which is how the site is normally deployed).
 * CHROME_PATH lets CI or sandboxes use an installed Chrome instead of downloading one.
 */
const PORT = 3200;
const FRONT_PORT = 3400;
// Fake camera flags let the hieroglyph scanner's camera flow be tested without real hardware.
const launchOptions = {
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", launchOptions },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions }, testIgnore: /(responsive|front-end-only)\.spec\.ts/ },
    {
      name: "front-end-only",
      use: { ...devices["Desktop Chrome"], launchOptions, baseURL: `http://localhost:${FRONT_PORT}` },
      testMatch: /front-end-only\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: [
    {
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
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
    },
    {
      command: `npm run start -- -p ${FRONT_PORT}`,
      url: `http://localhost:${FRONT_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        DEMO_LOCAL_MODE: "false",
        CONTACT_EMAIL: "hello@example.com",
        NEXT_PUBLIC_SITE_URL: `http://localhost:${FRONT_PORT}`,
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      },
    },
  ],
});

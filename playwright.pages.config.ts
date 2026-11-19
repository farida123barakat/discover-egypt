import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the GitHub Pages build (scripts/build-pages.sh → pages-out/). The files are served
 * by a plain static server under /discover-egypt/, the way GitHub Pages serves a project site.
 */
const PORT = 4100;
const BASE = process.env.BASE_PATH ?? "/discover-egypt";

export default defineConfig({
  testDir: "e2e-pages",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-pages" }]],
  use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${PORT}${BASE}/`, trace: "retain-on-failure" },
  webServer: {
    command: `rm -rf .pages-root && mkdir -p .pages-root${BASE.replace(/\/[^/]+$/, "")} && ln -s "$PWD/pages-out" .pages-root${BASE} && python3 -m http.server ${PORT} --directory .pages-root`,
    url: `http://localhost:${PORT}${BASE}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

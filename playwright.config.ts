import { defineConfig, devices, type ReporterDescription } from "@playwright/test";

/**
 * Phase 1.4 — End-to-end test harness.
 *
 * The gate that blocks deployment: `attachment-grounding.spec.ts` must pass in CI.
 *
 * Targets:
 *  - Web app (primary): http://localhost:3000 — login → chat → attach PDF → answer grounded in the file.
 *  - Mobile app (Expo) — wired up but optional locally; set MOBILE_APP_URL to point at
 *    an `expo start` tunnel / dev-client build.
 *
 * Run a single project:  npx playwright test --project=chromium
 * Run everything:        npx playwright test
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: (process.env.CI
    ? [["github", { ignoreVideo: true }], "list"]
    : [["list"], ["html", { open: "never" }]]) as ReporterDescription[],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  // A test-only fixture account. The test seeds its own user via the API so it never
  // needs real credentials — see tests/helpers.ts (createTestUser).
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // Local dev convenience: start the Next dev server if one isn't already up.
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        timeout: 120_000,
        reuseExistingServer: true,
      },
});

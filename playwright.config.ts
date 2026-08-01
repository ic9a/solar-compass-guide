import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile-320",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 320, height: 800 },
      },
    },
    {
      name: "mobile-360",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: "mobile-375",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "mobile-390",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "mobile-412",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 412, height: 915 },
      },
    },
    {
      name: "landscape",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "firefox-desktop",
      testMatch: /final-readiness\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "webkit-desktop",
      testMatch: /final-readiness\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});

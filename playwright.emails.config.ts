import { defineConfig } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/e2e/emails/setup.ts",
  timeout: 180_000,
  testDir: "./tests/e2e/emails",
  fullyParallel: false,
  workers: 1,
  use: { browserName: "chromium" },
});

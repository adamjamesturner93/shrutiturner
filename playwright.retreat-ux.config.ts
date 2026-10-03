import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e/retreat-ux",
  use: { browserName: "chromium" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});

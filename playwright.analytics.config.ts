import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e/analytics",
  timeout: 60000,
  use: { browserName: "chromium", baseURL: "http://localhost:3000" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});

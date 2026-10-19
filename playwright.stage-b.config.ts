import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/stage-b",
  timeout: 120_000,
  workers: 2,
  use: { baseURL: "http://localhost:3000", browserName: "chromium" },
  projects: [360, 390, 768, 1024, 1440].map((width) => ({
    name: `${width}px`,
    use: { viewport: { width, height: 900 } },
  })),
});

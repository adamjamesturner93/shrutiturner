import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Render locally; never contact the email provider or load tracking/remote images.
for (const width of [390, 800]) {
  test(`email templates remain readable at ${width}px @a11y`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://**/*", async (route) => {
      if (route.request().url().endsWith("logo-white-horizontal-email.png")) {
        await route.fulfill({
          path: "public/logos/logo-white-horizontal-email.png",
          contentType: "image/png",
        });
      } else {
        await route.abort();
      }
    });
    const previewDir = process.env.EMAIL_PREVIEW_DIR!;
    for (const file of readdirSync(previewDir).filter((file) => file.endsWith(".html"))) {
      const name = file.replace(/\.html$/, "");
      await test.step(name, async () => {
        await page.setContent(readFileSync(path.join(previewDir, file), "utf8"));
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        );
        expect.soft(overflow, `${name} overflows at ${width}px`).toBe(false);
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect
          .soft(
            result.violations.map((violation) => ({
              id: violation.id,
              nodes: violation.nodes.map((node) => ({
                target: node.target,
                summary: node.failureSummary,
              })),
            })),
            `${name} accessibility`
          )
          .toEqual([]);
        if (
          ["retreat-registration", "programme-update", "newsletter", "retreat-booking"].includes(
            name
          )
        ) {
          await page.screenshot({
            path: test.info().outputPath(`${name}-${width}.png`),
            fullPage: true,
          });
        }
      });
    }
  });
}

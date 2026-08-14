import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("legal pages use semantic headings, a direct breadcrumb and the utility footer", async ({
  page,
}) => {
  await page.goto("/terms");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(16);
  await expect(page.getByRole("link", { name: "Legal", exact: true })).toHaveCount(0);
  await expect(page.locator("footer input[type='email']")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*follow/i
  );

  const results = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("coaching agreement shares the legal structure and stays out of search", async ({ page }) => {
  await page.goto("/coaching-agreement");

  await expect(page.locator("h1")).toHaveText("Coaching Agreement");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Legal", exact: true })).toHaveCount(0);
  await expect(page.locator("footer input[type='email']")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*follow/i
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://shrutiturner.co.uk/coaching-agreement"
  );
});

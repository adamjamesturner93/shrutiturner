import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("reader can recover from a failed reaction without a false success", async ({ page }) => {
  await page.route("**/api/blog/*/engagement", (route) =>
    route.fulfill({ json: { comments: [], reactionCount: 0, hasReacted: false } })
  );
  let attempt = 0;
  await page.route("**/api/blog/*/reactions/toggle", (route) => {
    attempt += 1;
    return route.fulfill({
      status: attempt === 1 ? 503 : 200,
      json: attempt === 1 ? {} : { hasReacted: true, reactionCount: 1 },
    });
  });
  await page.addInitScript(() => window.sessionStorage.setItem("newsletter_shown", "true"));
  await page.goto("/blog/strength-training-chronic-illness");
  await page.getByRole("button", { name: "React with heart" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Your reaction could not be saved" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "React with heart" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await page.getByRole("button", { name: "React with heart" }).click();
  await expect(page.getByRole("button", { name: "Remove reaction" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByText("Your reaction could not be saved", { exact: false })).toHaveCount(0);
  const results = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

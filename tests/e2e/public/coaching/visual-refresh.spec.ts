import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("newsletter_shown", "true"));
});

for (const route of ["/coaching/enquire", "/contact"]) {
  test(`${route} keeps the form accessible alongside desktop photography`, async ({
    page,
  }, info) => {
    await page.goto(route);
    const photo = page.getByRole("img", { name: "Shruti outdoors beside the water" });
    if (info.project.name === "desktop") await expect(photo).toBeVisible();
    else await expect(photo).toBeHidden();
    await expect(page.locator("form").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include("#main-content")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath("form.png"), fullPage: true });
  });
}

test("online workshop displays production content and a ticket without room terminology", async ({
  page,
}) => {
  await page.goto("/retreats/pause-and-restore");
  await expect(
    page.getByText("Before December asks more of you, take a morning for yourself.")
  ).toBeVisible();
  const booking = page.locator("#booking");
  await expect(booking.getByRole("heading", { name: "Your ticket" })).toBeVisible();
  await expect(booking).toContainText("£35");
  await expect(booking).not.toContainText(/shared room|bathroom|stay in this room/i);
  await expect(page.locator("#included")).toContainText("Gentle, adaptable movement");
  expect(
    (
      await new AxeBuilder({ page })
        .include("#main-content")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
});

test("coaching cards keep a stable height when expanded", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Expansion is a desktop interaction");
  await page.goto("/coaching");
  const first = page.getByRole("button", { name: /Training that can adapt/ });
  await first.scrollIntoViewIfNeeded();
  const card = first.locator("xpath=ancestor::article");
  const before = await card.boundingBox();
  await page.getByRole("button", { name: /A coach, not just a programme/ }).hover();
  await expect(page.getByRole("button", { name: /A coach, not just a programme/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const after = await card.boundingBox();
  expect(after?.height).toBe(before?.height);
});

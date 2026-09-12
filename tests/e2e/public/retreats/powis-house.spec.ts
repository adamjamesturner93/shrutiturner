import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("retreat cards are readable and keyboard accessible across screen sizes @a11y", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.POWIS_HOUSE_SEEDED !== "1",
    "Requires the explicit Powis House sandbox seed."
  );
  await page.goto("/retreats", { waitUntil: "domcontentloaded" });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const card = page.getByRole("article", {
      name: "Pause, Move, Breathe: A Yoga Weekend in Stirling",
    });
    await expect(card).toBeVisible();
    await expect(card).toContainText("18th–20th September 2026");
    await expect(card).toContainText("Arrive 16:00 · Leave 14:00");
    await expect(card).toContainText("Powis House");
    await expect(card).toContainText("Residential retreat");
    const link = card.getByRole("link", { name: "Explore the retreat" });
    await link.focus();
    await expect(link).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    const results = await new AxeBuilder({ page })
      .include("#retreats")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await card.screenshot({ path: testInfo.outputPath(`powis-card-${width}.png`) });
    const workshopCard = page.getByRole("article", { name: "The Middle Ground" });
    await expect(workshopCard.locator("img")).toHaveCSS("object-position", "50% 68%");
    await workshopCard.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await workshopCard.screenshot({ path: testInfo.outputPath(`middle-ground-card-${width}.png`) });
  }
});

test("convertible private rooms retain the chosen beds through checkout @a11y", async ({
  page,
}) => {
  test.skip(
    process.env.POWIS_HOUSE_SEEDED !== "1",
    "Requires the explicit Powis House sandbox seed."
  );
  await page.goto("/retreats/pause-move-breathe-stirling");
  await page.getByRole("button", { name: /Private King Room/ }).click();
  await page.getByRole("button", { name: /Two people/ }).click();
  const twin = page.getByRole("radio", { name: "Two single beds" });
  await twin.check();
  await expect(twin).toBeChecked();
  await twin.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "One double bed" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(twin).toBeChecked();
  const bookingLink = page
    .locator("#booking")
    .getByRole("link", { name: "Book your place" })
    .filter({ visible: true });
  await expect(bookingLink).toHaveAttribute("href", /guests=2&beds=twin/);
  await bookingLink.click();
  await expect(page).toHaveURL(/\/checkout\?/);
  await expect(page.getByRole("heading", { name: "Complete Your Retreat Booking" })).toBeVisible();
  const summary = page.getByRole("complementary");
  await expect(page.getByRole("radio", { name: "Two single beds" })).toBeChecked();
  await expect(summary).toContainText("Two single beds");
  await expect(page.getByRole("button", { name: "Two people £910 total" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("radio", { name: "One double bed" }).check();
  await expect(summary).toContainText("One double bed");
  await expect(page.getByRole("button", { name: "Two people £910 total" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const results = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: /Just me/ }).click();
  await expect(page.getByRole("radio", { name: "One double bed" })).toHaveCount(0);
  await expect(summary).toContainText("Just me");
  await expect(page.getByRole("button", { name: "Just me £525 total" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("Powis House sandbox content, accommodation and checkout @a11y", async ({ page }) => {
  test.skip(
    process.env.POWIS_HOUSE_SEEDED !== "1",
    "Requires the explicit Powis House sandbox seed."
  );
  await page.goto("/retreats/pause-move-breathe-stirling");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      level: 1,
      name: "Pause, Move, Breathe: A Yoga Weekend in Stirling",
    })
  ).toBeVisible();
  await expect(main.locator("strong").filter({ hasText: "Pause, move and breathe" })).toBeVisible();
  await expect(
    main.getByText(
      "A relaxed countryside weekend with spacious movement, shared meals, fresh air and quiet time. Join in at your own pace, with room to rest whenever you need."
    )
  ).toBeVisible();
  await expect(main.getByRole("heading", { name: "Arrive and Exhale" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Food and drink" })).toBeVisible();
  await expect(main.getByText("Shared Twin Bed", { exact: true }).first()).toBeVisible();
  await expect(main.getByText("Private King Room", { exact: true }).first()).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.goto(
    "/retreats/pause-move-breathe-stirling/checkout?date=pause-move-breathe-stirling-2026-09-18&room=private-king-room"
  );
  await expect(page.getByRole("main")).toContainText("Private King Room");
  await expect(page.getByRole("main")).toContainText("£525");
});

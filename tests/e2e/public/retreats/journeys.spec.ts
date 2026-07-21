import { expect, test } from "@playwright/test";

test.describe("retreat catalogue", () => {
  test("lists the three seeded retreat and workshop experiences", async ({ page }) => {
    await page.goto("/retreats");

    await expect(
      page.getByRole("heading", { name: "Pause, Move, Breathe: A Yoga Weekend in Stirling" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Wild Ground: Yoga, Walking and Rest in Highland Perthshire",
      })
    ).toBeVisible();
    const sankalpaHeading = page.getByRole("heading", {
      name: "Sankalpa: A Two-Hour Pause for Reflection and Intention",
    });
    await expect(sankalpaHeading).toBeVisible();
    const sankalpaCard = page.locator("article").filter({ has: sankalpaHeading });
    await expect(sankalpaCard).toContainText("15 November 2026");
    await expect(sankalpaCard).not.toContainText("15–15 November 2026");
  });

  test("shows Stirling schedule, guest-count pricing and early-bird rates", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/retreats/pause-move-breathe-stirling");

    await expect(page.getByRole("heading", { name: "Daily rhythm" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Arrive and Exhale" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Move, Explore and Restore" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reflect and Return" })).toBeVisible();
    await expect(page.getByText(/Standard prices from £425; save up to £50/)).toBeVisible();

    await page.getByRole("button", { name: /Private King Room/ }).click();
    await expect(page.getByRole("button", { name: /Just me/ })).toContainText("Save £30");
    await expect(page.getByRole("button", { name: /Two people/ })).toContainText("Save £50");

    await page.getByRole("button", { name: /Two people/ }).click();
    await expect(page.getByRole("link", { name: /Choose this retreat/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Choose this retreat/ })).toBeInViewport();
    await expect(page.getByRole("link", { name: /Choose this retreat/ })).toHaveAttribute(
      "href",
      /guests=2/
    );
    await expect(page.getByRole("link", { name: /Buy as a gift/ })).toHaveAttribute(
      "href",
      /guests=2.*gift=1/
    );

    const checkoutHref = await page
      .getByRole("link", { name: /Choose this retreat/ })
      .getAttribute("href");
    expect(checkoutHref).toBeTruthy();
    await page.goto(checkoutHref!);
    await expect(page.locator("form h2").nth(0)).toHaveText("1. Choose your date");
    await expect(page.locator("form h2").nth(1)).toHaveText("2. Choose your room");
    await expect(page.locator("form h2").nth(2)).toHaveText("3. Choose how to pay");

    const bookingSummary = page.locator("aside").filter({ hasText: "Booking summary" });
    await expect(bookingSummary).toContainText("Two people");
    await expect(bookingSummary).toContainText(/Due today\s*£172/);
    await expect(bookingSummary).toContainText(/Balance later\s*£688/);

    await page.getByRole("button", { name: /Pay in full/ }).click();
    await expect(bookingSummary).toContainText(/Due today\s*£817/);
    await expect(bookingSummary).not.toContainText("Balance later");
    await expect(bookingSummary).toContainText("includes a £43 discount");
    await expect(page.getByRole("button", { name: "Continue to full payment" })).toBeVisible();
  });
});

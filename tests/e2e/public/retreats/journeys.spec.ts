import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );

  expect(
    blockingViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.flatMap((node) => node.target),
    }))
  ).toEqual([]);
}

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
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("shows Stirling schedule, guest-count pricing and early-bird rates", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/retreats/pause-move-breathe-stirling");

    await expect(page.getByRole("heading", { name: "Daily rhythm" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Arrive and Exhale" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Move, Explore and Restore" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reflect and Return" })).toBeVisible();
    await expect(page.getByText(/Standard prices from £425; save up to £50/)).toBeVisible();

    await page.getByRole("link", { name: "Choose Your Date", exact: true }).click();
    await expect(page).toHaveURL(/#booking$/);
    await expect(page.locator("#booking")).toBeInViewport();

    await page.getByRole("button", { name: /Private King Room/ }).click();
    await expect(page.getByRole("button", { name: /Just me/ })).toContainText("Save £30");
    await expect(page.getByRole("button", { name: /Two people/ })).toContainText("Save £50");

    await page.getByRole("button", { name: /Two people/ }).click();
    await expect(page.getByRole("link", { name: /Book this retreat/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Book this retreat/ })).toBeInViewport();
    await expect(page.getByRole("link", { name: /Book this retreat/ })).toHaveAttribute(
      "href",
      /guests=2/
    );
    await expect(page.getByRole("link", { name: /Buy as a gift/ })).toHaveAttribute(
      "href",
      /guests=2.*gift=1/
    );

    const checkoutHref = await page
      .getByRole("link", { name: /Book this retreat/ })
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
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("shows a full-payment-only workshop without a deposit choice or discount", async ({
    page,
  }) => {
    await page.goto("/retreats/sankalpa-online-workshop");

    await expect(page.getByRole("heading", { name: "Workshop schedule" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sankalpa Online Workshop" })).toBeVisible();
    await expect(page.getByText("Sunday, 15 November 2026")).toBeVisible();
    await expect(page.getByText("Full payment at checkout", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose your ticket" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accommodation" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Food and drink" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Not included" })).toHaveCount(0);

    await page.goto(
      "/retreats/sankalpa-online-workshop/checkout?date=sankalpa-online-workshop-2026-11-15&room=live-workshop-ticket"
    );

    await expect(page.getByRole("heading", { name: "2. Choose your ticket" })).toBeVisible();
    await expect(page.getByText("Live and replay access", { exact: true })).toBeVisible();
    await expect(page.getByText(/Deposit today/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "3. Choose how to pay" })).toBeVisible();
    await expect(page.getByText("Full payment required", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pay deposit" })).toHaveCount(0);
    await expect(page.getByText(/No balance is due later/)).toBeVisible();
    await expect(page.getByText(/no separate pay-in-full discount applies/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to full payment" })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("returns an authentication response from the account API rather than a server error", async ({
    request,
  }) => {
    const response = await request.get("/api/me");

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
  });
});

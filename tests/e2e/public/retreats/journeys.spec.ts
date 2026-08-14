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
  test("lists The Middle Ground online workshop", async ({ page }) => {
    await page.goto("/retreats");

    const workshopHeading = page.getByRole("heading", {
      name: "The Middle Ground",
    });
    await expect(workshopHeading).toBeVisible();
    const workshopCard = page.locator("article").filter({ has: workshopHeading });
    await expect(workshopCard).toContainText("4 October 2026");
    await expect(workshopCard).toContainText("£35");
    await expect(page.locator("#retreats article")).toHaveCount(1);
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("shows a £35 full-payment workshop without accommodation or a deposit choice", async ({
    page,
  }) => {
    await page.goto("/retreats/the-middle-ground");

    const detailMain = page.getByRole("main");
    await expect(detailMain.getByRole("heading", { name: "Workshop schedule" })).toBeVisible();
    await expect(
      detailMain.getByRole("heading", { level: 1, name: "The Middle Ground" })
    ).toBeVisible();
    await expect(detailMain.getByText("Sunday, 4 October 2026")).toBeVisible();
    await expect(detailMain.getByText("Full payment at checkout", { exact: true })).toBeVisible();
    await expect(detailMain.getByRole("heading", { name: "Choose your ticket" })).toBeVisible();
    await expect(detailMain.getByRole("heading", { name: "Accommodation" })).toHaveCount(0);
    await expect(detailMain.getByRole("heading", { name: "Food and drink" })).toHaveCount(0);
    await expect(detailMain.getByRole("heading", { name: "Not included" })).toHaveCount(0);

    await page.goto(
      "/retreats/the-middle-ground/checkout?date=the-middle-ground-2026-10-04&room=live-workshop-ticket"
    );

    const checkoutMain = page.getByRole("main");
    await expect(
      checkoutMain.getByRole("heading", { name: "2. Choose your ticket" })
    ).toBeVisible();
    await expect(checkoutMain.getByText(/Deposit today/)).toHaveCount(0);
    await expect(checkoutMain.getByRole("heading", { name: "3. Choose how to pay" })).toBeVisible();
    await expect(checkoutMain.getByText("Full payment required", { exact: true })).toBeVisible();
    await expect(checkoutMain.getByRole("button", { name: "Pay deposit" })).toHaveCount(0);
    await expect(checkoutMain.getByText(/No balance is due later/)).toBeVisible();
    await expect(checkoutMain.getByText(/no separate pay-in-full discount applies/i)).toBeVisible();
    await expect(
      checkoutMain.getByRole("button", { name: "Continue to full payment" })
    ).toBeVisible();
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

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const MIDDLE_GROUND_DATE_TIME = "09:30-12:00 4th October 2026";

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
    await expect(page).toHaveTitle("Movement Retreats & Online Workshops | Shruti Turner");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /^Small-group retreats and online workshops/
    );

    await expect(
      page.getByRole("heading", { level: 1, name: "Space to move, learn and reset." })
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Shruti Turner moving outdoors beside the sea" })
    ).toHaveAttribute("src", /shruti-coaching\.jpeg/);
    const upcoming = page.locator("#retreats");
    await expect(upcoming.getByRole("heading", { name: "What’s coming up" })).toBeVisible();

    const workshopHeading = page.getByRole("heading", {
      name: "The Middle Ground",
    });
    const workshopCard = page
      .locator("article")
      .filter({ has: workshopHeading })
      .filter({ hasText: "4th October 2026" });
    await expect(workshopCard).toContainText("4th October 2026");
    await expect(workshopCard).toContainText("09:30–12:00");
    await expect(workshopCard).toContainText("Live online");
    await expect(workshopCard).toContainText("2.5 hours");
    await expect(workshopCard).toContainText("£35");
    await expect(workshopCard).not.toContainText("From £35");
    await expect(workshopCard).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "More than just a workout. More than just time to relax." })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Useful details before you book" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("navigates from the catalogue to retreat details without a blocking-route insight", async ({
    page,
  }) => {
    await page.goto("/retreats");
    await page
      .locator("article")
      .filter({ hasText: "4th October 2026" })
      .getByRole("link", { name: "Explore the workshop" })
      .click();

    await expect(page).toHaveURL(
      /\/retreats\/the-middle-ground\?date=the-middle-ground-2026-10-04$/
    );
    await expect(page.getByRole("heading", { level: 1, name: "The Middle Ground" })).toBeVisible();
    await expect(
      page.getByText("Next.js encountered runtime data during a navigation.")
    ).toHaveCount(0);
  });

  test("shows a £35 full-payment workshop without accommodation or a deposit choice", async ({
    page,
  }) => {
    await page.goto("/retreats/the-middle-ground");

    const detailMain = page.getByRole("main");
    await expect(
      detailMain
        .locator("strong")
        .filter({ hasText: "You don't need to start again every September." })
    ).toBeVisible();
    await expect(detailMain.getByRole("heading", { name: "Workshop schedule" })).toBeVisible();
    await expect(
      detailMain.getByRole("heading", { level: 1, name: "The Middle Ground" })
    ).toBeVisible();
    await expect(detailMain.getByText("Full payment at checkout", { exact: true })).toBeVisible();
    await expect(
      detailMain.getByRole("heading", { name: /^(Date|Choose your date)$/ })
    ).toBeVisible();
    await expect(detailMain.getByRole("heading", { name: "Your ticket" })).toBeVisible();
    await expect(
      detailMain.getByRole("link", { name: /Book (your place|this workshop)/ }).first()
    ).toBeVisible();
    await expect(
      detailMain.getByText(MIDDLE_GROUND_DATE_TIME, { exact: true }).first()
    ).toBeVisible();
    await expect(detailMain.getByText("Times shown in Europe/London").first()).toBeVisible();
    await expect(
      detailMain.getByText(
        "For people who want to understand and adapt their movement as routines, energy and bodies change with the season.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(detailMain).not.toContainText("From £35");
    await expect(detailMain.getByRole("heading", { name: "Accommodation" })).toHaveCount(0);
    await expect(detailMain.getByRole("heading", { name: "Food and drink" })).toHaveCount(0);
    await expect(detailMain.getByRole("heading", { name: "Not included" })).toHaveCount(0);
    const breadcrumb = detailMain.getByRole("navigation", { name: "breadcrumb" });
    const lightText = await breadcrumb
      .locator('[aria-current="page"]')
      .evaluate((element) => getComputedStyle(element).color);
    const retreatLink = breadcrumb.getByRole("link", { name: "Retreats", exact: true });
    await retreatLink.hover();
    await expect(retreatLink).toHaveCSS("color", lightText);
    await retreatLink.focus();
    await expect(retreatLink).toHaveCSS("color", lightText);
    const question = detailMain.getByRole("link", { name: "Ask a Question", exact: true });
    await question.hover();
    await expect(question).toHaveCSS("color", lightText);
    await question.focus();
    await expect(question).toHaveCSS("color", lightText);
    await expectNoSeriousAccessibilityViolations(page);

    await page.goto(
      "/retreats/the-middle-ground/checkout?date=the-middle-ground-2026-10-04&room=live-workshop-ticket"
    );

    const checkoutMain = page.getByRole("main");
    await expect(
      checkoutMain.getByText(MIDDLE_GROUND_DATE_TIME, { exact: true }).first()
    ).toBeVisible();
    await expect(checkoutMain.getByRole("heading", { name: "Choose your ticket" })).toHaveCount(0);
    await expect(checkoutMain.getByRole("heading", { name: /^\d+\./ })).toHaveCount(0);
    await expect(checkoutMain.getByText(/Deposit today/)).toHaveCount(0);
    await expect(checkoutMain.getByRole("heading", { name: "3. Choose how to pay" })).toHaveCount(
      0
    );
    await expect(checkoutMain.getByText("Full payment required", { exact: true })).toHaveCount(0);
    await expect(checkoutMain.getByRole("button", { name: "Pay deposit" })).toHaveCount(0);
    await expect(checkoutMain.getByText(/No balance is due later/)).toHaveCount(0);
    await expect(checkoutMain.getByText(/no separate pay-in-full discount applies/i)).toHaveCount(
      0
    );
    await expect(checkoutMain.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(checkoutMain.getByLabel("Dietary requirements", { exact: true })).toHaveCount(0);
    await expect(checkoutMain.getByLabel("Emergency contact name", { exact: true })).toHaveCount(0);
    await expect(checkoutMain.getByRole("button", { name: "Book my place · £35" })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("a new visitor can submit the online workshop without health or emergency fields", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      "/retreats/the-middle-ground/checkout?date=the-middle-ground-2026-10-04&room=live-workshop-ticket"
    );
    const main = page.getByRole("main");
    const payButton = main.getByRole("button", { name: "Book my place · £35" });
    await expect(payButton).toBeVisible();
    const bounds = await payButton.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.setViewportSize({ width: 1366, height: 768 });
    const laptopBounds = await payButton.boundingBox();
    expect(laptopBounds!.y + laptopBounds!.height).toBeLessThanOrEqual(768);
    await main.getByLabel("First name", { exact: true }).fill("Checkout");
    await main.getByLabel("Last name", { exact: true }).fill("Fixture");
    await main.getByLabel("Email", { exact: true }).fill("checkout-fixture@example.com");
    await main.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    await main.getByRole("checkbox", { name: /Health & Liability Waiver/ }).check();
    await page.route("**/api/retreats/the-middle-ground/checkout", (route) =>
      route.fulfill({
        status: 503,
        json: { message: "Fixture: payment provider is not contacted." },
      })
    );
    const requestPromise = page.waitForRequest("**/api/retreats/the-middle-ground/checkout");
    await main.getByRole("button", { name: "Book my place · £35" }).click();
    const body = (await requestPromise).postDataJSON();
    expect(body).toMatchObject({
      purchaseMode: "self",
      paymentOption: "pay_in_full",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      dietaryRequirements: "",
      acceptedHealthDataVersion: null,
    });
    expect(body.acceptedTermsVersion).toBeTruthy();
    expect(body.acceptedHealthWaiverVersion).toBeTruthy();
    await expect(main.getByText("Fixture: payment provider is not contacted.")).toBeVisible();
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

import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../helpers/db";
import { signInAdminFixture } from "../helpers/admin-login";

test.use({ actionTimeout: 15000, navigationTimeout: 30000 });

test("studio menu is keyboard accessible and account section survives reload", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const email = `e2e-batch-studio-${randomUUID()}@example.com`;
  const user = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  try {
    await signInAdminFixture(page, email, "/dashboard/account");
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    await page.getByLabel("What should I call you?").fill("Unsaved fixture name");
    await page.getByRole("navigation", { name: "Account sections" }).getByRole("link", { name: "Preferences" }).click();
    await expect(page.getByRole("dialog", { name: "Leave without saving?" })).toBeVisible();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    await expect(page.getByLabel("What should I call you?")).toHaveValue("Unsaved fixture name");
    await page.getByRole("navigation", { name: "Account sections" }).getByRole("link", { name: "Preferences" }).click();
    await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
    await expect(page).toHaveURL(/section=preferences/);
    await page.reload();
    await expect(page.locator("#timezone")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const trigger = page.getByRole("button", { name: "Open studio menu" });
    await trigger.click();
    const menu = page.getByRole("dialog", { name: "Studio navigation" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Account", exact: true })).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect((await new AxeBuilder({ page }).include("#studio-main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("account-mobile.png"), fullPage: true });
  } finally {
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: user.id } });
  }
});

test("refund preview uses pounds and preserves retry identity after an ambiguous response", async ({ page }) => {
  test.setTimeout(180000);
  const email = `e2e-batch-refund-${randomUUID()}@example.com`;
  const user = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  const requests: Array<{ idempotencyKey: string; amountPence: number }> = [];
  await page.route("**/api/admin/billing/dunning", (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.route("**/api/admin/billing/refunds", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { success: true, data: [
      { membershipId: "fixture", invoiceId: "in_fixture", label: "Fixture member", paidPence: 3500, refundablePence: 3500 },
    ] } });
    requests.push(route.request().postDataJSON());
    return requests.length === 1 ? route.fulfill({ status: 503, json: { message: "Outcome not confirmed" } })
      : route.fulfill({ json: { success: true, data: { status: "succeeded" } } });
  });
  try {
    await signInAdminFixture(page, email, "/admin/business?section=billing");
    await page.getByRole("combobox", { name: "Payment", exact: true }).selectOption("fixture");
    await page.getByLabel("Refund amount (£)").fill("0.29");
    await page.getByLabel("Reason", { exact: true }).fill("Fixture correction");
    await page.getByRole("button", { name: "Review refund", exact: true }).click();
    await expect(page.getByText(/Refund £0.29 to the original payment method/)).toBeVisible();
    await page.getByRole("button", { name: "Confirm refund", exact: true }).click();
    await page.getByRole("button", { name: "Retry same request", exact: true }).click();
    await expect(page.getByText("Refund recorded successfully.")).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0].amountPence).toBe(29);
    expect(requests[0].idempotencyKey).toBe(requests[1].idempotencyKey);
  } finally {
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: user.id } });
  }
});

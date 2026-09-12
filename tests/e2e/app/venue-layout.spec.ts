import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../helpers/db";
import { signInAdminFixture } from "../helpers/admin-login";

test("venue summary is compact and its editor works by keyboard", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const email = `e2e-venue-layout-${randomUUID()}@example.com`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signInAdminFixture(page, email, "/admin/retreats/venues");
    const summary = page.locator("summary").filter({ hasText: "Powis House" });
    await expect(summary).toBeVisible({ timeout: 30_000 });
    const box = await summary.boundingBox();
    expect(box!.height).toBeLessThan(120);
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Group name").first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("venue-editor-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include("#admin-main")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Group name").first()).toBeHidden();
  } finally {
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: admin.id } });
  }
});

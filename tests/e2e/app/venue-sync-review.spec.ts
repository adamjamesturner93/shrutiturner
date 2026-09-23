import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../helpers/db";
import { signInAdminFixture } from "../helpers/admin-login";

test("venue changes are reviewed and priced before applying, including on mobile", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const email = `e2e-venue-review-${randomUUID()}@example.test`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  let submitted: unknown = null;
  const fixture = {
    id: "synthetic-date",
    title: "Synthetic retreat",
    startsAt: "2099-06-01T15:00:00Z",
    revision: "reviewed",
    changes: ["Add King — Private bathroom."],
    conflicts: [],
    prices: [{ key: "king:whole_room:1", label: "King — Private bathroom", guestCount: 1 }],
  };
  await page.route("**/api/admin/retreats/venues/*/sync", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON();
      return route.fulfill({ json: { id: fixture.id } });
    }
    return route.fulfill({ json: submitted ? [] : [fixture] });
  });
  try {
    await signInAdminFixture(page, email, "/admin/retreats/venues");
    await page
      .getByRole("button", { name: "Review changes for existing retreats" })
      .first()
      .click();
    const region = page
      .getByRole("region", { name: "Apply venue rooms to retreats" })
      .filter({ hasText: "Synthetic retreat" });
    await expect(region.getByRole("button", { name: "Apply reviewed changes" })).toBeDisabled();
    expect(submitted).toBeNull();
    await region.getByLabel(/total price/).fill("525");
    await expect(region.getByRole("button", { name: "Apply reviewed changes" })).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath("venue-review-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    const results = await new AxeBuilder({ page })
      .include("#admin-main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("venue-review-mobile.png") });
    await region.getByRole("button", { name: "Apply reviewed changes" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "venue changes applied" })
    ).toBeVisible();
    expect(submitted).toEqual({
      dateId: fixture.id,
      revision: fixture.revision,
      prices: { "king:whole_room:1": 52500 },
    });
  } finally {
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: admin.id } });
  }
});

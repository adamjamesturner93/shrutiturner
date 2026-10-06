import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("selected room carries into checkout without collecting attendee health details", async ({
  page,
}) => {
  test.skip(
    process.env.POWIS_ROOM_REVIEW !== "1",
    "Requires the local Powis room-review seed and dev server."
  );
  test.setTimeout(90000);
  await page.addInitScript(() => sessionStorage.setItem("newsletter_shown", "true"));
  const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  await page.goto(`${base}/retreats/local-powis-room-review`);
  await expect(page.locator("#booking")).toContainText(/balance due 16(?:th)? April 2027/);
  await page.getByRole("button", { name: "2 people", exact: true }).click();
  await page.getByRole("button", { name: /Private room · Shared bathroom/ }).click();
  await page.getByRole("button", { name: "King bed", exact: true }).click();
  await expect(page.locator("#booking")).toContainText("King bed · 2 guests");
  await expect(page.locator("#booking")).toContainText("£850 total");
  await expect(page.locator("#booking")).not.toContainText("Double or king bed");
  await page.getByRole("button", { name: "1 person", exact: true }).click();
  await page.getByRole("button", { name: "Private room · Private bathroom", exact: false }).click();
  await page
    .locator("#booking")
    .getByRole("link", { name: "Book your place", exact: true })
    .click();
  // The local dev server may still be compiling the streamed checkout route.
  await expect(page.getByRole("heading", { name: "Your selected room" })).toBeVisible({
    timeout: 30000,
  });
  const options = page.locator("#checkout-room-options");
  await expect(page.getByRole("button", { name: /^Pay deposit/ })).toContainText(
    "is paid by 16th April 2027"
  );
  await expect(page.getByRole("button", { name: /^Pay in full/ })).toContainText(
    "with everything paid and no remaining balance to think about"
  );
  await expect(page.locator("aside").filter({ hasText: "Booking summary" })).toContainText(
    "Balance due 16th April 2027"
  );
  await expect(options.getByLabel("Selected room details")).toBeVisible();
  const toggle = page.getByRole("button", { name: "Change room selection" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    (
      await new AxeBuilder({ page })
        .include("#checkout-room-options")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await toggle.click();
  await expect(options.getByRole("button", { name: "2 people", exact: true })).toBeVisible();
  await options.getByRole("button", { name: /Shared room · Shared bathroom/ }).click();
  await expect(options.getByLabel("Selected room details")).toBeVisible();
  await expect(page.getByRole("button", { name: "Change room selection" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  await page.getByRole("button", { name: "Change room selection" }).click();
  await options.getByRole("button", { name: "2 people", exact: true }).click();
  await expect(options.getByRole("button", { name: /^Shared room/ })).toHaveCount(0);
  await options.getByRole("button", { name: /Private room · Private bathroom/ }).click();
  await options.getByRole("button", { name: "Twin beds", exact: true }).click();
  await expect(options.getByLabel("Selected room details")).toBeVisible();
  await expect(options.getByLabel("Selected room details")).toContainText("Two people · Twin beds");
  await expect(options.getByLabel("Selected room details")).toContainText("£900 total");
  await expect(options.getByLabel("Selected room details")).toContainText(
    "Room deposit today £225"
  );
  await expect(page.locator("aside").filter({ hasText: "Booking summary" })).toContainText(
    "Twin beds"
  );
  await expect(page.locator("aside").filter({ hasText: "Booking summary" })).toContainText("£225");
  await options.getByLabel("Selected room details").click();
  await expect(options.getByLabel("Selected room details")).toContainText("Two people");
  await page.getByRole("button", { name: /Pay in full/ }).click();
  await expect(options.getByLabel("Selected room details")).toContainText(
    "Room payment today £900"
  );
  await expect(options.getByLabel("Selected room details")).not.toContainText("deposit today");
  // App Router can update search params without remounting the checkout component.
  await page.evaluate(() =>
    window.history.pushState(
      null,
      "",
      "?date=local-powis-room-review-june-2027&room=twin-shared-private&guests=2"
    )
  );
  await expect(options.getByLabel("Selected room details")).toContainText(
    "Private room · Shared bathroom"
  );
  await expect(options.getByLabel("Selected room details")).toContainText("Two people · Twin beds");
  await expect(options.getByLabel("Selected room details")).toContainText("£850 total");
  await expect(options.getByLabel("Selected room details")).toContainText(
    "Room deposit today £212.50"
  );
  await expect(page.locator("aside").filter({ hasText: "Booking summary" })).toContainText(
    "£212.50"
  );
  for (const mode of ["Booking for me", "Buy as a gift"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const field of [
      "Phone",
      "Emergency contact name",
      "Emergency contact phone",
      "Dietary requirements",
      "Accessibility or mobility needs",
      "Health notes",
    ]) {
      await expect(page.getByLabel(field, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText("Health & Liability Waiver", { exact: true })).toHaveCount(0);
  }
});

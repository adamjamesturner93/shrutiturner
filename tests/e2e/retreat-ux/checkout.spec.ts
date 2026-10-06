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
  await expect(options.getByRole("button")).toHaveCount(1);
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
  await expect(options.getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Change room selection" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  await page.getByRole("button", { name: "Change room selection" }).click();
  await options.getByRole("button", { name: "2 people", exact: true }).click();
  await expect(options.getByRole("button", { name: /^Shared room/ })).toHaveCount(0);
  await options.getByRole("button", { name: /Private room · Private bathroom/ }).click();
  await options.getByRole("button", { name: "Twin beds", exact: true }).click();
  await expect(options.getByRole("button")).toHaveCount(1);
  await expect(page.getByText("Two single beds", { exact: true })).toBeVisible();
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

import { expect, test } from "@playwright/test";

test("referral landing page shows the refreshed invite and links into login", async ({ page }) => {
  await page.goto("/r/friend-code");

  await expect(
    page.getByRole("heading", {
      name: /Someone thinks you would benefit from a class that actually fits\./i,
    })
  ).toBeVisible();
  await expect(page.getByText("Free class credit after sign-in.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Claim Your Free Class" }).first()).toHaveAttribute(
    "href",
    "/login?ref=friend-code"
  );
});

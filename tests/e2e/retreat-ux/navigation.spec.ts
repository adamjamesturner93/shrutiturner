import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("illustrated menu, section links and review controls work across screen sizes", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.POWIS_ROOM_REVIEW !== "1",
    "Requires the local room-review fixture and server"
  );
  const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/retreats/navigation", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            slug: "local-powis-room-review",
            title: "Powis House",
            imageUrl: "/images/shruti-coaching.jpeg",
            imageAlt: "Shruti outdoors",
            location: "Stirling",
            date: "11 Jun 2027",
            format: "Residential retreat",
            status: "Places available",
          },
          {
            slug: "example",
            title: "Example workshop",
            imageUrl: "",
            imageAlt: "",
            location: "Online",
            date: "1 Dec 2027",
            format: "Online workshop",
            status: "Sold out",
          },
        ],
      },
    })
  );
  await page.goto(`${base}/retreats/local-powis-room-review`);
  await expect(page.locator("#booking")).toBeAttached();
  const mobile = testInfo.project.name === "mobile";
  if (mobile) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const trigger = page.locator("header summary").filter({ visible: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.locator("header details[open]");
  await expect(menu.getByText("Example workshop", { exact: true })).toBeVisible();
  await expect(menu).toContainText("Sold out");
  await page.screenshot({ path: testInfo.outputPath("retreat-menu.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const menuAudit = await new AxeBuilder({ page })
    .include("header")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(menuAudit.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("header details[open]")).toHaveCount(0);
  if (mobile) await page.getByRole("button", { name: "Close menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Retreat sections" })
    .getByRole("link", { name: "Book", exact: true })
    .click();
  await expect(page.locator("#booking")).toBeInViewport();
  await page.waitForTimeout(500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("retreat-inline-booking.png"),
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("#rhythm").locator("..").locator("details")).toHaveCount(3);
  await expect(page.locator("#rhythm").locator("..")).toContainText("Friday, 11th June 2027");
  await expect(page.locator("#rhythm").locator("..")).toContainText("Sunday, 13th June 2027");
  await page.locator("#rhythm").locator("..").locator("summary").first().click();
  await expect(
    page.getByText("Arrive from 3pm and settle into Powis House", { exact: true })
  ).toBeVisible();
  await expect(
    page.locator("#rhythm").locator("..").getByRole("heading", { name: "Friday — Unwind" })
  ).toBeVisible();
  await expect(
    page.locator("#rhythm").locator("..").locator("details").first().getByRole("listitem")
  ).toHaveCount(4);
  const photo = page.getByRole("button", { name: /Enlarge photo 1:/ });
  await photo.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Photo 2 of 3");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog")).toContainText("Photo 1 of 3");
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  const audit = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("catalogue separates retreats and workshops with shared guest reviews", async ({
  page,
}, testInfo) => {
  test.skip(process.env.POWIS_ROOM_REVIEW !== "1", "Requires the local catalogue");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/retreats`);
  await expect(
    page.locator("#retreats").getByRole("heading", { name: "Retreats", exact: true })
  ).toBeVisible();
  await expect(
    page.locator("#workshops").getByRole("heading", { name: "Workshops", exact: true })
  ).toBeVisible();
  await expect(page.locator("#retreats")).toContainText("Powis House");
  await expect(page.locator("#workshops")).not.toContainText("Powis House");
  if (
    testInfo.project.name === "desktop" &&
    (await page.locator("#workshops article").count()) === 1
  ) {
    const card = await page.locator("#workshops article").boundingBox();
    expect(card?.width).toBeGreaterThan(800);
  }
  await expect(
    page.getByRole("heading", { name: "Your body. Your pace. Space to be yourself." })
  ).toBeVisible();
  const principles = page.getByRole("button", { name: /Learn something useful/ });
  await principles.focus();
  await expect(principles).toHaveAttribute("aria-pressed", "true");
  await expect(principles).toContainText("Explore movement, strength and wellbeing");
  const audit = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("retreat-catalogue.png"), fullPage: true });
});

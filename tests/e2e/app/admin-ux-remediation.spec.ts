import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../helpers/db";
import { signInAdminFixture } from "../helpers/admin-login";
import { parseRetreatExperienceContent } from "../../../src/lib/retreats/experience-schema";

test("business navigation survives overview failure and remembers the selected section", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const email = `e2e-admin-ux-${randomUUID()}@example.com`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  let settingsRequests = 0;
  await page.route("**/api/admin/business", (route) =>
    route.fulfill({ status: 503, json: { message: "Fixture unavailable" } })
  );
  await page.route("**/api/admin/business/settings", (route) => {
    settingsRequests++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          businessName: "Fixture studio",
          supportEmail: "support@example.com",
          contactEmail: null,
          instagramUrl: null,
          defaultSeoTitle: null,
          defaultSeoDescription: null,
          gaMeasurementId: null,
        },
      },
    });
  });
  try {
    await signInAdminFixture(page, email, "/admin/business");
    await expect(page.locator("#admin-main").getByRole("alert")).toContainText(
      "Other business sections are still available",
      { timeout: 30_000 }
    );
    expect(settingsRequests).toBe(0);
    await page.getByRole("button", { name: "Site settings", exact: true }).click();
    await expect(page).toHaveURL(/section=settings/);
    await expect(page.getByLabel("Business name", { exact: true })).toHaveValue("Fixture studio");
    await page.reload();
    await expect(page.getByLabel("Business name", { exact: true })).toHaveValue("Fixture studio");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true);
    }
    expect(
      (
        await new AxeBuilder({ page })
          .include("#admin-main")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
  } finally {
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: admin.id } });
  }
});

test("event image edits validate descriptions and discard without changing the saved draft", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const key = randomUUID();
  const email = `e2e-event-image-${key}@example.com`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  const experience = await db.retreatExperience.create({
    data: {
      slug: `e2e-image-${key}`,
      title: "Image editor fixture",
      eventKind: "online_workshop",
      draftContentJson: parseRetreatExperienceContent({
        title: "Image editor fixture",
        image: {
          url: "/images/shruti-coaching.jpeg",
          alt: "Shruti outdoors",
          focalPoint: { x: 50, y: 0 },
        },
      }),
    },
  });
  try {
    await signInAdminFixture(page, email, `/admin/retreats/experiences/${experience.id}`);
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
    await page.getByLabel("Image description", { exact: true }).fill("");
    await expect(page.getByText("Add a description before saving this image.")).toBeVisible();
    await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save draft", exact: true }).last().click();
    await expect(
      page.getByText("Add alternative text for the event image before saving.")
    ).toBeVisible();
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await expect(page.getByLabel("Image description", { exact: true })).toHaveValue(
      "Shruti outdoors"
    );
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.route("**/api/admin/media/images?**", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                assetId: "fixture-photo",
                url: "/images/shruti.jpeg",
                title: "Library photograph",
                alt: "Shruti in the image library",
              },
            ],
            page: 1,
            hasMore: false,
            libraryUrl: "https://app.contentful.com/spaces/fixture/environments/sandbox/assets",
            environment: "sandbox",
          },
        },
      })
    );
    await page.getByRole("button", { name: "Choose image from library" }).click();
    const library = page.getByRole("dialog");
    await expect(library.getByRole("link", { name: /Upload in Contentful/ })).toHaveAttribute(
      "href",
      /environments\/sandbox\/assets/
    );
    await expect(library.getByRole("button", { name: "Library photograph" })).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await library.getByRole("button", { name: "Library photograph" }).click();
    await expect(page.getByLabel("Image description", { exact: true })).toHaveValue(
      "Shruti in the image library"
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).last().click();
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    expect(
      (await db.retreatExperience.findUniqueOrThrow({ where: { id: experience.id } }))
        .draftContentJson
    ).toMatchObject({ image: { assetId: "fixture-photo", url: "/images/shruti.jpeg" } });
    expect(
      (
        await new AxeBuilder({ page })
          .include("#admin-main")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    expect(
      (await db.retreatExperience.findUniqueOrThrow({ where: { id: experience.id } })).publishedAt
    ).toBeNull();
  } finally {
    await db.retreatExperience.delete({ where: { id: experience.id } });
    await db.authChallenge.deleteMany({ where: { email } });
    await db.adminActionLog.deleteMany({ where: { actorUserId: admin.id } });
    await db.user.delete({ where: { id: admin.id } });
  }
});

test("admin creates a reusable format and it appears in event creation", async ({ page }) => {
  test.setTimeout(180_000);
  const key = randomUUID();
  const email = `e2e-format-${key}@example.com`;
  const name = `Half-day workshop ${key}`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  try {
    await signInAdminFixture(page, email, "/admin/retreats/formats");
    await page.getByRole("button", { name: "New format", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Format name", { exact: true }).fill(name);
    await dialog.getByLabel("Event type", { exact: true }).selectOption("online_workshop");
    await dialog.getByLabel("Starting price (£)", { exact: true }).fill("12.34");
    await dialog.getByLabel("Duration in minutes (optional)").fill("180");
    expect(
      (
        await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await dialog.getByRole("button", { name: "Create format", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const saved = await db.retreatFormatPreset.findUniqueOrThrow({ where: { name } });
    expect(saved.operationalDefaultsJson).toMatchObject({
      pricePence: 1234,
      durationMinutes: 180,
      paymentPolicy: "full_payment",
    });
    await page.goto("/admin/retreats/new");
    await page.getByLabel("Saved format", { exact: true }).selectOption(saved.id);
    await expect(page.getByLabel("Saved format", { exact: true })).toHaveValue(saved.id);
  } finally {
    await db.retreatFormatPreset.deleteMany({ where: { name } });
    await db.authChallenge.deleteMany({ where: { email } });
    await db.adminActionLog.deleteMany({ where: { actorUserId: admin.id } });
    await db.user.delete({ where: { id: admin.id } });
  }
});

import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../../helpers/db";

test("published event gallery preserves photo order, alt text and mobile layout", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const key = `e2e-gallery-${randomUUID()}`;
  const content = {
    schemaVersion: 1,
    title: "Synthetic photo review",
    shortDescription: "A calm movement workshop.",
    fullDescription: "Learn and practise together.",
    scheduleMarkdown: "## Your morning\n\n- Movement\n- Reflection",
    gallery: [
      {
        url: "/images/holding-background.jpg",
        alt: "First synthetic gallery photograph",
        caption: "A peaceful place to practise together.",
        focalPoint: { x: 50, y: 50 },
      },
      {
        url: "/images/holding-background.jpg",
        alt: "Second synthetic gallery photograph",
        focalPoint: { x: 30, y: 40 },
      },
    ],
  };
  const experience = await db.retreatExperience.create({
    data: {
      slug: key,
      title: content.title,
      eventKind: "online_workshop",
      draftContentJson: content,
      publishedContentJson: content,
      publishedAt: new Date(),
      publishedRevision: 1,
    },
  });
  const date = await db.retreatDate.create({
    data: {
      externalDateId: key,
      retreatSlug: key,
      experienceId: experience.id,
      retreatTitleSnapshot: content.title,
      retreatLocationSnapshot: "Online",
      retreatType: "online",
      eventKind: "online_workshop",
      startsAt: new Date("2099-06-01T09:00:00Z"),
      endsAt: new Date("2099-06-01T12:00:00Z"),
      capacity: 12,
      pricePence: 3500,
      depositAmountPence: 3500,
      status: "open",
      depositRules: { create: { depositType: "full_payment" } },
      roomOptions: {
        create: {
          externalRoomOptionId: "online",
          label: "Workshop place",
          roomType: "online",
          bookingUnit: "online_live_place",
          capacity: 12,
          availableSpots: 12,
          pricePence: 3500,
        },
      },
    },
  });
  try {
    await page.addInitScript(() => window.sessionStorage.setItem("newsletter_shown", "true"));
    await page.goto(`/retreats/${key}`);
    const gallery = page.getByRole("region", { name: "A closer look" });
    await expect(gallery).toBeVisible();
    await expect(gallery.getByRole("img")).toHaveCount(2);
    await expect(gallery.getByRole("img").first()).toHaveAttribute(
      "alt",
      "First synthetic gallery photograph"
    );
    await expect(gallery.getByRole("img").first()).toHaveAttribute("loading", "lazy");
    const opener = gallery.getByRole("button", { name: /Enlarge photo 1/ });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("A peaceful place to practise together.")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(
      dialog.getByRole("img", { name: "Second synthetic gallery photograph" })
    ).toHaveAttribute("alt", "Second synthetic gallery photograph");
    await dialog.getByRole("button", { name: "Previous photo" }).click();
    await expect(dialog.getByText("Photo 1 of 2", { exact: true })).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations
    ).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await gallery.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("gallery-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await gallery.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await opener.click();
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("gallery-mobile.png"),
    });
    await page.keyboard.press("Escape");
    const results = await new AxeBuilder({ page })
      .include("#main-content")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  } finally {
    await db.retreatDate.delete({ where: { id: date.id } });
    await db.retreatExperience.delete({ where: { id: experience.id } });
  }
});

import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../../helpers/db";
import { parseRetreatExperienceContent } from "../../../../src/lib/retreats/experience-schema";

test("day retreat hides single choices and preserves the selected January instance", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => sessionStorage.setItem("newsletter_shown", "true"));
  const slug = `e2e-day-${randomUUID()}`;
  const venue = await db.retreatVenueProfile.findFirstOrThrow({
    where: { venueSlug: "powis-house" },
  });
  const content = parseRetreatExperienceContent({
    title: "Day retreat journey fixture",
    shortDescription: "A day of movement.",
    fullDescription: "A welcoming day.",
    scheduleMarkdown: "10:00 Arrival\n16:00 Finish",
  });
  const experience = await db.retreatExperience.create({
    data: {
      slug,
      title: content.title,
      eventKind: "day_retreat",
      draftContentJson: content,
      publishedContentJson: content,
      publishedAt: new Date(),
      publishedRevision: 1,
    },
  });
  const makeDate = (month: string) =>
    db.retreatDate.create({
      data: {
        externalDateId: `${slug}-${month}`,
        retreatSlug: slug,
        retreatTitleSnapshot: content.title,
        retreatLocationSnapshot: "Stirling",
        retreatType: "in_person",
        eventKind: "day_retreat",
        experienceId: experience.id,
        venueProfileId: venue.id,
        startsAt: new Date(`${month === "12" ? 2026 : 2027}-${month}-18T10:00:00Z`),
        endsAt: new Date(`${month === "12" ? 2026 : 2027}-${month}-18T16:00:00Z`),
        capacity: 10,
        status: "open",
        pricePence: 3500,
        depositAmountPence: 3500,
        payInFullDiscountEnabled: false,
        roomOptions: {
          create: {
            externalRoomOptionId: `${slug}-ticket-${month}`,
            label: "Day ticket",
            roomType: "ticket",
            capacity: 10,
            availableSpots: 10,
            pricePence: 3500,
            depositAmountPence: 3500,
          },
        },
      },
    });
  try {
    const january = await makeDate("01");
    await page.goto(`/retreats/${slug}/checkout?date=${january.externalDateId}`);
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: /Choose your (date|ticket)|Choose how to pay/ })
    ).toHaveCount(0);
    await expect(main.getByRole("heading", { name: /^\d+\./ })).toHaveCount(0);
    await expect(main.getByLabel("Emergency contact name", { exact: true })).toBeVisible();
    await expect(main).toContainText("January 2027");
    await page.setViewportSize({ width: 1440, height: 900 });
    const summaryBounds = await main.getByRole("region", { name: content.title }).boundingBox();
    const purchaserBounds = await main
      .getByRole("heading", { name: "Purchaser details" })
      .boundingBox();
    expect(summaryBounds!.x + summaryBounds!.width).toBeLessThan(purchaserBounds!.x);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true);
    }
    expect(
      (
        await new AxeBuilder({ page })
          .include("main")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await makeDate("12");
    // Catalogue link shape is covered in journeys.spec.ts; do not depend on its cached fixture list.
    await page.goto(`/retreats/${slug}?date=${january.externalDateId}`);
    await expect(page).toHaveURL(new RegExp(`date=${january.externalDateId}`));
    const book = page
      .locator("#booking")
      .getByRole("link", { name: /Book (your place|this retreat)/ })
      .first();
    await expect(book).toHaveAttribute("href", new RegExp(`date=${january.externalDateId}`));
    await book.click();
    await expect(page).toHaveURL(new RegExp(`checkout\\?date=${january.externalDateId}`));
    await main.getByRole("link", { name: "Back to retreat details" }).click();
    await expect(page).toHaveURL(new RegExp(`date=${january.externalDateId}`));
    // Fresh published fixture avoids relying on cached content after direct database edits.
    const soldSlug = `${slug}-sold`;
    const soldExperience = await db.retreatExperience.create({
      data: {
        slug: soldSlug,
        title: content.title,
        eventKind: "day_retreat",
        draftContentJson: content,
        publishedContentJson: content,
        publishedAt: new Date(),
        publishedRevision: 1,
      },
    });
    try {
      const soldDate = await db.retreatDate.create({
        data: {
          externalDateId: soldSlug,
          retreatSlug: soldSlug,
          retreatTitleSnapshot: content.title,
          retreatLocationSnapshot: "Stirling",
          retreatType: "in_person",
          eventKind: "day_retreat",
          experienceId: soldExperience.id,
          venueProfileId: venue.id,
          startsAt: january.startsAt,
          endsAt: january.endsAt,
          capacity: 10,
          status: "open",
          pricePence: 3500,
          depositAmountPence: 3500,
          roomOptions: {
            create: [1, 2].map((number) => ({
              externalRoomOptionId: `${soldSlug}-${number}`,
              label: `Sold-out option ${number}`,
              roomType: "ticket",
              capacity: 0,
              availableSpots: 0,
              pricePence: 3500,
              depositAmountPence: 3500,
            })),
          },
        },
      });
      await page.goto(`/retreats/${soldSlug}?date=${soldDate.externalDateId}`);
      await expect(page.getByRole("button", { name: /Sold-out option 1/ })).toBeDisabled();
      await expect(
        page
          .locator("#booking")
          .getByRole("link", { name: /Book (your place|this retreat)|Buy as a gift/ })
      ).toHaveCount(0);
      await page.goto(
        `/retreats/${soldSlug}/checkout?date=${soldDate.externalDateId}&room=${soldSlug}-1`
      );
      await expect(main.locator('button[type="submit"]')).toBeDisabled();
    } finally {
      await db.retreatDate.deleteMany({ where: { experienceId: soldExperience.id } });
      await db.retreatExperience.delete({ where: { id: soldExperience.id } });
    }
  } finally {
    await db.retreatDate.deleteMany({ where: { experienceId: experience.id } });
    await db.retreatExperience.delete({ where: { id: experience.id } });
  }
});

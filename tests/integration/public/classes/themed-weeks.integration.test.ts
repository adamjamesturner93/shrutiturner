import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getScheduleThemedWeek, listPublicThemedWeeks } from "@/lib/themed-weeks/service";

const SCOPE = "integration-themed-weeks";

async function cleanupThemedWeeks() {
  await db.themedWeek.deleteMany({
    where: {
      slug: {
        startsWith: `${SCOPE}-`,
      },
    },
  });
}

describe("public themed weeks integration", () => {
  beforeEach(async () => {
    await cleanupThemedWeeks();
  });

  afterAll(async () => {
    await cleanupThemedWeeks();
  });

  it("returns the current themed week ahead of future runs", async () => {
    await db.themedWeek.createMany({
      data: [
        {
          slug: `${SCOPE}-future`,
          title: "Future Week",
          shortDescription: "Future short description",
          audience: "Future audience",
          ctaHref: "/classes",
          ctaLabel: "Register",
          startDate: new Date("2026-03-23T00:00:00.000Z"),
          endDate: new Date("2026-03-29T23:59:59.999Z"),
          sortOrder: 1,
        },
        {
          slug: `${SCOPE}-current`,
          title: "Current Week",
          shortDescription: "Current short description",
          audience: "Current audience",
          ctaHref: "/schedule",
          ctaLabel: "See What's Running",
          startDate: new Date("2026-03-09T00:00:00.000Z"),
          endDate: new Date("2026-03-15T23:59:59.999Z"),
          sortOrder: 0,
        },
      ],
    });

    const themedWeek = await getScheduleThemedWeek(new Date("2026-03-15T09:00:00.000Z"));

    expect(themedWeek?.slug).toBe(`${SCOPE}-current`);
  });

  it("returns the next future themed week when none are active", async () => {
    await db.themedWeek.createMany({
      data: [
        {
          slug: `${SCOPE}-later`,
          title: "Later Week",
          shortDescription: "Later short description",
          audience: "Later audience",
          ctaHref: "/classes",
          ctaLabel: "Register",
          startDate: new Date("2026-04-20T00:00:00.000Z"),
          endDate: new Date("2026-04-26T23:59:59.999Z"),
          sortOrder: 2,
        },
        {
          slug: `${SCOPE}-next`,
          title: "Next Week",
          shortDescription: "Next short description",
          audience: "Next audience",
          ctaHref: "/classes",
          ctaLabel: "Register",
          startDate: new Date("2026-03-23T00:00:00.000Z"),
          endDate: new Date("2026-03-29T23:59:59.999Z"),
          sortOrder: 1,
        },
      ],
    });

    const themedWeek = await getScheduleThemedWeek(new Date("2026-03-16T09:00:00.000Z"));

    expect(themedWeek?.slug).toBe(`${SCOPE}-next`);
  });

  it("lists themed weeks in public order", async () => {
    await db.themedWeek.createMany({
      data: [
        {
          slug: `${SCOPE}-two`,
          title: "Week Two",
          shortDescription: "Second",
          audience: "Audience",
          ctaHref: "/classes",
          ctaLabel: "Register",
          startDate: new Date("2026-04-20T00:00:00.000Z"),
          endDate: new Date("2026-04-26T23:59:59.999Z"),
          sortOrder: 2,
        },
        {
          slug: `${SCOPE}-one`,
          title: "Week One",
          shortDescription: "First",
          audience: "Audience",
          ctaHref: "/classes",
          ctaLabel: "Register",
          startDate: new Date("2026-03-23T00:00:00.000Z"),
          endDate: new Date("2026-03-29T23:59:59.999Z"),
          sortOrder: 1,
        },
      ],
    });

    const themedWeeks = await listPublicThemedWeeks();

    expect(themedWeeks.filter((week) => week.slug.startsWith(`${SCOPE}-`)).map((week) => week.slug)).toEqual([
      `${SCOPE}-one`,
      `${SCOPE}-two`,
    ]);
  });
});

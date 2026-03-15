import { describe, expect, it } from "vitest";
import { selectScheduleThemedWeek } from "@/lib/classes/public-page-helpers";

describe("selectScheduleThemedWeek", () => {
  it("returns the nearest future themed week by start date", () => {
    const result = selectScheduleThemedWeek(
      [
        {
          id: "later",
          slug: "later",
          title: "Later Week",
          shortDescription: "",
          audience: "",
          ctaHref: "/schedule",
          ctaLabel: "Register",
          startDate: "2026-04-20T00:00:00.000Z",
          endDate: "2026-04-26T00:00:00.000Z",
          sortOrder: 1,
        },
        {
          id: "next",
          slug: "next",
          title: "Next Week",
          shortDescription: "",
          audience: "",
          ctaHref: "/schedule",
          ctaLabel: "Register",
          startDate: "2026-03-23T00:00:00.000Z",
          endDate: "2026-03-29T00:00:00.000Z",
          sortOrder: 0,
        },
      ],
      new Date("2026-03-15T09:00:00.000Z")
    );

    expect(result?.slug).toBe("next");
  });

  it("returns the active themed week ahead of future ones", () => {
    const result = selectScheduleThemedWeek(
      [
        {
          id: "future",
          slug: "future",
          title: "Future Week",
          shortDescription: "",
          audience: "",
          ctaHref: "/schedule",
          ctaLabel: "Register",
          startDate: "2026-03-23T00:00:00.000Z",
          endDate: "2026-03-29T00:00:00.000Z",
          sortOrder: 1,
        },
        {
          id: "current",
          slug: "current",
          title: "Current Week",
          shortDescription: "",
          audience: "",
          ctaHref: "/schedule",
          ctaLabel: "Register",
          startDate: "2026-03-09T00:00:00.000Z",
          endDate: "2026-03-16T00:00:00.000Z",
          sortOrder: 0,
        },
      ],
      new Date("2026-03-15T09:00:00.000Z")
    );

    expect(result?.slug).toBe("current");
  });

  it("returns null when there is no upcoming themed week", () => {
    const result = selectScheduleThemedWeek(
      [
        {
          id: "past",
          slug: "past",
          title: "Past Week",
          shortDescription: "",
          audience: "",
          ctaHref: "/schedule",
          ctaLabel: "Register",
          startDate: "2026-03-01T00:00:00.000Z",
          endDate: "2026-03-07T00:00:00.000Z",
          sortOrder: 0,
        },
      ],
      new Date("2026-03-15T09:00:00.000Z")
    );

    expect(result).toBeNull();
  });
});

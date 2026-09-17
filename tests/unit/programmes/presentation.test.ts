import { describe, it, expect } from "vitest";
import {
  dateRange,
  dateLabel,
  timeLabel,
  sessionLabel,
  publiclyVisible,
  publicAvailability,
  representative,
} from "@/lib/programmes/presentation";
import {
  resolveHubEventPresentation,
  bookingSummary,
  consolidateActions,
  type HubAction,
} from "@/lib/programmes/hub-presentation";
const c = {
  publicVisibility: "listed",
  cohortState: "on_sale" as const,
  confirmedAt: null,
  startDate: new Date("2027-01-25"),
  liveCoachingEndsAt: new Date("2027-02-26"),
  structuredProgrammeEndsAt: new Date("2027-02-27"),
  followUpAccessEndsAt: new Date("2027-03-31T23:00Z"),
  communityOpenAt: new Date("2027-01-22"),
  enrolmentOpen: true,
  enrolmentClosesAt: new Date("2027-01-24T18:00Z"),
};
const now = new Date("2027-01-17");
describe("public programme discovery", () => {
  it("keeps hidden fixtures and expired runs private", () => {
    expect(publiclyVisible({ ...c, publicVisibility: "hidden" }, now)).toBe(false);
    for (const cohortState of ["cancelled", "archived", "follow_up"] as const) {
      const ended = { ...c, cohortState, confirmedAt: new Date("2027-01-18") };
      expect(publiclyVisible(ended, new Date("2027-03-01"))).toBe(false);
    }
    expect(
      publiclyVisible({ ...c, cohortState: "draft", publicVisibility: "coming_soon" }, now)
    ).toBe(true);
    expect(
      publicAvailability({ ...c, cohortState: "draft", publicVisibility: "coming_soon" }, now)
    ).toBe("Coming soon");
  });
  it("prioritises bookable future dates without duplicating the programme", () => {
    const cohorts = [
      { id: "started", startsAt: "2027-01-01", availability: "In progress" },
      { id: "teaser", startsAt: "2027-02-01", availability: "Coming soon" },
      { id: "open", startsAt: "2027-03-01", availability: "Bookings open" },
    ];
    expect(representative(cohorts, now)?.id).toBe("open");
    expect(representative(cohorts.slice(0, 2), now)?.id).toBe("teaser");
    expect(representative(cohorts.slice(0, 1), now)).toBeUndefined();
    expect(publicAvailability(c, now, true)).toBe("Fully booked");
    expect(
      publicAvailability({ ...c, confirmedAt: new Date("2027-01-18") }, new Date("2027-01-25"))
    ).toBe("In progress");
  });
});
describe("human-readable dates", () => {
  it("formats same-day and cross-month dates", () => {
    expect(dateRange("2026-09-18T16:00Z", "2026-09-20T12:00Z")).toBe("18–20 September 2026");
    expect(dateRange("2027-01-25", "2027-02-26")).toBe("25 January–26 February 2027");
    expect(dateRange("2027-01-18T10:00Z", "2027-01-18T13:00Z")).toBe("18 January 2027");
  });
  it("handles London DST and midnight without browser timezone dependence", () => {
    expect(timeLabel("2027-03-28T00:30Z")).toBe("12:30am");
    expect(timeLabel("2027-03-28T01:30Z")).toBe("2:30am");
    expect(dateLabel("2027-03-31T23:00Z")).toBe("1 April 2027");
    expect(sessionLabel("2027-01-27T18:30Z")).toBe("Wednesday 27 January · 6:30pm UK time");
  });
});
describe("action and booking consolidation", () => {
  const action: HubAction = {
    id: "due",
    groupId: "event:one",
    title: "Retreat",
    detail: "Balance due",
    href: "/booking",
    label: "Pay balance",
    rank: 1,
    at: null,
    actionable: true,
  };
  it("chooses one primary action per offering and preserves priority", () => {
    expect(
      consolidateActions([
        { ...action, id: "upcoming", rank: 2 },
        action,
        { ...action, id: "health", groupId: "programme:two", rank: 0 },
      ]).map((a) => a.id)
    ).toEqual(["health", "due"]);
  });
  const booking = {
    id: "one",
    purchaserUserId: "buyer",
    attendeeUserId: "guest",
    attendeeCount: 2,
    attendees: [{ userId: "guest" }],
    bookingStatus: "deposit_paid",
    paymentStatus: "deposit_paid",
    balanceAmountPence: 10000,
    balancePaidPence: 0,
    balanceDueAt: new Date("2027-01-16"),
    instalments: [],
  };
  it("separates due and outstanding, and protects purchaser-only payment actions", () => {
    expect(bookingSummary(booking, "buyer", now)).toMatchObject({
      due: true,
      attendeeCount: 2,
      status: "Balance due",
    });
    expect(bookingSummary(booking, "guest", now)).toMatchObject({
      due: false,
      canPay: false,
      attendeeCount: 1,
    });
    expect(
      bookingSummary({ ...booking, balanceDueAt: new Date("2027-02-01") }, "buyer", now)
    ).toMatchObject({ outstanding: true, due: false });
    expect(bookingSummary({ ...booking, bookingStatus: "cancelled" }, "buyer", now)).toMatchObject({
      active: false,
      due: false,
      outstanding: false,
    });
  });
  it("respects instalment dates instead of a stale overall balance deadline", () => {
    expect(
      bookingSummary(
        {
          ...booking,
          instalments: [{ status: "pending", dueAt: new Date("2027-02-01"), amountPence: 10000 }],
        },
        "buyer",
        now
      ).due
    ).toBe(false);
  });
});

describe("event card identity", () => {
  const date = {
    retreatSlug: "stirling",
    retreatType: "in_person",
    eventKind: "residential_retreat",
    experience: null,
  };
  it("uses the existing CMS image, crop and category for legacy bookings", () => {
    expect(
      resolveHubEventPresentation(date, [
        {
          slug: "stirling",
          imageUrl: "https://images.example.test/stirling.jpg",
          imageAlt: "Stirling venue",
          imageFocalPoint: { x: 30, y: 70 },
          experienceType: "in_person_workshop",
        },
      ])
    ).toEqual({
      image: "https://images.example.test/stirling.jpg",
      imageAlt: "Stirling venue",
      imagePosition: "30% 70%",
      type: "Workshop",
    });
  });
  it("prefers the published event image and supports local assets", () => {
    const result = resolveHubEventPresentation(
      {
        ...date,
        experience: {
          publishedContentJson: {
            image: { url: "/images/venue.jpg", alt: "Venue", focalPoint: { x: 20, y: 40 } },
          },
        },
      },
      [
        {
          slug: "stirling",
          imageUrl: "https://images.example.test/old.jpg",
          experienceType: "in_person_workshop",
        },
      ]
    );
    expect(result).toEqual({
      image: "/images/venue.jpg",
      imageAlt: "Venue",
      imagePosition: "20% 40%",
      type: "Retreat",
    });
  });
});

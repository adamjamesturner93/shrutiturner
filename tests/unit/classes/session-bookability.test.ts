import { describe, expect, it } from "vitest";
import {
  getBookingEntitlementText,
  isSessionUnavailableForBooking,
  resolveSessionStart,
} from "@/lib/classes/session-bookability";

describe("session bookability helpers", () => {
  it("treats explicitly cancelled sessions as unavailable", () => {
    expect(
      isSessionUnavailableForBooking({
        status: "cancelled",
        startsAtUtc: "2099-03-24T19:00:00.000Z",
        attendeeCount: 3,
      })
    ).toBe(true);
  });

  it("closes empty sessions inside the configured cutoff window", () => {
    expect(
      isSessionUnavailableForBooking(
        {
          attendeeCount: 0,
          emptyClassAutoCancelWindowMinutes: 180,
          startsAtUtc: "2099-03-24T19:00:00.000Z",
          status: "scheduled",
        },
        new Date("2099-03-24T16:30:00.000Z")
      )
    ).toBe(true);
  });

  it("keeps future sessions available when they are outside the cutoff window", () => {
    expect(
      isSessionUnavailableForBooking(
        {
          attendeeCount: 0,
          emptyClassAutoCancelWindowMinutes: 180,
          startsAtUtc: "2099-03-24T19:00:00.000Z",
          status: "scheduled",
        },
        new Date("2099-03-24T15:30:00.000Z")
      )
    ).toBe(false);
  });

  it("prefers the concrete session start over a fallback weekday/time guess", () => {
    const startsAt = resolveSessionStart(
      {
        startsAtUtc: "2099-03-24T19:00:00.000Z",
        day: "Wednesday",
        time: "19:00",
      },
      new Date("2099-03-23T10:00:00.000Z")
    );

    expect(startsAt?.toISOString()).toBe("2099-03-24T19:00:00.000Z");
  });

  it("returns membership-aware booking footer copy", () => {
    expect(
      getBookingEntitlementText({
        hasMembership: true,
        membershipClassesRemaining: 1,
        totalCredits: 4,
      })
    ).toBe("Included with membership · 1 class left this week");

    expect(
      getBookingEntitlementText({
        hasMembership: false,
        membershipClassesRemaining: 0,
        totalCredits: 1,
      })
    ).toBe("1 credit available");
  });
});

import { RetreatEventKind } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getDefaultEventKind,
  getLegacyRetreatType,
  getRetreatEventCapabilities,
  isRetreatEventKind,
} from "@/lib/retreats/event-capabilities";

describe("retreat event capabilities", () => {
  it.each([
    [RetreatEventKind.residential_retreat, "room", true, true, false, true],
    [RetreatEventKind.day_retreat, "ticket", false, true, false, false],
    [RetreatEventKind.in_person_workshop, "ticket", false, true, false, false],
    [RetreatEventKind.online_workshop, "ticket", false, false, true, false],
  ] as const)(
    "maps %s to its operational requirements",
    (kind, admission, accommodation, venue, liveRoom, multipleGuests) => {
      expect(getRetreatEventCapabilities(kind)).toMatchObject({
        admission,
        requiresAccommodation: accommodation,
        requiresVenue: venue,
        usesLiveRoom: liveRoom,
        allowsMultipleGuests: multipleGuests,
      });
    }
  );

  it("keeps legacy retreat types at the compatibility boundary", () => {
    expect(getLegacyRetreatType(RetreatEventKind.online_workshop)).toBe("online");
    expect(getLegacyRetreatType(RetreatEventKind.day_retreat)).toBe("in_person");
    expect(getDefaultEventKind("online")).toBe(RetreatEventKind.online_workshop);
    expect(isRetreatEventKind("day_retreat")).toBe(true);
    expect(isRetreatEventKind("course")).toBe(false);
  });
});

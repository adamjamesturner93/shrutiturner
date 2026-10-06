import { describe, expect, it } from "vitest";
import { groupRoomChoices, roomBedLabel, selectCompatibleRoom } from "@/lib/retreats/room-choice";
import type { RetreatRoomOptionContent } from "@/lib/content/types";
const room = (
  id: string,
  values: Partial<RetreatRoomOptionContent> = {}
): RetreatRoomOptionContent => ({
  id,
  label: id,
  description: "",
  type: "shared_twin",
  bookingUnit: "bed_space",
  guestsIncluded: 1,
  capacity: 2,
  availableSpots: 2,
  normalPricePence: 45000,
  bathroomType: "private",
  ...values,
});
describe("room category presentation", () => {
  it("fills a partly occupied shared room before opening an empty room at the same price", () => {
    const empty = room("empty", { bedSetup: "fixed_twin" });
    const occupied = room("occupied", {
      bedSetup: "convertible_double_twin",
      sharedBedsInOccupiedRooms: 1,
      availableSpots: 1,
    });
    expect(selectCompatibleRoom([empty, occupied], 1)?.id).toBe("occupied");
    expect(selectCompatibleRoom([empty, { ...occupied, normalPricePence: 50000 }], 1)?.id).toBe(
      "empty"
    );
  });
  it("groups beds without losing their individual booking identifiers", () => {
    const groups = groupRoomChoices([
      room("twin"),
      room("convertible"),
      room("shared", { bathroomType: "shared", normalPricePence: 42500 }),
      room("private", { bookingUnit: "whole_room", normalPricePence: 55000 }),
    ]);
    expect(groups).toHaveLength(3);
    expect(groups[0].options.map((x) => x.id)).toEqual(["twin", "convertible"]);
    expect(groups[0].label).toBe("Shared room · Private bathroom");
    expect(groups[0].pricePence).toBe(45000);
  });
  it("excludes sold-out cheaper rates from advertised available prices and retains disabled categories", () => {
    const groups = groupRoomChoices([
      room("sold", { availableSpots: 0, normalPricePence: 10000 }),
      room("available"),
      room("private", { bookingUnit: "whole_room", isWaitlistOnly: true }),
    ]);
    expect(groups[0].pricePence).toBe(45000);
    expect(groups[1].available).toBe(false);
  });
  it("uses private room totals for occupancy pricing, including early bird rates", () => {
    const group = groupRoomChoices([
      room("private", {
        bookingUnit: "whole_room",
        ratePlans: [
          {
            guestCount: 1,
            totalPricePence: 55000,
            earlyBirdPricePence: 50000,
            earlyBirdEndsAt: "2099-01-01",
          },
          { guestCount: 2, totalPricePence: 90000 },
        ],
      }),
    ])[0];
    expect(group.pricePence).toBe(50000);
    expect(group.fromPrice).toBe(true);
  });
  it("never infers a bathroom from a room name and labels beds separately", () => {
    expect(groupRoomChoices([room("Private Bathroom", { bathroomType: null })])[0].label).toContain(
      "to be confirmed"
    );
    expect(roomBedLabel(room("Original long label", { bedSetup: "convertible_double_twin" }))).toBe(
      "King or twin beds"
    );
  });
});

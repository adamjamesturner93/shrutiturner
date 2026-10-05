import { describe, expect, it } from "vitest";
import { getRetreatCheckoutAcceptanceTypes } from "@/lib/retreats/checkout-acceptances";

describe("checkout acceptance requirements and recorded evidence", () => {
  it("never records health-data consent for lightweight online checkout", () => {
    expect(
      getRetreatCheckoutAcceptanceTypes({
        purchaseMode: "self",
        requiresPracticalRegistration: false,
      })
    ).toEqual(["terms"]);
  });
  it("defers in-person participation agreements to attendee onboarding", () => {
    expect(
      getRetreatCheckoutAcceptanceTypes({
        purchaseMode: "self",
        requiresPracticalRegistration: true,
      })
    ).toEqual(["terms"]);
  });
  it.each([true, false])(
    "only records purchaser terms for gifts (practical=%s)",
    (requiresPracticalRegistration) => {
      expect(
        getRetreatCheckoutAcceptanceTypes({ purchaseMode: "gift", requiresPracticalRegistration })
      ).toEqual(["terms"]);
    }
  );
});

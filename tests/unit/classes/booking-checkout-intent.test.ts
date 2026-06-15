import { describe, expect, it } from "vitest";
import {
  buildBookingCheckoutReturnPath,
  createBookingCheckoutIntent,
  parseBookingCheckoutIntent,
} from "@/lib/classes/booking-checkout-intent";

describe("booking checkout intent", () => {
  it("builds a class return path that preserves autobook context", () => {
    expect(
      buildBookingCheckoutReturnPath({
        pathname: "/dashboard/classes/hiit",
        search: "sessionId=session_123&wk=1",
        classSlug: "hiit",
        sessionId: "session_123",
        checkoutStatus: "success",
      })
    ).toBe(
      "/dashboard/classes/hiit?sessionId=session_123&wk=1&checkout=success&autobook=1&autobookClass=hiit&autobookSessionId=session_123"
    );
  });

  it("keeps a valid stored intent until it expires", () => {
    const intent = createBookingCheckoutIntent({
      classSlug: "hiit",
      sessionId: "session_123",
      returnPath: "/dashboard/classes/hiit?checkout=success",
      now: 1000,
      ttlMs: 5000,
    });

    expect(parseBookingCheckoutIntent(JSON.stringify(intent), 2000)).toEqual(intent);
    expect(parseBookingCheckoutIntent(JSON.stringify(intent), 7000)).toBeNull();
  });
});

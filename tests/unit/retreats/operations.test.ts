import { describe, expect, it } from "vitest";
import { getBookingBalance, isConfirmedRetreatBooking } from "@/lib/retreats/operations";
import { bookingGuests } from "@/components/admin/retreat-operations";
import type { AdminRetreatDetailDto } from "@/lib/api/types";
describe("operational counts", () => {
  it("excludes pending and cancelled bookings from confirmed totals", () => {
    expect(isConfirmedRetreatBooking("pending")).toBe(false);
    expect(isConfirmedRetreatBooking("cancelled")).toBe(false);
    expect(isConfirmedRetreatBooking("balance_due")).toBe(true);
  });
  it("separates partial outstanding and overdue instalments", () => {
    expect(
      getBookingBalance(
        {
          totalPricePence: 91000,
          depositPaidPence: 18200,
          balancePaidPence: 10000,
          instalments: [
            {
              id: "1",
              kind: "balance",
              label: "Balance",
              sequence: 2,
              status: "pending",
              amountPence: 72800,
              dueAt: "2026-09-01",
              paidAt: null,
            },
          ],
        },
        new Date("2026-09-09")
      )
    ).toEqual({ outstandingPence: 62800, overduePence: 62800 });
  });
  it("represents every reserved person even if guest details have not arrived", () => {
    const booking = {
      id: "b1",
      attendeeCount: 2,
      attendeeName: "Alex",
      attendeeEmail: "alex@example.com",
      attendees: [],
    } as AdminRetreatDetailDto["bookings"][number];
    const guests = bookingGuests(booking);
    expect(guests).toHaveLength(2);
    expect(guests[1].missing).toEqual(["guest_details"]);
    expect(guests[1].complete).toBe(false);
  });
});

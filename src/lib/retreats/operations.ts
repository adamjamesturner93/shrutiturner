import type { AdminRetreatDetailDto } from "@/lib/api/types";

export const CONFIRMED_RETREAT_STATUSES = ["deposit_paid", "balance_due", "paid_in_full"];
export function isConfirmedRetreatBooking(status: string) {
  return CONFIRMED_RETREAT_STATUSES.includes(status);
}

export function getBookingBalance(
  booking: Pick<
    AdminRetreatDetailDto["bookings"][number],
    "instalments" | "totalPricePence" | "depositPaidPence" | "balancePaidPence"
  >,
  now = new Date()
) {
  const outstandingPence = Math.max(
    0,
    booking.totalPricePence - booking.depositPaidPence - booking.balancePaidPence
  );
  const pending = booking.instalments.filter((item) => item.status === "pending");
  const overduePence = Math.min(
    outstandingPence,
    pending
      .filter((item) => item.dueAt && new Date(item.dueAt) < now)
      .reduce((sum, item) => sum + item.amountPence, 0)
  );
  return { outstandingPence, overduePence };
}

export const REGISTRATION_LABELS: Record<string, string> = {
  guest_details: "Guest details needed",
  account: "Sign in to link your place",
  verified_email: "Verify email",
  name: "Name",
  date_of_birth: "Date of birth",
  health_profile: "Health declaration",
  terms: "Terms",
  health_waiver: "Health agreement",
  health_data: "Health-data consent",
  practical_details: "Confirm contact, dietary and access details",
};

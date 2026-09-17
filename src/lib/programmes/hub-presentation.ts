export type HubAction = {
  id: string;
  groupId: string;
  title: string;
  detail: string;
  href: string;
  label: string;
  rank: number;
  at: string | null;
  actionable: boolean;
  timezone?: string;
  online?: boolean;
  location?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};
export function consolidateActions(actions: HubAction[]) {
  const grouped = new Map<string, HubAction>();
  for (const action of [...actions].sort(
    (a, b) => a.rank - b.rank || (a.at || "").localeCompare(b.at || "")
  )) {
    if (!grouped.has(action.groupId)) grouped.set(action.groupId, action);
  }
  return [...grouped.values()];
}
export type EventBookingSummary = {
  id: string;
  purchaserUserId: string | null;
  attendeeUserId: string | null;
  attendeeCount: number;
  attendees: { userId: string | null }[];
  bookingStatus: string;
  paymentStatus: string;
  balanceAmountPence: number;
  balancePaidPence: number;
  balanceDueAt: Date | null;
  instalments: { status: string; dueAt: Date | null; amountPence: number }[];
};
export function bookingSummary(b: EventBookingSummary, userId: string, now: Date) {
  const inactive = ["cancelled", "refunded"].includes(b.bookingStatus);
  const purchaser = b.purchaserUserId === userId;
  const outstanding =
    !inactive && b.balanceAmountPence > b.balancePaidPence && b.paymentStatus !== "paid_in_full";
  const unpaid = b.instalments.filter((i) => ["pending", "overdue", "failed"].includes(i.status));
  const due =
    outstanding &&
    (unpaid.length
      ? unpaid.some((i) => i.dueAt && i.dueAt <= now)
      : b.balanceDueAt
        ? b.balanceDueAt <= now
        : b.bookingStatus === "balance_due");
  return {
    id: b.id,
    reference: `Booking ${b.id.slice(-8).toUpperCase()}`,
    attendeeCount: purchaser ? Math.max(1, b.attendeeCount) : 1,
    active: !inactive,
    outstanding: purchaser && outstanding,
    due: purchaser && due,
    canPay: purchaser && outstanding,
    status: inactive
      ? b.bookingStatus === "refunded"
        ? "Refunded"
        : "Cancelled"
      : due && purchaser
        ? "Balance due"
        : outstanding
          ? "Balance outstanding"
          : b.paymentStatus === "paid_in_full"
            ? "Paid in full"
            : "Booking confirmed",
    href: `/dashboard/retreats/${b.id}`,
  };
}

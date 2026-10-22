/** Historical services remain available only for accounts with relevant records. */
export function hasLegacyServices(member: {
  hasLegacyServices?: boolean;
  membershipPlan: string | null;
  creditBalance: number;
  totalBookings: number;
  creditHistory?: readonly unknown[];
}) {
  return Boolean(
    member.hasLegacyServices ||
    (member.membershipPlan && member.membershipPlan !== "instructor") ||
    member.creditBalance !== 0 ||
    member.totalBookings > 0 ||
    member.creditHistory?.length
  );
}

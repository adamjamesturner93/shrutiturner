import { AcceptanceType } from "@prisma/client";

export function getRetreatCheckoutAcceptanceTypes(input: {
  purchaseMode: "self" | "gift";
  requiresPracticalRegistration: boolean;
}): AcceptanceType[] {
  // Participation agreements belong to the authenticated attendee after purchase.
  // Retain the input contract for callers handling different event/purchase modes.
  void input;
  return [AcceptanceType.terms];
}

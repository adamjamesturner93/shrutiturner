import { AcceptanceType } from "@prisma/client";

export function getRetreatCheckoutAcceptanceTypes(input: {
  purchaseMode: "self" | "gift";
  requiresPracticalRegistration: boolean;
}): AcceptanceType[] {
  if (input.purchaseMode === "gift") return [AcceptanceType.terms];
  return input.requiresPracticalRegistration
    ? [AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data]
    : [AcceptanceType.terms];
}

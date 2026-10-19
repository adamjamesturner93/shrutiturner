"use client";
import { recalledPlan, track } from "./client";
import { eventType } from "./contracts";

const confirmedEnquiries = new Set<string>();

export function trackConfirmedEnquiry(
  confirmation: { ok?: boolean; id?: string } | null,
  honeypot: string
) {
  if (!confirmation?.ok || !confirmation.id || honeypot || confirmedEnquiries.has(confirmation.id))
    return;
  confirmedEnquiries.add(confirmation.id);
  track("generate_lead", {
    service_type: "coaching",
    form_location: "coaching_enquire",
    plan_interest: recalledPlan(),
  });
}
export function trackStartedCheckout(input: {
  slug: string;
  kind?: string;
  amountPence?: number | null;
  checkoutKey?: string;
}) {
  track(
    "begin_checkout",
    {
      event_id: input.slug,
      event_type: eventType(input.kind),
      currency: "GBP",
      ...(typeof input.amountPence === "number" &&
      Number.isSafeInteger(input.amountPence) &&
      input.amountPence >= 0
        ? { value: input.amountPence / 100 }
        : {}),
    },
    input.checkoutKey
  );
}

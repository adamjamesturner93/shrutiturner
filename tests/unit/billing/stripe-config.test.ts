import { describe, expect, it } from "vitest";
import { STRIPE_API_VERSION, STRIPE_WEBHOOK_EVENTS } from "@/lib/billing/stripe-config";

describe("stripe config", () => {
  it("pins the runtime Stripe API version to the production webhook version", () => {
    expect(STRIPE_API_VERSION).toBe("2026-05-27.dahlia");
  });

  it("documents the Stripe webhook events required by the current billing flows", () => {
    expect(STRIPE_WEBHOOK_EVENTS).toEqual([
      "checkout.session.completed",
      "invoice.paid",
      "invoice.payment_failed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.created",
      "customer.updated",
      "customer.deleted",
      "promotion_code.updated",
      "charge.dispute.created",
      "charge.dispute.updated",
      "charge.dispute.closed",
    ]);
  });
});

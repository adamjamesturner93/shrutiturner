export const STRIPE_API_VERSION = "2026-05-27.dahlia" as const;

export const STRIPE_WEBHOOK_EVENTS = [
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
] as const;

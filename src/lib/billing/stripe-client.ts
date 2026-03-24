import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!stripeSingleton) {
    const timeout = Math.max(1000, Number(process.env.STRIPE_REQUEST_TIMEOUT_MS || "4000"));
    stripeSingleton = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
      timeout,
    });
  }
  return stripeSingleton;
}

import Stripe from "stripe";
import { STRIPE_API_VERSION } from "@/lib/billing/stripe-config";
import { env } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function getStripeClient() {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!stripeSingleton) {
    const timeout = Math.max(1000, env.STRIPE_REQUEST_TIMEOUT_MS);
    stripeSingleton = new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
      timeout,
    });
  }
  return stripeSingleton;
}

import Stripe from "stripe";
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
      apiVersion: "2025-08-27.basil",
      typescript: true,
      timeout,
    });
  }
  return stripeSingleton;
}

import { programmeTestRuntime } from "@/lib/programmes/test-runtime";
import Stripe from "stripe";
import { STRIPE_API_VERSION } from "@/lib/billing/stripe-config";
import { env } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function getStripeClient() {
  const testProvider = programmeTestRuntime() ? process.env.PROGRAMME_TEST_PROVIDER_URL : undefined;
  if (testProvider) {
    const url = new URL(testProvider);
    if (url.hostname !== "127.0.0.1") throw new Error("LOCAL_TEST_PROVIDER_REQUIRED");
    return new Stripe("sk_test_programme_fixture", {
      apiVersion: STRIPE_API_VERSION,
      host: url.hostname,
      port: Number(url.port),
      protocol: "http",
      maxNetworkRetries: 0,
    });
  }
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

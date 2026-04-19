import { db } from "@/lib/db";
import { env, getPostmarkToken } from "@/lib/env";
import { getPostmarkClient } from "@/lib/postmark/client";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { getContentfulConfig } from "@/lib/content/config";
import { apiOk, handleApiRoute } from "@/lib/api/route";

async function checkDatabase() {
  await db.$queryRaw`SELECT 1`;
  return { ok: true as const };
}

async function checkStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    return { ok: false as const, configured: false, message: "STRIPE_NOT_CONFIGURED" };
  }

  await getStripeClient().balance.retrieve();
  return { ok: true as const, configured: true };
}

async function checkPostmark() {
  const token = getPostmarkToken();
  if (!token) {
    return { ok: false as const, configured: false, message: "POSTMARK_NOT_CONFIGURED" };
  }

  await fetch("https://api.postmarkapp.com/server", {
    headers: {
      "X-Postmark-Server-Token": token,
      Accept: "application/json",
    },
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`POSTMARK_${response.status}`);
    }
  });

  getPostmarkClient();
  return { ok: true as const, configured: true };
}

async function checkContentful() {
  const config = getContentfulConfig();
  if (!config) {
    return { ok: false as const, configured: false, message: "CONTENTFUL_NOT_CONFIGURED" };
  }

  const response = await fetch(
    `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${config.environment}`,
    {
      headers: {
        Authorization: `Bearer ${config.deliveryToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`CONTENTFUL_${response.status}`);
  }

  return { ok: true as const, configured: true };
}

async function runCheck(name: string, check: () => Promise<Record<string, unknown>>) {
  try {
    return [name, await check()] as const;
  } catch (error) {
    return [
      name,
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "CHECK_FAILED",
      },
    ] as const;
  }
}

export const GET = handleApiRoute(
  async () => {
    const checks = Object.fromEntries(
      await Promise.all([
        runCheck("database", checkDatabase),
        runCheck("stripe", checkStripe),
        runCheck("postmark", checkPostmark),
        runCheck("contentful", checkContentful),
      ])
    );

    return apiOk({
      status: Object.values(checks).every((entry) => entry.ok === true) ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      checks,
    });
  },
  { auth: "owner_admin" }
);

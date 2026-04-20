import { db } from "@/lib/db";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import {
  contentfulCmsProvider,
  dailyVideoProvider,
  postmarkEmailProvider,
  stripePaymentProvider,
} from "@/lib/integrations/providers";

type HealthCheckResult = {
  ok: boolean;
  configured?: boolean;
  message?: string;
};

async function checkDatabase() {
  await db.$queryRaw`SELECT 1`;
  return { ok: true as const } satisfies HealthCheckResult;
}

async function runCheck(name: string, check: () => Promise<HealthCheckResult>) {
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
        runCheck("stripe", () => stripePaymentProvider.verifyConnection()),
        runCheck("postmark", () => postmarkEmailProvider.verifyConnection()),
        runCheck("daily", () => dailyVideoProvider.verifyConnection()),
        runCheck("contentful", () => contentfulCmsProvider.verifyConnection()),
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

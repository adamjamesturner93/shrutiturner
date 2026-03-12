import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const from = startOfUtcDay(date);
  return new Date(from.getTime() + 86400000);
}

function extractPaidAmountPence(payloadJson: unknown, type: string) {
  if (!payloadJson || typeof payloadJson !== "object" || Array.isArray(payloadJson)) return 0;
  const root = payloadJson as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
  const obj = (data as Record<string, unknown>).object;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;
  const o = obj as Record<string, unknown>;
  if (type === "invoice.paid") return typeof o.amount_paid === "number" ? o.amount_paid : 0;
  if (type === "checkout.session.completed") return typeof o.amount_total === "number" ? o.amount_total : 0;
  return 0;
}

async function recomputeDay(prisma: PrismaClient, day: Date) {
  const from = startOfUtcDay(day);
  const to = endOfUtcDay(day);
  const [paidEvents, failedPaymentsCount, activeSubscriptions, churnedMembersCount] = await Promise.all([
    prisma.billingEvent.findMany({
      where: {
        status: "processed",
        type: { in: ["invoice.paid", "checkout.session.completed"] },
        processedAt: { gte: from, lt: to },
      },
      select: { type: true, payloadJson: true },
    }),
    prisma.billingEvent.count({
      where: {
        status: "processed",
        type: "invoice.payment_failed",
        processedAt: { gte: from, lt: to },
      },
    }),
    prisma.membershipSubscription.findMany({
      where: { status: { in: ["active", "past_due"] } },
      select: { pricePence: true },
    }),
    prisma.membershipSubscription.count({
      where: {
        status: { in: ["cancelled", "expired"] },
        updatedAt: { gte: from, lt: to },
      },
    }),
  ]);

  const cashCollectedPence = paidEvents.reduce(
    (sum, event) => sum + extractPaidAmountPence(event.payloadJson, event.type),
    0
  );
  const mrrPence = activeSubscriptions.reduce((sum, row) => sum + row.pricePence, 0);

  await prisma.billingMetricDaily.upsert({
    where: { date: from },
    create: {
      date: from,
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: activeSubscriptions.length,
      mrrPence,
      churnedMembersCount,
    },
    update: {
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: activeSubscriptions.length,
      mrrPence,
      churnedMembersCount,
    },
  });
}

async function main() {
  loadEnv();
  const days = Math.max(1, Number(process.env.STRIPE_METRIC_SYNC_DAYS || "30"));
  const prisma = new PrismaClient();

  for (let i = 0; i < days; i += 1) {
    const day = new Date(Date.now() - i * 86400000);
    await recomputeDay(prisma, day);
  }

  console.log(`Stripe metric sync complete for ${days} day(s).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Stripe metrics sync failed:", error);
  process.exitCode = 1;
});

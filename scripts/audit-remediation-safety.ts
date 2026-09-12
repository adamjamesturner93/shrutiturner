import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Intentionally read-only and local-only. No provider calls and no automatic repair.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const target = new URL(connectionString);
if (!["localhost", "127.0.0.1"].includes(target.hostname)) throw new Error("This audit is local-only");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const campaigns = await db.emailCampaign.findMany({
    where: { status: { not: "sent" }, contentfulEntryId: { not: null } },
    select: { id: true, status: true, audienceSnapshotJson: true, audiencePreparedAt: true,
      processingLeaseExpiresAt: true, emailDeliveries: { where: { status: "sending" }, select: { id: true } } },
  });
  const imports = await db.retreatExperience.findMany({
    where: { sourceContentfulEntryId: { not: null } },
    select: { id: true, revision: true, sourceContentfulSpaceId: true, sourceContentfulEnvironment: true,
      sourceContentfulLocale: true, sourceContentfulHash: true },
  });
  const refunds = await db.billingRefund.findMany({
    where: { status: "pending", stripeRefundId: null, refundedAsCredit: false },
    select: { id: true, createdAt: true },
  });
  console.log(JSON.stringify({
    mode: "read-only", database: "local",
    campaigns: campaigns.map((row) => ({ id: row.id, status: row.status,
      missingFrozenAudience: !Array.isArray(row.audienceSnapshotJson),
      preparationIncomplete: !row.audiencePreparedAt,
      ambiguousDeliveries: row.emailDeliveries.map((delivery) => delivery.id),
      leasePresent: Boolean(row.processingLeaseExpiresAt) })),
    importsRequiringProvenanceReview: imports.filter((row) => !row.sourceContentfulSpaceId ||
      !row.sourceContentfulEnvironment || !row.sourceContentfulLocale || !row.sourceContentfulHash)
      .map((row) => ({ id: row.id, revision: row.revision })),
    unresolvedRefunds: refunds.map((row) => ({ id: row.id,
      requiresProviderReconciliation: Date.now() - row.createdAt.getTime() >= 23 * 3600000 })),
  }, null, 2));
} finally { await db.$disconnect(); }

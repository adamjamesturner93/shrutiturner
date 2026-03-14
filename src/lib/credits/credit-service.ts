import { CreditEntryType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function getCreditLedger(userId: string) {
  return db.creditLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCreditBalance(userId: string) {
  const aggregate = await db.creditLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return aggregate._sum.amount || 0;
}

export async function getCreditSummary(userId: string) {
  const rows = await db.creditLedgerEntry.findMany({
    where: { userId, amount: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    select: {
      sourceRef: true,
      description: true,
      amount: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const summaries = rows.map((row) => ({
    sourceId: row.sourceRef || `source_${row.createdAt.getTime()}`,
    sourceLabel: row.description,
    remaining: row.amount,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : null,
  }));

  return summaries;
}

export async function addCredits({
  userId,
  amount,
  description,
  sourceRef,
  expiresAt,
  type = CreditEntryType.purchase,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  stripeInvoiceId,
  createdByUserId,
}: {
  userId: string;
  amount: number;
  description: string;
  sourceRef?: string;
  expiresAt?: Date;
  type?: CreditEntryType;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  createdByUserId?: string;
}) {
  if (amount <= 0) throw new Error("CREDIT_AMOUNT_MUST_BE_POSITIVE");
  return db.creditLedgerEntry.create({
    data: {
      userId,
      amount,
      type,
      description,
      sourceRef,
      expiresAt,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      stripeInvoiceId,
      createdByUserId,
    },
  });
}

export async function adjustCredits({
  userId,
  delta,
  reason,
  adminUserId,
}: {
  userId: string;
  delta: number;
  reason: string;
  adminUserId: string;
}) {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("INVALID_CREDIT_DELTA");
  }

  const balance = await getCreditBalance(userId);
  if (delta < 0 && Math.abs(delta) > balance) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  return db.creditLedgerEntry.create({
    data: {
      userId,
      amount: delta,
      type: CreditEntryType.admin_adjustment,
      description: reason,
      sourceRef: `admin_adjustment:${adminUserId}`,
      createdByUserId: adminUserId,
    },
  });
}

export async function consumeOneCreditForBooking({
  userId,
  bookingRef,
  tx = db,
}: {
  userId: string;
  bookingRef: string;
  tx?: Prisma.TransactionClient | typeof db;
}) {
  const aggregate = await tx.creditLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const balance = aggregate._sum.amount || 0;
  if (balance <= 0) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  return tx.creditLedgerEntry.create({
    data: {
      userId,
      amount: -1,
      type: CreditEntryType.booking_use,
      description: "Class booking credit",
      sourceRef: bookingRef,
    },
  });
}

export async function refundOneCreditForBooking({
  userId,
  bookingRef,
  tx = db,
}: {
  userId: string;
  bookingRef: string;
  tx?: Prisma.TransactionClient | typeof db;
}) {
  return tx.creditLedgerEntry.create({
    data: {
      userId,
      amount: 1,
      type: CreditEntryType.booking_refund,
      description: "Class booking refund",
      sourceRef: bookingRef,
    },
  });
}

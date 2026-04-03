import { createHash, randomBytes } from "node:crypto";
import { CreditEntryType, ReferralEventStatus, ReferralLedgerType } from "@prisma/client";
import { db } from "@/lib/db";
import { CREDITS_EXPIRY_DAYS } from "@/lib/billing/price-map";

const REWARD_PENCE = 1000;
const CURRENCY = "GBP";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(4, local.length - 2))}${local.slice(-1)}@${domain}`;
}

function displayFriendLabel(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.firstName) {
    const initial = user.lastName?.[0]?.toUpperCase();
    return `${user.firstName}${initial ? ` ${initial}.` : ""}`;
  }
  return maskEmail(user.email);
}

function fallbackCode(): string {
  return `REF${randomBytes(5).toString("hex").toUpperCase()}`;
}

function deterministicCodeFromUserId(userId: string): string {
  return `REF${createHash("sha256").update(userId).digest("hex").slice(0, 10).toUpperCase()}`;
}

export async function ensureReferralCodeForUser(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  if (user.referralCode) return user.referralCode;

  let candidate = deterministicCodeFromUserId(userId);

  for (let i = 0; i < 5; i += 1) {
    try {
      const updated = await db.user.update({
        where: { id: userId },
        data: { referralCode: candidate },
        select: { referralCode: true },
      });
      if (!updated.referralCode) {
        throw new Error("REFERRAL_CODE_SET_FAILED");
      }
      return updated.referralCode;
    } catch {
      candidate = fallbackCode();
    }
  }

  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

export async function claimReferralCode(userId: string, codeRaw: string) {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false as const, reason: "INVALID_CODE" as const };

  const [user, referrer] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, referredByUserId: true } }),
    db.user.findUnique({ where: { referralCode: code }, select: { id: true, referralCode: true } }),
  ]);

  if (!user) return { ok: false as const, reason: "USER_NOT_FOUND" as const };
  if (!referrer) return { ok: false as const, reason: "CODE_NOT_FOUND" as const };
  if (referrer.id === user.id) return { ok: false as const, reason: "SELF_REFERRAL" as const };

  if (user.referredByUserId && user.referredByUserId !== referrer.id) {
    return { ok: false as const, reason: "ALREADY_CLAIMED_DIFFERENT_REFERRER" as const };
  }

  const event = await db.referralEvent.upsert({
    where: {
      referrerUserId_referredUserId: {
        referrerUserId: referrer.id,
        referredUserId: user.id,
      },
    },
    create: {
      referrerUserId: referrer.id,
      referredUserId: user.id,
      referralCodeSnapshot: referrer.referralCode || code,
      status: ReferralEventStatus.pending_qualification,
    },
    update: {
      referralCodeSnapshot: referrer.referralCode || code,
      status: ReferralEventStatus.pending_qualification,
    },
  });

  if (!user.referredByUserId) {
    await db.user.update({
      where: { id: user.id },
      data: { referredByUserId: referrer.id },
    });
  }

  const giftGranted = await db.$transaction(async (tx) => {
    const marked = await tx.referralEvent.updateMany({
      where: { id: event.id, giftGrantedAt: null },
      data: { giftGrantedAt: new Date() },
    });
    if (marked.count === 0) return false;

    const alreadyGranted = await tx.creditLedgerEntry.findFirst({
      where: {
        userId: user.id,
        sourceRef: `referral:gift:${event.id}`,
      },
      select: { id: true },
    });
    if (alreadyGranted) return false;

    await tx.creditLedgerEntry.create({
      data: {
        userId: user.id,
        amount: 1,
        type: CreditEntryType.promo,
        description: "Referral gift class credit",
        sourceRef: `referral:gift:${event.id}`,
        expiresAt: new Date(Date.now() + CREDITS_EXPIRY_DAYS * 86400000),
      },
    });
    return true;
  });

  return { ok: true as const, eventId: event.id, giftGranted };
}

export async function qualifyReferral({
  eventId,
  referredUserId,
  notes,
}: {
  eventId?: string;
  referredUserId?: string;
  notes?: string;
}) {
  const event = eventId
    ? await db.referralEvent.findUnique({ where: { id: eventId } })
    : referredUserId
      ? await db.referralEvent.findFirst({
          where: { referredUserId },
          orderBy: { createdAt: "desc" },
        })
      : null;

  if (!event) return { ok: false as const, reason: "EVENT_NOT_FOUND" as const };

  const result = await db.$transaction(async (tx) => {
    const existingReward = await tx.referralLedgerEntry.findFirst({
      where: {
        eventId: event.id,
        type: ReferralLedgerType.reward,
      },
      select: { id: true },
    });

    if (existingReward) {
      await tx.referralEvent.update({
        where: { id: event.id },
        data: {
          status: ReferralEventStatus.rewarded,
          qualifiedAt: event.qualifiedAt ?? new Date(),
          rewardedAt: event.rewardedAt ?? new Date(),
          notes: notes || event.notes,
        },
      });
      return { alreadyRewarded: true };
    }

    const now = new Date();
    await tx.referralEvent.update({
      where: { id: event.id },
      data: {
        status: ReferralEventStatus.rewarded,
        qualifiedAt: event.qualifiedAt ?? now,
        rewardedAt: now,
        notes: notes || event.notes,
      },
    });

    await tx.referralLedgerEntry.create({
      data: {
        userId: event.referrerUserId,
        eventId: event.id,
        amountPence: REWARD_PENCE,
        currency: CURRENCY,
        type: ReferralLedgerType.reward,
        description: "Referral reward",
      },
    });

    return { alreadyRewarded: false };
  });

  return {
    ok: true as const,
    eventId: event.id,
    alreadyRewarded: result.alreadyRewarded,
  };
}

export async function getReferralSummary(userId: string, siteUrl: string) {
  const referralCode = await ensureReferralCodeForUser(userId);

  const [events, ledger] = await Promise.all([
    db.referralEvent.findMany({
      where: { referrerUserId: userId },
      include: {
        referredUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        ledgerEntries: {
          select: { amountPence: true, type: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.referralLedgerEntry.findMany({
      where: { userId },
      select: { amountPence: true, type: true },
    }),
  ]);

  const referralBalancePence = ledger.reduce((sum, entry) => sum + entry.amountPence, 0);
  const referralEarnedPence = ledger
    .filter((entry) => entry.type !== ReferralLedgerType.applied && entry.amountPence > 0)
    .reduce((sum, entry) => sum + entry.amountPence, 0);

  const referralCount = events.filter(
    (event) => event.status === ReferralEventStatus.rewarded
  ).length;

  const history = events.map((event) => {
    const amountPence = event.ledgerEntries.reduce((sum, entry) => sum + entry.amountPence, 0);
    const displayName = displayFriendLabel(event.referredUser);

    return {
      id: event.id,
      friend: displayName,
      friendEmailMasked: maskEmail(event.referredUser.email),
      joinedAt: event.referredUser.createdAt.toISOString(),
      status: event.status,
      amountPence,
      qualifiedAt: event.qualifiedAt?.toISOString() || null,
      rewardedAt: event.rewardedAt?.toISOString() || null,
    };
  });

  return {
    referralCode,
    referralLink: `${siteUrl.replace(/\/$/, "")}/r/${referralCode}`,
    referralCount,
    referralEarnedPence,
    referralBalancePence,
    history,
  };
}

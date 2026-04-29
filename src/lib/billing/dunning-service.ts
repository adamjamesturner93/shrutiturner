import {
  MembershipDunningStatus,
  MembershipStatus,
  Prisma,
  SubscriptionComplianceEventKind,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { sendSubscriptionNoticeEmail } from "@/lib/email";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { recordSubscriptionComplianceEvent } from "@/lib/billing/subscription-compliance";

const APP_URL = getBaseSiteUrlFromEnv();
const GRACE_DAYS = 7;
const DAY3_MS = 3 * 86400000;
const DAY6_MS = 6 * 86400000;

type DunningMembership = Prisma.MembershipDunningCaseGetPayload<{
  include: {
    user: { select: { id: true; email: true; firstName: true; name: true } };
    membership: true;
  };
}>;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "the end of your grace period";
}

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function getInvoiceCustomerId(invoice: Stripe.Invoice) {
  return typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
}

export function getDunningGraceEndsAt(firstFailedAt: Date) {
  return addDays(firstFailedAt, GRACE_DAYS);
}

async function sendDunningNotice(params: {
  dunningCase: DunningMembership;
  kind: "initial" | "day3" | "day6" | "suspended" | "recovered";
  eventAt?: Date;
}) {
  const { dunningCase } = params;
  if (!dunningCase.user.email) return null;

  const firstName = dunningCase.user.firstName || dunningCase.user.name || "there";
  const amount = formatMoney(dunningCase.amountDuePence);
  const graceEnd = formatDate(dunningCase.graceExtendedUntil || dunningCase.graceEndsAt);
  const portalUrl = `${APP_URL}/dashboard/membership`;
  const isRecovery = params.kind === "recovered";
  const isSuspended = params.kind === "suspended";

  const subject = isRecovery
    ? "Your Move Well Membership payment is resolved"
    : isSuspended
      ? "Your Move Well Membership access is paused"
      : "Action needed: Move Well Membership payment";
  const preview = isRecovery
    ? "Your membership payment issue has been resolved."
    : isSuspended
      ? "Update your payment details to restore membership access."
      : `Please update your payment details by ${graceEnd}.`;
  const paragraphs = isRecovery
    ? [
        "Thanks, your membership payment issue has been resolved.",
        "Your Move Well Membership access is active again and no further action is needed.",
      ]
    : isSuspended
      ? [
          `We still could not collect the ${amount} membership payment after the grace period ended on ${graceEnd}.`,
          "Membership access is paused until the payment is recovered. You can update your payment method from your membership dashboard.",
        ]
      : [
          `Stripe could not collect your ${amount} Move Well Membership payment.`,
          `Your membership stays active during a ${GRACE_DAYS}-day grace period, currently ending on ${graceEnd}.`,
          "Please update your payment method from your membership dashboard to avoid access being paused.",
        ];

  const result = await sendSubscriptionNoticeEmail({
    email: dunningCase.user.email,
    firstName,
    subject,
    preview,
    title: isRecovery ? "Payment resolved" : isSuspended ? "Access paused" : "Payment issue",
    paragraphs,
    tag: `subscription-dunning-${params.kind}`,
    ctaLabel: isRecovery ? "Open membership" : "Update payment method",
    ctaUrl: portalUrl,
    metadata: {
      dunningCaseId: dunningCase.id,
      membershipId: dunningCase.membershipId,
      stripeInvoiceId: dunningCase.stripeInvoiceId || "",
      kind: params.kind,
    },
  });

  await recordSubscriptionComplianceEvent({
    userId: dunningCase.userId,
    membershipId: dunningCase.membershipId,
    kind: isRecovery
      ? SubscriptionComplianceEventKind.payment_recovery_notice
      : SubscriptionComplianceEventKind.payment_failure_notice,
    status: result.success ? "sent" : "failed",
    channel: "email",
    summary: isRecovery
      ? "Payment recovery notice sent."
      : `Payment failure ${params.kind} notice sent.`,
    metadataJson: {
      dunningCaseId: dunningCase.id,
      stripeInvoiceId: dunningCase.stripeInvoiceId,
      amountDuePence: dunningCase.amountDuePence,
    },
    eventAt: params.eventAt,
  });

  return result;
}

export async function openMembershipDunningFromInvoice(invoice: Stripe.Invoice) {
  const stripeCustomerId = getInvoiceCustomerId(invoice);
  if (!stripeCustomerId) return null;

  const user = await db.user.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });
  if (!user) return null;

  const membership = await db.membershipSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!membership) return null;

  const failedAt = new Date();
  const openCase = await db.membershipDunningCase.findFirst({
    where: {
      membershipId: membership.id,
      status: { in: [MembershipDunningStatus.open, MembershipDunningStatus.suspended] },
    },
    orderBy: { createdAt: "desc" },
  });

  const caseData = {
    stripeInvoiceId: invoice.id || openCase?.stripeInvoiceId || null,
    amountDuePence: invoice.amount_due || openCase?.amountDuePence || 0,
    invoiceUrl: invoice.hosted_invoice_url || openCase?.invoiceUrl || null,
    lastFailedAt: failedAt,
    graceEndsAt:
      openCase?.graceExtendedUntil || openCase?.graceEndsAt || getDunningGraceEndsAt(failedAt),
    status: MembershipDunningStatus.open,
    suspendedAt: null,
    recoveredAt: null,
    cancelledAt: null,
  };

  const dunningCase = openCase
    ? await db.membershipDunningCase.update({
        where: { id: openCase.id },
        data: caseData,
        include: {
          user: { select: { id: true, email: true, firstName: true, name: true } },
          membership: true,
        },
      })
    : await db.membershipDunningCase.create({
        data: {
          userId: user.id,
          membershipId: membership.id,
          firstFailedAt: failedAt,
          ...caseData,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, name: true } },
          membership: true,
        },
      });

  await db.membershipSubscription.update({
    where: { id: membership.id },
    data: { status: MembershipStatus.past_due },
  });

  if (!dunningCase.day0NoticeSentAt) {
    await sendDunningNotice({ dunningCase, kind: "initial", eventAt: failedAt });
    await db.membershipDunningCase.update({
      where: { id: dunningCase.id },
      data: { day0NoticeSentAt: failedAt },
    });
  }

  return dunningCase;
}

export async function recoverMembershipDunningCase(input: {
  userId: string;
  membershipId: string;
  stripeInvoiceId?: string | null;
}) {
  const dunningCase = await db.membershipDunningCase.findFirst({
    where: {
      userId: input.userId,
      membershipId: input.membershipId,
      status: { in: [MembershipDunningStatus.open, MembershipDunningStatus.suspended] },
      ...(input.stripeInvoiceId
        ? { OR: [{ stripeInvoiceId: input.stripeInvoiceId }, { stripeInvoiceId: null }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, firstName: true, name: true } },
      membership: true,
    },
  });
  if (!dunningCase) return null;

  const recoveredAt = new Date();
  const recovered = await db.membershipDunningCase.update({
    where: { id: dunningCase.id },
    data: {
      status: MembershipDunningStatus.recovered,
      recoveredAt,
      cancelledAt: null,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, name: true } },
      membership: true,
    },
  });

  await sendDunningNotice({ dunningCase: recovered, kind: "recovered", eventAt: recoveredAt });
  return recovered;
}

export async function processDueMembershipDunningCases(now = new Date()) {
  const cases = await db.membershipDunningCase.findMany({
    where: {
      status: { in: [MembershipDunningStatus.open, MembershipDunningStatus.suspended] },
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, name: true } },
      membership: true,
    },
  });

  let remindersSent = 0;
  let suspended = 0;

  for (const dunningCase of cases) {
    const graceEndsAt = dunningCase.graceExtendedUntil || dunningCase.graceEndsAt;
    const elapsedMs = now.getTime() - dunningCase.firstFailedAt.getTime();

    if (
      dunningCase.status === MembershipDunningStatus.open &&
      !dunningCase.day3ReminderSentAt &&
      elapsedMs >= DAY3_MS &&
      now < graceEndsAt
    ) {
      await sendDunningNotice({ dunningCase, kind: "day3", eventAt: now });
      await db.membershipDunningCase.update({
        where: { id: dunningCase.id },
        data: { day3ReminderSentAt: now },
      });
      remindersSent += 1;
    }

    if (
      dunningCase.status === MembershipDunningStatus.open &&
      !dunningCase.day6ReminderSentAt &&
      elapsedMs >= DAY6_MS &&
      now < graceEndsAt
    ) {
      await sendDunningNotice({ dunningCase, kind: "day6", eventAt: now });
      await db.membershipDunningCase.update({
        where: { id: dunningCase.id },
        data: { day6ReminderSentAt: now },
      });
      remindersSent += 1;
    }

    if (dunningCase.status === MembershipDunningStatus.open && now >= graceEndsAt) {
      const updated = await db.membershipDunningCase.update({
        where: { id: dunningCase.id },
        data: {
          status: MembershipDunningStatus.suspended,
          suspendedAt: now,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, name: true } },
          membership: true,
        },
      });
      await db.membershipSubscription.update({
        where: { id: dunningCase.membershipId },
        data: { status: MembershipStatus.paused },
      });
      await sendDunningNotice({ dunningCase: updated, kind: "suspended", eventAt: now });
      suspended += 1;
    }
  }

  return { scanned: cases.length, remindersSent, suspended };
}

export async function getActiveDunningCaseForMembership(membershipId: string) {
  return db.membershipDunningCase.findFirst({
    where: {
      membershipId,
      status: { in: [MembershipDunningStatus.open, MembershipDunningStatus.suspended] },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMembershipDunningCases() {
  return db.membershipDunningCase.findMany({
    where: {
      status: { in: [MembershipDunningStatus.open, MembershipDunningStatus.suspended] },
    },
    orderBy: [{ graceEndsAt: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      membership: true,
    },
  });
}

export async function extendMembershipDunningGrace(input: {
  dunningCaseId: string;
  actorUserId: string;
  graceExtendedUntil: Date;
  reason: string;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const existing = await db.membershipDunningCase.findUniqueOrThrow({
    where: { id: input.dunningCaseId },
  });
  const updated = await db.membershipDunningCase.update({
    where: { id: input.dunningCaseId },
    data: {
      status: MembershipDunningStatus.open,
      graceExtendedUntil: input.graceExtendedUntil,
      manualExtensionNote: input.reason,
      suspendedAt: null,
    },
  });
  await db.membershipSubscription.update({
    where: { id: existing.membershipId },
    data: { status: MembershipStatus.past_due },
  });
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "membership_dunning_grace_extended",
    targetType: "membership_dunning_case",
    targetId: input.dunningCaseId,
    reason: input.reason,
    requestId: input.requestId,
    requestPath: input.requestPath,
    requestIp: input.requestIp,
    oldValueJson: {
      graceExtendedUntil: existing.graceExtendedUntil?.toISOString() || null,
      status: existing.status,
    },
    newValueJson: {
      graceExtendedUntil: updated.graceExtendedUntil?.toISOString() || null,
      status: updated.status,
    },
  });

  return updated;
}

export function membershipDunningAccessActive(input: {
  membershipStatus: MembershipStatus;
  dunningCase?: {
    status: MembershipDunningStatus;
    graceEndsAt: Date;
    graceExtendedUntil?: Date | null;
  } | null;
  now?: Date;
}) {
  if (
    input.membershipStatus !== MembershipStatus.active &&
    input.membershipStatus !== MembershipStatus.past_due
  ) {
    return false;
  }
  const dunningCase = input.dunningCase;
  if (!dunningCase) return true;
  if (dunningCase.status === MembershipDunningStatus.suspended) return false;
  const graceEndsAt = dunningCase.graceExtendedUntil || dunningCase.graceEndsAt;
  return (input.now || new Date()) < graceEndsAt;
}

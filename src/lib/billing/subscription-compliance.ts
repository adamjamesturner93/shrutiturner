import {
  BillingRefundStatus,
  MembershipBillingInterval,
  MembershipStatus,
  Prisma,
  SubscriptionComplianceEventKind,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { MEMBERSHIP_TRIAL_DAYS } from "@/lib/billing/price-map";
import {
  ANNUAL_RENEWAL_REMINDER_LEAD_DAYS,
  MONTHLY_REMINDER_INTERVAL_MONTHS,
  TRIAL_REMINDER_LEAD_DAYS,
} from "@/lib/billing/subscription-disclosure";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { sendSubscriptionNoticeEmail } from "@/lib/email";

const APP_URL = getBaseSiteUrlFromEnv();

export type SubscriptionNoticeHistoryItem = {
  id: string;
  kind: SubscriptionComplianceEventKind;
  status: string;
  channel: string;
  summary: string;
  eventAt: string;
};

type RenewalCoolingOffKind = "trial_conversion" | "annual_renewal";
type NoticeMembership = Prisma.MembershipSubscriptionGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        name: true;
      };
    };
  };
}>;
type StripeInvoiceWithPaymentIntent = Awaited<
  ReturnType<ReturnType<typeof getStripeClient>["invoices"]["retrieve"]>
> & {
  payment_intent?: string | { id?: string | null } | null;
};

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function formatDateLabel(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function buildMembershipCheckoutConfirmationCopy(params: {
  billingInterval: MembershipBillingInterval;
  pricePence: number;
  trialEndsAt: Date;
  immediateStartSummary?: string | null;
}) {
  const trialLengthDays = MEMBERSHIP_TRIAL_DAYS;
  const billingStartDate = formatDateLabel(params.trialEndsAt) || "the end of your trial";
  const amountAfterTrial = formatMoney(params.pricePence);
  const cancellationMethod =
    "Cancel online from your Membership dashboard before the trial ends to avoid the first charge.";
  const immediateStartSummary =
    params.immediateStartSummary ||
    "You asked for membership access to start straight away. If you use the service during a cooling-off period, any refund rights are subject to the immediate-start terms shown at checkout.";

  return {
    subject: "Your Move Well Membership trial is active",
    preview: `Your ${trialLengthDays}-day trial is live and billing starts on ${billingStartDate}.`,
    title: "Membership confirmation",
    paragraphs: [
      `Your ${trialLengthDays}-day Move Well Membership trial is now active.`,
      `Billing starts on ${billingStartDate}. If you do not cancel before then, ${amountAfterTrial} will be charged for your first ${params.billingInterval} term.`,
      cancellationMethod,
      immediateStartSummary,
    ],
    metadata: {
      billingInterval: params.billingInterval,
      trialLengthDays: String(trialLengthDays),
      billingStartDate,
      amountAfterTrial,
    },
  };
}

export function getMembershipLifecycleDates(startedAt = new Date()) {
  return {
    trialEndsAt: addDays(startedAt, MEMBERSHIP_TRIAL_DAYS),
    initialCoolingOffEndsAt: addDays(startedAt, 14),
  };
}

export function isInInitialCoolingOff(
  membership:
    | {
        initialCoolingOffEndsAt?: Date | null;
        status?: MembershipStatus | null;
      }
    | null
    | undefined,
  now = new Date()
) {
  if (!membership?.initialCoolingOffEndsAt) return false;
  return (
    now <= membership.initialCoolingOffEndsAt && membership.status !== MembershipStatus.cancelled
  );
}

export function isInRenewalCoolingOff(
  membership:
    | {
        renewalCoolingOffEndsAt?: Date | null;
        status?: MembershipStatus | null;
      }
    | null
    | undefined,
  now = new Date()
) {
  if (!membership?.renewalCoolingOffEndsAt) return false;
  return (
    now <= membership.renewalCoolingOffEndsAt && membership.status !== MembershipStatus.cancelled
  );
}

export function calculateProratedRefundAmount(params: {
  paidAmountPence: number;
  periodStart: Date;
  periodEnd: Date;
  cancelledAt?: Date;
}) {
  const cancelledAt = params.cancelledAt || new Date();
  if (params.paidAmountPence <= 0) return 0;
  if (cancelledAt <= params.periodStart) return params.paidAmountPence;

  const totalMs = params.periodEnd.getTime() - params.periodStart.getTime();
  if (totalMs <= 0) return params.paidAmountPence;

  const usedMs = Math.max(0, cancelledAt.getTime() - params.periodStart.getTime());
  const unusedRatio = Math.max(0, 1 - usedMs / totalMs);
  return Math.max(
    0,
    Math.min(params.paidAmountPence, Math.round(params.paidAmountPence * unusedRatio))
  );
}

export async function recordSubscriptionComplianceEvent(params: {
  userId: string;
  membershipId?: string | null;
  kind: SubscriptionComplianceEventKind;
  status: string;
  channel?: string;
  summary: string;
  metadataJson?: Prisma.InputJsonValue;
  eventAt?: Date;
}) {
  return db.subscriptionComplianceEvent.create({
    data: {
      userId: params.userId,
      membershipId: params.membershipId || undefined,
      kind: params.kind,
      status: params.status,
      channel: params.channel || "app",
      summary: params.summary,
      metadataJson: params.metadataJson,
      eventAt: params.eventAt || new Date(),
    },
  });
}

export async function getSubscriptionComplianceHistory(userId: string, limit = 8) {
  const events = await db.subscriptionComplianceEvent.findMany({
    where: { userId },
    orderBy: { eventAt: "desc" },
    take: limit,
  });

  return events.map<SubscriptionNoticeHistoryItem>((event) => ({
    id: event.id,
    kind: event.kind,
    status: event.status,
    channel: event.channel,
    summary: event.summary,
    eventAt: event.eventAt.toISOString(),
  }));
}

async function sendAndRecordNotice(params: {
  userId: string;
  membershipId?: string | null;
  email: string;
  firstName: string;
  kind: SubscriptionComplianceEventKind;
  summary: string;
  subject: string;
  preview: string;
  title: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
  metadata?: Record<string, string>;
  eventAt?: Date;
}) {
  const result = await sendSubscriptionNoticeEmail({
    email: params.email,
    firstName: params.firstName,
    subject: params.subject,
    preview: params.preview,
    title: params.title,
    paragraphs: params.paragraphs,
    tag: `subscription-${params.kind}`,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footnote: params.footnote,
    metadata: params.metadata,
  });

  await recordSubscriptionComplianceEvent({
    userId: params.userId,
    membershipId: params.membershipId,
    kind: params.kind,
    status: result.success ? "sent" : "failed",
    channel: "email",
    summary: params.summary,
    metadataJson: params.metadata as Prisma.InputJsonValue | undefined,
    eventAt: params.eventAt,
  });

  return result;
}

export async function sendMembershipCancellationNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  endsAt: Date | null;
  immediate: boolean;
  refundAmountPence?: number;
}) {
  const endLabel = formatDateLabel(params.endsAt || new Date()) || "today";
  const refundParagraph =
    params.refundAmountPence && params.refundAmountPence > 0
      ? [
          `A refund of ${formatMoney(params.refundAmountPence)} has been initiated to your original payment method.`,
        ]
      : [];

  return sendAndRecordNotice({
    userId: params.userId,
    membershipId: params.membershipId,
    email: params.email,
    firstName: params.firstName,
    kind: SubscriptionComplianceEventKind.end_of_contract_notice,
    summary: params.immediate
      ? `Membership ended immediately on ${endLabel}.`
      : `Membership scheduled to end on ${endLabel}.`,
    subject: params.immediate
      ? "Your Move Well Membership has ended"
      : "Your Move Well Membership cancellation is confirmed",
    preview: params.immediate
      ? "Your subscription has been cancelled and closed."
      : `Your subscription will end on ${endLabel}.`,
    title: params.immediate ? "Membership ended" : "Cancellation confirmed",
    paragraphs: params.immediate
      ? [
          `Your Move Well Membership has been cancelled with immediate effect on ${endLabel}.`,
          ...refundParagraph,
          "You can return to the membership page at any time to start again or use credit packs instead.",
        ]
      : [
          `We have received your request to cancel your Move Well Membership.`,
          `Your membership remains active until ${endLabel}, after which it will not renew.`,
          "You can still use your dashboard to manage classes and, if needed, resume renewal before the end date.",
        ],
    ctaLabel: "Open membership settings",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote: "This email is your written cancellation acknowledgement and end-of-contract notice.",
    metadata: {
      membershipId: params.membershipId,
      immediate: params.immediate ? "true" : "false",
      endsAt: endLabel,
    },
  });
}

export async function sendRenewalCoolingOffNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  renewalKind: "trial_conversion" | "annual_renewal";
  renewalDate: Date;
  coolingOffEndsAt: Date;
}) {
  const renewalLabel = formatDateLabel(params.renewalDate) || "today";
  const coolingOffLabel = formatDateLabel(params.coolingOffEndsAt) || "14 days from now";
  const kindLabel =
    params.renewalKind === "trial_conversion" ? "trial conversion" : "annual renewal";

  return sendAndRecordNotice({
    userId: params.userId,
    membershipId: params.membershipId,
    email: params.email,
    firstName: params.firstName,
    kind: SubscriptionComplianceEventKind.renewal_cooling_off_notice,
    summary: `Renewal cooling-off notice sent for ${kindLabel} on ${renewalLabel}.`,
    subject: "You have a 14-day renewal cooling-off right",
    preview: "Your Move Well Membership has renewed and a cooling-off window is open.",
    title: "Renewal cooling-off notice",
    paragraphs: [
      `Your Move Well Membership ${params.renewalKind === "trial_conversion" ? "has moved from trial into its first paid term" : "has renewed for a new annual term"} on ${renewalLabel}.`,
      `You have a statutory 14-day cooling-off period until ${coolingOffLabel}. If you cancel during that period, we will process any refund required under consumer law.`,
      "You can cancel online from your Membership dashboard. If you do nothing, your subscription continues as normal.",
    ],
    ctaLabel: "Review membership",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote: "This notice is sent separately from your general billing emails.",
    metadata: {
      membershipId: params.membershipId,
      renewalKind: params.renewalKind,
      renewalDate: renewalLabel,
      coolingOffEndsAt: coolingOffLabel,
    },
    eventAt: params.renewalDate,
  });
}

export async function sendMembershipCheckoutConfirmationNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  billingInterval: MembershipBillingInterval;
  pricePence: number;
  trialEndsAt: Date;
  immediateStartSummary?: string | null;
}) {
  const copy = buildMembershipCheckoutConfirmationCopy({
    billingInterval: params.billingInterval,
    pricePence: params.pricePence,
    trialEndsAt: params.trialEndsAt,
    immediateStartSummary: params.immediateStartSummary,
  });

  const result = await sendSubscriptionNoticeEmail({
    email: params.email,
    firstName: params.firstName,
    subject: copy.subject,
    preview: copy.preview,
    title: copy.title,
    paragraphs: copy.paragraphs,
    tag: "subscription-checkout-confirmation",
    ctaLabel: "Open membership settings",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote:
      "This email repeats the trial, billing, cancellation, and immediate-start details from checkout.",
    metadata: {
      membershipId: params.membershipId,
      ...copy.metadata,
    },
  });

  await recordSubscriptionComplianceEvent({
    userId: params.userId,
    membershipId: params.membershipId,
    kind: SubscriptionComplianceEventKind.disclosure_acknowledged,
    status: result.success ? "email_sent" : "email_failed",
    channel: "email",
    summary: result.success
      ? "Membership checkout confirmation email sent."
      : "Membership checkout confirmation email failed.",
    metadataJson: {
      emailType: "subscription-checkout-confirmation",
      ...copy.metadata,
    } as Prisma.InputJsonValue,
  });

  return result;
}

export async function sendTrialReminderNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  trialEndsAt: Date;
}) {
  const trialEndLabel = formatDateLabel(params.trialEndsAt) || "soon";
  return sendAndRecordNotice({
    userId: params.userId,
    membershipId: params.membershipId,
    email: params.email,
    firstName: params.firstName,
    kind: SubscriptionComplianceEventKind.trial_reminder,
    summary: `Trial reminder sent ahead of ${trialEndLabel}.`,
    subject: "Your Move Well Membership trial is ending soon",
    preview: `Your free trial ends on ${trialEndLabel}.`,
    title: "Trial ending soon",
    paragraphs: [
      `Your ${MEMBERSHIP_TRIAL_DAYS}-day Move Well Membership trial ends on ${trialEndLabel}.`,
      "If you do not cancel before then, your membership will continue as a paid subscription using the plan you selected at checkout.",
      "You can cancel online from your Membership dashboard at any time before the trial ends.",
    ],
    ctaLabel: "Manage membership",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote: "This is your statutory reminder that the trial period is about to end.",
    metadata: {
      membershipId: params.membershipId,
      trialEndsAt: trialEndLabel,
    },
  });
}

export async function sendMonthlyReminderNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  nextNoticeDate: Date;
}) {
  const nextNoticeLabel = formatDateLabel(params.nextNoticeDate) || "soon";
  return sendAndRecordNotice({
    userId: params.userId,
    membershipId: params.membershipId,
    email: params.email,
    firstName: params.firstName,
    kind: SubscriptionComplianceEventKind.monthly_reminder,
    summary: `Six-month rolling reminder sent on ${formatDateLabel(new Date()) || "today"}.`,
    subject: "Your Move Well Membership is still active",
    preview: "A reminder that your membership is continuing on a rolling monthly basis.",
    title: "Membership reminder",
    paragraphs: [
      "Your Move Well Membership is continuing on a rolling monthly basis.",
      "You can cancel online from your Membership dashboard at any time if you no longer want the subscription to continue.",
      `Your next statutory rolling reminder will be due around ${nextNoticeLabel}.`,
    ],
    ctaLabel: "Review membership",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote: "This reminder is part of our recurring subscription information duties.",
    metadata: {
      membershipId: params.membershipId,
      nextNoticeDate: nextNoticeLabel,
    },
  });
}

export async function sendAnnualRenewalReminderNotice(params: {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  renewalDate: Date;
  leadDays: number;
}) {
  const renewalLabel = formatDateLabel(params.renewalDate) || "soon";
  return sendAndRecordNotice({
    userId: params.userId,
    membershipId: params.membershipId,
    email: params.email,
    firstName: params.firstName,
    kind: SubscriptionComplianceEventKind.annual_renewal_reminder,
    summary: `${params.leadDays}-day annual renewal reminder sent before ${renewalLabel}.`,
    subject: `${params.leadDays}-day reminder: annual membership renewal`,
    preview: `Your annual renewal is due on ${renewalLabel}.`,
    title: "Annual renewal reminder",
    paragraphs: [
      `Your annual Move Well Membership is due to renew on ${renewalLabel}.`,
      "If you want the subscription to end before the new annual term starts, please cancel online before that date.",
      "If the annual renewal goes ahead, you will receive a separate renewal cooling-off notice on the day the new annual term begins.",
    ],
    ctaLabel: "Manage membership",
    ctaUrl: `${APP_URL}/dashboard/membership`,
    footnote: "This reminder is sent before the start of the new annual term.",
    metadata: {
      membershipId: params.membershipId,
      renewalDate: renewalLabel,
      leadDays: String(params.leadDays),
    },
  });
}

async function hasRecentEvent(params: {
  membershipId: string;
  kind: SubscriptionComplianceEventKind;
  from: Date;
  to?: Date;
}) {
  const existing = await db.subscriptionComplianceEvent.findFirst({
    where: {
      membershipId: params.membershipId,
      kind: params.kind,
      eventAt: params.to ? { gte: params.from, lte: params.to } : { gte: params.from },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function processNoticeForMembership(membership: NoticeMembership, now: Date) {
  if (!membership.user.email || membership.status === MembershipStatus.cancelled) {
    return 0;
  }

  let sent = 0;
  const firstName = membership.user.firstName || membership.user.name || "there";

  if (
    membership.trialEndsAt &&
    membership.trialEndsAt > now &&
    membership.cancelAtPeriodEnd === false &&
    membership.disclosureAcceptedAt &&
    membership.trialEndsAt.getTime() - now.getTime() <= TRIAL_REMINDER_LEAD_DAYS * 86400000
  ) {
    const seen = await hasRecentEvent({
      membershipId: membership.id,
      kind: SubscriptionComplianceEventKind.trial_reminder,
      from: addDays(membership.trialEndsAt, -TRIAL_REMINDER_LEAD_DAYS - 2),
    });
    if (!seen) {
      await sendTrialReminderNotice({
        membershipId: membership.id,
        userId: membership.userId,
        email: membership.user.email,
        firstName,
        trialEndsAt: membership.trialEndsAt,
      });
      sent += 1;
    }
  }

  if (
    membership.billingInterval === MembershipBillingInterval.annual &&
    membership.renewsAt &&
    membership.cancelAtPeriodEnd === false &&
    membership.renewsAt > now
  ) {
    const msUntilRenewal = membership.renewsAt.getTime() - now.getTime();
    for (const [index, leadDays] of ANNUAL_RENEWAL_REMINDER_LEAD_DAYS.entries()) {
      const nextLeadDays = ANNUAL_RENEWAL_REMINDER_LEAD_DAYS[index + 1] || 0;
      if (msUntilRenewal > leadDays * 86400000 || msUntilRenewal <= nextLeadDays * 86400000) {
        continue;
      }

      const seen = await hasRecentEvent({
        membershipId: membership.id,
        kind: SubscriptionComplianceEventKind.annual_renewal_reminder,
        from: addDays(membership.renewsAt, -leadDays - 2),
        to: addDays(membership.renewsAt, -leadDays + 2),
      });
      if (!seen) {
        await sendAnnualRenewalReminderNotice({
          membershipId: membership.id,
          userId: membership.userId,
          email: membership.user.email,
          firstName,
          renewalDate: membership.renewsAt,
          leadDays,
        });
        sent += 1;
      }
    }
  }

  if (
    membership.billingInterval === MembershipBillingInterval.monthly &&
    membership.cancelAtPeriodEnd === false
  ) {
    const noticeCount = await db.subscriptionComplianceEvent.count({
      where: {
        membershipId: membership.id,
        kind: SubscriptionComplianceEventKind.monthly_reminder,
      },
    });
    const nextDue = addMonths(
      membership.startsAt,
      MONTHLY_REMINDER_INTERVAL_MONTHS * (noticeCount + 1)
    );
    if (nextDue <= now) {
      await sendMonthlyReminderNotice({
        membershipId: membership.id,
        userId: membership.userId,
        email: membership.user.email,
        firstName,
        nextNoticeDate: addMonths(nextDue, MONTHLY_REMINDER_INTERVAL_MONTHS),
      });
      sent += 1;
    }
  }

  return sent;
}

export async function processDueSubscriptionComplianceNotices(now = new Date()) {
  const memberships = await db.membershipSubscription.findMany({
    where: {
      status: {
        in: [MembershipStatus.active, MembershipStatus.past_due],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          name: true,
        },
      },
    },
  });

  let processed = 0;
  for (const membership of memberships) {
    processed += await processNoticeForMembership(membership, now);
  }

  return { processed, scanned: memberships.length };
}

export async function issueMembershipRefund(params: {
  membershipId: string;
  userId: string;
  amountPence: number;
  reason: string;
}) {
  const membership = await db.membershipSubscription.findUnique({
    where: { id: params.membershipId },
    select: {
      id: true,
      latestInvoiceId: true,
      latestInvoiceAmountPence: true,
      userId: true,
    },
  });
  if (!membership?.latestInvoiceId || params.amountPence <= 0) {
    return null;
  }
  const alreadyRefunded = await db.billingRefund.aggregate({
    where: {
      membershipId: params.membershipId,
      stripeInvoiceId: membership.latestInvoiceId,
      status: {
        in: [
          BillingRefundStatus.pending,
          BillingRefundStatus.succeeded,
          BillingRefundStatus.credited,
        ],
      },
    },
    _sum: { amountPence: true },
  });
  const remainingPence = Math.max(
    0,
    (membership.latestInvoiceAmountPence || 0) - (alreadyRefunded._sum.amountPence || 0)
  );
  const amountPence = Math.min(params.amountPence, remainingPence);
  if (amountPence <= 0) return null;

  const stripe = getStripeClient();
  const invoice = await stripe.invoices.retrieve(membership.latestInvoiceId);
  const hydratedInvoice = invoice as StripeInvoiceWithPaymentIntent;
  const paymentIntentId =
    typeof hydratedInvoice.payment_intent === "string"
      ? hydratedInvoice.payment_intent
      : hydratedInvoice.payment_intent?.id;

  if (!paymentIntentId) {
    throw new Error("MISSING_PAYMENT_INTENT");
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountPence,
    reason: "requested_by_customer",
    metadata: {
      membershipId: params.membershipId,
      userId: params.userId,
      reason: params.reason,
    },
  });

  await db.billingRefund.create({
    data: {
      userId: params.userId,
      membershipId: params.membershipId,
      amountPence,
      reason: params.reason,
      status:
        refund.status === "succeeded"
          ? BillingRefundStatus.succeeded
          : refund.status === "failed"
            ? BillingRefundStatus.failed
            : BillingRefundStatus.pending,
      stripeRefundId: refund.id,
      stripeInvoiceId: membership.latestInvoiceId,
      paymentIntentId,
      metadataJson: refund as unknown as Prisma.InputJsonValue,
    },
  });

  await recordSubscriptionComplianceEvent({
    userId: params.userId,
    membershipId: params.membershipId,
    kind: SubscriptionComplianceEventKind.refund_issued,
    status: refund.status || "pending",
    channel: "stripe",
    summary: `Refund initiated for ${formatMoney(amountPence)}.`,
    metadataJson: {
      refundId: refund.id,
      amountPence,
      reason: params.reason,
    },
  });

  return refund;
}

export function getNextMonthlyReminderDate(params: { startsAt: Date; sentCount: number }) {
  return addMonths(params.startsAt, MONTHLY_REMINDER_INTERVAL_MONTHS * (params.sentCount + 1));
}

export function getInitialComplianceWindow(startedAt = new Date()) {
  const lifecycle = getMembershipLifecycleDates(startedAt);
  return {
    trialEndsAt: lifecycle.trialEndsAt,
    initialCoolingOffEndsAt: lifecycle.initialCoolingOffEndsAt,
  };
}

export function toIsoDate(value: Date | null | undefined) {
  return formatDateLabel(value);
}

export function getMembershipComplianceStatus(params: {
  membership: {
    trialEndsAt?: Date | null;
    initialCoolingOffEndsAt?: Date | null;
    renewalCoolingOffEndsAt?: Date | null;
    renewalCoolingOffKind?: RenewalCoolingOffKind | string | null;
  } | null;
  now?: Date;
}): {
  inInitialCoolingOff: boolean;
  inRenewalCoolingOff: boolean;
  trialEndsAt: string | null;
  initialCoolingOffEndsAt: string | null;
  renewalCoolingOffEndsAt: string | null;
  renewalCoolingOffKind: RenewalCoolingOffKind | null;
} {
  const now = params.now || new Date();
  const membership = params.membership;
  return {
    inInitialCoolingOff: isInInitialCoolingOff(membership, now),
    inRenewalCoolingOff: isInRenewalCoolingOff(membership, now),
    trialEndsAt: toIsoDate(membership?.trialEndsAt),
    initialCoolingOffEndsAt: toIsoDate(membership?.initialCoolingOffEndsAt),
    renewalCoolingOffEndsAt: toIsoDate(membership?.renewalCoolingOffEndsAt),
    renewalCoolingOffKind:
      membership?.renewalCoolingOffKind === "trial_conversion" ||
      membership?.renewalCoolingOffKind === "annual_renewal"
        ? membership.renewalCoolingOffKind
        : null,
  };
}

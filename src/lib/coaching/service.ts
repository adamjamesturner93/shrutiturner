import {
  CoachingApplicationStatus,
  CoachingPackageChangeEffectiveMode,
  CoachingSupportTier,
  Prisma,
} from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import type { AdminCoachingApplicationDto, CoachingDashboardDto } from "@/lib/api/types";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { linkPendingRecordsForUser } from "@/lib/link-pending-records";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { activeCoachingTiers, coachingTiers, type CoachingOfferKey } from "@/data/marketing";
import CoachingApplicationApprovedEmail from "@/emails/coaching-application-approved";
import CoachingApplicationConfirmationEmail from "@/emails/coaching-application-confirmation";
import CoachingApplicationNotificationEmail from "@/emails/coaching-application-notification";
import CoachingApplicationRejectedEmail from "@/emails/coaching-application-rejected";
import CoachingApplicationWaitlistedEmail from "@/emails/coaching-application-waitlisted";
import CoachingPaymentReminderEmail from "@/emails/coaching-payment-reminder";
import CoachingClientConfirmedEmail from "@/emails/coaching-client-confirmed";
import CoachingPackageChangeRequestedEmail from "@/emails/coaching-package-change-requested";
import CoachingPaidStartRequestedEmail from "@/emails/coaching-paid-start-requested";
import CoachingWaitlistLeftNotificationEmail from "@/emails/coaching-waitlist-left-notification";
import { getCoachingAdminTodos, getCoachingBillingPhase } from "@/lib/coaching/operations";

export type CoachingApplicationAnswerMap = Record<string, string>;

const applicationStatuses: CoachingApplicationStatus[] = [
  "submitted",
  "under_review",
  "follow_up_needed",
  "consultation_scheduled",
  "consultation_completed",
  "offer_sent",
  "waitlisted",
  "approved",
  "declined",
  "converted",
  "withdrawn",
];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

function tierToLabel(tier: CoachingSupportTier) {
  switch (tier) {
    case "personal_programme":
      return "Monthly Support";
    case "coached_plan":
      return "Weekly Support";
    case "coaching":
      return "1:1 Coaching";
    case "unsure":
      return "To be recommended";
    default:
      return "Coaching";
  }
}

function getOfferKeyFromAnswers(answers: CoachingApplicationAnswerMap): CoachingOfferKey | null {
  const offerKey = answers.offerKey;
  return coachingTiers.some((offer) => offer.id === offerKey)
    ? (offerKey as CoachingOfferKey)
    : null;
}

function getRecommendedOfferKey(application: {
  recommendedOfferKey?: string | null;
  answersJson: Prisma.JsonValue;
}): CoachingOfferKey | null {
  if (activeCoachingTiers.some((offer) => offer.id === application.recommendedOfferKey)) {
    return application.recommendedOfferKey as CoachingOfferKey;
  }
  return getOfferKeyFromAnswers(application.answersJson as CoachingApplicationAnswerMap);
}

function offerKeyToLabel(offerKey: CoachingOfferKey | null, tier: CoachingSupportTier) {
  if (!offerKey) return tierToLabel(tier);
  return coachingTiers.find((offer) => offer.id === offerKey)?.name || tierToLabel(tier);
}

function offerKeyToTier(offerKey: CoachingOfferKey): CoachingSupportTier {
  return coachingTiers.find((offer) => offer.id === offerKey)?.applicationTier || "coaching";
}

function tierToDefaultOfferKey(tier: CoachingSupportTier): CoachingOfferKey | null {
  if (tier === "personal_programme") return "independent_training_plan";
  if (tier === "coached_plan") return "guided_training_plan";
  if (tier === "coaching") return "one_to_one_coaching";
  return null;
}

function serializePendingPackageChange(
  request: {
    id: string;
    requestType: "package_change" | "paid_start";
    billingStartsAt: Date | null;
    fromTier: CoachingSupportTier;
    toTier: CoachingSupportTier;
    fromOfferKey: string | null;
    toOfferKey: string;
    effectiveMode: CoachingPackageChangeEffectiveMode;
    note: string | null;
    createdAt: Date;
  } | null
) {
  if (!request) return null;
  return {
    id: request.id,
    requestType: request.requestType,
    billingStartsAt: request.billingStartsAt?.toISOString() || null,
    fromTier: request.fromTier,
    toTier: request.toTier,
    fromOfferKey: coachingTiers.some((offer) => offer.id === request.fromOfferKey)
      ? (request.fromOfferKey as CoachingOfferKey)
      : null,
    toOfferKey: request.toOfferKey as CoachingOfferKey,
    effectiveMode: request.effectiveMode,
    note: request.note || null,
    createdAt: request.createdAt.toISOString(),
  };
}

const enquiryEmailLabels: Record<string, string> = {
  support: "Support requested",
  movement: "Current movement or training",
  context: "Body context",
  outcome: "What they want from coaching",
  extra: "Anything else",
  referral: "How they heard about Shruti",
};

function summarizeAnswers(answers: CoachingApplicationAnswerMap) {
  return Object.entries(answers)
    .filter(([key, value]) => key !== "offerKey" && value.trim())
    .slice(0, 4)
    .map(([key, value]) => `${enquiryEmailLabels[key] || key}: ${value.trim().slice(0, 160)}`);
}

export const COACHING_ENQUIRY_CONSENT_VERSION = "coaching-enquiry.v1";

export async function submitCoachingEnquiry(input: {
  userId?: string | null;
  applicantName: string;
  applicantEmail: string;
  answers: CoachingApplicationAnswerMap;
  consentText: string;
}) {
  const applicantName = normalizeName(input.applicantName);
  const applicantEmail = normalizeEmail(input.applicantEmail);
  if (!applicantName) throw new Error("NAME_REQUIRED");
  if (!applicantEmail || !applicantEmail.includes("@")) throw new Error("EMAIL_REQUIRED");
  if (!input.consentText.trim()) throw new Error("CONSENT_REQUIRED");

  const [applicantFirstName = applicantName, ...nameRest] = applicantName.split(" ");
  const applicantLastName = nameRest.join(" ");
  const answers = Object.fromEntries(
    Object.entries(input.answers).map(([key, value]) => [key, value.trim().slice(0, 4000)])
  ) as CoachingApplicationAnswerMap;
  if (!answers.support || !answers.outcome || !answers.referral) {
    throw new Error("ANSWERS_REQUIRED");
  }

  const existingUser = input.userId
    ? null
    : await db.user.findUnique({ where: { email: applicantEmail }, select: { id: true } });
  const application = await db.coachingApplication.create({
    data: {
      userId: input.userId || existingUser?.id || undefined,
      applicantFirstName,
      applicantLastName,
      applicantName,
      applicantEmail,
      tier: "unsure",
      answersJson: answers as Prisma.InputJsonValue,
      isExistingCoachingClientSnapshot: false,
      source: "public_coaching_enquire",
      enquiryConsentVersion: COACHING_ENQUIRY_CONSENT_VERSION,
      enquiryConsentText: input.consentText.trim().slice(0, 1000),
      enquiryConsentedAt: new Date(),
    },
  });

  const dashboardUrl = application.userId ? buildAbsoluteUrl("/dashboard/coaching") : undefined;
  const adminUrl = buildAbsoluteUrl("/admin/coaching");
  const summary = summarizeAnswers(answers);
  await Promise.allSettled([
    sendPostmarkReactEmail({
      to: applicantEmail,
      subject: "Your coaching enquiry has been received",
      react: CoachingApplicationConfirmationEmail({
        firstName: applicantFirstName,
        dashboardUrl,
      }),
      textBody: `Hi ${applicantFirstName},\n\nThanks for getting in touch about coaching. Shruti will read your enquiry personally and reply within two working days.`,
      tag: "coaching-enquiry-confirmation",
      templateKey: "coaching-enquiry-confirmation",
      metadata: { applicationId: application.id },
      dispatchMode: "immediate_best_effort",
    }),
    sendPostmarkReactEmail({
      to: getNotificationInbox("COACHING_APPLICATION_NOTIFICATION_EMAIL"),
      subject: `New coaching enquiry: ${applicantName}`,
      react: CoachingApplicationNotificationEmail({
        name: applicantName,
        email: applicantEmail,
        summary,
        adminUrl,
      }),
      textBody: `New coaching enquiry from ${applicantName}\nEmail: ${applicantEmail}\n\n${summary.join("\n")}\n\nReview: ${adminUrl}`,
      tag: "coaching-enquiry-notification",
      templateKey: "coaching-enquiry-notification",
      replyTo: applicantEmail,
      metadata: { applicationId: application.id },
      dispatchMode: "immediate_best_effort",
    }),
  ]);
  return application;
}

export async function getMyCoachingState(userId: string): Promise<CoachingDashboardDto> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isCoachingClient: true },
  });
  if (user?.email) {
    await linkPendingRecordsForUser(user.id, user.email);
  }

  const [profile, latestApplication] = await Promise.all([
    db.coachingClientProfile.findUnique({
      where: { userId },
      include: {
        application: true,
        subscriptionProjection: true,
        packageChangeRequests: {
          where: { status: "pending_client_confirmation" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    db.coachingApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (profile) {
    const billingPhase = getCoachingBillingPhase({
      profileStatus: profile.status,
      cancellationRequestedAt: profile.billingCancellationRequestedAt,
      finalPaymentAt: profile.billingFinalPaymentAt,
      endsAt: profile.billingEndsAt,
      subscriptionStatus: profile.subscriptionProjection?.status,
    });
    return {
      state: profile.status as CoachingDashboardDto["state"],
      hasProfile: true,
      isCoachingClient: Boolean(user?.isCoachingClient),
      profile: {
        id: profile.id,
        billingArrangement: profile.billingArrangement,
        billingStartsAt: profile.billingStartsAt?.toISOString() || null,
        tier: profile.tier as NonNullable<CoachingDashboardDto["profile"]>["tier"],
        status: profile.status as NonNullable<CoachingDashboardDto["profile"]>["status"],
        everfitConnectionStatus: profile.everfitConnectionStatus as NonNullable<
          CoachingDashboardDto["profile"]
        >["everfitConnectionStatus"],
        nextCheckInDueAt: null,
        nextCheckInStatus: null,
        nextSessionStartsAt: null,
        latestCoachResponseSummary: profile.latestCoachResponseSummary || null,
        billingCancellationRequestedAt:
          profile.billingCancellationRequestedAt?.toISOString() || null,
        billingFinalPaymentAt: profile.billingFinalPaymentAt?.toISOString() || null,
        billingEndsAt: profile.billingEndsAt?.toISOString() || null,
        billingPhase,
        nextBillingAt:
          billingPhase === "active"
            ? profile.subscriptionProjection?.currentPeriodEnd?.toISOString() || null
            : billingPhase === "cancellation_scheduled"
              ? profile.billingFinalPaymentAt?.toISOString() || null
              : null,
        nextBillingAmountPence:
          billingPhase === "active" || billingPhase === "cancellation_scheduled"
            ? (profile.subscriptionProjection?.unitAmountPence || 0) *
              (profile.subscriptionProjection?.quantity || 1)
            : null,
        billingCurrency: profile.subscriptionProjection?.currency || null,
        pendingPackageChange: serializePendingPackageChange(profile.packageChangeRequests[0]),
      },
      application: latestApplication
        ? {
            id: latestApplication.id,
            offerKey: getRecommendedOfferKey(latestApplication),
            status: latestApplication.status as NonNullable<
              CoachingDashboardDto["application"]
            >["status"],
            decisionReason: latestApplication.decisionReason || null,
            tier: latestApplication.tier as NonNullable<
              CoachingDashboardDto["application"]
            >["tier"],
            createdAt: latestApplication.createdAt.toISOString(),
            waitlistedAt: latestApplication.waitlistedAt?.toISOString() || null,
            waitlistLeftAt: latestApplication.waitlistLeftAt?.toISOString() || null,
            consultationStatus: latestApplication.consultationStatus,
            consultationScheduledAt:
              latestApplication.consultationScheduledAt?.toISOString() || null,
            consultationCompletedAt:
              latestApplication.consultationCompletedAt?.toISOString() || null,
            offerSentAt: latestApplication.offerSentAt?.toISOString() || null,
          }
        : null,
    };
  }

  if (latestApplication) {
    const applicationState =
      latestApplication.status === "waitlisted" || latestApplication.status === "withdrawn"
        ? latestApplication.status
        : "application_pending";
    return {
      state: applicationState,
      hasProfile: false,
      isCoachingClient: Boolean(user?.isCoachingClient),
      profile: null,
      application: {
        id: latestApplication.id,
        offerKey: getRecommendedOfferKey(latestApplication),
        status: latestApplication.status as NonNullable<
          CoachingDashboardDto["application"]
        >["status"],
        decisionReason: latestApplication.decisionReason || null,
        tier: latestApplication.tier as NonNullable<CoachingDashboardDto["application"]>["tier"],
        createdAt: latestApplication.createdAt.toISOString(),
        waitlistedAt: latestApplication.waitlistedAt?.toISOString() || null,
        waitlistLeftAt: latestApplication.waitlistLeftAt?.toISOString() || null,
        consultationStatus: latestApplication.consultationStatus,
        consultationScheduledAt: latestApplication.consultationScheduledAt?.toISOString() || null,
        consultationCompletedAt: latestApplication.consultationCompletedAt?.toISOString() || null,
        offerSentAt: latestApplication.offerSentAt?.toISOString() || null,
      },
    };
  }

  return {
    state: "not_a_client",
    hasProfile: false,
    isCoachingClient: Boolean(user?.isCoachingClient),
    profile: null,
    application: null,
  };
}

export async function listAdminCoachingApplications(params?: { status?: string; tier?: string }) {
  const status =
    params?.status && applicationStatuses.includes(params.status as CoachingApplicationStatus)
      ? (params.status as CoachingApplicationStatus)
      : undefined;
  const tier =
    params?.tier &&
    ["personal_programme", "coached_plan", "coaching", "unsure"].includes(params.tier)
      ? (params.tier as CoachingSupportTier)
      : undefined;

  const rows = await db.coachingApplication.findMany({
    where: {
      status,
      tier,
    },
    orderBy:
      status === "waitlisted"
        ? [{ waitlistedAt: "asc" }, { createdAt: "asc" }]
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isCoachingClient: true,
        },
      },
      clientProfile: {
        include: {
          subscriptionProjection: true,
          packageChangeRequests: {
            where: { status: "pending_client_confirmation" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return rows.map((row): AdminCoachingApplicationDto => {
    const answers = row.answersJson as CoachingApplicationAnswerMap;
    const billingPhase = row.clientProfile
      ? getCoachingBillingPhase({
          profileStatus: row.clientProfile.status,
          cancellationRequestedAt: row.clientProfile.billingCancellationRequestedAt,
          finalPaymentAt: row.clientProfile.billingFinalPaymentAt,
          endsAt: row.clientProfile.billingEndsAt,
          subscriptionStatus: row.clientProfile.subscriptionProjection?.status,
        })
      : "not_configured";
    const coachingProfile: AdminCoachingApplicationDto["coachingProfile"] = row.clientProfile
      ? {
          id: row.clientProfile.id,
          billingArrangement: row.clientProfile.billingArrangement,
          billingStartsAt: row.clientProfile.billingStartsAt?.toISOString() || null,
          tier: row.clientProfile.tier,
          status: row.clientProfile.status,
          everfitConnectionStatus: row.clientProfile.everfitConnectionStatus,
          billingCancellationRequestedAt:
            row.clientProfile.billingCancellationRequestedAt?.toISOString() || null,
          billingFinalPaymentAt: row.clientProfile.billingFinalPaymentAt?.toISOString() || null,
          billingEndsAt: row.clientProfile.billingEndsAt?.toISOString() || null,
          billingPhase,
          nextBillingAt:
            row.clientProfile.subscriptionProjection?.currentPeriodEnd?.toISOString() || null,
          nextBillingAmountPence: row.clientProfile.subscriptionProjection
            ? row.clientProfile.subscriptionProjection.unitAmountPence *
              row.clientProfile.subscriptionProjection.quantity
            : null,
          billingCurrency: row.clientProfile.subscriptionProjection?.currency || null,
          subscriptionStatus: row.clientProfile.subscriptionProjection?.status || null,
          pendingPackageChange: serializePendingPackageChange(
            row.clientProfile.packageChangeRequests[0]
          ),
        }
      : null;
    const application = {
      offerKey: getRecommendedOfferKey(row),
      id: row.id,
      applicantName:
        row.applicantName || `${row.applicantFirstName} ${row.applicantLastName}`.trim(),
      applicantEmail: row.applicantEmail,
      status: row.status,
      tier: row.tier,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() || null,
      approvedAt: row.approvedAt?.toISOString() || null,
      paymentReminderSentAt: row.paymentReminderSentAt?.toISOString() || null,
      waitlistedAt: row.waitlistedAt?.toISOString() || null,
      waitlistLeftAt: row.waitlistLeftAt?.toISOString() || null,
      consultationStatus: row.consultationStatus,
      consultationScheduledAt: row.consultationScheduledAt?.toISOString() || null,
      consultationCompletedAt: row.consultationCompletedAt?.toISOString() || null,
      consultationNotes: row.consultationNotes || "",
      offerSentAt: row.offerSentAt?.toISOString() || null,
      userId: row.userId,
      isLinkedUserCoachingClient: row.user?.isCoachingClient || false,
      answers,
      decisionReason: row.decisionReason || "",
      adminNotes: row.adminNotes || "",
      coachingProfile,
      todos: [],
    };
    application.todos = getCoachingAdminTodos(application);
    return application;
  });
}

export async function updateAdminCoachingApplication(input: {
  id: string;
  status?: CoachingApplicationStatus;
  adminNotes?: string;
  decisionReason?: string;
  convertToClient?: boolean;
  consultationStatus?: "not_scheduled" | "scheduled" | "completed" | "cancelled";
  consultationScheduledAt?: string | null;
  consultationNotes?: string;
  recommendedOfferKey?: CoachingOfferKey | null;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const existing = await db.coachingApplication.findUnique({
    where: { id: input.id },
    include: {
      user: {
        select: { id: true },
      },
    },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const nextStatus = input.convertToClient ? "converted" : input.status || existing.status;
  const nextConsultationStatus = input.consultationStatus || existing.consultationStatus;
  const nextConsultationDate =
    input.consultationScheduledAt === undefined
      ? existing.consultationScheduledAt
      : input.consultationScheduledAt
        ? new Date(input.consultationScheduledAt)
        : null;
  if (nextConsultationDate && Number.isNaN(nextConsultationDate.getTime())) {
    throw new Error("INVALID_CONSULTATION_DATE");
  }
  if (nextConsultationStatus === "scheduled" && !nextConsultationDate) {
    throw new Error("CONSULTATION_DATE_REQUIRED");
  }
  if (
    (nextStatus === "offer_sent" || nextStatus === "waitlisted" || input.convertToClient) &&
    nextConsultationStatus !== "completed"
  ) {
    throw new Error("CONSULTATION_REQUIRED");
  }
  const nextDecisionReason =
    input.decisionReason !== undefined ? input.decisionReason.trim() : existing.decisionReason;
  if (nextStatus === "declined" && !nextDecisionReason?.trim()) {
    throw new Error("DECISION_REASON_REQUIRED");
  }
  const nextOfferKey =
    input.recommendedOfferKey !== undefined
      ? input.recommendedOfferKey
      : getRecommendedOfferKey(existing);
  if (
    (nextStatus === "offer_sent" ||
      nextStatus === "approved" ||
      nextStatus === "waitlisted" ||
      input.convertToClient) &&
    (!nextOfferKey || !activeCoachingTiers.some((offer) => offer.id === nextOfferKey))
  ) {
    throw new Error("RECOMMENDED_OFFER_REQUIRED");
  }
  const wasApproved =
    existing.status === "approved" ||
    existing.status === "offer_sent" ||
    existing.status === "converted";
  const wasDeclined = existing.status === "declined";
  const wasWaitlisted = existing.status === "waitlisted";
  const wasConverted = existing.status === "converted";
  const now = new Date();
  const updated = await db.coachingApplication.update({
    where: { id: input.id },
    data: {
      status: nextStatus,
      adminNotes: input.adminNotes !== undefined ? input.adminNotes.trim() : undefined,
      decisionReason: input.decisionReason !== undefined ? input.decisionReason.trim() : undefined,
      recommendedOfferKey:
        input.recommendedOfferKey !== undefined ? input.recommendedOfferKey : undefined,
      tier: nextOfferKey ? offerKeyToTier(nextOfferKey) : undefined,
      consultationStatus: input.consultationStatus,
      consultationScheduledAt:
        input.consultationScheduledAt !== undefined ? nextConsultationDate : undefined,
      consultationCompletedAt:
        input.consultationStatus === "completed"
          ? existing.consultationCompletedAt || now
          : input.consultationStatus
            ? null
            : undefined,
      consultationNotes:
        input.consultationNotes !== undefined ? input.consultationNotes.trim() : undefined,
      reviewedAt: input.status || input.convertToClient ? now : undefined,
      waitlistedAt: nextStatus === "waitlisted" && !wasWaitlisted ? now : undefined,
      waitlistLeftAt: wasWaitlisted && nextStatus !== "waitlisted" ? now : undefined,
      approvedAt:
        nextStatus === "approved" || nextStatus === "offer_sent"
          ? existing.approvedAt || now
          : undefined,
      offerSentAt: nextStatus === "offer_sent" ? existing.offerSentAt || now : undefined,
      convertedAt: input.convertToClient ? now : undefined,
    },
  });

  if ((nextStatus === "approved" || nextStatus === "offer_sent") && !wasApproved) {
    const offerKey = nextOfferKey;
    const tierLabel = offerKeyToLabel(offerKey, existing.tier);
    const dashboardUrl = buildAbsoluteUrl("/login?redirect=/dashboard/coaching");
    await sendPostmarkReactEmail({
      to: existing.applicantEmail,
      subject: "Your coaching recommendation is ready",
      react: CoachingApplicationApprovedEmail({
        firstName: existing.applicantFirstName,
        tierLabel,
        dashboardUrl,
        decisionReason: updated.decisionReason,
      }),
      textBody: `Hi ${existing.applicantFirstName},\n\nFollowing your conversation, Shruti recommends ${tierLabel}. Create or sign in to your Private Studio to review the recommendation, accept the current agreements and complete payment.${updated.decisionReason ? `\n\nA note from Shruti:\n${updated.decisionReason}` : ""}\n\nContinue: ${dashboardUrl}`,
      tag: "coaching-application-approved",
      templateKey: "coaching-application-approved",
      metadata: {
        applicationId: existing.id,
        tier: existing.tier,
      },
      dispatchMode: "immediate_best_effort",
    }).catch((error) => {
      console.error("[coaching] failed to send approval email", error);
    });
  }

  if (nextStatus === "declined" && !wasDeclined) {
    const offerKey = getRecommendedOfferKey(existing);
    const tierLabel = offerKeyToLabel(offerKey, existing.tier);
    const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
    await sendPostmarkReactEmail({
      to: existing.applicantEmail,
      subject: "Your coaching enquiry has been reviewed",
      react: CoachingApplicationRejectedEmail({
        firstName: existing.applicantFirstName,
        tierLabel,
        decisionReason: updated.decisionReason || nextDecisionReason || "",
        dashboardUrl,
      }),
      textBody: `Hi ${existing.applicantFirstName},\n\nThank you for your coaching enquiry. Shruti has reviewed what you discussed, and ${tierLabel} is not the right fit at the moment.\n\nA note from Shruti:\n${updated.decisionReason || nextDecisionReason}\n\nDashboard: ${dashboardUrl}`,
      tag: "coaching-application-rejected",
      templateKey: "coaching-application-rejected",
      metadata: {
        applicationId: existing.id,
        tier: existing.tier,
      },
      dispatchMode: "immediate_best_effort",
    }).catch((error) => {
      console.error("[coaching] failed to send rejection email", error);
    });
  }

  if (nextStatus === "waitlisted" && !wasWaitlisted) {
    const offerKey = nextOfferKey;
    const tierLabel = offerKeyToLabel(offerKey, existing.tier);
    const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
    await sendPostmarkReactEmail({
      to: existing.applicantEmail,
      subject: "You are on the coaching waiting list",
      react: CoachingApplicationWaitlistedEmail({
        firstName: existing.applicantFirstName,
        tierLabel,
        dashboardUrl,
        decisionReason: updated.decisionReason || nextDecisionReason || "",
      }),
      textBody: `Hi ${existing.applicantFirstName},\n\nFollowing your coaching enquiry, Shruti recommends ${tierLabel}. There is not capacity to start immediately, so you have been added to the coaching waiting list.${updated.decisionReason || nextDecisionReason ? `\n\nA note from Shruti:\n${updated.decisionReason || nextDecisionReason}` : ""}\n\nYou do not need to pay now. If a place opens, Shruti will email you with the next step. You can leave the waiting list from your coaching dashboard.\n\nDashboard: ${dashboardUrl}`,
      tag: "coaching-application-waitlisted",
      templateKey: "coaching-application-waitlisted",
      metadata: {
        applicationId: existing.id,
        tier: existing.tier,
      },
      dispatchMode: "immediate_best_effort",
    }).catch((error) => {
      console.error("[coaching] failed to send waitlist email", error);
    });
  }

  if (input.convertToClient && existing.userId) {
    const convertedTier = nextOfferKey ? offerKeyToTier(nextOfferKey) : existing.tier;
    await db.coachingClientProfile.upsert({
      where: { userId: existing.userId },
      create: {
        userId: existing.userId,
        applicationId: existing.id,
        tier: convertedTier === "unsure" ? "coaching" : convertedTier,
        status: "onboarding",
        billingArrangement: "pro_bono",
        nextCheckInDueAt: new Date(Date.now() + 7 * 86400000),
      },
      update: {
        applicationId: existing.id,
        tier: convertedTier === "unsure" ? "coaching" : convertedTier,
        status: "onboarding",
        billingArrangement: "pro_bono",
      },
    });

    await db.user.update({
      where: { id: existing.userId },
      data: { isCoachingClient: true },
    });

    if (!wasConverted) {
      const offerKey = nextOfferKey;
      const tierLabel = offerKeyToLabel(offerKey, existing.tier);
      const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
      await sendPostmarkReactEmail({
        to: existing.applicantEmail,
        subject: "Your 1:1 support is confirmed",
        react: CoachingClientConfirmedEmail({
          firstName: existing.applicantFirstName,
          tierLabel,
          dashboardUrl,
          decisionReason: updated.decisionReason,
        }),
        textBody: `Hi ${existing.applicantFirstName},\n\nYour ${tierLabel} support is confirmed and your client profile is ready. There is no payment step for this arrangement.${updated.decisionReason ? `\n\nA note from Shruti:\n${updated.decisionReason}` : ""}\n\nSign in to your account to follow your onboarding status: ${dashboardUrl}`,
        tag: "coaching-client-confirmed",
        templateKey: "coaching-client-confirmed",
        category: "transactional",
        userId: existing.userId,
        retryable: true,
        metadata: {
          applicationId: existing.id,
          tier: existing.tier,
          conversionMode: "admin_direct",
        },
        dispatchMode: "immediate_best_effort",
      }).catch((error) => {
        console.error("[coaching] failed to send direct conversion confirmation email", error);
      });
    }
  }

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_application_updated",
      targetType: "coaching_application",
      targetId: updated.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        status: existing.status,
        adminNotes: existing.adminNotes,
        decisionReason: existing.decisionReason,
        reviewedAt: existing.reviewedAt,
        approvedAt: existing.approvedAt,
        waitlistedAt: existing.waitlistedAt,
        waitlistLeftAt: existing.waitlistLeftAt,
        convertedAt: existing.convertedAt,
        consultationStatus: existing.consultationStatus,
        consultationScheduledAt: existing.consultationScheduledAt,
        consultationCompletedAt: existing.consultationCompletedAt,
        recommendedOfferKey: existing.recommendedOfferKey,
        offerSentAt: existing.offerSentAt,
        userId: existing.userId,
      },
      newValueJson: {
        status: updated.status,
        adminNotes: updated.adminNotes,
        decisionReason: updated.decisionReason,
        reviewedAt: updated.reviewedAt,
        approvedAt: updated.approvedAt,
        waitlistedAt: updated.waitlistedAt,
        waitlistLeftAt: updated.waitlistLeftAt,
        convertedAt: updated.convertedAt,
        consultationStatus: updated.consultationStatus,
        consultationScheduledAt: updated.consultationScheduledAt,
        consultationCompletedAt: updated.consultationCompletedAt,
        recommendedOfferKey: updated.recommendedOfferKey,
        offerSentAt: updated.offerSentAt,
        userId: updated.userId,
      },
      metadataJson: {
        convertToClient: input.convertToClient === true,
        consultationNotesChanged:
          input.consultationNotes !== undefined &&
          existing.consultationNotes !== updated.consultationNotes,
      },
    });
  }

  return updated;
}

export async function sendCoachingPaymentReminder(input: {
  applicationId: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const application = await db.coachingApplication.findUnique({
    where: { id: input.applicationId },
    include: {
      clientProfile: {
        select: { id: true, status: true },
      },
      user: {
        select: { id: true },
      },
    },
  });
  if (!application) throw new Error("NOT_FOUND");
  if (application.status !== "approved") {
    throw new Error("COACHING_PAYMENT_REMINDER_NOT_ALLOWED");
  }
  if (!application.userId || !application.user) {
    throw new Error("COACHING_PAYMENT_REMINDER_ACCOUNT_REQUIRED");
  }
  if (application.clientProfile) {
    throw new Error("COACHING_PAYMENT_REMINDER_NOT_ALLOWED");
  }

  const offerKey = getOfferKeyFromAnswers(application.answersJson as CoachingApplicationAnswerMap);
  const tierLabel = offerKeyToLabel(offerKey, application.tier);
  const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");

  await sendPostmarkReactEmail({
    to: application.applicantEmail,
    subject: "A reminder to complete your 1:1 payment",
    react: CoachingPaymentReminderEmail({
      firstName: application.applicantFirstName,
      tierLabel,
      dashboardUrl,
    }),
    textBody: `Hi ${application.applicantFirstName},\n\nA friendly reminder that your application for ${tierLabel} has been approved.\n\nWhen you are ready, sign in to your Private Studio, review the agreements and complete payment from your dashboard.\n\nContinue: ${dashboardUrl}`,
    tag: "coaching-payment-reminder",
    templateKey: "coaching-payment-reminder",
    metadata: {
      applicationId: application.id,
      tier: application.tier,
    },
    dispatchMode: "immediate_best_effort",
  });

  const paymentReminderSentAt = new Date();
  const updated = await db.coachingApplication.update({
    where: { id: application.id },
    data: {
      paymentReminderSentAt,
      paymentReminderSentByUserId: input.actorUserId || null,
    },
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_payment_reminder_sent",
      targetType: "coaching_application",
      targetId: application.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        paymentReminderSentAt: application.paymentReminderSentAt,
        paymentReminderSentByUserId: application.paymentReminderSentByUserId,
      },
      newValueJson: {
        paymentReminderSentAt: updated.paymentReminderSentAt,
        paymentReminderSentByUserId: updated.paymentReminderSentByUserId,
      },
      metadataJson: {
        tier: application.tier,
        applicantEmail: application.applicantEmail,
      },
    });
  }

  return updated;
}

export async function leaveCoachingWaitlist(userId: string) {
  const application = await db.coachingApplication.findFirst({
    where: {
      userId,
      status: "waitlisted",
    },
    orderBy: [{ waitlistedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!application) throw new Error("WAITLIST_ENTRY_NOT_FOUND");

  const updated = await db.coachingApplication.update({
    where: { id: application.id },
    data: {
      status: "withdrawn",
      waitlistLeftAt: new Date(),
    },
  });

  const offerKey = getRecommendedOfferKey(application);
  const tierLabel = offerKeyToLabel(offerKey, application.tier);
  const clientName = `${application.applicantFirstName} ${application.applicantLastName}`.trim();
  const adminUrl = buildAbsoluteUrl("/admin/coaching");
  await sendPostmarkReactEmail({
    to: getNotificationInbox("COACHING_WAITLIST_NOTIFICATION_EMAIL"),
    subject: `Coaching waiting list left: ${clientName || application.applicantEmail}`,
    react: CoachingWaitlistLeftNotificationEmail({
      clientName: clientName || application.applicantEmail,
      clientEmail: application.applicantEmail,
      tierLabel,
      adminUrl,
    }),
    textBody: `${clientName || application.applicantEmail} has left the coaching waiting list.\nEmail: ${application.applicantEmail}\nApplication: ${tierLabel}\n\nAdmin: ${adminUrl}`,
    tag: "coaching-waitlist-left",
    templateKey: "coaching-waitlist-left",
    metadata: {
      applicationId: application.id,
      tier: application.tier,
    },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[coaching] failed to send waitlist-left notification", error);
  });

  return updated;
}

export async function updateCoachingProfileManualSetupStatus(input: {
  profileId: string;
  everfitConnectionStatus: "not_started" | "invite_sent" | "connected" | "sync_issue";
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const existing = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const updated = await db.coachingClientProfile.update({
    where: { id: input.profileId },
    data: { everfitConnectionStatus: input.everfitConnectionStatus },
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_manual_setup_status_updated",
      targetType: "coaching_client_profile",
      targetId: updated.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        everfitConnectionStatus: existing.everfitConnectionStatus,
      },
      newValueJson: {
        everfitConnectionStatus: updated.everfitConnectionStatus,
      },
    });
  }

  return updated;
}

export async function updateCoachingProfileStatus(input: {
  profileId: string;
  status: "onboarding" | "active" | "paused" | "completed";
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const existing = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const updated = await db.coachingClientProfile.update({
    where: { id: input.profileId },
    data: {
      status: input.status,
      startDate: input.status === "active" && !existing.startDate ? new Date() : undefined,
      pausedAt: input.status === "paused" ? new Date() : undefined,
      completedAt: input.status === "completed" ? new Date() : undefined,
    },
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_profile_status_updated",
      targetType: "coaching_client_profile",
      targetId: updated.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        status: existing.status,
        startDate: existing.startDate,
        pausedAt: existing.pausedAt,
        completedAt: existing.completedAt,
      },
      newValueJson: {
        status: updated.status,
        startDate: updated.startDate,
        pausedAt: updated.pausedAt,
        completedAt: updated.completedAt,
      },
    });
  }

  return updated;
}

export async function createCoachingPackageChangeRequest(input: {
  profileId: string;
  toOfferKey: CoachingOfferKey;
  effectiveMode: "next_invoice" | "immediate";
  note?: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const targetOffer = activeCoachingTiers.find((offer) => offer.id === input.toOfferKey);
  if (!targetOffer) throw new Error("INVALID_COACHING_OFFER");

  const profile = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, name: true },
      },
      application: true,
    },
  });
  if (!profile) throw new Error("NOT_FOUND");
  if (profile.billingArrangement === "pro_bono" || !profile.stripeSubscriptionId) {
    throw new Error("COACHING_PAID_START_REQUIRED");
  }

  await db.coachingPackageChangeRequest.updateMany({
    where: { profileId: profile.id, status: "pending_client_confirmation" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const fromOfferKey = profile.application
    ? getRecommendedOfferKey(profile.application)
    : tierToDefaultOfferKey(profile.tier);
  const toTier = offerKeyToTier(input.toOfferKey);
  const request = await db.coachingPackageChangeRequest.create({
    data: {
      userId: profile.userId,
      profileId: profile.id,
      requestedByUserId: input.actorUserId || undefined,
      fromTier: profile.tier,
      toTier,
      fromOfferKey,
      toOfferKey: input.toOfferKey,
      effectiveMode: input.effectiveMode,
      note: input.note?.trim() || null,
      stripeSubscriptionId: profile.stripeSubscriptionId || null,
    },
  });

  const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
  const clientName = profile.user.firstName || profile.user.name || "there";
  await sendPostmarkReactEmail({
    to: profile.user.email,
    subject: "Review your coaching package change",
    react: CoachingPackageChangeRequestedEmail({
      firstName: clientName,
      fromLabel: offerKeyToLabel(fromOfferKey, profile.tier),
      toLabel: targetOffer.name,
      effectiveMode: input.effectiveMode,
      dashboardUrl,
      note: request.note,
    }),
    textBody: `Hi ${clientName},\n\nShruti has suggested moving your coaching package from ${offerKeyToLabel(fromOfferKey, profile.tier)} to ${targetOffer.name}. Sign in to your coaching dashboard to review and confirm the change.${request.note ? `\n\nA note from Shruti:\n${request.note}` : ""}\n\nReview: ${dashboardUrl}`,
    tag: "coaching-package-change-requested",
    templateKey: "coaching-package-change-requested",
    metadata: {
      packageChangeRequestId: request.id,
      userId: profile.userId,
      toOfferKey: input.toOfferKey,
    },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[coaching] failed to send package change email", error);
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_package_change_requested",
      targetType: "coaching_package_change_request",
      targetId: request.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      newValueJson: {
        profileId: profile.id,
        userId: profile.userId,
        fromTier: profile.tier,
        toTier,
        fromOfferKey,
        toOfferKey: input.toOfferKey,
        effectiveMode: input.effectiveMode,
      },
    });
  }

  return request;
}

export async function createCoachingPaidStartRequest(input: {
  profileId: string;
  toOfferKey: CoachingOfferKey;
  billingStartsAt: Date;
  note?: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const targetOffer = activeCoachingTiers.find((offer) => offer.id === input.toOfferKey);
  if (!targetOffer) throw new Error("INVALID_COACHING_OFFER");

  const profile = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, name: true },
      },
      application: true,
    },
  });
  if (!profile) throw new Error("NOT_FOUND");
  if (profile.billingArrangement !== "pro_bono" || profile.stripeSubscriptionId) {
    throw new Error("COACHING_PAID_START_NOT_AVAILABLE");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (input.billingStartsAt.getTime() < today.getTime()) {
    throw new Error("COACHING_PAID_START_DATE_INVALID");
  }

  await db.coachingPackageChangeRequest.updateMany({
    where: { profileId: profile.id, status: "pending_client_confirmation" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const fromOfferKey = profile.application
    ? getRecommendedOfferKey(profile.application)
    : tierToDefaultOfferKey(profile.tier);
  const toTier = offerKeyToTier(input.toOfferKey);
  const request = await db.coachingPackageChangeRequest.create({
    data: {
      userId: profile.userId,
      profileId: profile.id,
      requestedByUserId: input.actorUserId || undefined,
      requestType: "paid_start",
      billingStartsAt: input.billingStartsAt,
      fromTier: profile.tier,
      toTier,
      fromOfferKey,
      toOfferKey: input.toOfferKey,
      effectiveMode: "immediate",
      note: input.note?.trim() || null,
    },
  });

  const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
  const clientName = profile.user.firstName || profile.user.name || "there";
  const formattedStartDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(input.billingStartsAt);
  await sendPostmarkReactEmail({
    to: profile.user.email,
    subject: "Set up your paid 1:1 plan",
    react: CoachingPaidStartRequestedEmail({
      firstName: clientName,
      offerLabel: targetOffer.name,
      billingStartsOn: formattedStartDate,
      dashboardUrl,
      note: request.note,
    }),
    textBody: `Hi ${clientName},\n\nShruti has invited you to move onto the paid ${targetOffer.name} plan from ${formattedStartDate}. Your current pro-bono arrangement remains in place until then. Sign in to review the current agreements and add your payment details. You will not be charged before the agreed start date.${request.note ? `\n\nA note from Shruti:\n${request.note}` : ""}\n\nSet up your plan: ${dashboardUrl}`,
    tag: "coaching-paid-start-requested",
    templateKey: "coaching-paid-start-requested",
    category: "transactional",
    userId: profile.userId,
    retryable: true,
    metadata: {
      paidStartRequestId: request.id,
      userId: profile.userId,
      toOfferKey: input.toOfferKey,
      billingStartsAt: input.billingStartsAt.toISOString(),
    },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[coaching] failed to send paid-start email", error);
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_paid_start_requested",
      targetType: "coaching_package_change_request",
      targetId: request.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      newValueJson: {
        profileId: profile.id,
        userId: profile.userId,
        fromTier: profile.tier,
        toTier,
        fromOfferKey,
        toOfferKey: input.toOfferKey,
        billingStartsAt: input.billingStartsAt,
      },
    });
  }

  return request;
}

export async function applyCoachingPackageChangeManually(input: {
  profileId: string;
  toOfferKey: CoachingOfferKey;
  note?: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const targetOffer = activeCoachingTiers.find((offer) => offer.id === input.toOfferKey);
  if (!targetOffer) throw new Error("INVALID_COACHING_OFFER");

  const profile = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
    include: { application: true },
  });
  if (!profile) throw new Error("NOT_FOUND");

  const fromOfferKey = profile.application
    ? getRecommendedOfferKey(profile.application)
    : tierToDefaultOfferKey(profile.tier);
  const toTier = offerKeyToTier(input.toOfferKey);

  const request = await db.$transaction(async (tx) => {
    await tx.coachingPackageChangeRequest.updateMany({
      where: { profileId: profile.id, status: "pending_client_confirmation" },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    const created = await tx.coachingPackageChangeRequest.create({
      data: {
        userId: profile.userId,
        profileId: profile.id,
        requestedByUserId: input.actorUserId || undefined,
        fromTier: profile.tier,
        toTier,
        fromOfferKey,
        toOfferKey: input.toOfferKey,
        effectiveMode: "manual",
        status: "applied",
        note: input.note?.trim() || null,
        stripeSubscriptionId: profile.stripeSubscriptionId || null,
        appliedAt: new Date(),
      },
    });
    await tx.coachingClientProfile.update({
      where: { id: profile.id },
      data: {
        tier: toTier,
      },
    });
    return created;
  });

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "coaching_package_change_applied_manually",
      targetType: "coaching_package_change_request",
      targetId: request.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        profileId: profile.id,
        userId: profile.userId,
        fromTier: profile.tier,
        fromOfferKey,
      },
      newValueJson: {
        profileId: profile.id,
        userId: profile.userId,
        toTier,
        toOfferKey: input.toOfferKey,
      },
    });
  }

  return request;
}

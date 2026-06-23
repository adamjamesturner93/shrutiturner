import {
  CoachingApplicationStatus,
  CoachingPackageChangeEffectiveMode,
  CoachingSupportTier,
  Prisma,
} from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import type { CoachingDashboardDto } from "@/lib/api/types";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { linkPendingRecordsForUser } from "@/lib/link-pending-records";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { CURRENT_COACHING_AGREEMENT_VERSION } from "@/data/legal-documents";
import { coachingTiers, type CoachingOfferKey } from "@/data/marketing";
import CoachingApplicationApprovedEmail from "@/emails/coaching-application-approved";
import CoachingApplicationConfirmationEmail from "@/emails/coaching-application-confirmation";
import CoachingApplicationNotificationEmail from "@/emails/coaching-application-notification";
import CoachingApplicationRejectedEmail from "@/emails/coaching-application-rejected";
import CoachingApplicationWaitlistedEmail from "@/emails/coaching-application-waitlisted";
import CoachingPackageChangeRequestedEmail from "@/emails/coaching-package-change-requested";
import CoachingWaitlistLeftNotificationEmail from "@/emails/coaching-waitlist-left-notification";

export type CoachingApplicationAnswerMap = Record<string, string>;

const applicationStatuses: CoachingApplicationStatus[] = [
  "submitted",
  "under_review",
  "follow_up_needed",
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
      return "Independent Training Plan";
    case "coached_plan":
      return "Guided Training Plan";
    case "coaching":
      return "1:1 Offers";
    case "unsure":
      return "Unsure";
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

function summarizeAnswers(answers: CoachingApplicationAnswerMap) {
  return Object.entries(answers)
    .filter(([key, value]) => key !== "offerKey" && value.trim())
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value.trim().slice(0, 160)}`);
}

export async function submitCoachingApplication(input: {
  userId?: string | null;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  tier: CoachingSupportTier;
  answers: CoachingApplicationAnswerMap;
  isExistingCoachingClientSnapshot: boolean;
}) {
  const applicantFirstName = normalizeName(input.applicantFirstName);
  const applicantLastName = normalizeName(input.applicantLastName);
  const applicantEmail = normalizeEmail(input.applicantEmail);

  if (!applicantFirstName || !applicantLastName) throw new Error("NAME_REQUIRED");
  if (!applicantEmail || !applicantEmail.includes("@")) throw new Error("EMAIL_REQUIRED");

  const answers = Object.fromEntries(
    Object.entries(input.answers).map(([key, value]) => [key, value.trim().slice(0, 4000)])
  ) as CoachingApplicationAnswerMap;
  const existingUser = input.userId
    ? null
    : await db.user.findUnique({
        where: { email: applicantEmail },
        select: { id: true },
      });

  const application = await db.coachingApplication.create({
    data: {
      userId: input.userId || existingUser?.id || undefined,
      applicantFirstName,
      applicantLastName,
      applicantEmail,
      tier: input.tier,
      answersJson: answers as Prisma.InputJsonValue,
      isExistingCoachingClientSnapshot: input.isExistingCoachingClientSnapshot,
      coachingAgreementVersion: CURRENT_COACHING_AGREEMENT_VERSION,
      coachingAgreementAcceptedAt: new Date(),
      source: "public_coaching_apply",
    },
  });

  const offerKey = getOfferKeyFromAnswers(answers);
  const tierLabel = offerKeyToLabel(offerKey, input.tier);
  const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
  const adminUrl = buildAbsoluteUrl("/admin/coaching");
  const summary = summarizeAnswers(answers);

  await Promise.allSettled([
    sendPostmarkReactEmail({
      to: applicantEmail,
      subject: "Your coaching application has been received",
      react: CoachingApplicationConfirmationEmail({
        firstName: applicantFirstName,
        tierLabel,
        dashboardUrl,
      }),
      textBody: `Hi ${applicantFirstName},\n\nThanks for requesting to work with Shruti to support your health and wellbeing. Look out for an email from Shruti within the next 48 hours. Don’t forget to check your spam.\n\nDashboard: ${dashboardUrl}`,
      tag: "coaching-application-confirmation",
      templateKey: "coaching-application-confirmation",
      metadata: {
        applicationId: application.id,
        tier: input.tier,
      },
      dispatchMode: "immediate_best_effort",
    }),
    sendPostmarkReactEmail({
      to: getNotificationInbox("COACHING_APPLICATION_NOTIFICATION_EMAIL"),
      subject: `New coaching application: ${applicantFirstName} ${applicantLastName}`,
      react: CoachingApplicationNotificationEmail({
        name: `${applicantFirstName} ${applicantLastName}`.trim(),
        email: applicantEmail,
        tierLabel,
        summary,
        adminUrl,
      }),
      textBody: `New coaching application from ${applicantFirstName} ${applicantLastName}\nEmail: ${applicantEmail}\nTier: ${tierLabel}\n\n${summary.join("\n")}\n\nReview: ${adminUrl}`,
      tag: "coaching-application-notification",
      templateKey: "coaching-application-notification",
      replyTo: applicantEmail,
      metadata: {
        applicationId: application.id,
        tier: input.tier,
      },
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
        checkIns: {
          orderBy: { dueAt: "asc" },
          take: 1,
        },
        sessions: {
          where: { status: "scheduled" },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
        application: true,
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
    const nextCheckIn = profile.checkIns[0];
    const nextSession = profile.sessions[0];
    return {
      state: profile.status as CoachingDashboardDto["state"],
      hasProfile: true,
      isCoachingClient: Boolean(user?.isCoachingClient),
      profile: {
        id: profile.id,
        tier: profile.tier as NonNullable<CoachingDashboardDto["profile"]>["tier"],
        status: profile.status as NonNullable<CoachingDashboardDto["profile"]>["status"],
        everfitConnectionStatus: profile.everfitConnectionStatus as NonNullable<
          CoachingDashboardDto["profile"]
        >["everfitConnectionStatus"],
        nextCheckInDueAt:
          nextCheckIn?.dueAt.toISOString() || profile.nextCheckInDueAt?.toISOString() || null,
        nextCheckInStatus:
          (nextCheckIn?.status as NonNullable<
            CoachingDashboardDto["profile"]
          >["nextCheckInStatus"]) || null,
        nextSessionStartsAt: nextSession?.startsAt.toISOString() || null,
        latestCoachResponseSummary: profile.latestCoachResponseSummary || null,
        billingCancellationRequestedAt:
          profile.billingCancellationRequestedAt?.toISOString() || null,
        billingFinalPaymentAt: profile.billingFinalPaymentAt?.toISOString() || null,
        billingEndsAt: profile.billingEndsAt?.toISOString() || null,
        pendingPackageChange: serializePendingPackageChange(profile.packageChangeRequests[0]),
      },
      application: latestApplication
        ? {
            id: latestApplication.id,
            offerKey: getOfferKeyFromAnswers(
              latestApplication.answersJson as CoachingApplicationAnswerMap
            ),
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
        offerKey: getOfferKeyFromAnswers(
          latestApplication.answersJson as CoachingApplicationAnswerMap
        ),
        status: latestApplication.status as NonNullable<
          CoachingDashboardDto["application"]
        >["status"],
        decisionReason: latestApplication.decisionReason || null,
        tier: latestApplication.tier as NonNullable<CoachingDashboardDto["application"]>["tier"],
        createdAt: latestApplication.createdAt.toISOString(),
        waitlistedAt: latestApplication.waitlistedAt?.toISOString() || null,
        waitlistLeftAt: latestApplication.waitlistLeftAt?.toISOString() || null,
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
          packageChangeRequests: {
            where: { status: "pending_client_confirmation" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const answers = row.answersJson as CoachingApplicationAnswerMap;

    return {
      offerKey: getOfferKeyFromAnswers(answers),
      id: row.id,
      applicantName: `${row.applicantFirstName} ${row.applicantLastName}`.trim(),
      applicantEmail: row.applicantEmail,
      status: row.status,
      tier: row.tier,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() || null,
      approvedAt: row.approvedAt?.toISOString() || null,
      waitlistedAt: row.waitlistedAt?.toISOString() || null,
      waitlistLeftAt: row.waitlistLeftAt?.toISOString() || null,
      userId: row.userId,
      isLinkedUserCoachingClient: row.user?.isCoachingClient || false,
      answers,
      decisionReason: row.decisionReason || "",
      adminNotes: row.adminNotes || "",
      coachingProfile: row.clientProfile
        ? {
            id: row.clientProfile.id,
            tier: row.clientProfile.tier,
            status: row.clientProfile.status,
            everfitConnectionStatus: row.clientProfile.everfitConnectionStatus,
            billingCancellationRequestedAt:
              row.clientProfile.billingCancellationRequestedAt?.toISOString() || null,
            billingFinalPaymentAt: row.clientProfile.billingFinalPaymentAt?.toISOString() || null,
            billingEndsAt: row.clientProfile.billingEndsAt?.toISOString() || null,
            pendingPackageChange: serializePendingPackageChange(
              row.clientProfile.packageChangeRequests[0]
            ),
          }
        : null,
    };
  });
}

export async function updateAdminCoachingApplication(input: {
  id: string;
  status?: CoachingApplicationStatus;
  adminNotes?: string;
  decisionReason?: string;
  convertToClient?: boolean;
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
  const nextDecisionReason =
    input.decisionReason !== undefined ? input.decisionReason.trim() : existing.decisionReason;
  if (nextStatus === "declined" && !nextDecisionReason?.trim()) {
    throw new Error("DECISION_REASON_REQUIRED");
  }
  const wasApproved = existing.status === "approved" || existing.status === "converted";
  const wasDeclined = existing.status === "declined";
  const wasWaitlisted = existing.status === "waitlisted";
  const now = new Date();
  const updated = await db.coachingApplication.update({
    where: { id: input.id },
    data: {
      status: nextStatus,
      adminNotes: input.adminNotes !== undefined ? input.adminNotes.trim() : undefined,
      decisionReason: input.decisionReason !== undefined ? input.decisionReason.trim() : undefined,
      reviewedAt: input.status || input.convertToClient ? now : undefined,
      waitlistedAt: nextStatus === "waitlisted" && !wasWaitlisted ? now : undefined,
      waitlistLeftAt: wasWaitlisted && nextStatus !== "waitlisted" ? now : undefined,
      approvedAt: nextStatus === "approved" ? now : undefined,
      convertedAt: input.convertToClient ? now : undefined,
    },
  });

  if (nextStatus === "approved" && !wasApproved) {
    const offerKey = getOfferKeyFromAnswers(existing.answersJson as CoachingApplicationAnswerMap);
    const tierLabel = offerKeyToLabel(offerKey, existing.tier);
    const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
    await sendPostmarkReactEmail({
      to: existing.applicantEmail,
      subject: "Your coaching application has been approved",
      react: CoachingApplicationApprovedEmail({
        firstName: existing.applicantFirstName,
        tierLabel,
        dashboardUrl,
        decisionReason: updated.decisionReason,
      }),
      textBody: `Hi ${existing.applicantFirstName},\n\nYour application for ${tierLabel} has been approved. Sign in to your Private Studio to complete payment and start onboarding.${updated.decisionReason ? `\n\nA note from Shruti:\n${updated.decisionReason}` : ""}\n\nContinue: ${dashboardUrl}`,
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
    const offerKey = getOfferKeyFromAnswers(existing.answersJson as CoachingApplicationAnswerMap);
    const tierLabel = offerKeyToLabel(offerKey, existing.tier);
    const dashboardUrl = buildAbsoluteUrl("/dashboard/coaching");
    await sendPostmarkReactEmail({
      to: existing.applicantEmail,
      subject: "Your coaching application has been reviewed",
      react: CoachingApplicationRejectedEmail({
        firstName: existing.applicantFirstName,
        tierLabel,
        decisionReason: updated.decisionReason || nextDecisionReason || "",
        dashboardUrl,
      }),
      textBody: `Hi ${existing.applicantFirstName},\n\nThank you for applying for ${tierLabel}. Shruti has reviewed your application and this coaching offer is not the right fit at the moment.\n\nA note from Shruti:\n${updated.decisionReason || nextDecisionReason}\n\nDashboard: ${dashboardUrl}`,
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
    const offerKey = getOfferKeyFromAnswers(existing.answersJson as CoachingApplicationAnswerMap);
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
      textBody: `Hi ${existing.applicantFirstName},\n\nShruti has reviewed your application for ${tierLabel}. There is not capacity to start coaching immediately, so you have been added to the coaching waiting list.${updated.decisionReason || nextDecisionReason ? `\n\nA note from Shruti:\n${updated.decisionReason || nextDecisionReason}` : ""}\n\nYou do not need to pay now. If a place opens, Shruti will email you with the next step. You can leave the waiting list from your coaching dashboard.\n\nDashboard: ${dashboardUrl}`,
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
    await db.coachingClientProfile.upsert({
      where: { userId: existing.userId },
      create: {
        userId: existing.userId,
        applicationId: existing.id,
        tier: existing.tier === "unsure" ? "coaching" : existing.tier,
        status: "onboarding",
        nextCheckInDueAt: new Date(Date.now() + 7 * 86400000),
      },
      update: {
        applicationId: existing.id,
        tier: existing.tier === "unsure" ? "coaching" : existing.tier,
        status: "onboarding",
      },
    });

    await db.user.update({
      where: { id: existing.userId },
      data: { isCoachingClient: true },
    });
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
        userId: updated.userId,
      },
      metadataJson: {
        convertToClient: input.convertToClient === true,
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

  const offerKey = getOfferKeyFromAnswers(application.answersJson as CoachingApplicationAnswerMap);
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
  const targetOffer = coachingTiers.find((offer) => offer.id === input.toOfferKey);
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

  await db.coachingPackageChangeRequest.updateMany({
    where: { profileId: profile.id, status: "pending_client_confirmation" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const fromOfferKey = profile.application
    ? getOfferKeyFromAnswers(profile.application.answersJson as CoachingApplicationAnswerMap)
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

export async function applyCoachingPackageChangeManually(input: {
  profileId: string;
  toOfferKey: CoachingOfferKey;
  note?: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const targetOffer = coachingTiers.find((offer) => offer.id === input.toOfferKey);
  if (!targetOffer) throw new Error("INVALID_COACHING_OFFER");

  const profile = await db.coachingClientProfile.findUnique({
    where: { id: input.profileId },
    include: { application: true },
  });
  if (!profile) throw new Error("NOT_FOUND");

  const fromOfferKey = profile.application
    ? getOfferKeyFromAnswers(profile.application.answersJson as CoachingApplicationAnswerMap)
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

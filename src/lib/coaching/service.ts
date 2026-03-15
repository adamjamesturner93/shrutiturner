import { CoachingApplicationStatus, CoachingSupportTier, Prisma } from "@prisma/client";
import type { CoachingDashboardDto } from "@/lib/api/types";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { CURRENT_COACHING_AGREEMENT_VERSION } from "@/data/legal-documents";
import CoachingApplicationConfirmationEmail from "@/emails/coaching-application-confirmation";
import CoachingApplicationNotificationEmail from "@/emails/coaching-application-notification";

export type CoachingApplicationAnswerMap = Record<string, string>;

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
      return "Coached Training Plan";
    case "coaching":
      return "Coaching";
    case "unsure":
      return "Unsure";
    default:
      return "Coaching";
  }
}

function summarizeAnswers(answers: CoachingApplicationAnswerMap) {
  return Object.entries(answers)
    .filter(([, value]) => value.trim())
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
  hasMoveWellMembershipSnapshot: boolean;
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

  const application = await db.coachingApplication.create({
    data: {
      userId: input.userId || undefined,
      applicantFirstName,
      applicantLastName,
      applicantEmail,
      tier: input.tier,
      answersJson: answers as Prisma.InputJsonValue,
      hasMoveWellMembershipSnapshot: input.hasMoveWellMembershipSnapshot,
      isExistingCoachingClientSnapshot: input.isExistingCoachingClientSnapshot,
      coachingAgreementVersion: CURRENT_COACHING_AGREEMENT_VERSION,
      coachingAgreementAcceptedAt: new Date(),
      source: "public_coaching_apply",
    },
  });

  const tierLabel = tierToLabel(input.tier);
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
      textBody: `Hi ${applicantFirstName},\n\nThanks for applying for ${tierLabel}. Your application is in and will be reviewed personally within 48 hours.\n\nDashboard: ${dashboardUrl}`,
      tag: "coaching-application-confirmation",
      metadata: {
        applicationId: application.id,
        tier: input.tier,
      },
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
      replyTo: applicantEmail,
      metadata: {
        applicationId: application.id,
        tier: input.tier,
      },
    }),
  ]);

  return application;
}

export async function getMyCoachingState(userId: string): Promise<CoachingDashboardDto> {
  const [profile, latestApplication, user] = await Promise.all([
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
      },
    }),
    db.coachingApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { isCoachingClient: true },
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
        includesMoveWellMembership: profile.includesMoveWellMembership,
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
      },
      application: latestApplication
        ? {
            id: latestApplication.id,
            status: latestApplication.status as NonNullable<
              CoachingDashboardDto["application"]
            >["status"],
            tier: latestApplication.tier as NonNullable<
              CoachingDashboardDto["application"]
            >["tier"],
            createdAt: latestApplication.createdAt.toISOString(),
          }
        : null,
    };
  }

  if (latestApplication) {
    return {
      state: "application_pending",
      hasProfile: false,
      isCoachingClient: Boolean(user?.isCoachingClient),
      profile: null,
      application: {
        id: latestApplication.id,
        status: latestApplication.status as NonNullable<
          CoachingDashboardDto["application"]
        >["status"],
        tier: latestApplication.tier as NonNullable<CoachingDashboardDto["application"]>["tier"],
        createdAt: latestApplication.createdAt.toISOString(),
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
    params?.status &&
    ["submitted", "under_review", "follow_up_needed", "approved", "declined", "converted"].includes(
      params.status
    )
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
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isCoachingClient: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    applicantName: `${row.applicantFirstName} ${row.applicantLastName}`.trim(),
    applicantEmail: row.applicantEmail,
    status: row.status,
    tier: row.tier,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() || null,
    approvedAt: row.approvedAt?.toISOString() || null,
    userId: row.userId,
    isLinkedUserCoachingClient: row.user?.isCoachingClient || false,
    hasMoveWellMembershipSnapshot: row.hasMoveWellMembershipSnapshot,
    answers: row.answersJson as CoachingApplicationAnswerMap,
    adminNotes: row.adminNotes || "",
  }));
}

export async function updateAdminCoachingApplication(input: {
  id: string;
  status?: CoachingApplicationStatus;
  adminNotes?: string;
  convertToClient?: boolean;
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

  const nextStatus = input.status || existing.status;
  const updated = await db.coachingApplication.update({
    where: { id: input.id },
    data: {
      status: nextStatus,
      adminNotes: input.adminNotes !== undefined ? input.adminNotes.trim() : undefined,
      reviewedAt: input.status ? new Date() : undefined,
      approvedAt: nextStatus === "approved" ? new Date() : undefined,
      convertedAt: input.convertToClient ? new Date() : undefined,
    },
  });

  if (input.convertToClient && existing.userId) {
    await db.coachingClientProfile.upsert({
      where: { userId: existing.userId },
      create: {
        userId: existing.userId,
        applicationId: existing.id,
        tier: existing.tier === "unsure" ? "coaching" : existing.tier,
        status: "onboarding",
        includesMoveWellMembership:
          existing.tier === "coaching" || existing.tier === "coached_plan",
        nextCheckInDueAt: new Date(Date.now() + 7 * 86400000),
      },
      update: {
        applicationId: existing.id,
        tier: existing.tier === "unsure" ? "coaching" : existing.tier,
        status: "onboarding",
        includesMoveWellMembership:
          existing.tier === "coaching" || existing.tier === "coached_plan",
      },
    });

    await db.user.update({
      where: { id: existing.userId },
      data: { isCoachingClient: true },
    });
  }

  return updated;
}

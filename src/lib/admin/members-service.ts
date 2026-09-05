import { AcceptanceType, ClassBookingStatus, MembershipStatus, UserRole } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { adjustCredits, getCreditBalance } from "@/lib/credits/credit-service";
import { getReferralBalancePence } from "@/lib/referrals/referral-discount-service";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import { getInstructorProfilesByIds } from "@/lib/content";
import type { AdminHealthProfileDto, AdminLegalAgreementDto } from "@/lib/api/types";
import {
  getAcceptanceRequirementStates,
  PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS,
} from "@/lib/legal/acceptance-service";

function mapMembershipLabel(plan: string | null, status?: MembershipStatus | null) {
  if (!plan) return "Pay as you Go";
  if (plan === "instructor") return "Unlimited (instructor)";
  const title = plan === "movewell" ? "Move Well Membership" : "Unknown";
  if (status && status !== "active") return `${title} (${status.replaceAll("_", " ")})`;
  return title;
}

function toRiskStatus(params: {
  status: MembershipStatus | null;
  lastClassDate: Date | null;
  membershipPlan: string | null;
  creditBalance: number;
}) {
  const today = Date.now();
  const lastClassTs = params.lastClassDate?.getTime() ?? 0;
  const twoWeeksAgo = today - 14 * 86400000;
  const fourWeeksAgo = today - 28 * 86400000;

  if (params.status !== "active") return null;
  if (params.membershipPlan && lastClassTs && lastClassTs < fourWeeksAgo) return "high";
  if (lastClassTs && lastClassTs < twoWeeksAgo) return "medium";
  if (!params.membershipPlan && params.creditBalance > 0 && params.creditBalance <= 2) {
    return "credits-expiring";
  }
  return null;
}

const CONDITION_LOOKUP = new Map(
  HEALTH_CATEGORIES.flatMap((category) =>
    category.items.map((item) => [
      item.key,
      {
        categoryId: category.id,
        categoryTitle: category.title,
        label: item.label,
      },
    ])
  )
);

function toAdminHealthProfile(
  profile: {
    userId: string;
    declarationStatus: "none_declared" | "context_declared";
    tracksFlareCheckIns: boolean;
    additionalNotes: string;
    lastConfirmedAt: Date;
    lastUpdatedAt: Date;
    reviewRequestedAt: Date | null;
    selections: Array<{ conditionKey: string; detail: string | null }>;
    revisions: Array<{
      updatedByUserId: string;
      updatedByUser: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        name: string | null;
      };
    }>;
  } | null
): AdminHealthProfileDto | null {
  if (!profile) return null;

  const conditions: Record<string, boolean> = {};
  const details: Record<string, string> = {};

  const categories = new Map<
    string,
    {
      categoryId: string;
      categoryTitle: string;
      conditions: AdminHealthProfileDto["categories"][number]["conditions"];
    }
  >();

  for (const selection of profile.selections) {
    conditions[selection.conditionKey] = true;
    if (selection.detail) details[selection.conditionKey] = selection.detail;
    const metadata = CONDITION_LOOKUP.get(selection.conditionKey);
    const categoryId = metadata?.categoryId ?? "other";
    const categoryTitle = metadata?.categoryTitle ?? "Other";
    const label = metadata?.label ?? selection.conditionKey;

    if (!categories.has(categoryId)) {
      categories.set(categoryId, { categoryId, categoryTitle, conditions: [] });
    }
    categories.get(categoryId)!.conditions.push({
      key: selection.conditionKey,
      label,
      detail: selection.detail ?? "",
    });
  }

  const sortedCategories = Array.from(categories.values()).sort((a, b) =>
    a.categoryTitle.localeCompare(b.categoryTitle)
  );

  return {
    categories: sortedCategories,
    declarationStatus: profile.declarationStatus,
    conditions,
    details,
    tracksFlareCheckIns: profile.tracksFlareCheckIns,
    additionalNotes: profile.additionalNotes ?? "",
    lastConfirmedAt: profile.lastConfirmedAt.toISOString(),
    lastUpdated: profile.lastUpdatedAt.toISOString(),
    reviewRequestedAt: profile.reviewRequestedAt?.toISOString() || null,
    needsMemberReview: Boolean(profile.reviewRequestedAt),
    lastUpdatedBy: profile.revisions[0]
      ? {
          id: profile.revisions[0].updatedByUser.id,
          name:
            profile.revisions[0].updatedByUser.name ||
            `${profile.revisions[0].updatedByUser.firstName || ""} ${profile.revisions[0].updatedByUser.lastName || ""}`.trim() ||
            "Unknown user",
          isMember: profile.revisions[0].updatedByUserId === profile.userId,
        }
      : null,
  };
}

type NotificationSnapshot = {
  newsletterStatus: "never_subscribed" | "pending" | "subscribed" | "unsubscribed";
};

function toNewsletterSubscription(
  input: {
    status: "pending" | "subscribed" | "unsubscribed";
    source: string | null;
    consentedAt: Date | null;
    subscribedAt: Date;
    verifiedAt: Date | null;
    unsubscribedAt: Date | null;
    updatedAt: Date;
  } | null
) {
  return {
    status: input?.status || ("never_subscribed" as const),
    source: input?.source || null,
    consentedAt: input?.consentedAt?.toISOString() || null,
    subscribedAt: input?.subscribedAt?.toISOString() || null,
    verifiedAt: input?.verifiedAt?.toISOString() || null,
    unsubscribedAt: input?.unsubscribedAt?.toISOString() || null,
    updatedAt: input?.updatedAt?.toISOString() || null,
  };
}

const LEGAL_LABELS: Record<AcceptanceType, { label: string; href: string | null }> = {
  terms: { label: "Terms & Conditions", href: "/terms" },
  health_waiver: { label: "Health & Liability Waiver", href: "/health-declaration" },
  health_data: { label: "Health Data Consent", href: "/privacy" },
  coaching_agreement: { label: "Coaching Agreement", href: "/coaching-agreement" },
  recording_notice: { label: "Recording Notice", href: null },
  immediate_start: { label: "Immediate Start Acknowledgement", href: null },
  marketing: { label: "Marketing Consent", href: null },
};

function toNotificationSnapshot(input: {
  newsletterSubscriber: {
    status: "pending" | "subscribed" | "unsubscribed";
  } | null;
}): NotificationSnapshot {
  return {
    newsletterStatus: input.newsletterSubscriber?.status || "never_subscribed",
  };
}

async function getBookingMetrics(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { totalBookings: number; lastClassDate: Date | null }>();
  }

  const bookings = await db.classBooking.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      userId: true,
      status: true,
      session: {
        select: {
          startsAtUtc: true,
        },
      },
    },
  });

  const now = Date.now();
  const metrics = new Map<string, { totalBookings: number; lastClassDate: Date | null }>();

  for (const userId of userIds) {
    metrics.set(userId, { totalBookings: 0, lastClassDate: null });
  }

  for (const booking of bookings) {
    const current = metrics.get(booking.userId) || { totalBookings: 0, lastClassDate: null };
    current.totalBookings += 1;
    const sessionStartsAt = booking.session.startsAtUtc;
    const isActiveOrHistorical =
      booking.status !== ClassBookingStatus.cancelled && sessionStartsAt.getTime() <= now;

    if (
      isActiveOrHistorical &&
      (!current.lastClassDate || sessionStartsAt.getTime() > current.lastClassDate.getTime())
    ) {
      current.lastClassDate = sessionStartsAt;
    }

    metrics.set(booking.userId, current);
  }

  return metrics;
}

export async function listAdminMembers(filters: {
  search?: string;
  status?: string;
  plan?: string;
  role?: string;
  risk?: string;
}) {
  const users = await db.user.findMany({
    where: {
      role: { in: [UserRole.student, UserRole.member, UserRole.admin, UserRole.owner_admin] },
      ...(filters.search
        ? {
            OR: [
              { email: { contains: filters.search, mode: "insensitive" } },
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { name: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      membershipSubscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      referralEventsCreated: {
        where: { status: "rewarded" },
        select: { id: true },
      },
      creditLedgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      newsletterSubscriber: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const profileIds = Array.from(
    new Set(
      users
        .map((u) => u.instructorProfileEntryId)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
  const profiles = await getInstructorProfilesByIds(profileIds);
  const profileNameById = new Map(profiles.map((p) => [p.id, p.name]));
  const bookingMetrics = await getBookingMetrics(users.map((user) => user.id));

  const rows = await Promise.all(
    users.map(async (user) => {
      const membership = user.membershipSubscriptions[0] || null;
      const creditBalance = await getCreditBalance(user.id);
      const referralBalancePence = await getReferralBalancePence(user.id);
      const metrics = bookingMetrics.get(user.id) || { totalBookings: 0, lastClassDate: null };
      const notification = toNotificationSnapshot({
        newsletterSubscriber: user.newsletterSubscriber,
      });
      const risk = toRiskStatus({
        status: membership?.status || null,
        membershipPlan: membership?.plan || null,
        lastClassDate: metrics.lastClassDate,
        creditBalance,
      });

      return {
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        avatarInitials:
          `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.trim().toUpperCase() || "?",
        joinedDate: user.createdAt.toISOString().slice(0, 10),
        membershipPlan: membership?.plan || null,
        membershipLabel: mapMembershipLabel(membership?.plan || null, membership?.status || null),
        status:
          (membership?.status as
            | "active"
            | "paused"
            | "cancelled"
            | "expired"
            | "past_due"
            | undefined) || "active",
        creditBalance,
        referralCode: user.referralCode || "",
        referralsCount: user.referralEventsCreated.length,
        referralBalance: Math.floor(referralBalancePence / 100),
        totalBookings: metrics.totalBookings,
        lastClassDate: metrics.lastClassDate?.toISOString().slice(0, 10) || null,
        notes: user.adminNotes || "",
        ...notification,
        isInstructor: Boolean(user.instructorProfileEntryId),
        instructorProfileEntryId: user.instructorProfileEntryId || null,
        instructorProfileName: user.instructorProfileEntryId
          ? profileNameById.get(user.instructorProfileEntryId) || null
          : null,
        isCoachingClient: user.isCoachingClient,
        risk,
      };
    })
  );

  return rows.filter((row) => {
    if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.plan && filters.plan !== "all") {
      if (filters.plan === "none" && row.membershipPlan !== null) return false;
      if (filters.plan !== "none" && row.membershipPlan !== filters.plan) return false;
    }
    if (filters.role && filters.role !== "all") {
      if (filters.role === "instructor" && !row.isInstructor) return false;
      if (filters.role === "coaching" && !row.isCoachingClient) return false;
    }
    if (filters.risk && filters.risk !== "all") {
      if (filters.risk === "any-risk" && !row.risk) return false;
      if (filters.risk !== "any-risk" && row.risk !== filters.risk) return false;
    }
    return true;
  });
}

export async function getAdminMemberDetail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      membershipSubscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      creditLedgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      referralEventsCreated: {
        where: { status: "rewarded" },
        select: { id: true },
      },
      newsletterSubscriber: {
        select: {
          status: true,
          source: true,
          consentedAt: true,
          subscribedAt: true,
          verifiedAt: true,
          unsubscribedAt: true,
          updatedAt: true,
        },
      },
      healthProfile: {
        include: {
          selections: true,
          revisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              updatedByUser: {
                select: { id: true, firstName: true, lastName: true, name: true },
              },
            },
          },
        },
      },
      acceptanceEvents: {
        where: {
          type: {
            in: [
              AcceptanceType.terms,
              AcceptanceType.health_waiver,
              AcceptanceType.health_data,
              AcceptanceType.coaching_agreement,
            ],
          },
        },
        orderBy: { acceptedAt: "desc" },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, name: true, email: true } },
        },
      },
      coachingApplications: { select: { id: true }, take: 1 },
    },
  });

  if (!user) return null;

  const membership = user.membershipSubscriptions[0] || null;
  const creditBalance = await getCreditBalance(user.id);
  const referralBalancePence = await getReferralBalancePence(user.id);
  const metrics = (await getBookingMetrics([user.id])).get(user.id) || {
    totalBookings: 0,
    lastClassDate: null,
  };
  const profile = user.instructorProfileEntryId
    ? (await getInstructorProfilesByIds([user.instructorProfileEntryId]))[0]
    : null;
  const notification = toNotificationSnapshot({
    newsletterSubscriber: user.newsletterSubscriber,
  });
  const coachingAgreementApplies =
    user.isCoachingClient ||
    user.coachingApplications.length > 0 ||
    user.acceptanceEvents.some((event) => event.type === AcceptanceType.coaching_agreement);
  const acceptanceRequirements = [
    { type: AcceptanceType.terms, surface: "admin_member_detail" },
    {
      type: AcceptanceType.health_waiver,
      surface: "admin_member_detail",
      maxAgeDays: PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS,
    },
    { type: AcceptanceType.health_data, surface: "admin_member_detail" },
    ...(coachingAgreementApplies
      ? [{ type: AcceptanceType.coaching_agreement, surface: "admin_member_detail" }]
      : []),
  ];
  const legalStates = await getAcceptanceRequirementStates(user.id, acceptanceRequirements);
  const legalAgreements: AdminLegalAgreementDto[] = legalStates.map((state) => ({
    type: state.type,
    label: LEGAL_LABELS[state.type].label,
    href: LEGAL_LABELS[state.type].href,
    status: state.isCurrent
      ? ("current" as const)
      : state.staleReason === "version"
        ? ("superseded" as const)
        : state.staleReason === "expired"
          ? ("expired" as const)
          : ("missing" as const),
    currentVersion: state.currentVersion,
    acceptedVersion: state.acceptedVersion,
    acceptedAt: state.acceptedAt,
    expiresAt: state.expiresAt,
  }));
  if (!coachingAgreementApplies) {
    legalAgreements.push({
      type: AcceptanceType.coaching_agreement,
      label: LEGAL_LABELS.coaching_agreement.label,
      href: LEGAL_LABELS.coaching_agreement.href,
      status: "not_applicable",
      currentVersion: "",
      acceptedVersion: null,
      acceptedAt: null,
      expiresAt: null,
    });
  }

  return {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email,
    avatarInitials:
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.trim().toUpperCase() || "?",
    joinedDate: user.createdAt.toISOString().slice(0, 10),
    membershipPlan: membership?.plan || null,
    membershipLabel: mapMembershipLabel(membership?.plan || null, membership?.status || null),
    status:
      (membership?.status as
        | "active"
        | "paused"
        | "cancelled"
        | "expired"
        | "past_due"
        | undefined) || "active",
    creditBalance,
    referralCode: user.referralCode || "",
    referralsCount: user.referralEventsCreated.length,
    referralBalance: Math.floor(referralBalancePence / 100),
    totalBookings: metrics.totalBookings,
    lastClassDate: metrics.lastClassDate?.toISOString().slice(0, 10) || null,
    notes: user.adminNotes || "",
    ...notification,
    isInstructor: Boolean(user.instructorProfileEntryId),
    instructorProfileEntryId: user.instructorProfileEntryId || null,
    instructorProfileName: profile?.name || null,
    isCoachingClient: user.isCoachingClient,
    creditHistory: user.creditLedgerEntries.map((entry) => ({
      id: entry.id,
      date: entry.createdAt.toISOString().slice(0, 10),
      amount: entry.amount,
      reason: entry.description,
      type: entry.type,
      by: entry.createdByUserId || "system",
    })),
    healthProfile: toAdminHealthProfile(user.healthProfile),
    newsletterSubscription: toNewsletterSubscription(user.newsletterSubscriber),
    legalAgreements,
    legalAcceptanceHistory: user.acceptanceEvents.map((event) => ({
      id: event.id,
      type: event.type,
      label: LEGAL_LABELS[event.type].label,
      version: event.version,
      acceptedAt: event.acceptedAt.toISOString(),
      surface: event.acceptanceSurface,
      actorName:
        event.actor?.name ||
        `${event.actor?.firstName || ""} ${event.actor?.lastName || ""}`.trim() ||
        event.actor?.email ||
        "System",
    })),
  };
}

export async function updateAdminMember(
  userId: string,
  updates: {
    isInstructor?: boolean;
    instructorProfileEntryId?: string | null;
    isCoachingClient?: boolean;
    notes?: string;
    status?: MembershipStatus;
  },
  audit?: {
    actorUserId?: string | null;
    requestId?: string | null;
    requestPath?: string | null;
    requestIp?: string | null;
  }
) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: {
      instructorProfileEntryId: true,
      isCoachingClient: true,
      adminNotes: true,
    },
  });
  if (!existing) {
    return null;
  }
  const existingMembership = await db.membershipSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });

  const userData: {
    instructorProfileEntryId?: string | null;
    isCoachingClient?: boolean;
    adminNotes?: string;
  } = {};
  if (typeof updates.isInstructor === "boolean") {
    userData.instructorProfileEntryId = updates.isInstructor
      ? updates.instructorProfileEntryId === undefined
        ? undefined
        : updates.instructorProfileEntryId
      : null;
  }
  if (typeof updates.isCoachingClient === "boolean") {
    userData.isCoachingClient = updates.isCoachingClient;
  }
  if (updates.instructorProfileEntryId !== undefined) {
    userData.instructorProfileEntryId = updates.instructorProfileEntryId;
  }
  if (typeof updates.notes === "string") {
    userData.adminNotes = updates.notes;
  }

  await db.user.update({ where: { id: userId }, data: userData });

  if (updates.status) {
    if (existingMembership) {
      await db.membershipSubscription.update({
        where: { id: existingMembership.id },
        data: { status: updates.status },
      });
    }
  }

  const detail = await getAdminMemberDetail(userId);

  if (detail && audit?.actorUserId) {
    await createAdminActionLog({
      actorUserId: audit.actorUserId,
      actionType: "member_profile_updated",
      targetType: "user",
      targetId: userId,
      requestId: audit.requestId,
      requestPath: audit.requestPath,
      requestIp: audit.requestIp,
      oldValueJson: {
        instructorProfileEntryId: existing.instructorProfileEntryId,
        isCoachingClient: existing.isCoachingClient,
        notes: existing.adminNotes,
        membershipStatus: existingMembership?.status || null,
      },
      newValueJson: {
        instructorProfileEntryId: detail.instructorProfileEntryId,
        isCoachingClient: detail.isCoachingClient,
        notes: detail.notes,
        membershipStatus: detail.status,
      },
    });
  }

  return detail;
}

export async function adminAdjustCredits(params: {
  userId: string;
  adminUserId: string;
  delta: number;
  reason: string;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const beforeBalance = await getCreditBalance(params.userId);
  await adjustCredits({
    userId: params.userId,
    adminUserId: params.adminUserId,
    delta: params.delta,
    reason: params.reason,
  });

  const member = await getAdminMemberDetail(params.userId);

  if (member) {
    await createAdminActionLog({
      actorUserId: params.adminUserId,
      actionType: "member_credits_adjusted",
      targetType: "user",
      targetId: params.userId,
      reason: params.reason,
      requestId: params.requestId,
      requestPath: params.requestPath,
      requestIp: params.requestIp,
      oldValueJson: {
        creditBalance: beforeBalance,
      },
      newValueJson: {
        creditBalance: member.creditBalance,
        delta: params.delta,
      },
    });
  }

  return member;
}

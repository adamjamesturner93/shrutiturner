import { ClassBookingStatus, MembershipStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { adjustCredits, getCreditBalance } from "@/lib/credits/credit-service";
import { getReferralBalancePence } from "@/lib/referrals/referral-discount-service";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import { getInstructorProfilesByIds } from "@/lib/content";
import type { AdminHealthProfileDto } from "@/lib/api/types";

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
    additionalNotes: string;
    lastUpdatedAt: Date;
    selections: Array<{ conditionKey: string; detail: string | null }>;
  } | null
): AdminHealthProfileDto | null {
  if (!profile) return null;

  const categories = new Map<
    string,
    {
      categoryId: string;
      categoryTitle: string;
      conditions: AdminHealthProfileDto["categories"][number]["conditions"];
    }
  >();

  for (const selection of profile.selections) {
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
    additionalNotes: profile.additionalNotes ?? "",
    lastUpdated: profile.lastUpdatedAt.toISOString(),
  };
}

type NotificationSnapshot = {
  newsletterSubscribed: boolean;
  marketingEmails: boolean;
  classReminders: boolean;
  scheduleUpdates: boolean;
  programAnnouncements: boolean;
};

function toNotificationSnapshot(input: {
  notificationPreference: {
    marketingEmails: boolean;
    classReminders: boolean;
    scheduleUpdates: boolean;
    programAnnouncements: boolean;
  } | null;
  newsletterSubscriber: {
    status: "pending" | "subscribed" | "unsubscribed";
  } | null;
}): NotificationSnapshot {
  const marketingEmails = input.notificationPreference?.marketingEmails ?? true;

  return {
    newsletterSubscribed:
      input.newsletterSubscriber?.status === "subscribed" ||
      (!input.newsletterSubscriber && marketingEmails),
    marketingEmails,
    classReminders: input.notificationPreference?.classReminders ?? true,
    scheduleUpdates: input.notificationPreference?.scheduleUpdates ?? true,
    programAnnouncements: input.notificationPreference?.programAnnouncements ?? true,
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
      notificationPreference: {
        select: {
          marketingEmails: true,
          classReminders: true,
          scheduleUpdates: true,
          programAnnouncements: true,
        },
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
        notificationPreference: user.notificationPreference,
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
      notificationPreference: {
        select: {
          marketingEmails: true,
          classReminders: true,
          scheduleUpdates: true,
          programAnnouncements: true,
        },
      },
      newsletterSubscriber: {
        select: {
          status: true,
        },
      },
      healthProfile: {
        include: {
          selections: true,
        },
      },
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
    notificationPreference: user.notificationPreference,
    newsletterSubscriber: user.newsletterSubscriber,
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
  }
) {
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
    const membership = await db.membershipSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (membership) {
      await db.membershipSubscription.update({
        where: { id: membership.id },
        data: { status: updates.status },
      });
    }
  }

  return getAdminMemberDetail(userId);
}

export async function adminAdjustCredits(params: {
  userId: string;
  adminUserId: string;
  delta: number;
  reason: string;
}) {
  await adjustCredits({
    userId: params.userId,
    adminUserId: params.adminUserId,
    delta: params.delta,
    reason: params.reason,
  });

  return getAdminMemberDetail(params.userId);
}

import { MembershipStatus, UserRole } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { getReferralBalancePence } from "@/lib/referrals/referral-discount-service";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import { getInstructorProfilesByIds } from "@/lib/content";
import type { AdminHealthProfileDto } from "@/lib/api/types";

function mapMembershipLabel(plan: string | null, status?: MembershipStatus | null) {
  if (!plan) return "No 1:1 service linked";
  if (plan === "instructor") return "Unlimited (instructor)";
  const title = plan === "movewell" ? "Retired Move Well Membership" : "Unknown";
  if (status && status !== "active") return `${title} (${status.replaceAll("_", " ")})`;
  return title;
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

  const rows = await Promise.all(
    users.map(async (user) => {
      const membership = user.membershipSubscriptions[0] || null;
      const referralBalancePence = await getReferralBalancePence(user.id);
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
        creditBalance: 0,
        referralCode: user.referralCode || "",
        referralsCount: user.referralEventsCreated.length,
        referralBalance: Math.floor(referralBalancePence / 100),
        totalBookings: 0,
        lastClassDate: null,
        notes: user.adminNotes || "",
        ...notification,
        isInstructor: Boolean(user.instructorProfileEntryId),
        instructorProfileEntryId: user.instructorProfileEntryId || null,
        instructorProfileName: user.instructorProfileEntryId
          ? profileNameById.get(user.instructorProfileEntryId) || null
          : null,
        isCoachingClient: user.isCoachingClient,
        risk: null,
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
  const referralBalancePence = await getReferralBalancePence(user.id);
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
    creditBalance: 0,
    referralCode: user.referralCode || "",
    referralsCount: user.referralEventsCreated.length,
    referralBalance: Math.floor(referralBalancePence / 100),
    totalBookings: 0,
    lastClassDate: null,
    notes: user.adminNotes || "",
    ...notification,
    isInstructor: Boolean(user.instructorProfileEntryId),
    instructorProfileEntryId: user.instructorProfileEntryId || null,
    instructorProfileName: profile?.name || null,
    isCoachingClient: user.isCoachingClient,
    creditHistory: [],
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
  void params;
  throw new Error("CLASS_CREDITS_RETIRED");
}

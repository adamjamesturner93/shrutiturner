import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import HealthProfileReviewRequestedEmail from "@/emails/health-profile-review-requested";
import HealthProfileUpdatedNotificationEmail from "@/emails/health-profile-updated-notification";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import {
  assertCurrentAcceptances,
  getAcceptanceRequirementStates,
} from "@/lib/legal/acceptance-service";

export type HealthProfileInput = {
  declarationStatus?: "incomplete" | "none_declared" | "context_declared";
  conditions?: Record<string, boolean>;
  details?: Record<string, string>;
  tracksFlareCheckIns?: boolean;
  additionalNotes?: string;
};

export type HealthProfileUpdateContext = {
  actor: "member" | "admin";
  source?: "coaching_enquiry" | "consultation" | "member_message" | "other";
  sourceNote?: string;
};

export type HealthDeclarationStatus = "incomplete" | "none_declared" | "context_declared";

const VALID_KEYS = new Set(
  HEALTH_CATEGORIES.flatMap((category) => category.items.map((item) => item.key))
);
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeConditions(input: Record<string, boolean> | undefined) {
  const selected = new Set<string>();
  for (const [key, value] of Object.entries(input || {})) {
    if (value && VALID_KEYS.has(key)) selected.add(key);
  }
  return selected;
}

function normalizeDetails(input: Record<string, string> | undefined, selected: Set<string>) {
  const details = new Map<string, string>();
  for (const [key, value] of Object.entries(input || {})) {
    if (!selected.has(key)) continue;
    const normalized = value.trim();
    if (!normalized) continue;
    details.set(key, normalized.slice(0, 1200));
  }
  return details;
}

function hasAnyContext(selected: Set<string>, additionalNotes: string) {
  return selected.size > 0 || additionalNotes.trim().length > 0;
}

function resolveDeclarationStatus(
  requested: HealthProfileInput["declarationStatus"],
  selected: Set<string>,
  additionalNotes: string
): Exclude<HealthDeclarationStatus, "incomplete"> {
  if (requested === "context_declared") {
    if (!hasAnyContext(selected, additionalNotes)) {
      throw new Error("INVALID_HEALTH_PROFILE");
    }
    return "context_declared";
  }

  if (requested === "none_declared") {
    return "none_declared";
  }

  return hasAnyContext(selected, additionalNotes) ? "context_declared" : "none_declared";
}

export function needsHealthDeclarationReview(
  lastConfirmedAt: Date | string | null | undefined,
  now = new Date()
) {
  if (!lastConfirmedAt) return false;
  const confirmedAt =
    typeof lastConfirmedAt === "string" ? new Date(lastConfirmedAt) : lastConfirmedAt;
  return now.getTime() - confirmedAt.getTime() >= THIRTY_DAYS_MS;
}

export function getHealthCheckInMode(params: {
  declarationStatus: HealthDeclarationStatus;
  tracksFlareCheckIns: boolean;
}) {
  return params.declarationStatus === "context_declared" && params.tracksFlareCheckIns
    ? "energy_and_flare"
    : "energy_only";
}

export async function getHealthAccessState(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      healthProfile: {
        select: {
          declarationStatus: true,
          tracksFlareCheckIns: true,
          lastConfirmedAt: true,
          reviewRequestedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const declarationStatus: HealthDeclarationStatus = user.healthProfile
    ? user.healthProfile.declarationStatus
    : "incomplete";
  const [healthDataConsentState] = await getAcceptanceRequirementStates(userId, [
    {
      type: AcceptanceType.health_data,
      surface: "health_profile",
    },
  ]);
  const hasCurrentHealthDataConsent = healthDataConsentState?.isCurrent ?? false;

  return {
    declarationStatus,
    hasCurrentHealthDataConsent,
    tracksFlareCheckIns: user.healthProfile?.tracksFlareCheckIns ?? false,
    lastConfirmedAt: user.healthProfile?.lastConfirmedAt?.toISOString() ?? "",
    needsReview:
      Boolean(user.healthProfile?.reviewRequestedAt) ||
      needsHealthDeclarationReview(user.healthProfile?.lastConfirmedAt),
    isComplete: declarationStatus !== "incomplete" && hasCurrentHealthDataConsent,
    checkInMode: getHealthCheckInMode({
      declarationStatus,
      tracksFlareCheckIns: user.healthProfile?.tracksFlareCheckIns ?? false,
    }),
  };
}

export async function assertCurrentHealthDataAcceptance(userId: string, surface: string) {
  await assertCurrentAcceptances(userId, [
    {
      type: AcceptanceType.health_data,
      surface,
    },
  ]);
}

export async function getHealthProfile(userId: string) {
  const profile = await db.healthProfile.findUnique({
    where: { userId },
    include: {
      selections: {
        select: {
          conditionKey: true,
          detail: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      declarationStatus: "incomplete" as const,
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "",
      lastConfirmedAt: "",
      lastUpdated: "",
      needsReview: false,
      reviewRequestedAt: null,
      reviewReason: null,
    };
  }

  const conditions: Record<string, boolean> = {};
  const details: Record<string, string> = {};

  for (const selection of profile.selections) {
    conditions[selection.conditionKey] = true;
    if (selection.detail) details[selection.conditionKey] = selection.detail;
  }

  return {
    declarationStatus: profile.declarationStatus,
    conditions,
    details,
    tracksFlareCheckIns: profile.tracksFlareCheckIns,
    additionalNotes: profile.additionalNotes,
    lastConfirmedAt: profile.lastConfirmedAt.toISOString().slice(0, 10),
    lastUpdated: profile.lastUpdatedAt.toISOString().slice(0, 10),
    needsReview:
      Boolean(profile.reviewRequestedAt) || needsHealthDeclarationReview(profile.lastConfirmedAt),
    reviewRequestedAt: profile.reviewRequestedAt?.toISOString() || null,
    reviewReason: profile.reviewRequestedAt
      ? ("admin_update" as const)
      : needsHealthDeclarationReview(profile.lastConfirmedAt)
        ? ("periodic" as const)
        : null,
  };
}

async function sendHealthProfileUpdateEmail(input: { userId: string; actor: "member" | "admin" }) {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, firstName: true, lastName: true, name: true },
  });
  if (!user) return;

  const memberName =
    user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  if (input.actor === "admin") {
    await sendPostmarkReactEmail({
      to: user.email,
      userId: user.id,
      subject: "Please review your health profile",
      react: HealthProfileReviewRequestedEmail({
        firstName: user.firstName || "there",
        healthProfileUrl: buildAbsoluteUrl("/dashboard/health"),
      }),
      textBody: `Hi ${user.firstName || "there"},\n\nShruti has updated your health profile using information you shared. Please sign in to review it, correct anything that is not right, and confirm that it is current.\n\n${buildAbsoluteUrl("/dashboard/health")}\n\nFor privacy, this email does not include any health information.`,
      tag: "health-profile-review-requested",
      templateKey: "health-profile-review-requested",
      category: "transactional",
      retryable: true,
      metadata: { userId: user.id },
      dispatchMode: "immediate_best_effort",
    });
    return;
  }

  await sendPostmarkReactEmail({
    to: getNotificationInbox("HEALTH_PROFILE_NOTIFICATION_EMAIL"),
    subject: `Health profile updated: ${memberName}`,
    react: HealthProfileUpdatedNotificationEmail({
      memberName,
      memberEmail: user.email,
      memberUrl: buildAbsoluteUrl(`/admin/members/${user.id}`),
    }),
    textBody: `${memberName} (${user.email}) updated their health profile. Health details are intentionally omitted from email.\n\nReview: ${buildAbsoluteUrl(`/admin/members/${user.id}`)}`,
    tag: "health-profile-updated-notification",
    templateKey: "health-profile-updated-notification",
    category: "transactional",
    retryable: true,
    metadata: { userId: user.id },
    dispatchMode: "immediate_best_effort",
  });
}

export async function upsertHealthProfile(
  userId: string,
  input: HealthProfileInput,
  updatedByUserId: string,
  context: HealthProfileUpdateContext = { actor: "member" }
) {
  await assertCurrentHealthDataAcceptance(userId, "health_profile");

  const selected = normalizeConditions(input.conditions);
  const requestedNotes = (input.additionalNotes || "").trim().slice(0, 5000);
  const declarationStatus = resolveDeclarationStatus(
    input.declarationStatus,
    selected,
    requestedNotes
  );
  const additionalNotes = declarationStatus === "context_declared" ? requestedNotes : "";
  const detailsMap =
    declarationStatus === "context_declared"
      ? normalizeDetails(input.details, selected)
      : new Map();
  const tracksFlareCheckIns =
    declarationStatus === "context_declared" ? Boolean(input.tracksFlareCheckIns) : false;
  const selectedKeys = declarationStatus === "context_declared" ? selected : new Set<string>();
  const now = new Date();
  const isAdminUpdate = context.actor === "admin";

  const profile = await db.$transaction(async (tx) => {
    const upserted = await tx.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        declarationStatus,
        tracksFlareCheckIns,
        additionalNotes,
        lastConfirmedAt: now,
        lastUpdatedAt: now,
        reviewRequestedAt: isAdminUpdate ? now : null,
      },
      update: {
        declarationStatus,
        tracksFlareCheckIns,
        additionalNotes,
        ...(isAdminUpdate ? {} : { lastConfirmedAt: now }),
        lastUpdatedAt: now,
        reviewRequestedAt: isAdminUpdate ? now : null,
      },
    });

    await tx.healthConditionSelection.deleteMany({ where: { profileId: upserted.id } });

    if (selectedKeys.size > 0) {
      await tx.healthConditionSelection.createMany({
        data: Array.from(selectedKeys).map((conditionKey) => ({
          profileId: upserted.id,
          conditionKey,
          detail: detailsMap.get(conditionKey) || null,
        })),
      });
    }

    const snapshotJson = {
      declarationStatus,
      tracksFlareCheckIns,
      conditions: Object.fromEntries(Array.from(selectedKeys).map((key) => [key, true])),
      details: Object.fromEntries(Array.from(detailsMap.entries())),
      additionalNotes,
      lastConfirmedAt: now.toISOString().slice(0, 10),
      lastUpdated: now.toISOString().slice(0, 10),
      reviewRequestedAt: isAdminUpdate ? now.toISOString() : null,
      updateContext: {
        actor: context.actor,
        source: context.source || null,
        sourceNote: context.sourceNote?.trim().slice(0, 500) || null,
      },
    };

    await tx.healthProfileRevision.create({
      data: {
        profileId: upserted.id,
        updatedByUserId,
        snapshotJson,
      },
    });

    return upserted;
  });

  await sendHealthProfileUpdateEmail({ userId, actor: context.actor }).catch((error) => {
    console.error("Failed to send health profile update email", error);
  });

  return {
    declarationStatus,
    conditions: Object.fromEntries(Array.from(selectedKeys).map((key) => [key, true])),
    details: Object.fromEntries(Array.from(detailsMap.entries())),
    tracksFlareCheckIns,
    additionalNotes,
    lastConfirmedAt: profile.lastConfirmedAt.toISOString().slice(0, 10),
    lastUpdated: profile.lastUpdatedAt.toISOString().slice(0, 10),
    needsReview: isAdminUpdate,
    reviewRequestedAt: profile.reviewRequestedAt?.toISOString() || null,
    reviewReason: isAdminUpdate ? ("admin_update" as const) : null,
  };
}

export async function confirmHealthProfile(userId: string, updatedByUserId: string) {
  await assertCurrentHealthDataAcceptance(userId, "health_profile_confirmation");

  const existing = await db.healthProfile.findUnique({
    where: { userId },
    include: {
      selections: {
        select: {
          conditionKey: true,
          detail: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("HEALTH_PROFILE_NOT_FOUND");
  }

  const now = new Date();
  const confirmed = await db.$transaction(async (tx) => {
    const updated = await tx.healthProfile.update({
      where: { id: existing.id },
      data: {
        lastConfirmedAt: now,
        reviewRequestedAt: null,
      },
    });

    await tx.healthProfileRevision.create({
      data: {
        profileId: existing.id,
        updatedByUserId,
        snapshotJson: {
          declarationStatus: existing.declarationStatus,
          tracksFlareCheckIns: existing.tracksFlareCheckIns,
          conditions: Object.fromEntries(
            existing.selections.map((selection) => [selection.conditionKey, true])
          ),
          details: Object.fromEntries(
            existing.selections
              .filter((selection) => Boolean(selection.detail))
              .map((selection) => [selection.conditionKey, selection.detail])
          ),
          additionalNotes: existing.additionalNotes,
          lastConfirmedAt: now.toISOString().slice(0, 10),
          lastUpdated: existing.lastUpdatedAt.toISOString().slice(0, 10),
          reviewRequestedAt: null,
          updateContext: { actor: "member", action: "confirmed_unchanged" },
        },
      },
    });

    return updated;
  });

  return {
    declarationStatus: existing.declarationStatus,
    conditions: Object.fromEntries(
      existing.selections.map((selection) => [selection.conditionKey, true])
    ),
    details: Object.fromEntries(
      existing.selections
        .filter((selection) => Boolean(selection.detail))
        .map((selection) => [selection.conditionKey, selection.detail as string])
    ),
    tracksFlareCheckIns: existing.tracksFlareCheckIns,
    additionalNotes: existing.additionalNotes,
    lastConfirmedAt: confirmed.lastConfirmedAt.toISOString().slice(0, 10),
    lastUpdated: existing.lastUpdatedAt.toISOString().slice(0, 10),
    needsReview: false,
    reviewRequestedAt: null,
    reviewReason: null,
  };
}

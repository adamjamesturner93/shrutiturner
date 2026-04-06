import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
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
    needsReview: needsHealthDeclarationReview(user.healthProfile?.lastConfirmedAt),
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
    needsReview: needsHealthDeclarationReview(profile.lastConfirmedAt),
  };
}

export async function upsertHealthProfile(
  userId: string,
  input: HealthProfileInput,
  updatedByUserId: string
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
      },
      update: {
        declarationStatus,
        tracksFlareCheckIns,
        additionalNotes,
        lastConfirmedAt: now,
        lastUpdatedAt: now,
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

  return {
    declarationStatus,
    conditions: Object.fromEntries(Array.from(selectedKeys).map((key) => [key, true])),
    details: Object.fromEntries(Array.from(detailsMap.entries())),
    tracksFlareCheckIns,
    additionalNotes,
    lastConfirmedAt: profile.lastConfirmedAt.toISOString().slice(0, 10),
    lastUpdated: profile.lastUpdatedAt.toISOString().slice(0, 10),
    needsReview: false,
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
  };
}

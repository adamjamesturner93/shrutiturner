import { db } from "@/lib/db";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";

export type HealthProfileInput = {
  conditions?: Record<string, boolean>;
  details?: Record<string, string>;
  additionalNotes?: string;
};

const VALID_KEYS = new Set(HEALTH_CATEGORIES.flatMap((category) => category.items.map((item) => item.key)));

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
      conditions: {},
      details: {},
      additionalNotes: "",
      lastUpdated: "",
    };
  }

  const conditions: Record<string, boolean> = {};
  const details: Record<string, string> = {};

  for (const selection of profile.selections) {
    conditions[selection.conditionKey] = true;
    if (selection.detail) details[selection.conditionKey] = selection.detail;
  }

  return {
    conditions,
    details,
    additionalNotes: profile.additionalNotes,
    lastUpdated: profile.lastUpdatedAt.toISOString().slice(0, 10),
  };
}

export async function upsertHealthProfile(userId: string, input: HealthProfileInput, updatedByUserId: string) {
  const selected = normalizeConditions(input.conditions);
  const detailsMap = normalizeDetails(input.details, selected);
  const additionalNotes = (input.additionalNotes || "").trim().slice(0, 5000);
  const now = new Date();

  const profile = await db.$transaction(async (tx) => {
    const upserted = await tx.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        additionalNotes,
        lastUpdatedAt: now,
      },
      update: {
        additionalNotes,
        lastUpdatedAt: now,
      },
    });

    await tx.healthConditionSelection.deleteMany({ where: { profileId: upserted.id } });

    if (selected.size > 0) {
      await tx.healthConditionSelection.createMany({
        data: Array.from(selected).map((conditionKey) => ({
          profileId: upserted.id,
          conditionKey,
          detail: detailsMap.get(conditionKey) || null,
        })),
      });
    }

    const snapshotJson = {
      conditions: Object.fromEntries(Array.from(selected).map((key) => [key, true])),
      details: Object.fromEntries(Array.from(detailsMap.entries())),
      additionalNotes,
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
    conditions: Object.fromEntries(Array.from(selected).map((key) => [key, true])),
    details: Object.fromEntries(Array.from(detailsMap.entries())),
    additionalNotes,
    lastUpdated: profile.lastUpdatedAt.toISOString().slice(0, 10),
  };
}

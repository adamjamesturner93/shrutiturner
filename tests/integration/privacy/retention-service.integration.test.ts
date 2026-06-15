import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { processHealthDataRetention } from "@/lib/health/retention-service";

function makeEmail(label: string) {
  return `integration-retention-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function cleanupRows() {
  await db.acceptanceEvent.deleteMany({
    where: {
      user: {
        email: {
          startsWith: "integration-retention-",
        },
      },
    },
  });

  await db.healthProfileRevision.deleteMany({
    where: {
      profile: {
        user: {
          email: {
            startsWith: "integration-retention-",
          },
        },
      },
    },
  });

  await db.healthConditionSelection.deleteMany({
    where: {
      profile: {
        user: {
          email: {
            startsWith: "integration-retention-",
          },
        },
      },
    },
  });

  await db.healthProfile.deleteMany({
    where: {
      user: {
        email: {
          startsWith: "integration-retention-",
        },
      },
    },
  });

  await db.user.deleteMany({
    where: {
      email: {
        startsWith: "integration-retention-",
      },
    },
  });
}

describe("health retention service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("purges retained health and acceptance data for soft-deleted users after six months", async () => {
    const user = await db.user.create({
      data: {
        email: makeEmail("deleted-user"),
        deletedAt: new Date("2025-10-01T00:00:00.000Z"),
      },
    });

    await db.healthProfile.create({
      data: {
        userId: user.id,
        declarationStatus: "context_declared",
        additionalNotes: "Retained notes",
        lastConfirmedAt: new Date("2025-09-01T00:00:00.000Z"),
        lastUpdatedAt: new Date("2025-09-01T00:00:00.000Z"),
      },
    });

    await db.acceptanceEvent.create({
      data: {
        userId: user.id,
        type: AcceptanceType.terms,
        version: "2026-04-01",
        acceptanceSurface: "integration_test",
      },
    });

    const result = await processHealthDataRetention(new Date("2026-05-01T00:00:00.000Z"));

    expect(result.purgedDeletedUsers).toBe(1);
    expect(result.purgedAcceptanceEvents).toBe(1);

    const profile = await db.healthProfile.findUnique({
      where: { userId: user.id },
    });
    const acceptances = await db.acceptanceEvent.findMany({
      where: { userId: user.id },
    });

    expect(profile).toBeNull();
    expect(acceptances).toHaveLength(0);
  });
});

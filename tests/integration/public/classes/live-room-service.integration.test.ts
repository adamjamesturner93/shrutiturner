import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassAttendanceEventType, ClassRoomSetupStatus } from "@prisma/client";
import { db } from "@/lib/db";

const { updateRoomPermissionsMock } = vi.hoisted(() => ({
  updateRoomPermissionsMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/daily/service", () => ({
  updateRoomPermissions: updateRoomPermissionsMock,
}));

import { updateSessionCommunityMode } from "@/lib/classes/live-room-service";

const USER_PREFIX = "integration-live-room-";

async function cleanupRows() {
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-live-room-",
        },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-live-room-",
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: USER_PREFIX,
      },
    },
  });
}

function createUserEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("updateSessionCommunityMode", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("updates the stored mode and syncs Daily permissions for active participants", async () => {
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor"),
        firstName: "Shruti",
        lastName: "Turner",
        role: "admin",
      },
    });
    const member = await db.user.create({
      data: {
        email: createUserEmail("member"),
        firstName: "Nina",
        lastName: "Student",
      },
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-live-room-yoga",
        titleSnapshot: "Integration Live Room",
        typeSnapshot: "Yoga",
        levelSnapshot: "All levels",
        durationMinutes: 60,
        startsAtUtc: new Date("2026-03-24T18:00:00.000Z"),
        endsAtUtc: new Date("2026-03-24T19:00:00.000Z"),
        timezone: "Europe/London",
        capacity: 6,
        instructorUserId: instructor.id,
        roomSetupStatus: ClassRoomSetupStatus.ready,
        dailyRoomName: "integration-live-room",
        dailyRoomUrl: "https://daily.example/integration-live-room",
      },
    });

    await db.classAttendanceEvent.createMany({
      data: [
        {
          sessionId: session.id,
          userId: instructor.id,
          dailyParticipantId: "daily-instructor",
          type: ClassAttendanceEventType.joined,
          occurredAt: new Date("2026-03-24T17:58:00.000Z"),
        },
        {
          sessionId: session.id,
          userId: member.id,
          dailyParticipantId: "daily-member",
          type: ClassAttendanceEventType.joined,
          occurredAt: new Date("2026-03-24T17:59:00.000Z"),
        },
      ],
    });

    const result = await updateSessionCommunityMode({
      sessionId: session.id,
      enabled: true,
    });

    expect(result.dailySyncStatus).toBe("synced");

    const refreshedSession = await db.classSession.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        communityModeEnabled: true,
        communityModeUpdatedAt: true,
      },
    });

    expect(refreshedSession.communityModeEnabled).toBe(true);
    expect(refreshedSession.communityModeUpdatedAt).not.toBeNull();
    expect(updateRoomPermissionsMock).toHaveBeenCalledWith({
      roomName: "integration-live-room",
      data: {
        "*": {
          hasPresence: true,
          canSend: ["audio", "video"],
          canReceive: {
            base: true,
          },
          canAdmin: false,
        },
        "daily-instructor": {
          hasPresence: true,
          canSend: true,
          canReceive: {
            base: true,
          },
          canAdmin: ["participants"],
        },
      },
    });
  });
});

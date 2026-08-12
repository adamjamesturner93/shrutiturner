import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createRetreatChatMessage,
  listRetreatChatMessages,
  recordRetreatAttendanceEvent,
  updateRetreatLiveLifecycle,
} from "@/lib/retreats/live-service";
import { publishRetreatReplay, revokeRetreatReplay } from "@/lib/replay/service";

const PREFIX = "integration-retreat-live-";

async function cleanup() {
  await db.retreatBooking.deleteMany({
    where: { retreatDate: { externalDateId: { startsWith: PREFIX } } },
  });
  await db.retreatDate.deleteMany({ where: { externalDateId: { startsWith: PREFIX } } });
  await db.adminActionLog.deleteMany({
    where: { actor: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

describe("retreat live persistence", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("retains authenticated chat for hosts, hides it from attendees after ending, and records reconnect-safe attendance", async () => {
    const [host, attendee] = await Promise.all([
      db.user.create({
        data: { email: `${PREFIX}host@example.com`, role: "admin", firstName: "Host" },
      }),
      db.user.create({ data: { email: `${PREFIX}attendee@example.com`, firstName: "Asha" } }),
    ]);
    const retreatDate = await db.retreatDate.create({
      data: {
        externalDateId: `${PREFIX}date`,
        retreatSlug: `${PREFIX}slug`,
        retreatTitleSnapshot: "Integration Online Retreat",
        retreatLocationSnapshot: "Online",
        retreatType: "online",
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 60 * 60_000),
        capacity: 30,
        pricePence: 10000,
        depositAmountPence: 10000,
        status: "open",
        liveRoomState: "started",
        dailyRoomName: `${PREFIX}room`,
        dailyRoomUrl: `https://daily.example/${PREFIX}room`,
        onlineRoomSetupStatus: "ready",
      },
    });
    const booking = await db.retreatBooking.create({
      data: {
        retreatDateId: retreatDate.id,
        purchaserUserId: attendee.id,
        attendeeUserId: attendee.id,
        purchaserFirstName: "Asha",
        purchaserLastName: "Khan",
        purchaserEmail: attendee.email,
        attendeeFirstName: "Asha",
        attendeeLastName: "Khan",
        attendeeEmail: attendee.email,
        phone: "07000000000",
        emergencyContactName: "Support Person",
        emergencyContactPhone: "07000000001",
        totalPricePence: 10000,
        depositAmountPence: 10000,
        balanceAmountPence: 0,
        depositPaidPence: 10000,
        paymentStatus: "paid_in_full",
        bookingStatus: "paid_in_full",
      },
    });
    await db.retreatOnlineAccessEntitlement.create({
      data: {
        bookingId: booking.id,
        retreatDateId: retreatDate.id,
        userId: attendee.id,
        attendeeEmail: attendee.email,
        accessType: "live_and_replay",
        liveAccessEnabled: true,
      },
    });

    const message = await createRetreatChatMessage({
      retreatDateId: retreatDate.id,
      userId: attendee.id,
      text: "  Hello\u0000   retreat!  ",
    });
    expect(message.text).toBe("Hello retreat!");
    await expect(listRetreatChatMessages(retreatDate.id, attendee.id)).resolves.toHaveLength(1);

    const joinedAt = new Date("2026-08-09T10:00:00.000Z");
    const leftAt = new Date("2026-08-09T10:15:30.000Z");
    await recordRetreatAttendanceEvent({
      retreatDateId: retreatDate.id,
      userId: attendee.id,
      bookingId: booking.id,
      dailySessionId: "daily-session-1",
      type: "joined",
      occurredAt: joinedAt,
    });
    await recordRetreatAttendanceEvent({
      retreatDateId: retreatDate.id,
      userId: attendee.id,
      bookingId: booking.id,
      dailySessionId: "daily-session-1",
      type: "joined",
      occurredAt: joinedAt,
    });
    await recordRetreatAttendanceEvent({
      retreatDateId: retreatDate.id,
      userId: attendee.id,
      bookingId: booking.id,
      dailySessionId: "daily-session-1",
      type: "left",
      occurredAt: leftAt,
    });
    const attendance = await db.retreatLiveAttendance.findMany({
      where: { retreatDateId: retreatDate.id },
    });
    expect(attendance).toHaveLength(1);
    expect(attendance[0].durationSeconds).toBe(930);

    await updateRetreatLiveLifecycle({
      retreatDateId: retreatDate.id,
      userId: host.id,
      action: "end",
    });
    await expect(listRetreatChatMessages(retreatDate.id, attendee.id)).resolves.toEqual([]);
    await expect(listRetreatChatMessages(retreatDate.id, host.id)).resolves.toHaveLength(1);

    const replay = await db.replayAsset.create({
      data: {
        resourceType: "retreat_date",
        retreatDateId: retreatDate.id,
        dailyRoomName: `${PREFIX}room`,
        dailyRecordingId: `${PREFIX}recording`,
        playbackUrl: "https://daily.example/recording.mp4",
        status: "ready",
        completedAt: new Date(),
      },
    });
    expect(await db.replayEntitlement.count({ where: { replayAssetId: replay.id } })).toBe(0);
    await publishRetreatReplay(replay.id, retreatDate.id, host.id);
    expect(
      await db.replayEntitlement.count({ where: { replayAssetId: replay.id, revokedAt: null } })
    ).toBe(1);
    await revokeRetreatReplay(replay.id, retreatDate.id, host.id);
    expect(
      await db.replayEntitlement.count({ where: { replayAssetId: replay.id, revokedAt: null } })
    ).toBe(0);
    expect((await db.replayAsset.findUniqueOrThrow({ where: { id: replay.id } })).status).toBe(
      "ready"
    );
  });
});

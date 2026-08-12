import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyDailyWebhookAuthorizationMock = vi.fn();
const recordAttendanceEventMock = vi.fn();
const findSessionMock = vi.fn();
const findRetreatDateMock = vi.fn();
const recordRetreatAttendanceEventMock = vi.fn();

vi.mock("@/lib/daily/service", () => ({
  verifyDailyWebhookAuthorization: verifyDailyWebhookAuthorizationMock,
}));

vi.mock("@/lib/classes/attendance-service", () => ({
  recordAttendanceEvent: recordAttendanceEventMock,
}));

vi.mock("@/lib/retreats/live-service", () => ({
  recordRetreatAttendanceEvent: recordRetreatAttendanceEventMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    classSession: {
      findFirst: findSessionMock,
    },
    retreatDate: {
      findFirst: findRetreatDateMock,
    },
  },
}));

const route = await import("@/app/api/webhooks/daily/route");

describe("POST /api/webhooks/daily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyDailyWebhookAuthorizationMock.mockReturnValue(true);
    recordAttendanceEventMock.mockResolvedValue({ bookingId: "booking_123" });
    findSessionMock.mockResolvedValue({ id: "session_123" });
    findRetreatDateMock.mockResolvedValue(null);
  });

  it("returns 401 when authorization fails", async () => {
    verifyDailyWebhookAuthorizationMock.mockReturnValue(false);

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/daily", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("ignores malformed payloads", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/webhooks/daily", {
        method: "POST",
        body: JSON.stringify({ event: "participant.joined" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ignored: true });
    expect(recordAttendanceEventMock).not.toHaveBeenCalled();
  });

  it("records join events for known rooms", async () => {
    const payload = {
      event: "participant.joined",
      room_name: "room_123",
      participant: {
        user_id: "user_123",
        session_id: "daily-participant",
      },
    };

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/daily", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(findSessionMock).toHaveBeenCalledWith({
      where: {
        dailyRoomName: "room_123",
      },
      select: { id: true },
    });
    expect(recordAttendanceEventMock).toHaveBeenCalledWith({
      sessionId: "session_123",
      userId: "user_123",
      type: "joined",
      dailyParticipantId: "daily-participant",
      payload,
    });
  });

  it("ignores events for unknown rooms", async () => {
    findSessionMock.mockResolvedValue(null);

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/daily", {
        method: "POST",
        body: JSON.stringify({
          event: "participant.left",
          room_name: "missing-room",
          participant: {
            user_id: "user_123",
            session_id: "daily-participant",
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ignored: true });
    expect(recordAttendanceEventMock).not.toHaveBeenCalled();
  });

  it("routes participant events for retreat rooms without changing class handling", async () => {
    findSessionMock.mockResolvedValue(null);
    findRetreatDateMock.mockResolvedValue({ id: "retreat_date_123" });
    const payload = {
      event: "participant.joined",
      room_name: "retreat-room",
      participant: { user_id: "user_123", session_id: "daily-retreat-session" },
      occurred_at: "2026-08-09T12:00:00.000Z",
    };
    const response = await route.POST(
      new Request("http://localhost/api/webhooks/daily", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(response.status).toBe(200);
    expect(recordAttendanceEventMock).not.toHaveBeenCalled();
    expect(recordRetreatAttendanceEventMock).toHaveBeenCalledWith({
      retreatDateId: "retreat_date_123",
      userId: "user_123",
      type: "joined",
      dailySessionId: "daily-retreat-session",
      occurredAt: new Date("2026-08-09T12:00:00.000Z"),
    });
  });
});

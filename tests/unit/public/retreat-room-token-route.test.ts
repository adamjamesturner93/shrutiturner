import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const getRetreatLiveRoomAccessMock = vi.fn();
const createMeetingTokenMock = vi.fn();
const isDailyConfiguredMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  getRetreatLiveRoomAccess: getRetreatLiveRoomAccessMock,
}));

vi.mock("@/lib/daily/service", () => ({
  createMeetingToken: createMeetingTokenMock,
  isDailyConfigured: isDailyConfiguredMock,
}));

const route = await import("@/app/api/retreats/bookings/[id]/room-token/route");

function requestRoom() {
  return route.POST(new Request("http://localhost"), {
    params: Promise.resolve({ id: "booking_123" }),
  });
}

describe("POST /api/retreats/bookings/[id]/room-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDailyConfiguredMock.mockReturnValue(true);
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    getRetreatLiveRoomAccessMock.mockResolvedValue({
      roomName: "retreat-room",
      roomUrl: "https://daily.example/retreat-room",
      userName: "Retreat Guest",
      expiresAt: new Date("2026-11-15T16:00:00.000Z"),
      chatEnabled: true,
      defaultMicMuted: true,
      defaultCameraOff: false,
      isRecorded: true,
    });
    createMeetingTokenMock.mockResolvedValue("meeting_token_123");
  });

  it("returns 503 when online video is not configured", async () => {
    isDailyConfiguredMock.mockReturnValue(false);

    const response = await requestRoom();

    expect(response.status).toBe(503);
    expect(requireSessionUserMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await requestRoom();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Sign in to join this workshop." });
  });

  it.each(["FORBIDDEN", "PAYMENT_REQUIRED"])(
    "rejects access without a paid booking entitlement (%s)",
    async (code) => {
      getRetreatLiveRoomAccessMock.mockRejectedValue(new Error(code));

      const response = await requestRoom();

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        message: "This booking does not include live access.",
      });
    }
  );

  it("rejects access before the live window", async () => {
    getRetreatLiveRoomAccessMock.mockRejectedValue(new Error("EARLY_JOIN_WINDOW"));

    const response = await requestRoom();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "The online room is not open yet.",
    });
  });

  it("rejects access after the live window", async () => {
    getRetreatLiveRoomAccessMock.mockRejectedValue(new Error("ROOM_CLOSED"));

    const response = await requestRoom();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "The live access window has ended.",
    });
  });

  it("creates a short-lived participant token for an eligible booking", async () => {
    const response = await requestRoom();

    expect(response.status).toBe(200);
    expect(getRetreatLiveRoomAccessMock).toHaveBeenCalledWith("booking_123", "user_123");
    expect(createMeetingTokenMock).toHaveBeenCalledWith({
      roomName: "retreat-room",
      userId: "user_123",
      userName: "Retreat Guest",
      isOwner: false,
      expiresAt: new Date("2026-11-15T16:00:00.000Z"),
    });
    await expect(response.json()).resolves.toEqual({
      token: "meeting_token_123",
      roomUrl: "https://daily.example/retreat-room",
      communityModeEnabled: true,
      defaultMicMuted: true,
      defaultCameraOff: false,
      isRecorded: true,
      chatEnabled: true,
    });
  });
});

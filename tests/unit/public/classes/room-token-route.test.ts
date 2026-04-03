import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const getRoomTokenAccessMock = vi.fn();
const getSessionAccessContextMock = vi.fn();
const createMeetingTokenMock = vi.fn();
const isDailyConfiguredMock = vi.fn();
const buildSessionParticipantPermissionsMock = vi.fn();
const getEffectiveSessionCommunityModeMock = vi.fn();
const setUpSessionRoomMock = vi.fn();
const getHealthAccessStateMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/classes/attendance-service", () => ({
  getRoomTokenAccess: getRoomTokenAccessMock,
  getSessionAccessContext: getSessionAccessContextMock,
}));

vi.mock("@/lib/daily/service", () => ({
  createMeetingToken: createMeetingTokenMock,
  isDailyConfigured: isDailyConfiguredMock,
}));

vi.mock("@/lib/classes/live-room-service", () => ({
  buildSessionParticipantPermissions: buildSessionParticipantPermissionsMock,
  getEffectiveSessionCommunityMode: getEffectiveSessionCommunityModeMock,
}));

vi.mock("@/lib/classes/session-service", () => ({
  setUpSessionRoom: setUpSessionRoomMock,
}));

vi.mock("@/lib/health/health-service", () => ({
  getHealthAccessState: getHealthAccessStateMock,
}));

const route = await import("@/app/api/classes/sessions/[id]/room-token/route");

describe("POST /api/classes/sessions/[id]/room-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDailyConfiguredMock.mockReturnValue(true);
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    getSessionAccessContextMock.mockResolvedValue({
      session: {
        endsAtUtc: "2026-03-24T19:00:00.000Z",
        typeSnapshot: "Strength",
        capacity: 10,
        communityModeEnabled: false,
        communityModeUpdatedAt: null,
        instructorUserId: "instructor_123",
      },
    });
    buildSessionParticipantPermissionsMock.mockReturnValue({ permissions: { canSend: true } });
    getEffectiveSessionCommunityModeMock.mockReturnValue(false);
    createMeetingTokenMock.mockResolvedValue("token_123");
    getHealthAccessStateMock.mockResolvedValue({ isComplete: true });
  });

  it("blocks room access until the health declaration is complete", async () => {
    getHealthAccessStateMock.mockResolvedValue({ isComplete: false });

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Complete your health declaration before joining class.",
    });
  });

  it("returns a dedicated early-join denial", async () => {
    getRoomTokenAccessMock.mockRejectedValue(new Error("EARLY_JOIN_WINDOW"));

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "The live room is not open yet.",
    });
  });

  it("returns a dedicated late-join denial", async () => {
    getRoomTokenAccessMock.mockRejectedValue(new Error("LATE_JOIN_CUTOFF"));

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Warm-up has finished, so late joining is no longer available.",
    });
  });
});

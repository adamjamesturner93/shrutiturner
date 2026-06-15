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
const assertCurrentAcceptancesMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();

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

vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  getPhysicalServiceAcceptanceRequirements: (surface: string) => [
    { type: "terms", surface },
    { type: "health_waiver", surface, maxAgeDays: 365 },
    { type: "health_data", surface },
  ],
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/classes/sessions/[id]/room-token/route");

describe("POST /api/classes/sessions/[id]/room-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertCurrentAcceptancesMock.mockResolvedValue([]);
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
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
        isRecorded: false,
        participantMicDefaultMuted: false,
        participantCameraDefaultOff: false,
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

  it("returns a dedicated blocked-participant denial", async () => {
    getRoomTokenAccessMock.mockRejectedValue(new Error("PARTICIPANT_BLOCKED"));

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "You cannot re-enter this session.",
    });
  });

  it("returns a structured re-acceptance response when class join legal acceptance is stale", async () => {
    const requiredAcceptances = [
      {
        type: "terms",
        surface: "class_join",
        currentVersion: "terms.v2",
        acceptedVersion: null,
        policyVersionId: "policy_terms_v2",
        acceptanceEventId: null,
        isCurrent: false,
      },
    ];
    getSessionAccessContextMock.mockResolvedValue({
      session: {
        endsAtUtc: "2026-03-24T19:00:00.000Z",
        typeSnapshot: "Strength",
        capacity: 10,
        communityModeEnabled: false,
        communityModeUpdatedAt: null,
        instructorUserId: "instructor_123",
        isRecorded: true,
        participantMicDefaultMuted: true,
        participantCameraDefaultOff: true,
      },
    });
    const acceptanceError = {
      message: "LEGAL_ACCEPTANCE_REQUIRED",
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances,
      },
    };
    assertCurrentAcceptancesMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation(
      (error) => error === acceptanceError || error?.message === "LEGAL_ACCEPTANCE_REQUIRED"
    );

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "LEGAL_ACCEPTANCE_REQUIRED",
      requiredAcceptances,
    });
    expect(assertCurrentAcceptancesMock).toHaveBeenCalledWith("user_123", [
      { type: "terms", surface: "class_join" },
      { type: "health_waiver", surface: "class_join", maxAgeDays: 365 },
      { type: "health_data", surface: "class_join" },
    ]);
    expect(getRoomTokenAccessMock).not.toHaveBeenCalled();
  });

  it("returns the recording flag for recorded class sessions", async () => {
    getSessionAccessContextMock.mockResolvedValue({
      session: {
        endsAtUtc: "2026-03-24T19:00:00.000Z",
        typeSnapshot: "Strength",
        capacity: 10,
        communityModeEnabled: false,
        communityModeUpdatedAt: null,
        instructorUserId: "instructor_123",
        isRecorded: true,
        replayAvailable: true,
        participantMicDefaultMuted: true,
        participantCameraDefaultOff: true,
        status: "live",
      },
    });
    getRoomTokenAccessMock.mockResolvedValue({
      roomName: "room_123",
      roomUrl: "https://daily.example/room_123",
      userName: "Shruti",
      isOwner: true,
      lateJoinCutoffAt: new Date("2026-03-24T18:05:00.000Z"),
      hasPreviouslyJoined: true,
    });

    const response = await route.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      token: "token_123",
      isRecorded: true,
    });
  });
});

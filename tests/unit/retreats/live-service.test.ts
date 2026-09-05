import { beforeEach, describe, expect, it, vi } from "vitest";

const findBookingMock = vi.fn();
const findRetreatDateMock = vi.fn();
const updateRetreatDateMock = vi.fn();
const findUserOrThrowMock = vi.fn();
const canManageRetreatDateMock = vi.fn();
const setUpRetreatOnlineRoomMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();
const findRetreatAttendancesMock = vi.fn();
const updateRoomPermissionsMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    retreatBooking: { findFirst: findBookingMock },
    retreatDate: { findUnique: findRetreatDateMock, update: updateRetreatDateMock },
    retreatLiveAttendance: { findMany: findRetreatAttendancesMock },
    user: { findUniqueOrThrow: findUserOrThrowMock },
  },
}));

vi.mock("@/lib/authz/access", () => ({
  canManageRetreatDate: canManageRetreatDateMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  setUpRetreatOnlineRoom: setUpRetreatOnlineRoomMock,
}));

vi.mock("@/lib/retreats/workshop-setup", () => ({
  getWorkshopSetupState: vi.fn(async () => ({ complete: true, missing: [] })),
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  getPhysicalServiceAcceptanceRequirements: vi.fn(() => []),
  getAcceptanceRequirementStates: vi.fn(() => []),
}));

vi.mock("@/lib/daily/service", () => ({
  updateRoomPermissions: updateRoomPermissionsMock,
}));

const service = await import("@/lib/retreats/live-service");

function booking(roomState: "unprepared" | "prepared" = "prepared") {
  return {
    id: "booking_1",
    retreatDateId: "retreat_1",
    attendeeFirstName: "Asha",
    attendeeLastName: "Khan",
    paymentStatus: "paid_in_full",
    bookingStatus: "paid_in_full",
    onlineAccessEntitlements: [
      {
        liveAccessEnabled: true,
        liveAccessStartsAt: new Date(Date.now() - 60_000),
        liveAccessEndsAt: new Date(Date.now() + 60_000),
      },
    ],
    retreatDate: {
      id: "retreat_1",
      retreatType: "online",
      endsAt: new Date(Date.now() + 60_000),
      liveRoomState: roomState,
      dailyRoomName: roomState === "prepared" ? "room_1" : null,
      dailyRoomUrl: roomState === "prepared" ? "https://daily.example/room_1" : null,
      liveDisplayMode: "gallery",
      liveDisplayVersion: 1,
      focusedPresenterUserId: null,
      chatEnabled: true,
      liveChatDisabledAt: null,
      participantMicDefaultMuted: true,
      participantCameraDefaultOff: false,
      isRecorded: true,
      status: "open",
    },
  };
}

describe("retreat live access boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertCurrentAcceptancesMock.mockResolvedValue([]);
    findRetreatAttendancesMock.mockResolvedValue([]);
    updateRoomPermissionsMock.mockResolvedValue({});
    findUserOrThrowMock.mockResolvedValue({
      firstName: "Asha",
      lastName: "Khan",
      name: null,
      email: "asha@example.com",
    });
  });

  it("never provisions a room from an attendee token request", async () => {
    findBookingMock.mockResolvedValue(booking("unprepared"));
    await expect(service.getRetreatParticipantTokenContext("booking_1", "user_1")).rejects.toThrow(
      "ROOM_NOT_READY"
    );
    expect(setUpRetreatOnlineRoomMock).not.toHaveBeenCalled();
  });

  it("returns restricted attendee capabilities for a prepared room", async () => {
    findBookingMock.mockResolvedValue(booking());
    const result = await service.getRetreatParticipantTokenContext("booking_1", "user_1");
    expect(result).toMatchObject({
      participantRole: "attendee",
      canRecord: false,
      canModerate: false,
      canPublishReplay: false,
      roomState: "prepared",
    });
  });

  it("limits presenter mode attendees to instructor video while preserving room audio", () => {
    expect(
      service.buildRetreatParticipantPermissions({
        mode: "presenter",
        focusedPresenterUserId: "host_1",
      })
    ).toEqual({
      hasPresence: true,
      canSend: ["video", "audio"],
      canReceive: {
        base: ["audio"],
        byUserId: { host_1: true },
      },
      canAdmin: false,
    });
  });

  it("allows an assigned host to use the provisioning fallback", async () => {
    canManageRetreatDateMock.mockResolvedValue(true);
    findRetreatDateMock.mockResolvedValue({
      ...booking("unprepared").retreatDate,
      id: "retreat_1",
      startsAt: new Date(),
      timezone: "Europe/London",
      capacity: 12,
    });
    setUpRetreatOnlineRoomMock.mockResolvedValue({
      ...booking().retreatDate,
      id: "retreat_1",
      startsAt: new Date(),
      timezone: "Europe/London",
      capacity: 12,
    });
    findUserOrThrowMock.mockResolvedValue({
      firstName: "Host",
      lastName: "One",
      name: null,
      email: "host@example.com",
      role: "instructor",
    });
    const result = await service.getRetreatHostTokenContext("retreat_1", "host_1");
    expect(setUpRetreatOnlineRoomMock).toHaveBeenCalledWith("retreat_1");
    expect(result).toMatchObject({ participantRole: "host", canModerate: true });
  });

  it("persists presenter view when a host turns community mode off", async () => {
    canManageRetreatDateMock.mockResolvedValue(true);
    findRetreatDateMock.mockResolvedValue({
      ...booking().retreatDate,
      startsAt: new Date(),
      timezone: "Europe/London",
      capacity: 12,
    });
    updateRetreatDateMock.mockResolvedValue({
      ...booking().retreatDate,
      liveDisplayMode: "presenter",
      liveDisplayVersion: 2,
      focusedPresenterUserId: "host_1",
    });

    const result = await service.updateRetreatDisplayMode({
      retreatDateId: "retreat_1",
      userId: "host_1",
      mode: "presenter",
    });

    expect(updateRetreatDateMock).toHaveBeenCalledWith({
      where: { id: "retreat_1" },
      data: {
        liveDisplayMode: "presenter",
        focusedPresenterUserId: "host_1",
        liveDisplayVersion: { increment: 1 },
      },
    });
    expect(result).toMatchObject({
      retreatDate: {
        liveDisplayMode: "presenter",
        focusedPresenterUserId: "host_1",
      },
      dailySyncStatus: "skipped",
    });
  });

  it("updates active attendee permissions when the host changes visibility mode", async () => {
    canManageRetreatDateMock.mockResolvedValue(true);
    findRetreatDateMock.mockResolvedValue({
      ...booking().retreatDate,
      startsAt: new Date(),
      timezone: "Europe/London",
      capacity: 12,
    });
    updateRetreatDateMock.mockResolvedValue({
      ...booking().retreatDate,
      liveDisplayMode: "presenter",
      liveDisplayVersion: 2,
      focusedPresenterUserId: "host_1",
    });
    findRetreatAttendancesMock.mockResolvedValue([
      { dailySessionId: "daily_attendee_1" },
      { dailySessionId: "daily_attendee_2" },
    ]);

    const result = await service.updateRetreatDisplayMode({
      retreatDateId: "retreat_1",
      userId: "host_1",
      mode: "presenter",
    });

    expect(updateRoomPermissionsMock).toHaveBeenCalledWith({
      roomName: "room_1",
      data: {
        daily_attendee_1: expect.objectContaining({
          canReceive: { base: ["audio"], byUserId: { host_1: true } },
        }),
        daily_attendee_2: expect.objectContaining({
          canReceive: { base: ["audio"], byUserId: { host_1: true } },
        }),
      },
    });
    expect(result.dailySyncStatus).toBe("synced");
  });
});

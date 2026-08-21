import { beforeEach, describe, expect, it, vi } from "vitest";

const findBookingMock = vi.fn();
const findRetreatDateMock = vi.fn();
const findUserOrThrowMock = vi.fn();
const canManageRetreatDateMock = vi.fn();
const setUpRetreatOnlineRoomMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    retreatBooking: { findFirst: findBookingMock },
    retreatDate: { findUnique: findRetreatDateMock },
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
});

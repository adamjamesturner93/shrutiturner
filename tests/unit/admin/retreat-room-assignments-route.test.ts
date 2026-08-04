import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const assignAdminRetreatRoomUnitMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  assignAdminRetreatRoomUnit: assignAdminRetreatRoomUnitMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/room-assignments/route");

describe("admin retreat room assignment route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
  });

  it("assigns a compatible physical room to an active booking", async () => {
    assignAdminRetreatRoomUnitMock.mockResolvedValue({ id: "retreat_1", bookings: [] });
    const request = new Request("http://localhost/api/admin/retreats/retreat_1/room-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "booking_1", roomUnitId: "room_1" }),
    });

    const response = await route.PATCH(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(200);
    expect(assignAdminRetreatRoomUnitMock).toHaveBeenCalledWith({
      retreatDateId: "retreat_1",
      bookingId: "booking_1",
      roomUnitId: "room_1",
      actorUserId: "admin_1",
    });
  });

  it("allows an administrator to clear a room assignment", async () => {
    assignAdminRetreatRoomUnitMock.mockResolvedValue({ id: "retreat_1", bookings: [] });
    const request = new Request("http://localhost/api/admin/retreats/retreat_1/room-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "booking_1", roomUnitId: null }),
    });

    const response = await route.PATCH(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(200);
    expect(assignAdminRetreatRoomUnitMock).toHaveBeenCalledWith(
      expect.objectContaining({ roomUnitId: null })
    );
  });

  it("returns a conflict when the room has no remaining capacity", async () => {
    assignAdminRetreatRoomUnitMock.mockRejectedValue(new Error("ROOM_UNIT_UNAVAILABLE"));
    const request = new Request("http://localhost/api/admin/retreats/retreat_1/room-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "booking_1", roomUnitId: "room_full" }),
    });

    const response = await route.PATCH(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(409);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const updateAdminRetreatVenueRoomsMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));
vi.mock("@/lib/retreats/service", () => ({
  updateAdminRetreatVenueRooms: updateAdminRetreatVenueRoomsMock,
}));

const route = await import("@/app/api/admin/retreats/venues/[venueId]/route");

describe("admin retreat venue rooms route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
  });

  it("passes physical room groups and alternative selling modes to the service", async () => {
    updateAdminRetreatVenueRoomsMock.mockResolvedValue({
      contentfulVenueId: "venue_1",
      venueSlug: "powis-house",
      name: "Powis House",
      configured: true,
      roomGroups: [],
    });
    const request = new Request("http://localhost/api/admin/retreats/venues/venue_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomGroups: [
          {
            name: "Convertible king/twin",
            description: "Can be prepared as a king or two singles.",
            quantity: 2,
            capacityPerRoom: 2,
            bedSetup: "convertible_double_twin",
            allowShared: true,
            privateGuestCounts: [1, 2],
            roomNames: ["Willow", "Rowan"],
          },
        ],
      }),
    });

    const response = await route.PUT(request, {
      params: Promise.resolve({ venueId: "venue_1" }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminRetreatVenueRoomsMock).toHaveBeenCalledWith("venue_1", [
      expect.objectContaining({
        quantity: 2,
        allowShared: true,
        privateGuestCounts: [1, 2],
        roomNames: ["Willow", "Rowan"],
      }),
    ]);
  });

  it("returns a useful error for an invalid room catalogue", async () => {
    updateAdminRetreatVenueRoomsMock.mockRejectedValue(new Error("INVALID_RETREAT_VENUE_ROOMS"));
    const request = new Request("http://localhost/api/admin/retreats/venues/venue_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomGroups: [] }),
    });

    const response = await route.PUT(request, {
      params: Promise.resolve({ venueId: "venue_1" }),
    });

    expect(response.status).toBe(400);
  });
});

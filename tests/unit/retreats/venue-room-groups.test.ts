import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  $transaction: vi.fn(),
  retreatVenueProfile: { upsert: vi.fn(), findMany: vi.fn() },
  retreatVenueRoomGroup: {
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  retreatVenueRoomTemplate: { deleteMany: vi.fn(), create: vi.fn() },
};
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/content", () => ({
  getRetreatVenues: async () => [{ id: "venue-1", slug: "powis-house", name: "Powis House" }],
}));
const { updateAdminRetreatVenueRooms } = await import("@/lib/retreats/service");

const group = {
  id: "group-1",
  name: "King or twin",
  description: "Convertible room",
  quantity: 2,
  capacityPerRoom: 2,
  bedSetup: "convertible_double_twin",
  allowShared: false,
  privateGuestCounts: [1, 2],
  roomNames: ["Willow", "Rowan"],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((callback: (tx: typeof db) => Promise<unknown>) =>
    callback(db)
  );
  db.retreatVenueProfile.upsert.mockResolvedValue({ id: "profile-1" });
  db.retreatVenueProfile.findMany.mockResolvedValue([]);
  db.retreatVenueRoomGroup.findMany.mockResolvedValue([
    { id: "group-1", name: "Private King Room", active: true },
    { id: "group-2", name: "Old shared room", active: true },
  ]);
  db.retreatVenueRoomGroup.update.mockResolvedValue({ id: "group-1" });
  db.retreatVenueRoomGroup.create.mockResolvedValue({ id: "new-group" });
});

describe("venue room group identity", () => {
  it("preserves linked group IDs when changing the name or bed setup", async () => {
    await updateAdminRetreatVenueRooms("venue-1", [group]);
    expect(db.retreatVenueRoomGroup.update).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: expect.objectContaining({
        name: "King or twin",
        bedSetup: "convertible_double_twin",
        active: true,
      }),
    });
    expect(db.retreatVenueRoomGroup.create).not.toHaveBeenCalled();
    expect(db.retreatVenueRoomGroup.updateMany).toHaveBeenCalledWith({
      where: { venueProfileId: "profile-1", id: { notIn: ["group-1"] } },
      data: { active: false },
    });
  });

  it("matches older clients without IDs by group name", async () => {
    await updateAdminRetreatVenueRooms("venue-1", [
      { ...group, id: undefined, name: "Private King Room" },
    ]);
    expect(db.retreatVenueRoomGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "group-1" } })
    );
    expect(db.retreatVenueRoomGroup.create).not.toHaveBeenCalled();
  });

  it("creates new groups without trusting a client-generated ID", async () => {
    await updateAdminRetreatVenueRooms("venue-1", [{ ...group, id: "client-uuid" }]);
    expect(db.retreatVenueRoomGroup.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ venueProfileId: "profile-1" }),
    });
    expect(db.retreatVenueRoomGroup.create.mock.calls[0][0].data).not.toHaveProperty("id");
  });

  it("rejects duplicate IDs before changing any rooms", async () => {
    await expect(
      updateAdminRetreatVenueRooms("venue-1", [
        group,
        { ...group, name: "Another group", roomNames: [] },
      ])
    ).rejects.toThrow("INVALID_RETREAT_VENUE_ROOMS");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

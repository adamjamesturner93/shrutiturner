import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const updateAdminRetreatAccommodationMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));
vi.mock("@/lib/retreats/service", () => ({
  updateAdminRetreatAccommodation: updateAdminRetreatAccommodationMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/accommodation/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/retreats/retreat_1/accommodation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin retreat accommodation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
  });

  it("accepts separate total prices for shared and private occupancy", async () => {
    updateAdminRetreatAccommodationMock.mockResolvedValue({
      id: "retreat_1",
      retreatSlug: "powis-house-retreat",
    });

    const response = await route.PUT(
      request({
        capacity: 12,
        roomOptions: [
          { id: "shared", active: true },
          { id: "private", active: true },
        ],
        ratePlans: [
          { id: "shared-one", active: true, totalPricePence: 70000 },
          { id: "private-one", active: true, totalPricePence: 105000 },
          { id: "private-two", active: true, totalPricePence: 130000 },
        ],
      }),
      { params: Promise.resolve({ id: "retreat_1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateAdminRetreatAccommodationMock).toHaveBeenCalledWith(
      "retreat_1",
      expect.objectContaining({
        capacity: 12,
        ratePlans: expect.arrayContaining([
          { id: "private-two", active: true, totalPricePence: 130000 },
        ]),
      })
    );
  });

  it("rejects malformed prices", async () => {
    updateAdminRetreatAccommodationMock.mockRejectedValue(new Error("INVALID_RETREAT_INVENTORY"));
    const response = await route.PUT(
      request({
        capacity: 12,
        roomOptions: [{ id: "shared", active: true }],
        ratePlans: [{ id: "shared-one", active: true, totalPricePence: "70000" }],
      }),
      { params: Promise.resolve({ id: "retreat_1" }) }
    );

    expect(response.status).toBe(400);
  });
});

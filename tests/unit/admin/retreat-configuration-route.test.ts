import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const updateAdminRetreatConfigurationMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));
vi.mock("@/lib/retreats/service", () => ({
  updateAdminRetreatConfiguration: updateAdminRetreatConfigurationMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/configuration/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/retreats/retreat_1/configuration", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin retreat configuration route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
  });

  it("accepts structured shared-pool and payment configuration", async () => {
    updateAdminRetreatConfigurationMock.mockResolvedValue({
      id: "retreat_1",
      retreatSlug: "convertible-room-retreat",
    });
    const response = await route.PUT(
      request({
        inventoryPools: [{ id: "pool_1", totalQuantity: 2 }],
        roomOptions: [
          {
            id: "shared_1",
            inventoryPoolId: "pool_1",
            inventoryUnitsPerBooking: 1,
            capacity: 2,
          },
          {
            id: "king_1",
            inventoryPoolId: "pool_1",
            inventoryUnitsPerBooking: 2,
            capacity: 1,
          },
        ],
        payment: {
          depositType: "percentage",
          depositPercentageBasisPoints: 2500,
          fixedDepositAmountPence: null,
          balanceDueDaysBeforeStart: 56,
        },
      }),
      { params: Promise.resolve({ id: "retreat_1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateAdminRetreatConfigurationMock).toHaveBeenCalledWith(
      "retreat_1",
      expect.objectContaining({
        inventoryPools: [{ id: "pool_1", totalQuantity: 2 }],
        roomOptions: expect.arrayContaining([
          expect.objectContaining({ id: "king_1", inventoryUnitsPerBooking: 2 }),
        ]),
      })
    );
  });

  it("returns a conflict after the configuration is published", async () => {
    updateAdminRetreatConfigurationMock.mockRejectedValue(
      new Error("RETREAT_CONFIGURATION_LOCKED")
    );
    const response = await route.PUT(
      request({
        inventoryPools: [],
        roomOptions: [],
        payment: {
          depositType: "full_payment",
          depositPercentageBasisPoints: null,
          fixedDepositAmountPence: null,
          balanceDueDaysBeforeStart: null,
        },
      }),
      { params: Promise.resolve({ id: "retreat_1" }) }
    );

    expect(response.status).toBe(409);
  });
});

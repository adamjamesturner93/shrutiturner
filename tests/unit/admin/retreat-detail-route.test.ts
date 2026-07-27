import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const getAdminRetreatDetailMock = vi.fn();
const updateAdminRetreatEarlyBirdRatesMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  getAdminRetreatDetail: getAdminRetreatDetailMock,
  updateAdminRetreatEarlyBirdRates: updateAdminRetreatEarlyBirdRatesMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/route");

function createPatchRequest() {
  return new Request("http://localhost/api/admin/retreats/retreat_123", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ratePlans: [
        {
          ratePlanId: "rate_123",
          earlyBirdPricePence: 39500,
          earlyBirdEndsAt: "2026-08-14T23:00:00.000Z",
        },
      ],
    }),
  });
}

describe("PATCH /api/admin/retreats/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123" });
  });

  it("returns a conflict when a published price change is attempted", async () => {
    updateAdminRetreatEarlyBirdRatesMock.mockRejectedValue(new Error("RETREAT_PRICING_LOCKED"));

    const response = await route.PATCH(createPatchRequest(), {
      params: Promise.resolve({ id: "retreat_123" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "RETREAT_PRICING_LOCKED",
      message: "Published prices are locked. You may only extend an existing early-bird deadline.",
    });
  });
});

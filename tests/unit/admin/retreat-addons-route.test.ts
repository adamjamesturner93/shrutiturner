import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const createAdminRetreatAddonMock = vi.fn();
const removeAdminRetreatAddonMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  createAdminRetreatAddon: createAdminRetreatAddonMock,
  removeAdminRetreatAddon: removeAdminRetreatAddonMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/addons/route");

describe("admin retreat optional extras route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
  });

  it("creates a dated optional extra using integer minor units", async () => {
    createAdminRetreatAddonMock.mockResolvedValue({
      id: "retreat_1",
      retreatSlug: "pause-move-breathe-stirling",
    });
    const request = new Request("http://localhost/api/admin/retreats/retreat_1/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Massage appointment",
        description: "A 30-minute appointment",
        pricePence: 4500,
        totalQuantity: 8,
      }),
    });

    const response = await route.POST(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(200);
    expect(createAdminRetreatAddonMock).toHaveBeenCalledWith("retreat_1", {
      name: "Massage appointment",
      description: "A 30-minute appointment",
      pricePence: 4500,
      totalQuantity: 8,
    });
  });

  it("rejects malformed inventory instead of treating it as unlimited", async () => {
    createAdminRetreatAddonMock.mockRejectedValue(new Error("INVALID_RETREAT_ADDON"));
    const request = new Request("http://localhost/api/admin/retreats/retreat_1/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Massage", pricePence: 4500, totalQuantity: "eight" }),
    });

    const response = await route.POST(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(400);
    expect(createAdminRetreatAddonMock).toHaveBeenCalledWith(
      "retreat_1",
      expect.objectContaining({ totalQuantity: -1 })
    );
  });

  it("prevents changes once the retreat date is published", async () => {
    removeAdminRetreatAddonMock.mockRejectedValue(new Error("RETREAT_ADDONS_LOCKED"));
    const request = new Request(
      "http://localhost/api/admin/retreats/retreat_1/addons?addonId=addon_1",
      { method: "DELETE" }
    );

    const response = await route.DELETE(request, {
      params: Promise.resolve({ id: "retreat_1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Optional extras are locked after this date is published.",
    });
  });
});

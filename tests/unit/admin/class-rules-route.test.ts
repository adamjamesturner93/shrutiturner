import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getClassOperationalSettingsMock = vi.fn();
const updateClassOperationalSettingsMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/classes/settings-service", () => ({
  getClassOperationalSettings: getClassOperationalSettingsMock,
  updateClassOperationalSettings: updateClassOperationalSettingsMock,
}));

const route = await import("@/app/api/admin/business/class-rules/route");

describe("admin class-rules route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin_123", role: "admin" } });
  });

  it("returns the persisted class timing settings", async () => {
    getClassOperationalSettingsMock.mockResolvedValue({
      preJoinWindowMinutes: 10,
      lateJoinCutoffMinutes: 5,
      creditRefundWindowMinutes: 180,
      emptyClassAutoCancelWindowMinutes: 180,
    });

    const response = await route.GET(
      new Request("http://localhost/api/admin/business/class-rules")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 180,
        emptyClassAutoCancelWindowMinutes: 180,
      },
    });
  });

  it("patches just the supplied timing fields", async () => {
    updateClassOperationalSettingsMock.mockResolvedValue({
      preJoinWindowMinutes: 15,
      lateJoinCutoffMinutes: 5,
      creditRefundWindowMinutes: 120,
      emptyClassAutoCancelWindowMinutes: 180,
    });

    const response = await route.PATCH(
      new Request("http://localhost/api/admin/business/class-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preJoinWindowMinutes: 15,
          creditRefundWindowMinutes: 120,
        }),
      })
    );

    expect(updateClassOperationalSettingsMock).toHaveBeenCalledWith({
      preJoinWindowMinutes: 15,
      lateJoinCutoffMinutes: undefined,
      creditRefundWindowMinutes: 120,
      emptyClassAutoCancelWindowMinutes: undefined,
      actorUserId: "admin_123",
      requestId: expect.any(String),
      requestPath: "/api/admin/business/class-rules",
      requestIp: "",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        preJoinWindowMinutes: 15,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 120,
        emptyClassAutoCancelWindowMinutes: 180,
      },
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireSessionUserMock = vi.fn();
const ensureInstructorMembershipMock = vi.fn();
const syncMembershipFromStripeMock = vi.fn();
const getMembershipStateMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  ensureInstructorMembership: ensureInstructorMembershipMock,
  syncMembershipFromStripe: syncMembershipFromStripeMock,
  getMembershipState: getMembershipStateMock,
}));

const route = await import("@/app/api/me/membership/route");

describe("GET /api/me/membership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireSessionUserMock.mockResolvedValue({ id: "user_123", role: "student" });
    getMembershipStateMock.mockResolvedValue({
      membership: null,
      credits: { balance: 2, summary: [] },
      referral: { balancePence: 0 },
      complianceHistory: [],
    });
  });

  it("falls back to cached membership state if Stripe sync fails", async () => {
    syncMembershipFromStripeMock.mockRejectedValue(new Error("Stripe timeout"));

    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(syncMembershipFromStripeMock).toHaveBeenCalledWith("user_123");
    expect(getMembershipStateMock).toHaveBeenCalledWith("user_123");
    await expect(response.json()).resolves.toEqual({
      membership: null,
      credits: { balance: 2, summary: [] },
      referral: { balancePence: 0 },
      complianceHistory: [],
    });
  });

  it("uses instructor membership for admin users without Stripe sync", async () => {
    requireSessionUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });

    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(ensureInstructorMembershipMock).toHaveBeenCalledWith("admin_123");
    expect(syncMembershipFromStripeMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const createBillingPortalSessionMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  createBillingPortalSession: createBillingPortalSessionMock,
}));

const route = await import("@/app/api/me/billing/portal/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    createBillingPortalSessionMock.mockResolvedValue({
      portalUrl: "https://billing.example.com/session",
    });
  });

  it("creates a billing portal session for the authenticated user", async () => {
    const response = await route.POST(createRequest({ returnPath: "/dashboard/account" }));

    expect(response.status).toBe(200);
    expect(createBillingPortalSessionMock).toHaveBeenCalledWith("user_123", {
      returnPath: "/dashboard/account",
    });
  });

  it("falls back to the membership page for unsafe return paths", async () => {
    await route.POST(createRequest({ returnPath: "https://example.com/steal" }));

    expect(createBillingPortalSessionMock).toHaveBeenCalledWith("user_123", {
      returnPath: "/dashboard/membership",
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });
});

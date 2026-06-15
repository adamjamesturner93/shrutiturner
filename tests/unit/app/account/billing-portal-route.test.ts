import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createBillingPortalSessionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
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
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
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
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { portalUrl: "https://billing.example.com/session" },
    });
  });

  it("falls back to the membership page for unsafe return paths", async () => {
    await route.POST(createRequest({ returnPath: "https://example.com/steal" }));

    expect(createBillingPortalSessionMock).toHaveBeenCalledWith("user_123", {
      returnPath: "/dashboard/membership",
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    createBillingPortalSessionMock.mockRejectedValue(new Error("STRIPE_NOT_CONFIGURED"));

    const response = await route.POST(createRequest({}));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message: "Stripe is not configured." },
    });
  });
});

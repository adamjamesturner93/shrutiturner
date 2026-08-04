import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const connectionMock = vi.fn();
const requestRetreatCancellationMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/retreats/service", () => ({
  requestRetreatCancellation: requestRetreatCancellationMock,
}));

const route = await import("@/app/api/me/retreats/[id]/cancellation/route");

function request(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/me/retreats/booking_1/cancellation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/retreats/[id]/cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({
      user: { id: "user_1", email: "guest@example.com", role: "member" },
    });
  });

  it("creates a cancellation request with the policy-calculated refund", async () => {
    requestRetreatCancellationMock.mockResolvedValue({
      id: "request_1",
      refundableAmountPence: 34000,
      status: "requested",
    });

    const response = await route.POST(request({ reason: "My plans changed." }), {
      params: Promise.resolve({ id: "booking_1" }),
    });

    expect(response.status).toBe(201);
    expect(requestRetreatCancellationMock).toHaveBeenCalledWith({
      bookingId: "booking_1",
      userId: "user_1",
      userEmail: "guest@example.com",
      reason: "My plans changed.",
    });
  });

  it.each(["CANCELLATION_NOT_AVAILABLE", "RETREAT_ALREADY_STARTED"])(
    "returns a conflict for %s",
    async (code) => {
      requestRetreatCancellationMock.mockRejectedValue(new Error(code));

      const response = await route.POST(request(), {
        params: Promise.resolve({ id: "booking_1" }),
      });

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        error: { message: "This booking can no longer be cancelled online." },
      });
    }
  );
});

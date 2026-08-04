import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const connectionMock = vi.fn();
const approveRetreatCancellationMock = vi.fn();
const rejectRetreatCancellationMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/retreats/service", () => ({
  approveRetreatCancellation: approveRetreatCancellationMock,
  rejectRetreatCancellation: rejectRetreatCancellationMock,
}));

const route = await import("@/app/api/admin/retreats/cancellations/[requestId]/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/retreats/cancellations/request_1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/retreats/cancellations/[requestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "admin_1", role: "admin" } });
  });

  it("approves a pending cancellation and starts its refund", async () => {
    approveRetreatCancellationMock.mockResolvedValue({
      id: "request_1",
      bookingId: "booking_1",
      status: "approved",
    });

    const response = await route.POST(request({ action: "approve" }), {
      params: Promise.resolve({ requestId: "request_1" }),
    });

    expect(response.status).toBe(200);
    expect(approveRetreatCancellationMock).toHaveBeenCalledWith({
      requestId: "request_1",
      actorUserId: "admin_1",
      reason: null,
    });
  });

  it("requires a reason before rejecting a request", async () => {
    const response = await route.POST(request({ action: "reject" }), {
      params: Promise.resolve({ requestId: "request_1" }),
    });

    expect(response.status).toBe(400);
    expect(rejectRetreatCancellationMock).not.toHaveBeenCalled();
  });

  it("returns a conflict when another administrator already decided the request", async () => {
    approveRetreatCancellationMock.mockRejectedValue(new Error("CANCELLATION_ALREADY_DECIDED"));

    const response = await route.POST(request({ action: "approve" }), {
      params: Promise.resolve({ requestId: "request_1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { message: "This cancellation request has already been decided." },
    });
  });
});

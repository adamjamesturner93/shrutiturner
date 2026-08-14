import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();
const confirmCoachingPackageChangeRequestMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  confirmCoachingPackageChangeRequest: confirmCoachingPackageChangeRequestMock,
}));

const route = await import("@/app/api/me/coaching/package-change/confirm/route");

function postRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/coaching/package-change/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/coaching/package-change/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "user" } });
    assertCurrentAcceptancesMock.mockResolvedValue([]);
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    confirmCoachingPackageChangeRequestMock.mockResolvedValue({
      packageChangeRequestId: "change_123",
      subscriptionId: "sub_123",
      tier: "coached_plan",
      offerKey: "guided_training_plan",
      effectiveMode: "next_invoice",
    });
  });

  it("requires current legal acceptance before confirming a package change", async () => {
    const response = await route.POST(postRequest({ packageChangeRequestId: "change_123" }));

    expect(response.status).toBe(200);
    expect(assertCurrentAcceptancesMock).toHaveBeenCalledWith("user_123", [
      { type: "terms", surface: "coaching_package_change" },
      { type: "health_waiver", surface: "coaching_package_change" },
      { type: "coaching_agreement", surface: "coaching_package_change" },
    ]);
    expect(confirmCoachingPackageChangeRequestMock).toHaveBeenCalledWith("user_123", "change_123");
  });

  it("returns required acceptance details when legal acceptance is stale", async () => {
    const acceptanceError = {
      message: "LEGAL_ACCEPTANCE_REQUIRED",
      details: {
        requiredAcceptances: [{ type: "terms", surface: "coaching_package_change" }],
      },
    };
    assertCurrentAcceptancesMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation((error) => error === acceptanceError);

    const response = await route.POST(postRequest({ packageChangeRequestId: "change_123" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Current legal acceptance is required before updating your coaching plan.",
        details: acceptanceError.details,
      },
    });
    expect(confirmCoachingPackageChangeRequestMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redeemGiftPurchaseMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/gifts/service", () => ({
  getGiftRedemptionState: vi.fn(),
  redeemGiftPurchase: redeemGiftPurchaseMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/gift/redeem/[code]/route");

function request(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/gift/redeem/gift-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/gift/redeem/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
  });

  it("requires an authenticated account", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.POST(request(), {
      params: Promise.resolve({ code: "gift-code" }),
    });

    expect(response.status).toBe(401);
    expect(redeemGiftPurchaseMock).not.toHaveBeenCalled();
  });

  it("returns the legal acceptance state rather than a generic error", async () => {
    const error = Object.assign(new Error("LEGAL_ACCEPTANCE_REQUIRED"), {
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances: [{ type: "terms", current: false }],
      },
    });
    isAcceptanceRequiredErrorMock.mockImplementation((value) => value === error);
    redeemGiftPurchaseMock.mockRejectedValue(error);

    const response = await route.POST(request(), {
      params: Promise.resolve({ code: "gift-code" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(error.details);
  });

  it.each(["ALREADY_REDEEMED", "GIFT_EXPIRED", "ATTENDEE_REQUIRED"])(
    "returns a useful validation response for %s",
    async (code) => {
      redeemGiftPurchaseMock.mockRejectedValue(new Error(code));

      const response = await route.POST(request(), {
        params: Promise.resolve({ code: "gift-code" }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: "This gift cannot be redeemed with the details provided.",
      });
    }
  );

  it("returns a clear support path when the signed-in email is not the recipient", async () => {
    redeemGiftPurchaseMock.mockRejectedValue(new Error("RECIPIENT_EMAIL_MISMATCH"));
    const response = await route.POST(request(), {
      params: Promise.resolve({ code: "gift-code" }),
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "RECIPIENT_EMAIL_MISMATCH",
      supportUrl: "/contact",
    });
  });

  it("returns the booking and stable live destination after redemption", async () => {
    redeemGiftPurchaseMock.mockResolvedValue({
      type: "retreat",
      bookingId: "booking_1",
      nextUrl: "/dashboard/retreats/booking_1/live",
    });
    const response = await route.POST(request({ attendeeFirstName: "Asha" }), {
      params: Promise.resolve({ code: "gift-code" }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      bookingId: "booking_1",
      nextUrl: "/dashboard/retreats/booking_1/live",
    });
  });
});

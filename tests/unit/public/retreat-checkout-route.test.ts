import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createRetreatCheckoutMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  createRetreatCheckout: createRetreatCheckoutMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  isAcceptanceRequiredError: () => false,
}));

const route = await import("@/app/api/retreats/[slug]/checkout/route");

function checkoutRequest() {
  return new Request("http://localhost/api/retreats/sankalpa-online-workshop/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      retreatDateId: "date_1",
      roomOptionId: "ticket_1",
      purchaserFirstName: "Reader",
      purchaserLastName: "One",
      purchaserEmail: "reader@example.com",
      paymentOption: "pay_in_full",
    }),
  });
}

describe("POST /api/retreats/[slug]/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "deleted_user" } });
  });

  it("returns a sign-in response when the session user no longer exists", async () => {
    createRetreatCheckoutMock.mockRejectedValue(new Error("USER_NOT_FOUND"));

    const response = await route.POST(checkoutRequest(), {
      params: Promise.resolve({ slug: "sankalpa-online-workshop" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: "SESSION_INVALID",
      message: "Your account session is no longer valid. Please sign in again.",
    });
  });

  it("starts the authoritative full-payment checkout and invalidates public availability", async () => {
    authMock.mockResolvedValue(null);
    createRetreatCheckoutMock.mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.test/session",
    });

    const response = await route.POST(checkoutRequest(), {
      params: Promise.resolve({ slug: "sankalpa-online-workshop" }),
    });

    expect(response.status).toBe(200);
    expect(createRetreatCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        retreatSlug: "sankalpa-online-workshop",
        paymentOption: "pay_in_full",
        purchaserUserId: null,
      })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith("retreats-public", "max");
  });
});

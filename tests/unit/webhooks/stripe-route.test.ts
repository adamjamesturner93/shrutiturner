import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEventMock = vi.fn();
const processStripeWebhookEventMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: constructEventMock,
    },
  }),
}));

vi.mock("@/lib/billing/billing-service", () => ({
  processStripeWebhookEvent: processStripeWebhookEventMock,
}));

const route = await import("@/app/api/webhooks/stripe/route");

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    constructEventMock.mockReturnValue({ id: "evt_123", type: "customer.created" });
    processStripeWebhookEventMock.mockResolvedValue({ idempotent: false });
  });

  it("returns 501 when the webhook secret is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST" })
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      message: "Stripe webhook secret not configured.",
    });
  });

  it("constructs the event and passes it to the billing service", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_123",
        },
        body: JSON.stringify({ id: "evt_123" }),
      })
    );

    expect(response.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith('{"id":"evt_123"}', "sig_123", "whsec_test");
    expect(processStripeWebhookEventMock).toHaveBeenCalledWith({
      id: "evt_123",
      type: "customer.created",
    });
  });

  it("returns 400 when signature verification or processing fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "bad_sig",
        },
        body: "{}",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Webhook processing failed." });
  });
});

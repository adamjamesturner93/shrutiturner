import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyPostmarkWebhookMock = vi.fn();
const ingestPostmarkEventMock = vi.fn();

vi.mock("@/lib/postmark/webhook-service", () => ({
  verifyPostmarkWebhook: verifyPostmarkWebhookMock,
  ingestPostmarkEvent: ingestPostmarkEventMock,
}));

const route = await import("@/app/api/webhooks/postmark/route");

describe("POST /api/webhooks/postmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POSTMARK_WEBHOOK_SECRET = "postmark-secret";
    verifyPostmarkWebhookMock.mockReturnValue(true);
    ingestPostmarkEventMock.mockResolvedValue(undefined);
  });

  it("returns 501 when the webhook secret is missing", async () => {
    delete process.env.POSTMARK_WEBHOOK_SECRET;

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/postmark", { method: "POST" })
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      message: "POSTMARK_WEBHOOK_SECRET is not configured.",
    });
  });

  it("returns 401 for invalid signatures", async () => {
    verifyPostmarkWebhookMock.mockReturnValue(false);

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/postmark", {
        method: "POST",
        headers: {
          "x-postmark-signature": "bad",
        },
        body: JSON.stringify({ RecordType: "Delivered" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid Postmark webhook signature.",
    });
  });

  it("accepts array payloads and ingests each event", async () => {
    const payload = [{ RecordType: "Delivered" }, { RecordType: "Open" }];

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/postmark", {
        method: "POST",
        headers: {
          "x-postmark-signature": "sig",
        },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(ingestPostmarkEventMock).toHaveBeenCalledTimes(2);
    await expect(response.json()).resolves.toEqual({ ok: true, processed: 2 });
  });

  it("returns 400 for invalid JSON payloads", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/webhooks/postmark", {
        method: "POST",
        headers: {
          "x-postmark-signature": "sig",
        },
        body: "{not-json}",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Invalid JSON payload." });
  });
});

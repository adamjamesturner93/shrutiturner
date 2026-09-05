import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const recordAcknowledgedAcceptancesMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/legal/acceptance-service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/legal/acceptance-service")>();
  return {
    ...original,
    recordAcknowledgedAcceptances: recordAcknowledgedAcceptancesMock,
  };
});

const route = await import("@/app/api/me/acceptances/confirm/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/acceptances/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/acceptances/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    recordAcknowledgedAcceptancesMock.mockResolvedValue([
      {
        id: "acceptance_123",
        type: "terms",
        version: "terms.v2",
        acceptedAt: new Date("2026-08-21T12:00:00.000Z"),
      },
    ]);
  });

  it("records only an explicitly checked current agreement", async () => {
    const response = await route.POST(
      request({
        surface: "credit_checkout",
        acceptances: [
          {
            type: "terms",
            policyVersionId: "policy_terms_v2",
            version: "terms.v2",
            acknowledged: true,
          },
        ],
      })
    );

    expect(response.status).toBe(201);
    expect(recordAcknowledgedAcceptancesMock).toHaveBeenCalledWith({
      userId: "user_123",
      surface: "credit_checkout",
      acceptances: [
        {
          type: "terms",
          policyVersionId: "policy_terms_v2",
          version: "terms.v2",
          acknowledged: true,
        },
      ],
    });
  });

  it("rejects an agreement that was not explicitly checked", async () => {
    const response = await route.POST(
      request({
        surface: "credit_checkout",
        acceptances: [
          {
            type: "terms",
            policyVersionId: "policy_terms_v2",
            version: "terms.v2",
            acknowledged: false,
          },
        ],
      })
    );

    expect(response.status).toBe(400);
    expect(recordAcknowledgedAcceptancesMock).not.toHaveBeenCalled();
  });
});

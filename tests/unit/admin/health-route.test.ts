import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const queryRawMock = vi.fn();
const stripeVerifyConnectionMock = vi.fn();
const postmarkVerifyConnectionMock = vi.fn();
const dailyVerifyConnectionMock = vi.fn();
const contentfulVerifyConnectionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: queryRawMock,
  },
}));

vi.mock("@/lib/integrations/providers", () => ({
  stripePaymentProvider: {
    verifyConnection: stripeVerifyConnectionMock,
  },
  postmarkEmailProvider: {
    verifyConnection: postmarkVerifyConnectionMock,
  },
  dailyVideoProvider: {
    verifyConnection: dailyVerifyConnectionMock,
  },
  contentfulCmsProvider: {
    verifyConnection: contentfulVerifyConnectionMock,
  },
}));

const route = await import("@/app/api/health/route");

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "owner_123", role: "owner_admin" } });
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);
    stripeVerifyConnectionMock.mockResolvedValue({ ok: true, configured: true });
    postmarkVerifyConnectionMock.mockResolvedValue({ ok: true, configured: true });
    dailyVerifyConnectionMock.mockResolvedValue({
      ok: false,
      configured: false,
      message: "DAILY_NOT_CONFIGURED",
    });
    contentfulVerifyConnectionMock.mockResolvedValue({ ok: true, configured: true });
  });

  it("returns owner-admin provider health details including Daily", async () => {
    const response = await route.GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        status: "degraded",
        checkedAt: expect.any(String),
        checks: {
          database: { ok: true },
          stripe: { ok: true, configured: true },
          postmark: { ok: true, configured: true },
          daily: {
            ok: false,
            configured: false,
            message: "DAILY_NOT_CONFIGURED",
          },
          contentful: { ok: true, configured: true },
        },
      },
    });
  });

  it("rejects non-owner-admin users", async () => {
    authMock.mockResolvedValue({ user: { id: "member_123", role: "member" } });

    const response = await route.GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden",
      },
    });
  });
});

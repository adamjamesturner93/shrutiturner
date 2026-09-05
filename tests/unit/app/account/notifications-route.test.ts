import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const authMock = vi.fn();
const getNotificationPreferencesMock = vi.fn();
const updateNotificationPreferencesMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/account/account-service", () => ({
  getNotificationPreferences: getNotificationPreferencesMock,
  updateNotificationPreferences: updateNotificationPreferencesMock,
}));

const route = await import("@/app/api/me/notifications/route");

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/me/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    getNotificationPreferencesMock.mockResolvedValue({
      newsletterStatus: "subscribed",
      newsletterSubscribed: true,
    });
  });

  it("returns notification preferences for the current user", async () => {
    const response = await route.GET(new Request("http://localhost/api/me/notifications"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { newsletterStatus: "subscribed", newsletterSubscribed: true },
    });
    expect(getNotificationPreferencesMock).toHaveBeenCalledWith("user_123");
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.GET(new Request("http://localhost/api/me/notifications"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });
});

describe("PATCH /api/me/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    updateNotificationPreferencesMock.mockResolvedValue({
      newsletterStatus: "unsubscribed",
      newsletterSubscribed: false,
    });
  });

  it("passes notification updates through to the service", async () => {
    const response = await route.PATCH(
      createPatchRequest({
        newsletterSubscribed: false,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { newsletterStatus: "unsubscribed", newsletterSubscribed: false },
    });
    expect(updateNotificationPreferencesMock).toHaveBeenCalledWith("user_123", {
      newsletterSubscribed: false,
    });
  });
});

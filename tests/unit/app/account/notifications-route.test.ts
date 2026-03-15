import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireSessionUserMock = vi.fn();
const getNotificationPreferencesMock = vi.fn();
const updateNotificationPreferencesMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
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
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    getNotificationPreferencesMock.mockResolvedValue({ classReminders: true });
  });

  it("returns notification preferences for the current user", async () => {
    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(getNotificationPreferencesMock).toHaveBeenCalledWith("user_123");
  });

  it("returns 401 when the user is not authenticated", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });
});

describe("PATCH /api/me/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    updateNotificationPreferencesMock.mockResolvedValue({ classReminders: false });
  });

  it("passes notification updates through to the service", async () => {
    const response = await route.PATCH(
      createPatchRequest({
        classReminders: false,
        scheduleUpdates: true,
        programAnnouncements: false,
        marketingEmails: true,
      })
    );

    expect(response.status).toBe(200);
    expect(updateNotificationPreferencesMock).toHaveBeenCalledWith("user_123", {
      classReminders: false,
      scheduleUpdates: true,
      programAnnouncements: false,
      marketingEmails: true,
    });
  });
});

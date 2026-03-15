import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireSessionUserMock = vi.fn();
const getHealthProfileMock = vi.fn();
const upsertHealthProfileMock = vi.fn();

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

vi.mock("@/lib/health/health-service", () => ({
  getHealthProfile: getHealthProfileMock,
  upsertHealthProfile: upsertHealthProfileMock,
}));

const route = await import("@/app/api/me/health-profile/route");

function createPutRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/health-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/me/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    getHealthProfileMock.mockResolvedValue({ conditions: {}, details: {}, additionalNotes: "" });
    upsertHealthProfileMock.mockResolvedValue({ conditions: {}, details: {}, additionalNotes: "" });
  });

  it("returns the current user's saved health profile", async () => {
    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(getHealthProfileMock).toHaveBeenCalledWith("user_123");
  });

  it("returns 401 when the user is not authenticated", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });
});

describe("PUT /api/me/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    upsertHealthProfileMock.mockResolvedValue({ conditions: {}, details: {}, additionalNotes: "" });
  });

  it("saves the health profile for the current user", async () => {
    const response = await route.PUT(
      createPutRequest({
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        additionalNotes: "Prefers slower warmups",
      })
    );

    expect(response.status).toBe(200);
    expect(upsertHealthProfileMock).toHaveBeenCalledWith(
      "user_123",
      {
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        additionalNotes: "Prefers slower warmups",
      },
      "user_123"
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireSessionUserMock = vi.fn();
const getAccountMock = vi.fn();
const updateAccountMock = vi.fn();

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
  getAccount: getAccountMock,
  updateAccount: updateAccountMock,
}));

const route = await import("@/app/api/me/route");

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    getAccountMock.mockResolvedValue({ profile: { firstName: "Reader" } });
    updateAccountMock.mockResolvedValue({ firstName: "Reader" });
  });

  it("returns account data for the current user", async () => {
    const response = await route.GET(new Request("http://localhost/api/me"));

    expect(response.status).toBe(200);
    expect(getAccountMock).toHaveBeenCalledWith("user_123", "http://localhost:3000");
  });

  it("returns 401 when the user is not authenticated", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.GET(new Request("http://localhost/api/me"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });
});

describe("PATCH /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    updateAccountMock.mockResolvedValue({ firstName: "Reader" });
  });

  it("passes account updates through to the service", async () => {
    const response = await route.PATCH(
      createPatchRequest({
        firstName: "Reader",
        lastName: "One",
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
      })
    );

    expect(response.status).toBe(200);
    expect(updateAccountMock).toHaveBeenCalledWith("user_123", {
      firstName: "Reader",
      lastName: "One",
      dob: undefined,
      gender: undefined,
      ethnicity: undefined,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      hasAgreedToTerms: undefined,
      hasAgreedToHealth: undefined,
      hasConsentedToHealthData: undefined,
      heardAboutSource: undefined,
      heardAboutDetail: undefined,
      isOnboarded: undefined,
    });
  });

  it("passes explicit prefer-not-to-say values through without coercing them to null", async () => {
    await route.PATCH(
      createPatchRequest({
        gender: "prefer_not_to_say",
        ethnicity: "prefer_not_to_say",
      })
    );

    expect(updateAccountMock).toHaveBeenCalledWith("user_123", {
      firstName: undefined,
      lastName: undefined,
      dob: undefined,
      gender: "prefer_not_to_say",
      ethnicity: "prefer_not_to_say",
      timezone: undefined,
      dateFormat: undefined,
      hasAgreedToTerms: undefined,
      hasAgreedToHealth: undefined,
      hasConsentedToHealthData: undefined,
      heardAboutSource: undefined,
      heardAboutDetail: undefined,
      isOnboarded: undefined,
    });
  });

  it("maps under-18 validation to a 400 response", async () => {
    updateAccountMock.mockRejectedValue(new Error("UNDER_18"));

    const response = await route.PATCH(createPatchRequest({ dob: "2012-01-01" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "You must be 18 or over to use this service.",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const authMock = vi.fn();
const getAccountMock = vi.fn();
const updateAccountMock = vi.fn();

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
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    getAccountMock.mockResolvedValue({ profile: { firstName: "Reader" } });
    updateAccountMock.mockResolvedValue({ firstName: "Reader" });
  });

  it("returns account data for the current user", async () => {
    const response = await route.GET(new Request("http://localhost/api/me"));

    expect(response.status).toBe(200);
    expect(getAccountMock).toHaveBeenCalledWith("user_123", "http://localhost");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { profile: { firstName: "Reader" } },
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.GET(new Request("http://localhost/api/me"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });

  it("maps a deleted account behind an old session to a sign-in response", async () => {
    getAccountMock.mockRejectedValue(new Error("USER_NOT_FOUND"));

    const response = await route.GET(new Request("http://localhost/api/me"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "SESSION_INVALID",
        message: "Your account session is no longer valid. Please sign in again.",
      },
    });
  });
});

describe("PATCH /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
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
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { profile: { firstName: "Reader" } },
    });
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
      success: false,
      error: {
        code: "UNDER_18",
        message: "You must be 18 or over to use this service.",
      },
    });
  });

  it("maps a deleted account behind an old session to a sign-in response", async () => {
    updateAccountMock.mockRejectedValue(new Error("USER_NOT_FOUND"));

    const response = await route.PATCH(createPatchRequest({ firstName: "Reader" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "SESSION_INVALID",
        message: "Your account session is no longer valid. Please sign in again.",
      },
    });
  });
});

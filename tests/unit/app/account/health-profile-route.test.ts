import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const authMock = vi.fn();
const getHealthProfileMock = vi.fn();
const upsertHealthProfileMock = vi.fn();
const confirmHealthProfileMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();

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

vi.mock("@/lib/health/health-service", () => ({
  confirmHealthProfile: confirmHealthProfileMock,
  getHealthProfile: getHealthProfileMock,
  upsertHealthProfile: upsertHealthProfileMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/me/health-profile/route");

function createPutRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/health-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest() {
  return new Request("http://localhost/api/me/health-profile");
}

function createPostRequest() {
  return new Request("http://localhost/api/me/health-profile", { method: "POST" });
}

describe("GET /api/me/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    getHealthProfileMock.mockResolvedValue({
      declarationStatus: "incomplete",
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "",
      lastConfirmedAt: "",
      lastUpdated: "",
      needsReview: false,
    });
    upsertHealthProfileMock.mockResolvedValue({
      declarationStatus: "none_declared",
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "",
      lastConfirmedAt: "2026-03-29",
      lastUpdated: "2026-03-29",
      needsReview: false,
    });
    confirmHealthProfileMock.mockResolvedValue({
      declarationStatus: "none_declared",
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "",
      lastConfirmedAt: "2026-03-29",
      lastUpdated: "2026-03-29",
      needsReview: false,
    });
  });

  it("returns the current user's saved health profile", async () => {
    const response = await route.GET(createGetRequest());

    expect(response.status).toBe(200);
    expect(getHealthProfileMock).toHaveBeenCalledWith("user_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        declarationStatus: "incomplete",
        conditions: {},
        details: {},
        tracksFlareCheckIns: false,
        additionalNotes: "",
        lastConfirmedAt: "",
        lastUpdated: "",
        needsReview: false,
      },
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.GET(createGetRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });
});

describe("PUT /api/me/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    upsertHealthProfileMock.mockResolvedValue({
      declarationStatus: "context_declared",
      conditions: { fatigue: true },
      details: { fatigue: "Worse in mornings" },
      tracksFlareCheckIns: true,
      additionalNotes: "Prefers slower warmups",
      lastConfirmedAt: "2026-03-29",
      lastUpdated: "2026-03-29",
      needsReview: false,
    });
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
        declarationStatus: undefined,
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        tracksFlareCheckIns: undefined,
        additionalNotes: "Prefers slower warmups",
      },
      "user_123"
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        declarationStatus: "context_declared",
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        tracksFlareCheckIns: true,
        additionalNotes: "Prefers slower warmups",
        lastConfirmedAt: "2026-03-29",
        lastUpdated: "2026-03-29",
        needsReview: false,
      },
    });
  });

  it("passes explicit declaration state and flare tracking when provided", async () => {
    const response = await route.PUT(
      createPutRequest({
        declarationStatus: "context_declared",
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        tracksFlareCheckIns: true,
        additionalNotes: "Prefers slower warmups",
      })
    );

    expect(response.status).toBe(200);
    expect(upsertHealthProfileMock).toHaveBeenCalledWith(
      "user_123",
      {
        declarationStatus: "context_declared",
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        tracksFlareCheckIns: true,
        additionalNotes: "Prefers slower warmups",
      },
      "user_123"
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        declarationStatus: "context_declared",
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
        tracksFlareCheckIns: true,
        additionalNotes: "Prefers slower warmups",
        lastConfirmedAt: "2026-03-29",
        lastUpdated: "2026-03-29",
        needsReview: false,
      },
    });
  });

  it("returns a structured re-acceptance response when health-data acceptance is stale", async () => {
    const requiredAcceptances = [
      {
        type: "health_data",
        surface: "health_profile",
        currentVersion: "health-data.v2",
        acceptedVersion: "health-data.v1",
        policyVersionId: "policy_health_data_v2",
        acceptanceEventId: "event_health_data_v1",
        isCurrent: false,
      },
    ];
    const acceptanceError = {
      message: "LEGAL_ACCEPTANCE_REQUIRED",
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances,
      },
    };
    upsertHealthProfileMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation(
      (error) => error === acceptanceError || error?.message === "LEGAL_ACCEPTANCE_REQUIRED"
    );

    const response = await route.PUT(
      createPutRequest({
        conditions: { fatigue: true },
        details: { fatigue: "Worse in mornings" },
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Current legal acceptance is required before saving health data.",
        details: {
          code: "LEGAL_ACCEPTANCE_REQUIRED",
          requiredAcceptances,
        },
      },
    });
  });
});

describe("POST /api/me/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    confirmHealthProfileMock.mockResolvedValue({
      declarationStatus: "none_declared",
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "",
      lastConfirmedAt: "2026-03-29",
      lastUpdated: "2026-03-01",
      needsReview: false,
    });
  });

  it("confirms the current declaration without changing the profile content", async () => {
    const response = await route.POST(createPostRequest());

    expect(response.status).toBe(200);
    expect(confirmHealthProfileMock).toHaveBeenCalledWith("user_123", "user_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        declarationStatus: "none_declared",
        conditions: {},
        details: {},
        tracksFlareCheckIns: false,
        additionalNotes: "",
        lastConfirmedAt: "2026-03-29",
        lastUpdated: "2026-03-01",
        needsReview: false,
      },
    });
  });
});

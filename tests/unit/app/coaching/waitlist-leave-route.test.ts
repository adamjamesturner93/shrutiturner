import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const leaveCoachingWaitlistMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/coaching/service", () => ({
  leaveCoachingWaitlist: leaveCoachingWaitlistMock,
}));

const route = await import("@/app/api/me/coaching/waitlist/leave/route");

describe("POST /api/me/coaching/waitlist/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "user" } });
    leaveCoachingWaitlistMock.mockResolvedValue({
      id: "application_123",
      status: "withdrawn",
      waitlistLeftAt: new Date("2026-05-24T10:00:00.000Z"),
    });
  });

  it("withdraws the signed-in user's active waiting-list place", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/me/coaching/waitlist/leave", { method: "POST" })
    );

    expect(response.status).toBe(200);
    expect(leaveCoachingWaitlistMock).toHaveBeenCalledWith("user_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "application_123",
        status: "withdrawn",
        waitlistLeftAt: "2026-05-24T10:00:00.000Z",
      },
    });
  });

  it("returns not found when there is no active waiting-list place", async () => {
    leaveCoachingWaitlistMock.mockRejectedValue(new Error("WAITLIST_ENTRY_NOT_FOUND"));

    const response = await route.POST(
      new Request("http://localhost/api/me/coaching/waitlist/leave", { method: "POST" })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "No active coaching waiting-list place was found.",
      },
    });
  });
});

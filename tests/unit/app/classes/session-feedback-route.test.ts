import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const saveSessionFeedbackMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/classes/feedback-service", () => ({
  saveSessionFeedback: saveSessionFeedbackMock,
}));

const route = await import("@/app/api/classes/sessions/[id]/feedback/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/classes/sessions/session_123/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/classes/sessions/[id]/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    saveSessionFeedbackMock.mockResolvedValue({ bookingId: "booking_123", stage: "post" });
  });

  it("saves pre-class feedback for the authenticated user", async () => {
    const response = await route.POST(
      createRequest({ stage: "pre", energyLevel: 4, flareToday: true }),
      {
        params: Promise.resolve({ id: "session_123" }),
      }
    );

    expect(response.status).toBe(200);
    expect(saveSessionFeedbackMock).toHaveBeenCalledWith({
      sessionId: "session_123",
      userId: "user_123",
      input: {
        stage: "pre",
        energyLevel: 4,
        flareToday: true,
      },
    });
  });

  it("rejects invalid post-class payloads", async () => {
    const response = await route.POST(createRequest({ stage: "post", feeling: "bad" }), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Invalid feedback payload" });
    expect(saveSessionFeedbackMock).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated requests", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.POST(createRequest({ stage: "post", feeling: "good" }), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("maps missing bookings to 404", async () => {
    saveSessionFeedbackMock.mockRejectedValue(new Error("BOOKING_NOT_FOUND"));

    const response = await route.POST(createRequest({ stage: "post", feeling: "good" }), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Booking not found" });
  });
});

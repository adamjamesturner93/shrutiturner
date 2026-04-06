import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getSessionAccessScopeMock = vi.fn();
const getClassSessionDetailForScopeMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/authz/access", () => ({
  getSessionAccessScope: getSessionAccessScopeMock,
}));

vi.mock("@/lib/classes/session-service", () => ({
  getClassSessionDetailForScope: getClassSessionDetailForScopeMock,
}));

const route = await import("@/app/api/classes/sessions/[id]/route");

describe("GET /api/classes/sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123" } });
  });

  it("requests the public scope for anonymous users", async () => {
    authMock.mockResolvedValue(null);
    getSessionAccessScopeMock.mockResolvedValue("public");
    getClassSessionDetailForScopeMock.mockResolvedValue({
      id: "session_123",
      instructorUserId: "",
      bookings: [],
      waitlist: [],
    });

    const response = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(200);
    expect(getSessionAccessScopeMock).toHaveBeenCalledWith(undefined, "session_123");
    expect(getClassSessionDetailForScopeMock).toHaveBeenCalledWith(
      "session_123",
      undefined,
      "public"
    );
  });

  it("requests the assigned-instructor scope for explicitly assigned instructors", async () => {
    getSessionAccessScopeMock.mockResolvedValue("assigned_instructor");
    getClassSessionDetailForScopeMock.mockResolvedValue({
      id: "session_123",
      instructorUserId: "instructor_123",
      bookings: [
        {
          id: "booking_123",
          email: "",
          healthConditions: ["Relevant movement considerations shared"],
        },
      ],
      waitlist: [],
    });

    const response = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(200);
    expect(getSessionAccessScopeMock).toHaveBeenCalledWith("user_123", "session_123");
    expect(getClassSessionDetailForScopeMock).toHaveBeenCalledWith(
      "session_123",
      "user_123",
      "assigned_instructor"
    );
    await expect(response.json()).resolves.toEqual({
      id: "session_123",
      instructorUserId: "instructor_123",
      bookings: [
        {
          id: "booking_123",
          email: "",
          healthConditions: ["Relevant movement considerations shared"],
        },
      ],
      waitlist: [],
    });
  });
});

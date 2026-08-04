import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const connectionMock = vi.fn();
const getMyRetreatBookingDetailMock = vi.fn();
const updateMyRetreatSecondaryGuestMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/retreats/service", () => ({
  getMyRetreatBookingDetail: getMyRetreatBookingDetailMock,
  updateMyRetreatSecondaryGuest: updateMyRetreatSecondaryGuestMock,
}));

const route = await import("@/app/api/me/retreats/[id]/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/retreats/booking_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("signed-in retreat booking detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "user_1", role: "user" } });
  });

  it("updates the missing second guest without replacing the booking", async () => {
    updateMyRetreatSecondaryGuestMock.mockResolvedValue({
      id: "booking_1",
      secondaryGuest: { firstName: "Sam", lastName: "Lee", email: "sam@example.com" },
    });

    const response = await route.PATCH(
      request({
        firstName: "Sam",
        lastName: "Lee",
        email: "sam@example.com",
        dietaryRequirements: "Vegetarian",
      }),
      { params: Promise.resolve({ id: "booking_1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateMyRetreatSecondaryGuestMock).toHaveBeenCalledWith({
      userId: "user_1",
      bookingId: "booking_1",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
      dietaryRequirements: "Vegetarian",
    });
  });

  it("returns a useful validation response rather than a generic 500", async () => {
    updateMyRetreatSecondaryGuestMock.mockRejectedValue(new Error("INVALID_SECONDARY_GUEST"));

    const response = await route.PATCH(request({ firstName: "Sam" }), {
      params: Promise.resolve({ id: "booking_1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { message: "Complete the second guest's name and email." },
    });
  });

  it("returns 409 when a claimed guest can no longer be replaced", async () => {
    updateMyRetreatSecondaryGuestMock.mockRejectedValue(
      new Error("SECONDARY_GUEST_ALREADY_CLAIMED")
    );

    const response = await route.PATCH(
      request({ firstName: "New", lastName: "Guest", email: "new@example.com" }),
      { params: Promise.resolve({ id: "booking_1" }) }
    );

    expect(response.status).toBe(409);
  });
});

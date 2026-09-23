import { beforeEach, describe, expect, it, vi } from "vitest";
const requireStaffAdminUser = vi.fn();
const previewVenueRoomSync = vi.fn();
const applyVenueRoomSync = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/api/auth-user", () => ({ requireStaffAdminUser }));
vi.mock("@/lib/retreats/venue-sync-service", () => ({ previewVenueRoomSync, applyVenueRoomSync }));
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag: vi.fn() }));
const { GET, POST } = await import("@/app/api/admin/retreats/venues/[venueId]/sync/route");
const context = { params: Promise.resolve({ venueId: "venue" }) };
beforeEach(() => {
  requireStaffAdminUser.mockResolvedValue({ id: "staff" });
});
describe("venue sync permissions and preview contract", () => {
  it("rejects nonstaff before exposing event configuration", async () => {
    requireStaffAdminUser.mockRejectedValue(new Error("FORBIDDEN"));
    expect((await GET(new Request("http://localhost"), context)).status).toBe(403);
    expect(previewVenueRoomSync).not.toHaveBeenCalled();
  });
  it("rejects malformed prices before any writes", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ dateId: "date", revision: "review", prices: { new: -1 } }),
      }),
      context
    );
    expect(response.status).toBe(400);
    expect(applyVenueRoomSync).not.toHaveBeenCalled();
  });
  it("requires a fresh preview if bookings or rooms changed", async () => {
    applyVenueRoomSync.mockRejectedValue(new Error("VENUE_SYNC_STALE"));
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ dateId: "date", revision: "review", prices: {} }),
      }),
      context
    );
    expect(response.status).toBe(409);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

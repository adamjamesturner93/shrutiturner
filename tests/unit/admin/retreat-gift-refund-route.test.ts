import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireStaffAdminUserMock = vi.fn();
const refundUnredeemedRetreatGiftMock = vi.fn();
const getAdminRetreatDetailMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/gifts/service", () => ({
  refundUnredeemedRetreatGift: refundUnredeemedRetreatGiftMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  getAdminRetreatDetail: getAdminRetreatDetailMock,
}));

const route = await import("@/app/api/admin/retreats/[id]/gifts/[giftId]/refund/route");

describe("admin retreat gift refund route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_1" });
    getAdminRetreatDetailMock.mockResolvedValue({ id: "retreat_1", gifts: [] });
  });

  it("submits a policy-based refund for an unredeemed gift", async () => {
    refundUnredeemedRetreatGiftMock.mockResolvedValue({ id: "gift_1", status: "refunded" });

    const response = await route.POST(
      new Request("http://localhost/api/admin/retreats/retreat_1/gifts/gift_1/refund", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "retreat_1", giftId: "gift_1" }) }
    );

    expect(response.status).toBe(200);
    expect(refundUnredeemedRetreatGiftMock).toHaveBeenCalledWith({
      retreatDateId: "retreat_1",
      giftPurchaseId: "gift_1",
      actorUserId: "admin_1",
    });
  });

  it("does not refund an already redeemed gift", async () => {
    refundUnredeemedRetreatGiftMock.mockRejectedValue(new Error("GIFT_ALREADY_REDEEMED"));

    const response = await route.POST(
      new Request("http://localhost/api/admin/retreats/retreat_1/gifts/gift_1/refund", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "retreat_1", giftId: "gift_1" }) }
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "This gift purchase cannot be refunded from here.",
    });
  });
});

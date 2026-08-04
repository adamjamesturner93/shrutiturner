import { connection, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { refundUnredeemedRetreatGift } from "@/lib/gifts/service";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; giftId: string }> }
) {
  await connection();
  try {
    const user = await requireStaffAdminUser();
    const { id, giftId } = await context.params;
    await refundUnredeemedRetreatGift({
      retreatDateId: id,
      giftPurchaseId: giftId,
      actorUserId: user.id,
    });
    revalidatePath("/retreats");
    revalidatePath("/admin/retreats");
    revalidatePath(`/admin/retreats/${id}`);
    revalidateTag("retreats-public", "max");
    return NextResponse.json(await getAdminRetreatDetail(id));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Gift purchase not found." }, { status: 404 });
    }
    if (
      error instanceof Error &&
      ["GIFT_ALREADY_REDEEMED", "GIFT_NOT_REFUNDABLE", "GIFT_PAYMENT_INTENT_MISSING"].includes(
        error.message
      )
    ) {
      return NextResponse.json(
        { message: "This gift purchase cannot be refunded from here." },
        { status: 409 }
      );
    }
    console.error("POST retreat gift refund failed", error);
    return NextResponse.json({ message: "Failed to refund the gift purchase." }, { status: 500 });
  }
}

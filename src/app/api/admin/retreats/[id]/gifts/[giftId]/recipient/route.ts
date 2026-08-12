import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { correctRetreatGiftRecipient, resendRetreatGiftInvitation } from "@/lib/gifts/service";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; giftId: string }> }
) {
  try {
    const admin = await requireStaffAdminUser();
    const { id, giftId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      recipientEmail?: string;
      action?: string;
    };
    const result =
      body.action === "resend"
        ? await resendRetreatGiftInvitation({
            retreatDateId: id,
            giftPurchaseId: giftId,
            actorUserId: admin.id,
          })
        : await correctRetreatGiftRecipient({
            retreatDateId: id,
            giftPurchaseId: giftId,
            recipientEmail: body.recipientEmail || "",
            actorUserId: admin.id,
          });
    void result;
    return NextResponse.json(await getAdminRetreatDetail(id));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    if (code === "NOT_FOUND")
      return NextResponse.json({ message: "Gift not found." }, { status: 404 });
    if (code === "GIFT_ALREADY_REDEEMED")
      return NextResponse.json(
        { message: "A claimed gift email cannot be changed here." },
        { status: 409 }
      );
    if (code === "INVALID_EMAIL")
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    return NextResponse.json({ message: "Unable to update the gift invitation." }, { status: 500 });
  }
}

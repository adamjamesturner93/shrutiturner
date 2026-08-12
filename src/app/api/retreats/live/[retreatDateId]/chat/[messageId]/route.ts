import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { deleteRetreatChatMessage } from "@/lib/retreats/live-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ retreatDateId: string; messageId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId, messageId } = await context.params;
    return NextResponse.json(
      await deleteRetreatChatMessage({ retreatDateId, messageId, userId: user.id })
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: code === "FORBIDDEN" ? "Forbidden" : "Message not found." },
      { status: code === "FORBIDDEN" ? 403 : 404 }
    );
  }
}

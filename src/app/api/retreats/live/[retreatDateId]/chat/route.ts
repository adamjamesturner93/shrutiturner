import { RetreatLiveChatMessageType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createRetreatChatMessage, listRetreatChatMessages } from "@/lib/retreats/live-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    return NextResponse.json(await listRetreatChatMessages(retreatDateId, user.id));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: code === "FORBIDDEN" ? "Forbidden" : "Unable to load chat." },
      { status: code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { text?: string; type?: string };
    if (typeof body.text !== "string")
      return NextResponse.json({ message: "Message text is required." }, { status: 400 });
    const message = await createRetreatChatMessage({
      retreatDateId,
      userId: user.id,
      text: body.text,
      type:
        body.type === "announcement"
          ? RetreatLiveChatMessageType.announcement
          : RetreatLiveChatMessageType.message,
    });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "RATE_LIMITED")
      return NextResponse.json(
        { message: "Please wait before sending another message." },
        { status: 429 }
      );
    if (["FORBIDDEN", "ROOM_CLOSED", "CHAT_DISABLED"].includes(code))
      return NextResponse.json({ message: "Chat is not available." }, { status: 403 });
    if (code === "INVALID_MESSAGE")
      return NextResponse.json({ message: "Enter a message." }, { status: 400 });
    return NextResponse.json({ message: "Unable to send message." }, { status: 500 });
  }
}

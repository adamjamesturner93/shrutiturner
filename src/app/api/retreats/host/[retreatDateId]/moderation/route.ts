import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { ejectRoomParticipant, updateRoomPermissions } from "@/lib/daily/service";
import { getRetreatHostTokenContext } from "@/lib/retreats/live-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    const access = await getRetreatHostTokenContext(retreatDateId, user.id);
    const body = (await request.json().catch(() => ({}))) as {
      action?: "mute" | "remove";
      participantId?: string;
    };
    if (!body.action || !body.participantId) {
      return NextResponse.json(
        { message: "Participant and action are required." },
        { status: 400 }
      );
    }
    if (body.action === "remove") {
      await ejectRoomParticipant(access.roomName, body.participantId);
    } else {
      await updateRoomPermissions({
        roomName: access.roomName,
        data: {
          [body.participantId]: {
            canSend: ["video"],
            canReceive: { base: true },
            canAdmin: false,
          },
        },
      });
    }
    return NextResponse.json({ ok: true, action: body.action });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    return NextResponse.json({ message: "Unable to moderate participant." }, { status: 500 });
  }
}

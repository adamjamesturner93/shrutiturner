import { NextResponse } from "next/server";
import { ClassSessionStatus } from "@prisma/client";
import { requireSessionUser } from "@/lib/api/auth-user";
import { canManageSession } from "@/lib/authz/access";
import { db } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const allowed = await canManageSession(user.id, id);
    if (!allowed) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const session = await db.classSession.update({
      where: { id },
      data: { status: ClassSessionStatus.live },
      select: {
        id: true,
        status: true,
      },
    });
    return NextResponse.json({ session, replayAssetId: null });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/classes/sessions/[id]/live/start failed", error);
    return NextResponse.json({ message: "Failed to start live session" }, { status: 500 });
  }
}

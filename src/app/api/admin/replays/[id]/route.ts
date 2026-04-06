import { ReplayEntitlementAccessType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { deleteReplayAssetNow, revokeReplayEntitlement } from "@/lib/replay/service";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireOwnerAdminUser();
    const { id } = await context.params;
    const asset = await deleteReplayAssetNow(id, admin.id);
    return NextResponse.json(asset);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /api/admin/replays/[id] failed", error);
    return NextResponse.json({ message: "Failed to delete replay" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireOwnerAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      userId?: string;
      reason?: string;
      accessType?: ReplayEntitlementAccessType;
    };

    if (body.action === "revoke_entitlement" && typeof body.userId === "string") {
      const entitlement = await revokeReplayEntitlement({
        replayAssetId: id,
        userId: body.userId,
        actorUserId: admin.id,
        reason: body.reason || null,
        accessType:
          body.accessType && Object.values(ReplayEntitlementAccessType).includes(body.accessType)
            ? body.accessType
            : undefined,
      });
      return NextResponse.json(entitlement);
    }

    return NextResponse.json({ message: "Unsupported admin replay action." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/admin/replays/[id] failed", error);
    return NextResponse.json({ message: "Failed to update replay" }, { status: 500 });
  }
}

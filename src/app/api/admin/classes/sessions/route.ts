import { connection, NextResponse } from "next/server";
import { ClassSessionStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/api/auth-user";
import { listAdminClassSessions } from "@/lib/classes/session-service";

export async function GET(request: Request) {
  try {
    await connection();
    const adminUser = await requireAdminUser();
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const statusParam = url.searchParams.get("status") || "all";
    const type = url.searchParams.get("type") || "all";

    const status: ClassSessionStatus | "all" =
      statusParam === "all"
        ? "all"
        : ["draft", "scheduled", "live", "completed", "cancelled"].includes(statusParam)
          ? (statusParam as ClassSessionStatus)
          : "all";

    const rows = await listAdminClassSessions({
      currentUserId: adminUser.id,
      from: from ? new Date(from) : new Date(Date.now() - 30 * 86400000),
      to: to ? new Date(to) : undefined,
      status,
      type,
    });

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.error("GET /api/admin/classes/sessions failed", error);
    return NextResponse.json({ message: "Failed to load admin class sessions" }, { status: 500 });
  }
}

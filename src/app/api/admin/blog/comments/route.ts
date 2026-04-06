import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { listAdminBlogComments, updateAdminBlogCommentStatus } from "@/lib/blog/engagement-service";

type PatchBody = {
  id?: unknown;
  action?: unknown;
};

export async function GET(request: Request) {
  try {
    await connection();
    await requireStaffAdminUser();
    const url = new URL(request.url);
    const comments = await listAdminBlogComments({
      postSlug: url.searchParams.get("postSlug") || undefined,
      search: url.searchParams.get("search") || undefined,
      status:
        (url.searchParams.get("status") as "visible" | "hidden" | "deleted" | "all" | null) ||
        "all",
    });
    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/blog/comments failed", error);
    return NextResponse.json({ message: "Failed to load blog comments." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Comment id is required." }, { status: 400 });
    }
    if (body.action !== "hide" && body.action !== "show" && body.action !== "delete") {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }
    const result = await updateAdminBlogCommentStatus({
      id: body.id,
      action: body.action,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }
    console.error("PATCH /api/admin/blog/comments failed", error);
    return NextResponse.json({ message: "Failed to update comment." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createBlogComment } from "@/lib/blog/engagement-service";
import { isRateLimited } from "@/lib/rate-limit";

type CommentBody = {
  content?: unknown;
  parentId?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireSessionUser();
    if (
      isRateLimited({ scope: "blog-comments", key: user.id, windowMs: 10 * 60 * 1000, max: 12 })
    ) {
      return NextResponse.json(
        { message: "Too many comments. Please slow down." },
        { status: 429 }
      );
    }
    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as CommentBody | null;
    if (!body) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const comment = await createBlogComment({
      postSlug: slug,
      userId: user.id,
      content: typeof body.content === "string" ? body.content : "",
      parentId: typeof body.parentId === "string" ? body.parentId : null,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      (error.message === "COMMENT_TOO_SHORT" ||
        error.message === "COMMENT_TOO_LONG" ||
        error.message === "PARENT_NOT_FOUND" ||
        error.message === "NESTING_NOT_ALLOWED")
    ) {
      return NextResponse.json(
        { message: "Please check your comment and try again." },
        { status: 400 }
      );
    }
    console.error("POST /api/blog/[slug]/comments failed", error);
    return NextResponse.json({ message: "Failed to post comment." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getBlogPostPreviewBySlug } from "@/lib/content";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireStaffAdminUser();
    const { slug } = await params;
    const post = await getBlogPostPreviewBySlug(slug);
    if (!post) {
      return NextResponse.json({ message: "Draft preview not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/contentful/blog-preview/[slug] failed", error);
    return NextResponse.json({ message: "Failed to load draft preview" }, { status: 500 });
  }
}

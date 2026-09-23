import { connection, NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/content/public-content";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { listAdminBlogReactions } from "@/lib/blog/engagement-service";

export async function GET() {
  await connection();
  try {
    await requireStaffAdminUser();
    const [reactions, posts] = await Promise.all([
      listAdminBlogReactions(),
      getBlogPosts().catch((): Awaited<ReturnType<typeof getBlogPosts>> => []),
    ]);
    const titles = new Map(posts.map((post) => [post.id, post.title] as const));
    return NextResponse.json(
      reactions.map((row) => ({
        ...row,
        title: titles.get(row.postSlug) || row.postSlug.replace(/-/g, " "),
      })),
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("Failed to load blog reactions", error);
    return NextResponse.json({ message: "Failed to load blog reactions." }, { status: 500 });
  }
}

import { connection, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getBlogEngagement } from "@/lib/blog/engagement-service";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await connection();
    const { slug } = await context.params;
    const session = await auth();
    const cookieStore = await cookies();
    const engagement = await getBlogEngagement({
      postSlug: slug,
      currentUserId: session?.user?.id || null,
      anonymousToken: cookieStore.get("blog_reaction_token")?.value || null,
    });
    return NextResponse.json(engagement);
  } catch (error) {
    console.error("GET /api/blog/[slug]/engagement failed", error);
    return NextResponse.json({ message: "Failed to load blog engagement." }, { status: 500 });
  }
}

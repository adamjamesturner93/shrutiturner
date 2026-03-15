import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { toggleBlogReaction } from "@/lib/blog/engagement-service";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    const { slug } = await context.params;
    const cookieStore = await cookies();
    const existingToken = cookieStore.get("blog_reaction_token")?.value || null;
    const anonymousToken = session?.user?.id ? null : existingToken || randomUUID();
    const result = await toggleBlogReaction({
      postSlug: slug,
      userId: session?.user?.id || null,
      anonymousToken,
    });
    const response = NextResponse.json(result);
    if (!session?.user?.id && anonymousToken && !existingToken) {
      response.cookies.set("blog_reaction_token", anonymousToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (error) {
    console.error("POST /api/blog/[slug]/reactions/toggle failed", error);
    return NextResponse.json({ message: "Failed to toggle reaction." }, { status: 500 });
  }
}

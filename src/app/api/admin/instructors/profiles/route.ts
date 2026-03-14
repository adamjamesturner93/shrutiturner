import { connection, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { getInstructorProfiles } from "@/lib/content";

export async function GET() {
  try {
    await connection();
    await requireAdminUser();
    const profiles = await getInstructorProfiles();
    return NextResponse.json(
      profiles
        .filter((p) => p.active !== false)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          headline: p.headline || "",
          bio: p.bio || "",
        }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/instructors/profiles failed", error);
    return NextResponse.json({ message: "Failed to load instructor profiles" }, { status: 500 });
  }
}

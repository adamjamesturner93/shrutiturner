import { revalidatePath, revalidateTag } from "next/cache";
import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminRetreatSalesStatus } from "@/lib/retreats/service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();

  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = body.status;
    if (status !== "open" && status !== "closed" && status !== "completed") {
      return NextResponse.json({ message: "Invalid retreat status." }, { status: 400 });
    }

    const detail = await updateAdminRetreatSalesStatus(id, status);
    revalidatePath("/retreats");
    revalidatePath(`/retreats/${detail.retreatSlug}`);
    revalidatePath("/admin/retreats");
    revalidatePath(`/admin/retreats/${id}`);
    revalidateTag("retreats-public", "max");
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Retreat not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "RETREAT_PUBLISH_VALIDATION_FAILED") {
      const validationErrors = (error as Error & { validationErrors?: string[] }).validationErrors;
      return NextResponse.json(
        {
          code: error.message,
          message: "This retreat is not ready to publish.",
          errors: validationErrors || [],
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "INVALID_STATUS_TRANSITION") {
      return NextResponse.json(
        { message: "This retreat cannot move to that status." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/retreats/[id]/status failed", error);
    return NextResponse.json({ message: "Failed to update retreat status." }, { status: 500 });
  }
}

import { revalidatePath, revalidateTag } from "next/cache";
import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminRetreatAccommodation } from "@/lib/retreats/service";

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : NaN;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || !Array.isArray(body.roomOptions) || !Array.isArray(body.ratePlans)) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }

    const roomOptions = body.roomOptions.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_RETREAT_INVENTORY");
      }
      const row = value as Record<string, unknown>;
      return { id: typeof row.id === "string" ? row.id : "", active: row.active === true };
    });
    const ratePlans = body.ratePlans.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_RETREAT_INVENTORY");
      }
      const row = value as Record<string, unknown>;
      return {
        id: typeof row.id === "string" ? row.id : "",
        active: row.active === true,
        totalPricePence: integer(row.totalPricePence),
      };
    });

    const detail = await updateAdminRetreatAccommodation(id, {
      capacity: integer(body.capacity),
      roomOptions,
      ratePlans,
    });
    revalidatePath("/retreats");
    revalidatePath(`/retreats/${detail.retreatSlug}`);
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
    if (error instanceof Error && error.message === "RETREAT_CONFIGURATION_LOCKED") {
      return NextResponse.json(
        { message: "Accommodation and prices are locked after bookings open." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "INVALID_RETREAT_INVENTORY") {
      return NextResponse.json(
        { message: "Enable at least one accommodation choice and enter a valid total price." },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/retreats/[id]/accommodation failed", error);
    return NextResponse.json({ message: "Failed to update accommodation." }, { status: 500 });
  }
}

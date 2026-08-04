import { connection, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { createAdminRetreatAddon, removeAdminRetreatAddon } from "@/lib/retreats/service";

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return NextResponse.json({ message: "Retreat or extra not found." }, { status: 404 });
  }
  if (error instanceof Error && error.message === "RETREAT_ADDONS_LOCKED") {
    return NextResponse.json(
      { message: "Optional extras are locked after this date is published." },
      { status: 409 }
    );
  }
  if (error instanceof Error && error.message === "INVALID_RETREAT_ADDON") {
    return NextResponse.json(
      { message: "Enter valid details for the optional extra." },
      { status: 400 }
    );
  }
  console.error("Admin retreat add-on request failed", error);
  return NextResponse.json({ message: "Failed to update optional extras." }, { status: 500 });
}

function revalidateRetreat(retreatSlug: string, retreatDateId: string) {
  revalidatePath("/retreats");
  revalidatePath(`/retreats/${retreatSlug}`);
  revalidatePath(`/admin/retreats/${retreatDateId}`);
  revalidateTag("retreats-public", "max");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new Error("INVALID_RETREAT_ADDON");
    const detail = await createAdminRetreatAddon(id, {
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : null,
      pricePence:
        typeof body.pricePence === "number" && Number.isInteger(body.pricePence)
          ? body.pricePence
          : -1,
      totalQuantity:
        body.totalQuantity === null || body.totalQuantity === undefined
          ? null
          : typeof body.totalQuantity === "number" && Number.isInteger(body.totalQuantity)
            ? body.totalQuantity
            : -1,
    });
    revalidateRetreat(detail.retreatSlug, id);
    return NextResponse.json(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const url = new URL(request.url);
    const addonId = url.searchParams.get("addonId") || "";
    if (!addonId) throw new Error("INVALID_RETREAT_ADDON");
    const detail = await removeAdminRetreatAddon(id, addonId);
    revalidateRetreat(detail.retreatSlug, id);
    return NextResponse.json(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

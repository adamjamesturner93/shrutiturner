import { connection, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminRetreatDetail, updateAdminRetreatEarlyBirdRates } from "@/lib/retreats/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();

  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const detail = await getAdminRetreatDetail(id);
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
    console.error("GET /api/admin/retreats/[id] failed", error);
    return NextResponse.json({ message: "Failed to load retreat detail." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();

  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (!Array.isArray(body.ratePlans)) {
      return NextResponse.json({ message: "Rate-plan updates are required." }, { status: 400 });
    }

    const updates = body.ratePlans.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_EARLY_BIRD");
      }
      const row = value as Record<string, unknown>;
      const ratePlanId = typeof row.ratePlanId === "string" ? row.ratePlanId.trim() : "";
      const earlyBirdPricePence =
        row.earlyBirdPricePence === null
          ? null
          : typeof row.earlyBirdPricePence === "number" && Number.isInteger(row.earlyBirdPricePence)
            ? row.earlyBirdPricePence
            : NaN;
      const earlyBirdEndsAt =
        row.earlyBirdEndsAt === null
          ? null
          : typeof row.earlyBirdEndsAt === "string"
            ? new Date(row.earlyBirdEndsAt)
            : new Date(NaN);
      if (
        !ratePlanId ||
        Number.isNaN(earlyBirdPricePence) ||
        (earlyBirdEndsAt && Number.isNaN(earlyBirdEndsAt.getTime()))
      ) {
        throw new Error("INVALID_EARLY_BIRD");
      }
      return { ratePlanId, earlyBirdPricePence, earlyBirdEndsAt };
    });

    const detail = await updateAdminRetreatEarlyBirdRates(id, updates);
    revalidatePath("/retreats");
    revalidatePath(`/retreats/${detail.retreatSlug}`);
    revalidatePath("/admin/retreats");
    revalidatePath(`/admin/retreats/${id}`);
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
    if (
      error instanceof Error &&
      ["INVALID_EARLY_BIRD", "EARLY_BIRD_RATES_REQUIRED"].includes(error.message)
    ) {
      return NextResponse.json(
        { message: "Each early-bird price needs a valid deadline before the experience starts." },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/retreats/[id] failed", error);
    return NextResponse.json({ message: "Failed to update early-bird pricing." }, { status: 500 });
  }
}

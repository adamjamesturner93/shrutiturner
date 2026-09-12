import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminRetreatTicketPrices } from "@/lib/retreats/service";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { rates?: unknown } | null;
    if (!Array.isArray(body?.rates))
      return NextResponse.json({ message: "Supply all ticket prices." }, { status: 400 });
    const rates = body.rates.map((value: unknown) => {
      const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
      return {
        id: typeof row.id === "string" ? row.id : "",
        pricePence: typeof row.pricePence === "number" ? row.pricePence : NaN,
      };
    });
    const result = await updateAdminRetreatTicketPrices(id, rates);
    revalidatePath(`/admin/retreats/${id}`);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message === "NOT_FOUND"
            ? 404
            : message === "RETREAT_PRICING_LOCKED"
              ? 409
              : message === "INVALID_PRICE"
                ? 400
                : 500;
    return NextResponse.json(
      {
        message:
          status === 409
            ? "Published prices cannot be changed."
            : "Unable to save ticket prices. Check the amounts and try again.",
      },
      { status }
    );
  }
}

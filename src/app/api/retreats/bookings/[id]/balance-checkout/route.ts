import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRetreatBalanceCheckout } from "@/lib/retreats/service";

type BalanceBody = {
  token?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as BalanceBody;
  const session = await auth();

  try {
    const result = await createRetreatBalanceCheckout({
      bookingId: id,
      userId: session?.user?.id || null,
      token: typeof body.token === "string" ? body.token : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "BALANCE_NOT_DUE") {
      return NextResponse.json(
        { message: "There is no balance due for this booking." },
        { status: 400 }
      );
    }
    console.error("POST /api/retreats/bookings/[id]/balance-checkout failed", error);
    return NextResponse.json({ message: "Failed to start balance checkout." }, { status: 500 });
  }
}

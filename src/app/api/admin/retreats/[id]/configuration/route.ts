import { connection, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminRetreatConfiguration } from "@/lib/retreats/service";

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : NaN;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || !Array.isArray(body.inventoryPools) || !Array.isArray(body.roomOptions)) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }
    const payment =
      body.payment && typeof body.payment === "object" && !Array.isArray(body.payment)
        ? (body.payment as Record<string, unknown>)
        : null;
    if (!payment) throw new Error("INVALID_RETREAT_PAYMENT_RULE");

    const inventoryPools = body.inventoryPools.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_RETREAT_INVENTORY");
      }
      const row = value as Record<string, unknown>;
      return {
        id: typeof row.id === "string" ? row.id : "",
        totalQuantity: integer(row.totalQuantity),
      };
    });
    const roomOptions = body.roomOptions.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_RETREAT_INVENTORY");
      }
      const row = value as Record<string, unknown>;
      return {
        id: typeof row.id === "string" ? row.id : "",
        inventoryPoolId: typeof row.inventoryPoolId === "string" ? row.inventoryPoolId : "",
        inventoryUnitsPerBooking: integer(row.inventoryUnitsPerBooking),
        capacity: integer(row.capacity),
      };
    });
    const depositType = payment.depositType;
    if (
      depositType !== "percentage" &&
      depositType !== "fixed_amount" &&
      depositType !== "full_payment"
    ) {
      throw new Error("INVALID_RETREAT_PAYMENT_RULE");
    }

    const detail = await updateAdminRetreatConfiguration(id, {
      inventoryPools,
      roomOptions,
      payment: {
        depositType,
        depositPercentageBasisPoints:
          payment.depositPercentageBasisPoints === null
            ? null
            : integer(payment.depositPercentageBasisPoints),
        fixedDepositAmountPence:
          payment.fixedDepositAmountPence === null
            ? null
            : integer(payment.fixedDepositAmountPence),
        balanceDueDaysBeforeStart:
          payment.balanceDueDaysBeforeStart === null
            ? null
            : integer(payment.balanceDueDaysBeforeStart),
      },
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
        { message: "Inventory and payment rules are locked after bookings open." },
        { status: 409 }
      );
    }
    if (
      error instanceof Error &&
      ["INVALID_RETREAT_INVENTORY", "INVALID_RETREAT_PAYMENT_RULE"].includes(error.message)
    ) {
      return NextResponse.json(
        { message: "Check the inventory quantities and payment rule." },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/retreats/[id]/configuration failed", error);
    return NextResponse.json(
      { message: "Failed to update retreat configuration." },
      { status: 500 }
    );
  }
}

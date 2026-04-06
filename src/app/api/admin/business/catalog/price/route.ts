import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  createOrActivateCatalogPrice,
  type BillingCatalogKey,
} from "@/lib/billing/catalog-service";

const validKeys = new Set([
  "membership_movewell_monthly",
  "membership_movewell_annual",
  "credits_1",
  "credits_3",
  "credits_10",
]);

export async function POST(request: Request) {
  try {
    await requireStaffAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      key?: string;
      unitAmountPence?: number;
      currency?: string;
    };
    if (!body.key || !validKeys.has(body.key)) {
      return NextResponse.json({ message: "Invalid catalog key" }, { status: 400 });
    }
    const amount = Number(body.unitAmountPence || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid unitAmountPence" }, { status: 400 });
    }

    const result = await createOrActivateCatalogPrice({
      key: body.key as BillingCatalogKey,
      unitAmountPence: Math.floor(amount),
      currency: body.currency,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/business/catalog/price failed", error);
    return NextResponse.json({ message: "Failed to create price" }, { status: 500 });
  }
}

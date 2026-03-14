import { connection, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { createPromotionCode, listPromotionCodes } from "@/lib/billing/catalog-service";

export async function GET() {
  try {
    await connection();
    await requireAdminUser();
    const rows = await listPromotionCodes();
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/business/discounts failed", error);
    return NextResponse.json({ message: "Failed to load discount codes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      type?: "percent" | "amount";
      percentOff?: number;
      amountOffPence?: number;
      currency?: string;
      expiresAt?: string;
      maxRedemptions?: number;
    };

    if (!body.code || !body.type) {
      return NextResponse.json({ message: "Code and type are required" }, { status: 400 });
    }

    const result = await createPromotionCode({
      code: body.code,
      type: body.type,
      percentOff: body.percentOff,
      amountOffPence: body.amountOffPence,
      currency: body.currency,
      expiresAt: body.expiresAt,
      maxRedemptions: body.maxRedemptions,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/business/discounts failed", error);
    return NextResponse.json({ message: "Failed to create discount code" }, { status: 500 });
  }
}

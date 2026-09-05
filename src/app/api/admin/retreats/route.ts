import { connection, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { createAdminRetreatDate, getAdminRetreatSummaries } from "@/lib/retreats/service";

function stringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function numberField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDateField(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function GET() {
  await connection();

  try {
    await requireStaffAdminUser();
    const data = await getAdminRetreatSummaries();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/retreats failed", error);
    return NextResponse.json({ message: "Failed to load retreats." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    await requireStaffAdminUser();
    const body = (await request.json()) as Record<string, unknown>;
    const retreatSlug = stringField(body, "retreatSlug");
    const title = stringField(body, "title");
    const location = stringField(body, "location");
    const retreatTypeValue = stringField(body, "retreatType");
    const startsAt = parseDateField(stringField(body, "startsAt"));
    const endsAt = parseDateField(stringField(body, "endsAt"));
    const capacity = numberField(body, "capacity");
    const pricePence = numberField(body, "pricePence");
    const paymentPolicyValue = stringField(body, "paymentPolicy");
    const earlyBirdPricePence = numberField(body, "earlyBirdPricePence");
    const earlyBirdEndsAtValue = stringField(body, "earlyBirdEndsAt");
    const earlyBirdEndsAt = earlyBirdEndsAtValue ? parseDateField(earlyBirdEndsAtValue) : null;

    if (
      !retreatSlug ||
      !title ||
      !location ||
      !startsAt ||
      !endsAt ||
      !capacity ||
      pricePence === null
    ) {
      return NextResponse.json(
        { message: "Missing required retreat date fields." },
        { status: 400 }
      );
    }

    if (retreatTypeValue !== "in_person" && retreatTypeValue !== "online") {
      return NextResponse.json(
        { message: "Retreat type must be in_person or online." },
        { status: 400 }
      );
    }
    if (paymentPolicyValue !== "deposit" && paymentPolicyValue !== "full_payment") {
      return NextResponse.json(
        { message: "Payment policy must be deposit or full_payment." },
        { status: 400 }
      );
    }

    if (
      (earlyBirdPricePence !== null && !earlyBirdEndsAt) ||
      (earlyBirdPricePence === null && earlyBirdEndsAt)
    ) {
      return NextResponse.json(
        { message: "Early bird price and end date must be provided together." },
        { status: 400 }
      );
    }

    const retreatDate = await createAdminRetreatDate({
      retreatSlug,
      title,
      location,
      retreatType: retreatTypeValue,
      startsAt,
      endsAt,
      capacity,
      pricePence,
      paymentPolicy: retreatTypeValue === "online" ? "full_payment" : paymentPolicyValue,
      earlyBirdPricePence,
      earlyBirdEndsAt,
    });

    revalidatePath("/retreats");
    revalidatePath(`/retreats/${retreatSlug}`);
    revalidatePath("/admin/retreats");
    revalidateTag("retreats-public", "max");

    return NextResponse.json({ id: retreatDate.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      ["RETREAT_VENUE_REQUIRED", "RETREAT_VENUE_ROOMS_REQUIRED"].includes(error.message)
    ) {
      return NextResponse.json(
        {
          message:
            error.message === "RETREAT_VENUE_REQUIRED"
              ? "Link a published Contentful venue to this retreat first."
              : "Set up this venue's rooms before creating the retreat date.",
        },
        { status: 409 }
      );
    }
    if (
      error instanceof Error &&
      [
        "INVALID_DATE_RANGE",
        "INVALID_CAPACITY",
        "INVALID_PRICE",
        "INVALID_EARLY_BIRD",
        "RETREAT_TYPE_MISMATCH",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: "Invalid retreat date details." }, { status: 400 });
    }
    console.error("POST /api/admin/retreats failed", error);
    return NextResponse.json({ message: "Failed to create retreat date." }, { status: 500 });
  }
}

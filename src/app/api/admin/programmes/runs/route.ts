import { SmallGroupProgrammeStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  createSmallGroupRun,
  listAdminSmallGroupProgrammes,
  listSmallGroupTemplateOptions,
} from "@/lib/small-groups/service";

export async function POST(request: Request) {
  try {
    await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as {
      templateSlug?: unknown;
      startDate?: unknown;
      timeLocal?: unknown;
      weekdays?: unknown;
      repeatWeeks?: unknown;
      cohortSize?: unknown;
      pricePence?: unknown;
      status?: unknown;
    } | null;

    if (!body || typeof body.templateSlug !== "string" || typeof body.startDate !== "string") {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const status =
      typeof body.status === "string" &&
      Object.values(SmallGroupProgrammeStatus).includes(body.status as SmallGroupProgrammeStatus)
        ? (body.status as SmallGroupProgrammeStatus)
        : SmallGroupProgrammeStatus.upcoming;

    const created = await createSmallGroupRun({
      templateSlug: body.templateSlug,
      startDate: body.startDate,
      timeLocal: typeof body.timeLocal === "string" ? body.timeLocal : "11:00",
      weekdays: Array.isArray(body.weekdays)
        ? body.weekdays.flatMap((day) => {
            const value = Number(day);
            return Number.isInteger(value) ? [value] : [];
          })
        : undefined,
      repeatWeeks:
        typeof body.repeatWeeks === "number" ? body.repeatWeeks : Number(body.repeatWeeks || 0),
      cohortSize:
        typeof body.cohortSize === "number" ? body.cohortSize : Number(body.cohortSize || 0),
      pricePence:
        typeof body.pricePence === "number" ? body.pricePence : Number(body.pricePence || 0),
      status,
    });

    const [items, templates] = await Promise.all([
      listAdminSmallGroupProgrammes(),
      listSmallGroupTemplateOptions(),
    ]);
    const item = items.find((programme) => programme.id === created.id) || null;
    if (!item) {
      return NextResponse.json(
        { message: "Programme run created but could not be loaded." },
        { status: 500 }
      );
    }

    return NextResponse.json({ item, templates });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      ["TEMPLATE_NOT_FOUND", "INVALID_START_DATE", "INVALID_TIME", "INVALID_SCHEDULE"].includes(
        error.message
      )
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("POST /api/admin/programmes/runs failed", error);
    return NextResponse.json({ message: "Failed to create programme run." }, { status: 500 });
  }
}

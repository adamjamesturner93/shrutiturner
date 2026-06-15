import { connection, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ClassSessionStatus } from "@prisma/client";
import { getScheduleGroupedByDay, listClassSessions } from "@/lib/classes/session-service";

type ParsedQuery =
  | {
      success: true;
      data: {
        from?: string;
        to?: string;
        type?: string;
        slug?: string;
        groupByDay?: "true" | "false";
      };
    }
  | { success: false };

function parseQuery(searchParams: URLSearchParams): ParsedQuery {
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const typeParam = searchParams.get("type");
  const slugParam = searchParams.get("slug");
  const groupByDayParam = searchParams.get("groupByDay") || undefined;

  if (from && Number.isNaN(new Date(from).getTime())) {
    return { success: false };
  }

  if (to && Number.isNaN(new Date(to).getTime())) {
    return { success: false };
  }

  const type = typeParam === null ? undefined : typeParam.trim();
  if (typeParam !== null && !type) {
    return { success: false };
  }

  const slug = slugParam === null ? undefined : slugParam.trim();
  if (slugParam !== null && !slug) {
    return { success: false };
  }

  if (groupByDayParam && groupByDayParam !== "true" && groupByDayParam !== "false") {
    return { success: false };
  }

  const groupByDay = groupByDayParam as "true" | "false" | undefined;

  return {
    success: true,
    data: {
      from,
      to,
      type,
      slug,
      groupByDay,
    },
  };
}

export async function GET(request: Request) {
  await connection();

  try {
    const url = new URL(request.url);
    const session = await auth();
    const currentUserId = session?.user?.id || undefined;
    const parsed = parseQuery(url.searchParams);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid query parameters" }, { status: 400 });
    }

    const { from: fromParam, to: toParam, type, slug, groupByDay } = parsed.data;
    const from = fromParam ? new Date(fromParam) : new Date();
    const to = toParam ? new Date(toParam) : undefined;

    const statusIn: ClassSessionStatus[] = [ClassSessionStatus.scheduled, ClassSessionStatus.live];

    if (groupByDay === "true") {
      const grouped = await getScheduleGroupedByDay({
        currentUserId,
        from,
        to,
      });
      return NextResponse.json(grouped);
    }

    const rows = await listClassSessions({
      currentUserId,
      from,
      to,
      type,
      slug,
      statusIn,
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/classes/sessions failed", error);
    return NextResponse.json({ message: "Failed to load class sessions" }, { status: 500 });
  }
}

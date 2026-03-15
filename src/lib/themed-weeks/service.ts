import { db } from "@/lib/db";
import { selectScheduleThemedWeek } from "@/lib/classes/public-page-helpers";

export interface PublicThemedWeek {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  audience: string;
  ctaHref: string;
  ctaLabel: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

function startOfLondonDay(input: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(input);

  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value || "";

  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`);
}

function mapPublicThemedWeek(row: {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  audience: string;
  ctaHref: string;
  ctaLabel: string;
  startDate: Date;
  endDate: Date;
  sortOrder: number;
}): PublicThemedWeek {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription,
    audience: row.audience,
    ctaHref: row.ctaHref,
    ctaLabel: row.ctaLabel,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    sortOrder: row.sortOrder,
  };
}

export async function listPublicThemedWeeks(): Promise<PublicThemedWeek[]> {
  const rows = await db.themedWeek.findMany({
    orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
  });

  return rows.map(mapPublicThemedWeek);
}

export async function getScheduleThemedWeek(now: Date = new Date()): Promise<PublicThemedWeek | null> {
  const today = startOfLondonDay(now);
  const rows = await db.themedWeek.findMany({
    where: {
      endDate: { gte: today },
    },
    orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
  });

  return selectScheduleThemedWeek(rows.map(mapPublicThemedWeek), today);
}

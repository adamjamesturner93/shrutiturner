import { db } from "./db";
import { sanitizeSegment, uniqueToken } from "./_shared";

const THEMED_WEEK_PREFIX = "e2e-themed-week";

export async function createE2eThemedWeek(input: {
  label: string;
  title: string;
  shortDescription: string;
  audience: string;
  ctaHref: string;
  ctaLabel: string;
  startDate: string;
  endDate: string;
  sortOrder?: number;
}) {
  const slugLabel = sanitizeSegment(input.label) || "week";
  return db.themedWeek.create({
    data: {
      slug: `${THEMED_WEEK_PREFIX}-${slugLabel}-${uniqueToken("banner")}`,
      title: input.title,
      shortDescription: input.shortDescription,
      audience: input.audience,
      ctaHref: input.ctaHref,
      ctaLabel: input.ctaLabel,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function cleanupE2eThemedWeeks() {
  await db.themedWeek.deleteMany({
    where: {
      slug: {
        startsWith: THEMED_WEEK_PREFIX,
      },
    },
  });
}

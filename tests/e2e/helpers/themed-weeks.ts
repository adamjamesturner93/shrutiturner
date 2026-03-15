import { db } from "@/lib/db";

const E2E_THEMED_WEEK_PREFIX = "e2e-themed-week-";

export function makeE2eThemedWeekSlug(label: string) {
  return `${E2E_THEMED_WEEK_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function cleanupE2eThemedWeeks() {
  await db.themedWeek.deleteMany({
    where: {
      slug: {
        startsWith: E2E_THEMED_WEEK_PREFIX,
      },
    },
  });
}

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
  const slug = makeE2eThemedWeekSlug(input.label);

  await db.themedWeek.create({
    data: {
      slug,
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

  return slug;
}

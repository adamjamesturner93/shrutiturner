import "server-only";
import { db } from "@/lib/db";
import { programmeNow } from "./clock";
import { publicAvailability, publiclyVisible, representative } from "./presentation";

export const catalogueDefaults = {
  intro:
    "Build strength, movement and confidence, with practical guidance and support along the way.",
  empty:
    "I run short programmes throughout the year, each focused on a particular aspect of building strength, movement or confidence.",
};
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
export async function getPublicProgrammes(previewId?: string) {
  const now = programmeNow();
  const rows = await db.smallGroupProgramme.findMany({
    where: {
      definitionId: { not: null },
      ...(previewId ? { id: previewId } : { publicVisibility: { in: ["coming_soon", "listed"] } }),
    },
    select: {
      id: true,
      runSlug: true,
      definition: { select: { id: true, slug: true, title: true } },
      publicVisibility: true,
      publicImageUrl: true,
      publicImageAlt: true,
      subtitle: true,
      shortDescription: true,
      whoItsForJson: true,
      weekByWeekJson: true,
      salesCopy: true,
      equipment: true,
      refundWording: true,
      durationWeeks: true,
      startDate: true,
      timezone: true,
      cohortState: true,
      confirmedAt: true,
      liveCoachingEndsAt: true,
      structuredProgrammeEndsAt: true,
      followUpAccessEndsAt: true,
      communityOpenAt: true,
      enrolmentOpen: true,
      enrolmentClosesAt: true,
      salePricePence: true,
      maximumParticipants: true,
      minimumParticipants: true,
      confirmationDeadline: true,
      agreementVersion: true,
      sessions: {
        select: { id: true, title: true, startsAt: true, endsAt: true },
        orderBy: { startsAt: "asc" },
      },
      _count: {
        select: {
          enrollments: {
            where: {
              OR: [
                { status: "active" },
                { status: "pending_payment", paymentWindowExpiresAt: { gt: now } },
              ],
            },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
  return rows
    .filter((c) => previewId || publiclyVisible(c, now))
    .map((c) => {
      const availability = publicAvailability(
        c,
        now,
        Boolean(c.maximumParticipants && c._count.enrollments >= c.maximumParticipants)
      );
      const teaser = c.publicVisibility === "coming_soon" && !previewId;
      return {
        id: c.id,
        runSlug: c.runSlug,
        programmeId: c.definition!.id,
        slug: c.definition!.slug,
        title: c.definition!.title,
        subtitle: c.subtitle,
        summary: c.shortDescription,
        image: c.publicImageUrl,
        imageAlt: c.publicImageAlt,
        suitability: strings(c.whoItsForJson),
        journey: strings(c.weekByWeekJson),
        description: teaser ? c.shortDescription : c.salesCopy,
        durationWeeks: c.durationWeeks,
        timezone: c.timezone,
        startsAt: c.startDate?.toISOString() || null,
        endsAt: c.structuredProgrammeEndsAt
          ? new Date(c.structuredProgrammeEndsAt.getTime() - 1).toISOString()
          : null,
        accessEndsAt: c.followUpAccessEndsAt
          ? new Date(c.followUpAccessEndsAt.getTime() - 1).toISOString()
          : null,
        availability,
        bookable: !previewId && availability === "Bookings open",
        teaser,
        equipment: teaser ? null : c.equipment,
        refundWording: teaser ? null : c.refundWording,
        pricePence: teaser ? null : c.salePricePence,
        minimum: c.minimumParticipants,
        maximum: c.maximumParticipants,
        confirmationDeadline: c.confirmationDeadline?.toISOString(),
        agreementVersion: c.agreementVersion,
        sessions: teaser
          ? []
          : c.sessions.map((s) => ({
              id: s.id,
              title: s.title,
              startsAt: s.startsAt.toISOString(),
              endsAt: s.endsAt?.toISOString(),
            })),
      };
    });
}
export type PublicProgrammeCohort = Awaited<ReturnType<typeof getPublicProgrammes>>[number];
export async function getProgrammeCatalogue() {
  const [cohorts, settings] = await Promise.all([
    getPublicProgrammes(),
    db.platformSetting.findUnique({
      where: { id: "default" },
      select: { programmeCatalogueIntro: true, programmeCatalogueEmpty: true },
    }),
  ]);
  const groups = new Map<string, PublicProgrammeCohort[]>();
  for (const c of cohorts) groups.set(c.programmeId, [...(groups.get(c.programmeId) || []), c]);
  return {
    intro: settings?.programmeCatalogueIntro || catalogueDefaults.intro,
    empty: settings?.programmeCatalogueEmpty || catalogueDefaults.empty,
    programmes: [...groups.values()]
      .map((group) => representative(group, programmeNow()))
      .filter((c): c is PublicProgrammeCohort => Boolean(c)),
  };
}

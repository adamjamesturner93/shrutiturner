import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRetreatVenues } from "@/lib/content/public-content";
import { createRetreatExperience, getRetreatExperience } from "@/lib/retreats/experience-service";
import { getRetreatFormat } from "@/lib/retreats/format-service";
import { createAdminRetreatDate } from "@/lib/retreats/service";
import { getLegacyRetreatType, getRetreatEventCapabilities } from "@/lib/retreats/event-capabilities";
import { retreatExperienceContentSchema } from "@/lib/retreats/experience-schema";

export const createEventDraftSchema = z.object({
  requestKey: z.string().uuid(),
  experienceId: z.string().min(1).optional(),
  formatPresetId: z.string().min(1).optional(),
  content: retreatExperienceContentSchema.optional(),
  venueContentfulId: z.string().min(1).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  pricePence: z.number().int().min(0).optional(),
  paymentPolicy: z.enum(["deposit", "full_payment"]).optional(),
});

export async function createEventDraft(actorUserId: string, raw: unknown) {
  const input = createEventDraftSchema.parse(raw);
  if (Boolean(input.experienceId) === Boolean(input.content)) throw new Error("CHOOSE_NEW_OR_EXISTING_PAGE");
  const key = `${actorUserId}:${input.requestKey}`;
  const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  async function previousResult() {
    const previous = await db.adminEventCreation.findUnique({ where: { key } });
    if (!previous) return null;
    if (previous.requestHash !== requestHash) throw new Error("CREATION_REQUEST_CONFLICT");
    return { id: previous.dateId };
  }
  const previous = await previousResult();
  if (previous) return previous;
  // Resolve external editorial data before opening the database transaction.
  const venue = input.venueContentfulId
    ? (await getRetreatVenues()).find((row) => row.id === input.venueContentfulId)
    : null;
  if (input.venueContentfulId && !venue) throw new Error("RETREAT_VENUE_REQUIRED");
  try {
    return await db.$transaction(async (tx) => {
      const existing = input.experienceId ? await getRetreatExperience(input.experienceId, tx) : null;
      if (input.experienceId && !existing) throw new Error("EXPERIENCE_NOT_FOUND");
      const formatId = input.formatPresetId || existing?.formatPresetId;
      const format = formatId ? await getRetreatFormat(formatId, tx) : null;
      if (!format?.active) throw new Error("FORMAT_NOT_FOUND");
      const experience = existing || await createRetreatExperience({ title: input.content!.title, content: input.content, formatPresetId: format.id }, tx);
      const capabilities = getRetreatEventCapabilities(experience.eventKind);
      const defaults = format.operationalDefaults;
      const profile = capabilities.requiresVenue && venue ? await tx.retreatVenueProfile.upsert({
        where: { contentfulVenueId: venue.id },
        create: { contentfulVenueId: venue.id, venueSlug: venue.slug, name: venue.name },
        update: {},
      }) : null;
      const startsAt = new Date(input.startsAt);
      const endsAt = input.endsAt ? new Date(input.endsAt) : defaults.durationMinutes ? new Date(startsAt.getTime() + defaults.durationMinutes * 60000) : null;
      if (!endsAt) throw new Error("END_TIME_REQUIRED");
      const result = await createAdminRetreatDate({
        experienceId: experience.id, formatPresetId: format.id,
        retreatSlug: experience.slug, title: experience.title, eventKind: experience.eventKind,
        retreatType: getLegacyRetreatType(experience.eventKind),
        location: capabilities.usesLiveRoom ? "Online" : venue?.displayLocation || venue?.name || "Venue to be confirmed",
        venueProfileId: capabilities.requiresVenue ? profile?.id || defaults.venueProfileId : null,
        startsAt, endsAt, capacity: input.capacity ?? defaults.capacity, pricePence: input.pricePence ?? defaults.pricePence,
        paymentPolicy: capabilities.paymentPolicy === "full_payment" ? "full_payment" : input.paymentPolicy ?? defaults.paymentPolicy,
      }, tx);
      await tx.adminEventCreation.create({ data: { key, actorUserId, requestHash, dateId: result.id } });
      return { id: result.id };
    }, { timeout: 20000 });
  } catch (error) {
    // Concurrent duplicate requests roll back their page/date writes before returning the winner.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" || error instanceof Error && error.message === "EXPERIENCE_SLUG_TAKEN") {
      const won = await previousResult();
      if (won) return won;
    }
    throw error;
  }
}

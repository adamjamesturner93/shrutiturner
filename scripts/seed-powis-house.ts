import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "../contentful/scripts/env.ts";
import { powisHouseRetreat as retreat } from "../contentful/seed/powis-house.ts";
import { retreats } from "../src/data/retreat-data.ts";
import { PUBLIC_CONTENT_MODELS } from "../contentful/migrations/001-public-content-models.ts";

const apply = process.argv.includes("--apply");
const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const connectionString = process.env.DATABASE_URL;
if (environmentId !== "sandbox") throw new Error("This seed requires Contentful sandbox.");
if (
  !connectionString ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname)
) {
  throw new Error("This seed requires a local DATABASE_URL.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const client = createClient({ accessToken: managementToken }, { type: "legacy" });

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);
  const locales = await environment.getLocales();
  const locale = locales.items.find((item) => item.default)?.code;
  if (!locale) throw new Error("Missing default Contentful locale.");
  const existingDates = await prisma.retreatDate.findMany({
    where: { retreatSlug: retreat.slug },
    select: { id: true, externalDateId: true, status: true },
  });
  const existingVenues = await environment.getEntries({
    content_type: "retreatVenue",
    "fields.slug": retreat.venue.slug,
  });
  const existingTemplates = await environment.getEntries({
    content_type: "retreatTemplate",
    "fields.slug": retreat.slug,
  });
  const templateModel = await environment.getContentType("retreatTemplate");
  await environment.getContentType("retreatScheduleDay");
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        environmentId,
        databaseHost: new URL(connectionString!).hostname,
        slug: retreat.slug,
        existingDates,
        venueId: existingVenues.items[0]?.sys.id,
        templateId: existingTemplates.items[0]?.sys.id,
      },
      null,
      2
    )
  );
  if (!apply) return;

  // Add only the requested field, preserving other sandbox model customizations.
  if (!templateModel.fields.some((field) => field.id === "atmosphereDescription")) {
    const field = PUBLIC_CONTENT_MODELS.find(
      (model) => model.id === "retreatTemplate"
    )!.fields.find((candidate) => candidate.id === "atmosphereDescription")!;
    templateModel.fields.push({
      id: field.id,
      name: field.name,
      type: field.type,
      required: false,
      localized: false,
      disabled: false,
      omitted: false,
    });
    await (await templateModel.update()).publish();
  }

  const link = (id: string) => ({ sys: { type: "Link", linkType: "Entry", id } });
  async function fillAndPublish(
    contentType: string,
    id: string,
    values: Record<string, unknown>,
    existing?: (typeof existingVenues.items)[number]
  ) {
    const fields = existing?.fields || {};
    for (const [key, value] of Object.entries(values)) {
      // Re-running the seed must preserve edits made during manual testing.
      if (fields[key]?.[locale!] === undefined) fields[key] = { ...fields[key], [locale!]: value };
    }
    const entry = existing
      ? await Object.assign(existing, { fields }).update()
      : await environment.createEntryWithId(contentType, id, { fields });
    return entry.publish();
  }

  const venue = await fillAndPublish(
    "retreatVenue",
    "seed-powis-house-venue",
    { ...retreat.venue },
    existingVenues.items[0]
  );
  const scheduleDays = [];
  for (const [index, day] of retreat.schedule.entries()) {
    const id = `${retreat.slug}-schedule-day-${index + 1}`;
    const existing = await environment.getEntries({ "sys.id": id });
    const entry = await fillAndPublish(
      "retreatScheduleDay",
      id,
      { title: day.title, activities: day.activities.join("\n") },
      existing.items[0]
    );
    scheduleDays.push(link(entry.sys.id));
  }
  const template = await fillAndPublish(
    "retreatTemplate",
    "seed-powis-house-retreat",
    {
      slug: retreat.slug,
      title: retreat.title,
      subtitle: retreat.subtitle,
      shortDescription: retreat.shortDescription,
      fullDescription: retreat.fullDescription,
      atmosphereDescription: retreat.atmosphereDescription,
      experienceType: retreat.experienceType,
      deliveryMode: retreat.deliveryMode,
      durationLabel: retreat.durationLabel,
      audienceDescription: retreat.audienceDescription,
      experienceLevel: retreat.experienceLevel,
      heroImageUrl: retreat.imageUrl,
      suitableFor: retreat.suitableFor,
      included: retreat.included,
      notIncluded: retreat.notIncluded,
      whatToBring: retreat.whatToBring,
      foodAndDrinkDescription: retreat.foodAndDrinkDescription,
      accommodationDescription: retreat.accommodation,
      venue: link(venue.sys.id),
      scheduleDays,
    },
    existingTemplates.items[0]
  );

  // Move the existing workshop's hardcoded atmosphere into its CMS entry too.
  const workshop = retreats.find((item) => item.slug === "the-middle-ground")!;
  const workshops = await environment.getEntries({
    content_type: "retreatTemplate",
    "fields.slug": workshop.slug,
  });
  const workshopEntry = workshops.items[0];
  if (workshopEntry && !workshopEntry.fields.atmosphereDescription?.[locale]) {
    const publish = workshopEntry.isPublished() && !workshopEntry.isUpdated();
    workshopEntry.fields.atmosphereDescription = { [locale]: workshop.atmosphereDescription };
    const updated = await workshopEntry.update();
    if (publish) await updated.publish();
    console.log(`Added workshop atmosphere (${publish ? "published" : "draft preserved"}).`);
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.retreatVenueProfile.upsert({
      where: { venueSlug: retreat.venue.slug },
      update: {},
      create: {
        contentfulVenueId: venue.sys.id,
        venueSlug: retreat.venue.slug,
        name: retreat.venue.name,
      },
    });
    for (const date of retreat.dates) {
      const startsAt = new Date(date.startDateTime!);
      const balanceDueAt = new Date(
        startsAt.getTime() - date.balanceDueDaysBeforeStart! * 86400000
      );
      const dbDate = await tx.retreatDate.upsert({
        where: { externalDateId: date.id },
        update: {},
        create: {
          externalDateId: date.id,
          retreatSlug: retreat.slug,
          retreatTitleSnapshot: retreat.title,
          retreatLocationSnapshot: retreat.location,
          retreatType: "in_person",
          timezone: "Europe/London",
          startsAt,
          endsAt: new Date(date.endDateTime!),
          capacity: date.totalSpaces,
          status: "open",
          currency: retreat.currency,
          pricePence: 42500,
          depositAmountPence: 8500,
          balanceDueAt,
          venueProfileId: profile.id,
          accommodationConfiguredAt: new Date(),
          paymentPlanSnapshotJson: {
            depositType: "percentage",
            depositPercentageBasisPoints: 2000,
            balanceDueDaysBeforeStart: 56,
          },
        },
      });
      for (const option of date.roomOptions) {
        const shared = option.bookingUnit === "bed_space";
        const quantity = shared ? option.physicalRoomCount! : option.inventoryQuantity;
        const group = await tx.retreatVenueRoomGroup.upsert({
          where: { id: `seed-powis-group-${option.slug}` },
          update: {},
          create: {
            id: `seed-powis-group-${option.slug}`,
            venueProfileId: profile.id,
            name: option.label,
            description: option.description,
            quantity,
            capacityPerRoom: 2,
            bedSetup: shared ? "fixed_twin" : "fixed_double",
            allowShared: shared,
            privateGuestCountsJson: option.allowedGuestCounts || [],
            displayOrder: option.displayOrder,
          },
        });
        const pool = await tx.retreatInventoryPool.upsert({
          where: { id: `seed-powis-pool-${date.id}-${option.slug}` },
          update: {},
          create: {
            id: `seed-powis-pool-${date.id}-${option.slug}`,
            retreatDateId: dbDate.id,
            inventoryType: option.inventoryType,
            name: option.label,
            totalQuantity: option.inventoryQuantity,
          },
        });
        const room = await tx.retreatRoomOption.upsert({
          where: {
            retreatDateId_externalRoomOptionId: {
              retreatDateId: dbDate.id,
              externalRoomOptionId: option.id,
            },
          },
          update: {},
          create: {
            retreatDateId: dbDate.id,
            externalRoomOptionId: option.id,
            venueRoomGroupId: group.id,
            inventoryPoolId: pool.id,
            label: option.label,
            description: option.description,
            roomType: option.type,
            bookingUnit: option.bookingUnit,
            guestsIncluded: option.guestsIncluded,
            guestCountPerUnit: option.guestCountPerUnit,
            physicalRoomCount: quantity,
            bedsPerPhysicalRoom: shared ? 2 : 1,
            allowedGuestCountsJson: option.allowedGuestCounts || [1],
            capacity: option.capacity,
            availableSpots: option.capacity,
            pricePence: option.normalPricePence,
            pricePerPersonPence: shared ? option.normalPricePence : null,
            roomCount: quantity,
            depositAmountPence: option.depositPence,
            displayOrder: option.displayOrder,
          },
        });
        for (const rate of option.ratePlans) {
          await tx.retreatRatePlan.upsert({
            where: {
              roomOptionId_guestCount: { roomOptionId: room.id, guestCount: rate.guestCount },
            },
            update: {},
            create: {
              roomOptionId: room.id,
              guestCount: rate.guestCount,
              totalPricePence: rate.totalPricePence,
              earlyBirdPricePence: rate.earlyBirdPricePence,
              earlyBirdEndsAt: new Date(rate.earlyBirdEndsAt!),
              currency: retreat.currency,
            },
          });
        }
        for (let index = 1; index <= quantity; index++) {
          const label = `${option.label} ${index}`;
          await tx.retreatVenueRoomTemplate.upsert({
            where: { roomGroupId_label: { roomGroupId: group.id, label } },
            update: {},
            create: { roomGroupId: group.id, label, displayOrder: index },
          });
          await tx.retreatRoomUnit.upsert({
            where: {
              retreatDateId_roomOptionId_label: {
                retreatDateId: dbDate.id,
                roomOptionId: room.id,
                label,
              },
            },
            update: {},
            create: {
              retreatDateId: dbDate.id,
              roomOptionId: room.id,
              inventoryPoolId: pool.id,
              label,
              capacityUnits: shared ? 2 : 1,
            },
          });
        }
      }
      await tx.retreatDepositRule.upsert({
        where: { id: `seed-powis-deposit-${date.id}` },
        update: {},
        create: {
          id: `seed-powis-deposit-${date.id}`,
          retreatDateId: dbDate.id,
          depositType: "percentage",
          depositPercentageBasisPoints: 2000,
          balanceDueDaysBeforeStart: 56,
          balanceDueAt,
        },
      });
    }
  });
  console.log(
    JSON.stringify(
      {
        url: `/retreats/${retreat.slug}`,
        venueEntryId: venue.sys.id,
        templateEntryId: template.sys.id,
        dates: await prisma.retreatDate.findMany({
          where: { retreatSlug: retreat.slug },
          select: {
            id: true,
            status: true,
            _count: { select: { roomOptions: true, roomUnits: true, inventoryPools: true } },
          },
        }),
      },
      null,
      2
    )
  );
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Powis House seed failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

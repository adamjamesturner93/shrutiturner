import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { spawnSync } from "node:child_process";
import { powisHouseRetreat } from "../contentful/seed/powis-house.ts";

// Local fixtures only. Keep existing bookings and never write to Contentful.
const url = process.env.DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("This seed requires a local DATABASE_URL");
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))
  throw new Error("Booking review fixtures require Stripe test mode");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const groups = [
  {
    key: "king-private",
    name: "King (Private Bathroom)",
    description:
      "King bed, available for one or two people sharing, with private bathroom along the corridor.",
    bedSetup: "fixed_double",
    shared: false,
    rooms: ["Green Room"],
  },
  {
    key: "convertible-private",
    name: "King or Twin (Private Bathroom)",
    description:
      "King bed or two singles, available for one or two people sharing, with private bathroom or showerroom along the corridor.",
    bedSetup: "convertible_double_twin",
    shared: true,
    rooms: ["Grey Room", "Yellow Room"],
  },
  {
    key: "twin-shared",
    name: "Twin Room (Shared Bathroom)",
    description:
      "Twin room with two single beds, and shared bathroom or showerroom along the corridor.",
    bedSetup: "fixed_twin",
    shared: true,
    rooms: ["Beige Room"],
  },
  {
    key: "convertible-shared",
    name: "King or Twin Room (Shared Bathroom)",
    description: "King bed or two singles, with shared bathroom or showerroom along the corridor.",
    bedSetup: "convertible_double_twin",
    shared: true,
    rooms: ["Blue Room"],
  },
];
const retreatId = "demo-powis-house-june-2027";
const retreatSlug = "powis-house-weekend";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

try {
  await db.$transaction(
    async (tx) => {
      for (const workshop of [
        {
          slug: "the-middle-ground",
          title: "The Middle Ground",
          startsAt: "2026-10-04T08:30:00Z",
          endsAt: "2026-10-04T11:00:00Z",
        },
        {
          slug: "pause-and-restore",
          title: "Pause & Restore",
          startsAt: "2026-12-13T09:30:00Z",
          endsAt: "2026-12-13T12:00:00Z",
        },
      ]) {
        const content = {
          schemaVersion: 1,
          title: workshop.title,
          shortDescription: "An online workshop with Shruti, hosted live through this website.",
          fullDescription:
            "Take time for guided movement, practical learning and reflection with Shruti. This local preview uses sample workshop copy.",
          scheduleMarkdown:
            "9:30am — Welcome and guided practice\n11:00am — Reflection and questions\n12:00pm — Close",
          durationLabel: "2½ hours",
        };
        const experience = await tx.retreatExperience.upsert({
          where: { slug: workshop.slug },
          create: {
            slug: workshop.slug,
            title: workshop.title,
            eventKind: "online_workshop",
            draftContentJson: content,
            publishedContentJson: content,
            publishedRevision: 1,
            publishedAt: new Date(),
          },
          update: {
            eventKind: "online_workshop",
            ...(workshop.slug === "pause-and-restore"
              ? { draftContentJson: content, publishedContentJson: content }
              : {}),
          },
        });
        const existing = await tx.retreatDate.findFirst({
          where: { retreatSlug: workshop.slug, startsAt: new Date(workshop.startsAt) },
        });
        const date = existing
          ? await tx.retreatDate.update({
              where: { id: existing.id },
              data: {
                eventKind: "online_workshop",
                retreatType: "online",
                retreatLocationSnapshot: "Online (live through this website)",
                venueProfileId: null,
                experienceId: experience.id,
                accommodationConfiguredAt: new Date(),
              },
            })
          : await tx.retreatDate.create({
              data: {
                externalDateId: `demo-${workshop.slug}`,
                retreatSlug: workshop.slug,
                retreatTitleSnapshot: workshop.title,
                retreatLocationSnapshot: "Online (live through this website)",
                eventKind: "online_workshop",
                retreatType: "online",
                experienceId: experience.id,
                startsAt: new Date(workshop.startsAt),
                endsAt: new Date(workshop.endsAt),
                capacity: 12,
                pricePence: 3500,
                depositAmountPence: 3500,
                status: "open",
                accommodationConfiguredAt: new Date(),
              },
            });
        if ((await tx.retreatRoomOption.count({ where: { retreatDateId: date.id } })) === 0) {
          const pool = await tx.retreatInventoryPool.create({
            data: {
              retreatDateId: date.id,
              inventoryType: "online_live_place",
              name: "Workshop places",
              totalQuantity: 12,
            },
          });
          await tx.retreatRoomOption.create({
            data: {
              retreatDateId: date.id,
              externalRoomOptionId: "standard",
              inventoryPoolId: pool.id,
              label: "Workshop place",
              roomType: "virtual",
              bookingUnit: "online_live_place",
              capacity: 12,
              availableSpots: 12,
              pricePence: 3500,
              allowedGuestCountsJson: [1],
              ratePlans: { create: { guestCount: 1, totalPricePence: 3500 } },
            },
          });
        }
        await tx.retreatRoomOption.updateMany({
          where: { retreatDateId: date.id },
          data: { bookingUnit: "online_live_place", roomType: "virtual", guestCountPerUnit: 1 },
        });
        await tx.retreatInventoryPool.updateMany({
          where: { retreatDateId: date.id },
          data: { inventoryType: "online_live_place" },
        });
        if (
          (await tx.retreatDepositRule.count({
            where: { retreatDateId: date.id, active: true },
          })) === 0
        )
          await tx.retreatDepositRule.create({
            data: { retreatDateId: date.id, depositType: "full_payment" },
          });
      }
      const venue = await tx.retreatVenueProfile.upsert({
        where: { venueSlug: "powis-house" },
        create: {
          venueSlug: "powis-house",
          contentfulVenueId: "2jneJ0h2etyNHFxRQEiKsa",
          name: "Powis House",
        },
        update: {},
      });
      const groupIds = groups.map((g) => `demo-powis-${g.key}`);
      await tx.retreatVenueRoomGroup.updateMany({
        where: { venueProfileId: venue.id, id: { notIn: groupIds } },
        data: { active: false },
      });
      for (const [index, group] of groups.entries()) {
        const id = groupIds[index];
        const data = {
          name: group.name,
          description: group.description,
          quantity: group.rooms.length,
          capacityPerRoom: 2,
          bedSetup: group.bedSetup,
          allowShared: group.shared,
          privateGuestCountsJson: [1, 2],
          displayOrder: index,
          active: true,
        };
        await tx.retreatVenueRoomGroup.upsert({
          where: { id },
          create: { id, venueProfileId: venue.id, ...data },
          update: data,
        });
        for (const [displayOrder, label] of group.rooms.entries())
          await tx.retreatVenueRoomTemplate.upsert({
            where: { roomGroupId_label: { roomGroupId: id, label } },
            create: { roomGroupId: id, label, displayOrder },
            update: {},
          });
      }
      const content = {
        schemaVersion: 1,
        title: "Pause, Move, Breathe — Powis House",
        subtitle: "A weekend of movement and rest in Stirling",
        shortDescription: powisHouseRetreat.shortDescription,
        fullDescription: `${powisHouseRetreat.fullDescription}\n\nLocal preview: dates, prices and inclusions are mock details for booking tests.`,
        atmosphereDescription: powisHouseRetreat.atmosphereDescription,
        scheduleMarkdown:
          "Friday: arrive from 4pm, settle in, gentle movement and dinner.\nSaturday: morning yoga, breakfast, free time, afternoon practice and dinner.\nSunday: morning practice, brunch and departure at 2pm.",
        durationLabel: "3 days / 2 nights",
        included: [
          "Two nights at Powis House",
          "Guided yoga and movement sessions",
          "Shared meals from Friday dinner to Sunday brunch",
        ],
        notIncluded: ["Travel to and from the venue"],
        whatToBring: ["Comfortable movement clothes", "A yoga mat", "Outdoor layers"],
        image: {
          url: "/images/shruti-coaching.jpeg",
          alt: "Shruti walking by the sea",
          focalPoint: { x: 45, y: 45 },
        },
      };
      const experience = await tx.retreatExperience.upsert({
        where: { slug: retreatSlug },
        create: {
          slug: retreatSlug,
          title: content.title,
          eventKind: "residential_retreat",
          draftContentJson: json(content),
          publishedContentJson: json(content),
          publishedAt: new Date(),
          publishedRevision: 1,
        },
        update: {},
      });
      const existing = await tx.retreatDate.findUnique({ where: { id: retreatId } });
      if (!existing) {
        await tx.retreatDate.create({
          data: {
            id: retreatId,
            externalDateId: retreatId,
            retreatSlug,
            retreatTitleSnapshot: content.title,
            retreatLocationSnapshot: "Powis House, Stirling",
            eventKind: "residential_retreat",
            retreatType: "in_person",
            experienceId: experience.id,
            venueProfileId: venue.id,
            startsAt: new Date("2027-06-11T15:00:00Z"),
            endsAt: new Date("2027-06-13T13:00:00Z"),
            capacity: 10,
            pricePence: 45000,
            depositAmountPence: 9000,
            balanceDueAt: new Date("2027-04-16T15:00:00Z"),
            status: "open",
            payInFullDiscountEnabled: false,
            accommodationConfiguredAt: new Date(),
            paymentPlanSnapshotJson: {
              depositType: "percentage",
              depositPercentageBasisPoints: 2000,
              balanceDueDaysBeforeStart: 56,
            },
          },
        });
        for (const [index, group] of groups.entries()) {
          const quantity = group.rooms.length * 2;
          const pool = await tx.retreatInventoryPool.create({
            data: {
              retreatDateId: retreatId,
              inventoryType: "bed_space",
              name: group.name,
              totalQuantity: quantity,
            },
          });
          if (group.shared)
            await tx.retreatRoomOption.create({
              data: {
                retreatDateId: retreatId,
                externalRoomOptionId: `${group.key}-shared`,
                venueRoomGroupId: groupIds[index],
                inventoryPoolId: pool.id,
                label: `${group.name} — Shared place`,
                description: group.description,
                roomType: "shared_twin",
                bookingUnit: "bed_space",
                inventoryUnitsPerBooking: 1,
                guestsIncluded: 1,
                guestCountPerUnit: 1,
                allowedGuestCountsJson: [1],
                capacity: quantity,
                availableSpots: quantity,
                pricePence: 45000,
                pricePerPersonPence: 45000,
                displayOrder: index * 2,
                ratePlans: { create: { guestCount: 1, totalPricePence: 45000 } },
              },
            });
          const privateRoom = await tx.retreatRoomOption.create({
            data: {
              retreatDateId: retreatId,
              externalRoomOptionId: `${group.key}-private`,
              venueRoomGroupId: groupIds[index],
              inventoryPoolId: pool.id,
              label: `${group.name} — Private room`,
              description: group.description,
              roomType: "private",
              bookingUnit: "whole_room",
              inventoryUnitsPerBooking: 2,
              guestsIncluded: 1,
              allowedGuestCountsJson: [1, 2],
              capacity: group.rooms.length,
              availableSpots: group.rooms.length,
              roomCount: group.rooms.length,
              pricePence: 60000,
              displayOrder: index * 2 + 1,
              ratePlans: {
                create: [
                  { guestCount: 1, totalPricePence: 60000 },
                  { guestCount: 2, totalPricePence: 90000 },
                ],
              },
            },
          });
          for (const label of group.rooms)
            await tx.retreatRoomUnit.create({
              data: {
                retreatDateId: retreatId,
                roomOptionId: privateRoom.id,
                inventoryPoolId: pool.id,
                label,
                capacityUnits: 2,
              },
            });
        }
        await tx.retreatDepositRule.create({
          data: {
            retreatDateId: retreatId,
            depositType: "percentage",
            depositPercentageBasisPoints: 2000,
            balanceDueDaysBeforeStart: 56,
            balanceDueAt: new Date("2027-04-16T15:00:00Z"),
          },
        });
      }
    },
    { timeout: 30000 }
  );
  console.log(
    "Online workshops corrected. Powis House: /retreats/powis-house-weekend (11–13 June 2027, five rooms, ten guests)."
  );
} finally {
  await db.$disconnect();
}
const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "scripts/seed-programme-demos.ts",
    "--only=demo-rebuilding-your-strength",
  ],
  { stdio: "inherit", env: process.env }
);
if (result.status !== 0) process.exit(result.status ?? 1);

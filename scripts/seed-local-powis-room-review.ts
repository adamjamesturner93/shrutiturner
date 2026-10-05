import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
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
    bathroomType: "private",
    shared: false,
    rooms: ["Green Room"],
  },
  {
    key: "convertible-private",
    name: "King or Twin (Private Bathroom)",
    description:
      "King bed or two singles, available for one or two people sharing, with private bathroom or showerroom along the corridor.",
    bedSetup: "convertible_double_twin",
    bathroomType: "private",
    shared: true,
    rooms: ["Grey Room", "Yellow Room"],
  },
  {
    key: "twin-shared",
    name: "Twin Room (Shared Bathroom)",
    description:
      "Twin room with two single beds, and shared bathroom or showerroom along the corridor.",
    bedSetup: "fixed_twin",
    bathroomType: "shared",
    shared: true,
    rooms: ["Beige Room"],
  },
  {
    key: "convertible-shared",
    name: "King or Twin Room (Shared Bathroom)",
    description: "King bed or two singles, with shared bathroom or showerroom along the corridor.",
    bedSetup: "convertible_double_twin",
    bathroomType: "shared",
    shared: true,
    rooms: ["Blue Room"],
  },
];
const retreatId = "local-powis-room-review-june-2027";
const retreatSlug = "local-powis-room-review";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

try {
  await db.$transaction(
    async (tx) => {
      const venue = await tx.retreatVenueProfile.upsert({
        where: { venueSlug: "powis-house" },
        create: {
          venueSlug: "powis-house",
          contentfulVenueId: "2jneJ0h2etyNHFxRQEiKsa",
          name: "Powis House",
        },
        update: {},
      });
      const groupIds = groups.map((g) => `local-powis-review-${g.key}`);
      for (const [index, group] of groups.entries()) {
        const id = groupIds[index];
        const data = {
          name: group.name,
          description: group.description,
          quantity: group.rooms.length,
          capacityPerRoom: 2,
          bedSetup: group.bedSetup,
          bathroomType: group.bathroomType,
          allowShared: group.shared,
          privateGuestCountsJson: [1, 2],
          displayOrder: index,
          active: true,
        };
        await tx.retreatVenueRoomGroup.upsert({
          where: { id },
          create: { id, venueProfileId: venue.id, ...data },
          update: { ...data, venueProfileId: venue.id },
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
        title: "Powis House — room selection test",
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
      if (existing) {
        await tx.retreatDate.update({
          where: { id: retreatId },
          data: { venueProfileId: venue.id },
        });
      }
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
            depositAmountPence: 11250,
            balanceDueAt: new Date("2027-04-16T15:00:00Z"),
            status: "open",
            payInFullDiscountEnabled: false,
            accommodationConfiguredAt: new Date(),
            paymentPlanSnapshotJson: {
              depositType: "percentage",
              depositPercentageBasisPoints: 2500,
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
                pricePence: group.bathroomType === "private" ? 45000 : 42500,
                pricePerPersonPence: group.bathroomType === "private" ? 45000 : 42500,
                displayOrder: index * 2,
                ratePlans: {
                  create: {
                    guestCount: 1,
                    totalPricePence: group.bathroomType === "private" ? 45000 : 42500,
                  },
                },
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
              pricePence: group.bathroomType === "private" ? 55000 : 52500,
              displayOrder: index * 2 + 1,
              ratePlans: {
                create: [
                  {
                    guestCount: 1,
                    totalPricePence: group.bathroomType === "private" ? 55000 : 52500,
                  },
                  {
                    guestCount: 2,
                    totalPricePence: group.bathroomType === "private" ? 90000 : 85000,
                  },
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
            depositPercentageBasisPoints: 2500,
            balanceDueDaysBeforeStart: 56,
            balanceDueAt: new Date("2027-04-16T15:00:00Z"),
          },
        });
      }
    },
    { timeout: 30000 }
  );
  console.log(
    "Local Powis House room review: /retreats/local-powis-room-review (11–13 June 2027, five rooms, ten guests)."
  );
} finally {
  await db.$disconnect();
}

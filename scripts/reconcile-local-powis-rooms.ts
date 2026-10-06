import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import {
  PrismaClient,
  Prisma,
  type RetreatVenueRoomGroup,
  type RetreatRoomOption,
  type RetreatRatePlan,
  type RetreatDepositRule,
  type RetreatVenueRoomTemplate,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const apply = process.argv.includes("--apply");
const env = parseEnv(readFileSync(".env", "utf8"));
if (
  !env.DATABASE_URL ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(env.DATABASE_URL).hostname)
)
  throw new Error("Local database required.");
const source = JSON.parse(readFileSync("/tmp/powis-production-configuration.json", "utf8")) as {
  date: { id: string; capacity: number };
  groups: RetreatVenueRoomGroup[];
  RetreatRoomOption: RetreatRoomOption[];
  RetreatRatePlan: RetreatRatePlan[];
  RetreatDepositRule: RetreatDepositRule[];
  RetreatVenueRoomTemplate: RetreatVenueRoomTemplate[];
};
if (source.date.id !== "cmu887mpm000004jqm7l77eze" || source.groups.length !== 4)
  throw new Error("Unexpected production source.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
try {
  await db.$transaction(
    async (tx) => {
      const venue = await tx.retreatVenueProfile.findUniqueOrThrow({
        where: { venueSlug: "powis-house" },
        include: { roomGroups: { include: { roomTemplates: true } } },
      });
      const date = await tx.retreatDate.findUniqueOrThrow({
        where: { id: "local-powis-room-review-june-2027" },
        include: {
          roomOptions: { include: { ratePlans: true } },
          roomUnits: true,
          depositRules: true,
        },
      });
      const backup = `/tmp/local-powis-before-reconcile-${Date.now()}.json`;
      writeFileSync(backup, JSON.stringify({ venue, date }, null, 2), { mode: 0o600, flag: "wx" });
      const keep: string[] = [];
      for (const group of source.groups) {
        const target = venue.roomGroups.find(
          (g) =>
            g.id.startsWith("local-powis-review-") &&
            g.bedSetup === group.bedSetup &&
            g.bathroomType === group.bathroomType
        );
        if (!target) throw new Error(`Missing local group for ${group.name}`);
        keep.push(target.id);
        const sourceNames = source.RetreatVenueRoomTemplate.filter(
          (t) => t.roomGroupId === group.id
        )
          .map((t) => t.label)
          .sort();
        if (
          JSON.stringify(target.roomTemplates.map((t) => t.label).sort()) !==
          JSON.stringify(sourceNames)
        )
          throw new Error(`Room names differ: ${group.name}`);
        console.log(
          `${apply ? "Aligning" : "Would align"} ${group.name}: ${sourceNames.join(", ")}`
        );
        if (apply)
          await tx.retreatVenueRoomGroup.update({
            where: { id: target.id },
            data: {
              name: group.name,
              description: group.description,
              quantity: group.quantity,
              capacityPerRoom: group.capacityPerRoom,
              bathroomType: group.bathroomType,
              bedSetup: group.bedSetup,
              allowShared: group.allowShared,
              privateGuestCountsJson: group.privateGuestCountsJson as Prisma.InputJsonValue,
              displayOrder: group.displayOrder,
              active: true,
            },
          });
        for (const option of source.RetreatRoomOption.filter(
          (o) => o.venueRoomGroupId === group.id
        )) {
          const local = date.roomOptions.find(
            (o) => o.venueRoomGroupId === target.id && o.bookingUnit === option.bookingUnit
          );
          if (!local?.inventoryPoolId)
            throw new Error(`Missing local option or pool: ${option.label}`);
          const units = date.roomUnits.filter(
            (unit) => unit.inventoryPoolId === local.inventoryPoolId
          );
          if (
            units.length !== group.quantity ||
            units.some((unit) => unit.capacityUnits !== group.capacityPerRoom)
          )
            throw new Error(`Physical inventory mismatch: ${group.name}`);
          if (!apply) continue;
          await tx.retreatRoomOption.update({
            where: { id: local.id },
            data: {
              label: option.label,
              description: option.description,
              bookingUnit: option.bookingUnit,
              inventoryUnitsPerBooking: option.inventoryUnitsPerBooking,
              guestsIncluded: option.guestsIncluded,
              guestCountPerUnit: option.guestCountPerUnit,
              physicalRoomCount: option.physicalRoomCount,
              bedsPerPhysicalRoom: option.bedsPerPhysicalRoom,
              allowedGuestCountsJson: option.allowedGuestCountsJson as Prisma.InputJsonValue,
              capacity: option.capacity,
              pricePence: option.pricePence,
              pricePerPersonPence: option.pricePerPersonPence,
              roomCount: option.roomCount,
              depositAmountPence: option.depositAmountPence,
              active: option.active,
            },
          });
          const rates = source.RetreatRatePlan.filter(
            (r) => r.roomOptionId === option.id && r.active
          );
          for (const rate of rates)
            await tx.retreatRatePlan.upsert({
              where: {
                roomOptionId_guestCount: { roomOptionId: local.id, guestCount: rate.guestCount },
              },
              create: {
                roomOptionId: local.id,
                guestCount: rate.guestCount,
                totalPricePence: rate.totalPricePence,
                currency: rate.currency,
                earlyBirdPricePence: rate.earlyBirdPricePence,
                earlyBirdEndsAt: rate.earlyBirdEndsAt,
              },
              update: {
                totalPricePence: rate.totalPricePence,
                currency: rate.currency,
                earlyBirdPricePence: rate.earlyBirdPricePence,
                earlyBirdEndsAt: rate.earlyBirdEndsAt,
                active: true,
              },
            });
          await tx.retreatRatePlan.updateMany({
            where: {
              roomOptionId: local.id,
              guestCount: { notIn: rates.map((r) => r.guestCount) },
            },
            data: { active: false },
          });
        }
      }
      const retire = venue.roomGroups
        .filter((g) => !keep.includes(g.id) && g.active)
        .map((g) => g.id);
      console.log(JSON.stringify({ retireGroups: retire, retainGroups: keep, backup }));
      if (apply) {
        await tx.retreatVenueRoomGroup.updateMany({
          where: { id: { in: retire } },
          data: { active: false },
        });
        const sourceRule = source.RetreatDepositRule.find((r) => r.active);
        const localRule = date.depositRules.find((r) => r.active);
        if (!sourceRule || !localRule) throw new Error("Missing deposit rule.");
        await tx.retreatDepositRule.update({
          where: { id: localRule.id },
          data: {
            depositType: sourceRule.depositType,
            depositPercentageBasisPoints: sourceRule.depositPercentageBasisPoints,
            fixedDepositAmountPence: sourceRule.fixedDepositAmountPence,
            balanceDueAt: sourceRule.balanceDueAt,
            balanceDueDaysBeforeStart: sourceRule.balanceDueDaysBeforeStart,
          },
        });
      }
    },
    { timeout: 30000 }
  );
} finally {
  await db.$disconnect();
}

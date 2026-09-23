import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";

const include = {
  venueProfile: {
    include: {
      roomGroups: {
        orderBy: { id: "asc" as const },
        include: { roomTemplates: { orderBy: { displayOrder: "asc" as const } } },
      },
    },
  },
  roomOptions: {
    orderBy: { id: "asc" as const },
    include: {
      ratePlans: { orderBy: { guestCount: "asc" as const } },
      inventoryPool: true,
      _count: { select: { bookings: true, giftPurchases: true } },
    },
  },
  roomUnits: {
    orderBy: { id: "asc" as const },
    include: { _count: { select: { bookings: true } } },
  },
} satisfies Prisma.RetreatDateInclude;
type Snapshot = Prisma.RetreatDateGetPayload<{ include: typeof include }>;
type Group = NonNullable<Snapshot["venueProfile"]>["roomGroups"][number];
export type VenueSyncPrice = { key: string; label: string; guestCount: number };
export type VenueSyncPreview = {
  id: string;
  title: string;
  startsAt: string;
  revision: string;
  changes: string[];
  conflicts: string[];
  prices: VenueSyncPrice[];
};
const counts = (value: Prisma.JsonValue | null) =>
  Array.isArray(value)
    ? value.filter((x): x is number => typeof x === "number" && x > 0).sort((a, b) => a - b)
    : [];
function offerings(group: Group) {
  return [
    ...(group.allowShared
      ? [{ unit: "bed_space" as const, suffix: "Shared place", guests: [1] }]
      : []),
    ...(counts(group.privateGuestCountsJson).length
      ? [
          {
            unit: "whole_room" as const,
            suffix: "Private room",
            guests: counts(group.privateGuestCountsJson),
          },
        ]
      : []),
  ];
}
const priceKey = (group: string, unit: string, guests: number) => `${group}:${unit}:${guests}`;

export function buildVenueSyncPreview(date: Snapshot): VenueSyncPreview {
  const changes: string[] = [];
  const conflicts: string[] = [];
  const prices: VenueSyncPrice[] = [];
  if (!date.venueProfile || date.eventKind !== "residential_retreat")
    conflicts.push("This event does not have a residential venue room setup.");
  const groups = date.venueProfile?.roomGroups.filter((group) => group.active) || [];
  if (!groups.length) conflicts.push("The venue needs at least one room group.");
  if (
    date.capacity > groups.reduce((sum, group) => sum + group.quantity * group.capacityPerRoom, 0)
  )
    conflicts.push(
      "Event sales capacity exceeds the proposed physical capacity. Review the event capacity first."
    );
  for (const group of groups) {
    const options = date.roomOptions.filter((option) => option.venueRoomGroupId === group.id);
    if (
      new Set(options.map((option) => option.bookingUnit)).size !== options.length ||
      new Set(options.map((option) => option.inventoryPoolId)).size > 1 ||
      options.some((option) => !option.inventoryPoolId)
    ) {
      conflicts.push(
        `${group.name}: existing selling options do not share a single unambiguous inventory pool. Review their mapping before synchronising.`
      );
    }
    const reserved = options.some(
      (option) => option._count.bookings + option._count.giftPurchases > 0
    );
    const pool = options.find((option) => option.inventoryPool)?.inventoryPool;
    const units = date.roomUnits.filter((unit) => unit.inventoryPoolId === pool?.id);
    if (pool && pool.totalQuantity !== group.quantity * group.capacityPerRoom) {
      changes.push(
        `${group.name}: capacity ${pool.totalQuantity} → ${group.quantity * group.capacityPerRoom} places.`
      );
      if (reserved || units.some((unit) => unit._count.bookings > 0 || unit.status === "assigned"))
        conflicts.push(
          `${group.name}: existing bookings or room assignments prevent changing physical capacity. Resolve allocations before applying.`
        );
    }
    for (const offer of offerings(group)) {
      const option = options.find((item) => item.bookingUnit === offer.unit);
      const label = `${group.name} — ${offer.suffix}`;
      if (!option) changes.push(`Add ${label}. Set a price for each occupancy before applying.`);
      else {
        if (option.label !== label || option.description !== group.description)
          changes.push(`Update ${option.label} to ${label} and use the current venue description.`);
        const wantedCapacity =
          offer.unit === "whole_room" ? group.quantity : group.quantity * group.capacityPerRoom;
        const wantedUnits = offer.unit === "whole_room" ? group.capacityPerRoom : 1;
        if (
          option.capacity !== wantedCapacity ||
          option.inventoryUnitsPerBooking !== wantedUnits ||
          JSON.stringify(counts(option.allowedGuestCountsJson)) !== JSON.stringify(offer.guests)
        ) {
          changes.push(`Update ${label} selling capacity and occupancy options.`);
          if (reserved)
            conflicts.push(
              `${group.name}: existing purchases prevent changing selling or occupancy rules.`
            );
        }
      }
      for (const guestCount of offer.guests) {
        if (!option?.ratePlans.some((rate) => rate.guestCount === guestCount))
          prices.push({ key: priceKey(group.id, offer.unit, guestCount), label, guestCount });
      }
    }
    const proposedLabels = group.roomTemplates.map((unit) => unit.label).sort();
    const currentLabels = units.map((unit) => unit.label).sort();
    if (pool && JSON.stringify(proposedLabels) !== JSON.stringify(currentLabels)) {
      changes.push(`${group.name}: update physical room names.`);
      if (reserved || units.some((unit) => unit._count.bookings || unit.status !== "available"))
        conflicts.push(
          `${group.name}: preserve booked or unavailable room identities; resolve their allocation before renaming rooms.`
        );
    }
  }
  for (const option of date.roomOptions.filter((item) => item.active)) {
    const group = groups.find((item) => item.id === option.venueRoomGroupId);
    if (!group || !offerings(group).some((offer) => offer.unit === option.bookingUnit)) {
      changes.push(`Retire ${option.label} from new sales.`);
      if (
        option._count.bookings ||
        option._count.giftPurchases ||
        date.roomUnits.some(
          (unit) =>
            unit.roomOptionId === option.id && (unit._count.bookings || unit.status !== "available")
        )
      )
        conflicts.push(
          `${option.label}: existing purchases or room allocations must be resolved before this option can be retired.`
        );
    }
    if (!option.venueRoomGroupId)
      conflicts.push(
        `${option.label}: legacy inventory is not linked to a venue category. Map it before synchronising; it will not be deleted or duplicated automatically.`
      );
  }
  return {
    id: date.id,
    title: date.retreatTitleSnapshot,
    startsAt: date.startsAt.toISOString(),
    revision: createHash("sha256").update(JSON.stringify(date)).digest("hex"),
    changes: [...new Set(changes)],
    conflicts: [...new Set(conflicts)],
    prices,
  };
}

export async function previewVenueRoomSync(contentfulVenueId: string) {
  const dates = await db.retreatDate.findMany({
    where: {
      venueProfile: { contentfulVenueId },
      startsAt: { gt: new Date() },
      status: { not: "cancelled" },
      eventKind: "residential_retreat",
    },
    include,
    orderBy: { startsAt: "asc" },
  });
  return dates.map(buildVenueSyncPreview);
}

export async function applyVenueRoomSync(input: {
  contentfulVenueId: string;
  dateId: string;
  revision: string;
  prices: Record<string, number>;
  actorUserId: string;
}) {
  return db.$transaction(
    async (tx) => {
      // Same locks/order as configuration and checkout. A checkout in flight must either
      // reserve before the preview is checked, or recheck its selection after these writes.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`retreat-configuration:${input.dateId}`})) IS NULL AS "acquired"`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`retreat-date:${input.dateId}`})) IS NULL AS "acquired"`;
      const date = await tx.retreatDate.findUnique({ where: { id: input.dateId }, include });
      if (!date || date.venueProfile?.contentfulVenueId !== input.contentfulVenueId)
        throw new Error("NOT_FOUND");
      if (date.startsAt <= new Date() || date.status === "cancelled")
        throw new Error("VENUE_SYNC_UNAVAILABLE");
      const preview = buildVenueSyncPreview(date);
      if (input.revision !== preview.revision) throw new Error("VENUE_SYNC_STALE");
      if (preview.conflicts.length) throw new Error("VENUE_SYNC_CONFLICT");
      for (const price of preview.prices)
        if (!Number.isSafeInteger(input.prices[price.key]) || input.prices[price.key] <= 0)
          throw new Error("VENUE_SYNC_PRICE_REQUIRED");
      const retained = new Set<string>();
      const activeGroups = date.venueProfile.roomGroups.filter((group) => group.active);
      for (const group of activeGroups) {
        const options = date.roomOptions.filter((option) => option.venueRoomGroupId === group.id);
        let pool = options.find((option) => option.inventoryPool)?.inventoryPool;
        if (pool) {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`retreat-inventory-pool:${pool.id}`})) IS NULL AS "acquired"`;
          pool = await tx.retreatInventoryPool.update({
            where: { id: pool.id },
            data: { name: group.name, totalQuantity: group.quantity * group.capacityPerRoom },
          });
        } else
          pool = await tx.retreatInventoryPool.create({
            data: {
              retreatDateId: date.id,
              inventoryType: "bed_space",
              name: group.name,
              totalQuantity: group.quantity * group.capacityPerRoom,
            },
          });
        let roomOptionId = "";
        for (const offer of offerings(group)) {
          const existing = options.find((option) => option.bookingUnit === offer.unit);
          const label = `${group.name} — ${offer.suffix}`;
          const capacity = offer.unit === "whole_room" ? group.quantity : pool.totalQuantity;
          const data = {
            label,
            description: group.description,
            capacity,
            inventoryUnitsPerBooking: offer.unit === "whole_room" ? group.capacityPerRoom : 1,
            allowedGuestCountsJson: offer.guests,
            roomCount: group.quantity,
          };
          const option = existing
            ? await tx.retreatRoomOption.update({ where: { id: existing.id }, data })
            : await tx.retreatRoomOption.create({
                data: {
                  ...data,
                  retreatDateId: date.id,
                  venueRoomGroupId: group.id,
                  inventoryPoolId: pool.id,
                  externalRoomOptionId: `venue-${group.id}-${offer.unit === "whole_room" ? "private" : "shared"}`,
                  roomType: offer.unit === "whole_room" ? "private" : "shared_twin",
                  bookingUnit: offer.unit,
                  guestsIncluded: offer.guests[0],
                  availableSpots: capacity,
                  pricePence: Math.min(
                    ...offer.guests.map(
                      (count) => input.prices[priceKey(group.id, offer.unit, count)]
                    )
                  ),
                  displayOrder: group.displayOrder * 2 + (offer.unit === "whole_room" ? 1 : 0),
                },
              });
          retained.add(option.id);
          roomOptionId = option.id;
          for (const guestCount of offer.guests)
            if (!existing?.ratePlans.some((rate) => rate.guestCount === guestCount))
              await tx.retreatRatePlan.create({
                data: {
                  roomOptionId: option.id,
                  guestCount,
                  totalPricePence: input.prices[priceKey(group.id, offer.unit, guestCount)],
                  currency: date.currency,
                },
              });
          await tx.retreatRatePlan.updateMany({
            where: { roomOptionId: option.id, guestCount: { notIn: offer.guests } },
            data: { active: false },
          });
        }
        const units = date.roomUnits.filter((unit) => unit.inventoryPoolId === pool.id);
        const labels = group.roomTemplates.map((unit) => unit.label);
        const canUpdateUnits =
          !options.some((option) => option._count.bookings || option._count.giftPurchases) &&
          !units.some((unit) => unit._count.bookings || unit.status !== "available");
        if (canUpdateUnits) {
          // Keep identities for unchanged room names; never delete booked room records.
          await tx.retreatRoomUnit.deleteMany({
            where: {
              retreatDateId: date.id,
              inventoryPoolId: pool.id,
              label: { notIn: labels },
              bookings: { none: {} },
              status: "available",
            },
          });
          for (const label of labels) {
            const unit = units.find((item) => item.label === label);
            if (unit)
              await tx.retreatRoomUnit.update({
                where: { id: unit.id },
                data: { roomOptionId, capacityUnits: group.capacityPerRoom },
              });
            else
              await tx.retreatRoomUnit.create({
                data: {
                  retreatDateId: date.id,
                  roomOptionId,
                  inventoryPoolId: pool.id,
                  label,
                  capacityUnits: group.capacityPerRoom,
                },
              });
          }
        }
      }
      for (const option of date.roomOptions.filter((item) => !retained.has(item.id))) {
        await tx.retreatRoomOption.update({ where: { id: option.id }, data: { active: false } });
        await tx.retreatRoomUnit.updateMany({
          where: { roomOptionId: option.id, bookings: { none: {} } },
          data: { status: "unavailable" },
        });
      }
      // Do not silently raise event-level capacity: it remains an independent sales cap.
      const physicalCapacity = activeGroups.reduce(
        (sum, group) => sum + group.quantity * group.capacityPerRoom,
        0
      );
      if (date.capacity > physicalCapacity) throw new Error("VENUE_SYNC_CAPACITY_CONFLICT");
      await tx.retreatDate.update({ where: { id: date.id }, data: { updatedAt: new Date() } });
      await createAdminActionLog(
        {
          actorUserId: input.actorUserId,
          actionType: "retreat_venue_rooms_synced",
          targetType: "retreat_date",
          targetId: date.id,
          metadataJson: {
            changes: preview.changes,
            prices: input.prices,
            revision: preview.revision,
          },
        },
        tx
      );
      return { id: date.id, retreatSlug: date.retreatSlug };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

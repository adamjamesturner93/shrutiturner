import "server-only";
import type { Prisma } from "@prisma/client";
import {
  allocatePhysicalRooms,
  physicalRoomAvailability,
  type RoomReservation,
} from "./physical-inventory";

export async function getPhysicalPoolInventory(
  tx: Prisma.TransactionClient,
  poolId: string,
  bookingWhere: Prisma.RetreatBookingWhereInput,
  giftWhere: Prisma.GiftPurchaseWhereInput
) {
  const [rooms, bookings, gifts] = await Promise.all([
    tx.retreatRoomUnit.findMany({
      where: { inventoryPoolId: poolId, status: { not: "unavailable" } },
      select: { id: true, capacityUnits: true },
    }),
    tx.retreatBooking.findMany({
      where: { roomOption: { inventoryPoolId: poolId }, ...bookingWhere },
      select: {
        id: true,
        roomUnitId: true,
        roomOption: { select: { bookingUnit: true, inventoryUnitsPerBooking: true } },
        items: {
          where: { inventoryPoolId: poolId, itemType: "accommodation" },
          select: { quantity: true },
        },
      },
    }),
    tx.giftPurchase.findMany({
      where: { retreatRoomOption: { inventoryPoolId: poolId }, ...giftWhere },
      select: {
        id: true,
        retreatRoomOption: { select: { bookingUnit: true, inventoryUnitsPerBooking: true } },
      },
    }),
  ]);
  const reservations: RoomReservation[] = [
    ...bookings.map((booking) => ({
      id: booking.id,
      roomUnitId: booking.roomUnitId,
      wholeRoom: booking.roomOption?.bookingUnit === "whole_room",
      units:
        booking.items.reduce((sum, item) => sum + item.quantity, 0) ||
        booking.roomOption?.inventoryUnitsPerBooking ||
        1,
    })),
    ...gifts.map((gift) => ({
      id: `gift:${gift.id}`,
      wholeRoom: gift.retreatRoomOption?.bookingUnit === "whole_room",
      units: gift.retreatRoomOption?.inventoryUnitsPerBooking || 1,
    })),
  ];
  return {
    rooms,
    reservations,
    layout: allocatePhysicalRooms(rooms, reservations),
    available: (wholeRoom: boolean, units: number) =>
      physicalRoomAvailability(rooms, reservations, wholeRoom, units),
  };
}

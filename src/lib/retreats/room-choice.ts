import type { RetreatRoomOptionContent } from "@/lib/content/types";
import { getRetreatRoomRatePlans } from "./presentation";
import { getEffectiveRetreatRatePricePence } from "./pricing";

export function isRoomAvailable(room: RetreatRoomOptionContent) {
  return room.availableSpots > 0 && !room.isWaitlistOnly;
}
export function isPrivateRoom(room: RetreatRoomOptionContent) {
  return (
    room.bookingUnit === "whole_room" ||
    (!room.bookingUnit && ["private", "single", "shared_private"].includes(room.type))
  );
}
export function roomBedLabel(room: RetreatRoomOptionContent) {
  const labels: Record<string, string> = {
    fixed_double: "Double or king bed",
    fixed_twin: "Twin beds",
    convertible_double_twin: "King or twin beds",
    single: "Single bed",
    bunk_or_dorm: "Bunk or dorm beds",
  };
  return labels[room.bedSetup || ""] || room.label;
}
export function groupRoomChoices(rooms: RetreatRoomOptionContent[], guestCount?: number) {
  const groups = new Map<
    string,
    { id: string; label: string; privateRoom: boolean; options: RetreatRoomOptionContent[] }
  >();
  for (const room of rooms) {
    if (
      guestCount &&
      ((!isPrivateRoom(room) && guestCount !== 1) ||
        !getRetreatRoomRatePlans(room).some((rate) => rate.guestCount === guestCount))
    )
      continue;
    const privateRoom = isPrivateRoom(room);
    const bathroom = room.bathroomType || "unknown";
    const id = `${privateRoom ? "private" : "shared"}-${bathroom}`;
    const label = `${privateRoom ? "Private room" : "Shared room"} · ${bathroom === "private" ? "Private bathroom" : bathroom === "shared" ? "Shared bathroom" : "Bathroom details to be confirmed"}`;
    if (!groups.has(id)) groups.set(id, { id, label, privateRoom, options: [] });
    groups.get(id)!.options.push(room);
  }
  return [...groups.values()]
    .map((group) => {
      const available = group.options.filter(isRoomAvailable);
      const prices = (available.length ? available : group.options).flatMap((room) =>
        getRetreatRoomRatePlans(room)
          .filter((rate) => !guestCount || rate.guestCount === guestCount)
          .map((rate) => {
            const total = getEffectiveRetreatRatePricePence(rate);
            return group.privateRoom ? total : Math.round(total / Math.max(1, rate.guestCount));
          })
      );
      return {
        ...group,
        available: available.length > 0,
        pricePence: prices.length ? Math.min(...prices) : 0,
        fromPrice: new Set(prices).size > 1,
      };
    })
    .sort((a, b) => Number(a.privateRoom) - Number(b.privateRoom) || a.id.localeCompare(b.id));
}

export function roomSupportsBed(room: RetreatRoomOptionContent, bed: "double" | "twin") {
  return (
    room.bedSetup === "convertible_double_twin" ||
    (bed === "double" ? room.bedSetup === "fixed_double" : room.bedSetup === "fixed_twin")
  );
}

export function selectCompatibleRoom(
  options: RetreatRoomOptionContent[],
  guestCount: number,
  bed?: "double" | "twin"
) {
  return (
    options
      .filter(
        (room) =>
          isRoomAvailable(room) &&
          (!bed || roomSupportsBed(room, bed)) &&
          getRetreatRoomRatePlans(room).some((rate) => rate.guestCount === guestCount)
      )
      .sort((a, b) => {
        const price = (room: RetreatRoomOptionContent) =>
          getEffectiveRetreatRatePricePence(
            getRetreatRoomRatePlans(room).find((rate) => rate.guestCount === guestCount)!
          );
        const soloKing = (room: RetreatRoomOptionContent) =>
          guestCount === 1 && isPrivateRoom(room) && roomSupportsBed(room, "double") ? 0 : 1;
        return (
          price(a) - price(b) ||
          Number(!isPrivateRoom(b) && (b.sharedBedsInOccupiedRooms || 0) > 0) -
            Number(!isPrivateRoom(a) && (a.sharedBedsInOccupiedRooms || 0) > 0) ||
          soloKing(a) - soloKing(b) ||
          Number(a.bedSetup === "convertible_double_twin") -
            Number(b.bedSetup === "convertible_double_twin") ||
          a.id.localeCompare(b.id)
        );
      })[0] || null
  );
}

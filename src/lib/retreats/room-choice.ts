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
export function groupRoomChoices(rooms: RetreatRoomOptionContent[]) {
  const groups = new Map<
    string,
    { id: string; label: string; privateRoom: boolean; options: RetreatRoomOptionContent[] }
  >();
  for (const room of rooms) {
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
        getRetreatRoomRatePlans(room).map((rate) => {
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

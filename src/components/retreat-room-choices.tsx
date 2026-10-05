"use client";
import { useState } from "react";
import type { RetreatRoomOptionContent } from "@/lib/content/types";
import { groupRoomChoices, isRoomAvailable, roomBedLabel } from "@/lib/retreats/room-choice";
import { getRetreatRoomOptionPriceSummary } from "@/lib/retreats/presentation";

export function RetreatRoomChoices({
  options,
  selectedId,
  currency,
  onSelect,
}: {
  options: RetreatRoomOptionContent[];
  selectedId: string;
  currency: string;
  onSelect: (room: RetreatRoomOptionContent | null) => void;
}) {
  const groups = groupRoomChoices(options);
  const [chosenGroup, setChosenGroup] = useState("");
  const selectedGroup = groups.find((group) => group.id === chosenGroup);
  const money = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: pence % 100 ? 2 : 0,
    }).format(pence / 100);
  return (
    <div className="space-y-4">
      <div aria-label="Room and bathroom choices" className="grid gap-3">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            disabled={!group.available}
            aria-pressed={chosenGroup === group.id}
            aria-controls="room-bed-choices"
            onClick={() => {
              setChosenGroup(group.id);
              const available = group.options.filter(isRoomAvailable);
              onSelect(available.length === 1 ? available[0] : null);
            }}
            className={`rounded-xl border p-4 text-left disabled:opacity-60 ${chosenGroup === group.id ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20 hover:bg-secondary/30"}`}
          >
            <span className="block font-medium">{group.label}</span>
            <span className="mt-1 block text-sm">
              {group.available
                ? `${group.fromPrice ? "From " : ""}${money(group.pricePence)} ${group.privateRoom ? "per room" : "per person"}`
                : "Sold out"}
            </span>
          </button>
        ))}
      </div>
      <div id="room-bed-choices" className="space-y-3">
        {selectedGroup ? (
          <>
            <h4 className="font-medium">
              {selectedGroup.options.filter(isRoomAvailable).length > 1
                ? "Choose your beds"
                : "Your room"}
            </h4>
            {selectedGroup.options.map((room) => {
              const price = getRetreatRoomOptionPriceSummary(room);
              return (
                <button
                  key={room.id}
                  type="button"
                  disabled={!isRoomAvailable(room)}
                  aria-pressed={selectedId === room.id}
                  onClick={() => onSelect(room)}
                  className={`w-full rounded-lg border p-3 text-left disabled:opacity-60 ${selectedId === room.id ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20"}`}
                >
                  <span className="block font-medium">{roomBedLabel(room)}</span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {room.description || room.label}
                  </span>
                  <span className="mt-2 block text-sm">
                    {isRoomAvailable(room)
                      ? `${price.isFromPrice ? "From " : ""}${money(price.lowestPricePence)} ${selectedGroup.privateRoom ? "per room" : "per place"}`
                      : "Sold out"}
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Choose a room type to see the available beds.
          </p>
        )}
      </div>
    </div>
  );
}

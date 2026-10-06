"use client";
import { useState } from "react";
import type { RetreatRoomOptionContent } from "@/lib/content/types";
import {
  groupRoomChoices,
  isRoomAvailable,
  roomSupportsBed,
  selectCompatibleRoom,
} from "@/lib/retreats/room-choice";
import type { BedPreference } from "@/lib/retreats/bed-preference";

export function RetreatRoomChoices({
  options,
  selectedId,
  currency,
  guestCount = 1,
  onGuestCountChange,
  bedPreference = "double",
  onBedPreferenceChange,
  onSelect,
}: {
  options: RetreatRoomOptionContent[];
  selectedId: string;
  currency: string;
  guestCount?: number;
  onGuestCountChange?: (count: number) => void;
  bedPreference?: BedPreference;
  onBedPreferenceChange?: (bed: BedPreference) => void;
  onSelect: (room: RetreatRoomOptionContent | null) => void;
}) {
  const groups = groupRoomChoices(options, guestCount);
  const [chosenGroup, setChosenGroup] = useState("");
  const selectedGroup =
    groups.find((group) => group.options.some((room) => room.id === selectedId)) ||
    groups.find((group) => group.id === chosenGroup);
  const money = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: pence % 100 ? 2 : 0,
    }).format(pence / 100);
  function choose(group: (typeof groups)[number]) {
    setChosenGroup(group.id);
    const beds = (["double", "twin"] as const).filter((bed) =>
      group.options.some((room) => roomSupportsBed(room, bed))
    );
    if (guestCount === 2 && group.privateRoom && beds.length > 1) {
      onSelect(null);
      return;
    }
    if (beds.length === 1) onBedPreferenceChange?.(beds[0]);
    else onBedPreferenceChange?.("double");
    onSelect(selectCompatibleRoom(group.options, guestCount));
  }
  return (
    <div className="space-y-5">
      {onGuestCountChange ? (
        <fieldset>
          <legend className="mb-3 font-medium">How many people?</legend>
          <div className="flex gap-3">
            {[1, 2].map((count) => (
              <button
                type="button"
                key={count}
                aria-pressed={guestCount === count}
                className={`rounded-lg border px-5 py-3 ${guestCount === count ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20"}`}
                onClick={() => {
                  setChosenGroup("");
                  onSelect(null);
                  onGuestCountChange(count);
                }}
              >
                {count === 1 ? "1 person" : "2 people"}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="mb-3 font-medium">Choose your room</legend>
        <div className="grid gap-3">
          {groups.map((group) => (
            <button
              type="button"
              key={group.id}
              disabled={!group.available}
              aria-pressed={selectedGroup?.id === group.id}
              onClick={() => choose(group)}
              className={`rounded-xl border p-4 text-left ${selectedGroup?.id === group.id ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20"}`}
            >
              <span className="block font-medium">{group.label}</span>
              <span className="mt-1 block text-sm">
                {group.fromPrice ? "From " : ""}
                {money(group.pricePence)}{" "}
                {group.privateRoom ? "total" : "for one person · one twin bed"}
              </span>
              {!group.available ? <span className="mt-2 block font-semibold">Sold out</span> : null}
            </button>
          ))}
        </div>
      </fieldset>
      {selectedGroup?.privateRoom && guestCount === 2 ? (
        <fieldset>
          <legend className="mb-3 font-medium">Bed configuration</legend>
          <div className="flex gap-3">
            {(["double", "twin"] as const)
              .filter((bed) => selectedGroup.options.some((room) => roomSupportsBed(room, bed)))
              .map((bed) => {
                const candidate = selectCompatibleRoom(selectedGroup.options, guestCount, bed);
                return (
                  <button
                    key={bed}
                    type="button"
                    disabled={!candidate}
                    aria-pressed={Boolean(selectedId) && bedPreference === bed}
                    className={`rounded-lg border p-4 ${selectedId && bedPreference === bed ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20"}`}
                    onClick={() => {
                      onBedPreferenceChange?.(bed);
                      onSelect(candidate);
                    }}
                  >
                    {bed === "double" ? "King bed" : "Twin beds"}
                    {!candidate ? <span className="mt-1 block font-semibold">Sold out</span> : null}
                  </button>
                );
              })}
          </div>
        </fieldset>
      ) : null}
      {selectedId && selectedGroup?.privateRoom && guestCount === 1 ? (
        <p className="text-muted-foreground text-sm">
          {options.find((room) => room.id === selectedId)?.bedSetup === "fixed_twin"
            ? "Private room for one person · twin beds"
            : "Private room for one person · king bed"}
        </p>
      ) : null}
      {selectedId && options.some((room) => room.id === selectedId && !isRoomAvailable(room)) ? (
        <p role="alert">Your selected room is sold out. Please choose another room.</p>
      ) : null}
    </div>
  );
}

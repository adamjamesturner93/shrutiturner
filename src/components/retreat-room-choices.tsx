"use client";
import { useState } from "react";
import type { RetreatRoomOptionContent } from "@/lib/content/types";
import {
  groupRoomChoices,
  isRoomAvailable,
  roomSupportsBed,
  selectCompatibleRoom,
  selectedRoomSummary,
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
  const [exploring, setExploring] = useState(true);
  const selectedRoom = options.find((room) => room.id === selectedId);
  const selectedSummary = selectedRoom
    ? selectedRoomSummary(selectedRoom, guestCount, bedPreference)
    : null;
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
    setExploring(false);
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
          <legend className="mb-3 font-medium">How many people are you booking for?</legend>
          <div className="flex gap-3">
            {[1, 2].map((count) => (
              <button
                type="button"
                key={count}
                aria-pressed={guestCount === count}
                className={`rounded-lg border px-5 py-3 ${guestCount === count ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/20"}`}
                onClick={() => {
                  setExploring(true);
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
        <legend className="mb-3 font-medium">
          {selectedId && !exploring ? "Your selected room" : "Choose your room"}
        </legend>
        {selectedId ? (
          <button
            type="button"
            className="text-brand-accent mb-3 min-h-11 underline underline-offset-4"
            aria-expanded={exploring}
            onClick={() => setExploring(!exploring)}
          >
            {exploring ? "Keep selected room" : "Change room"}
          </button>
        ) : null}
        <div className="grid gap-3">
          {groups
            .filter((group) => exploring || !selectedId || group.id === selectedGroup?.id)
            .map((group) => (
              <div
                key={group.id}
                className={`overflow-hidden rounded-xl border ${selectedGroup?.id === group.id ? "border-brand-accent bg-brand-accent/5" : "border-brand-dark/15 bg-background"}`}
              >
                <button
                  type="button"
                  disabled={!group.available}
                  aria-pressed={selectedGroup?.id === group.id}
                  onClick={() => choose(group)}
                  aria-label={`${group.label} · ${money(group.id === selectedGroup?.id && selectedSummary?.pricePence != null ? selectedSummary.pricePence : group.pricePence)}${!group.available ? " · Sold out" : ""}`}
                  className="hover:bg-brand-accent/5 focus-visible:outline-brand-accent grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-4 py-3 text-left focus-visible:outline-2"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {group.privateRoom ? "Private room" : "Shared room"}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {group.label.split(" · ")[1]}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold">
                      {group.id === selectedGroup?.id && selectedSummary?.pricePence != null
                        ? ""
                        : group.fromPrice
                          ? "From "
                          : ""}
                      {money(
                        group.id === selectedGroup?.id && selectedSummary?.pricePence != null
                          ? selectedSummary.pricePence
                          : group.pricePence
                      )}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {group.privateRoom ? `total for ${guestCount}` : "per person"}
                    </span>
                  </span>
                  {!group.available ? (
                    <span className="mt-2 block font-semibold">Sold out</span>
                  ) : null}
                </button>
                {selectedGroup?.id === group.id ? (
                  <details className="border-brand-accent/15 border-t px-4 pb-1">
                    <summary className="text-brand-accent cursor-pointer py-2 text-sm">
                      Room details
                    </summary>
                    <div className="text-muted-foreground space-y-3 pb-2 text-sm leading-relaxed">
                      {!group.privateRoom ? (
                        <p>
                          One twin bed in a shared room, booked for one person. Another guest may
                          book the other bed.
                        </p>
                      ) : (
                        <p>The whole room is reserved for your booking.</p>
                      )}
                      {[
                        ...new Set(
                          group.options.map((option) => option.description).filter(Boolean)
                        ),
                      ].map((description) => (
                        <p key={description}>{description}</p>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
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

export type BedPreference = "double" | "twin";

export function requiresBedPreference(
  room: { bookingUnit?: string; bedSetup?: string | null } | null | undefined,
  guestCount: number
) {
  return (
    room?.bookingUnit === "whole_room" &&
    room.bedSetup === "convertible_double_twin" &&
    guestCount === 2
  );
}

export function getBedPreferenceLabel(value: string | null | undefined) {
  if (value === "double") return "One double bed";
  if (value === "twin") return "Two single beds";
  return "";
}

export function validateBedPreference(
  room: { bookingUnit?: string; bedSetup?: string | null },
  guestCount: number,
  value: unknown
): BedPreference | null {
  if (requiresBedPreference(room, guestCount)) {
    if (value === "double" || value === "twin") return value;
    throw new Error("RETREAT_BED_PREFERENCE_REQUIRED");
  }
  if (value !== undefined && value !== null && value !== "") {
    throw new Error("RETREAT_BED_PREFERENCE_INVALID");
  }
  return null;
}

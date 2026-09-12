import { describe, expect, it } from "vitest";
import { requiresBedPreference, validateBedPreference } from "@/lib/retreats/bed-preference";

const convertible = { bookingUnit: "whole_room", bedSetup: "convertible_double_twin" };

describe("convertible room bed preference", () => {
  it.each(["double", "twin"])("accepts %s for two guests in the same private room", (choice) => {
    expect(validateBedPreference(convertible, 2, choice)).toBe(choice);
  });
  it.each([undefined, "", "bunk", 2])("requires an explicit valid preference: %s", (choice) => {
    expect(() => validateBedPreference(convertible, 2, choice)).toThrow(
      "RETREAT_BED_PREFERENCE_REQUIRED"
    );
  });
  it.each([
    [{ ...convertible, bookingUnit: "bed_space" }, 2],
    [{ ...convertible, bedSetup: "fixed_double" }, 2],
    [{ ...convertible, bedSetup: "fixed_twin" }, 2],
    [convertible, 1],
  ])(
    "does not accept a choice where the setup is fixed or only one guest is staying",
    (room, guests) => {
      expect(requiresBedPreference(room, guests)).toBe(false);
      expect(validateBedPreference(room, guests, undefined)).toBeNull();
      expect(() => validateBedPreference(room, guests, "twin")).toThrow(
        "RETREAT_BED_PREFERENCE_INVALID"
      );
    }
  );
});

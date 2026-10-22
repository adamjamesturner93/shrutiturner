import { expect, it } from "vitest";
import { hasLegacyServices } from "@/lib/admin/legacy-services";

const empty = { membershipPlan: null, creditBalance: 0, totalBookings: 0 };
it("hides inactive services for new accounts and instructor labels alone", () => {
  expect(hasLegacyServices(empty)).toBe(false);
  expect(hasLegacyServices({ ...empty, membershipPlan: "instructor" })).toBe(false);
});
it("retains tools for historical records even when balances are exhausted", () => {
  expect(hasLegacyServices({ ...empty, hasLegacyServices: true })).toBe(true);
  expect(hasLegacyServices({ ...empty, creditHistory: [{}] })).toBe(true);
  expect(hasLegacyServices({ ...empty, membershipPlan: "movewell" })).toBe(true);
  expect(hasLegacyServices({ ...empty, creditBalance: 2 })).toBe(true);
  expect(hasLegacyServices({ ...empty, totalBookings: 1 })).toBe(true);
});

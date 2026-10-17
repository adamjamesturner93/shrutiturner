import { expect, it } from "vitest";
import { migrateReviewAreas } from "../../../contentful/migrations/review-areas";
it("merges the retreat pools, preserves locales and does not mutate legacy data", () => {
  const old = { "en-GB": ["Home", "Retreat", "Retreats General"], fr: ["Coaching"] };
  expect(migrateReviewAreas(old)).toEqual({
    "en-GB": ["Home", "Retreats & Workshops"],
    fr: ["Coaching"],
  });
  expect(old["en-GB"]).toEqual(["Home", "Retreat", "Retreats General"]);
});
it("does not reclassify class reviews and rejects unknown approvals", () => {
  expect(migrateReviewAreas({ en: ["classes"] })).toEqual({ en: [] });
  expect(() => migrateReviewAreas({ en: ["unknown"] })).toThrow();
});

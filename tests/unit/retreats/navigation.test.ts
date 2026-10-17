import { expect, it } from "vitest";
import { buildRetreatNavigation } from "@/lib/retreats/navigation";
import type { RetreatCombinedContent } from "@/lib/content/types";
const event = (slug: string, startDate: string, available = true): RetreatCombinedContent =>
  ({
    slug,
    title: slug,
    location: "Stirling",
    imageUrl: "",
    dates: [
      {
        startDate,
        endDate: startDate,
        availableSpaces: available ? 2 : 0,
        eventKind: "residential_retreat",
        roomOptions: [{ availableSpots: available ? 2 : 0 }],
      },
    ],
  }) as RetreatCombinedContent;
it("excludes past events and sorts upcoming experiences by date", () => {
  const result = buildRetreatNavigation(
    [event("later", "2027-08-01"), event("past", "2025-01-01"), event("first", "2027-06-01")],
    Date.parse("2026-10-16")
  );
  expect(result.map((item) => item.slug)).toEqual(["first", "later"]);
  expect(result[0]).toMatchObject({
    format: "Residential retreat",
    status: "Places available",
    imageUrl: "",
  });
});
it("keeps sold-out experiences visible and handles an empty catalogue", () => {
  expect(
    buildRetreatNavigation([event("sold", "2027-01-01", false)], Date.parse("2026-10-16"))[0].status
  ).toBe("Sold out");
  expect(buildRetreatNavigation([])).toEqual([]);
});

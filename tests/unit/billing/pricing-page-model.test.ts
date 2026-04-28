import { describe, expect, it } from "vitest";
import {
  formatPenceAsPounds,
  getPricingCoachingRows,
  getPricingProgrammeCards,
} from "@/lib/billing/pricing-page-model";

describe("pricing page model", () => {
  it("formats programme prices as readable pound values", () => {
    expect(formatPenceAsPounds(16500)).toBe("£165");
  });

  it("exposes coaching tiers with prices, membership comparison, and CTAs", () => {
    const rows = getPricingCoachingRows();

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.priceLabel)).toEqual([
      "£60 / month",
      "£200 / month",
      "£350 / month",
    ]);
    expect(rows.map((row) => row.includesMembership)).toEqual([false, true, true]);
    expect(rows.every((row) => row.ctaHref.startsWith("/coaching/"))).toBe(true);
  });

  it("exposes small-group programme pricing with detail links", () => {
    const cards = getPricingProgrammeCards();

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.priceLabel)).toEqual(["£165", "£180", "£120"]);
    expect(cards[0]).toMatchObject({
      title: "Shoulder Resilience & Mobility",
      ctaHref: "/classes/small-groups/shoulder-resilience",
      durationLabel: "6 weeks",
      sessionsPerWeek: 2,
      cohortSize: 6,
    });
    expect(cards.every((card) => card.inclusions.length > 0)).toBe(true);
  });
});

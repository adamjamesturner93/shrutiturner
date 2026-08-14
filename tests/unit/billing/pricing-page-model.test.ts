import { describe, expect, it } from "vitest";
import {
  filterCoachingPricingFaqs,
  formatPenceAsPounds,
  getPricingCoachingRows,
  getPricingProgrammeCards,
} from "@/lib/billing/pricing-page-model";

describe("pricing page model", () => {
  it("formats programme prices as readable pound values", () => {
    expect(formatPenceAsPounds(16500)).toBe("£165");
  });

  it("exposes 1:1 offers with Canva comparison copy, prices and CTAs", () => {
    const rows = getPricingCoachingRows();

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.name)).toEqual([
      "Monthly Support",
      "Weekly Support",
      "1:1 Coaching",
    ]);
    expect(rows.map((row) => row.priceLabel)).toEqual([
      "£95 / month",
      "£130 / month",
      "£180 / month",
    ]);
    expect(rows.every((row) => row.ctaHref === "/coaching/enquire")).toBe(true);
    expect(rows[0].whatItIs).toContain("monthly review and coaching call");
    expect(rows[1].bestFor).toContain("regular review");
    expect(rows.flatMap((row) => row.features).join(" ")).not.toContain("Move Well");
  });

  it("filters dormant class, membership, creditand retreat FAQs from coaching pricing", () => {
    const faqs = filterCoachingPricingFaqs([
      {
        slug: "coaching-payment",
        question: "Can I pay for coaching immediately?",
        answer: "Payment opens after application acceptance.",
        sortOrder: 1,
      },
      {
        slug: "credits-any-class",
        question: "Can I use credits on any class?",
        answer: "Credits were used for live classes.",
        sortOrder: 2,
      },
      {
        slug: "retreat-balance",
        question: "How do retreat balances work?",
        answer: "Retreat payment terms.",
        sortOrder: 3,
      },
    ]);

    expect(faqs.map((faq) => faq.slug)).toEqual(["coaching-payment"]);
  });

  it("does not expose local small-group programme pricing", () => {
    const cards = getPricingProgrammeCards();

    expect(cards).toEqual([]);
  });
});

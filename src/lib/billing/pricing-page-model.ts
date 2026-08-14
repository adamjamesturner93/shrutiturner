import { activeCoachingTiers } from "@/data/marketing";
import type { FaqItemContent } from "@/lib/content/types";

export interface PricingCoachingRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bestFor: string;
  whatItIs: string;
  priceLabel: string;
  priceNote: string;
  ctaHref: string;
  ctaLabel: string;
  features: string[];
}

export interface PricingProgrammeCard {
  id: string;
  title: string;
  summary: string;
  durationLabel: string;
  sessionsPerWeek: number;
  cohortSize: number;
  priceLabel: string;
  ctaHref: string;
  inclusions: string[];
}

export function formatPenceAsPounds(pence: number): string {
  return `£${Math.round(pence / 100)}`;
}

export function getPricingCoachingRows(): PricingCoachingRow[] {
  return activeCoachingTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    description: tier.description,
    bestFor: tier.bestFor,
    whatItIs: tier.whatItIs,
    priceLabel: tier.priceLabel,
    priceNote: tier.priceNote,
    ctaHref: tier.ctaHref,
    ctaLabel: tier.ctaLabel,
    features: tier.features,
  }));
}

export function filterCoachingPricingFaqs(faqs: FaqItemContent[]): FaqItemContent[] {
  const hiddenTerms = [
    "credit",
    "credits",
    "class",
    "classes",
    "schedule",
    "retreat",
    "retreats",
    "workshop",
    "workshops",
    "small group",
    "membership",
    "move well",
  ];

  return faqs.filter((faq) => {
    const searchable = [faq.slug, faq.question, faq.answer, faq.targetPage, faq.targetSection]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return !hiddenTerms.some((term) => searchable.includes(term));
  });
}

export function getPricingProgrammeCards(): PricingProgrammeCard[] {
  return [];
}

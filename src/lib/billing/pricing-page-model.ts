import { coachingTiers } from "@/data/marketing";
import { smallGroupTemplates } from "@/data/small-group-programmes";

export interface PricingCoachingRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceLabel: string;
  priceNote: string;
  includesMembership: boolean;
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
  return coachingTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    description: tier.description,
    priceLabel: tier.priceLabel,
    priceNote: tier.priceNote,
    includesMembership: tier.includesMembership,
    ctaHref: tier.ctaHref,
    ctaLabel: tier.ctaLabel,
    features: tier.features,
  }));
}

export function getPricingProgrammeCards(): PricingProgrammeCard[] {
  return smallGroupTemplates.map((programme) => ({
    id: programme.id,
    title: programme.title,
    summary: programme.shortSummary,
    durationLabel: programme.durationLabel,
    sessionsPerWeek: programme.sessionsPerWeek,
    cohortSize: programme.cohortSize,
    priceLabel: formatPenceAsPounds(programme.defaultPricePence),
    ctaHref: `/classes/small-groups/${programme.slug}`,
    inclusions: programme.inclusions.slice(0, 3),
  }));
}

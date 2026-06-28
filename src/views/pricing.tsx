"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Layout } from "@/components/layout";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import {
  filterCoachingPricingFaqs,
  getPricingCoachingRows,
} from "@/lib/billing/pricing-page-model";
import type { FaqItemContent } from "@/lib/content/types";

interface PricingPageProps {
  faqs?: FaqItemContent[];
}

const DEFAULT_PRICING_FAQS: FaqItemContent[] = [
  {
    slug: "application-first",
    question: "Why do I need to apply before paying?",
    answer:
      "Coaching is application-led so Shruti can confirm the support level is a good fit before any subscription checkout is created.",
    sortOrder: 10,
  },
  {
    slug: "change-tier",
    question: "Can I change coaching tier later?",
    answer:
      "Yes. Package changes are agreed with Shruti first, then confirmed through your coaching dashboard so the billing change is clear.",
    sortOrder: 20,
  },
  {
    slug: "everfit",
    question: "Where does coaching happen?",
    answer:
      "Programming, check-ins, coach notes and messages live in Everfit. The website handles application status, paymentand account access.",
    sortOrder: 30,
  },
  {
    slug: "affordability",
    question: "What if I cannot afford these prices?",
    answer:
      "Limited sliding scale or pro-bono arrangements may be available. Use the application form to explain what kind of support would be realistic.",
    sortOrder: 40,
  },
];

export function PricingPage({ faqs }: PricingPageProps) {
  const coachingRows = useMemo(() => getPricingCoachingRows(), []);
  const activeFaqs = useMemo(
    () =>
      filterCoachingPricingFaqs(faqs && faqs.length > 0 ? faqs : DEFAULT_PRICING_FAQS).sort(
        (a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)
      ),
    [faqs]
  );

  return (
    <Layout>
      <SEO
        title="Coaching Pricing - Shruti Turner"
        description="Application-led coaching pricing for personalised training plans, guided programming, accountability and 1:1 coaching."
        keywords="strength coaching pricing, chronic illness coaching cost, adaptive strength coaching, online coaching pricing"
        canonicalUrl="https://shrutiturner.co.uk/pricing"
      />

      <EditorialHero
        eyebrow="Pricing"
        size="compact"
        title={
          <>
            Coaching pricing for support that is
            <span className="text-brand-accent-light"> matched to capacity.</span>
          </>
        }
        description="Choose the closest coaching offer, then apply. Payment only opens after Shruti has reviewed your application and confirmed the right next step."
        primaryCta={{ href: "#coaching", label: "Compare Coaching" }}
        secondaryCta={{ href: "/coaching/apply", label: "Apply First" }}
        stats={[
          { value: "4", label: "Coaching options" },
          { value: "48 hrs", label: "Usual application reply" },
        ]}
        metrics={[
          {
            label: "Application-led",
            detail: "No instant checkout. Shruti checks fit before payment.",
          },
          {
            label: "Delivered in Everfit",
            detail: "Programming, check-ins and coaching communication stay in one place.",
          },
          {
            label: "Separate billing",
            detail: "1:1 services are billed independently from retreat and workshop offers.",
          },
        ]}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 rounded-[2rem] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
            <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">
              Payment Flow
            </p>
            <div className="mt-6 space-y-4">
              {[
                "Apply with context about your body, schedule and support needs.",
                "Shruti reviews fit and confirms the right coaching offer.",
                "Checkout opens in your coaching dashboard after acceptance.",
              ].map((item, index) => (
                <div key={item} className="flex gap-4">
                  <span className="bg-brand-accent-light text-brand-dark flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                    {index + 1}
                  </span>
                  <p className="text-brand-white/82 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <ProofBand
        title="What the pricing is designed to clarify"
        description="The right tier depends on the amount of planning, review and accountability you need, not on how hard you think you should be working."
        items={[
          {
            label: "Accountability",
            detail: "For people who already have direction but need a clearer rhythm.",
          },
          {
            label: "Programming",
            detail: "For people who need a tailored training plan and monthly review.",
          },
          {
            label: "Guided support",
            detail: "For people who need closer check-ins and adaptation support.",
          },
          {
            label: "1:1 coaching",
            detail: "For people who need the highest-touch strategy and oversight.",
          },
        ]}
      />

      <MarketingSection id="coaching" className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Coaching"
          title="Application-led coaching offers"
          description="Choose the closest offer, then apply. Subscription checkout is only created after admin acceptance."
          align="center"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {coachingRows.map((tier) => (
            <article
              key={tier.id}
              className="border-brand-dark/10 bg-background flex flex-col rounded-[1.75rem] border p-7 shadow-[0_20px_50px_rgba(46,31,51,0.06)]"
            >
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">{tier.tagline}</p>
              <h3 className="mt-4 text-3xl leading-tight">{tier.name}</h3>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {tier.description}
              </p>
              <div className="mt-6">
                <p className="text-4xl" aria-label={tier.priceLabel}>
                  {tier.priceLabel}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{tier.priceNote}</p>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="mt-8 w-full">
                <Link href={tier.ctaHref}>
                  {tier.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="border-brand-dark/10 bg-background mt-10 overflow-hidden rounded-[1.6rem] border shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Coaching tier comparison showing price, support leveland next step.
              </caption>
              <thead className="bg-brand-warm text-brand-dark">
                <tr>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Tier
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Price
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Support
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Next step
                  </th>
                </tr>
              </thead>
              <tbody className="divide-brand-dark/10 divide-y">
                {coachingRows.map((tier) => (
                  <tr key={tier.id}>
                    <th scope="row" className="px-5 py-5 align-top font-medium">
                      {tier.name}
                    </th>
                    <td className="text-muted-foreground px-5 py-5 align-top">
                      <span aria-label={tier.priceLabel}>{tier.priceLabel}</span>
                      <span className="mt-1 block text-xs">{tier.priceNote}</span>
                    </td>
                    <td className="text-muted-foreground px-5 py-5 align-top">{tier.tagline}</td>
                    <td className="px-5 py-5 align-top">
                      <Link
                        href={tier.ctaHref}
                        className="text-brand-accent inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
                      >
                        {tier.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <SectionHeading
          eyebrow="Common Questions"
          title="If you are deciding between options, start here."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {activeFaqs.map((faq) => (
            <article
              key={faq.slug}
              className="border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
            >
              <h3 className="text-2xl leading-tight">{faq.question}</h3>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{faq.answer}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Ready"
        title="Start with fit before payment."
        description="Apply with context about your body, goals, schedule and support needs. Shruti will reply with the next best step."
        actions={[
          {
            href: "/coaching/apply",
            label: "Apply for Coaching",
            icon: ArrowRight,
          },
          {
            href: "/contact",
            label: "Ask a question",
            variant: "secondary",
          },
        ]}
      />
    </Layout>
  );
}

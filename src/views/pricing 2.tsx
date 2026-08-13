"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, Crown, Shield, Sparkles, Star, Ticket } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import { getPricingCoachingRows, getPricingProgrammeCards } from "@/lib/billing/pricing-page-model";
import type { PublicPricingDto } from "@/lib/api/types";
import type { FaqItemContent } from "@/lib/content/types";

interface PricingPageProps {
  faqs?: FaqItemContent[];
}

type PricingCheckoutIntent =
  | { kind: "membership"; interval: "monthly" | "annual" }
  | { kind: "credits"; bundle: 1 | 3 | 10 };

const DEFAULT_PRICING_FAQS: FaqItemContent[] = [
  {
    slug: "monthly-vs-annual",
    question: "Should I choose monthly or annual membership?",
    answer:
      "Monthly gives flexibility. Annual gives the best value for consistent training and includes the same unlimited class access.",
    sortOrder: 5,
  },
  {
    slug: "membership-vs-credits",
    question: "Should I get the membership or credit packs?",
    answer:
      "If you attend 4 or more classes per month, the Move Well Membership (£29/month) works out cheaper. Credit packs are ideal for trying classes or variable schedules.",
    sortOrder: 10,
  },
  {
    slug: "credits-any-class",
    question: "Can I use credits on any class?",
    answer:
      "Yes. All credit packs work on any class in the schedule — Yoga, Mobility, Strength, or Cardio.",
    sortOrder: 20,
  },
  {
    slug: "credit-expiry",
    question: "What happens when credits expire?",
    answer: "All credit packs expire 90 days after purchase. They do not auto-renew.",
    sortOrder: 30,
  },
  {
    slug: "cancellation",
    question: "What is the cancellation policy?",
    answer:
      "Membership: cancel anytime and keep access until the end of your billing period. Credit packs: cancel 4+ hours before class to get your credit back.",
    sortOrder: 40,
  },
  {
    slug: "affordability",
    question: "What if I cannot afford these prices?",
    answer:
      "Limited sliding scale spots are available for people on disability benefits or experiencing financial hardship.",
    sortOrder: 50,
  },
];

export function PricingPage({ faqs }: PricingPageProps) {
  const { isAuthenticated } = useAuth();
  const [pricing, setPricing] = useState<PublicPricingDto | null>(null);
  const coachingRows = useMemo(() => getPricingCoachingRows(), []);
  const programmeCards = useMemo(() => getPricingProgrammeCards(), []);

  const activeFaqs = useMemo(
    () =>
      (faqs && faqs.length > 0 ? faqs : DEFAULT_PRICING_FAQS).sort(
        (a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)
      ),
    [faqs]
  );

  const buildAuthenticatedPurchaseHref = (intent: PricingCheckoutIntent) => {
    if (intent.kind === "membership") {
      const params = new URLSearchParams({
        subscribe: "1",
        interval: intent.interval,
        source: "pricing",
      });
      return `/dashboard/membership?${params.toString()}`;
    } else {
      const params = new URLSearchParams({ intent: "pricing-checkout", kind: intent.kind });
      params.set("bundle", String(intent.bundle));
      return `/auth/post-login?${params.toString()}`;
    }
  };

  const buildAnonymousPurchaseHref = (intent: PricingCheckoutIntent) => {
    if (intent.kind === "membership") {
      const redirectParams = new URLSearchParams({
        subscribe: "1",
        interval: intent.interval,
        source: "pricing",
      });
      return `/login?redirect=${encodeURIComponent(`/dashboard/membership?${redirectParams.toString()}`)}`;
    } else {
      const postLoginParams = new URLSearchParams({
        intent: "pricing-checkout",
        kind: intent.kind,
      });
      postLoginParams.set("bundle", String(intent.bundle));
      return `/login?redirect=${encodeURIComponent(`/auth/post-login?${postLoginParams.toString()}`)}`;
    }
  };

  const getPurchaseHref = (intent: PricingCheckoutIntent) =>
    isAuthenticated ? buildAuthenticatedPurchaseHref(intent) : buildAnonymousPurchaseHref(intent);

  const monthlyPrice = pricing?.membershipDisplay?.movewellMonthly ?? 29;
  const annualPrice = pricing?.membershipDisplay?.movewellAnnual ?? 290;
  const trialDays = pricing?.membershipDisplay?.trialDays ?? 14;
  const credits1Price = pricing?.credits[1] ?? 9;
  const credits3Price = pricing?.credits[3] ?? 24;
  const credits10Price = pricing?.credits[10] ?? 70;
  const creditsExpiryDays = pricing?.creditsExpiryDays ?? 90;
  const credits3Savings = Math.max(0, credits1Price * 3 - credits3Price);
  const credits10Savings = Math.max(0, credits1Price * 10 - credits10Price);
  const credits3SavingsPct =
    credits1Price > 0 ? Math.round((credits3Savings / (credits1Price * 3)) * 100) : 0;
  const credits10SavingsPct =
    credits1Price > 0 ? Math.round((credits10Savings / (credits1Price * 10)) * 100) : 0;

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/public/pricing", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as PublicPricingDto;
        if (active) setPricing(payload);
      } catch {
        // Fall back to static values in the UI.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Layout>
      <SEO
        title="Pricing - Shruti Turner"
        description="Simple, transparent pricing for adaptive strength, yoga, mobility and conditioning classes. One membership for all live classes, or flexible credit packs."
        keywords="strength coaching pricing, yoga pricing, chronic illness coaching cost, adaptive yoga rates, online fitness class pricing"
        canonicalUrl="https://shrutiturner.co.uk/pricing"
      />

      <EditorialHero
        eyebrow="Pricing"
        size="compact"
        title={
          <>
            Transparent pricing for classes that are
            <span className="text-brand-accent-light"> built to be sustainable.</span>
          </>
        }
        description="Choose the all-access membership if you want weekly rhythm. Choose credit packs if you need more flexibility. Either way, you are entering the same adaptive teaching environment."
        primaryCta={{ href: "#membership", label: "See Membership" }}
        secondaryCta={{ href: "#credits", label: "See Credit Packs" }}
        stats={[
          { value: `£${monthlyPrice}`, label: "Monthly membership" },
          { value: `${trialDays} days`, label: "Included trial" },
        ]}
        metrics={[
          {
            label: "Best For",
            detail:
              "Membership suits regular attendance. Credits suit variable schedules or trialling the space.",
          },
          {
            label: "Classes Included",
            detail: "Yoga, mobility, strengthand cardio all live under the same pricing model.",
          },
          {
            label: "Confidence",
            detail:
              "No hidden layers, no hard sell. Just a clearer fit based on how often you want to come.",
          },
        ]}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl rounded-[2rem] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">
              Best fit guidance
            </p>
            <div className="mt-5 grid gap-4">
              <div className="bg-brand-white/10 rounded-[1.35rem] p-5">
                <p className="text-brand-white text-sm font-medium">Choose membership if</p>
                <p className="text-brand-white/80 mt-2 text-sm leading-relaxed">
                  You want regular weekly practice, access to all class types and the simplest way
                  to keep momentum.
                </p>
              </div>
              <div className="bg-brand-accent-light/12 rounded-[1.35rem] p-5">
                <p className="text-brand-white text-sm font-medium">Choose credits if</p>
                <p className="text-brand-white/80 mt-2 text-sm leading-relaxed">
                  You need flexibility, want to try the classes first, or your schedule changes from
                  week to week.
                </p>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What the pricing is designed to encourage"
        description="The pricing structure is meant to support a consistent practice, not create friction or guilt around attendance."
        items={[
          {
            label: "Membership",
            detail: "Best value when classes are part of your regular weekly rhythm.",
          },
          {
            label: "Credits",
            detail: "Useful for variable energy, travel, or trying the space before committing.",
          },
          {
            label: "Flexibility",
            detail: "No penalties for missed classes on membership and no auto-renewal on credits.",
          },
          {
            label: "Support",
            detail: "Sliding scale spots are available in limited numbers for financial hardship.",
          },
        ]}
      />

      <MarketingSection className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Membership"
          title="Move Well Membership"
          description="One membership for all live weekly classes. Best if you want consistency, variety and less friction around deciding what to attend."
          align="center"
        />

        <div id="membership" className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="border-brand-dark/10 bg-background rounded-[1.9rem] border p-8 shadow-[0_20px_50px_rgba(46,31,51,0.06)]">
            <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">Monthly</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl">£{monthlyPrice}</span>
              <span className="text-muted-foreground pb-1">/ month</span>
            </div>
            <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
              Best if you want flexibility and prefer not to commit annually yet.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited classes across all categories",
                "Yoga, mobility, strengthand cardio included",
                "No penalties for missed classes",
                "Early access to programmes and workshops",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline" className="mt-8 w-full">
              <Link href={getPurchaseHref({ kind: "membership", interval: "monthly" })}>
                Choose monthly
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>

          <article className="border-brand-accent/25 bg-brand-dark text-brand-white relative rounded-[1.9rem] border-2 p-8 shadow-[0_28px_60px_rgba(46,31,51,0.14)]">
            <span className="bg-brand-white text-brand-dark absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
              Recommended
            </span>
            <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">Annual</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl">£{annualPrice}</span>
              <span className="text-brand-white/80 pb-1">/ year</span>
            </div>
            <p className="text-brand-accent-light mt-3 text-sm">
              Save £{Math.max(0, monthlyPrice * 12 - annualPrice)} and keep the same all-access
              membership.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited classes across all categories",
                "Two months effectively free compared with monthly pricing",
                "Early access to programmes and workshops",
                "10% off all programmes and workshops",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-brand-white/82">{item}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 mt-8 w-full"
            >
              <Link href={getPurchaseHref({ kind: "membership", interval: "annual" })}>
                Choose annual
                <Crown className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-brand-white/75 mt-5 text-center text-xs">
              Includes {trialDays} days to try before the first charge unless cancelled.
            </p>
          </article>
        </div>

        <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cancel anytime
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4" />
            Trial included
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Founding members remain at £25/month
          </span>
        </div>

        <div className="border-brand-dark/10 bg-background mt-8 rounded-[1.6rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
          <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
            Key subscription information
          </p>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            {[
              `The membership renews automatically until you cancel.`,
              `A ${trialDays}-day free trial applies before the first paid term.`,
              `You can cancel online from your membership dashboard.`,
              `You have an initial 14-day cooling-off right after signup, plus a further 14-day cooling-off right after trial conversion and annual renewals.`,
              `Separate reminder notices are sent before the trial ends, before annual renewals and every 6 months for rolling monthly memberships.`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Credit Packs"
          title="Pay as you go"
          description="Use credits on any class type. Best if you want flexibility or are still feeling out what rhythm works for your body."
          align="center"
        />

        <div id="credits" className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: "Single class",
              price: credits1Price,
              perClass: `£${credits1Price} per class`,
              bundle: 1 as const,
              cta: "Buy single credit",
              highlight: false,
              savings: null,
            },
            {
              title: "3-class pack",
              price: credits3Price,
              perClass: `£${Math.floor(credits3Price / 3)} per class`,
              bundle: 3 as const,
              cta: "Buy 3-pack",
              highlight: false,
              savings:
                credits3Savings > 0
                  ? `Save £${credits3Savings} (${credits3SavingsPct}% off)`
                  : null,
            },
            {
              title: "10-class pack",
              price: credits10Price,
              perClass: `£${Math.floor(credits10Price / 10)} per class`,
              bundle: 10 as const,
              cta: "Buy 10-pack",
              highlight: true,
              savings:
                credits10Savings > 0
                  ? `Save £${credits10Savings} (${credits10SavingsPct}% off)`
                  : null,
            },
          ].map((item) => (
            <article
              key={item.title}
              className={`relative rounded-[1.75rem] border p-7 text-center shadow-[0_20px_50px_rgba(46,31,51,0.06)] ${
                item.highlight
                  ? "border-brand-copper/30 bg-brand-warm"
                  : "border-brand-dark/10 bg-background"
              }`}
            >
              {item.highlight ? (
                <span className="bg-brand-dark text-brand-white absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                  Best value
                </span>
              ) : null}
              <p className="text-brand-dark text-xs tracking-[0.2em] uppercase">{item.title}</p>
              <p className="mt-4 text-5xl">£{item.price}</p>
              <p className="text-muted-foreground mt-3 text-sm">{item.perClass}</p>
              {item.savings ? (
                <div className="bg-brand-accent/8 text-brand-accent mt-5 rounded-full px-4 py-2 text-xs">
                  {item.savings}
                </div>
              ) : null}
              <ul className="mt-8 space-y-3 text-left">
                {["Any class type", `${creditsExpiryDays}-day validity`, "No subscription"].map(
                  (feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  )
                )}
              </ul>
              <Button
                asChild
                size="lg"
                variant={item.highlight ? "default" : "outline"}
                className={`mt-8 w-full ${
                  item.highlight ? "bg-brand-dark text-brand-white hover:bg-brand-plum" : ""
                }`}
              >
                <Link href={getPurchaseHref({ kind: "credits", bundle: item.bundle })}>
                  {item.cta}
                  {item.highlight ? <ArrowRight className="h-4 w-4" /> : null}
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Valid for {creditsExpiryDays} days
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            No auto-renewal
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cancel 4+ hours before class to keep your credit
          </span>
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Coaching"
          title="Coaching offers matched to the support you need"
          description="Enquire first and Shruti will recommend the appropriate route before subscription checkout opens."
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
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Coaching tier comparison showing price, support level, membership inclusion and next
                step.
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
                    Membership
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
                    <td className="text-muted-foreground px-5 py-5 align-top">Separate</td>
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

      <MarketingSection className="section-divider" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Small Group Programmes"
          title="Focused programme blocks"
          description="Small-group programmes give you a fixed cohort, live feedback and a clearer progression when weekly classes are not quite enough."
          align="center"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {programmeCards.map((programme) => (
            <article
              key={programme.id}
              className="border-brand-dark/10 bg-background flex flex-col rounded-[1.75rem] border p-7 shadow-[0_20px_50px_rgba(46,31,51,0.06)]"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.16em] uppercase">
                <span className="bg-brand-accent/8 text-brand-accent rounded-full px-3 py-1">
                  {programme.durationLabel}
                </span>
                <span className="bg-brand-dark/6 text-brand-dark rounded-full px-3 py-1">
                  {programme.sessionsPerWeek} sessions/week
                </span>
              </div>
              <h3 className="mt-5 text-3xl leading-tight">{programme.title}</h3>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {programme.summary}
              </p>
              <div className="mt-6">
                <p className="text-4xl" aria-label={`${programme.priceLabel} per programme`}>
                  {programme.priceLabel}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Per programme, cohort capped at {programme.cohortSize}
                </p>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {programme.inclusions.map((inclusion) => (
                  <li key={inclusion} className="flex items-start gap-3 text-sm">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-muted-foreground">{inclusion}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="mt-8 w-full">
                <Link href={programme.ctaHref}>
                  View programme
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
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
        title="Pick the option that makes showing up easier, not harder."
        description="The right choice depends less on motivation and more on the rhythm your body and life can genuinely support."
        actions={[
          {
            href: "/schedule",
            label: "View schedule",
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

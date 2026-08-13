"use client";

import { ArrowRight, Check, Smartphone } from "lucide-react";
import { Layout } from "@/components/layout";
import {
  EditorialHero,
  JourneySection,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { coachingTiers, personalProgrammeJourney } from "@/data/marketing";

const independentTier = coachingTiers.find((tier) => tier.id === "independent_training_plan");

const independentPlanProof = [
  {
    label: "Format",
    detail:
      "Programming is delivered through Everfit so your workouts, habits and notes stay in one place.",
  },
  {
    label: "Support",
    detail:
      "This is lower-touch than coaching, but it is still tailored and reviewed around your feedback.",
  },
  {
    label: "Best Fit",
    detail: "Good for people who want expert structure without needing live calls every week.",
  },
  {
    label: "Pacing",
    detail: "Programming is designed for good days, average days and flare days from the outset.",
  },
] as const;

export function CoachingPersonalProgrammePage() {
  if (!independentTier) return null;

  return (
    <Layout>
      <SEO
        title="Independent Training Plan - Shruti Turner"
        description="Tailored training delivered through Everfit for chronic illness, autoimmune conditions, wellbeing and injury recovery without weekly live coaching."
        canonicalUrl="https://shrutiturner.co.uk/coaching/personal-programme"
      />

      <EditorialHero
        eyebrow="Coaching"
        size="compact"
        title={
          <>
            Expert programming for people who want
            <span className="text-brand-accent-light"> structure without weekly calls.</span>
          </>
        }
        description="The Independent Training Plan is the lower-friction coaching route: tailored programming, monthly review and clearer training decisions delivered through Everfit."
        primaryCta={{ href: "/coaching", label: "Compare Options" }}
        secondaryCta={{ href: "/coaching", label: "Explore Coaching" }}
        stats={[
          { value: independentTier.priceLabel, label: "Monthly investment" },
          { value: "Enquire", label: "Required before payment" },
          { value: "Everfit", label: "Programme delivery platform" },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
                <div className="bg-brand-accent-light/12 text-brand-accent-light flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Smartphone className="h-6 w-6" />
                </div>
                <p className="text-brand-accent-light mt-5 text-xs tracking-[0.18em] uppercase">
                  Delivered in Everfit
                </p>
                <h2 className="mt-3 text-3xl leading-tight">
                  Your plan, check-ins and training rhythm in one place.
                </h2>
                <p className="text-brand-white/82 mt-4 text-sm leading-relaxed">
                  You get personalised programming, habits and review notes without needing to
                  coordinate weekly live sessions.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Programming built around your current capacity and constraints.",
                    "Monthly written review instead of a generic template refresh.",
                    "A calmer route into specialist support when full coaching feels like too much.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.2rem] border px-4 py-4 text-sm leading-relaxed"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What this route is designed to do"
        description="It gives you specialist programming and review without adding the cost or scheduling weight of higher-touch coaching."
        items={[...independentPlanProof]}
      />

      <MarketingSection className="section-wash">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div>
            <SectionHeading
              eyebrow="What’s Included"
              title="A lower-touch route with real structure behind it."
              description="This is not a template library. It is personalised programming with enough feedback to keep it moving in the right direction."
            />
            <div className="mt-8 grid gap-4">
              {independentTier.features.map((feature) => (
                <div
                  key={feature}
                  className="border-brand-dark/10 bg-background rounded-[1.5rem] border px-5 py-5 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-accent/10 text-brand-accent flex h-9 w-9 items-center justify-center rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{feature}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="marketing-panel rounded-[1.8rem] p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                Who it suits best
              </p>
              <ul className="text-muted-foreground mt-5 space-y-4 text-sm leading-relaxed">
                <li className="flex items-start gap-3">
                  <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                  You want better structure and fewer decisions when symptoms fluctuate.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                  You are comfortable training independently between reviews.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                  You do not need weekly live accountability to keep moving.
                </li>
              </ul>
            </div>

            <div className="border-brand-dark/10 bg-background rounded-[1.8rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">Price and note</p>
              <h2 className="mt-4 text-3xl">{independentTier.priceLabel}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {independentTier.priceNote}. Payment is invited once you and Shruti have agreed the
                appropriate support, rather than started from this page.
              </p>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="How It Works"
          title="Enquire first, then move into Everfit after payment."
          description="A conversation comes first so the offer, boundaries and setup are clear before subscription checkout opens."
          align="center"
        />
        <div className="mt-12">
          <JourneySection
            steps={personalProgrammeJourney.map((step) => ({
              title: step.title,
              description: step.description,
            }))}
          />
        </div>
      </MarketingSection>

      <PreFooterCtaSection
        layout="centered"
        title="Ready to start with a lower-touch coaching route?"
        description="Start here if you want specialist programming now and the option to step into more support later."
        actions={[
          {
            href: "/coaching",
            label: "Compare Options",
            icon: ArrowRight,
          },
          {
            href: independentTier.ctaHref,
            label: "Enquire First",
            variant: "secondary",
          },
        ]}
      />
    </Layout>
  );
}

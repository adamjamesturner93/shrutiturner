"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { ArrowRight, Check, Smartphone } from "lucide-react";
import { coachingTiers, personalProgrammeJourney } from "@/data/marketing";

const independentTier = coachingTiers.find((tier) => tier.id === "independent-plan");

export function CoachingPersonalProgrammePage() {
  if (!independentTier) return null;

  return (
    <Layout>
      <SEO
        title="Independent Training Plan - Shruti Turner"
        description="Tailored training delivered through Everfit for complex bodies that need smart structure without weekly live coaching."
        canonicalUrl="https://shrutiturner.com/coaching/personal-programme"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-brand-accent-light mb-4 text-sm tracking-[0.2em] uppercase">
            Coaching
          </p>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">{independentTier.name}</h1>
          <p className="text-brand-accent-light mx-auto mb-8 max-w-2xl text-xl leading-relaxed md:text-2xl">
            Expert programming delivered through Everfit for people who want a lower-friction way to
            train with more confidence and less guesswork.
          </p>
          <div className="border-brand-white/20 text-brand-white/80 inline-flex rounded-full border px-4 py-2 text-sm">
            {independentTier.priceLabel} · {independentTier.priceNote}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-10 md:grid-cols-[1fr_0.9fr]">
            <div>
              <h2 className="mb-4 text-3xl md:text-4xl">What&apos;s Included</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                This tier is for clients who want specialist programming and a clear training
                structure, without the cost or scheduling complexity of live coaching every week.
              </p>
              <ul className="space-y-3">
                {independentTier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary/20 rounded-xl border p-6">
                <div className="bg-brand-accent/10 text-brand-accent mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-2xl">Delivered in Everfit</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your workouts, habits, and check-ins live in Everfit so the day-to-day training
                  experience stays simple and consistent.
                </p>
              </div>

              <div className="bg-background rounded-xl border p-6">
                <h3 className="mb-3 text-xl">Who this works best for</h3>
                <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
                  <li>You are comfortable training independently between reviews.</li>
                  <li>You want smart structure and fewer decisions on flare days.</li>
                  <li>You do not need regular live calls or high-touch accountability.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-3xl md:text-4xl">How It Works</h2>
          <div className="space-y-5">
            {personalProgrammeJourney.map((step) => (
              <div
                key={step.step}
                className="bg-background flex items-start gap-5 rounded-xl border p-6"
              >
                <div className="bg-bronze text-brand-white flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm">
                  {step.step}
                </div>
                <div>
                  <h3 className="mb-1 text-lg">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-accent text-brand-white py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl md:text-4xl">Ready to Get Started?</h2>
          <p className="mb-8 text-lg opacity-90">
            Start with lower-touch support now, and move into coached support later if you need more
            structure or accountability.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/pricing#coaching">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                View Pricing & Next Steps
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/coaching">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Compare All Coaching Tiers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

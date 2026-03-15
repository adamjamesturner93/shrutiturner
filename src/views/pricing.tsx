"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  MessageCircle,
  Clock,
  Shield,
  Star,
  Crown,
  Ticket,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { useEffect, useMemo, useState } from "react";
import type { FaqItemContent } from "@/lib/content";
import type { PublicPricingDto } from "@/lib/api/types";
import { coachingTiers } from "@/data/marketing";

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
    answer: "All credit packs expire 90 days after purchase. They don't auto-renew.",
    sortOrder: 30,
  },
  {
    slug: "cancellation",
    question: "What's the cancellation policy?",
    answer:
      "Membership: cancel anytime and keep access until the end of your billing period. Credit packs: cancel 4+ hours before class to get your credit back.",
    sortOrder: 40,
  },
  {
    slug: "affordability",
    question: "What if I can't afford these prices?",
    answer:
      "Limited sliding scale spots are available for people on disability benefits or experiencing financial hardship.",
    sortOrder: 50,
  },
  {
    slug: "coaching-pricing",
    question: "How does coaching pricing work?",
    answer:
      "Every coaching engagement is different. Your goals, support needs, and the level of guidance you want determine the best fit. Start with the tier that suits you or apply for a tailored recommendation.",
    sortOrder: 60,
  },
];

export function PricingPage({ faqs }: PricingPageProps) {
  const { isAuthenticated } = useAuth();
  const [pricing, setPricing] = useState<PublicPricingDto | null>(null);

  const activeFaqs = useMemo(
    () =>
      (faqs && faqs.length > 0 ? faqs : DEFAULT_PRICING_FAQS).sort(
        (a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)
      ),
    [faqs]
  );

  const buildAuthenticatedPurchaseHref = (intent: PricingCheckoutIntent) => {
    const params = new URLSearchParams({ intent: "pricing-checkout", kind: intent.kind });
    if (intent.kind === "membership") {
      params.set("interval", intent.interval);
    } else {
      params.set("bundle", String(intent.bundle));
    }
    return `/auth/post-login?${params.toString()}`;
  };

  const buildAnonymousPurchaseHref = (intent: PricingCheckoutIntent) => {
    const postLoginParams = new URLSearchParams({
      intent: "pricing-checkout",
      kind: intent.kind,
    });

    if (intent.kind === "membership") {
      postLoginParams.set("interval", intent.interval);
    } else {
      postLoginParams.set("bundle", String(intent.bundle));
    }

    return `/login?redirect=${encodeURIComponent(`/auth/post-login?${postLoginParams.toString()}`)}`;
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
        // Keep fallback values in UI.
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
        description="Simple, transparent pricing for adaptive strength, yoga, mobility, and conditioning classes. One membership for all live classes, or flexible credit packs."
        keywords="strength coaching pricing, yoga pricing, chronic illness coaching cost, adaptive yoga rates, online fitness class pricing"
        canonicalUrl="https://shrutiturner.com/pricing"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl md:text-5xl">Move Well Membership</h1>
          <p className="text-brand-white/80 mb-2 text-lg leading-relaxed">
            Access all live classes each week
          </p>
          <p className="text-brand-accent-light mb-10">Yoga · Mobility · Strength · Cardio</p>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="border-brand-white/10 bg-brand-white/5 space-y-5 rounded-2xl border p-8 text-left">
              <div>
                <p className="text-brand-white/60 text-sm tracking-wide uppercase">Monthly</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-brand-white text-5xl">£{monthlyPrice}</span>
                  <span className="text-brand-white/60">/ month</span>
                </div>
              </div>
              <ul className="text-brand-white/85 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  Unlimited classes
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  All class types included
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  No penalties for missed classes
                </li>
                <li className="flex items-start gap-2">
                  <Star className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  Early access to programmes
                </li>
              </ul>
              <Link href={getPurchaseHref({ kind: "membership", interval: "monthly" })}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-brand-white/30 text-brand-white hover:bg-brand-white/10 w-full bg-transparent"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-brand-white/40 pt-1 text-center text-xs">
                Includes {trialDays} days to try - first charge after trial unless cancelled
              </p>
            </div>
            <div className="border-brand-accent-light/50 bg-brand-white/10 relative space-y-5 rounded-2xl border p-8 text-left shadow-lg">
              <span className="bg-brand-accent-light text-brand-dark absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium">
                <Crown className="h-3.5 w-3.5" />
                Recommended
              </span>
              <div>
                <p className="text-brand-white/60 text-sm tracking-wide uppercase">Annual</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-brand-white text-5xl">£{annualPrice}</span>
                  <span className="text-brand-white/60">/ year</span>
                </div>
                <p className="text-brand-accent-light mt-2 text-sm">
                  Save £{Math.max(0, monthlyPrice * 12 - annualPrice)} - that's 2 months free
                </p>
              </div>
              <ul className="text-brand-white/85 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  Unlimited classes
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  All class types included
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  No penalties for missed classes
                </li>
                <li className="flex items-start gap-2">
                  <Star className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  Early access to programmes
                </li>
                <li className="bg-brand-accent-light/10 text-brand-accent-light -mx-2 flex items-start gap-2 rounded-lg px-2 py-2">
                  <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                  10% off all programmes & workshops
                </li>
              </ul>
              <Link href={getPurchaseHref({ kind: "membership", interval: "annual" })}>
                <Button
                  size="lg"
                  className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 w-full"
                >
                  Get Started - Save £{Math.max(0, monthlyPrice * 12 - annualPrice)}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-brand-white/40 pt-1 text-center text-xs">
                Includes {trialDays} days to try - first charge after trial unless cancelled
              </p>
            </div>
          </div>

          <div className="text-brand-white/50 mt-8 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <p className="text-sm">Every membership begins with {trialDays} days on us.</p>
          </div>

          <p className="text-brand-white/55 mx-auto mt-5 max-w-2xl text-sm leading-relaxed">
            By continuing to checkout, you agree to the{" "}
            <Link href="/terms" className="underline">
              Terms & Conditions
            </Link>{" "}
            and can review the{" "}
            <Link href="/refund-policy" className="underline">
              Refund & Cancellation Policy
            </Link>
            .
          </p>

          <p className="text-brand-white/40 mt-6 text-sm">Founding members remain at £25/month.</p>
        </div>
      </section>

      <section className="border-b py-10 md:py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground leading-relaxed">
            Classes include yoga, mobility, strength and conditioning — designed for real bodies and
            long-term joint health.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <div className="bg-bronze/10 text-bronze-text mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
              <Ticket className="h-4 w-4" />
              <span>Flexible Credits</span>
            </div>
            <h2 className="mb-3 text-2xl md:text-3xl">Pay As You Go</h2>
            <p className="text-muted-foreground mx-auto max-w-lg">
              Use credits on any class - Yoga, Strength, Cardio, or Stretch. Mix and match however
              suits you.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-3">
            <div className="group bg-background hover:border-bronze/30 space-y-4 rounded-xl border p-6 text-center transition-all hover:shadow-lg">
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">Single class</p>
                <p className="text-bronze-text text-4xl">£{credits1Price}</p>
                <p className="text-muted-foreground text-xs">per class</p>
              </div>
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={getPurchaseHref({ kind: "credits", bundle: 1 })}>
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Buy Credit
                </Button>
              </Link>
            </div>

            <div className="group bg-background hover:border-bronze/30 space-y-4 rounded-xl border p-6 text-center transition-all hover:shadow-lg">
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">3-class bundle</p>
                <p className="text-bronze-text text-4xl">£{credits3Price}</p>
                <p className="text-muted-foreground text-xs">
                  £{Math.floor(credits3Price / 3)} per class
                </p>
              </div>
              {credits3Savings > 0 ? (
                <div className="bg-brand-accent/8 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-brand-accent text-xs">
                    Save £{credits3Savings} ({credits3SavingsPct}% off)
                  </span>
                </div>
              ) : null}
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={getPurchaseHref({ kind: "credits", bundle: 3 })}>
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Buy 3-Pack
                </Button>
              </Link>
            </div>

            <div className="group border-bronze/30 bg-bronze/5 relative space-y-4 rounded-xl border-2 p-6 text-center transition-all hover:shadow-lg">
              <span className="bg-bronze absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-1 text-xs whitespace-nowrap text-white">
                <Sparkles className="h-3 w-3" />
                Best Value
              </span>
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">10-class bundle</p>
                <p className="text-bronze-text text-4xl">£{credits10Price}</p>
                <p className="text-muted-foreground text-xs">
                  £{Math.floor(credits10Price / 10)} per class
                </p>
              </div>
              {credits10Savings > 0 ? (
                <div className="bg-brand-accent/8 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-brand-accent text-xs">
                    Save £{credits10Savings} ({credits10SavingsPct}% off)
                  </span>
                </div>
              ) : null}
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={getPurchaseHref({ kind: "credits", bundle: 10 })}>
                <Button size="sm" className="bg-bronze hover:bg-bronze/90 w-full text-white">
                  Buy 10-Pack
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-muted-foreground mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Valid for {creditsExpiryDays} days · No auto-renewal
            </span>
            <span className="text-muted-foreground/30 hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Cancel 4+ hours before class to keep your credit
            </span>
          </div>

          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed">
            Credit-pack purchases are subject to the{" "}
            <Link href="/terms" className="text-primary underline">
              Terms & Conditions
            </Link>{" "}
            and the{" "}
            <Link href="/refund-policy" className="text-primary underline">
              Refund & Cancellation Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <blockquote className="bg-background border-l-primary rounded-lg border border-l-3 p-6">
              <p className="text-muted-foreground mb-3 leading-relaxed italic">
                "This is the first time I've felt safe getting stronger."
              </p>
              <footer className="text-sm">— Rebecca, Psoriatic Arthritis</footer>
            </blockquote>
            <blockquote className="bg-background border-l-primary rounded-lg border border-l-3 p-6">
              <p className="text-muted-foreground mb-3 leading-relaxed italic">
                "Classes actually make my joints feel better, not worse."
              </p>
              <footer className="text-sm">— James, Rheumatoid Arthritis</footer>
            </blockquote>
            <blockquote className="bg-background border-l-primary rounded-lg border border-l-3 p-6">
              <p className="text-muted-foreground mb-3 leading-relaxed italic">
                "It's the only online space that understands hypermobility."
              </p>
              <footer className="text-sm">— Elena, hEDS</footer>
            </blockquote>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs italic">
            [Placeholder testimonials — real testimonials to be added]
          </p>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">Coaching</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Three tiers of personalised support for complex bodies, from lower-touch programming
              to high-touch 1:1 coaching.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {coachingTiers.map((tier) => {
              const highlighted = tier.id === "coached-plan";
              const highest = tier.id === "coaching";

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border-2 p-7 ${
                    highlighted
                      ? "border-brand-accent/40 bg-brand-accent/5 shadow-lg"
                      : highest
                        ? "border-brand-dark/30"
                        : "border-border/60"
                  }`}
                >
                  {highlighted ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-accent text-brand-white rounded-full px-4 py-1.5 text-xs">
                        Recommended
                      </span>
                    </div>
                  ) : null}
                  {highest ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-dark text-brand-white rounded-full px-4 py-1.5 text-xs">
                        Highest Support
                      </span>
                    </div>
                  ) : null}

                  <div className="mb-5">
                    <h3 className="text-2xl">{tier.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm italic">{tier.tagline}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-brand-dark text-3xl">{tier.priceLabel}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{tier.priceNote}</p>
                  </div>
                  <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
                    {tier.description}
                  </p>
                  <ul className="mb-8 flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.ctaHref}>
                    <Button
                      size="lg"
                      variant={tier.purchaseModel === "application" ? "default" : "outline"}
                      className={`w-full ${
                        highlighted
                          ? "bg-brand-accent hover:bg-brand-accent/90 text-white"
                          : highest
                            ? "bg-brand-dark hover:bg-brand-dark/90 text-white"
                            : ""
                      }`}
                    >
                      {tier.ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-muted-foreground text-sm">
              Limited sliding scale spots available for those on disability benefits or experiencing
              financial hardship.{" "}
              <Link href="/contact" className="text-primary underline">
                Get in touch to discuss
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">Retreats</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Multi-day immersive experiences combining yoga, strength training, and community.
            </p>
          </div>

          <div className="bg-background rounded-lg border p-8 md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-2xl">Retreat Pricing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Retreat prices vary by location, duration, and accommodation. Early bird pricing
                  is available for bookings 60+ days in advance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Typical range:</span>
                    <span className="text-xl">£950 - £1,650</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Early bird savings:</span>
                    <span className="text-lg">Up to £200</span>
                  </div>
                </div>
                <p className="text-muted-foreground pt-4 text-sm">
                  All retreats include accommodation, meals, all sessions, and transfers (where
                  applicable).
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/retreats">
                  <Button size="lg" className="w-full">
                    View All Retreats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-center text-sm">
                  Payment plans available. Travel insurance required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">Common Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {activeFaqs.map((faq) => (
              <AccordionItem key={faq.slug} value={faq.slug}>
                <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to Start Moving?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Try a single class for £{credits1Price}, or join the membership and access every live
            class from day one.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href={getPurchaseHref({ kind: "membership", interval: "monthly" })}>
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                Join Membership
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Browse the Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: activeFaqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </Layout>
  );
}

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

interface PricingPageProps {
  faqs?: FaqItemContent[];
}

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
    answer:
      "All credit packs expire 90 days after purchase. They don't auto-renew.",
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
    slug: "one-to-one-pricing",
    question: "How does 1:1 pricing work?",
    answer:
      "Every 1:1 engagement is different — your conditions, goals, and support needs determine the programming. Submit an enquiry and you'll receive a clear quote.",
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

  const purchaseLink = isAuthenticated ? "/dashboard/membership" : "/login";
  const monthlyPrice = pricing?.membershipDisplay?.movewellMonthly ?? 29;
  const annualPrice = pricing?.membershipDisplay?.movewellAnnual ?? 290;
  const trialDays = pricing?.membershipDisplay?.trialDays ?? 14;
  const credits1Price = pricing?.credits[1] ?? 9;
  const credits3Price = pricing?.credits[3] ?? 24;
  const credits10Price = pricing?.credits[10] ?? 70;
  const creditsExpiryDays = pricing?.creditsExpiryDays ?? 90;
  const credits3Savings = Math.max(0, credits1Price * 3 - credits3Price);
  const credits10Savings = Math.max(0, credits1Price * 10 - credits10Price);
  const credits3SavingsPct = credits1Price > 0 ? Math.round((credits3Savings / (credits1Price * 3)) * 100) : 0;
  const credits10SavingsPct = credits1Price > 0 ? Math.round((credits10Savings / (credits1Price * 10)) * 100) : 0;

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

      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl md:text-5xl">Move Well Membership</h1>
          <p className="mb-2 text-lg leading-relaxed text-[#FAFAF8]/80">
            Access all live classes each week
          </p>
          <p className="mb-10 text-[#B5C49B]">Yoga · Mobility · Strength · Cardio</p>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="space-y-5 rounded-2xl border border-[#FAFAF8]/10 bg-[#FAFAF8]/5 p-8 text-left">
              <div>
                <p className="text-sm uppercase tracking-wide text-[#FAFAF8]/60">Monthly</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl text-[#FAFAF8]">£{monthlyPrice}</span>
                  <span className="text-[#FAFAF8]/60">/ month</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-[#FAFAF8]/85">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  Unlimited classes
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  All class types included
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  No penalties for missed classes
                </li>
                <li className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  Early access to programmes
                </li>
              </ul>
              <Link href={`${purchaseLink}${isAuthenticated ? "?interval=monthly" : ""}`}>
                <Button size="lg" variant="outline" className="w-full border-[#FAFAF8]/30 bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="pt-1 text-center text-xs text-[#FAFAF8]/40">
                Includes {trialDays} days to try - first charge after trial unless cancelled
              </p>
            </div>
            <div className="relative space-y-5 rounded-2xl border border-[#B5C49B]/50 bg-[#FAFAF8]/10 p-8 text-left shadow-lg">
              <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#B5C49B] px-4 py-1.5 text-xs font-medium text-[#2E1F33]">
                <Crown className="h-3.5 w-3.5" />
                Recommended
              </span>
              <div>
                <p className="text-sm uppercase tracking-wide text-[#FAFAF8]/60">Annual</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl text-[#FAFAF8]">£{annualPrice}</span>
                  <span className="text-[#FAFAF8]/60">/ year</span>
                </div>
                <p className="mt-2 text-sm text-[#B5C49B]">Save £{Math.max(0, monthlyPrice * 12 - annualPrice)} - that's 2 months free</p>
              </div>
              <ul className="space-y-2 text-sm text-[#FAFAF8]/85">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  Unlimited classes
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  All class types included
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  No penalties for missed classes
                </li>
                <li className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  Early access to programmes
                </li>
                <li className="-mx-2 flex items-start gap-2 rounded-lg bg-[#B5C49B]/10 px-2 py-2 text-[#B5C49B]">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B5C49B]" />
                  10% off all programmes & workshops
                </li>
              </ul>
              <Link href={`${purchaseLink}${isAuthenticated ? "?interval=annual" : ""}`}>
                <Button size="lg" className="w-full bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                  Get Started - Save £{Math.max(0, monthlyPrice * 12 - annualPrice)}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="pt-1 text-center text-xs text-[#FAFAF8]/40">
                Includes {trialDays} days to try - first charge after trial unless cancelled
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[#FAFAF8]/50">
            <Shield className="h-4 w-4" />
            <p className="text-sm">Every membership begins with {trialDays} days on us.</p>
          </div>

          <p className="mt-6 text-sm text-[#FAFAF8]/40">Founding members remain at £25/month.</p>
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#BB7345]/10 px-4 py-1.5 text-sm text-[#9B6535]">
              <Ticket className="h-4 w-4" />
              <span>Flexible Credits</span>
            </div>
            <h2 className="mb-3 text-2xl md:text-3xl">Pay As You Go</h2>
            <p className="text-muted-foreground mx-auto max-w-lg">
              Use credits on any class - Yoga, Strength, Cardio, or Stretch. Mix and match however suits you.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-3">
            <div className="group space-y-4 rounded-xl border bg-background p-6 text-center transition-all hover:border-[#BB7345]/30 hover:shadow-lg">
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">Single class</p>
                <p className="text-4xl text-[#9B6535]">£{credits1Price}</p>
                <p className="text-muted-foreground text-xs">per class</p>
              </div>
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={purchaseLink}>
                <Button variant="outline" size="sm" className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  Buy Credit
                </Button>
              </Link>
            </div>

            <div className="group space-y-4 rounded-xl border bg-background p-6 text-center transition-all hover:border-[#BB7345]/30 hover:shadow-lg">
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">3-class bundle</p>
                <p className="text-4xl text-[#9B6535]">£{credits3Price}</p>
                <p className="text-muted-foreground text-xs">£{Math.floor(credits3Price / 3)} per class</p>
              </div>
              {credits3Savings > 0 ? (
                <div className="rounded-lg bg-[#4B5B32]/8 px-3 py-1.5 text-center">
                  <span className="text-xs text-[#4B5B32]">Save £{credits3Savings} ({credits3SavingsPct}% off)</span>
                </div>
              ) : null}
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={purchaseLink}>
                <Button variant="outline" size="sm" className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  Buy 3-Pack
                </Button>
              </Link>
            </div>

            <div className="group relative space-y-4 rounded-xl border-2 border-[#BB7345]/30 bg-[#BB7345]/[0.03] p-6 text-center transition-all hover:shadow-lg">
              <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#BB7345] px-3.5 py-1 text-xs text-white">
                <Sparkles className="h-3 w-3" />
                Best Value
              </span>
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-sm">10-class bundle</p>
                <p className="text-4xl text-[#9B6535]">£{credits10Price}</p>
                <p className="text-muted-foreground text-xs">£{Math.floor(credits10Price / 10)} per class</p>
              </div>
              {credits10Savings > 0 ? (
                <div className="rounded-lg bg-[#4B5B32]/8 px-3 py-1.5 text-center">
                  <span className="text-xs text-[#4B5B32]">Save £{credits10Savings} ({credits10SavingsPct}% off)</span>
                </div>
              ) : null}
              <div className="space-y-2.5 border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>Any class type</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>{creditsExpiryDays}-day validity</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                  <span>No subscription</span>
                </div>
              </div>
              <Link href={purchaseLink}>
                <Button size="sm" className="w-full bg-[#BB7345] text-white hover:bg-[#a5653d]">
                  Buy 10-Pack
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Valid for {creditsExpiryDays} days · No auto-renewal
            </span>
            <span className="hidden text-muted-foreground/30 sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Cancel 4+ hours before class to keep your credit
            </span>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <blockquote className="bg-background rounded-lg border border-l-3 border-l-primary p-6">
              <p className="text-muted-foreground mb-3 italic leading-relaxed">
                "This is the first time I've felt safe getting stronger."
              </p>
              <footer className="text-sm">— Rebecca, Psoriatic Arthritis</footer>
            </blockquote>
            <blockquote className="bg-background rounded-lg border border-l-3 border-l-primary p-6">
              <p className="text-muted-foreground mb-3 italic leading-relaxed">
                "Classes actually make my joints feel better, not worse."
              </p>
              <footer className="text-sm">— James, Rheumatoid Arthritis</footer>
            </blockquote>
            <blockquote className="bg-background rounded-lg border border-l-3 border-l-primary p-6">
              <p className="text-muted-foreground mb-3 italic leading-relaxed">
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
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">1:1 Personal Training</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Fully personalised programming designed around your specific conditions, symptoms, and goals.
            </p>
          </div>

          <div className="bg-background border-primary mx-auto max-w-3xl rounded-lg border-2 p-8 md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-muted-foreground text-sm">From</span>
                    <span className="text-5xl">£75</span>
                    <span className="text-muted-foreground">/ session</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Pricing depends on your goals, session frequency, and level of support needed.
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" /><span className="text-sm">Comprehensive initial assessment</span></li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" /><span className="text-sm">Fully personalised training program</span></li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" /><span className="text-sm">60-min sessions (online or in-person)</span></li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" /><span className="text-sm">Ongoing messaging support</span></li>
                  <li className="flex items-start gap-3"><Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" /><span className="text-sm">Regular program adjustments</span></li>
                </ul>
              </div>

              <div className="space-y-6 text-center md:text-left">
                <div className="bg-secondary/30 space-y-3 rounded-lg p-6">
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <MessageCircle className="text-primary h-5 w-5" />
                    <h3 className="text-lg">Free Enquiry</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Submit an enquiry to discuss your goals and whether you're a good fit. No pressure.
                  </p>
                </div>
                <Link href="/pt">
                  <Button size="lg" className="w-full">
                    Submit an Enquiry
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-center text-xs">Payment plans available for longer engagements</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-muted-foreground text-sm">
              Limited sliding scale spots available for those on disability benefits or experiencing financial hardship. <Link href="/contact" className="text-primary underline">Get in touch to discuss</Link>.
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
                  Retreat prices vary by location, duration, and accommodation. Early bird pricing is available for bookings 60+ days in advance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between"><span className="text-muted-foreground">Typical range:</span><span className="text-xl">£950 - £1,650</span></div>
                  <div className="flex items-baseline justify-between"><span className="text-muted-foreground">Early bird savings:</span><span className="text-lg">Up to £200</span></div>
                </div>
                <p className="text-muted-foreground pt-4 text-sm">
                  All retreats include accommodation, meals, all sessions, and transfers (where applicable).
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/retreats">
                  <Button size="lg" className="w-full">
                    View All Retreats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-center text-sm">Payment plans available. Travel insurance required.</p>
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

      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to Start Moving?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Try a single class for £{credits1Price}, or join the membership and access every live class from day one.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href={purchaseLink}>
              <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
                Join Membership
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
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

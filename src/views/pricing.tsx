"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Calendar,
  Video,
  Users,
  Sparkles,
  MessageCircle,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import type { FaqItemContent } from "@/lib/content";

interface PricingPageProps {
  faqs?: FaqItemContent[];
}

const DEFAULT_PRICING_FAQS: FaqItemContent[] = [
  {
    slug: "faq-pricing-class-credits",
    question: "Can I use class credits on any class?",
    answer:
      "Yes. Drop-in, 3-class, and 10-class bundles can be used on any yoga, strength, or HIIT class in the schedule. Monthly membership classes work the same way.",
    sortOrder: 10,
  },
  {
    slug: "faq-pricing-bundles-vs-memberships",
    question: "What's the difference between bundles and memberships?",
    answer:
      "Bundles give you a set number of credits to use flexibly within a time window. Memberships give you a weekly class allowance that renews monthly. If you attend regularly, memberships are better value. If your attendance varies, bundles offer more flexibility.",
    sortOrder: 20,
  },
  {
    slug: "faq-pricing-refunds",
    question: "Do you offer refunds?",
    answer:
      "For 1:1 training: No refunds after sessions begin, but we can pause in case of illness or flare. For class bundles: Unused credits can be transferred to another person. For memberships: Cancel anytime with 30 days' notice. For retreats: See individual retreat cancellation policies.",
    sortOrder: 30,
  },
  {
    slug: "faq-pricing-affordability",
    question: "What if I can't afford these prices?",
    answer:
      "I hold a limited number of sliding scale spots for people on disability benefits or experiencing financial hardship. Please contact me directly. I want to make this accessible while maintaining the sustainability of the business.",
    sortOrder: 40,
  },
  {
    slug: "faq-pricing-insurance",
    question: "Is this covered by insurance?",
    answer:
      "Some private health insurance policies may cover 1:1 personal training or exercise therapy. Check with your provider. I can provide invoices and documentation to support your claim.",
    sortOrder: 50,
  },
  {
    slug: "faq-pricing-1-1-pricing",
    question: "How does the 1:1 pricing work?",
    answer:
      "Every 1:1 engagement is different. Your conditions, goals, and support needs determine the programming. Submit an enquiry and I'll provide a clear quote. There's no obligation and no hard sell.",
    sortOrder: 60,
  },
];

export function PricingPage({ faqs }: PricingPageProps) {
  const { isAuthenticated } = useAuth();
  const pricingFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_PRICING_FAQS;

  /** Where to send purchase/membership CTAs */
  const purchaseLink = isAuthenticated ? "/dashboard/membership" : "/signup";

  return (
    <Layout>
      <SEO
        title="Pricing - Shruti Turner"
        description="Transparent pricing for strength coaching, adaptive yoga, online classes, and retreats. Drop-in, class bundles, and monthly memberships for people with chronic illness and complex bodies."
        keywords="strength coaching pricing, yoga pricing, chronic illness coaching cost, adaptive yoga rates, online fitness class pricing"
        canonicalUrl="https://shrutiturner.com/pricing"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl md:text-5xl">Transparent Pricing</h1>
          <p className="text-xl leading-relaxed text-[#B5C49B]">
            Clear, honest pricing. No hidden costs, no contracts, no games.
          </p>
        </div>
      </section>

      {/* 1:1 Personal Training */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">1:1 Personal Training</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Fully personalised programming designed around your specific conditions, symptoms, and
              goals. Every engagement is custom.
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
                    We'll discuss everything via a free initial enquiry.
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Comprehensive initial assessment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Fully personalised training program</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">1:1 sessions (60 mins, online or in-person)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Ongoing messaging support between sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Regular program adjustments based on capacity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Progress tracking and detailed reporting</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6 text-center md:text-left">
                <div className="bg-secondary/30 space-y-3 rounded-lg p-6">
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <MessageCircle className="text-primary h-5 w-5" />
                    <h3 className="text-lg">Free Enquiry</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Submit an enquiry to discuss your goals, conditions, and whether we're a good
                    fit. No pressure, no hard sell.
                  </p>
                </div>
                <Link href="/pt">
                  <Button size="lg" className="w-full">
                    Submit an Enquiry
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-center text-xs">
                  Payment plans available for longer engagements
                </p>
              </div>
            </div>
          </div>

          {/* Sliding scale note */}
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

      {/* Class Credits */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">Class Credits</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Use credits on any yoga or strength class in the schedule. Flexible, no commitment.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {/* Drop-in / Single */}
            <div className="bg-background space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <Video className="text-primary h-8 w-8" />
              <h3 className="text-xl">Drop-In</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£12</span>
                <span className="text-muted-foreground">per class</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Perfect for trying a class or attending occasionally. No commitment needed.
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Single class access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  7-day recording access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Any class type
                </li>
              </ul>
              <Link href="/schedule">
                <Button variant="outline" className="w-full">
                  View Schedule
                </Button>
              </Link>
            </div>

            {/* 3-Class Bundle */}
            <div className="bg-background space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <Calendar className="text-primary h-8 w-8" />
              <h3 className="text-xl">3-Class Bundle</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£30</span>
                <span className="text-muted-foreground ml-1 text-sm line-through">£36</span>
              </div>
              <p className="text-muted-foreground text-sm">
                £10 per class. Valid for 4 weeks. Great for building a regular habit.
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />3 class credits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Valid for 4 weeks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Mix yoga & strength
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  7-day recording access
                </li>
              </ul>
              <Link href={purchaseLink}>
                <Button variant="outline" className="w-full">
                  Purchase Bundle
                </Button>
              </Link>
            </div>

            {/* 10-Class Bundle */}
            <div className="bg-background border-primary relative space-y-4 rounded-lg border-2 p-6 shadow-lg">
              <div className="bg-primary text-primary-foreground absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-4 py-1 text-sm">
                <Sparkles className="h-3 w-3" />
                Best Value
              </div>
              <Calendar className="text-primary h-8 w-8" />
              <h3 className="text-xl">10-Class Bundle</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£90</span>
                <span className="text-muted-foreground ml-1 text-sm line-through">£120</span>
              </div>
              <p className="text-muted-foreground text-sm">
                £9 per class — 25% off. Valid for 10 weeks. Serious about building capacity.
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  10 class credits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Valid for 10 weeks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Mix yoga & strength
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  7-day recording access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" />
                  Priority booking
                </li>
              </ul>
              <Link href={purchaseLink}>
                <Button className="w-full">
                  Purchase Bundle
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Memberships */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">Monthly Memberships</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Consistent training, best value. Cancel anytime with 30 days' notice.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* 2 per week */}
            <div className="space-y-6 rounded-lg border p-8 transition-shadow hover:shadow-lg">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#4B5B32]/10 px-3 py-1 text-xs text-[#4B5B32]">
                  <Gift className="h-3 w-3" />
                  14-day free trial
                </div>
                <h3 className="mb-2 text-2xl">Steady</h3>
                <p className="text-muted-foreground mb-4 text-sm">2 classes per week</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£49</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">~£6 per class</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Up to 2 live classes per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">All class recordings (7-day access)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Mix any class types</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Cancel anytime</span>
                </li>
              </ul>

              <Link href={purchaseLink}>
                <Button variant="outline" className="w-full">
                  Start Membership
                </Button>
              </Link>
            </div>

            {/* 3 per week - Featured */}
            <div className="border-primary relative space-y-6 rounded-lg border-2 p-8 shadow-lg">
              <div className="bg-primary text-primary-foreground absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm">
                Most Popular
              </div>
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#4B5B32]/10 px-3 py-1 text-xs text-[#4B5B32]">
                  <Gift className="h-3 w-3" />
                  14-day free trial
                </div>
                <h3 className="mb-2 text-2xl">Committed</h3>
                <p className="text-muted-foreground mb-4 text-sm">3 classes per week</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£65</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">~£5 per class</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Up to 3 live classes per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">All class recordings (7-day access)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Mix any class types</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Priority booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Cancel anytime</span>
                </li>
              </ul>

              <Link href={purchaseLink}>
                <Button className="w-full">
                  Start Membership
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Unlimited */}
            <div className="space-y-6 rounded-lg border p-8 transition-shadow hover:shadow-lg">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#4B5B32]/10 px-3 py-1 text-xs text-[#4B5B32]">
                  <Gift className="h-3 w-3" />
                  14-day free trial
                </div>
                <h3 className="mb-2 text-2xl">Unlimited</h3>
                <p className="text-muted-foreground mb-4 text-sm">All classes, all week</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£79</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">Best per-class value</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Unlimited live classes per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">All class recordings (7-day access)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">All class types included</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Priority booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">10% off retreat bookings</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">Cancel anytime</span>
                </li>
              </ul>

              <Link href={purchaseLink}>
                <Button variant="outline" className="w-full">
                  Start Membership
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              All memberships include a 14-day free trial. No payment taken during your trial —
              cancel anytime. Credits don't roll over between months.
            </p>
          </div>
        </div>
      </section>

      {/* Retreats */}
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
                  available for bookings 60+ days in advance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Typical range:</span>
                    <span className="text-xl">£950 - £1,650</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Early bird savings:</span>
                    <span className="text-lg text-[#4B5B32]">Up to £200</span>
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

      {/* FAQ */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">Common Questions</h2>

          <Accordion type="single" collapsible className="w-full">
            {pricingFaqs.map((faq, index) => (
              <AccordionItem key={faq.slug} value={faq.slug || `faq-${index}`}>
                <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: pricingFaqs.map((faq) => ({
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

      {/* CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Not Sure Where to Start?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Try a single drop-in class to see if it's right for you, or get in touch to discuss
            what's best for your situation.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
                Browse the Schedule
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

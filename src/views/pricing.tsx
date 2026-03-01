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

export function PricingPage() {
  const { isAuthenticated } = useAuth();

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
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl mb-6">Transparent Pricing</h1>
          <p className="text-xl text-[#B5C49B] leading-relaxed">
            Clear, honest pricing. No hidden costs, no contracts, no games.
          </p>
        </div>
      </section>

      {/* 1:1 Personal Training */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              1:1 Personal Training
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fully personalised programming designed around your specific
              conditions, symptoms, and goals. Every engagement is custom.
            </p>
          </div>

          <div className="bg-background border-2 border-primary rounded-lg p-8 md:p-12 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">From</span>
                    <span className="text-5xl">£75</span>
                    <span className="text-muted-foreground">/ session</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pricing depends on your goals, session frequency, and level
                    of support needed. We'll discuss everything via a free
                    initial enquiry.
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Comprehensive initial assessment
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Fully personalised training program
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      1:1 sessions (60 mins, online or in-person)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Ongoing messaging support between sessions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Regular program adjustments based on capacity
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Progress tracking and detailed reporting
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6 text-center md:text-left">
                <div className="bg-secondary/30 rounded-lg p-6 space-y-3">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h3 className="text-lg">Free Enquiry</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submit an enquiry to discuss your goals,
                    conditions, and whether we're a good fit. No pressure, no
                    hard sell.
                  </p>
                </div>
                <Link href="/pt">
                  <Button size="lg" className="w-full">
                    Submit an Enquiry
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Payment plans available for longer engagements
                </p>
              </div>
            </div>
          </div>

          {/* Sliding scale note */}
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              Limited sliding scale spots available for those on disability
              benefits or experiencing financial hardship.{" "}
              <Link href="/contact" className="text-primary underline">
                Get in touch to discuss
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Class Credits */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Class Credits</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Use credits on any yoga or strength class in the schedule.
              Flexible, no commitment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Drop-in / Single */}
            <div className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
              <Video className="w-8 h-8 text-primary" />
              <h3 className="text-xl">Drop-In</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£12</span>
                <span className="text-muted-foreground">per class</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect for trying a class or attending occasionally. No
                commitment needed.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Single class access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  7-day recording access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
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
            <div className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
              <Calendar className="w-8 h-8 text-primary" />
              <h3 className="text-xl">3-Class Bundle</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£30</span>
                <span className="text-sm text-muted-foreground line-through ml-1">
                  £36
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                £10 per class. Valid for 4 weeks. Great for building a regular
                habit.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />3 class credits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Valid for 4 weeks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Mix yoga & strength
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
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
            <div className="bg-background border-2 border-primary rounded-lg p-6 space-y-4 relative shadow-lg">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Best Value
              </div>
              <Calendar className="w-8 h-8 text-primary" />
              <h3 className="text-xl">10-Class Bundle</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl">£90</span>
                <span className="text-sm text-muted-foreground line-through ml-1">
                  £120
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                £9 per class — 25% off. Valid for 10 weeks. Serious about
                building capacity.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  10 class credits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Valid for 10 weeks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Mix yoga & strength
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  7-day recording access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
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
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Monthly Memberships</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Consistent training, best value. Cancel anytime with 30 days'
              notice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 2 per week */}
            <div className="border rounded-lg p-8 space-y-6 hover:shadow-lg transition-shadow">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#4B5B32]/10 text-[#4B5B32] px-3 py-1 rounded-full text-xs mb-3">
                  <Gift className="w-3 h-3" />
                  14-day free trial
                </div>
                <h3 className="text-2xl mb-2">Steady</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  2 classes per week
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£49</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ~£6 per class
                </p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Up to 2 live classes per week
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    All class recordings (7-day access)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Mix any class types</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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
            <div className="border-2 border-primary rounded-lg p-8 space-y-6 relative shadow-lg">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#4B5B32]/10 text-[#4B5B32] px-3 py-1 rounded-full text-xs mb-3">
                  <Gift className="w-3 h-3" />
                  14-day free trial
                </div>
                <h3 className="text-2xl mb-2">Committed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  3 classes per week
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£65</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ~£5 per class
                </p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Up to 3 live classes per week
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    All class recordings (7-day access)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Mix any class types</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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
            <div className="border rounded-lg p-8 space-y-6 hover:shadow-lg transition-shadow">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#4B5B32]/10 text-[#4B5B32] px-3 py-1 rounded-full text-xs mb-3">
                  <Gift className="w-3 h-3" />
                  14-day free trial
                </div>
                <h3 className="text-2xl mb-2">Unlimited</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All classes, all week
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl">£79</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Best per-class value
                </p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Unlimited live classes per week
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    All class recordings (7-day access)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">All class types included</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    10% off retreat bookings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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
            <p className="text-sm text-muted-foreground">
              All memberships include a 14-day free trial. No payment taken during your trial — cancel anytime.
              Credits don't roll over between months.
            </p>
          </div>
        </div>
      </section>

      {/* Retreats */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Retreats</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multi-day immersive experiences combining yoga, strength training,
              and community.
            </p>
          </div>

          <div className="bg-background border rounded-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl">Retreat Pricing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Retreat prices vary by location, duration, and accommodation.
                  Early bird pricing available for bookings 60+ days in advance.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">
                      Typical range:
                    </span>
                    <span className="text-xl">£950 - £1,650</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">
                      Early bird savings:
                    </span>
                    <span className="text-lg text-[#4B5B32]">Up to £200</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-4">
                  All retreats include accommodation, meals, all sessions, and
                  transfers (where applicable).
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/retreats">
                  <Button size="lg" className="w-full">
                    View All Retreats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-sm text-center text-muted-foreground">
                  Payment plans available. Travel insurance required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            Common Questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="credits">
              <AccordionTrigger className="text-left text-lg">
                Can I use class credits on any class?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes. Drop-in, 3-class, and 10-class bundles can be used on any
                  yoga, strength, or HIIT class in the schedule. Monthly
                  membership classes work the same way — attend any class type.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bundles-vs-memberships">
              <AccordionTrigger className="text-left text-lg">
                What's the difference between bundles and memberships?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  Bundles give you a set number of credits to use flexibly within a
                  time window. Memberships give you a weekly class allowance that
                  renews monthly. If you attend regularly, memberships are better
                  value. If your attendance varies, bundles offer more flexibility.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refunds">
              <AccordionTrigger className="text-left text-lg">
                Do you offer refunds?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  For 1:1 training: No refunds after sessions begin, but we can
                  pause in case of illness or flare. For class bundles: Unused
                  credits can be transferred to another person. For memberships:
                  Cancel anytime with 30 days' notice. For retreats: See individual
                  retreat cancellation policies.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="affordability">
              <AccordionTrigger className="text-left text-lg">
                What if I can't afford these prices?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  I hold a limited number of sliding scale spots for people on
                  disability benefits or experiencing financial hardship. Please
                  contact me directly — I want to make this accessible while
                  maintaining the sustainability of the business.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="insurance">
              <AccordionTrigger className="text-left text-lg">
                Is this covered by insurance?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  Some private health insurance policies may cover 1:1 personal
                  training or exercise therapy — check with your provider. I can
                  provide invoices and documentation to support your claim.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="1-1-pricing">
              <AccordionTrigger className="text-left text-lg">
                How does the 1:1 pricing work?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  Every 1:1 engagement is different — your conditions, goals, and
                  support needs determine the programming. Submit an enquiry and
                  I'll provide a clear quote. There's no obligation and no hard sell.
                </p>
              </AccordionContent>
            </AccordionItem>
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
            mainEntity: [
              {
                "@type": "Question",
                name: "Can I use class credits on any class?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Drop-in, 3-class, and 10-class bundles can be used on any yoga, strength, or HIIT class in the schedule. Monthly membership classes work the same way.",
                },
              },
              {
                "@type": "Question",
                name: "What's the difference between bundles and memberships?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Bundles give you a set number of credits to use flexibly within a time window. Memberships give you a weekly class allowance that renews monthly. If you attend regularly, memberships are better value.",
                },
              },
              {
                "@type": "Question",
                name: "Do you offer refunds?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "For 1:1 training: No refunds after sessions begin, but we can pause for illness or flare. For class bundles: Unused credits can be transferred. For memberships: Cancel anytime with 30 days' notice.",
                },
              },
              {
                "@type": "Question",
                name: "What if I can't afford these prices?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Limited sliding scale spots are available for people on disability benefits or experiencing financial hardship. Please contact me directly.",
                },
              },
              {
                "@type": "Question",
                name: "Is this covered by insurance?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Some private health insurance policies may cover 1:1 personal training or exercise therapy — check with your provider. I can provide invoices and documentation to support your claim.",
                },
              },
              {
                "@type": "Question",
                name: "How does the 1:1 pricing work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Every 1:1 engagement is different. Your conditions, goals, and support needs determine the programming. Submit an enquiry and I'll provide a clear quote. There's no obligation and no hard sell.",
                },
              },
            ],
          }),
        }}
      />

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl">Not Sure Where to Start?</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Try a single drop-in class to see if it's right for you, or get in
            touch to discuss what's best for your situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule">
              <Button
                size="lg"
                className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90"
              >
                Browse the Schedule
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
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
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  X,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
  StorySplit,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { coachingProofItems } from "@/data/public-refresh";
import { coachingFaqs, coachingTiers } from "@/data/marketing";

const tierIcon = {
  guided_accountability: ClipboardList,
  independent_training_plan: Smartphone,
  guided_training_plan: Users,
  one_to_one_coaching: GraduationCap,
} as const;

export function CoachingPage() {
  return (
    <Layout>
      <SEO
        title="1:1 Offers - Shruti Turner"
        description="Four 1:1 offers for chronic illness, autoimmune conditions, wellbeing and injury recovery, from guided accountability to high-touch 1:1 coaching."
        keywords="coaching chronic illness, inclusive movement coaching, everfit coaching, training plan chronic pain, injury recovery coaching"
        canonicalUrl="https://shrutiturner.co.uk/coaching"
      />

      <EditorialHero
        eyebrow="1:1 Offers"
        size="compact"
        title={
          <>
            Support built for
            <span className="text-brand-accent-light"> your real body</span>, not generic advice.
          </>
        }
        description="Every 1:1 offer starts with an application so support and programming work for you."
        primaryCta={{ href: "#tiers", label: "Explore 1:1 Offers" }}
        secondaryCta={{ href: "/coaching/apply", label: "Apply Now" }}
        metrics={[
          {
            label: "Best For",
            detail:
              "Clients who want strategy, structure and clarity around their movement, training and wellbeing.",
          },
          {
            label: "Delivery",
            detail: "Programming, check-ins and support communication live in Everfit.",
          },
          {
            label: "Difference",
            detail:
              "Support varies by your chosen option, not by how seriously your body is taken.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti-coaching.jpeg"
                  alt="Shruti Turner running by the sea"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What personalised support means here."
        description="The difference between offers is the frequency of touch points, programme review and updates. Every offer starts with a short form."
        items={[...coachingProofItems]}
      />

      <StorySplit
        eyebrow="Why 1:1 Works"
        title="It is about you."
        description="Every plan is built for your body, your life and your goals."
        body={
          <div className="space-y-6">
            <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
              <p>My 1:1 offers are designed to support you as much as you need.</p>
              <p>
                You might want accountability to guide your routine and support decision-making. You
                might want a workout plan with check-ins to support your progression. Or you might
                want more collaborative day-to-day coaching for how movement fits into your
                lifestyle.
              </p>
              <p>There are different options to help you find what works for you.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "The programme evolves with you, adjusting to your body, confidence and goals.",
                "It’s about working with your body to build physical strength and learning to trust it.",
              ].map((item) => (
                <div key={item} className="marketing-panel rounded-[1.3rem] px-5 py-5">
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        }
        aside={
          <div className="border-brand-dark/10 bg-brand-warm rounded-[1.8rem] border p-7">
            <h3 className="mt-4 text-3xl">How it happens</h3>
            <div className="mt-7 space-y-4">
              {[
                {
                  title: "Understanding",
                  body: "Learn to listen to what your body is telling you and what it means.",
                },
                {
                  title: "Movement",
                  body: "Develop movement patterns that match what your body is telling you it needs.",
                },
                {
                  title: "Strength",
                  body: "Build the life you want by sustainably strengthening your body and relationship with movement.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-brand-dark/10 bg-background rounded-[1.25rem] border px-5 py-5"
                >
                  <h4 className="text-xl">{item.title}</h4>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        }
        className="section-divider"
      />

      <MarketingSection className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Choose Your Offer"
          title="The support stays personalised. The touch level changes."
          description="Choose the closest offer and apply. Checkout is only created after Shruti accepts the application."
          align="center"
        />
        <div id="tiers" className="mt-12 grid gap-6 md:grid-cols-3 lg:gap-8">
          {coachingTiers.map((tier) => {
            const Icon = tierIcon[tier.id];
            const highlighted = tier.id === "guided_training_plan";
            const highest = null;

            return (
              <article
                key={tier.id}
                className={`relative flex flex-col rounded-[1.9rem] border-2 p-7 shadow-[0_20px_50px_rgba(46,31,51,0.06)] ${
                  highlighted
                    ? "border-brand-accent/30 bg-brand-accent/6"
                    : highest
                      ? "border-brand-dark/20 bg-brand-dark text-brand-white"
                      : "border-brand-dark/10 bg-background"
                }`}
              >
                {highlighted ? (
                  <span className="bg-brand-accent text-brand-white absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                    Most popular
                  </span>
                ) : null}
                {highest ? (
                  <span className="bg-brand-accent-light text-brand-dark absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                    Highest support
                  </span>
                ) : null}

                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    highest
                      ? "bg-brand-white/10 text-brand-accent-light"
                      : highlighted
                        ? "bg-brand-accent text-brand-white"
                        : "bg-brand-accent/10 text-brand-accent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-2xl">{tier.name}</h3>
                  <p
                    className={`mt-2 text-sm italic ${
                      highest ? "text-brand-white/65" : "text-muted-foreground"
                    }`}
                  >
                    {tier.tagline}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-3xl">{tier.priceLabel}</p>
                  <p
                    className={`mt-2 text-xs ${
                      highest ? "text-brand-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {tier.priceNote}
                  </p>
                </div>

                <p
                  className={`mt-5 text-sm leading-relaxed ${
                    highest ? "text-brand-white/78" : "text-muted-foreground"
                  }`}
                >
                  {tier.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge
                    className={
                      highest
                        ? "border-brand-white/10 bg-brand-white/8 text-brand-white"
                        : "border-brand-dark/10 bg-secondary text-foreground"
                    }
                  >
                    {tier.supportLevel === "programme"
                      ? "Programme + review"
                      : tier.supportLevel === "guided"
                        ? "Guided review"
                        : tier.supportLevel === "accountability"
                          ? "Accountability"
                          : "Highest touch"}
                  </Badge>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          highest ? "text-brand-accent-light" : "text-brand-accent"
                        }`}
                      />
                      <span className={highest ? "text-brand-white/80" : "text-muted-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                  {tier.boundaries.map((boundary) => (
                    <li key={boundary} className="flex items-start gap-3 text-sm">
                      <X
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          highest ? "text-brand-white/45" : "text-muted-foreground/60"
                        }`}
                      />
                      <span className={highest ? "text-brand-white/65" : "text-muted-foreground"}>
                        {boundary}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={highest ? "secondary" : highlighted ? "default" : "outline"}
                  className={`mt-8 ${
                    highest
                      ? "bg-brand-white text-brand-dark hover:bg-brand-white/92"
                      : highlighted
                        ? "bg-brand-accent hover:bg-brand-accent/90 text-brand-white"
                        : ""
                  }`}
                >
                  <Link href={tier.ctaHref}>
                    <MessageCircle className="h-4 w-4" />
                    {tier.ctaLabel}
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <SectionHeading
          eyebrow="Common Questions"
          title="A few things people usually want to know."
          description="If you are unsure which offer fits, applying is the simplest way to get a recommendation."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {coachingFaqs.map((faq) => (
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
        eyebrow="Next step"
        title="If you want 1:1 support that respects you, apply now."
        description="There is no right answer, just the one that best suits what you need right now."
        actions={[
          {
            href: "/coaching/apply",
            label: "Apply for 1:1 Support",
            icon: Sparkles,
            iconPosition: "start",
          },
          {
            href: "/contact",
            label: "Ask a question",
            icon: ArrowRight,
            variant: "secondary",
          },
        ]}
      />
    </Layout>
  );
}

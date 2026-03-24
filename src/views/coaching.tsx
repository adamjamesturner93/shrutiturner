"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  JourneySection,
  MarketingSection,
  ProofBand,
  SectionHeading,
  StorySplit,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { coachingProofItems } from "@/data/public-refresh";
import {
  applicationJourney,
  coachingFaqs,
  coachingTiers,
  personalProgrammeJourney,
} from "@/data/marketing";

const tierIcon = {
  "independent-plan": ClipboardList,
  "coached-plan": Users,
  coaching: GraduationCap,
} as const;

export function CoachingPage() {
  return (
    <Layout>
      <SEO
        title="Coaching - Shruti Turner"
        description="Three tiers of personalised support for complex bodies, from tailored programming to high-touch 1:1 coaching."
        keywords="coaching chronic illness, personal training complex bodies, everfit coaching, training plan chronic pain"
        canonicalUrl="https://shrutiturner.com/coaching"
      />

      <EditorialHero
        eyebrow="1:1 Coaching"
        size="compact"
        title={
          <>
            Coaching built around
            <span className="text-brand-accent-light"> your real body,</span> not an idealised one.
          </>
        }
        description="Choose from lower-touch programming, guided coaching, or a fuller strategic partnership. Every tier is designed for symptom fluctuation, thoughtful progression, and long-term capacity."
        primaryCta={{ href: "#tiers", label: "Explore Coaching Tiers" }}
        secondaryCta={{ href: "/coaching/apply", label: "Apply Now" }}
        stats={[
          { value: "3", label: "Distinct coaching levels" },
          { value: "Everfit", label: "Training delivery and check-ins" },
          { value: "Built-in", label: "Good day and flare day planning" },
        ]}
        metrics={[
          {
            label: "Best For",
            detail:
              "Clients who want strategy, structure, and better decision-making between sessions.",
          },
          {
            label: "Delivery",
            detail:
              "Workouts, habits, and reviews live in Everfit while the website remains the service hub.",
          },
          {
            label: "Difference",
            detail:
              "Support tiers vary by coaching depth, not by how seriously your body is taken.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1654613412232-10aaf36df8a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmV0Y2hpbmclMjB5b2dhJTIwY2FsbSUyMG1pbmRmdWwlMjBtb3ZlbWVudHxlbnwxfHx8fDE3NzMzMjQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Mindful coaching and movement support"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="bg-brand-white/10 rounded-[1.15rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    What coaching changes
                  </p>
                  <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                    You stop guessing how hard to push and start training with clearer rules.
                  </p>
                </div>
                <div className="bg-brand-accent-light/12 rounded-[1.15rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    What stays true
                  </p>
                  <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                    Ambition remains. The plan just makes room for the messier reality of symptoms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What personalised support means here"
        description="The difference between the tiers is the rhythm of review, accountability, and live support. The programming standard stays high throughout."
        items={[...coachingProofItems]}
      />

      <StorySplit
        eyebrow="Why Coaching Works"
        title="Not generic fitness. Not just modifications."
        description="Every plan is built around how your symptoms, capacity, and life demands actually change across the month."
        body={
          <div className="space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Coaching is for people who do not just want more exercises. They want better
              judgement, steadier progression, and enough structure that they can keep going when
              the week does not unfold neatly.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Good-day, average-day, and survival-day versions are planned up front.",
                "The programme evolves around symptoms, recovery, goals, and actual feedback.",
                "You get a coaching rhythm that matches your complexity and desired support level.",
                "The aim is less second-guessing and more confidence in your decisions.",
              ].map((item) => (
                <div key={item} className="marketing-panel rounded-[1.3rem] px-5 py-5">
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                Everfit delivery
              </Badge>
              <Badge className="border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Condition-aware programming
              </Badge>
              <Badge className="border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Support depth that scales
              </Badge>
            </div>
          </div>
        }
        aside={
          <div className="border-brand-dark/10 bg-brand-warm rounded-[1.8rem] border p-7">
            <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">Typical shift</p>
            <h3 className="mt-4 text-3xl">
              From “What should I do today?” to “I know how to adjust this.”
            </h3>
            <div className="mt-7 space-y-4">
              {[
                {
                  title: "Capacity-aware programming",
                  body: "The plan assumes variability instead of treating it like a disruption.",
                },
                {
                  title: "Useful accountability",
                  body: "Support is there to clarify decisions, not just to push for compliance.",
                },
                {
                  title: "More strategic support",
                  body: "Higher tiers bring more review, more direct input, and more context-sensitive programming changes.",
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
          eyebrow="Choose Your Tier"
          title="The support stays personalised. The touch level changes."
          description="Pick the version of coaching that matches how much review, live input, and accountability you want."
          align="center"
        />
        <div id="tiers" className="mt-12 grid gap-6 md:grid-cols-3 lg:gap-8">
          {coachingTiers.map((tier) => {
            const Icon = tierIcon[tier.id];
            const highlighted = tier.id === "coached-plan";
            const highest = tier.id === "coaching";

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
                    {tier.supportLevel === "async"
                      ? "Async support"
                      : tier.supportLevel === "moderate"
                        ? "Live + async"
                        : "Highest touch"}
                  </Badge>
                  {tier.includesMembership ? (
                    <Badge
                      className={
                        highest
                          ? "border-brand-accent-light/20 bg-brand-accent-light/12 text-brand-accent-light"
                          : "border-brand-accent/20 bg-brand-accent/10 text-brand-accent"
                      }
                    >
                      Move Well included
                    </Badge>
                  ) : null}
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
                    {tier.purchaseModel === "application" ? (
                      <MessageCircle className="h-4 w-4" />
                    ) : null}
                    {tier.ctaLabel}
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Independent Plan Journey"
              title="For clients who want expert structure with lighter-touch review."
              description="The Independent Training Plan is the cleanest route if you want personalised programming without regular live coaching."
            />
            <div className="mt-8">
              <JourneySection steps={personalProgrammeJourney} />
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow="Application Journey"
              title="For coached tiers with more support and fit-checking."
              description="The application-led tiers help confirm the right support level before you begin."
            />
            <div className="mt-8">
              <JourneySection steps={applicationJourney} />
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <SectionHeading
          eyebrow="Common Questions"
          title="A few things people usually want to know."
          description="If you are unsure which tier fits, applying is the simplest way to get a recommendation."
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

      <MarketingSection className="bg-brand-dark text-brand-white">
        <div className="grid gap-8 md:grid-cols-[1.02fr_0.98fr] md:items-center">
          <div>
            <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">Next step</p>
            <h2 className="mt-4 text-3xl leading-tight md:text-5xl">
              If you want coaching that respects complexity, start the conversation.
            </h2>
            <p className="text-brand-white/80 mt-5 max-w-2xl text-lg leading-relaxed">
              The right tier depends on how much support, review, and strategic input your body and
              life currently need.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row md:justify-end">
            <Button
              asChild
              size="lg"
              className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
            >
              <Link href="/coaching/apply">
                <Sparkles className="h-4 w-4" />
                Apply for coaching
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand-white/20 bg-brand-white/6 text-brand-white hover:bg-brand-white/10"
            >
              <Link href="/contact">
                <ArrowRight className="h-4 w-4" />
                Ask a question
              </Link>
            </Button>
          </div>
        </div>
      </MarketingSection>
    </Layout>
  );
}

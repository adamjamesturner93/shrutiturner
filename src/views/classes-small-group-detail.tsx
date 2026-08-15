"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Gift, Wrench } from "lucide-react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import {
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
} from "@/components/marketing/sections";
import type { PublicSmallGroupTemplateDetail } from "@/lib/small-groups/service";

function formatDate(value: string | null) {
  if (!value) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | null) {
  if (typeof value !== "number") return "Details on request";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function ClassesSmallGroupDetailPage({
  programme,
}: {
  programme: PublicSmallGroupTemplateDetail | null;
}) {
  if (!programme) {
    return (
      <Layout>
        <SEO title="Programme Not Found - Shruti Turner" noIndex />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl">Programme not found</h1>
          <p className="text-muted-foreground mt-4">
            This programme may have moved or is no longer available.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/classes/small-groups">Back to small group programmes</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const nextJoinableRun = programme.runs.find((run) => run.canCheckout) ?? null;
  const firstRun = programme.runs[0] ?? null;
  const primaryRun = nextJoinableRun ?? firstRun;

  return (
    <Layout>
      <SEO
        title={`${programme.title} - Small Group Programme - Shruti Turner`}
        description={programme.shortSummary}
        canonicalUrl={`https://shrutiturner.co.uk/classes/small-groups/${programme.slug}`}
      />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-14">
        <div className="container mx-auto max-w-7xl">
          <Link
            href="/classes/small-groups"
            className="text-brand-accent-light inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to small group programmes
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                Small group programme
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl leading-[1.04] tracking-[-0.03em] md:text-[clamp(3rem,5vw,5rem)]">
                {programme.title}
              </h1>
              {programme.subtitle ? (
                <p className="text-brand-accent-light mt-4 max-w-3xl text-xl leading-relaxed">
                  {programme.subtitle}
                </p>
              ) : null}
              <p className="text-brand-white/82 mt-6 max-w-3xl text-lg leading-relaxed md:text-[1.2rem]">
                {programme.longDescription || programme.shortSummary}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  {programme.durationLabel}
                </span>
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  Cohorts capped at {programme.cohortSize}
                </span>
                {programme.sessionsPerWeek ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    {programme.sessionsPerWeek} session
                    {programme.sessionsPerWeek === 1 ? "" : "s"} per week
                  </span>
                ) : null}
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  From {formatMoney(programme.defaultPricePence)}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {nextJoinableRun ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
                  >
                    <Link href={nextJoinableRun.checkoutHref}>
                      Join next intake
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-brand-white/20 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
                >
                  <Link href="/classes/small-groups">Explore all programmes</Link>
                </Button>
              </div>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[1.9rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
              <div className="bg-background text-foreground rounded-[1.45rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                      Available runs
                    </p>
                    <h2 className="mt-3 text-2xl">Pick the intake that fits your timing.</h2>
                  </div>
                  {primaryRun?.badge ? (
                    <span className="bg-brand-accent/10 text-brand-accent rounded-full px-3 py-1 text-[11px] tracking-[0.16em] uppercase">
                      {primaryRun.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 space-y-4">
                  {programme.runs.length > 0 ? (
                    programme.runs.map((run) => (
                      <div
                        key={run.runSlug}
                        className="border-brand-dark/10 bg-secondary/35 rounded-[1.3rem] border p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg">{formatDate(run.startDate)}</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {run.scheduleLabel || "Schedule announced soon"}
                            </p>
                          </div>
                          <span className="border-brand-dark/10 text-muted-foreground rounded-full border px-3 py-1 text-[11px] tracking-[0.16em] uppercase">
                            {statusLabel(run.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="bg-background rounded-[1rem] px-4 py-3">
                            <p className="text-brand-accent text-[11px] tracking-[0.16em] uppercase">
                              Price
                            </p>
                            <p className="mt-1 text-sm">{run.priceLabel}</p>
                          </div>
                          <div className="bg-background rounded-[1rem] px-4 py-3">
                            <p className="text-brand-accent text-[11px] tracking-[0.16em] uppercase">
                              Cohort
                            </p>
                            <p className="mt-1 text-sm">
                              {run.spotsFilled} of {run.cohortSize} spots filled
                            </p>
                          </div>
                          <div className="bg-background rounded-[1rem] px-4 py-3">
                            <p className="text-brand-accent text-[11px] tracking-[0.16em] uppercase">
                              Status
                            </p>
                            <p className="mt-1 text-sm">{run.badge || "Open for booking"}</p>
                          </div>
                        </div>

                        {run.canCheckout || run.canGift ? (
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            {run.canCheckout ? (
                              <Button
                                asChild
                                size="sm"
                                className="bg-brand-dark text-brand-white hover:bg-brand-dark/92"
                              >
                                <Link href={run.checkoutHref}>
                                  Join this intake
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : null}
                            {run.canGift ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={run.giftCheckoutHref}>
                                  Gift a place
                                  <Gift className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="border-brand-dark/10 bg-secondary/35 text-muted-foreground rounded-[1.3rem] border p-5 text-sm leading-relaxed">
                      No runs are scheduled yet. Join the newsletter for first notice when the next
                      cohort opens.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProofBand
        title="What this programme is designed to give you"
        description="The point is a clearer build, not more noise. You should leave with better continuity, sharper judgementand more confidence staying with the work."
        items={[
          {
            label: "Block length",
            detail: programme.durationWeeks
              ? `${programme.durationWeeks} weeks of repeated exposure and clearer progression.`
              : `${programme.durationLabel} of focused work and shared momentum.`,
          },
          {
            label: "Cohort size",
            detail: `Groups are capped at ${programme.cohortSize} so coaching stays responsive and personal enough to matter.`,
          },
          {
            label: "Session rhythm",
            detail: programme.sessionsPerWeek
              ? `${programme.sessionsPerWeek} session${programme.sessionsPerWeek === 1 ? "" : "s"} each week, with enough repetition to build familiarity.`
              : "A fixed programme rhythm built around consistency rather than random attendance.",
          },
          {
            label: "Best Fit",
            detail:
              "Ideal when you want more structure than drop-ins but do not need the closer support of 1:1 coaching.",
          },
        ]}
      />

      <MarketingSection className="section-divider">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="What You’ll Build"
              title="The outcomes are meant to feel practical, not abstract."
              description="This should help you train with more clarity, better pacing and a stronger sense of what to repeat from week to week."
            />

            <div className="mt-8 grid gap-4">
              {(programme.outcomes.length > 0
                ? programme.outcomes
                : [
                    "A clearer progression than weekly drop-in classes",
                    "More confidence training toward one specific outcome",
                    "Greater consistency through a fixed schedule and stable cohort",
                  ]
              ).map((point) => (
                <div
                  key={point}
                  className="border-brand-dark/10 bg-background flex items-start gap-4 rounded-[1.4rem] border px-5 py-5 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
                >
                  <div className="bg-brand-accent/10 text-brand-accent flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <article className="border-brand-dark/10 bg-background rounded-[1.6rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h3 className="text-2xl">Who it&apos;s for</h3>
              <div className="mt-5 space-y-3">
                {(programme.whoItsFor.length > 0
                  ? programme.whoItsFor
                  : [
                      "People who want a tighter coaching container than weekly classes",
                      "Bodies that benefit from repetition and a clearer progression",
                      "Anyone wanting accountability without moving into 1:1 support",
                    ]
                ).map((item) => (
                  <div
                    key={item}
                    className="border-brand-dark/10 bg-secondary/35 text-muted-foreground rounded-[1.15rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="border-brand-dark/10 bg-background rounded-[1.6rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h3 className="flex items-center gap-2 text-2xl">
                <Wrench className="text-brand-accent h-5 w-5" />
                Equipment
              </h3>
              <div className="mt-5 space-y-3">
                {(programme.equipment.length > 0
                  ? programme.equipment
                  : ["Basic home set-up announced before the programme starts."]
                ).map((item) => (
                  <div
                    key={item}
                    className="border-brand-dark/10 bg-secondary/35 text-muted-foreground rounded-[1.15rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="border-brand-dark/10 bg-background rounded-[1.6rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h3 className="text-2xl">What&apos;s included</h3>
              <div className="mt-5 space-y-3">
                {(programme.inclusions.length > 0
                  ? programme.inclusions
                  : [
                      "Live coached sessions",
                      "A fixed small cohort",
                      "Progressive structure across the full block",
                    ]
                ).map((item) => (
                  <div
                    key={item}
                    className="border-brand-dark/10 bg-secondary/35 text-muted-foreground rounded-[1.15rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </MarketingSection>

      {programme.weekByWeek.length > 0 ? (
        <MarketingSection className="section-wash">
          <SectionHeading
            eyebrow="Week By Week"
            title="A rough view of how the block unfolds."
            description="The progression is structured enough that each week builds on the last, while still leaving room for adaptation inside the sessions."
            align="center"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {programme.weekByWeek.map((week) => (
              <article
                key={week.weekNumber}
                className="border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                  Week {week.weekNumber}
                </p>
                <h3 className="mt-3 text-2xl leading-tight">{week.title}</h3>
                {week.focus ? (
                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{week.focus}</p>
                ) : null}
                {week.sessionTitles && week.sessionTitles.length > 0 ? (
                  <div className="mt-5 grid gap-2">
                    {week.sessionTitles.map((title) => (
                      <div
                        key={title}
                        className="border-brand-dark/10 bg-secondary/35 text-muted-foreground rounded-[1rem] border px-4 py-3 text-sm leading-relaxed"
                      >
                        {title}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </MarketingSection>
      ) : null}

      <PreFooterCtaSection
        eyebrow="Next step"
        title="If you want a tighter training container without jumping straight into 1:1 coaching, this is the place to start."
        description="Pick the next intake if one is open, or browse the other programme blocks if you want to compare the focus first."
        actions={[
          ...(nextJoinableRun
            ? [
                {
                  href: nextJoinableRun.checkoutHref,
                  label: "Join next intake",
                  icon: ArrowRight,
                },
              ]
            : []),
          {
            href: "/classes/small-groups",
            label: "Explore all programmes",
            variant: "secondary" as const,
          },
        ]}
      />
    </Layout>
  );
}

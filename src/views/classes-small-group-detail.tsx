"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock3, Gift, Users, Wrench } from "lucide-react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import type { PublicSmallGroupTemplateDetail } from "@/lib/small-groups/service";

function formatDate(value: string | null) {
  if (!value) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
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

  return (
    <Layout>
      <SEO
        title={`${programme.title} - Small Group Programme - Shruti Turner`}
        description={programme.shortSummary}
        canonicalUrl={`https://shrutiturner.com/classes/small-group/${programme.slug}`}
      />

      <section className="bg-brand-dark py-20 text-white md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <Link
            href="/classes/small-groups"
            className="text-brand-accent-light inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to small group programmes
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <h1 className="text-4xl leading-tight md:text-6xl">{programme.title}</h1>
              {programme.subtitle ? (
                <p className="text-brand-accent-light mt-4 text-xl">{programme.subtitle}</p>
              ) : null}
              <p className="text-brand-accent-light mt-6 max-w-3xl text-lg leading-relaxed">
                {programme.longDescription || programme.shortSummary}
              </p>

              <div className="text-brand-accent-light mt-8 flex flex-wrap gap-5 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {programme.durationLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cohorts capped at {programme.cohortSize}
                </span>
                {typeof programme.defaultPricePence === "number" ? (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From{" "}
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: "GBP",
                      maximumFractionDigits: 0,
                    }).format(programme.defaultPricePence / 100)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="bg-background text-foreground rounded-[1.75rem] border p-8 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                Available runs
              </p>
              <div className="mt-4 space-y-4">
                {programme.runs.length > 0 ? (
                  programme.runs.map((run) => (
                    <div key={run.runSlug} className="rounded-[1.25rem] border p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm">{formatDate(run.startDate)}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {run.scheduleLabel || "Schedule announced soon"}
                          </p>
                        </div>
                        <span className="rounded-full border px-3 py-1 text-xs">
                          {statusLabel(run.status)}
                        </span>
                      </div>
                      {run.badge ? (
                        <p className="mt-3 text-sm text-orange-700">{run.badge}</p>
                      ) : null}
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-brand-accent text-2xl">{run.priceLabel}</p>
                          <p className="text-muted-foreground text-xs">
                            {run.spotsFilled} of {run.cohortSize} spots filled
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" disabled={!run.canGift}>
                            <Link href={run.giftCheckoutHref}>
                              Gift
                              <Gift className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" disabled={!run.canCheckout}>
                            <Link href={run.checkoutHref}>
                              {run.canCheckout ? "Join" : "Waitlist"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border p-5 text-sm">
                    No runs are scheduled yet. Join the newsletter for first notice when the next
                    cohort opens.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl md:text-4xl">What you&apos;ll achieve</h2>
                <ul className="mt-6 space-y-4">
                  {(programme.outcomes.length > 0
                    ? programme.outcomes
                    : [
                        "A clearer progression than drop-in classes",
                        "More confident, specific training around one outcome",
                        "Greater consistency through a fixed cohort and schedule",
                      ]
                  ).map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <Check className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span className="text-muted-foreground text-base leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {programme.weekByWeek.length > 0 ? (
                <div>
                  <h2 className="text-3xl md:text-4xl">Week by week</h2>
                  <div className="mt-6 space-y-4">
                    {programme.weekByWeek.map((week) => (
                      <div key={week.weekNumber} className="rounded-[1.25rem] border p-5">
                        <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">
                          Week {week.weekNumber}
                        </p>
                        <h3 className="mt-2 text-xl">{week.title}</h3>
                        {week.focus ? (
                          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                            {week.focus}
                          </p>
                        ) : null}
                        {week.sessionTitles && week.sessionTitles.length > 0 ? (
                          <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                            {week.sessionTitles.map((title) => (
                              <li key={title}>• {title}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.5rem] border p-8">
                <h3 className="text-2xl">Who it&apos;s for</h3>
                <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                  {(programme.whoItsFor.length > 0
                    ? programme.whoItsFor
                    : [
                        "People who want a tighter coaching container than weekly classes",
                        "Bodies that benefit from repetition and a clearer progression",
                        "Anyone wanting accountability without moving into 1:1 support",
                      ]
                  ).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border p-8">
                <h3 className="flex items-center gap-2 text-2xl">
                  <Wrench className="text-brand-accent h-5 w-5" />
                  Equipment
                </h3>
                <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                  {(programme.equipment.length > 0
                    ? programme.equipment
                    : ["Basic home set-up announced before the programme starts."]
                  ).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border p-8">
                <h3 className="text-2xl">What&apos;s included</h3>
                <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                  {(programme.inclusions.length > 0
                    ? programme.inclusions
                    : [
                        "Live coached sessions",
                        "A fixed small cohort",
                        "Progressive structure across the full block",
                      ]
                  ).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

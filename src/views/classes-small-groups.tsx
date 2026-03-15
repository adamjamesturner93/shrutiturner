"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Check, Clock3, Sparkles, Users } from "lucide-react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { NewsletterInline } from "../components/newsletter";
import { Button } from "../components/ui/button";
import type { PublicSmallGroupTemplateListItem } from "@/lib/small-groups/service";

interface ClassesSmallGroupsPageProps {
  programmes?: PublicSmallGroupTemplateListItem[];
}

function formatDate(value: string | null) {
  if (!value) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ClassesSmallGroupsPage({ programmes = [] }: ClassesSmallGroupsPageProps) {
  return (
    <Layout>
      <SEO
        title="Small Group Programmes - Shruti Turner"
        description="Focused six-week style programme blocks with a clear outcome, a fixed cohort, and more accountability than regular classes."
        canonicalUrl="https://shrutiturner.com/classes/small-groups"
      />

      <section className="bg-brand-dark py-20 text-white md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="bg-brand-accent-light/15 text-brand-accent-light mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Limited numbers. Clear outcomes. Real progression.
          </div>
          <h1 className="text-4xl md:text-6xl">Small Group Programmes</h1>
          <p className="text-brand-accent-light mx-auto mt-6 max-w-3xl text-lg leading-relaxed md:text-2xl">
            Multi-week small cohort programmes for a specific goal, with more structure,
            accountability, and individual guidance than a standard class rhythm.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="#current-programmes">View Current Programmes</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white">
              <Link href="/classes">Back to Move Well Classes</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-5xl">Why a Programme?</h2>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
              Move Well Classes are the ongoing practice. Programmes are the focused season when you
              want a tighter container, a fixed group, and a more deliberate build towards one
              specific result.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[1.5rem] border p-6">
              <Users className="text-brand-accent h-7 w-7" />
              <h3 className="mt-4 text-xl">More individual attention</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                With a small cohort, there is more room for feedback, progression, and adaptation to
                your actual body rather than generic group cues.
              </p>
            </div>
            <div className="rounded-[1.5rem] border p-6">
              <Clock3 className="text-brand-accent h-7 w-7" />
              <h3 className="mt-4 text-xl">A defined progression</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Each programme is built around one clear outcome, so sessions build week by week
                instead of feeling disconnected.
              </p>
            </div>
            <div className="rounded-[1.5rem] border p-6">
              <Check className="text-brand-accent h-7 w-7" />
              <h3 className="mt-4 text-xl">Accountability without overwhelm</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                You stay with the same group over a fixed block, which makes consistency much easier
                than trying to restart every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="current-programmes" className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl md:text-6xl">Current Programmes</h2>

          {programmes.length > 0 ? (
            <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2">
              {programmes.map((programme) => {
                const run = programme.featuredRun;
                return (
                  <article
                    key={programme.id}
                    className="bg-background flex h-full flex-col rounded-[1.75rem] border p-8 shadow-[0_20px_60px_rgba(37,24,47,0.08)]"
                  >
                    {run?.badge ? (
                      <span className="mb-6 inline-flex w-fit rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
                        {run.badge}
                      </span>
                    ) : null}

                    <h3 className="text-3xl leading-tight md:text-4xl">{programme.title}</h3>
                    {programme.subtitle ? (
                      <p className="text-muted-foreground mt-3 text-base">{programme.subtitle}</p>
                    ) : null}

                    <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-4 w-4" />
                        {programme.durationLabel}
                      </span>
                      {run?.startDate ? <span>•</span> : null}
                      {run?.startDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Starts {formatDate(run.startDate)}
                        </span>
                      ) : null}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Max {run?.cohortSize || programme.cohortSize}
                      </span>
                    </div>

                    <p className="text-muted-foreground mt-8 text-lg leading-relaxed">
                      {programme.shortSummary}
                    </p>

                    <div className="mt-8">
                      <h4 className="text-xl">What You&apos;ll Achieve:</h4>
                      <ul className="text-muted-foreground mt-4 space-y-3 text-base leading-relaxed">
                        {[
                          `Train within a more focused ${programme.durationLabel.toLowerCase()} block`,
                          `Work towards a defined outcome with a stable group`,
                          `Receive more individual feedback than in a standard class`,
                        ].map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <Check className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto border-t pt-8">
                      <div className="mb-5">
                        <p className="text-brand-accent text-4xl">
                          {run?.priceLabel || "Details on request"}
                        </p>
                        {run ? (
                          <p className="text-muted-foreground mt-2 text-sm">
                            {run.spotsFilled} of {run.cohortSize} spots filled
                          </p>
                        ) : (
                          <p className="text-muted-foreground mt-2 text-sm">
                            New dates will appear here when the next run is scheduled.
                          </p>
                        )}
                      </div>

                      <Button asChild size="lg" className="w-full">
                        <Link href={programme.detailHref}>
                          View Programme Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>

                      <p className="text-muted-foreground mt-5 text-center text-sm">
                        {run?.scheduleLabel || "Schedule announced soon"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground mt-10 text-center">
              No programmes are currently published.
            </p>
          )}

          <div className="bg-background mx-auto mt-14 max-w-4xl rounded-[1.75rem] border p-8 md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-brand-accent text-sm tracking-[0.18em] uppercase">Early Notice</p>
              <h3 className="mt-3 text-2xl md:text-3xl">
                Join the newsletter for first notice of new programmes
              </h3>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
                New programme blocks often fill quietly from the waitlist first. Join the mailing
                list for early notice when the next focused intake opens.
              </p>
              <div className="mt-8">
                <NewsletterInline />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

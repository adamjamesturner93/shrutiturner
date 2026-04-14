"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Check, Clock3, Users } from "lucide-react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { NewsletterInline } from "../components/newsletter";
import { Button } from "../components/ui/button";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
} from "@/components/marketing/sections";
import type { PublicSmallGroupTemplateListItem } from "@/lib/small-groups/service";

interface ClassesSmallGroupsPageProps {
  programmes?: PublicSmallGroupTemplateListItem[];
}

const programmeBenefits = [
  {
    title: "A defined progression",
    body: "Each block builds toward one result so the weeks connect to each other instead of feeling like isolated drop-ins.",
    icon: Clock3,
  },
  {
    title: "A smaller cohort",
    body: "Capped numbers leave more room for feedback, adaptation, and actual accountability inside the group.",
    icon: Users,
  },
  {
    title: "More structure without 1:1 coaching",
    body: "It is the middle ground between regular classes and higher-touch coaching when you want a clearer container.",
    icon: Check,
  },
];

function formatDate(value: string | null) {
  if (!value) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getProgrammeOutcomes(programme: PublicSmallGroupTemplateListItem) {
  return [
    `Clearer ${programme.durationLabel.toLowerCase()} progression`,
    `Stable cohort capped at ${programme.featuredRun?.cohortSize || programme.cohortSize}`,
    programme.featuredRun?.scheduleLabel || "Schedule shared before the block begins",
  ];
}

export function ClassesSmallGroupsPage({ programmes = [] }: ClassesSmallGroupsPageProps) {
  const featuredProgramme = programmes[0] ?? null;
  const featuredRun = featuredProgramme?.featuredRun ?? null;

  return (
    <Layout>
      <SEO
        title="Small Group Programmes - Shruti Turner"
        description="Focused multi-week programme blocks with a clear outcome, a fixed cohort, and more accountability than the regular class rhythm."
        canonicalUrl="https://shrutiturner.co.uk/classes/small-groups"
      />

      <EditorialHero
        eyebrow="Small Group Programmes"
        size="compact"
        title={
          <>
            Focused programme blocks for people who want
            <span className="text-brand-accent-light"> more structure and follow-through.</span>
          </>
        }
        description="Programmes sit between drop-in classes and 1:1 coaching: a smaller cohort, a clearer outcome, and enough repetition to build momentum without feeling swallowed by a huge commitment."
        primaryCta={{
          href: "#current-programmes",
          label: programmes.length > 0 ? "View Current Programmes" : "See Upcoming Intakes",
        }}
        secondaryCta={{ href: "/classes", label: "Back to Move Well Classes" }}
        stats={[
          {
            value: featuredProgramme?.durationWeeks
              ? `${featuredProgramme.durationWeeks} weeks`
              : "Multi-week",
            label: "clear progression across the block",
          },
          {
            value: featuredRun ? `${featuredRun.cohortSize}` : "Small",
            label: "cohorts stay deliberately capped",
          },
          {
            value: programmes.length > 0 ? `${programmes.length}` : "Next",
            label:
              programmes.length === 1
                ? "programme available now"
                : "programmes available or queued",
          },
        ]}
        metrics={[
          {
            label: "Best For",
            detail:
              "People who want more repetition, accountability, and shared momentum than the weekly class flow offers.",
          },
          {
            label: "Rhythm",
            detail:
              "A fixed group, a clearer build, and a stronger sense of where each week is leading.",
          },
          {
            label: "Difference",
            detail:
              "You still get adaptation-friendly teaching, but with a tighter container and a more specific outcome.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/7 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
              <div className="bg-brand-dark/55 rounded-[1.45rem] p-6">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  {featuredProgramme ? "Next intake snapshot" : "How programmes work"}
                </p>
                <div className="mt-5 space-y-4">
                  <div className="bg-brand-white/10 rounded-[1.2rem] px-5 py-4">
                    <p className="text-brand-white text-xl leading-tight">
                      {featuredProgramme?.title || "Focused blocks with a clearer training arc"}
                    </p>
                    <p className="text-brand-white/74 mt-2 text-sm leading-relaxed">
                      {featuredProgramme?.subtitle ||
                        "Join a smaller cohort when you want more structure than drop-ins without moving into full coaching."}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-brand-white/10 rounded-[1.15rem] px-4 py-4">
                      <p className="text-brand-accent-light text-[11px] tracking-[0.18em] uppercase">
                        Format
                      </p>
                      <p className="text-brand-white/82 mt-2 text-sm leading-relaxed">
                        {featuredProgramme?.durationLabel || "Multi-week block"} with a fixed
                        cohort.
                      </p>
                    </div>
                    <div className="bg-brand-accent-light/12 rounded-[1.15rem] px-4 py-4">
                      <p className="text-brand-accent-light text-[11px] tracking-[0.18em] uppercase">
                        Booking
                      </p>
                      <p className="text-brand-white/82 mt-2 text-sm leading-relaxed">
                        {featuredRun
                          ? `${featuredRun.priceLabel} · starts ${formatDate(featuredRun.startDate)}`
                          : "New dates appear here when the next intake opens."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="Why programmes feel different from the regular class rhythm"
        description="The point is not just more sessions. It is more continuity, more specific progression, and more room to stay with one outcome for long enough that it compounds."
        items={[
          {
            label: "Specific goal",
            detail:
              "Each block has one clearer theme instead of asking every class to serve every goal at once.",
          },
          {
            label: "Repeat exposure",
            detail:
              "You revisit the work often enough to build familiarity, confidence, and better self-trust.",
          },
          {
            label: "Smaller group",
            detail:
              "Capped numbers keep the space more responsive than a broader weekly timetable can be.",
          },
          {
            label: "Better follow-through",
            detail:
              "A fixed start point and shared cohort make consistency easier when motivation or symptoms fluctuate.",
          },
        ]}
      />

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Why Programmes"
          title="The focused season between weekly classes and 1:1 coaching."
          description="Move Well Classes are the ongoing practice. Programmes are the tighter container for a specific goal when you want more repetition, more accountability, and a clearer build."
          align="center"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {programmeBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="border-brand-dark/10 bg-background rounded-[1.6rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <div className="bg-brand-accent/10 text-brand-accent flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl leading-tight">{item.title}</h3>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{item.body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection id="current-programmes" className="section-wash">
        <SectionHeading
          eyebrow="Current Programmes"
          title="Choose the block that matches the kind of support you want right now."
          description="Current offers appear here first. If there is not a live intake yet, the newsletter is where new dates usually land before social posts."
          align="center"
        />

        {programmes.length > 0 ? (
          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            {programmes.map((programme) => {
              const run = programme.featuredRun;

              return (
                <article
                  key={programme.id}
                  className="border-brand-dark/10 bg-background flex h-full flex-col rounded-[1.9rem] border p-7 shadow-[0_22px_55px_rgba(46,31,51,0.06)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {run?.badge ? (
                      <span className="bg-brand-accent/10 text-brand-accent rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                        {run.badge}
                      </span>
                    ) : (
                      <span className="bg-brand-dark/6 text-foreground rounded-full px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                        Programme block
                      </span>
                    )}
                    <span className="border-brand-dark/10 text-muted-foreground rounded-full border px-4 py-1.5 text-xs tracking-[0.16em] uppercase">
                      {programme.durationLabel}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-3xl leading-tight">{programme.title}</h3>
                    {programme.subtitle ? (
                      <p className="text-muted-foreground mt-3 text-base">{programme.subtitle}</p>
                    ) : null}
                  </div>

                  <div className="text-muted-foreground mt-5 flex flex-wrap gap-3 text-sm">
                    {run?.startDate ? (
                      <span className="border-brand-dark/10 bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                        <Calendar className="h-4 w-4" />
                        Starts {formatDate(run.startDate)}
                      </span>
                    ) : null}
                    <span className="border-brand-dark/10 bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                      <Users className="h-4 w-4" />
                      Max {run?.cohortSize || programme.cohortSize}
                    </span>
                    {programme.sessionsPerWeek ? (
                      <span className="border-brand-dark/10 bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                        <Clock3 className="h-4 w-4" />
                        {programme.sessionsPerWeek} session
                        {programme.sessionsPerWeek === 1 ? "" : "s"} / week
                      </span>
                    ) : null}
                  </div>

                  <p className="text-muted-foreground mt-7 text-lg leading-relaxed">
                    {programme.shortSummary}
                  </p>

                  <div className="mt-7 grid gap-3">
                    {getProgrammeOutcomes(programme).map((point) => (
                      <div
                        key={point}
                        className="border-brand-dark/10 bg-secondary/40 flex items-start gap-3 rounded-[1.2rem] border px-4 py-4"
                      >
                        <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-brand-dark/10 mt-auto border-t pt-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-brand-accent text-3xl">
                          {run?.priceLabel || "Details on request"}
                        </p>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {run
                            ? `${run.spotsFilled} of ${run.cohortSize} spots filled`
                            : "New dates will appear here when the next run is scheduled."}
                        </p>
                      </div>

                      <Button
                        asChild
                        size="lg"
                        className="bg-brand-dark text-brand-white hover:bg-brand-dark/92"
                      >
                        <Link href={programme.detailHref}>
                          View programme details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <p className="text-muted-foreground mt-4 text-sm">
                      {run?.scheduleLabel || "Schedule announced before the next intake opens."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-brand-dark/10 bg-background mx-auto mt-12 max-w-3xl rounded-[1.8rem] border p-8 text-center shadow-[0_18px_45px_rgba(46,31,51,0.05)]">
            <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">No live intake</p>
            <h3 className="mt-4 text-3xl">The next programme block is being prepared.</h3>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Join the newsletter for first notice when the next focused cohort opens, or return to
              the main class timetable if you want something ongoing now.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="bg-brand-dark text-brand-white hover:bg-brand-dark/92">
                <Link href="/subscribe">
                  Join the newsletter
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/schedule">Browse the weekly schedule</Link>
              </Button>
            </div>
          </div>
        )}
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Early notice"
        title="Join the list if you want first notice when the next cohort opens."
        description="New programme blocks often fill quietly from the waitlist first. The newsletter is the easiest way to hear about new dates before they disappear into the wider feed."
        aside={
          <div className="bg-background text-foreground rounded-[1.8rem] p-7 shadow-[0_22px_55px_rgba(37,24,47,0.12)]">
            <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
              Join the waitlist
            </p>
            <h3 className="mt-3 text-2xl">Get programme dates before they go public.</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Expect early notice for new programme blocks, related articles, and occasional offers.
            </p>
            <div className="mt-6">
              <NewsletterInline />
            </div>
          </div>
        }
      />
    </Layout>
  );
}

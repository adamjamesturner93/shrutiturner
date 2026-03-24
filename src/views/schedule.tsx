"use client";

import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Link from "next/link";
import { Clock, Video, Calendar, ArrowRight, Users, Globe } from "lucide-react";
import { MarketingSection, SectionHeading } from "@/components/marketing/sections";
import { getTypeColor } from "@/lib/classes/type-color";
import { BookClassButton } from "../components/booking-modal";
import { useI18n } from "../lib/use-i18n";
import type { PublicThemedWeek } from "@/lib/themed-weeks/service";

type ApiScheduleDay = {
  day: string;
  classes: Array<{
    slug: string;
    name: string;
    type: string;
    day: string;
    time: string;
    duration: string;
    level: string;
    maxSpaces: number;
    shortDescription: string;
    sessionId?: string;
    dateLabel?: string;
    spotsRemaining?: number;
    bookedCount?: number;
    status?: "draft" | "scheduled" | "live" | "completed" | "cancelled";
    isBookedByCurrentUser?: boolean;
    waitlistPosition?: number | null;
  }>;
};

interface SchedulePageProps {
  scheduleData?: ApiScheduleDay[];
  themedWeek?: PublicThemedWeek | null;
}

export function SchedulePage({ scheduleData, themedWeek }: SchedulePageProps) {
  const renderedScheduleData = (scheduleData ?? []) as ApiScheduleDay[];
  const { fmtTimeStr, tzAbbr, londonOffset } = useI18n();
  const themedWeekDateLabel = themedWeek?.startDate
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(themedWeek.startDate))
    : null;

  return (
    <Layout>
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div>
              <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                Weekly Schedule
              </p>
              <h1 className="mt-4 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
                Weekly class times that make it easier to find the right session.
              </h1>
              <p className="text-brand-white/80 mt-5 max-w-2xl text-lg leading-relaxed md:text-[1.35rem]">
                Live online classes every week, designed for real bodies, fluctuating energy, and
                long-term joint health.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
                  >
                    View Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/classes">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-brand-accent-light text-brand-accent-light hover:bg-brand-accent-light/10 bg-transparent"
                  >
                    Explore Classes
                  </Button>
                </Link>
              </div>
            </div>

            <div className="marketing-panel rounded-[2rem] p-6 md:p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                Before you book
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="border-brand-dark/10 bg-background rounded-[1.35rem] border px-4 py-4">
                  <div className="text-foreground flex items-center gap-2 text-sm">
                    <Video className="text-primary h-4 w-4" />
                    <span>All classes are live online</span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Join from home with live cueing and real-time adaptation.
                  </p>
                </div>
                <div className="border-brand-dark/10 bg-background rounded-[1.35rem] border px-4 py-4">
                  <div className="text-foreground flex items-center gap-2 text-sm">
                    <Calendar className="text-primary h-4 w-4" />
                    <span>Flexible attendance</span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Membership and credit options are both flare-friendly.
                  </p>
                </div>
                <div className="border-brand-dark/10 bg-background rounded-[1.35rem] border px-4 py-4">
                  <div className="text-foreground flex items-center gap-2 text-sm">
                    <Clock className="text-primary h-4 w-4" />
                    <span>Times shown in {tzAbbr}</span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Book from your timezone, then drop into the matching class detail if needed.
                  </p>
                </div>
                {londonOffset ? (
                  <div className="border-brand-dark/10 bg-background rounded-[1.35rem] border px-4 py-4">
                    <div className="text-foreground flex items-center gap-2 text-sm">
                      <Globe className="text-primary h-4 w-4" />
                      <span>{londonOffset}</span>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      London remains the anchor timezone for the live timetable.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {themedWeek ? (
        <section className="section-wash py-5">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="bg-brand-accent/5 border-brand-accent/20 flex flex-col gap-6 rounded-[1.6rem] border p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-brand-accent/10 text-brand-accent flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-brand-accent text-sm">
                    Themed Week
                    {themedWeekDateLabel ? ` · ${themedWeekDateLabel}` : ""}
                  </p>
                  <h2 className="text-2xl">{themedWeek.title}</h2>
                  <p className="text-muted-foreground max-w-3xl leading-relaxed">
                    {themedWeek.shortDescription}
                  </p>
                </div>
              </div>
              <Link href={themedWeek.ctaHref}>
                <Button className="bg-brand-accent hover:bg-brand-accent/90 text-white">
                  {themedWeek.ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Weekly Schedule */}
      <section className="section-wash py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="space-y-12">
            {renderedScheduleData.length === 0 ? (
              <div className="marketing-panel rounded-[1.75rem] p-7 text-center">
                <p className="text-muted-foreground text-sm">
                  No upcoming classes in the next 7 days.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild variant="outline">
                    <Link href="/classes">Explore Classes</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            ) : null}
            {renderedScheduleData.map((daySchedule) => (
              <div key={daySchedule.day}>
                <h2 className="border-brand-dark/10 mb-6 border-b pb-3 text-2xl md:text-3xl">
                  {daySchedule.day}
                </h2>
                <div className="space-y-6">
                  {daySchedule.classes.map((classItem, idx) => (
                    <div
                      key={
                        classItem.sessionId ||
                        `${classItem.slug}-${classItem.day}-${classItem.time}-${idx}`
                      }
                      className="marketing-panel rounded-[1.65rem] p-6 transition-shadow"
                    >
                      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr_auto]">
                        {/* Time */}
                        <div className="flex items-center gap-3 md:min-w-[140px]">
                          <Clock className="text-primary h-5 w-5" />
                          <div>
                            <div className="text-lg">{fmtTimeStr(classItem.time)}</div>
                            <div className="text-muted-foreground text-sm">
                              {classItem.duration}
                            </div>
                            {"dateLabel" in classItem && classItem.dateLabel ? (
                              <div className="text-muted-foreground text-xs">
                                {classItem.dateLabel}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Class Info */}
                        <div className="space-y-3">
                          <div>
                            <Link
                              href={
                                classItem.sessionId
                                  ? `/classes/${classItem.slug}?session=${encodeURIComponent(classItem.sessionId)}`
                                  : `/classes/${classItem.slug}`
                              }
                              className="hover:text-primary transition-colors"
                            >
                              <h3 className="mb-2 text-xl">{classItem.name}</h3>
                            </Link>
                            <p className="text-muted-foreground leading-relaxed">
                              {classItem.shortDescription}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={getTypeColor(classItem.type)}>
                              {classItem.type}
                            </Badge>
                            <Badge variant="outline">{classItem.level}</Badge>
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              {classItem.maxSpaces} max
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 md:min-w-[140px]">
                          <BookClassButton
                            sessionId={classItem.sessionId}
                            isBooked={Boolean(classItem.isBookedByCurrentUser)}
                            classSlug={classItem.slug}
                            className={classItem.name}
                            day={classItem.day}
                            time={classItem.time}
                            attendeeCount={classItem.bookedCount ?? 0}
                          />
                          <Link
                            href={
                              classItem.sessionId
                                ? `/classes/${classItem.slug}?session=${encodeURIComponent(classItem.sessionId)}`
                                : `/classes/${classItem.slug}`
                            }
                          >
                            <Button variant="ghost" size="sm" className="w-full md:w-auto">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Class Types Legend */}
      <MarketingSection className="section-divider" compact>
        <SectionHeading
          eyebrow="Class Types"
          title="Choose the rhythm that matches your body."
          description="Each class type lives inside the same adaptive teaching model, but the emphasis changes depending on what support you need."
          align="center"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/classes#yoga"
            className="bg-background border-brand-dark/10 space-y-3 rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)] transition-shadow hover:shadow-md"
          >
            <div className="bg-brand-accent/20 flex h-12 w-12 items-center justify-center rounded-lg">
              <Badge className={getTypeColor("Yoga")}>Yoga</Badge>
            </div>
            <h3 className="text-lg">Adaptive Yoga</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Rehabilitation-informed yoga prioritising stability, nervous system regulation, and
              joint safety. Not mainstream yoga with modifications — a fundamentally different
              approach.
            </p>
          </Link>

          <Link
            href="/classes#strength"
            className="bg-background border-brand-dark/10 space-y-3 rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)] transition-shadow hover:shadow-md"
          >
            <div className="bg-brand-plum/15 flex h-12 w-12 items-center justify-center rounded-lg">
              <Badge className={getTypeColor("Strength")}>Strength</Badge>
            </div>
            <h3 className="text-lg">Strength Classes</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Evidence-based strength work adapted for chronic conditions. Progressive resistance
              training designed to build capacity without aggravating symptoms.
            </p>
          </Link>

          <div className="bg-background border-brand-dark/10 space-y-3 rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
            <div className="bg-brand-rose/15 flex h-12 w-12 items-center justify-center rounded-lg">
              <Badge className={getTypeColor("Cardio")}>Cardio</Badge>
            </div>
            <h3 className="text-lg">Conditioning Support</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Conditioning sessions sit within the wider strength pathway, with adapted intervals
              and work-to-rest ratios designed for people managing fatigue and post-exertional
              symptoms.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash" compact contentClassName="max-w-5xl">
        <SectionHeading
          eyebrow="Important Information"
          title="What to know before you join."
          align="center"
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="border-primary border-l-4 py-2 pl-6">
            <h3 className="mb-2 text-lg">All levels welcome</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every class is adapted in real-time to suit your current capacity. Modifications and
              progressions are provided throughout.
            </p>
          </div>

          <div className="border-primary border-l-4 py-2 pl-6">
            <h3 className="mb-2 text-lg">Cancellation policy</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can cancel your place any time before class starts. If nobody is booked in 3 hours
              before the start time, the class is cancelled automatically and everyone is notified.
            </p>
          </div>

          <div className="border-primary border-l-4 py-2 pl-6">
            <h3 className="mb-2 text-lg">Equipment needed</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Yoga classes:</strong> Yoga mat (or comfortable surface), optional
              blocks/cushions for support.
              <br />
              <strong>Strength classes:</strong> Light dumbbells or household items (water bottles,
              cans), resistance band (optional), chair for support.
            </p>
          </div>

          <div className="border-primary border-l-4 py-2 pl-6">
            <h3 className="mb-2 text-lg">Class size</h3>
            <p className="text-muted-foreground leading-relaxed">
              All classes are capped to ensure everyone gets individual attention and modifications.
              If a class is full, you can join the waitlist or choose another live session that
              week.
            </p>
          </div>

          <div className="border-primary border-l-4 py-2 pl-6">
            <h3 className="mb-2 text-lg">Schedule changes</h3>
            <p className="text-muted-foreground leading-relaxed">
              Occasionally classes may be rescheduled or cancelled (illness, etc.). You'll receive
              email notification at least 24 hours in advance when possible.
            </p>
          </div>
        </div>
      </MarketingSection>

      <section className="bg-brand-accent text-brand-white py-14 md:py-18">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to Join?</h2>
          <div className="grid gap-6 text-left md:grid-cols-3">
            <div className="bg-brand-white/10 rounded-lg p-6">
              <p className="text-brand-white/90 mb-2 text-sm">Single Class</p>
              <p className="mb-2 text-3xl">£9</p>
              <p className="text-sm opacity-90">pay as you go</p>
            </div>
            <div className="bg-brand-white/10 rounded-lg p-6">
              <p className="text-brand-white/90 mb-2 text-sm">10-Class Pack</p>
              <p className="mb-2 text-3xl">£70</p>
              <p className="text-sm opacity-90">£7 per class</p>
            </div>
            <div className="bg-brand-white/10 rounded-lg p-6">
              <p className="text-brand-white/90 mb-2 text-sm">Unlimited classes</p>
              <p className="mb-2 text-3xl">£29</p>
              <p className="text-sm opacity-90">per month</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Link href="/pricing">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                View Full Pricing
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Explore Move Well Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

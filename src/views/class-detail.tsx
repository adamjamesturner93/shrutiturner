"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Dumbbell,
  Heart,
  Info,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { BookClassButton } from "@/components/booking-modal";
import { PreFooterCtaSection } from "@/components/marketing/sections";
import { PublicBreadcrumbs } from "@/components/public-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTypeColor } from "@/lib/classes/type-color";
import { useI18n } from "@/lib/use-i18n";
import type { ClassDefinitionContent } from "@/lib/content/types";

type UpcomingSession = {
  id: string;
  startsAtUtc: string;
  durationMinutes: number;
  spotsRemaining: number;
  capacity: number;
  instructorName?: string | null;
  instructorBio?: string | null;
  isRecorded?: boolean;
  replayAvailable?: boolean;
  chatEnabled?: boolean;
  isBookedByCurrentUser?: boolean;
  waitlistPosition?: number | null;
};

interface ClassDetailPageProps {
  classDetail?: ClassDefinitionContent | null;
  allClasses?: ClassDefinitionContent[];
}

function getSessionDateParts(startsAtUtc: string) {
  const startsAt = new Date(startsAtUtc);

  return {
    month: new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "Europe/London",
    }).format(startsAt),
    dayNumber: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      timeZone: "Europe/London",
    }).format(startsAt),
    weekday: new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      timeZone: "Europe/London",
    }).format(startsAt),
    dateLabel: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(startsAt),
    timeLabel: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
    }).format(startsAt),
  };
}

export function ClassDetailPage({
  classDetail: classDetailProp,
  allClasses,
}: ClassDetailPageProps) {
  const searchParams = useSearchParams();
  const selectedSessionId = searchParams.get("session");
  const classDetail = classDetailProp ?? null;
  const [nextSessionId, setNextSessionId] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [sessionInstructor, setSessionInstructor] = useState<{
    name: string | null;
    bio: string | null;
  } | null>(null);
  const { fmtTimeStr } = useI18n();

  useEffect(() => {
    if (!classDetail) return;

    let active = true;

    void (async () => {
      try {
        const response = await fetch(
          `/api/classes/sessions?slug=${encodeURIComponent(classDetail.slug)}`,
          { cache: "no-store" }
        );
        if (!response.ok) return;

        const payload = (await response.json()) as UpcomingSession[];
        const resolvedSession =
          (selectedSessionId ? payload.find((item) => item.id === selectedSessionId) : undefined) ||
          payload[0];

        if (active) {
          setUpcomingSessions(payload.slice(0, 4));
          setNextSessionId(resolvedSession?.id || null);
          setSessionInstructor({
            name: resolvedSession?.instructorName || null,
            bio: resolvedSession?.instructorBio || null,
          });
        }
      } catch {
        // Keep CTAs available only when a session could be resolved.
      }
    })();

    return () => {
      active = false;
    };
  }, [classDetail, selectedSessionId]);

  if (!classDetail) {
    return (
      <Layout>
        <section className="py-20 md:py-28">
          <div className="container mx-auto max-w-3xl space-y-6 px-4 text-center">
            <h1 className="text-4xl">Class Not Found</h1>
            <p className="text-muted-foreground text-lg">
              Sorry, we could not find that class. It may have been renamed or removed.
            </p>
            <Button asChild size="lg">
              <Link href="/classes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Classes
              </Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const typeIcon =
    classDetail.type === "Yoga" ? (
      <Heart className="h-4 w-4" />
    ) : classDetail.type === "HIIT" ? (
      <Zap className="h-4 w-4" />
    ) : (
      <Dumbbell className="h-4 w-4" />
    );

  const relatedClasses = (allClasses ?? [])
    .filter((c) => c.slug !== classDetail.slug && c.type === classDetail.type)
    .slice(0, 3);
  const heroTypeBadgeClass =
    classDetail.type === "Yoga"
      ? "border-brand-accent-light/45 bg-brand-white/8 text-brand-white"
      : classDetail.type === "HIIT"
        ? "border-brand-copper/55 bg-brand-white/8 text-brand-white"
        : "border-brand-white/30 bg-brand-white/8 text-brand-white";

  const instructorName = sessionInstructor?.name || classDetail.instructor;
  const instructorBio =
    sessionInstructor?.bio ||
    "Strength and yoga coach specialising in rehabilitation-informed training for chronic illness and complex bodies. Living with psoriatic arthritis. PhD Biomechanics, PGDip Rehabilitation, 650hr Yoga Teacher Training, Level 4 Personal Trainer.";
  const instructorInitials = instructorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const selectedSession =
    upcomingSessions.find((session) => session.id === (selectedSessionId || nextSessionId || "")) ||
    null;
  const selectedSessionStartsAt = selectedSession ? new Date(selectedSession.startsAtUtc) : null;

  return (
    <Layout>
      <section className="bg-brand-dark text-brand-white py-14 md:py-18">
        <div className="container mx-auto max-w-6xl px-4">
          <PublicBreadcrumbs
            inverted
            className="mb-8"
            items={[
              { name: "Home", href: "/" },
              { name: "Classes", href: "/classes" },
              { name: classDetail.name, href: `/classes/${classDetail.slug}` },
            ]}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={heroTypeBadgeClass}>
              {typeIcon}
              <span className="ml-1">{classDetail.type}</span>
            </Badge>
            <Badge variant="outline" className="border-brand-white/25 text-brand-white/75">
              {classDetail.level}
            </Badge>
            {selectedSession?.isRecorded ? (
              <Badge variant="outline" className="border-amber-200/35 text-amber-100">
                Recorded
              </Badge>
            ) : null}
          </div>

          <h1 className="max-w-4xl text-4xl leading-tight md:text-5xl lg:text-6xl">
            {classDetail.name}
          </h1>
          <p className="text-brand-white/88 mt-6 max-w-3xl text-xl leading-relaxed md:text-2xl">
            {classDetail.shortDescription}
          </p>

          <div className="text-brand-accent-light mt-7 flex flex-wrap gap-5">
            <div className="flex items-center gap-2 text-sm md:text-base">
              <Calendar className="h-5 w-5" />
              <span>
                {selectedSessionStartsAt
                  ? selectedSessionStartsAt.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })
                  : `${classDetail.day}s`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <Clock className="h-5 w-5" />
              <span>
                {selectedSessionStartsAt
                  ? selectedSessionStartsAt.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : fmtTimeStr(classDetail.time)}{" "}
                ·{" "}
                {selectedSession ? `${selectedSession.durationMinutes} min` : classDetail.duration}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <Users className="h-5 w-5" />
              <span>Max {selectedSession?.capacity || classDetail.maxSpaces} people</span>
            </div>
          </div>

          {selectedSession?.isRecorded ? (
            <div className="text-brand-white/78 mt-6 max-w-3xl rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4 text-sm">
              <p className="text-brand-white">This session is recorded.</p>
              <p className="mt-1">
                The instructor is intentionally recorded. Participants are not intended to be
                recorded, but incidental capture can happen if you unmute, turn on camera, or use
                chat.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <BookClassButton
              sessionId={nextSessionId || undefined}
              isBooked={Boolean(selectedSession?.isBookedByCurrentUser)}
              classSlug={classDetail.slug}
              className={classDetail.name}
              day={classDetail.day}
              time={classDetail.time}
              startsAtUtc={selectedSession?.startsAtUtc}
              spotsRemaining={selectedSession?.spotsRemaining}
              waitlistPosition={selectedSession?.waitlistPosition}
              label={selectedSession?.spotsRemaining === 0 ? "Join waitlist" : "Book Next Session"}
              variant="lg"
            />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand-accent-light text-brand-accent-light hover:bg-brand-accent-light/10 bg-transparent"
            >
              <Link href="/schedule">Full Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section-wash py-14 md:py-18">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_341px] xl:gap-12">
            <div className="space-y-14">
              <section>
                <h2 className="text-3xl md:text-4xl">About This Class</h2>
                <div className="text-muted-foreground mt-8 space-y-5 leading-relaxed">
                  {classDetail.longDescription.split("\n\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="grid gap-8 md:grid-cols-2">
                <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                      <Target className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl md:text-3xl">What to Expect</h2>
                  </div>
                  <ul className="space-y-4">
                    {classDetail.whatToExpect.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl md:text-3xl">Who It&apos;s For</h2>
                  </div>
                  <ul className="space-y-4">
                    {classDetail.whoItsFor.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-3xl md:text-4xl">Benefits</h2>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {classDetail.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-6 shadow-[0_16px_36px_rgba(46,31,51,0.05)]"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-8 flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <Info className="h-5 w-5" />
                  </div>
                  <h2 className="text-3xl md:text-4xl">Equipment Needed</h2>
                </div>
                <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-8 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                  <ul className="space-y-3">
                    {classDetail.equipment.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="text-brand-accent mt-0.5">-</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-6 border-t pt-4 text-sm leading-relaxed">
                    Do not have everything? That is fine. Household substitutions work well, and
                    alternatives are cued at the start of class.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-3xl md:text-4xl">Your Instructor</h2>
                <div className="border-brand-dark/10 bg-background mt-8 rounded-[1.75rem] border p-8 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                  <div className="flex flex-col items-start gap-6 sm:flex-row">
                    <div className="bg-brand-accent/10 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full">
                      <span className="text-brand-accent text-xl">
                        {instructorInitials || "ST"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl">{instructorName}</h3>
                      <p className="text-muted-foreground mt-4 leading-relaxed">{instructorBio}</p>
                      <Link
                        href="/coaching"
                        className="text-primary mt-5 inline-flex items-center gap-2 text-sm hover:underline"
                      >
                        Explore coaching with Shruti
                        <Sparkles className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {relatedClasses.length > 0 ? (
                <section>
                  <h2 className="text-center text-3xl md:text-4xl">
                    More {classDetail.type} Classes
                  </h2>
                  <div className="mt-10 grid gap-5 md:grid-cols-3">
                    {relatedClasses.map((relClass) => (
                      <Link
                        key={relClass.slug}
                        href={`/classes/${relClass.slug}`}
                        className="group border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_16px_36px_rgba(46,31,51,0.05)] transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline" className={getTypeColor(relClass.type)}>
                            {relClass.type}
                          </Badge>
                          <span className="text-muted-foreground text-sm">{relClass.level}</span>
                        </div>
                        <h3 className="group-hover:text-primary mt-4 text-xl transition-colors">
                          {relClass.name}
                        </h3>
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                          {relClass.shortDescription}
                        </p>
                        <div className="text-muted-foreground mt-5 flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {relClass.day}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {fmtTimeStr(relClass.time)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <div className="border-brand-dark/10 bg-background overflow-hidden rounded-[1.75rem] border shadow-[0_20px_50px_rgba(46,31,51,0.08)]">
                <div className="border-brand-dark/10 border-b px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl">Upcoming Sessions</h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Every {classDetail.day} at {fmtTimeStr(classDetail.time)} ·{" "}
                        {classDetail.duration}
                      </p>
                    </div>
                  </div>
                </div>

                {upcomingSessions.length > 0 ? (
                  <div>
                    {upcomingSessions.map((session, index) => {
                      const { month, dayNumber, weekday, dateLabel, timeLabel } =
                        getSessionDateParts(session.startsAtUtc);

                      return (
                        <div
                          key={session.id}
                          className="border-brand-dark/10 border-b px-6 py-5 last:border-b-0"
                        >
                          <div className="flex gap-4">
                            <div className="bg-secondary flex h-[60px] w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg text-center">
                              <span className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                                {month}
                              </span>
                              <span className="text-foreground text-2xl">{dayNumber}</span>
                              <span className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                                {weekday}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm">{timeLabel} GMT</span>
                                {index === 0 ? (
                                  <span className="bg-brand-accent/10 text-brand-accent rounded-full px-2 py-0.5 text-[11px] font-medium">
                                    Next
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-muted-foreground mt-1 text-sm">
                                {session.spotsRemaining}/{session.capacity} spots
                              </p>
                              <div className="mt-3">
                                <BookClassButton
                                  sessionId={session.id}
                                  isBooked={Boolean(session.isBookedByCurrentUser)}
                                  classSlug={classDetail.slug}
                                  className={classDetail.name}
                                  day={dateLabel}
                                  time={fmtTimeStr(classDetail.time)}
                                  startsAtUtc={session.startsAtUtc}
                                  spotsRemaining={session.spotsRemaining}
                                  waitlistPosition={session.waitlistPosition}
                                  size="sm"
                                  label={
                                    session.spotsRemaining === 0
                                      ? "Join waitlist"
                                      : `Book ${dateLabel}`
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted-foreground px-6 py-6 text-sm">
                    Upcoming sessions will appear here when the booking feed is available.
                  </div>
                )}

                <div className="border-brand-dark/10 bg-secondary/20 border-t px-6 py-5">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Members: no penalties for cancellation or no-shows. Credit users: cancel 4+
                    hours before class to keep your credit.
                  </p>
                </div>
              </div>

              <div className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-5 shadow-[0_18px_40px_rgba(46,31,51,0.06)]">
                <div className="grid gap-3">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/schedule">
                      <Calendar className="h-4 w-4" />
                      Full Schedule
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pricing">
                      <Info className="h-4 w-4" />
                      View Pricing
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PreFooterCtaSection
        layout="centered"
        title={`Ready to Try ${classDetail.name}?`}
        description="Drop in from £9, or join the Move Well Membership for regular support and easier weekly practice."
        actions={[
          {
            href: "/pricing",
            label: "View Pricing & Book",
          },
          {
            href: "/schedule",
            label: "Full Schedule",
            variant: "secondary",
          },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: classDetail.name,
            description: classDetail.shortDescription,
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "VirtualLocation",
              url: `https://shrutiturner.co.uk/classes/${classDetail.slug}`,
            },
            organizer: {
              "@type": "Person",
              name: "Shruti Turner",
              url: "https://shrutiturner.co.uk",
            },
            offers: {
              "@type": "Offer",
              price: "9",
              priceCurrency: "GBP",
              availability: "https://schema.org/InStock",
              url: "https://shrutiturner.co.uk/pricing",
              description: "Drop-in from £9. 3-pack £24. Membership from £29/month.",
            },
          }),
        }}
      />
    </Layout>
  );
}

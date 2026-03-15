"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Clock,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Dumbbell,
  Heart,
  Zap,
  Target,
  Info,
} from "lucide-react";
import { getTypeColor } from "@/lib/classes/type-color";
import { BookClassButton } from "../components/booking-modal";
import { useI18n } from "../lib/use-i18n";
import { useEffect, useState } from "react";
import type { ClassDefinitionContent } from "@/lib/content";

type UpcomingSession = {
  id: string;
  startsAtUtc: string;
  durationMinutes: number;
  spotsRemaining: number;
  capacity: number;
  instructorName?: string | null;
  instructorBio?: string | null;
};

interface ClassDetailPageProps {
  classDetail?: ClassDefinitionContent | null;
  allClasses?: ClassDefinitionContent[];
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
          {
            cache: "no-store",
          }
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
        // keep button disabled when no session could be resolved
      }
    })();
    return () => {
      active = false;
    };
  }, [classDetail]);

  if (!classDetail) {
    return (
      <Layout>
        <section className="py-20 md:py-28">
          <div className="container mx-auto max-w-3xl space-y-6 px-4 text-center">
            <h1 className="text-4xl">Class Not Found</h1>
            <p className="text-muted-foreground text-lg">
              Sorry, we couldn't find that class. It may have been renamed or removed from the
              schedule.
            </p>
            <Link href="/schedule">
              <Button size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Schedule
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const typeIcon =
    classDetail.type === "Yoga" ? (
      <Heart className="h-5 w-5" />
    ) : classDetail.type === "HIIT" ? (
      <Zap className="h-5 w-5" />
    ) : (
      <Dumbbell className="h-5 w-5" />
    );

  // Get related classes (same type, excluding current)
  const relatedPool = allClasses ?? [];
  const relatedClasses = relatedPool.filter((c) => c.slug !== classDetail.slug).slice(0, 3);

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
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-brand-dark text-brand-white py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="text-brand-white/60 flex items-center gap-2 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-accent-light transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/schedule" className="hover:text-brand-accent-light transition-colors">
                  Schedule
                </Link>
              </li>
              <li>/</li>
              <li className="text-brand-accent-light">{classDetail.name}</li>
            </ol>
          </nav>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={`${getTypeColor(classDetail.type)} border`}>
              {typeIcon}
              <span className="ml-1">{classDetail.type}</span>
            </Badge>
            <Badge variant="outline" className="border-brand-white/30 text-brand-white/80">
              {classDetail.level}
            </Badge>
          </div>

          <h1 className="mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {classDetail.name}
          </h1>

          <p className="text-brand-white/90 mb-8 max-w-3xl text-xl leading-relaxed md:text-2xl">
            {classDetail.shortDescription}
          </p>

          {/* Quick Stats */}
          <div className="mb-10 flex flex-wrap gap-6">
            <div className="text-brand-accent-light flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{classDetail.day}s</span>
            </div>
            <div className="text-brand-accent-light flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>
                {fmtTimeStr(classDetail.time)} · {classDetail.duration}
              </span>
            </div>
            <div className="text-brand-accent-light flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Max {classDetail.maxSpaces} people</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <BookClassButton
              sessionId={nextSessionId || undefined}
              classSlug={classDetail.slug}
              className={classDetail.name}
              day={classDetail.day}
              time={classDetail.time}
              variant="lg"
            />
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-accent-light text-brand-accent-light hover:bg-brand-accent-light/10 bg-transparent"
              >
                View All Dates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {upcomingSessions.length > 0 ? (
        <section className="py-16 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-8 flex items-start gap-4">
              <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl">Upcoming Sessions</h2>
                <p className="text-muted-foreground mt-1">
                  Every {classDetail.day} at {fmtTimeStr(classDetail.time)} · {classDetail.duration}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => {
                const startsAt = new Date(session.startsAtUtc);
                const month = new Intl.DateTimeFormat("en-GB", {
                  month: "short",
                  timeZone: "Europe/London",
                }).format(startsAt);
                const dayNumber = new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  timeZone: "Europe/London",
                }).format(startsAt);
                const weekday = new Intl.DateTimeFormat("en-GB", {
                  weekday: "short",
                  timeZone: "Europe/London",
                }).format(startsAt);
                const dateLabel = new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/London",
                }).format(startsAt);

                return (
                  <div key={session.id} className="bg-background rounded-xl border p-5 md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-secondary flex min-w-16 flex-col items-center rounded-lg px-3 py-2 text-center">
                          <span className="text-xs uppercase tracking-wide">{month}</span>
                          <span className="text-2xl">{dayNumber}</span>
                          <span className="text-xs uppercase tracking-wide">{weekday}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {fmtTimeStr(classDetail.time)} GMT · {session.durationMinutes} min
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {session.spotsRemaining} of {session.capacity} spots left
                          </p>
                          {index === 0 ? (
                            <Badge variant="outline" className="mt-1">
                              Next session
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <BookClassButton
                        sessionId={session.id}
                        classSlug={classDetail.slug}
                        className={classDetail.name}
                        day={dateLabel}
                        time={fmtTimeStr(classDetail.time)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Members: no penalties for cancellation or no-shows. Credit packs can rebook when they
              cancel before class.
            </p>
          </div>
        </section>
      ) : null}

      {/* Long Description */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-3xl md:text-4xl">About This Class</h2>
          <div className="text-muted-foreground space-y-4 leading-relaxed">
            {classDetail.longDescription.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect + Who It's For */}
      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            {/* What to Expect */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Target className="text-primary h-5 w-5" />
                </div>
                <h2 className="text-2xl md:text-3xl">What to Expect</h2>
              </div>
              <ul className="space-y-4">
                {classDetail.whatToExpect.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Who It's For */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Users className="text-primary h-5 w-5" />
                </div>
                <h2 className="text-2xl md:text-3xl">Who It's For</h2>
              </div>
              <ul className="space-y-4">
                {classDetail.whoItsFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">Benefits</h2>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classDetail.benefits.map((benefit, i) => (
              <div key={i} className="bg-background flex items-start gap-3 rounded-lg border p-6">
                <CheckCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Info className="text-primary h-5 w-5" />
            </div>
            <h2 className="text-2xl md:text-3xl">Equipment Needed</h2>
          </div>
          <div className="bg-background rounded-lg border p-6 md:p-8">
            <ul className="space-y-3">
              {classDetail.equipment.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary mt-1">-</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-6 border-t pt-4 text-sm">
              Don't have everything? Don't worry — Shruti provides alternatives and substitutions at
              the start of each class. Household items work perfectly well.
            </p>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-2xl md:text-3xl">Your Instructor</h2>
          <div className="bg-background rounded-lg border p-6 md:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="bg-brand-accent/10 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-brand-accent text-2xl">{instructorInitials || "ST"}</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl">{instructorName}</h3>
                <p className="text-muted-foreground leading-relaxed">{instructorBio}</p>
                <Link
                  href="/coaching"
                  className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                >
                  Explore coaching with Shruti
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Classes */}
      {relatedClasses.length > 0 && (
        <section className="bg-secondary/20 py-16 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="mb-12 text-center text-3xl md:text-4xl">
              More {classDetail.type} Classes
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedClasses.map((relClass) => (
                <Link
                  key={relClass.slug}
                  href={`/schedule/${relClass.slug}`}
                  className="bg-background group space-y-3 rounded-lg border p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getTypeColor(relClass.type)}>
                      {relClass.type}
                    </Badge>
                    <span className="text-muted-foreground text-sm">{relClass.level}</span>
                  </div>
                  <h3 className="group-hover:text-primary text-lg transition-colors">
                    {relClass.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{relClass.shortDescription}</p>
                  <div className="text-muted-foreground flex items-center gap-4 pt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {relClass.day}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtTimeStr(relClass.time)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-accent text-brand-white py-16 md:py-20">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to Try {classDetail.name}?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Drop in from £9, or join the Move Well Membership for regular support and easier weekly
            practice.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/pricing">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                View Pricing & Book
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Full Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Structured Data */}
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
              url: "https://shrutiturner.com/schedule/" + classDetail.slug,
            },
            organizer: {
              "@type": "Person",
              name: "Shruti Turner",
              url: "https://shrutiturner.com",
            },
            offers: {
              "@type": "Offer",
              price: "9",
              priceCurrency: "GBP",
              availability: "https://schema.org/InStock",
              url: "https://shrutiturner.com/pricing",
              description: "Drop-in from £9. 3-pack £24. Membership from £29/month.",
            },
          }),
        }}
      />
    </Layout>
  );
}

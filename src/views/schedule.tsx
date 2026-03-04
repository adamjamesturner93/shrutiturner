"use client";

import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Link from "next/link";
import { Clock, Video, Calendar, ArrowRight, Users, Globe } from "lucide-react";
import { getScheduleByDay, getTypeColor } from "../data/schedule-data";
import { BookClassButton } from "../components/booking-modal";
import { useI18n } from "../lib/use-i18n";

type ScheduleDay = ReturnType<typeof getScheduleByDay>[number];

interface SchedulePageProps {
  scheduleData?: ScheduleDay[];
}

export function SchedulePage({ scheduleData }: SchedulePageProps) {
  const renderedScheduleData = scheduleData ?? getScheduleByDay();
  const { fmtTimeStr, tzAbbr, londonOffset } = useI18n();

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl md:text-5xl">Class Schedule</h1>
          <p className="mb-8 text-xl leading-relaxed text-[#B5C49B]">
            Live online classes every week. All classes are recorded and available for 7 days if you
            can't make it live.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/pricing">
              <Button size="lg" className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-[#B5C49B] bg-transparent text-[#B5C49B] hover:bg-[#B5C49B]/10"
              >
                Explore Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Schedule Info Bar */}
      <section className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-muted-foreground flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Video className="text-primary h-4 w-4" />
              <span>All classes live online</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="text-primary h-4 w-4" />
              <span>Recordings available for 7 days</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>Times shown in {tzAbbr}</span>
            </div>
            {londonOffset && (
              <div className="flex items-center gap-2">
                <Globe className="text-primary h-4 w-4" />
                <span>{londonOffset}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Weekly Schedule */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="space-y-12">
            {renderedScheduleData.map((daySchedule) => (
              <div key={daySchedule.day}>
                <h2 className="mb-6 border-b pb-3 text-2xl md:text-3xl">{daySchedule.day}</h2>
                <div className="space-y-6">
                  {daySchedule.classes.map((classItem) => (
                    <div
                      key={classItem.slug}
                      className="bg-background rounded-lg border p-6 transition-shadow hover:shadow-md"
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
                          </div>
                        </div>

                        {/* Class Info */}
                        <div className="space-y-3">
                          <div>
                            <Link
                              href={`/schedule/${classItem.slug}`}
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
                            classSlug={classItem.slug}
                            className={classItem.name}
                            day={classItem.day}
                            time={classItem.time}
                          />
                          <Link href={`/schedule/${classItem.slug}`}>
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
      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl">Class Types</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <Link
              href="/classes/yoga"
              className="bg-background space-y-3 rounded-lg border p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4B5B32]/20">
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
              href="/classes/strength"
              className="bg-background space-y-3 rounded-lg border p-6 transition-shadow hover:shadow-md"
            >
              <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-lg">
                <Badge className={getTypeColor("Strength")}>Strength</Badge>
              </div>
              <h3 className="text-lg">Strength Training</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Evidence-based strength work adapted for chronic conditions. Progressive resistance
                training designed to build capacity without aggravating symptoms.
              </p>
            </Link>

            <div className="bg-background space-y-3 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Badge className={getTypeColor("HIIT")}>HIIT</Badge>
              </div>
              <h3 className="text-lg">Modified HIIT</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                High-intensity interval training adapted for complex bodies. Work-to-rest ratios
                designed for people managing fatigue and post-exertional symptoms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl">Important Information</h2>

          <div className="space-y-6">
            <div className="border-primary border-l-4 py-2 pl-6">
              <h3 className="mb-2 text-lg">All levels welcome</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every class is adapted in real-time to suit your current capacity. Modifications and
                progressions are provided throughout.
              </p>
            </div>

            <div className="border-primary border-l-4 py-2 pl-6">
              <h3 className="mb-2 text-lg">Can't make it live?</h3>
              <p className="text-muted-foreground leading-relaxed">
                All classes are recorded and available for 7 days. You can practice on your own
                schedule and still benefit from the programming.
              </p>
            </div>

            <div className="border-primary border-l-4 py-2 pl-6">
              <h3 className="mb-2 text-lg">Equipment needed</h3>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Yoga classes:</strong> Yoga mat (or comfortable surface), optional
                blocks/cushions for support.
                <br />
                <strong>Strength classes:</strong> Light dumbbells or household items (water
                bottles, cans), resistance band (optional), chair for support.
              </p>
            </div>

            <div className="border-primary border-l-4 py-2 pl-6">
              <h3 className="mb-2 text-lg">Class size</h3>
              <p className="text-muted-foreground leading-relaxed">
                All classes are capped to ensure everyone gets individual attention and
                modifications. If a class is full, you can join the waitlist or catch the recording.
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
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to Join?</h2>
          <div className="grid gap-6 text-left md:grid-cols-3">
            <div className="rounded-lg bg-[#FAFAF8]/10 p-6">
              <p className="mb-2 text-sm opacity-75">Drop-In</p>
              <p className="mb-2 text-3xl">£12</p>
              <p className="text-sm opacity-90">single class</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8]/10 p-6">
              <p className="mb-2 text-sm opacity-75">10-Class Bundle</p>
              <p className="mb-2 text-3xl">£90</p>
              <p className="text-sm opacity-90">£9 per class</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8]/10 p-6">
              <p className="mb-2 text-sm opacity-75">Unlimited</p>
              <p className="mb-2 text-3xl">£79</p>
              <p className="text-sm opacity-90">per month</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Link href="/pricing">
              <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
                View Full Pricing
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                Explore Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

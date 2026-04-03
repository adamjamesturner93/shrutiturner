"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { BookClassButton } from "../../components/booking-modal";
import { useAuth } from "../../context/auth-context";
import { useI18n } from "../../lib/use-i18n";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Clock,
  Calendar,
  Users,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Heart,
  Dumbbell,
  Zap,
  Video,
} from "lucide-react";
import { getTypeColor } from "@/lib/classes/type-color";
import { useEffect, useState } from "react";
import type { ClassSessionDetailDto } from "@/lib/api/types";
import type { ClassDefinitionContent } from "@/lib/content";
import {
  getBookingEntitlementText,
  isSessionUnavailableForBooking,
} from "@/lib/classes/session-bookability";

export function DashboardClassDetail({
  classDetail,
}: {
  classDetail: ClassDefinitionContent | null;
}) {
  const { id: slug } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const cls = classDetail && classDetail.slug === slug ? classDetail : null;
  const [session, setSession] = useState<ClassSessionDetailDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const { fmtDate, fmtTime, fmtTimeStr } = useI18n();
  const sessionId = searchParams.get("sessionId");
  const { membership, membershipClassesRemaining, refreshMembershipState, totalCredits } =
    useAuth();
  const weekOffsetParam = searchParams.get("wk");
  const backToScheduleHref = weekOffsetParam
    ? `/dashboard/schedule?wk=${encodeURIComponent(weekOffsetParam)}`
    : "/dashboard/schedule";

  useEffect(() => {
    let active = true;
    if (!cls) return;
    void (async () => {
      if (active) setLoadingSession(true);
      try {
        if (active) {
          setCancelError("");
        }
        if (sessionId) {
          const response = await fetch(`/api/classes/sessions/${sessionId}`, { cache: "no-store" });
          if (response.ok) {
            const payload = (await response.json()) as ClassSessionDetailDto;
            if (active) setSession(payload);
            return;
          }
        }

        const response = await fetch(`/api/classes/sessions?slug=${encodeURIComponent(cls.slug)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as ClassSessionDetailDto[];
        if (active) setSession(payload[0] || null);
      } catch {
        // handled by loading/empty state
      } finally {
        if (active) setLoadingSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cls, sessionId]);

  if (!cls) {
    return (
      <DashboardLayout title="Class Not Found">
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl">Class Not Found</h1>
          <p className="text-muted-foreground">
            This class may have been removed from the schedule.
          </p>
          <Link href={backToScheduleHref}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Schedule
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const booked = !loadingSession && Boolean(session?.isBookedByCurrentUser);
  const resolvedStartsAt = session ? new Date(session.startsAtUtc) : null;
  const resolvedType = session?.type || cls.type;
  const resolvedLevel = session?.level || cls.level;
  const resolvedCapacity = session?.capacity || cls.maxSpaces;
  const resolvedInstructorName = session?.instructorName || cls.instructor;
  const resolvedScheduleDay = resolvedStartsAt
    ? fmtDate(resolvedStartsAt, { weekday: "long", day: "numeric", month: "short" })
    : `${cls.day}s`;
  const resolvedScheduleTime = resolvedStartsAt ? fmtTime(resolvedStartsAt) : fmtTimeStr(cls.time);
  const resolvedDuration = session ? `${session.durationMinutes} min` : cls.duration;
  const isSessionUnavailable = !loadingSession
    ? isSessionUnavailableForBooking({
        attendeeCount: session?.bookedCount,
        day: cls.day,
        emptyClassAutoCancelWindowMinutes: session?.emptyClassAutoCancelWindowMinutes,
        startsAtUtc: session?.startsAtUtc,
        status: session?.status,
        time: cls.time,
      })
    : false;
  const bookingEntitlement = getBookingEntitlementText({
    hasMembership: Boolean(membership),
    membershipClassesRemaining,
    totalCredits,
  });

  const typeIcon =
    resolvedType === "Yoga" ? (
      <Heart className="h-5 w-5" />
    ) : resolvedType === "HIIT" ? (
      <Zap className="h-5 w-5" />
    ) : (
      <Dumbbell className="h-5 w-5" />
    );

  return (
    <DashboardLayout title={`${cls.name} - Private Studio`}>
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href={backToScheduleHref}
          className="text-muted-foreground hover:text-primary inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schedule
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getTypeColor(resolvedType)}>
                {typeIcon}
                <span className="ml-1">{resolvedType}</span>
              </Badge>
              <Badge variant="outline">{resolvedLevel}</Badge>
              {booked && (
                <Badge className="bg-brand-accent text-brand-white gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Booked
                </Badge>
              )}
              {loadingSession && (
                <Badge variant="outline" className="text-xs">
                  Loading booking...
                </Badge>
              )}
            </div>
            <h1 className="mb-3 text-3xl md:text-4xl">{cls.name}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{cls.shortDescription}</p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="text-muted-foreground flex items-center gap-2">
              <Calendar className="text-primary h-4 w-4" />
              <span>{resolvedScheduleDay}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>
                {resolvedScheduleTime} · {resolvedDuration}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Users className="text-primary h-4 w-4" />
              <span>Max {resolvedCapacity} people</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Video className="text-primary h-4 w-4" />
              <span>Live online</span>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="mb-4 text-xl">About This Class</h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed">
              {cls.longDescription.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {session?.instructorName || session?.instructorBio ? (
            <div>
              <h2 className="mb-4 text-xl">Your Instructor</h2>
              <div className="bg-secondary/20 rounded-lg p-5">
                <p>{resolvedInstructorName}</p>
                {session?.instructorBio ? (
                  <p className="text-muted-foreground mt-2 text-sm">{session.instructorBio}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* What to Expect */}
          <div>
            <h2 className="mb-4 text-xl">What to Expect</h2>
            <ul className="space-y-3">
              {cls.whatToExpect.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-brand-accent mt-1 h-4 w-4 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who It's For */}
          <div>
            <h2 className="mb-4 text-xl">Who It's For</h2>
            <ul className="space-y-3">
              {cls.whoItsFor.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-brand-accent mt-1 h-4 w-4 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment */}
          <div>
            <h2 className="mb-4 text-xl">Equipment Needed</h2>
            <div className="bg-secondary/20 rounded-lg p-5">
              <ul className="space-y-2">
                {cls.equipment.map((item, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
                    <span className="text-primary">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
                Don't have everything? Shruti provides alternatives at the start of each class.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background sticky top-6 space-y-6 rounded-lg border p-6">
            {loadingSession ? (
              <>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl">Checking booking...</h3>
                  <p className="text-muted-foreground text-sm">
                    Loading your booking status for this class.
                  </p>
                </div>
                <Button size="lg" disabled className="w-full">
                  Loading...
                </Button>
              </>
            ) : isSessionUnavailable ? (
              <>
                <div className="space-y-3 text-center">
                  <div className="bg-secondary/60 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                    <AlertCircle className="text-primary h-7 w-7" />
                  </div>
                  <h3 className="text-xl">Class Cancelled</h3>
                  <p className="text-muted-foreground text-sm">
                    {resolvedScheduleDay} at {resolvedScheduleTime} · {resolvedDuration}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {session?.status === "cancelled"
                      ? session.cancelReason || "This session is no longer available to book."
                      : "This session closed because nobody booked before the class cutoff."}
                  </p>
                </div>

                <BookClassButton
                  sessionId={session?.id}
                  classSlug={cls.slug}
                  className={cls.name}
                  day={cls.day}
                  startsAtUtc={session?.startsAtUtc}
                  time={cls.time}
                  duration={resolvedDuration}
                  variant="lg"
                  attendeeCount={session?.bookedCount}
                  status={session?.status}
                  emptyClassAutoCancelWindowMinutes={session?.emptyClassAutoCancelWindowMinutes}
                />
              </>
            ) : booked ? (
              <>
                <div className="space-y-3 text-center">
                  <div className="bg-brand-accent/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                    <CheckCircle className="text-brand-accent h-7 w-7" />
                  </div>
                  <h3 className="text-xl">You're Booked</h3>
                  <p className="text-muted-foreground text-sm">
                    {resolvedStartsAt
                      ? `${fmtDate(resolvedStartsAt)} at ${fmtTime(resolvedStartsAt)}`
                      : `${cls.day} at ${fmtTimeStr(cls.time)}`}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <Link
                    className="block"
                    href={
                      session?.id
                        ? `/dashboard/classes/${cls.slug}/join?sessionId=${encodeURIComponent(session.id)}`
                        : `/dashboard/classes/${cls.slug}/join`
                    }
                  >
                    <Button size="lg" className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      Join Class
                    </Button>
                  </Link>

                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    disabled={cancellingBooking}
                    onClick={() =>
                      void (async () => {
                        if (!session?.id) {
                          return;
                        }

                        setCancellingBooking(true);
                        setCancelError("");
                        try {
                          const response = await fetch(`/api/classes/sessions/${session.id}/booking`, {
                            method: "DELETE",
                          });
                          if (!response.ok) {
                            const payload = (await response.json().catch(() => null)) as {
                              message?: string;
                            } | null;
                            throw new Error(payload?.message || "Failed to cancel booking.");
                          }
                          setSession((prev) =>
                            prev ? { ...prev, isBookedByCurrentUser: false } : prev
                          );
                          await refreshMembershipState();
                        } catch (error) {
                          setCancelError(
                            error instanceof Error ? error.message : "Failed to cancel booking."
                          );
                        } finally {
                          setCancellingBooking(false);
                        }
                      })()
                    }
                  >
                    {cancellingBooking ? "Cancelling..." : "Cancel Booking"}
                  </Button>
                  {cancelError ? (
                    <p className="text-center text-sm text-red-600">{cancelError}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl">Book This Class</h3>
                  <p className="text-muted-foreground text-sm">
                    {resolvedScheduleDay} at {resolvedScheduleTime} · {resolvedDuration}
                  </p>
                </div>
                <BookClassButton
                  sessionId={session?.id}
                  classSlug={cls.slug}
                  className={cls.name}
                  day={cls.day}
                  startsAtUtc={session?.startsAtUtc}
                  time={cls.time}
                  duration={resolvedDuration}
                  variant="lg"
                  attendeeCount={session?.bookedCount}
                  status={session?.status}
                  emptyClassAutoCancelWindowMinutes={session?.emptyClassAutoCancelWindowMinutes}
                />
                <p className="text-muted-foreground text-center text-xs">{bookingEntitlement}</p>
              </>
            )}

            {/* Instructor */}
            <div className="border-t pt-4">
              <h4 className="text-muted-foreground mb-2 text-sm">Instructor</h4>
              <div className="flex items-center gap-3">
                <div className="bg-brand-accent/10 text-brand-accent flex h-10 w-10 items-center justify-center rounded-full text-sm">
                  ST
                </div>
                <div>
                  <p className="text-sm">Shruti Turner</p>
                  <p className="text-muted-foreground text-xs">PhD · PGDip Rehab · 650hr Yoga</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

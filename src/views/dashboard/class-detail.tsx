"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { BookClassButton } from "../../components/booking-modal";
import { useI18n } from "../../lib/use-i18n";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Clock,
  Calendar,
  Users,
  ArrowLeft,
  CheckCircle,
  Heart,
  Dumbbell,
  Zap,
  Video,
  X,
} from "lucide-react";
import { getClassBySlug, getTypeColor, classDetails } from "../../data/schedule-data";
import { ClassRecordingsSection } from "../../components/class-recording";

export function DashboardClassDetail() {
  const { id: slug } = useParams<{ id: string }>();
  const { isClassBooked, getBookingForClass, cancelBooking } = useAuth();
  const cls = classDetails.find((c) => c.slug === slug);
  const { fmtTimeStr } = useI18n();

  if (!cls) {
    return (
      <DashboardLayout title="Class Not Found">
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl">Class Not Found</h1>
          <p className="text-muted-foreground">
            This class may have been removed from the schedule.
          </p>
          <Link href="/dashboard/schedule">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Schedule
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const booked = isClassBooked(cls.slug);
  const booking = getBookingForClass(cls.slug);

  const typeIcon =
    cls.type === "Yoga" ? (
      <Heart className="h-5 w-5" />
    ) : cls.type === "HIIT" ? (
      <Zap className="h-5 w-5" />
    ) : (
      <Dumbbell className="h-5 w-5" />
    );

  return (
    <DashboardLayout title={`${cls.name} - Private Studio`}>
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/dashboard/schedule"
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
              <Badge variant="outline" className={getTypeColor(cls.type)}>
                {typeIcon}
                <span className="ml-1">{cls.type}</span>
              </Badge>
              <Badge variant="outline">{cls.level}</Badge>
              {booked && (
                <Badge className="gap-1 bg-[#4B5B32] text-[#FAFAF8]">
                  <CheckCircle className="h-3 w-3" />
                  Booked
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
              <span>{cls.day}s</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>
                {fmtTimeStr(cls.time)} · {cls.duration}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Users className="text-primary h-4 w-4" />
              <span>Max {cls.maxSpaces} people</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Video className="text-primary h-4 w-4" />
              <span>Live online · 7-day replay</span>
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

          {/* What to Expect */}
          <div>
            <h2 className="mb-4 text-xl">What to Expect</h2>
            <ul className="space-y-3">
              {cls.whatToExpect.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
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
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
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

          {/* Recordings */}
          <ClassRecordingsSection classSlug={cls.slug} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background sticky top-6 space-y-6 rounded-lg border p-6">
            {booked ? (
              <>
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4B5B32]/10">
                    <CheckCircle className="h-7 w-7 text-[#4B5B32]" />
                  </div>
                  <h3 className="text-xl">You're Booked</h3>
                  <p className="text-muted-foreground text-sm">
                    {cls.day} at {fmtTimeStr(cls.time)}
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href={`/dashboard/classes/${cls.slug}/join`}>
                    <Button size="lg" className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      Join Class
                    </Button>
                  </Link>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (booking) cancelBooking(booking.id);
                    }}
                  >
                    Cancel Booking
                  </Button>
                </div>

                {booking && (
                  <div className="bg-secondary/20 text-muted-foreground rounded-lg p-3 text-xs">
                    Booked using: {booking.creditUsed.label}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl">Book This Class</h3>
                  <p className="text-muted-foreground text-sm">
                    {cls.day} at {fmtTimeStr(cls.time)} · {cls.duration}
                  </p>
                </div>
                <BookClassButton
                  classSlug={cls.slug}
                  className={cls.name}
                  day={cls.day}
                  time={cls.time}
                  variant="lg"
                />
                <p className="text-muted-foreground text-center text-xs">
                  Drop-in £12 · Bundles from £9/class
                </p>
              </>
            )}

            {/* Instructor */}
            <div className="border-t pt-4">
              <h4 className="text-muted-foreground mb-2 text-sm">Instructor</h4>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4B5B32]/10 text-sm text-[#4B5B32]">
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

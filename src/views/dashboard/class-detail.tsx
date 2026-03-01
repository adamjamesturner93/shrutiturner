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
        <div className="text-center py-20 space-y-4">
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
      <Heart className="w-5 h-5" />
    ) : cls.type === "HIIT" ? (
      <Zap className="w-5 h-5" />
    ) : (
      <Dumbbell className="w-5 h-5" />
    );

  return (
    <DashboardLayout title={`${cls.name} - Private Studio`}>
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/dashboard/schedule"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schedule
        </Link>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className={getTypeColor(cls.type)}>
                {typeIcon}
                <span className="ml-1">{cls.type}</span>
              </Badge>
              <Badge variant="outline">{cls.level}</Badge>
              {booked && (
                <Badge className="bg-[#4B5B32] text-[#FAFAF8] gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Booked
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl mb-3">{cls.name}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {cls.shortDescription}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{cls.day}s</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                {fmtTimeStr(cls.time)} · {cls.duration}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>Max {cls.maxSpaces} people</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="w-4 h-4 text-primary" />
              <span>Live online · 7-day replay</span>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-xl mb-4">About This Class</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {cls.longDescription.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* What to Expect */}
          <div>
            <h2 className="text-xl mb-4">What to Expect</h2>
            <ul className="space-y-3">
              {cls.whatToExpect.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4B5B32] flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who It's For */}
          <div>
            <h2 className="text-xl mb-4">Who It's For</h2>
            <ul className="space-y-3">
              {cls.whoItsFor.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4B5B32] flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment */}
          <div>
            <h2 className="text-xl mb-4">Equipment Needed</h2>
            <div className="bg-secondary/20 rounded-lg p-5">
              <ul className="space-y-2">
                {cls.equipment.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                Don't have everything? Shruti provides alternatives at the start
                of each class.
              </p>
            </div>
          </div>

          {/* Recordings */}
          <ClassRecordingsSection classSlug={cls.slug} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background border rounded-lg p-6 space-y-6 sticky top-6">
            {booked ? (
              <>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 text-[#4B5B32]" />
                  </div>
                  <h3 className="text-xl">You're Booked</h3>
                  <p className="text-sm text-muted-foreground">
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
                  <div className="bg-secondary/20 rounded-lg p-3 text-xs text-muted-foreground">
                    Booked using: {booking.creditUsed.label}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h3 className="text-xl">Book This Class</h3>
                  <p className="text-sm text-muted-foreground">
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
                <p className="text-xs text-muted-foreground text-center">
                  Drop-in £12 · Bundles from £9/class
                </p>
              </>
            )}

            {/* Instructor */}
            <div className="border-t pt-4">
              <h4 className="text-sm text-muted-foreground mb-2">Instructor</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4B5B32]/10 flex items-center justify-center text-sm text-[#4B5B32]">
                  ST
                </div>
                <div>
                  <p className="text-sm">Shruti Turner</p>
                  <p className="text-xs text-muted-foreground">
                    PhD · PGDip Rehab · 650hr Yoga
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { BookClassButton } from "../../components/booking-modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Users,
  Calendar,
  Heart,
  Dumbbell,
  Zap,
  Check,
  Filter,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTypeColor } from "@/lib/classes/type-color";
import { useI18n } from "../../lib/use-i18n";
import { RecordingsLibrary, useRecordingAccess } from "../../components/class-recording";

const TYPE_FILTERS = ["All", "Yoga", "Strength", "HIIT"];
const LEVEL_FILTERS = ["All Levels", "Beginner", "Intermediate", "Adaptive", "Specialised"];
type ScheduleClassItem = {
  id?: string;
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
  status?: "scheduled" | "live" | "completed" | "cancelled";
  isBookedByCurrentUser?: boolean;
  waitlistPosition?: number | null;
};
type ScheduleDay = {
  day: string;
  classes: ScheduleClassItem[];
};

type DashboardScheduleProps = {
  initialSchedule?: ScheduleDay[];
  initialWeekOffset?: number;
};

function getScheduleWindow(weekOffset: number) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  if (weekOffset === 0) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() + diffToMonday + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(start);
  if (weekOffset === 0) {
    const nextMonday = new Date(start);
    nextMonday.setDate(nextMonday.getDate() + (day === 0 ? 1 : 8 - day));
    nextMonday.setHours(0, 0, 0, 0);
    end.setTime(nextMonday.getTime());
  } else {
    end.setDate(end.getDate() + 7);
  }

  return { start, end };
}

function formatWeekRange(start: Date, endExclusive: Date) {
  const endInclusive = new Date(endExclusive);
  endInclusive.setDate(endInclusive.getDate() - 1);

  const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endLabel = endInclusive.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return `${startLabel} - ${endLabel}`;
}

export function DashboardSchedule({ initialSchedule = [], initialWeekOffset = 0 }: DashboardScheduleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>(initialSchedule);
  const [typeFilter, setTypeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [activeTab, setActiveTab] = useState<"schedule" | "recordings">("schedule");
  const [weekOffset, setWeekOffset] = useState(
    Number.isFinite(initialWeekOffset) && initialWeekOffset >= 0 ? initialWeekOffset : 0
  );
  const { fmtTimeStr, tzAbbr, londonOffset } = useI18n();
  useRecordingAccess();
  const { start, end } = getScheduleWindow(weekOffset);
  const weekRangeLabel = formatWeekRange(start, end);

  const filterClasses = (classes: ScheduleClassItem[]) => {
    return classes.filter((cls) => {
      if (typeFilter !== "All" && cls.type !== typeFilter) return false;
      if (levelFilter !== "All Levels" && cls.level !== levelFilter) return false;
      return true;
    });
  };

  const typeIcon = (type: string) => {
    if (type === "Yoga") return <Heart className="h-4 w-4" />;
    if (type === "HIIT") return <Zap className="h-4 w-4" />;
    return <Dumbbell className="h-4 w-4" />;
  };

  useEffect(() => {
    const initialMatches = weekOffset === initialWeekOffset;
    if (initialMatches && initialSchedule.length > 0) return;
    const { start: fetchStart, end: fetchEnd } = getScheduleWindow(weekOffset);
    let active = true;
    void (async () => {
      try {
        const response = await fetch(
          `/api/classes/sessions?groupByDay=true&from=${encodeURIComponent(fetchStart.toISOString())}&to=${encodeURIComponent(fetchEnd.toISOString())}`,
          { cache: "no-store" }
        );
        if (!response.ok) return;
        const payload = (await response.json()) as ScheduleDay[];
        if (active && payload.length > 0) setScheduleData(payload);
        if (active && payload.length === 0) setScheduleData([]);
      } catch {
        // keep fallback data
      }
    })();
    return () => {
      active = false;
    };
  }, [initialSchedule, initialWeekOffset, weekOffset]);

  useEffect(() => {
    const target = weekOffset > 0 ? `/dashboard/schedule?wk=${weekOffset}` : "/dashboard/schedule";
    const current = searchParams.get("wk");
    if ((weekOffset === 0 && !current) || (weekOffset > 0 && current === String(weekOffset))) {
      return;
    }
    router.replace(target);
  }, [router, searchParams, weekOffset]);

  return (
    <DashboardLayout title="Schedule - Private Studio">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl">Class Schedule</h1>
        <p className="text-muted-foreground">
          Browse, filter, and book your classes. Start with what feels manageable.
        </p>
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Clock className="text-primary h-3.5 w-3.5" />
            Times shown in {tzAbbr}
          </span>
          {londonOffset && <span className="text-muted-foreground/70">({londonOffset})</span>}
        </div>
      </div>

      {/* Schedule / Recordings tabs */}
      <div className="mb-8 flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`relative px-4 py-2.5 text-sm transition-colors ${
            activeTab === "schedule"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </span>
          {activeTab === "schedule" && (
            <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("recordings")}
          className={`relative px-4 py-2.5 text-sm transition-colors ${
            activeTab === "recordings"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Recordings
          </span>
          {activeTab === "recordings" && (
            <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
      </div>

      {activeTab === "recordings" ? (
        <RecordingsLibrary />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {weekOffset === 0 ? `This week: ${weekRangeLabel}` : weekRangeLabel}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              <span>Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {LEVEL_FILTERS.map((l) => (
                <Button
                  key={l}
                  variant={levelFilter === l ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLevelFilter(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          {/* Schedule by day */}
          <div className="space-y-10">
            {scheduleData.map((daySchedule) => {
              const filtered = filterClasses(daySchedule.classes);
              if (filtered.length === 0) return null;

              return (
                <div key={daySchedule.day}>
                  <h2 className="mb-4 border-b pb-2 text-2xl">{daySchedule.day}</h2>
                  <div className="space-y-4">
                    {filtered.map((cls, idx) => {
                      const booked = Boolean(cls.isBookedByCurrentUser);
                      return (
                        <div
                          key={cls.sessionId || `${cls.slug}-${cls.day}-${cls.time}-${idx}`}
                          className={`bg-background rounded-lg border p-5 transition-shadow hover:shadow-md ${
                            booked ? "border-[#4B5B32] bg-[#4B5B32]/5" : ""
                          }`}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            {/* Time + Type */}
                            <div className="flex items-center gap-3 md:min-w-[160px]">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                  cls.type === "Yoga"
                                    ? "bg-[#4B5B32]/10 text-[#4B5B32]"
                                    : cls.type === "HIIT"
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-primary/10 text-primary"
                                }`}
                              >
                                {typeIcon(cls.type)}
                              </div>
                              <div>
                                <p className="text-sm">{fmtTimeStr(cls.time)}</p>
                                <p className="text-muted-foreground text-xs">{cls.duration}</p>
                              </div>
                            </div>

                            {/* Class info */}
                            <div className="flex-1">
                              <Link
                                href={
                                  cls.sessionId
                                    ? `/dashboard/classes/${cls.slug}?sessionId=${encodeURIComponent(cls.sessionId)}&wk=${weekOffset}`
                                    : `/dashboard/classes/${cls.slug}?wk=${weekOffset}`
                                }
                                className="hover:text-primary transition-colors"
                              >
                                <h3 className="mb-1 text-lg">{cls.name}</h3>
                              </Link>
                              <p className="text-muted-foreground line-clamp-1 text-sm">
                                {cls.shortDescription}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className={getTypeColor(cls.type)}>
                                  {cls.type}
                                </Badge>
                                <Badge variant="outline">{cls.level}</Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Users className="h-3 w-3" />
                                  {cls.maxSpaces} max
                                </Badge>
                                {booked && (
                                  <Badge className="gap-1 bg-[#4B5B32] text-[#FAFAF8]">
                                    <Check className="h-3 w-3" />
                                    Booked
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 md:min-w-[180px] md:justify-end">
                              {booked ? (
                                <Link
                                  href={
                                    cls.sessionId
                                      ? `/dashboard/classes/${cls.slug}?sessionId=${encodeURIComponent(cls.sessionId)}&wk=${weekOffset}`
                                      : `/dashboard/classes/${cls.slug}?wk=${weekOffset}`
                                  }
                                >
                                  <Button>View Details</Button>
                                </Link>
                              ) : (
                                <BookClassButton
                                  sessionId={cls.sessionId}
                                  isBooked={Boolean(cls.isBookedByCurrentUser)}
                                  classSlug={cls.slug}
                                  className={cls.name}
                                  day={cls.day}
                                  time={cls.time}
                                  attendeeCount={cls.bookedCount ?? 0}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

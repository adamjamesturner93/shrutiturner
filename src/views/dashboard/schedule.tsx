"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { BookClassButton } from "../../components/booking-modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";
import {
  getScheduleByDay,
  getTypeColor,
  type ClassDetail,
} from "../../data/schedule-data";
import { useI18n } from "../../lib/use-i18n";
import { RecordingsLibrary, useRecordingAccess } from "../../components/class-recording";

const TYPE_FILTERS = ["All", "Yoga", "Strength", "HIIT"];
const LEVEL_FILTERS = ["All Levels", "Beginner", "Intermediate", "Adaptive", "Specialised"];

export function DashboardSchedule() {
  const { isClassBooked } = useAuth();
  const scheduleData = getScheduleByDay();
  const [typeFilter, setTypeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [activeTab, setActiveTab] = useState<"schedule" | "recordings">("schedule");
  const { fmtTimeStr, tzAbbr, londonOffset } = useI18n();
  const { hasAccess: hasRecordingAccess } = useRecordingAccess();

  const filterClasses = (classes: ClassDetail[]) => {
    return classes.filter((cls) => {
      if (typeFilter !== "All" && cls.type !== typeFilter) return false;
      if (levelFilter !== "All Levels" && cls.level !== levelFilter) return false;
      return true;
    });
  };

  const typeIcon = (type: string) => {
    if (type === "Yoga") return <Heart className="w-4 h-4" />;
    if (type === "HIIT") return <Zap className="w-4 h-4" />;
    return <Dumbbell className="w-4 h-4" />;
  };

  return (
    <DashboardLayout title="Schedule - Private Studio">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Class Schedule</h1>
        <p className="text-muted-foreground">
          Browse, filter, and book your classes. Start with what feels
          manageable.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Times shown in {tzAbbr}
          </span>
          {londonOffset && (
            <span className="text-muted-foreground/70">
              ({londonOffset})
            </span>
          )}
        </div>
      </div>

      {/* Schedule / Recordings tabs */}
      <div className="flex gap-1 mb-8 border-b">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2.5 text-sm transition-colors relative ${
            activeTab === "schedule"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </span>
          {activeTab === "schedule" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2.5 text-sm transition-colors relative ${
            activeTab === "recordings"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Recordings
          </span>
          {activeTab === "recordings" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "recordings" ? (
        <RecordingsLibrary />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
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
                  <h2 className="text-2xl mb-4 pb-2 border-b">
                    {daySchedule.day}
                  </h2>
                  <div className="space-y-4">
                    {filtered.map((cls) => {
                      const booked = isClassBooked(cls.slug);
                      return (
                        <div
                          key={cls.slug}
                          className={`bg-background border rounded-lg p-5 transition-shadow hover:shadow-md ${
                            booked ? "border-[#4B5B32] bg-[#4B5B32]/5" : ""
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Time + Type */}
                            <div className="flex items-center gap-3 md:min-w-[160px]">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
                                <p className="text-xs text-muted-foreground">
                                  {cls.duration}
                                </p>
                              </div>
                            </div>

                            {/* Class info */}
                            <div className="flex-1">
                              <Link href={`/dashboard/classes/${cls.slug}`}
                                className="hover:text-primary transition-colors"
                              >
                                <h3 className="text-lg mb-1">{cls.name}</h3>
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {cls.shortDescription}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className={getTypeColor(cls.type)}
                                >
                                  {cls.type}
                                </Badge>
                                <Badge variant="outline">{cls.level}</Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Users className="w-3 h-3" />
                                  {cls.maxSpaces} max
                                </Badge>
                                {booked && (
                                  <Badge className="bg-[#4B5B32] text-[#FAFAF8] gap-1">
                                    <Check className="w-3 h-3" />
                                    Booked
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 md:min-w-[180px] md:justify-end">
                              {booked ? (
                                <Link href={`/dashboard/classes/${cls.slug}`}>
                                  <Button>
                                    View Details
                                  </Button>
                                </Link>
                              ) : (
                                <BookClassButton
                                  classSlug={cls.slug}
                                  className={cls.name}
                                  day={cls.day}
                                  time={cls.time}
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
"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Clock, Users, Play, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import {
  ScheduleClassModal,
  type ScheduleClassData,
  type ClassTemplateOption,
  type InstructorOption,
  type InstructorProfileOption,
} from "../../components/admin/schedule-class-modal";
import type { AdminClassSessionDto } from "@/lib/classes/types";
import { getTypeColor } from "@/lib/classes/type-color";

const STATUS_ICON: Record<string, typeof Play> = {
  scheduled: Clock,
  live: Play,
  completed: CheckCircle,
  cancelled: XCircle,
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  live: { label: "Live", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function AdminClasses() {
  const [sessions, setSessions] = useState<AdminClassSessionDto[]>([]);
  const [templates, setTemplates] = useState<ClassTemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [instructorProfiles, setInstructorProfiles] = useState<InstructorProfileOption[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const [sessionResponse, templateResponse] = await Promise.all([
          fetch("/api/admin/classes/sessions", { cache: "no-store" }),
          fetch("/api/content/classes", { cache: "no-store" }),
        ]);
        const [instructorResponse, profileResponse] = await Promise.all([
          fetch("/api/admin/members?role=instructor", { cache: "no-store" }),
          fetch("/api/admin/instructors/profiles", { cache: "no-store" }),
        ]);
        if (sessionResponse.ok) {
          const payload = (await sessionResponse.json()) as AdminClassSessionDto[];
          if (active) setSessions(payload);
        }
        if (templateResponse.ok) {
          const payload = (await templateResponse.json()) as {
            items: Array<{
              slug: string;
              name: string;
              type: string;
              day?: string;
              time: string;
              duration: string;
              level: string;
              maxSpaces: number;
            }>;
          };
          if (active) {
            setTemplates(
              payload.items.map((item) => ({
                slug: item.slug,
                name: item.name,
                type: item.type,
                defaultDay: item.day,
                defaultTime: item.time,
                duration: item.duration,
                level: item.level,
                maxSpaces: item.maxSpaces,
              }))
            );
          }
        }
        if (instructorResponse.ok) {
          const payload = (await instructorResponse.json()) as Array<{
            id: string;
            firstName: string;
            lastName: string;
            instructorProfileEntryId?: string | null;
          }>;
          if (active) {
            setInstructors(
              payload.map((row) => ({
                id: row.id,
                name: `${row.firstName} ${row.lastName}`.trim() || row.id,
                instructorProfileEntryId: row.instructorProfileEntryId || null,
              }))
            );
          }
        }
        if (profileResponse.ok) {
          const payload = (await profileResponse.json()) as Array<{
            id: string;
            name: string;
            headline?: string;
            bio?: string;
          }>;
          if (active) {
            setInstructorProfiles(
              payload.map((row) => ({
                id: row.id,
                name: row.name,
                headline: row.headline || "",
                bio: row.bio || "",
              }))
            );
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = sessions.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesType = typeFilter === "all" || c.type.toLowerCase() === typeFilter;
    return matchesStatus && matchesType;
  });

  const scheduled = sessions.filter((c) => c.status === "scheduled");
  const completed = sessions.filter((c) => c.status === "completed");

  // Total attendance rate from completed
  const totalBooked = completed.reduce((s, c) => s + c.bookedCount, 0);
  const totalAttended = completed.reduce((s, c) => s + c.bookedCount, 0);
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

  const handleSchedule = async (
    data: ScheduleClassData & { repeatWeeks?: number; weekdays?: number[] }
  ) => {
    const template = templates.find((cls) => cls.slug === data.classTemplateSlug);
    if (!template) return;
    const payload = {
      classDefinitionSlug: data.classTemplateSlug,
      startDate: data.date,
      timeLocal: data.time,
      durationMinutes: parseInt(template.duration, 10) || 60,
      capacity: data.maxSpaces,
      repeatWeeks: data.repeatWeeks || 1,
      weekdays: data.weekdays || [new Date(`${data.date}T00:00:00`).getDay()],
      instructorUserId: data.instructorUserId,
      instructorProfileEntryId: data.instructorProfileEntryId,
      notes: data.notes,
    };
    const response = await fetch("/api/admin/classes/sessions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const refreshed = await fetch("/api/admin/classes/sessions", { cache: "no-store" });
      if (refreshed.ok) setSessions((await refreshed.json()) as AdminClassSessionDto[]);
    }
  };

  return (
    <AdminLayout title="Classes - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">Class Management</h1>
            <p className="text-muted-foreground mt-1">
              {scheduled.length} upcoming · {completed.length} completed this period
            </p>
            {loading ? <p className="text-muted-foreground mt-1 text-sm">Loading...</p> : null}
          </div>
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="bg-brand-accent hover:bg-brand-accent/90"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Class
          </Button>
        </div>

        <ScheduleClassModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          templates={templates}
          instructors={instructors}
          instructorProfiles={instructorProfiles}
          onSchedule={handleSchedule}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{scheduled.length}</p>
                  <p className="text-muted-foreground text-xs">Upcoming classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">
                    {scheduled.reduce((s, c) => s + c.bookedCount, 0)}
                  </p>
                  <p className="text-muted-foreground text-xs">Total bookings (upcoming)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{attendanceRate}%</p>
                  <p className="text-muted-foreground text-xs">Attendance rate (completed)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            <option value="yoga">Yoga</option>
            <option value="strength">Strength</option>
            <option value="hiit">HIIT</option>
          </select>
        </div>

        {/* Class list */}
        <div className="space-y-3">
          {filtered.map((cls) => (
            <ClassRow key={cls.id} classInstance={cls} />
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">No classes match your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ClassRow({ classInstance }: { classInstance: AdminClassSessionDto }) {
  const statusBadge = STATUS_BADGE[classInstance.status] || STATUS_BADGE.scheduled;
  const StatusIcon = STATUS_ICON[classInstance.status];
  const typeColor = getTypeColor(classInstance.type as "Yoga" | "Strength" | "HIIT");
  const fillPercent =
    classInstance.capacity > 0
      ? Math.round((classInstance.bookedCount / classInstance.capacity) * 100)
      : 0;
  const startsAt = new Date(classInstance.startsAtUtc);
  const day = startsAt.toLocaleDateString("en-GB", { weekday: "long" });
  const date = startsAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={`/admin/classes/${classInstance.id}`}>
      <Card className="hover:border-brand-accent/30 cursor-pointer transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Status icon */}
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                classInstance.status === "live"
                  ? "bg-brand-accent text-brand-white"
                  : "bg-secondary"
              }`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm">{classInstance.title}</p>
                <Badge className={typeColor}>{classInstance.type}</Badge>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {day} {date} · {time} · {classInstance.durationMinutes} min
              </p>
            </div>

            {/* Capacity bar */}
            <div className="hidden w-32 md:block">
              <div className="mb-1 flex justify-between text-xs">
                <span>
                  {classInstance.bookedCount}/{classInstance.capacity}
                </span>
                <span className="text-muted-foreground">{fillPercent}%</span>
              </div>
              <div className="bg-secondary h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${
                    fillPercent >= 90
                      ? "bg-destructive"
                      : fillPercent >= 70
                        ? "bg-amber-500"
                        : "bg-brand-accent"
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* Action hint */}
            {classInstance.status === "scheduled" && (
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Play className="mr-1 h-3 w-3" /> Start
              </Button>
            )}

            <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Play,
  RefreshCw,
  Repeat,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  ScheduleClassModal,
  type ScheduleClassData,
  type ClassTemplateOption,
  type InstructorOption,
  type InstructorProfileOption,
} from "../../components/admin/schedule-class-modal";
import type { AdminClassSessionDto, ClassTimetableRuleDto } from "@/lib/classes/types";
import { getTypeColor } from "@/lib/classes/type-color";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { getWeekEndExclusiveIso, groupAdminSessionsByWeek } from "@/lib/classes/admin-week-groups";

const STATUS_ICON: Record<string, typeof Play> = {
  draft: Clock,
  scheduled: Clock,
  live: Play,
  completed: CheckCircle,
  cancelled: XCircle,
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "outline" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  live: { label: "Live", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DRAFT_PLANNING_DAYS = 8 * 7;
const LIVE_PUBLISH_DAYS = 4 * 7;

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function AdminClasses() {
  const todayInput = formatInputDate(new Date());
  const maxGenerateUntilDate = formatInputDate(addDays(new Date(), DRAFT_PLANNING_DAYS));
  const maxPublishWeekStart = formatInputDate(addDays(new Date(), LIVE_PUBLISH_DAYS));
  const [sessions, setSessions] = useState<AdminClassSessionDto[]>([]);
  const [timetables, setTimetables] = useState<ClassTimetableRuleDto[]>([]);
  const [templates, setTemplates] = useState<ClassTemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingAll, setPublishingAll] = useState(false);
  const [publishingWeekStart, setPublishingWeekStart] = useState<string | null>(null);
  const [showGenerateDraftsDialog, setShowGenerateDraftsDialog] = useState(false);
  const [generateUntilDate, setGenerateUntilDate] = useState(maxGenerateUntilDate);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [instructorProfiles, setInstructorProfiles] = useState<InstructorProfileOption[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [cancellingWeekStart, setCancellingWeekStart] = useState<string | null>(null);
  const [showRescheduleWeekDialog, setShowRescheduleWeekDialog] = useState(false);
  const [rescheduleWeekStart, setRescheduleWeekStart] = useState("");
  const [rescheduleDayDelta, setRescheduleDayDelta] = useState("7");
  const [reschedulingWeek, setReschedulingWeek] = useState(false);
  const [endingRule, setEndingRule] = useState<ClassTimetableRuleDto | null>(null);
  const [endingMode, setEndingMode] = useState<"immediate" | "last-class-date">("immediate");
  const [endingLastClassDate, setEndingLastClassDate] = useState("");
  const [endingTimetable, setEndingTimetable] = useState(false);
  const [endingError, setEndingError] = useState("");

  const refreshData = async () => {
    const [sessionResponse, templateResponse, timetableResponse] = await Promise.all([
      fetch("/api/admin/classes/sessions", { cache: "no-store" }),
      fetch("/api/content/classes", { cache: "no-store" }),
      fetch("/api/admin/classes/timetables", { cache: "no-store" }),
    ]);
    const [instructorResponse, profileResponse] = await Promise.all([
      fetch("/api/admin/members?role=instructor", { cache: "no-store" }),
      fetch("/api/admin/instructors/profiles", { cache: "no-store" }),
    ]);

    if (sessionResponse.ok) {
      setSessions((await sessionResponse.json()) as AdminClassSessionDto[]);
    }
    if (timetableResponse.ok) {
      setTimetables((await timetableResponse.json()) as ClassTimetableRuleDto[]);
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
    if (instructorResponse.ok) {
      const payload = (await instructorResponse.json()) as Array<{
        id: string;
        firstName: string;
        lastName: string;
        instructorProfileEntryId?: string | null;
      }>;
      setInstructors(
        payload.map((row) => ({
          id: row.id,
          name: `${row.firstName} ${row.lastName}`.trim() || row.id,
          instructorProfileEntryId: row.instructorProfileEntryId || null,
        }))
      );
    }
    if (profileResponse.ok) {
      const payload = (await profileResponse.json()) as Array<{
        id: string;
        name: string;
        headline?: string;
        bio?: string;
      }>;
      setInstructorProfiles(
        payload.map((row) => ({
          id: row.id,
          name: row.name,
          headline: row.headline || "",
          bio: row.bio || "",
        }))
      );
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        await refreshData();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = sessions.filter((session) => {
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    const matchesType = typeFilter === "all" || session.type.toLowerCase() === typeFilter;
    return matchesStatus && matchesType;
  });
  const groupedWeeks = groupAdminSessionsByWeek(filtered);

  const draftSessions = sessions.filter((session) => session.status === "draft");
  const scheduled = sessions.filter((session) => session.status === "scheduled");
  const completed = sessions.filter((session) => session.status === "completed");
  const totalBooked = completed.reduce(
    (sum, session) => sum + session.attendedCount + session.noShowCount + session.bookedCount,
    0
  );
  const totalAttended = completed.reduce((sum, session) => sum + session.attendedCount, 0);
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

  const handleCreateTimetable = async (data: ScheduleClassData) => {
    setFeedbackError("");
    const template = templates.find((row) => row.slug === data.classTemplateSlug);
    if (!template) {
      throw new Error("Class template not found.");
    }

    const createResponse = await fetch("/api/admin/classes/timetables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classDefinitionSlug: data.classTemplateSlug,
        weekday: new Date(`${data.date}T00:00:00`).getDay(),
        startsAtLocal: data.time,
        durationMinutes: parseInt(template.duration, 10) || 60,
        defaultCapacity: data.maxSpaces,
        instructorUserId: data.instructorUserId,
        instructorProfileEntryId: data.instructorProfileEntryId,
        startsOn: data.date,
        notes: data.notes,
      }),
    });

    if (!createResponse.ok) {
      const payload = (await createResponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(payload?.message || "Failed to create timetable slot.");
    }

    const created = (await createResponse.json()) as {
      draftCreatedCount?: number;
      draftSkippedExistingCount?: number;
    };
    await refreshData();
    setFeedbackMessage(
      `Timetable slot saved. ${created.draftCreatedCount || 0} draft session${created.draftCreatedCount === 1 ? "" : "s"} created${
        created.draftSkippedExistingCount
          ? `, ${created.draftSkippedExistingCount} already existed`
          : ""
      }.`
    );
  };

  const handlePublishAll = async () => {
    setPublishingAll(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin/classes/timetables/publish-all", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to publish upcoming classes.");
      }
      await refreshData();
      setFeedbackMessage("Made the next 4 weeks of active timetable sessions live.");
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Failed to publish upcoming classes."
      );
    } finally {
      setPublishingAll(false);
    }
  };

  const handleGenerateDrafts = async () => {
    setGeneratingDrafts(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin/classes/timetables/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateUntil: generateUntilDate }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        createdCount?: number;
        skippedExistingCount?: number;
        generateUntil?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to generate draft sessions.");
      }

      await refreshData();
      setFeedbackMessage(
        `Generated drafts through ${payload?.generateUntil || generateUntilDate}. Created ${payload?.createdCount || 0} sessions, skipped ${payload?.skippedExistingCount || 0} existing sessions.`
      );
      setShowGenerateDraftsDialog(false);
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Failed to generate draft sessions."
      );
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const handlePublishWeek = async (weekStart: string) => {
    setPublishingWeekStart(weekStart);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin/classes/timetables/publish-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        weekStart?: string;
        publishedCount?: number;
        createdDraftCount?: number;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to publish this week.");
      }

      await refreshData();
      setFeedbackMessage(
        `Week of ${payload?.weekStart || weekStart} is now live. Published ${payload?.publishedCount || 0} sessions and created ${payload?.createdDraftCount || 0} drafts on demand.`
      );
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Failed to publish this week.");
    } finally {
      setPublishingWeekStart(null);
    }
  };

  const toggleRule = async (rule: ClassTimetableRuleDto) => {
    await fetch(`/api/admin/classes/timetables/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
    await refreshData();
  };

  const openEndRuleDialog = (rule: ClassTimetableRuleDto) => {
    setEndingRule(rule);
    setEndingMode("immediate");
    setEndingLastClassDate(rule.endsOn || rule.nextSessionDate || rule.startsOn);
    setEndingError("");
  };

  const resetEndRuleDialog = () => {
    setEndingRule(null);
    setEndingMode("immediate");
    setEndingLastClassDate("");
    setEndingError("");
  };

  const closeEndRuleDialog = () => {
    if (endingTimetable) {
      return;
    }
    resetEndRuleDialog();
  };

  const handleEndRule = async () => {
    if (!endingRule) {
      return;
    }

    if (endingMode === "last-class-date" && !endingLastClassDate) {
      setEndingError("Choose the final class date to keep on the timetable.");
      return;
    }

    setEndingTimetable(true);
    setEndingError("");
    setFeedbackError("");

    try {
      const response = await fetch(`/api/admin/classes/timetables/${endingRule.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: endingMode,
          lastClassDate: endingMode === "last-class-date" ? endingLastClassDate : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        cancelledCount?: number;
        lastClassDate?: string;
        mode?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update this recurring class.");
      }

      await refreshData();
      setFeedbackMessage(
        endingMode === "immediate"
          ? `Recurring class removed from the timetable. Cancelled ${payload?.cancelledCount || 0} future draft or scheduled sessions.`
          : `Recurring class now ends after ${payload?.lastClassDate || endingLastClassDate}. Cancelled ${payload?.cancelledCount || 0} later sessions.`
      );
      resetEndRuleDialog();
    } catch (error) {
      setEndingError(
        error instanceof Error ? error.message : "Failed to update this recurring class."
      );
    } finally {
      setEndingTimetable(false);
    }
  };

  const handleCancelWeek = async (weekStart: string) => {
    setCancellingWeekStart(weekStart);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin/classes/sessions/cancel-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          reason: "Cancelled from the weekly admin overview.",
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        cancelledCount?: number;
        skippedCount?: number;
        weekStart?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to cancel this week of classes.");
      }

      await refreshData();
      setFeedbackMessage(
        `Week of ${payload?.weekStart || weekStart}: cancelled ${payload?.cancelledCount || 0} classes, skipped ${payload?.skippedCount || 0}.`
      );
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Failed to cancel this week of classes."
      );
    } finally {
      setCancellingWeekStart(null);
    }
  };

  const openRescheduleWeekDialog = (weekStart: string) => {
    setRescheduleWeekStart(weekStart);
    setRescheduleDayDelta("7");
    setFeedbackError("");
    setShowRescheduleWeekDialog(true);
  };

  const handleRescheduleWeek = async () => {
    const dayDelta = Number(rescheduleDayDelta);
    if (!rescheduleWeekStart || !Number.isInteger(dayDelta) || dayDelta === 0) {
      setFeedbackError("Choose a whole-day shift before rescheduling this week.");
      return;
    }

    setReschedulingWeek(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin/classes/sessions/reschedule-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: rescheduleWeekStart,
          dayDelta,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        weekStart?: string;
        dayDelta?: number;
        updatedCount?: number;
        skippedCount?: number;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to reschedule this week of classes.");
      }

      await refreshData();
      setFeedbackMessage(
        `Week of ${payload?.weekStart || rescheduleWeekStart}: moved ${payload?.updatedCount || 0} classes by ${payload?.dayDelta || dayDelta} day${Math.abs(payload?.dayDelta || dayDelta) === 1 ? "" : "s"}, skipped ${payload?.skippedCount || 0}.`
      );
      setShowRescheduleWeekDialog(false);
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Failed to reschedule this week of classes."
      );
    } finally {
      setReschedulingWeek(false);
    }
  };

  return (
    <AdminLayout title="Classes - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Operations"
          title="Class Management"
          description={`${timetables.length} timetable rules · ${draftSessions.length} draft sessions · ${scheduled.length} scheduled sessions`}
          meta={loading ? "Loading latest classes..." : undefined}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGenerateUntilDate(maxGenerateUntilDate);
                  setShowGenerateDraftsDialog(true);
                }}
                disabled={generatingDrafts}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Generate Drafts
              </Button>
              <Button
                variant="outline"
                onClick={() => void handlePublishAll()}
                disabled={publishingAll}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Make Next 4 Weeks Live
              </Button>
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Add Timetable Slot
              </Button>
            </div>
          }
        />

        {feedbackMessage ? (
          <Card>
            <CardContent className="py-4 text-sm">{feedbackMessage}</CardContent>
          </Card>
        ) : null}
        {feedbackError ? (
          <Card className="border-red-200">
            <CardContent className="py-4 text-sm text-red-700">{feedbackError}</CardContent>
          </Card>
        ) : null}

        <ScheduleClassModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          templates={templates}
          instructors={instructors}
          instructorProfiles={instructorProfiles}
          onSchedule={handleCreateTimetable}
        />

        <Dialog
          open={showGenerateDraftsDialog}
          onOpenChange={(open) => {
            if (!generatingDrafts) {
              setShowGenerateDraftsDialog(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate draft sessions</DialogTitle>
              <DialogDescription>
                Create missing private draft sessions for active timetable rules up to the selected
                date. Instructors can plan up to 8 weeks ahead.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label htmlFor="generate-until-date">Generate drafts until</Label>
              <Input
                id="generate-until-date"
                type="date"
                value={generateUntilDate}
                min={todayInput}
                max={maxGenerateUntilDate}
                onChange={(event) => setGenerateUntilDate(event.target.value)}
                disabled={generatingDrafts}
              />
              <p className="text-muted-foreground text-sm">
                Latest allowed date: {maxGenerateUntilDate}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowGenerateDraftsDialog(false)}
                disabled={generatingDrafts}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleGenerateDrafts()} disabled={generatingDrafts}>
                {generatingDrafts ? "Generating..." : "Generate Drafts"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AppMetricGrid className="lg:grid-cols-4">
          <AppMetricCard label="Timetable rules" value={timetables.length} detail="weekly slots" />
          <AppMetricCard
            label="Draft classes"
            value={draftSessions.length}
            detail="private sessions"
          />
          <AppMetricCard
            label="Upcoming bookings"
            value={scheduled.reduce((sum, session) => sum + session.bookedCount, 0)}
            detail="across published sessions"
          />
          <AppMetricCard
            label="Attendance rate"
            value={`${attendanceRate}%`}
            detail="completed sessions"
          />
        </AppMetricGrid>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm">Weekly timetable</p>
                <p className="text-muted-foreground text-sm">
                  These rules repeat every week. Saving a slot creates private draft sessions.
                  Generate drafts up to a chosen date, then make weeks live when they should become
                  visible and bookable.
                </p>
              </div>
            </div>
            {timetables.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Repeat className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">
                  No timetable slots yet. Add your first weekly class slot to generate draft
                  sessions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {timetables.map((rule) => (
                  <TimetableRow
                    key={rule.id}
                    rule={rule}
                    onToggle={() => void toggleRule(rule)}
                    onEnd={() => openEndRuleDialog(rule)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EndTimetableDialog
          open={Boolean(endingRule)}
          rule={endingRule}
          mode={endingMode}
          lastClassDate={endingLastClassDate}
          submitting={endingTimetable}
          error={endingError}
          onOpenChange={(open) => {
            if (!open) {
              closeEndRuleDialog();
            }
          }}
          onModeChange={setEndingMode}
          onLastClassDateChange={setEndingLastClassDate}
          onConfirm={() => void handleEndRule()}
        />

        <Dialog
          open={showRescheduleWeekDialog}
          onOpenChange={(open) => {
            if (!reschedulingWeek) {
              setShowRescheduleWeekDialog(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reschedule this week</DialogTitle>
              <DialogDescription>
                Move all future draft or scheduled sessions in this week by whole days.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="reschedule-week-start">Week start</Label>
                <Input id="reschedule-week-start" value={rescheduleWeekStart} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-day-shift">Day shift</Label>
                <Input
                  id="reschedule-day-shift"
                  type="number"
                  min={-14}
                  max={14}
                  step={1}
                  value={rescheduleDayDelta}
                  onChange={(event) => setRescheduleDayDelta(event.target.value)}
                  disabled={reschedulingWeek}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Use a positive number to move classes later, or a negative number to bring them
                forward.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRescheduleWeekDialog(false)}
                disabled={reschedulingWeek}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleRescheduleWeek()} disabled={reschedulingWeek}>
                {reschedulingWeek ? "Rescheduling..." : "Reschedule Week"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Filter classes by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
          <select
            aria-label="Filter classes by type"
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

        <div className="space-y-5">
          {groupedWeeks.map((group) => (
            <div key={group.weekStart} className="space-y-3">
              <div className="border-border/70 bg-secondary/20 flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm">{group.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {group.sessions.length} class{group.sessions.length === 1 ? "" : "es"} in this
                    week
                    {group.cancelEligibleCount > 0
                      ? ` · ${group.cancelEligibleCount} can be cancelled together`
                      : " · No future draft or scheduled classes left to cancel"}
                    {group.publishEligibleCount > 0
                      ? ` · ${group.publishEligibleCount} draft class${group.publishEligibleCount === 1 ? "" : "es"} can be made live`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      group.publishEligibleCount === 0 ||
                      publishingWeekStart === group.weekStart ||
                      group.weekStart > maxPublishWeekStart ||
                      getWeekEndExclusiveIso(group.weekStart) <= todayInput
                    }
                    onClick={() => void handlePublishWeek(group.weekStart)}
                  >
                    {publishingWeekStart === group.weekStart
                      ? "Publishing..."
                      : "Publish This Week"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      group.cancelEligibleCount === 0 ||
                      reschedulingWeek ||
                      cancellingWeekStart === group.weekStart
                    }
                    onClick={() => openRescheduleWeekDialog(group.weekStart)}
                  >
                    Reschedule This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      group.cancelEligibleCount === 0 || cancellingWeekStart === group.weekStart
                    }
                    onClick={() => void handleCancelWeek(group.weekStart)}
                  >
                    {cancellingWeekStart === group.weekStart ? "Cancelling..." : "Cancel This Week"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {group.sessions.map((session) => (
                  <ClassRow key={session.id} classInstance={session} />
                ))}
              </div>
            </div>
          ))}
          {groupedWeeks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">
                  No current or upcoming classes match your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function TimetableRow({
  rule,
  onToggle,
  onEnd,
}: {
  rule: ClassTimetableRuleDto;
  onToggle: () => void;
  onEnd: () => void;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">{rule.className}</p>
            <Badge className={getTypeColor(rule.classType as "Yoga" | "Strength" | "HIIT")}>
              {rule.classType}
            </Badge>
            <Badge variant={rule.active ? "secondary" : "outline"}>
              {rule.active ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {WEEKDAY_LABELS[rule.weekday]} at {rule.startsAtLocal} · {rule.durationMinutes} min ·{" "}
            {rule.defaultCapacity} spaces
          </p>
          <p className="text-muted-foreground text-xs">
            Starts {rule.startsOn}
            {rule.endsOn ? ` · Ends ${rule.endsOn}` : " · Repeats weekly"}
            {rule.nextSessionDate ? ` · Next generated class ${rule.nextSessionDate}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEnd}>
            End recurring
          </Button>
          <Button variant="outline" size="sm" onClick={onToggle}>
            {rule.active ? "Pause" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EndTimetableDialog({
  open,
  rule,
  mode,
  lastClassDate,
  submitting,
  error,
  onOpenChange,
  onModeChange,
  onLastClassDateChange,
  onConfirm,
}: {
  open: boolean;
  rule: ClassTimetableRuleDto | null;
  mode: "immediate" | "last-class-date";
  lastClassDate: string;
  submitting: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: "immediate" | "last-class-date") => void;
  onLastClassDateChange: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>End recurring class</DialogTitle>
          <DialogDescription>
            {rule
              ? `Update ${rule.className} so it stops appearing in the weekly timetable.`
              : "Update this recurring class."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup
            value={mode}
            onValueChange={(value) => {
              if (value === "immediate" || value === "last-class-date") {
                onModeChange(value);
              }
            }}
            className="space-y-3"
          >
            <label className="border-border/70 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <RadioGroupItem value="immediate" id="end-timetable-immediately" className="mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm">Remove immediately</p>
                <p className="text-muted-foreground text-sm">
                  Stop this recurring class now and cancel all future draft and scheduled sessions
                  generated from it.
                </p>
              </div>
            </label>

            <label className="border-border/70 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <RadioGroupItem
                value="last-class-date"
                id="end-timetable-last-date"
                className="mt-0.5"
              />
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <p className="text-sm">Choose the final class date</p>
                  <p className="text-muted-foreground text-sm">
                    Keep the timetable up to the selected date, then remove later sessions.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-timetable-last-class-date">Last class date</Label>
                  <Input
                    id="end-timetable-last-class-date"
                    type="date"
                    value={lastClassDate}
                    onChange={(event) => onLastClassDateChange(event.target.value)}
                    disabled={mode !== "last-class-date" || submitting}
                  />
                </div>
              </div>
            </label>
          </RadioGroup>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? "Saving..." : "Update recurring class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const threeHourOutcomeLabel =
    classInstance.threeHourOutcome === "reminded"
      ? "3-hour reminders sent"
      : classInstance.threeHourOutcome === "cancelled_no_attendance"
        ? "Auto-cancelled for no attendance"
        : null;

  return (
    <Link href={`/admin/classes/${classInstance.id}`}>
      <Card className="hover:border-brand-accent/30 cursor-pointer transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                classInstance.status === "live"
                  ? "bg-brand-accent text-brand-white"
                  : "bg-secondary"
              }`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm">{classInstance.title}</p>
                <Badge className={typeColor}>{classInstance.type}</Badge>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                {classInstance.roomSetupStatus && classInstance.status !== "draft" ? (
                  <Badge
                    variant={classInstance.roomSetupStatus === "failed" ? "destructive" : "outline"}
                  >
                    Daily {classInstance.roomSetupStatus}
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {day} {date} · {time} · {classInstance.durationMinutes} min
              </p>
              {threeHourOutcomeLabel ? (
                <p className="text-muted-foreground mt-1 text-xs">{threeHourOutcomeLabel}</p>
              ) : null}
              {classInstance.roomSetupError ? (
                <p className="mt-1 text-xs text-red-600">{classInstance.roomSetupError}</p>
              ) : null}
              {classInstance.cancelReason ? (
                <p className="text-muted-foreground mt-1 text-xs">{classInstance.cancelReason}</p>
              ) : null}
            </div>

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

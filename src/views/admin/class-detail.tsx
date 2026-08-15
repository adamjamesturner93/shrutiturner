"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Calendar, Clock, UserCheck, UserX, Users, Video, XCircle } from "lucide-react";
import { ClassHealthSummary, HealthBadges } from "../../components/admin/health-badges";
import type { ClassSessionDetailDto } from "@/lib/api/types";
import { VideoRoom, type RoomMode } from "../../components/video/video-room";
import { getClassSessionRoomMode } from "@/lib/classes/room-mode";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function AdminClassDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ClassSessionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [sessionDateInput, setSessionDateInput] = useState("");
  const [sessionTimeInput, setSessionTimeInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("0");
  const [notesInput, setNotesInput] = useState("");

  const applySession = (payload: ClassSessionDetailDto) => {
    const start = new Date(payload.startsAtUtc);
    setSession(payload);
    setSelectedInstructorId(payload.instructorUserId);
    setSessionDateInput(formatDateInput(start));
    setSessionTimeInput(formatTimeInput(start));
    setCapacityInput(String(payload.capacity));
    setNotesInput(payload.notes || "");
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [response, instructorsResponse] = await Promise.all([
          fetch(`/api/admin/classes/sessions/${id}`, { cache: "no-store" }),
          fetch("/api/admin/members?role=instructor", { cache: "no-store" }),
        ]);
        if (!response.ok) throw new Error("Failed to load class session");
        const payload = (await response.json()) as ClassSessionDetailDto;
        if (active) applySession(payload);
        if (active && instructorsResponse.ok) {
          const instructorPayload = (await instructorsResponse.json()) as Array<{
            id: string;
            firstName: string;
            lastName: string;
          }>;
          setInstructors(
            instructorPayload.map((instructor) => ({
              id: instructor.id,
              name: `${instructor.firstName} ${instructor.lastName}`.trim() || instructor.id,
            }))
          );
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load class session");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const startsAt = session ? new Date(session.startsAtUtc) : null;
  const dateLabel = startsAt
    ? startsAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const timeLabel = startsAt
    ? startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
  const bookedAttendees = (session?.bookings || [])
    .filter((booking) => booking.status === "booked")
    .map((booking) => ({
      memberId: booking.userId,
      memberName: `${booking.firstName} ${booking.lastName}`.trim() || booking.email,
      healthConditions: booking.healthConditions,
    }));
  const attendedCount =
    session?.bookings.filter((booking) => booking.status === "attended").length || 0;
  const noShowCount =
    session?.bookings.filter((booking) => booking.status === "no_show").length || 0;
  const roomMode: RoomMode = getClassSessionRoomMode({
    classType: session?.type || "",
    capacity: session?.capacity || 0,
  });

  const refresh = async () => {
    const response = await fetch(`/api/admin/classes/sessions/${id}`, { cache: "no-store" });
    if (response.ok) {
      applySession((await response.json()) as ClassSessionDetailDto);
    }
  };

  const patchStatus = async (status: "draft" | "scheduled" | "live" | "completed") => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/classes/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const cancelClass = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/classes/sessions/${session.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by instructor" }),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/classes/sessions/${session.id}/bookings/${userId}`, {
        method: "DELETE",
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const updateAttendance = async (userId: string, status: "booked" | "attended" | "no_show") => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/classes/sessions/${session.id}/bookings/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const retryRoomSetup = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/classes/sessions/${session.id}/room-setup`, {
        method: "POST",
      });
      if (!response.ok) {
        setError("Failed to retry Daily room setup.");
        return;
      }
      setSession((await response.json()) as ClassSessionDetailDto);
    } finally {
      setSaving(false);
    }
  };

  const saveSessionDetails = async () => {
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      const [year, month, day] = sessionDateInput.split("-").map(Number);
      const [hour, minute] = sessionTimeInput.split(":").map(Number);
      const nextStartsAt = new Date(year, month - 1, day, hour, minute);
      if (Number.isNaN(nextStartsAt.getTime())) {
        setError("Choose a valid class date and start time.");
        return;
      }
      const nextEndsAt = new Date(nextStartsAt.getTime() + session.durationMinutes * 60_000);

      const response = await fetch(`/api/admin/classes/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAtUtc: nextStartsAt.toISOString(),
          endsAtUtc: nextEndsAt.toISOString(),
          instructorUserId: selectedInstructorId,
          capacity: Number(capacityInput),
          notes: notesInput,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message || "Failed to save class changes.");
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (showVideoRoom && session) {
    return (
      <VideoRoom
        sessionId={session.id}
        mode={roomMode}
        isInstructor={true}
        className={session.title}
        classTime={timeLabel}
        classDuration={`${session.durationMinutes} min`}
        registeredCount={session.bookedCount}
        initialCommunityMode={session.communityModeEnabled}
        onLeave={(reason) => {
          setShowVideoRoom(false);
          if (reason === "ended") {
            void refresh();
          }
        }}
        onEndSession={async () => {
          await patchStatus("completed");
        }}
      />
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Class Session - Admin">
        <p className="text-muted-foreground">Loading class session...</p>
      </AdminLayout>
    );
  }

  if (!session) {
    return (
      <AdminLayout title="Class Session - Admin">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{error || "Class session not found."}</p>
          <Link href="/admin/classes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${session.title} - Admin`}>
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/classes")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-brand-dark text-2xl">{session.title}</h1>
              <Badge variant="outline">{session.type}</Badge>
              <Badge
                variant={
                  session.status === "cancelled"
                    ? "destructive"
                    : session.status === "draft"
                      ? "outline"
                      : "secondary"
                }
              >
                {session.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dateLabel}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeLabel}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {session.bookedCount}/{session.capacity}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                saving ||
                session.status === "live" ||
                session.status === "draft" ||
                session.bookedCount === 0
              }
              onClick={async () => {
                await patchStatus("live");
                setShowVideoRoom(true);
              }}
            >
              <Video className="mr-2 h-4 w-4" /> Start Class
            </Button>
            <Button
              disabled={saving || session.status === "completed"}
              variant="outline"
              onClick={() => void patchStatus("completed")}
            >
              End Class
            </Button>
            <Button
              disabled={saving || session.status === "cancelled"}
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancel Class
            </Button>
          </div>
        </div>

        <Dialog
          open={showCancelDialog}
          onOpenChange={(open) => {
            if (!saving) {
              setShowCancelDialog(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cancel this class?</DialogTitle>
              <DialogDescription>
                This will cancel the session, email all booked participants and close any Daily room
                already created for it.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Use this only when the class should no longer run. The change cannot be undone from
              the roster screen.
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={saving}
              >
                Keep Class
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await cancelClass();
                  setShowCancelDialog(false);
                }}
                disabled={saving}
              >
                {saving ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {session.status === "live" ? (
          <Card className="border-brand-accent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Video className="text-brand-accent h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm">Class is live</p>
                  <p className="text-muted-foreground text-xs">
                    Daily room is active for this session.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-brand-accent hover:bg-brand-accent/90"
                  onClick={() => setShowVideoRoom(true)}
                >
                  <Video className="mr-1 h-3 w-3" />
                  Rejoin Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {session.status === "draft" ? (
          <Card className="border-brand-accent/30">
            <CardContent className="pt-6">
              <p className="text-sm">This is a draft session.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Draft sessions stay private until you publish them from the timetable view.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {session.roomSetupError ? (
          <Card className="border-red-200">
            <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-red-700">Daily room setup failed</p>
                <p className="text-muted-foreground text-sm">{session.roomSetupError}</p>
              </div>
              <Button variant="outline" disabled={saving} onClick={() => void retryRoomSetup()}>
                Retry Room Setup
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!session.dailyRoomUrl &&
        session.roomSetupStatus === "pending" &&
        session.status !== "draft" &&
        session.status !== "cancelled" ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">Daily room pending</p>
              <p className="text-muted-foreground mt-1 text-sm">
                The room will be created when the first attendee books this class.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {session.threeHourOutcome !== "pending" || session.cancelReason ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">Session operations</p>
              <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                {session.threeHourOutcome === "reminded" ? (
                  <p>3-hour reminders were sent to booked attendees.</p>
                ) : null}
                {session.threeHourOutcome === "cancelled_no_attendance" ? (
                  <p>Auto-cancelled for no attendance at the 3-hour cutoff.</p>
                ) : null}
                {session.cancelReason ? <p>Cancellation reason: {session.cancelReason}</p> : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">
                {session.bookedCount}/{session.capacity}
              </p>
              <p className="text-muted-foreground text-xs">Booked / Capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">{session.spotsRemaining}</p>
              <p className="text-muted-foreground text-xs">Spaces remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-accent text-2xl">{attendedCount}</p>
              <p className="text-muted-foreground text-xs">Attended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-destructive text-2xl">{noShowCount}</p>
              <p className="text-muted-foreground text-xs">No-show</p>
            </CardContent>
          </Card>
        </div>

        {session.instructorName || session.instructorBio ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-dark text-sm">{session.instructorName || "Instructor"}</p>
              {session.instructorBio ? (
                <p className="text-muted-foreground mt-1 text-sm">{session.instructorBio}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="session-date" className="text-sm">
                  Date
                </label>
                <Input
                  id="session-date"
                  type="date"
                  value={sessionDateInput}
                  onChange={(event) => setSessionDateInput(event.target.value)}
                  disabled={saving || session.status === "live" || session.status === "completed"}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="session-start-time" className="text-sm">
                  Start time
                </label>
                <Input
                  id="session-start-time"
                  type="time"
                  value={sessionTimeInput}
                  onChange={(event) => setSessionTimeInput(event.target.value)}
                  disabled={saving || session.status === "live" || session.status === "completed"}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="session-instructor" className="text-sm">
                  Instructor
                </label>
                <select
                  id="session-instructor"
                  value={selectedInstructorId}
                  onChange={(event) => setSelectedInstructorId(event.target.value)}
                  className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
                  disabled={saving}
                >
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="session-capacity" className="text-sm">
                  Capacity
                </label>
                <Input
                  id="session-capacity"
                  type="number"
                  min={1}
                  value={capacityInput}
                  onChange={(event) => setCapacityInput(event.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="session-notes" className="text-sm">
                Notes
              </label>
              <Textarea
                id="session-notes"
                value={notesInput}
                onChange={(event) => setNotesInput(event.target.value)}
                disabled={saving}
                rows={4}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" disabled={saving} onClick={() => void saveSessionDetails()}>
                Save Session Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <ClassHealthSummary attendees={bookedAttendees} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings ({session.bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.bookings.map((booking) => (
                <div key={booking.id} className="bg-secondary/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/members/${booking.userId}`}
                        className="hover:text-brand-accent text-sm"
                      >
                        {booking.firstName} {booking.lastName}
                      </Link>
                      <p className="text-muted-foreground text-xs">{booking.email}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {booking.attendedClassesCount > 0
                          ? `${booking.attendedClassesCount} class${booking.attendedClassesCount === 1 ? "" : "es"} attended`
                          : "First class"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {booking.preClassFlareToday ? (
                          <Badge className="bg-amber-100 text-amber-900">Flare today</Badge>
                        ) : null}
                        {booking.preClassEnergyLevel ? (
                          <Badge variant="outline">Energy {booking.preClassEnergyLevel}/5</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2">
                        <HealthBadges labels={booking.healthConditions} max={5} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === "booked" ? "secondary" : "outline"}>
                        {booking.status}
                      </Badge>
                      {booking.status !== "cancelled" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            void updateAttendance(
                              booking.userId,
                              booking.status === "attended" ? "no_show" : "attended"
                            )
                          }
                        >
                          {booking.status === "attended" ? (
                            <>
                              <UserX className="mr-1 h-3.5 w-3.5" />
                              Mark no-show
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-1 h-3.5 w-3.5" />
                              Mark attended
                            </>
                          )}
                        </Button>
                      ) : null}
                      {booking.status === "booked" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => void removeParticipant(booking.userId)}
                        >
                          <UserX className="mr-1 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {session.bookings.length === 0 ? (
                <p className="text-muted-foreground text-sm">No bookings yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waitlist ({session.waitlist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.waitlist.map((entry) => (
                <div key={entry.id} className="bg-secondary/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/members/${entry.userId}`}
                        className="hover:text-brand-accent text-sm"
                      >
                        {entry.firstName} {entry.lastName}
                      </Link>
                      <p className="text-muted-foreground text-xs">Position #{entry.position}</p>
                    </div>
                    <Badge variant="outline">{entry.status}</Badge>
                  </div>
                </div>
              ))}
              {session.waitlist.length === 0 ? (
                <p className="text-muted-foreground text-sm">No waitlist entries.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

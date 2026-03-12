"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Calendar, Clock, Users, Video, XCircle, UserX } from "lucide-react";
import { ClassHealthSummary, HealthBadges } from "../../components/admin/health-badges";
import type { ClassSessionDetailDto } from "@/lib/api/types";

export function AdminClassDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ClassSessionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/classes/sessions/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load class session");
        const payload = (await response.json()) as ClassSessionDetailDto;
        if (active) setSession(payload);
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

  const refresh = async () => {
    const response = await fetch(`/api/admin/classes/sessions/${id}`, { cache: "no-store" });
    if (response.ok) {
      setSession((await response.json()) as ClassSessionDetailDto);
    }
  };

  const patchStatus = async (status: "scheduled" | "live" | "completed") => {
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
              <h1 className="text-2xl text-[#2E1F33]">{session.title}</h1>
              <Badge variant="outline">{session.type}</Badge>
              <Badge variant={session.status === "cancelled" ? "destructive" : "secondary"}>
                {session.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateLabel}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeLabel}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{session.bookedCount}/{session.capacity}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={saving || session.status === "live"} onClick={() => void patchStatus("live")}>
              <Video className="mr-2 h-4 w-4" /> Start
            </Button>
            <Button disabled={saving || session.status === "completed"} variant="outline" onClick={() => void patchStatus("completed")}>
              End
            </Button>
            <Button disabled={saving || session.status === "cancelled"} variant="destructive" onClick={() => void cancelClass()}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel Class
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#2E1F33]">{session.bookedCount}</p>
              <p className="text-muted-foreground text-xs">Booked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#2E1F33]">{session.waitlistCount}</p>
              <p className="text-muted-foreground text-xs">Waitlist</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#2E1F33]">{session.spotsRemaining}</p>
              <p className="text-muted-foreground text-xs">Spots remaining</p>
            </CardContent>
          </Card>
        </div>

        {session.instructorName || session.instructorBio ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#2E1F33]">{session.instructorName || "Instructor"}</p>
              {session.instructorBio ? (
                <p className="text-muted-foreground mt-1 text-sm">{session.instructorBio}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

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
                      <Link href={`/admin/members/${booking.userId}`} className="text-sm hover:text-[#4B5B32]">
                        {booking.firstName} {booking.lastName}
                      </Link>
                      <p className="text-muted-foreground text-xs">{booking.email}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {booking.attendedClassesCount > 0
                          ? `${booking.attendedClassesCount} class${booking.attendedClassesCount === 1 ? "" : "es"} attended`
                          : "First class"}
                      </p>
                      <div className="mt-2">
                        <HealthBadges labels={booking.healthConditions} max={5} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === "booked" ? "secondary" : "outline"}>
                        {booking.status}
                      </Badge>
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
              {session.bookings.length === 0 ? <p className="text-muted-foreground text-sm">No bookings yet.</p> : null}
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
                      <Link href={`/admin/members/${entry.userId}`} className="text-sm hover:text-[#4B5B32]">
                        {entry.firstName} {entry.lastName}
                      </Link>
                      <p className="text-muted-foreground text-xs">Position #{entry.position}</p>
                    </div>
                    <Badge variant="outline">{entry.status}</Badge>
                  </div>
                </div>
              ))}
              {session.waitlist.length === 0 ? <p className="text-muted-foreground text-sm">No waitlist entries.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

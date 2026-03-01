"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import {
  ArrowLeft,
  Play,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Video,
} from "lucide-react";
import { adminClassInstances } from "../../data/admin-data";
import { getTypeColor, getClassBySlug } from "../../data/schedule-data";
import { VideoRoom, type RoomMode } from "../../components/video/video-room";
import { PreJoinLobby } from "../../components/video/pre-join-lobby";
import { SEO } from "../../components/seo";
import { HealthBadges, ClassHealthSummary } from "../../components/admin/health-badges";

export function AdminClassDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const cls = adminClassInstances.find((c) => c.id === id);
  const [status, setStatus] = useState(cls?.status || "scheduled");
  const [attendees, setAttendees] = useState(cls?.attendees || []);
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showPreJoin, setShowPreJoin] = useState(false);

  if (!cls) {
    return (
      <AdminLayout title="Class Not Found - Admin">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Class not found.</p>
          <Link href="/admin/classes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const typeColor = getTypeColor(cls.classType);

  const handleStartClass = () => {
    setStatus("live");
    setShowPreJoin(true);
  };

  const handleEndClass = () => {
    setStatus("completed");
    setAttendees((prev) =>
      prev.map((a) => (a.status === "booked" ? { ...a, status: "attended" as const } : a))
    );
  };

  const toggleAttendance = (memberId: string) => {
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.memberId !== memberId) return a;
        if (a.status === "booked" || a.status === "no-show")
          return { ...a, status: "attended" as const };
        if (a.status === "attended") return { ...a, status: "no-show" as const };
        return a;
      })
    );
  };

  const attendedCount = attendees.filter((a) => a.status === "attended").length;
  const noShowCount = attendees.filter((a) => a.status === "no-show").length;

  const classTemplate = getClassBySlug(cls.classSlug);
  const roomMode: RoomMode =
    cls.classType === "HIIT" || cls.maxSpaces <= 8
      ? "small-group"
      : "live-class";

  if (showPreJoin && !showVideoRoom) {
    return (
      <>
        <SEO title={`Starting ${cls.className} - Admin`} noIndex />
        <PreJoinLobby
          className={cls.className}
          classTime={cls.time}
          classDuration={cls.duration}
          classLevel={classTemplate?.level || "All levels"}
          instructor="Shruti Turner"
          equipment={classTemplate?.equipment || []}
          registeredCount={cls.bookedCount}
          maxSpaces={cls.maxSpaces}
          mode={roomMode}
          onJoin={() => setShowVideoRoom(true)}
          onBack={() => setShowPreJoin(false)}
        />
      </>
    );
  }

  if (showVideoRoom) {
    return (
      <>
        <SEO title={`${cls.className} - Live - Admin`} noIndex />
        <VideoRoom
          mode={roomMode}
          isInstructor={true}
          className={cls.className}
          classTime={cls.time}
          classDuration={cls.duration}
          registeredCount={cls.bookedCount}
          onLeave={() => {
            setShowVideoRoom(false);
            setShowPreJoin(false);
            handleEndClass();
          }}
        />
      </>
    );
  }

  return (
    <AdminLayout title={`${cls.className} - Admin`}>
      <div className="space-y-6">
        <button
          onClick={() => navigate("/admin/classes")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classes
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl text-[#2E1F33]">{cls.className}</h1>
              <Badge className={typeColor}>{cls.classType}</Badge>
              <Badge
                variant={
                  status === "live"
                    ? "default"
                    : status === "completed"
                    ? "outline"
                    : "secondary"
                }
              >
                {status === "live" && (
                  <span className="w-2 h-2 rounded-full bg-[#FAFAF8] mr-2 animate-pulse" />
                )}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {cls.day} {cls.date} · {cls.time} · {cls.duration}
            </p>
          </div>

          <div className="flex gap-3">
            {status === "scheduled" && (
              <Button onClick={handleStartClass} className="bg-[#4B5B32] hover:bg-[#4B5B32]/90">
                <Play className="w-4 h-4 mr-2" />
                Start Class
              </Button>
            )}
            {status === "live" && (
              <Button onClick={handleEndClass} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                End Class
              </Button>
            )}
          </div>
        </div>

        {status === "live" && (
          <Card className="border-[#4B5B32]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-[#4B5B32]" />
                <div className="flex-1">
                  <p className="text-sm">Class is live</p>
                  <p className="text-xs text-muted-foreground">
                    In-app video room active
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
                  onClick={() => setShowPreJoin(true)}
                >
                  <Video className="w-3 h-3 mr-1" />
                  Rejoin Room
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#2E1F33]">
                {cls.bookedCount}/{cls.maxSpaces}
              </p>
              <p className="text-xs text-muted-foreground">Booked / Capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#2E1F33]">
                {cls.maxSpaces - cls.bookedCount}
              </p>
              <p className="text-xs text-muted-foreground">Spaces remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-[#4B5B32]">{attendedCount}</p>
              <p className="text-xs text-muted-foreground">Attended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl text-destructive">{noShowCount}</p>
              <p className="text-xs text-muted-foreground">No-show</p>
            </CardContent>
          </Card>
        </div>

        {/* Aggregated health prep — at-a-glance before the attendee list */}
        <ClassHealthSummary
          attendees={attendees.filter((a) => a.status !== "cancelled")}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Attendees ({attendees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendees.map((attendee) => (
                <div
                  key={attendee.memberId}
                  className="p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          attendee.status === "attended"
                            ? "bg-[#4B5B32] text-[#FAFAF8]"
                            : attendee.status === "no-show"
                            ? "bg-destructive text-white"
                            : attendee.status === "cancelled"
                            ? "bg-muted text-muted-foreground"
                            : "bg-[#4B5B32]/20 text-[#4B5B32]"
                        }`}
                      >
                        {attendee.status === "attended" ? (
                          <UserCheck className="w-4 h-4" />
                        ) : attendee.status === "no-show" ? (
                          <UserX className="w-4 h-4" />
                        ) : attendee.status === "cancelled" ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/members/${attendee.memberId}`}
                          className="text-sm hover:text-[#4B5B32] transition-colors"
                        >
                          {attendee.memberName}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">
                          {attendee.status.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                    {attendee.status !== "cancelled" && (status === "live" || status === "completed") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAttendance(attendee.memberId)}
                      >
                        {attendee.status === "attended" ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" /> Mark no-show
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Mark attended
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="ml-11 mt-1">
                    <HealthBadges memberId={attendee.memberId} max={5} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

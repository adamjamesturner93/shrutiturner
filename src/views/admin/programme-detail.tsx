"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Circle,
  XCircle,
  TrendingUp,
  PoundSterling,
} from "lucide-react";
import { adminProgrammes } from "../../data/admin-data";
import { HealthBadges, ClassHealthSummary } from "../../components/admin/health-badges";

export function AdminProgrammeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const programme = adminProgrammes.find((p) => p.id === id);

  if (!programme) {
    return (
      <AdminLayout title="Programme Not Found - Admin">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Programme not found.</p>
          <Link href="/admin/programmes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Programmes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const progressPercent = Math.round(
    (programme.sessionsCompleted / programme.sessionsTotal) * 100
  );
  const avgAttendance =
    programme.sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.attendanceCount, 0) /
    Math.max(programme.sessionsCompleted, 1);
  const revenue = programme.currentParticipants * programme.price;

  return (
    <AdminLayout title={`${programme.name} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/programmes")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programmes
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-[#2E1F33]">{programme.name}</h1>
            <Badge
              variant={
                programme.status === "active"
                  ? "default"
                  : programme.status === "upcoming"
                  ? "secondary"
                  : "outline"
              }
            >
              {programme.status.charAt(0).toUpperCase() + programme.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{programme.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {programme.startDate} to {programme.endDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {programme.schedule}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">
                {programme.currentParticipants}/{programme.maxParticipants}
              </p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">{progressPercent}%</p>
              <p className="text-xs text-muted-foreground">
                {programme.sessionsCompleted}/{programme.sessionsTotal} sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">
                {avgAttendance.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">£{revenue}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress bar */}
        {programme.status === "active" && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Programme progress</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4B5B32] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Aggregated health prep for the programme group */}
        <ClassHealthSummary attendees={programme.participants} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Participants ({programme.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {programme.participants.map((p) => (
                  <div
                    key={p.memberId}
                    className="p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <Link href={
                          p.memberId.startsWith("prog_ext")
                            ? "#"
                            : `/admin/members/${p.memberId}`
                        }
                        className="text-sm hover:text-[#4B5B32] transition-colors"
                      >
                        {p.memberName}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {p.sessionsAttended}/{programme.sessionsCompleted || programme.sessionsTotal} attended
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.progress}
                    </p>
                    <div className="mt-1">
                      <HealthBadges memberId={p.memberId} max={4} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Sessions ({programme.sessionsTotal})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {programme.sessions.map((session) => (
                  <div
                    key={session.number}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex-shrink-0">
                      {session.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-[#4B5B32]" />
                      ) : session.status === "cancelled" ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        Session {session.number}: {session.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {session.status === "completed" &&
                          ` · ${session.attendanceCount} attended`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

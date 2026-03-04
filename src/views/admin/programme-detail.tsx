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
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Programme not found.</p>
          <Link href="/admin/programmes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Programmes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const progressPercent = Math.round((programme.sessionsCompleted / programme.sessionsTotal) * 100);
  const avgAttendance =
    programme.sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.attendanceCount, 0) / Math.max(programme.sessionsCompleted, 1);
  const revenue = programme.currentParticipants * programme.price;

  return (
    <AdminLayout title={`${programme.name} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/programmes")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Programmes
        </button>

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
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
          <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {programme.startDate} to {programme.endDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {programme.schedule}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">
                {programme.currentParticipants}/{programme.maxParticipants}
              </p>
              <p className="text-muted-foreground text-xs">Participants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{progressPercent}%</p>
              <p className="text-muted-foreground text-xs">
                {programme.sessionsCompleted}/{programme.sessionsTotal} sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">{avgAttendance.toFixed(1)}</p>
              <p className="text-muted-foreground text-xs">Avg attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="mx-auto h-5 w-5 text-[#4B5B32]" />
              <p className="mt-2 text-2xl text-[#2E1F33]">£{revenue}</p>
              <p className="text-muted-foreground text-xs">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress bar */}
        {programme.status === "active" && (
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Programme progress</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="bg-secondary h-3 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-[#4B5B32] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Aggregated health prep for the programme group */}
        <ClassHealthSummary attendees={programme.participants} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  <div key={p.memberId} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={
                          p.memberId.startsWith("prog_ext") ? "#" : `/admin/members/${p.memberId}`
                        }
                        className="text-sm transition-colors hover:text-[#4B5B32]"
                      >
                        {p.memberName}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {p.sessionsAttended}/
                        {programme.sessionsCompleted || programme.sessionsTotal} attended
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{p.progress}</p>
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
              <CardTitle className="text-lg">Sessions ({programme.sessionsTotal})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {programme.sessions.map((session) => (
                  <div
                    key={session.number}
                    className="bg-secondary/50 flex items-center gap-3 rounded-lg p-3"
                  >
                    <div className="flex-shrink-0">
                      {session.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-[#4B5B32]" />
                      ) : session.status === "cancelled" ? (
                        <XCircle className="text-destructive h-5 w-5" />
                      ) : (
                        <Circle className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        Session {session.number}: {session.topic}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(session.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {session.status === "completed" && ` · ${session.attendanceCount} attended`}
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

"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { Users, Calendar, ArrowRight, Clock, BookOpen, Activity, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminDashboardStats, adminClassInstances, adminProgrammes } from "../../data/admin-data";
import { getGreeting } from "../../components/greeting";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";
import { useState, useEffect } from "react";

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = adminDashboardStats;

  // Get today's day name for matching mock data
  const todayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });
  const todayISO = new Date().toISOString().split("T")[0];

  // Today's classes — match by date first, then fall back to day name
  const todayClasses = adminClassInstances.filter(
    (c) =>
      (c.status === "scheduled" || c.status === "live") &&
      (c.date === todayISO || c.day === todayName)
  );
  const todayScheduled = todayClasses.filter(
    (c) => c.status === "scheduled" || c.status === "live"
  );
  const todayLive = todayClasses.filter((c) => c.status === "live");

  // All upcoming classes — future dates or scheduled status
  const upcomingClasses = adminClassInstances
    .filter((c) => c.status === "scheduled" && c.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  // Active and upcoming programmes
  const activeProgrammes = adminProgrammes.filter((p) => p.status === "active");
  const upcomingProgrammes = adminProgrammes.filter((p) => p.status === "upcoming");

  // Classes needing attention (nearly full or full)
  const nearlyFullClasses = upcomingClasses.filter((c) => c.bookedCount >= c.maxSpaces - 2);

  const totalBookedToday = todayScheduled.reduce((sum, c) => sum + c.bookedCount, 0);
  const totalCapacityToday = todayScheduled.reduce((sum, c) => sum + c.maxSpaces, 0);

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" description="Loading...">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard - Shruti Turner">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl text-[#2E1F33]">{getGreeting()}, Shruti</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Today's snapshot KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Today's Classes</p>
                  <p className="mt-1 text-3xl text-[#2E1F33]">{todayScheduled.length}</p>
                  {todayLive.length > 0 && (
                    <p className="mt-1 text-xs text-[#4B5B32]">{todayLive.length} live now</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
                  <Calendar className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Booked Today</p>
                  <p className="mt-1 text-3xl text-[#2E1F33]">{totalBookedToday}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    of {totalCapacityToday} spaces
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
                  <Users className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Programmes</p>
                  <p className="mt-1 text-3xl text-[#2E1F33]">{activeProgrammes.length}</p>
                  {upcomingProgrammes.length > 0 && (
                    <p className="mt-1 text-xs text-[#4B5B32]">
                      {upcomingProgrammes.length} starting soon
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
                  <BookOpen className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg. Attendance</p>
                  <p className="mt-1 text-3xl text-[#2E1F33]">{stats.avgAttendanceRate}%</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    across {stats.classesThisWeek} classes/week
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
                  <Activity className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attention needed */}
        {nearlyFullClasses.length > 0 && (
          <Card className="border-[#4B5B32]/20 bg-[#4B5B32]/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-[#4B5B32]" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nearlyFullClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/admin/classes/${cls.id}`}
                    className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-[#4B5B32]/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-sm">
                        {cls.className} — {cls.day}{" "}
                        {new Date(`2000-01-01T${cls.time}`).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Badge variant={cls.bookedCount >= cls.maxSpaces ? "destructive" : "secondary"}>
                      {cls.bookedCount >= cls.maxSpaces
                        ? "Full"
                        : `${cls.bookedCount}/${cls.maxSpaces}`}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's classes + programmes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today's class schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
              <Link href="/admin/classes">
                <Button variant="ghost" size="sm">
                  All classes <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todayScheduled.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No classes scheduled for today.
                </p>
              ) : (
                <div className="space-y-3">
                  {todayScheduled.map((cls) => (
                    <Link
                      key={cls.id}
                      href={`/admin/classes/${cls.id}`}
                      className="bg-secondary/50 hover:bg-secondary flex items-center justify-between rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[#4B5B32]/10">
                          <span className="text-xs text-[#4B5B32]">{cls.time}</span>
                          <span className="text-muted-foreground text-[10px]">{cls.duration}</span>
                        </div>
                        <div>
                          <p className="text-sm">{cls.className}</p>
                          <p className="text-muted-foreground text-xs">
                            {cls.classType} ·{" "}
                            {cls.attendees.filter((a) => a.status === "booked").length} participants
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={cls.bookedCount >= cls.maxSpaces ? "destructive" : "secondary"}
                      >
                        {cls.bookedCount}/{cls.maxSpaces}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active programmes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Programmes</CardTitle>
              <Link href="/admin/programmes">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProgrammes.map((prog) => {
                  const progressPct = Math.round(
                    (prog.sessionsCompleted / prog.sessionsTotal) * 100
                  );
                  const nextSession = prog.sessions.find((s) => s.status === "upcoming");
                  return (
                    <Link
                      key={prog.id}
                      href={`/admin/programmes/${prog.id}`}
                      className="bg-secondary/50 hover:bg-secondary block rounded-lg p-3 transition-colors"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm">{prog.name}</p>
                        <Badge variant="outline">
                          {prog.currentParticipants}/{prog.maxParticipants}
                        </Badge>
                      </div>
                      <div className="bg-secondary mb-2 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-[#4B5B32] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                          {prog.sessionsCompleted}/{prog.sessionsTotal} sessions
                        </span>
                        {nextSession && (
                          <span className="text-[#4B5B32]">Next: {nextSession.topic}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {upcomingProgrammes.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-muted-foreground mb-2 text-xs">Starting soon</p>
                    {upcomingProgrammes.map((prog) => (
                      <Link
                        key={prog.id}
                        href={`/admin/programmes/${prog.id}`}
                        className="hover:bg-secondary/50 flex items-center justify-between rounded-lg p-2.5 transition-colors"
                      >
                        <div>
                          <p className="text-sm">{prog.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {prog.duration} · Starts{" "}
                            {new Date(prog.startDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {prog.currentParticipants}/{prog.maxParticipants} enrolled
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance chart + this week */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Attendance vs Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.classAttendance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,31,51,0.1)" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="capacity" fill="#B5C49B" name="Capacity" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="attendance"
                      fill="#4B5B32"
                      name="Attendance"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* This week's remaining classes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">This Week</CardTitle>
              <Link href="/admin/classes">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/admin/classes/${cls.id}`}
                    className="hover:bg-secondary/50 flex items-center justify-between rounded-lg p-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4B5B32]/10">
                        <Calendar className="h-5 w-5 text-[#4B5B32]" />
                      </div>
                      <div>
                        <p className="text-sm">{cls.className}</p>
                        <p className="text-muted-foreground text-xs">
                          {cls.day} {cls.time} · {cls.duration}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cls.bookedCount >= cls.maxSpaces ? "destructive" : "secondary"}>
                      {cls.bookedCount}/{cls.maxSpaces}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/classes">
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Manage Today's Classes
                </Button>
              </Link>
              <Link href="/admin/members">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  View Members
                </Button>
              </Link>
              <Link href="/admin/programmes">
                <Button variant="outline" size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Programmes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

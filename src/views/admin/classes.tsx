"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Play,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { adminClassInstances, type AdminClassInstance } from "../../data/admin-data";
import { getTypeColor } from "../../data/schedule-data";
import { ScheduleClassModal } from "../../components/admin/schedule-class-modal";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const filtered = adminClassInstances.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesType = typeFilter === "all" || c.classType.toLowerCase() === typeFilter;
    return matchesStatus && matchesType;
  });

  const scheduled = adminClassInstances.filter((c) => c.status === "scheduled");
  const completed = adminClassInstances.filter((c) => c.status === "completed");

  // Total attendance rate from completed
  const totalBooked = completed.reduce((s, c) => s + c.bookedCount, 0);
  const totalAttended = completed.reduce((s, c) => s + c.attendedCount, 0);
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

  return (
    <AdminLayout title="Classes - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl text-[#2E1F33]">Class Management</h1>
            <p className="text-muted-foreground mt-1">
              {scheduled.length} upcoming · {completed.length} completed this period
            </p>
          </div>
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Class
          </Button>
        </div>

        <ScheduleClassModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          onSchedule={(data) => {
            console.log("Scheduled class:", data);
          }}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{scheduled.length}</p>
                  <p className="text-muted-foreground text-xs">Upcoming classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">
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
                <CheckCircle className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{attendanceRate}%</p>
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

function ClassRow({ classInstance }: { classInstance: AdminClassInstance }) {
  const statusBadge = STATUS_BADGE[classInstance.status];
  const StatusIcon = STATUS_ICON[classInstance.status];
  const typeColor = getTypeColor(classInstance.classType);
  const fillPercent = Math.round((classInstance.bookedCount / classInstance.maxSpaces) * 100);

  return (
    <Link href={`/admin/classes/${classInstance.id}`}>
      <Card className="cursor-pointer transition-colors hover:border-[#4B5B32]/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Status icon */}
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                classInstance.status === "live" ? "bg-[#4B5B32] text-[#FAFAF8]" : "bg-secondary"
              }`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm">{classInstance.className}</p>
                <Badge className={typeColor}>{classInstance.classType}</Badge>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {classInstance.day} {classInstance.date} · {classInstance.time} ·{" "}
                {classInstance.duration}
              </p>
            </div>

            {/* Capacity bar */}
            <div className="hidden w-32 md:block">
              <div className="mb-1 flex justify-between text-xs">
                <span>
                  {classInstance.bookedCount}/{classInstance.maxSpaces}
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
                        : "bg-[#4B5B32]"
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

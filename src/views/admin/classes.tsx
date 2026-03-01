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

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
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
            <Calendar className="w-4 h-4 mr-2" />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{scheduled.length}</p>
                  <p className="text-xs text-muted-foreground">Upcoming classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">
                    {scheduled.reduce((s, c) => s + c.bookedCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total bookings (upcoming)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Attendance rate (completed)</p>
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
            className="px-3 py-2 rounded-md border border-border bg-background text-sm"
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
            className="px-3 py-2 rounded-md border border-border bg-background text-sm"
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
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
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
  const fillPercent = Math.round(
    (classInstance.bookedCount / classInstance.maxSpaces) * 100
  );

  return (
    <Link href={`/admin/classes/${classInstance.id}`}>
      <Card className="hover:border-[#4B5B32]/30 transition-colors cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Status icon */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                classInstance.status === "live"
                  ? "bg-[#4B5B32] text-[#FAFAF8]"
                  : "bg-secondary"
              }`}
            >
              <StatusIcon className="w-5 h-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm">{classInstance.className}</p>
                <Badge className={typeColor}>{classInstance.classType}</Badge>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {classInstance.day} {classInstance.date} · {classInstance.time} ·{" "}
                {classInstance.duration}
              </p>
            </div>

            {/* Capacity bar */}
            <div className="hidden md:block w-32">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {classInstance.bookedCount}/{classInstance.maxSpaces}
                </span>
                <span className="text-muted-foreground">{fillPercent}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
                <Play className="w-3 h-3 mr-1" /> Start
              </Button>
            )}

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
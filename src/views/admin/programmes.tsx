"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import {
  Dumbbell,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  PlusCircle,
} from "lucide-react";
import { adminProgrammes, type AdminProgramme } from "../../data/admin-data";
import { CreateProgrammeModal } from "../../components/admin/create-programme-modal";
import { useState } from "react";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Active", variant: "default" },
  upcoming: { label: "Upcoming", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  draft: { label: "Draft", variant: "outline" },
};

export function AdminProgrammes() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const active = adminProgrammes.filter((p) => p.status === "active");
  const upcoming = adminProgrammes.filter((p) => p.status === "upcoming");
  const completed = adminProgrammes.filter((p) => p.status === "completed");

  return (
    <AdminLayout title="Programmes - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">Small Group Programmes</h1>
            <p className="text-muted-foreground mt-1">
              {active.length} active · {upcoming.length} upcoming · {completed.length} completed
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-accent hover:bg-brand-accent/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Programme
          </Button>
        </div>

        <CreateProgrammeModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreate={(data) => {
            console.log("Created programme:", data);
          }}
        />

        {/* Active programmes */}
        {active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-brand-dark text-lg">Active</h2>
            {active.map((prog) => (
              <ProgrammeCard key={prog.id} programme={prog} />
            ))}
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-brand-dark text-lg">Upcoming</h2>
            {upcoming.map((prog) => (
              <ProgrammeCard key={prog.id} programme={prog} />
            ))}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-brand-dark text-lg">Completed</h2>
            {completed.map((prog) => (
              <ProgrammeCard key={prog.id} programme={prog} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function ProgrammeCard({ programme }: { programme: AdminProgramme }) {
  const statusConfig = STATUS_CONFIG[programme.status];
  const progressPercent = Math.round((programme.sessionsCompleted / programme.sessionsTotal) * 100);

  return (
    <Link href={`/admin/programmes/${programme.id}`}>
      <Card className="hover:border-brand-accent/30 cursor-pointer transition-colors">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="bg-brand-accent/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <Dumbbell className="text-brand-accent h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base">{programme.name}</p>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {programme.description}
              </p>
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {programme.duration} · {programme.schedule}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {programme.currentParticipants}/{programme.maxParticipants} participants
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {programme.sessionsCompleted}/{programme.sessionsTotal} sessions
                </span>
              </div>
              {/* Progress bar */}
              {programme.status === "active" && (
                <div className="mt-3">
                  <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-brand-accent h-full rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-sm">£{programme.price}</span>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { AdminLayout } from "../../components/admin-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import type { AdminSmallGroupDetail } from "@/lib/small-groups/service";
import { buildSmallGroupTemplateHref } from "@/lib/small-groups/routes";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminProgrammeDetail({
  initialData,
}: {
  initialData: AdminSmallGroupDetail | null;
}) {
  if (!initialData) {
    return (
      <AdminLayout title="Programme Not Found - Admin">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Programme not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/programmes">Back to Programmes</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${initialData.title} - Admin`}>
      <div className="space-y-6">
        <Link
          href="/admin/programmes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Programmes
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-brand-dark text-2xl">{initialData.title}</h1>
            <Badge>{initialData.status.replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{initialData.runSlug}</Badge>
          </div>
          <p className="text-muted-foreground mt-3 max-w-3xl">{initialData.longDescription}</p>
          <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {initialData.durationLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {initialData.activeEnrolmentCount} active participants
            </span>
            <span>{initialData.priceLabel}</span>
            <span>{initialData.scheduleLabel || "Schedule announced soon"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">{initialData.enrolmentCount}</p>
              <p className="text-muted-foreground text-xs">Total enrolments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">{initialData.activeEnrolmentCount}</p>
              <p className="text-muted-foreground text-xs">Active enrolments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">{initialData.sessionCount}</p>
              <p className="text-muted-foreground text-xs">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-brand-dark text-2xl">{initialData.completedSessionCount}</p>
              <p className="text-muted-foreground text-xs">Completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {initialData.enrolments.length > 0 ? (
                initialData.enrolments.map((enrolment) => (
                  <div key={enrolment.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm">{enrolment.attendeeName}</p>
                        <p className="text-muted-foreground text-xs">{enrolment.attendeeEmail}</p>
                      </div>
                      <Badge variant="outline">{enrolment.status}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {enrolment.progressSummary ||
                        `${enrolment.sessionsAttended} session${enrolment.sessionsAttended === 1 ? "" : "s"} attended`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No participants have been enrolled into this programme yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {initialData.sessions.map((session) => (
                <div key={session.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm">
                        Week {session.sequenceNumber}: {session.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(session.startsAt)}
                      </p>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : "outline"}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {initialData.outcomes.length > 0 ? (
              initialData.outcomes.map((item) => <p key={item}>• {item}</p>)
            ) : (
              <p className="text-muted-foreground">No template outcomes have been added yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="text-muted-foreground rounded-[1.5rem] border p-6 text-sm leading-relaxed">
          <p>
            This detail view is now centred on a scheduled run. Public content comes from the
            template, while dates, capacity, pricing, enrolments and gifts are driven by the live
            run record.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={buildSmallGroupTemplateHref(initialData.templateSlug)}>
                View public template page
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

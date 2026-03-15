"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Clock3, Users } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { MemberSmallGroupDetail } from "@/lib/small-groups/service";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function DashboardSmallGroupDetail({
  initialData,
}: {
  initialData: MemberSmallGroupDetail | null;
}) {
  if (!initialData) {
    return (
      <DashboardLayout title="Small Group Programme - Private Studio">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Programme not found.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard/small-groups">Back to small group programmes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${initialData.title} - Private Studio`}>
      <div className="space-y-6">
        <Link
          href="/dashboard/small-groups"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to small group programmes
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-accent text-brand-white">
                {initialData.enrolled ? "Enrolled" : "Available"}
              </Badge>
              <Badge variant="outline">{statusLabel(initialData.status)}</Badge>
            </div>
            <h1 className="text-3xl">{initialData.title}</h1>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
              {initialData.longDescription || initialData.shortSummary}
            </p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {initialData.durationLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {initialData.cohortSize} places
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="bg-background rounded-[1.5rem] border p-6">
              <h2 className="mb-4 text-xl">Programme Overview</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                    Schedule
                  </p>
                  <p className="mt-2 text-sm">
                    {initialData.scheduleLabel || "Schedule announced soon"}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">Price</p>
                  <p className="mt-2 text-sm">{initialData.priceLabel}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                    Progress
                  </p>
                  <p className="mt-2 text-sm">
                    {initialData.progressSummary ||
                      `${initialData.sessionsAttended} session${initialData.sessionsAttended === 1 ? "" : "s"} attended`}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                    Next session
                  </p>
                  <p className="mt-2 text-sm">
                    {initialData.nextSessionStartsAt
                      ? formatDateTime(initialData.nextSessionStartsAt)
                      : "No future session scheduled yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-[1.5rem] border p-6">
              <h2 className="mb-4 text-xl">Sessions</h2>
              <div className="space-y-3">
                {initialData.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">
                        Week {session.sequenceNumber}: {session.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(session.startsAt)}
                      </p>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : "outline"}>
                      {statusLabel(session.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-brand-accent/20 bg-brand-accent/5 rounded-[1.5rem] border p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-brand-accent h-5 w-5" />
                <h2 className="text-xl">What to do next</h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  {initialData.enrolled
                    ? "Keep an eye on your next session time and use your regular dashboard for class bookings around it."
                    : "This programme is not linked to your account yet. Use the public programme page to register interest or join the waitlist."}
                </p>
                <p className="text-muted-foreground">
                  Small group programme support stays close to the same calm, adaptive training
                  approach as Move Well Classes, but in a tighter cohort.
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <Button asChild>
                  <Link href={initialData.publicHref}>View public programme details</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Shruti</Link>
                </Button>
              </div>
            </div>

            <div className="bg-background rounded-[1.5rem] border p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="text-brand-accent h-5 w-5" />
                <h2 className="text-xl">Planning</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Use this page to track the structure of the programme block, then bring any
                day-to-day questions back to class, email, or your wider coaching support when
                relevant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

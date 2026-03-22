"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Sparkles, Users } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { MemberSmallGroupSummary } from "@/lib/small-groups/service";
import { buildDashboardSmallGroupRunHref } from "@/lib/small-groups/routes";
import { AppEmptyState, AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

function formatDate(value: string | null) {
  if (!value) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(value: MemberSmallGroupSummary["status"]) {
  return value.replaceAll("_", " ");
}

export function DashboardSmallGroupsPage({
  initialData,
}: {
  initialData: MemberSmallGroupSummary[];
}) {
  const enrolled = initialData.filter((programme) => programme.enrolled);
  const available = initialData.filter(
    (programme) => !programme.enrolled && programme.status !== "completed"
  );

  return (
    <DashboardLayout title="Small Group Programmes - Private Studio">
      <div className="space-y-8">
        <AppPageHeader
          eyebrow="Small-group training"
          title="Small Group Programmes"
          description="A clearer view of your current programme runs, what is coming next, and what is currently open for registration."
          actions={
            <Button asChild variant="outline">
              <Link href="/classes/small-groups">View public programmes</Link>
            </Button>
          }
        />

        <AppMetricGrid className="lg:grid-cols-3">
          <AppMetricCard label="Enrolled runs" value={enrolled.length} detail="currently in your dashboard" />
          <AppMetricCard label="Open runs" value={available.length} detail="available to register" />
          <AppMetricCard
            label="Completed"
            value={initialData.filter((programme) => programme.status === "completed").length}
            detail="archived programme runs"
          />
        </AppMetricGrid>

        {enrolled.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-brand-accent h-5 w-5" />
              <h2 className="text-xl">Your Programmes</h2>
            </div>
            <div className="grid gap-5">
              {enrolled.map((programme) => (
                <div key={programme.id} className="bg-background rounded-[1.5rem] border p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl">{programme.title}</h3>
                        <Badge className="bg-brand-accent text-brand-white">Enrolled</Badge>
                        <Badge variant="outline">{statusLabel(programme.status)}</Badge>
                      </div>
                      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                        {programme.shortSummary}
                      </p>
                      <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {programme.durationLabel} · {formatDate(programme.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {programme.cohortSize} places
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border p-4">
                          <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                            Progress
                          </p>
                          <p className="mt-2 text-sm">
                            {programme.progressSummary ||
                              `${programme.sessionsAttended} session${programme.sessionsAttended === 1 ? "" : "s"} attended`}
                          </p>
                        </div>
                        <div className="rounded-xl border p-4">
                          <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase">
                            Next session
                          </p>
                          <p className="mt-2 text-sm">
                            {programme.nextSessionStartsAt
                              ? formatDate(programme.nextSessionStartsAt)
                              : "No future session scheduled yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button asChild>
                        <Link href={buildDashboardSmallGroupRunHref(programme.runSlug)}>
                          View programme
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <AppEmptyState
            title="You are not enrolled in a programme yet"
            description="When you join a small group programme, your sessions, progress, and next steps will appear here."
            action={
              <Button asChild>
                <Link href="/classes/small-groups">Explore current programmes</Link>
              </Button>
            }
          />
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-accent h-5 w-5" />
            <h2 className="text-xl">Currently Open</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {available.map((programme) => (
              <div key={programme.id} className="bg-background rounded-[1.5rem] border p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl">{programme.title}</h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {programme.shortSummary}
                      </p>
                    </div>
                    {programme.badge ? <Badge variant="outline">{programme.badge}</Badge> : null}
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                    <span>{programme.durationLabel}</span>
                    <span>{programme.scheduleLabel || "Schedule announced soon"}</span>
                    <span>{programme.priceLabel}</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                      {formatDate(programme.startDate)}
                    </p>
                    <Button asChild variant="outline">
                      <Link href={programme.publicHref}>
                        View template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

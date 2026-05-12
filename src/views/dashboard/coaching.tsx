"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Compass,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CoachingDashboardDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { coachingTiers } from "@/data/marketing";

const tierLabels: Record<string, string> = {
  personal_programme: "Independent Training Plan",
  coached_plan: "Coached Training Plan",
  coaching: "Coaching",
  unsure: "Coaching Support",
};

const offerLabels = Object.fromEntries(coachingTiers.map((offer) => [offer.id, offer.name]));

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  follow_up_needed: "Follow-up needed",
  approved: "Approved",
  declined: "Declined",
  converted: "Converted",
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  application_pending: "Application pending",
  not_a_client: "Not a client",
};

const everfitLabels: Record<string, string> = {
  not_started: "Not started",
  invite_sent: "Invite sent",
  connected: "Connected",
  sync_issue: "Needs attention",
};

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusVariant(value: string): "default" | "secondary" | "outline" | "destructive" {
  if (value === "declined" || value === "sync_issue") return "destructive";
  if (value === "active" || value === "connected" || value === "approved") return "default";
  if (value === "paused" || value === "completed") return "outline";
  return "secondary";
}

export function DashboardCoaching({ initialData }: { initialData?: CoachingDashboardDto | null }) {
  const [data, setData] = useState<CoachingDashboardDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/me/coaching", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load coaching.");
        const payload = (await response.json()) as CoachingDashboardDto;
        if (active) setData(payload);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load coaching.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  const nextAction = useMemo(() => {
    if (!data) return null;
    if (data.state === "not_a_client") {
      return {
        title: "Choose your next step",
        body: "Explore coaching options or send an application when you are ready.",
        primaryHref: "/coaching",
        primaryLabel: "Explore Coaching",
        secondaryHref: "/coaching/apply",
        secondaryLabel: "Apply",
      };
    }
    if (data.state === "application_pending" && data.application) {
      return {
        title: "Application in review",
        body: "Your application is in the queue. You’ll hear back personally within 48 hours.",
        primaryHref: "/coaching/apply",
        primaryLabel: "Review What You Sent",
        secondaryHref: "/contact",
        secondaryLabel: "Ask a Question",
      };
    }
    return {
      title: "Continue your coaching journey",
      body: "Use your dashboard to keep track of check-ins, sessions, and Everfit setup.",
      primaryHref: "/dashboard/coaching",
      primaryLabel: "Refresh Coaching Status",
      secondaryHref: "/contact",
      secondaryLabel: "Contact Shruti",
    };
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout title="Coaching - Private Studio">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Coaching - Private Studio">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "No coaching data available."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Coaching - Private Studio">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Coaching dashboard"
          title="Coaching"
          description="A single place for application status, onboarding, check-ins, and the next coaching action that matters."
          actions={
            <Badge
              variant={statusVariant(
                data.profile?.status || data.application?.status || data.state
              )}
            >
              {statusLabels[data.profile?.status || data.application?.status || data.state] ||
                "Coaching"}
            </Badge>
          }
        />

        <AppMetricGrid className="lg:grid-cols-3">
          <AppMetricCard
            label="Current state"
            value={statusLabels[data.state] || "Coaching"}
            detail={
              data.application?.offerKey
                ? offerLabels[data.application.offerKey]
                : data.profile
                  ? tierLabels[data.profile.tier]
                  : "Awaiting coaching profile"
            }
          />
          <AppMetricCard
            label="Application"
            value={data.application ? statusLabels[data.application.status] : "Not submitted"}
            detail={
              data.application
                ? data.application.offerKey
                  ? offerLabels[data.application.offerKey]
                  : tierLabels[data.application.tier]
                : "No coaching application on file"
            }
          />
          <AppMetricCard
            label="Everfit"
            value={
              data.profile ? everfitLabels[data.profile.everfitConnectionStatus] : "Not started"
            }
            detail={
              data.profile?.nextCheckInDueAt
                ? `Next check-in ${formatDateTime(data.profile.nextCheckInDueAt)}`
                : "No check-in scheduled yet"
            }
          />
        </AppMetricGrid>

        <Card className="border-brand-accent/20 bg-brand-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="text-brand-accent h-5 w-5" />
              {nextAction?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {nextAction?.body}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {nextAction?.secondaryHref ? (
                <Button asChild variant="outline">
                  <Link href={nextAction.secondaryHref}>{nextAction.secondaryLabel}</Link>
                </Button>
              ) : null}
              {nextAction?.primaryHref ? (
                <Button asChild>
                  <Link href={nextAction.primaryHref}>
                    {nextAction.primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {data.application ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="text-brand-accent h-5 w-5" />
                Application
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Support level
                </p>
                <p className="mt-1">
                  {data.application.offerKey
                    ? offerLabels[data.application.offerKey]
                    : tierLabels[data.application.tier]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Status</p>
                <p className="mt-1">{statusLabels[data.application.status]}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Submitted</p>
                <p className="mt-1">{formatDateTime(data.application.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {data.profile ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Coaching Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Tier</p>
                    <p className="mt-1">{tierLabels[data.profile.tier]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Status</p>
                    <div className="mt-1">
                      <Badge variant={statusVariant(data.profile.status)}>
                        {statusLabels[data.profile.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Everfit</p>
                    <div className="mt-1">
                      <Badge variant={statusVariant(data.profile.everfitConnectionStatus)}>
                        {everfitLabels[data.profile.everfitConnectionStatus]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Move Well Membership
                    </p>
                    <p className="mt-1">
                      {data.profile.includesMoveWellMembership ? "Included" : "Not included"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Next check-in
                    </p>
                    <p className="mt-1">
                      {formatDateTime(data.profile.nextCheckInDueAt) || "Not scheduled yet"}
                    </p>
                    {data.profile.nextCheckInStatus ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        Status: {data.profile.nextCheckInStatus.replaceAll("_", " ")}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Next session
                    </p>
                    <p className="mt-1">
                      {formatDateTime(data.profile.nextSessionStartsAt) || "No session scheduled"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                    Coaching delivery
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Workouts, detailed check-ins, coach notes, and messages live in Everfit. This
                    dashboard only shows high-level status and next actions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="text-brand-accent h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-between">
                    <Link href="/dashboard/membership">
                      View Membership & Credits
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/classes">
                      Book a Move Well Class
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/contact">
                      Contact Shruti
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <a href="https://everfit.io/" target="_blank" rel="noreferrer">
                      Open Everfit
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="text-brand-accent h-5 w-5" />
                    What this area is for
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    Use this dashboard to track your application, onboarding, included membership,
                    check-ins, and the admin side of your coaching support.
                  </p>
                  <p className="text-muted-foreground">
                    Everfit remains the place where workouts and programming live. This dashboard is
                    the joined-up status layer around that experience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

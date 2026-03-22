"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, RefreshCcw, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCoachingApplicationDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

const tierLabels: Record<string, string> = {
  personal_programme: "Independent Training Plan",
  coached_plan: "Coached Training Plan",
  coaching: "Coaching",
  unsure: "Unsure",
};

const statusOptions = [
  "submitted",
  "under_review",
  "follow_up_needed",
  "approved",
  "declined",
  "converted",
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved" || status === "converted") return "default";
  if (status === "declined") return "destructive";
  if (status === "follow_up_needed") return "outline";
  return "secondary";
}

export function AdminCoaching({
  initialData,
}: {
  initialData?: AdminCoachingApplicationDto[] | null;
}) {
  const [applications, setApplications] = useState<AdminCoachingApplicationDto[]>(
    initialData || []
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});

  const syncDrafts = (rows: AdminCoachingApplicationDto[]) => {
    setStatusDrafts(Object.fromEntries(rows.map((row) => [row.id, row.status])));
    setNotesDrafts(Object.fromEntries(rows.map((row) => [row.id, row.adminNotes || ""])));
  };

  const loadApplications = async (nextStatus = statusFilter, nextTier = tierFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("status", nextStatus);
      params.set("tier", nextTier);
      const response = await fetch(`/api/admin/coaching/applications?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load coaching applications.");
      const payload = (await response.json()) as AdminCoachingApplicationDto[];
      setApplications(payload);
      syncDrafts(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load coaching applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      syncDrafts(initialData);
      return;
    }
    void loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const summary = useMemo(() => {
    const submitted = applications.filter((row) => row.status === "submitted").length;
    const underReview = applications.filter((row) => row.status === "under_review").length;
    const approved = applications.filter(
      (row) => row.status === "approved" || row.status === "converted"
    ).length;
    return { submitted, underReview, approved };
  }, [applications]);

  const saveApplication = async (id: string, convertToClient = false) => {
    setSavingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/coaching/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: statusDrafts[id],
          adminNotes: notesDrafts[id],
          convertToClient,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update coaching application.");
      }
      await loadApplications();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update coaching application."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout title="Coaching - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Coaching pipeline"
          title="Coaching Applications"
          description="Review new applications, add notes, and convert approved applicants into active coaching clients."
          actions={
            <Button variant="outline" onClick={() => void loadApplications()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <AppMetricGrid className="lg:grid-cols-3">
          <AppMetricCard label="Submitted" value={summary.submitted} detail="awaiting initial review" />
          <AppMetricCard label="Under review" value={summary.underReview} detail="active decision queue" />
          <AppMetricCard label="Approved / converted" value={summary.approved} detail="ready for onboarding or already active" />
        </AppMetricGrid>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Filter className="text-brand-accent h-4 w-4" />
              <span className="text-sm">Filters</span>
            </div>
            <div className="grid flex-1 gap-4 md:grid-cols-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  void loadApplications(value, tierFilter);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={tierFilter}
                onValueChange={(value) => {
                  setTierFilter(value);
                  void loadApplications(statusFilter, value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers</SelectItem>
                  {Object.entries(tierLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading coaching applications...</p>
        ) : null}

        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{application.applicantName}</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {application.applicantEmail}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={badgeVariant(application.status)}>
                        {application.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="outline">
                        {tierLabels[application.tier] || application.tier}
                      </Badge>
                      {application.hasMoveWellMembershipSnapshot ? (
                        <Badge variant="outline">Move Well member</Badge>
                      ) : null}
                      {application.isLinkedUserCoachingClient ? (
                        <Badge variant="default">Linked coaching client</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm md:text-right">
                    <p>Submitted {formatDateTime(application.createdAt)}</p>
                    {application.reviewedAt ? (
                      <p className="mt-1">Reviewed {formatDateTime(application.reviewedAt)}</p>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Application answers
                    </p>
                    <div className="space-y-3">
                      {Object.entries(application.answers).map(([key, value]) => (
                        <div key={key} className="rounded-lg border p-3">
                          <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                            {key}
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                        Status
                      </p>
                      <Select
                        value={statusDrafts[application.id] || application.status}
                        onValueChange={(value) =>
                          setStatusDrafts((current) => ({ ...current, [application.id]: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replaceAll("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                        Internal notes
                      </p>
                      <Textarea
                        value={notesDrafts[application.id] || ""}
                        rows={7}
                        onChange={(event) =>
                          setNotesDrafts((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder="Add review notes, follow-up questions, or conversion context."
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        disabled={savingId === application.id}
                        onClick={() => void saveApplication(application.id)}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Save review
                      </Button>
                      <Button
                        variant="outline"
                        disabled={
                          savingId === application.id ||
                          !application.userId ||
                          application.isLinkedUserCoachingClient
                        }
                        onClick={() => void saveApplication(application.id, true)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Convert to coaching client
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No coaching applications match these filters.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}

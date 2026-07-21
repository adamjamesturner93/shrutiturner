"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, Mail, RefreshCcw, Sparkles } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCoachingApplicationDto } from "@/lib/api/types";
import type { ApiSuccess } from "@/lib/api/route";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { coachingTiers } from "@/data/marketing";

const tierLabels: Record<string, string> = {
  personal_programme: "Independent Training Plan",
  coached_plan: "Guided Training Plan",
  coaching: "1:1 Offers",
  unsure: "Unsure",
};

const offerLabels = Object.fromEntries(coachingTiers.map((offer) => [offer.id, offer.name]));
const answerLabels: Record<string, string> = {
  trainingEvent: "Life or sporting event",
  conditions: "Injuries, conditions, or context",
  typicalWeek: "Typical activity/work week",
  scheduleConsiderations: "Schedule considerations",
  equipment: "Equipment or training access",
  anythingElse: "Anything else",
  heardAbout: "How they heard about Shruti",
};

type CoachingPipelineTab = "new" | "waitlist" | "payment" | "clients" | "closed";

const pipelineTabs: Array<{ value: CoachingPipelineTab; label: string }> = [
  { value: "new", label: "New applications" },
  { value: "waitlist", label: "Waiting list" },
  { value: "payment", label: "Awaiting payment" },
  { value: "clients", label: "Onboarding / active" },
  { value: "closed", label: "Closed" },
];

const manualSetupLabels: Record<string, string> = {
  not_started: "Not started",
  invite_sent: "Everfit invite sent",
  connected: "Active in Everfit",
  sync_issue: "Needs attention",
};

const profileStatusLabels: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

const packageEffectiveModeLabels: Record<string, string> = {
  next_invoice: "Next Stripe invoice",
  immediate: "Immediately",
};

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
  if (status === "follow_up_needed" || status === "withdrawn") return "outline";
  return "secondary";
}

function matchesPipelineTab(application: AdminCoachingApplicationDto, tab: CoachingPipelineTab) {
  if (tab === "new") {
    return ["submitted", "under_review", "follow_up_needed"].includes(application.status);
  }
  if (tab === "waitlist") return application.status === "waitlisted";
  if (tab === "payment") return application.status === "approved";
  if (tab === "clients") {
    return application.status === "converted" || Boolean(application.coachingProfile);
  }
  return application.status === "declined" || application.status === "withdrawn";
}

function sortApplicationsForTab(
  applications: AdminCoachingApplicationDto[],
  tab: CoachingPipelineTab
) {
  return [...applications].sort((left, right) => {
    if (tab === "waitlist") {
      const leftTime = new Date(left.waitlistedAt || left.createdAt).getTime();
      const rightTime = new Date(right.waitlistedAt || right.createdAt).getTime();
      return leftTime - rightTime;
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function getOperationalNextStep(application: AdminCoachingApplicationDto) {
  if (!application.userId) {
    return "Ask the applicant to sign in with this email so payment and onboarding can attach to their account.";
  }
  if (application.status === "submitted" || application.status === "under_review") {
    return "Review the application. If it is a fit, approve it and include any client-facing note that should appear in the email.";
  }
  if (application.status === "follow_up_needed") {
    return "Send follow-up questions before approving or declining.";
  }
  if (application.status === "waitlisted") {
    return "Applicant is waiting for coaching capacity. Approve from the waiting list when a place opens, or reject if it is no longer a fit.";
  }
  if (application.status === "approved") {
    return "Approval email is sent. Client can now sign in, open Coaching, accept legal agreements and complete payment.";
  }
  if (application.status === "converted" || application.isLinkedUserCoachingClient) {
    return "Client is converted. Track manual Everfit setup, onboarding andd check-ins from the coaching profile.";
  }
  if (application.status === "declined") {
    return "Application is declined. Keep internal notes clear for future context.";
  }
  if (application.status === "withdrawn") {
    return "Applicant left the waiting list. Reopening this application should only happen if Shruti wants to restore the original application context.";
  }
  return "Review the current status and choose the next admin action.";
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
  const [activeTab, setActiveTab] = useState<CoachingPipelineTab>("new");
  const [tierFilter, setTierFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reminderSendingId, setReminderSendingId] = useState<string | null>(null);
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});
  const [packageOfferDrafts, setPackageOfferDrafts] = useState<Record<string, string>>({});
  const [packageModeDrafts, setPackageModeDrafts] = useState<Record<string, string>>({});
  const [packageNoteDrafts, setPackageNoteDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const syncDrafts = (rows: AdminCoachingApplicationDto[]) => {
    setNotesDrafts(Object.fromEntries(rows.map((row) => [row.id, row.adminNotes || ""])));
    setDecisionDrafts(Object.fromEntries(rows.map((row) => [row.id, row.decisionReason || ""])));
    setPackageOfferDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || ""])),
    }));
    setPackageModeDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || "next_invoice"])),
    }));
    setPackageNoteDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || ""])),
    }));
  };

  const loadApplications = async (nextTier = tierFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("status", "all");
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
    const waitlisted = applications.filter((row) => row.status === "waitlisted").length;
    const awaitingPayment = applications.filter((row) => row.status === "approved").length;
    const activeClients = applications.filter(
      (row) => row.status === "converted" || Boolean(row.coachingProfile)
    ).length;
    return { submitted, underReview, waitlisted, awaitingPayment, activeClients };
  }, [applications]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        pipelineTabs.map((tab) => [
          tab.value,
          applications.filter((application) => matchesPipelineTab(application, tab.value)).length,
        ])
      ) as Record<CoachingPipelineTab, number>,
    [applications]
  );

  const tabbedApplications = useMemo(
    () =>
      sortApplicationsForTab(
        applications.filter((application) => matchesPipelineTab(application, activeTab)),
        activeTab
      ),
    [activeTab, applications]
  );

  const activeTabLabel =
    pipelineTabs.find((tab) => tab.value === activeTab)?.label.toLowerCase() ||
    "selected applications";

  const saveApplication = async (input: {
    id: string;
    status?: string;
    convertToClient?: boolean;
  }) => {
    setSavingId(input.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: input.id,
          status: input.status,
          adminNotes: notesDrafts[input.id],
          decisionReason: decisionDrafts[input.id],
          convertToClient: input.convertToClient,
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

  const updateManualSetupStatus = async (
    application: AdminCoachingApplicationDto,
    everfitConnectionStatus: string
  ) => {
    if (!application.coachingProfile) return;
    setSavingId(application.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/profiles/manual-setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: application.coachingProfile.id,
          everfitConnectionStatus,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update manual setup status.");
      }
      setNotice(`${application.applicantName}'s manual Everfit setup status was updated.`);
      await loadApplications();
    } catch (setupError) {
      setError(
        setupError instanceof Error ? setupError.message : "Failed to update manual setup status."
      );
    } finally {
      setSavingId(null);
    }
  };

  const sendPaymentReminder = async (application: AdminCoachingApplicationDto) => {
    setReminderSendingId(application.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/coaching/applications/${application.id}/payment-reminder`,
        { method: "POST" }
      );
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to send payment reminder.");
      }
      setNotice(`Payment reminder sent to ${application.applicantName}.`);
      await loadApplications();
    } catch (reminderError) {
      setError(
        reminderError instanceof Error ? reminderError.message : "Failed to send payment reminder."
      );
    } finally {
      setReminderSendingId(null);
    }
  };

  const updateProfileStatus = async (
    application: AdminCoachingApplicationDto,
    status: "onboarding" | "active" | "paused" | "completed"
  ) => {
    if (!application.coachingProfile) return;
    setSavingId(application.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/profiles/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: application.coachingProfile.id,
          status,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update coaching status.");
      }
      setNotice(`${application.applicantName}'s coaching status was updated.`);
      await loadApplications();
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : "Failed to update coaching status."
      );
    } finally {
      setSavingId(null);
    }
  };

  const requestPackageChange = async (
    application: AdminCoachingApplicationDto,
    manualApply = false
  ) => {
    if (!application.coachingProfile) return;
    const toOfferKey = packageOfferDrafts[application.id];
    if (!toOfferKey) {
      setError("Choose the new coaching package first.");
      return;
    }

    if (manualApply) {
      const firstConfirmed = window.confirm(
        `Manually change ${application.applicantName}'s package without client payment confirmation?`
      );
      if (!firstConfirmed) return;
      const secondConfirmed = window.confirm(
        "Confirm again: this bypasses Stripe/client confirmation and should only be used for pro-bono or manually handled package changes."
      );
      if (!secondConfirmed) return;
    }

    setSavingId(application.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/package-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: application.coachingProfile.id,
          toOfferKey,
          effectiveMode: packageModeDrafts[application.id] || "next_invoice",
          note: packageNoteDrafts[application.id],
          manualApply,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create package change.");
      }
      setNotice(
        manualApply
          ? `${application.applicantName}'s package was changed manually.`
          : `${application.applicantName} was emailed to review the package change.`
      );
      await loadApplications();
    } catch (packageError) {
      setError(
        packageError instanceof Error ? packageError.message : "Failed to create package change."
      );
    } finally {
      setSavingId(null);
    }
  };

  const scheduleClientCancellation = async (application: AdminCoachingApplicationDto) => {
    if (!application.userId) return;
    const firstConfirmed = window.confirm(
      `Schedule coaching cancellation for ${application.applicantName}? Their next coaching payment will still be taken and will be their final payment.`
    );
    if (!firstConfirmed) return;
    const secondConfirmed = window.confirm(
      "Confirm again: this schedules the Stripe coaching subscription to end after the final paid period. It does not remove the coaching client flag or remove Everfit access."
    );
    if (!secondConfirmed) return;

    setCancellingUserId(application.userId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: application.userId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Partial<
            ApiSuccess<{
              nextPaymentAt: string;
              endsAt: string;
            }>
          > & {
            error?: { message?: string };
            message?: string;
          })
        | null;
      if (!response.ok || !payload?.data) {
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to schedule cancellation."
        );
      }
      setNotice(
        `${application.applicantName}'s next payment on ${formatDateTime(
          payload.data.nextPaymentAt
        )} is now scheduled as their final coaching payment. Billing ends ${formatDateTime(
          payload.data.endsAt
        )}.`
      );
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Failed to schedule cancellation."
      );
    } finally {
      setCancellingUserId(null);
    }
  };

  return (
    <AdminLayout title="Coaching - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Coaching pipeline"
          title="Coaching Applications"
          description="Review new applications, add notes and convert approved applicants into active coaching clients."
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
        {notice ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </div>
        ) : null}

        <AppMetricGrid className="lg:grid-cols-5">
          <AppMetricCard
            label="Submitted"
            value={summary.submitted}
            detail="awaiting initial review"
          />
          <AppMetricCard
            label="Under review"
            value={summary.underReview}
            detail="active decision queue"
          />
          <AppMetricCard label="Waiting list" value={summary.waitlisted} detail="oldest first" />
          <AppMetricCard
            label="Awaiting payment"
            value={summary.awaitingPayment}
            detail="approved and invited"
          />
          <AppMetricCard
            label="Clients"
            value={summary.activeClients}
            detail="onboarding or active"
          />
        </AppMetricGrid>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CoachingPipelineTab)}
            >
              <TabsList className="h-auto flex-wrap justify-start">
                {pipelineTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label} ({tabCounts[tab.value]})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Filter className="text-brand-accent h-4 w-4" />
              <span className="text-sm">Tier filter</span>
            </div>
            <div className="max-w-sm">
              <Select
                value={tierFilter}
                onValueChange={(value) => {
                  setTierFilter(value);
                  void loadApplications(value);
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
          {tabbedApplications.map((application) => (
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
                        {application.offerKey
                          ? offerLabels[application.offerKey]
                          : tierLabels[application.tier] || application.tier}
                      </Badge>
                      {application.isLinkedUserCoachingClient ? (
                        <Badge variant="default">Linked coaching client</Badge>
                      ) : null}
                      {!application.userId ? (
                        <Badge variant="outline">No linked account</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm md:text-right">
                    <p>Submitted {formatDateTime(application.createdAt)}</p>
                    {application.reviewedAt ? (
                      <p className="mt-1">Reviewed {formatDateTime(application.reviewedAt)}</p>
                    ) : null}
                    {application.waitlistedAt ? (
                      <p className="mt-1">Waitlisted {formatDateTime(application.waitlistedAt)}</p>
                    ) : null}
                    {application.waitlistLeftAt ? (
                      <p className="mt-1">
                        Left waitlist {formatDateTime(application.waitlistLeftAt)}
                      </p>
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
                      {Object.entries(application.answers)
                        .filter(([key]) => key !== "offerKey")
                        .map(([key, value]) => (
                          <div key={key} className="rounded-lg border p-3">
                            <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                              {answerLabels[key] || key}
                            </p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-secondary/20 rounded-lg border p-4">
                      <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                        Next operational step
                      </p>
                      <p className="text-sm leading-relaxed">
                        {getOperationalNextStep(application)}
                      </p>
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

                    <div>
                      <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                        Client-facing decision note
                      </p>
                      <Textarea
                        value={decisionDrafts[application.id] || ""}
                        rows={4}
                        disabled={
                          application.status === "converted" ||
                          application.isLinkedUserCoachingClient
                        }
                        onChange={(event) =>
                          setDecisionDrafts((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          application.status === "converted" ||
                          application.isLinkedUserCoachingClient
                            ? "Decision notes are locked after conversion. Use internal notes for ongoing context."
                            : "Shown to the client in approval/rejection email and their coaching dashboard. Required before rejection."
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        disabled={savingId === application.id}
                        onClick={() => void saveApplication({ id: application.id })}
                        variant="outline"
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Save notes
                      </Button>

                      {application.status === "submitted" ? (
                        <Button
                          disabled={savingId === application.id}
                          onClick={() =>
                            void saveApplication({ id: application.id, status: "under_review" })
                          }
                        >
                          Start review
                        </Button>
                      ) : null}

                      {application.status === "submitted" ||
                      application.status === "under_review" ||
                      application.status === "follow_up_needed" ? (
                        <Button
                          disabled={savingId === application.id}
                          onClick={() =>
                            void saveApplication({ id: application.id, status: "waitlisted" })
                          }
                          variant="outline"
                        >
                          Add to waiting list
                        </Button>
                      ) : null}

                      {application.status === "under_review" ||
                      application.status === "follow_up_needed" ||
                      application.status === "waitlisted" ? (
                        <>
                          <Button
                            disabled={savingId === application.id}
                            onClick={() =>
                              void saveApplication({ id: application.id, status: "approved" })
                            }
                          >
                            {application.status === "waitlisted"
                              ? "Approve from waiting list"
                              : "Approve and request payment"}
                          </Button>
                          <Button
                            disabled={savingId === application.id}
                            onClick={() =>
                              void saveApplication({ id: application.id, status: "declined" })
                            }
                            variant="outline"
                          >
                            Reject application
                          </Button>
                        </>
                      ) : null}

                      {application.status === "declined" || application.status === "withdrawn" ? (
                        <Button
                          disabled={savingId === application.id}
                          onClick={() =>
                            void saveApplication({ id: application.id, status: "under_review" })
                          }
                          variant="outline"
                        >
                          Reopen for review
                        </Button>
                      ) : null}

                      {application.status === "approved" ? (
                        <div className="text-muted-foreground space-y-3 rounded-lg border p-3 text-xs leading-relaxed">
                          <p>
                            Approved and awaiting client payment from their dashboard. The reminder
                            links them back to the website so agreements and payment stay attached
                            to their account.
                          </p>
                          {application.paymentReminderSentAt ? (
                            <p>
                              Last reminder sent {formatDateTime(application.paymentReminderSentAt)}
                              .
                            </p>
                          ) : null}
                          <Button
                            className="w-full"
                            disabled={
                              reminderSendingId === application.id ||
                              savingId === application.id ||
                              !application.userId
                            }
                            onClick={() => void sendPaymentReminder(application)}
                            variant="outline"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send payment reminder
                          </Button>
                        </div>
                      ) : null}

                      {application.status === "under_review" ||
                      application.status === "follow_up_needed" ||
                      application.status === "approved" ||
                      application.status === "waitlisted" ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm text-amber-950">Manual/pro-bono conversion</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            This bypasses the Stripe payment request and immediately creates a
                            coaching client profile. Use only for pro-bono clients or manually paid
                            arrangements.
                          </p>
                          <Button
                            className="mt-3 w-full"
                            variant="outline"
                            disabled={
                              savingId === application.id ||
                              !application.userId ||
                              application.isLinkedUserCoachingClient
                            }
                            onClick={() =>
                              void saveApplication({
                                id: application.id,
                                convertToClient: true,
                              })
                            }
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Convert without payment
                          </Button>
                        </div>
                      ) : null}

                      {application.userId && application.isLinkedUserCoachingClient ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          {application.coachingProfile ? (
                            <div className="mb-4 space-y-4">
                              <div className="rounded-md border border-amber-200 bg-white/70 p-3">
                                <p className="text-sm text-amber-950">Coaching status</p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                  Current status:{" "}
                                  {profileStatusLabels[application.coachingProfile.status] ||
                                    application.coachingProfile.status}
                                </p>
                                <div className="mt-3 grid gap-2">
                                  {Object.entries(profileStatusLabels).map(([value, label]) => (
                                    <Button
                                      key={value}
                                      size="sm"
                                      variant={
                                        application.coachingProfile?.status === value
                                          ? "default"
                                          : "outline"
                                      }
                                      disabled={savingId === application.id}
                                      onClick={() =>
                                        void updateProfileStatus(
                                          application,
                                          value as "onboarding" | "active" | "paused" | "completed"
                                        )
                                      }
                                    >
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-md border border-amber-200 bg-white/70 p-3">
                                <p className="text-sm text-amber-950">Manual Everfit setup</p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                  Current status:{" "}
                                  {manualSetupLabels[
                                    application.coachingProfile.everfitConnectionStatus
                                  ] || application.coachingProfile.everfitConnectionStatus}
                                </p>
                                <div className="mt-3 grid gap-2">
                                  {Object.entries(manualSetupLabels).map(([value, label]) => (
                                    <Button
                                      key={value}
                                      size="sm"
                                      variant={
                                        application.coachingProfile?.everfitConnectionStatus ===
                                        value
                                          ? "default"
                                          : "outline"
                                      }
                                      disabled={savingId === application.id}
                                      onClick={() =>
                                        void updateManualSetupStatus(application, value)
                                      }
                                    >
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-md border border-amber-200 bg-white/70 p-3">
                                <p className="text-sm text-amber-950">Package change</p>
                                {application.coachingProfile.pendingPackageChange ? (
                                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                    Pending client confirmation:{" "}
                                    {offerLabels[
                                      application.coachingProfile.pendingPackageChange.toOfferKey
                                    ] ||
                                      application.coachingProfile.pendingPackageChange.toOfferKey}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                    Ask the client to confirm a package move from their coaching
                                    dashboard, or manually apply for pro-bono/manual arrangements.
                                  </p>
                                )}
                                <div className="mt-3 grid gap-2">
                                  <Select
                                    value={packageOfferDrafts[application.id] || ""}
                                    onValueChange={(value) =>
                                      setPackageOfferDrafts((current) => ({
                                        ...current,
                                        [application.id]: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="New package" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {coachingTiers.map((offer) => (
                                        <SelectItem key={offer.id} value={offer.id}>
                                          {offer.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={packageModeDrafts[application.id] || "next_invoice"}
                                    onValueChange={(value) =>
                                      setPackageModeDrafts((current) => ({
                                        ...current,
                                        [application.id]: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Timing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(packageEffectiveModeLabels).map(
                                        ([value, label]) => (
                                          <SelectItem key={value} value={value}>
                                            {label}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Textarea
                                    value={packageNoteDrafts[application.id] || ""}
                                    rows={3}
                                    onChange={(event) =>
                                      setPackageNoteDrafts((current) => ({
                                        ...current,
                                        [application.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Optional note shown in the package-change email."
                                  />
                                  <Button
                                    size="sm"
                                    disabled={savingId === application.id}
                                    onClick={() => void requestPackageChange(application)}
                                  >
                                    Request client confirmation
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={savingId === application.id}
                                    onClick={() => void requestPackageChange(application, true)}
                                  >
                                    Manually apply without client confirmation
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          <p className="text-sm text-amber-950">Cancel coaching billing</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            Uses the agreed notice structure: the next Stripe payment is still taken
                            and becomes the client's final coaching payment.
                          </p>
                          <Button
                            className="mt-3 w-full"
                            variant="outline"
                            disabled={cancellingUserId === application.userId}
                            onClick={() => void scheduleClientCancellation(application)}
                          >
                            {cancellingUserId === application.userId
                              ? "Scheduling..."
                              : "Schedule final payment cancellation"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && tabbedApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No {activeTabLabel} match the current tier filter.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}

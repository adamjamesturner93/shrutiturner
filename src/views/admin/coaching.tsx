"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Filter,
  Mail,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminCoachingApplicationDto } from "@/lib/api/types";
import type { ApiSuccess } from "@/lib/api/route";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { activeCoachingTiers, coachingTiers } from "@/data/marketing";

const tierLabels: Record<string, string> = {
  personal_programme: "Monthly Support",
  coached_plan: "Weekly Support",
  coaching: "1:1 Coaching",
  unsure: "To be recommended",
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
  support: "What they would like support with",
  movement: "Current movement or training",
  context: "Health, body or circumstances",
  outcome: "What they want from coaching",
  extra: "Anything else",
  referral: "How they heard about Shruti",
};

type CoachingPipelineTab = "new" | "consultations" | "waitlist" | "payment" | "clients" | "closed";

const pipelineTabs: Array<{ value: CoachingPipelineTab; label: string }> = [
  { value: "new", label: "New enquiries" },
  { value: "consultations", label: "Consultations" },
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

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function todayForDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved" || status === "offer_sent" || status === "converted") return "default";
  if (status === "declined") return "destructive";
  if (status === "follow_up_needed" || status === "withdrawn") return "outline";
  return "secondary";
}

function matchesPipelineTab(application: AdminCoachingApplicationDto, tab: CoachingPipelineTab) {
  if (tab === "new") {
    return ["submitted", "under_review", "follow_up_needed"].includes(application.status);
  }
  if (tab === "consultations") {
    return ["consultation_scheduled", "consultation_completed"].includes(application.status);
  }
  if (tab === "waitlist") return application.status === "waitlisted";
  if (tab === "payment") return ["approved", "offer_sent"].includes(application.status);
  if (tab === "clients") {
    return application.status === "converted" || Boolean(application.coachingProfile);
  }
  return application.status === "declined" || application.status === "withdrawn";
}

function pipelineTabForApplication(application: AdminCoachingApplicationDto): CoachingPipelineTab {
  return pipelineTabs.find((tab) => matchesPipelineTab(application, tab.value))?.value || "new";
}

const billingPhaseLabels: Record<string, string> = {
  active: "Billing active",
  cancellation_scheduled: "Cancellation scheduled",
  final_month: "Final month",
  completed: "Billing completed",
  payment_problem: "Payment needs attention",
};

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
  if (application.status === "submitted" || application.status === "under_review") {
    return "Review the enquiry, arrange the consultation and record its date here.";
  }
  if (application.status === "follow_up_needed") {
    return "Send follow-up questions before approving or declining.";
  }
  if (application.status === "consultation_scheduled") {
    return "The consultation is scheduled. After the call, mark it complete and record private notes.";
  }
  if (application.status === "consultation_completed") {
    return "Choose the recommended support level, add the client-facing recommendation and send the offer.";
  }
  if (application.status === "waitlisted") {
    return "Applicant is waiting for coaching capacity. Approve from the waiting list when a place opens, or reject if it is no longer a fit.";
  }
  if (application.status === "approved" || application.status === "offer_sent") {
    return application.userId
      ? "The recommendation is sent. The client can accept the agreements and complete payment."
      : "The recommendation is sent. The client now needs to create or sign in to their account with this email before accepting agreements and paying.";
  }
  if (application.status === "converted" || application.isLinkedUserCoachingClient) {
    return "Client is active. Track manual Everfit setup, onboarding and check-ins from the coaching profile.";
  }
  if (application.status === "declined") {
    return "Enquiry is declined. Keep internal notes clear for future context.";
  }
  if (application.status === "withdrawn") {
    return "Enquirer left the waiting list. Reopen only if Shruti wants to restore the original enquiry context.";
  }
  return "Review the current status and choose the next admin action.";
}

export function AdminCoaching({
  initialData,
}: {
  initialData?: AdminCoachingApplicationDto[] | null;
}) {
  const searchParams = useSearchParams();
  const selectedApplicationId = searchParams.get("application");
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
  const [endRenewalApplication, setEndRenewalApplication] =
    useState<AdminCoachingApplicationDto | null>(null);
  const [endRenewalReason, setEndRenewalReason] = useState("");
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});
  const [packageOfferDrafts, setPackageOfferDrafts] = useState<Record<string, string>>({});
  const [packageModeDrafts, setPackageModeDrafts] = useState<Record<string, string>>({});
  const [packageNoteDrafts, setPackageNoteDrafts] = useState<Record<string, string>>({});
  const [paidStartDateDrafts, setPaidStartDateDrafts] = useState<Record<string, string>>({});
  const [consultationDateDrafts, setConsultationDateDrafts] = useState<Record<string, string>>({});
  const [consultationNotesDrafts, setConsultationNotesDrafts] = useState<Record<string, string>>(
    {}
  );
  const [recommendationDrafts, setRecommendationDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const knownApplicationIds = useRef(new Set<string>());
  const [openApplicationIds, setOpenApplicationIds] = useState<Set<string>>(new Set());
  const [openClientManagementIds, setOpenClientManagementIds] = useState<Set<string>>(new Set());

  const syncPanelDefaults = (rows: AdminCoachingApplicationDto[]) => {
    const newRows = rows.filter((row) => !knownApplicationIds.current.has(row.id));
    if (newRows.length === 0) return;
    newRows.forEach((row) => knownApplicationIds.current.add(row.id));
    setOpenApplicationIds((current) => {
      const next = new Set(current);
      newRows.filter((row) => row.todos.length > 0).forEach((row) => next.add(row.id));
      return next;
    });
    setOpenClientManagementIds((current) => {
      const next = new Set(current);
      newRows
        .filter((row) =>
          row.todos.some((todo) =>
            [
              "everfit_setup",
              "everfit_attention",
              "billing_attention",
              "final_month_handover",
              "close_everfit",
            ].includes(todo.kind)
          )
        )
        .forEach((row) => next.add(row.id));
      return next;
    });
  };

  const syncDrafts = (rows: AdminCoachingApplicationDto[]) => {
    syncPanelDefaults(rows);
    setNotesDrafts(Object.fromEntries(rows.map((row) => [row.id, row.adminNotes || ""])));
    setDecisionDrafts(Object.fromEntries(rows.map((row) => [row.id, row.decisionReason || ""])));
    setConsultationDateDrafts(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          row.consultationScheduledAt
            ? new Date(row.consultationScheduledAt).toISOString().slice(0, 16)
            : "",
        ])
      )
    );
    setConsultationNotesDrafts(
      Object.fromEntries(rows.map((row) => [row.id, row.consultationNotes || ""]))
    );
    setRecommendationDrafts(Object.fromEntries(rows.map((row) => [row.id, row.offerKey || ""])));
    setPackageOfferDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || ""])),
    }));
    setPackageModeDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || "next_invoice"])),
    }));
    setPackageNoteDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || ""])),
    }));
    setPaidStartDateDrafts((current) => ({
      ...Object.fromEntries(rows.map((row) => [row.id, current[row.id] || todayForDateInput()])),
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
      if (!response.ok) throw new Error("Failed to load coaching enquiries.");
      const payload = (await response.json()) as AdminCoachingApplicationDto[];
      setApplications(payload);
      syncDrafts(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load coaching enquiries."
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

  useEffect(() => {
    if (!selectedApplicationId) return;
    const selected = applications.find((application) => application.id === selectedApplicationId);
    if (selected) {
      setActiveTab(pipelineTabForApplication(selected));
      setOpenApplicationIds((current) => new Set(current).add(selected.id));
    }
  }, [applications, selectedApplicationId]);

  const summary = useMemo(() => {
    const submitted = applications.filter((row) => row.status === "submitted").length;
    const underReview = applications.filter((row) => row.status === "under_review").length;
    const waitlisted = applications.filter((row) => row.status === "waitlisted").length;
    const awaitingPayment = applications.filter((row) =>
      ["approved", "offer_sent"].includes(row.status)
    ).length;
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
    "selected enquiries";

  const saveApplication = async (input: {
    id: string;
    status?: string;
    convertToClient?: boolean;
    consultationStatus?: string;
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
          consultationStatus: input.consultationStatus,
          consultationScheduledAt: consultationDateDrafts[input.id]
            ? new Date(consultationDateDrafts[input.id]).toISOString()
            : null,
          consultationNotes: consultationNotesDrafts[input.id],
          recommendedOfferKey: recommendationDrafts[input.id] || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update coaching enquiry.");
      }
      await loadApplications();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update coaching enquiry."
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
        "Confirm again: this bypasses Stripe and client confirmation. Use it only when Shruti has agreed to handle this paid client's package change manually."
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

  const requestPaidStart = async (application: AdminCoachingApplicationDto) => {
    if (!application.coachingProfile) return;
    const toOfferKey = packageOfferDrafts[application.id];
    const billingStartsOn = paidStartDateDrafts[application.id];
    if (!toOfferKey || !billingStartsOn) {
      setError("Choose the paid plan and billing start date first.");
      return;
    }

    setSavingId(application.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/paid-starts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: application.coachingProfile.id,
          toOfferKey,
          billingStartsOn,
          note: packageNoteDrafts[application.id],
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create the paid plan invitation.");
      }
      setNotice(`${application.applicantName} was emailed to set up their paid plan.`);
      await loadApplications();
    } catch (paidStartError) {
      setError(
        paidStartError instanceof Error
          ? paidStartError.message
          : "Failed to create the paid plan invitation."
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
      await loadApplications();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Failed to schedule cancellation."
      );
    } finally {
      setCancellingUserId(null);
    }
  };

  const stopFuturePayments = async () => {
    const application = endRenewalApplication;
    if (!application?.userId || endRenewalReason.trim().length < 5) return;

    setCancellingUserId(application.userId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/coaching/subscriptions/end-current-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: application.userId,
          reason: endRenewalReason.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Partial<ApiSuccess<{ endsAt: string }>> & {
            error?: { message?: string };
            message?: string;
          })
        | null;
      if (!response.ok || !payload?.data?.endsAt) {
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to stop future payments."
        );
      }
      setNotice(
        `${application.applicantName}'s future coaching payments have been stopped. Their paid access continues until ${formatDateTime(payload.data.endsAt)}.`
      );
      setEndRenewalApplication(null);
      setEndRenewalReason("");
      await loadApplications();
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : "Failed to stop future payments.");
    } finally {
      setCancellingUserId(null);
    }
  };

  return (
    <AdminLayout title="Coaching - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Coaching pipeline"
          title="Coaching Enquiries"
          description="Review enquiries, track consultations, recommend support and manage active coaching clients."
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
            detail="recommendation sent"
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
          <p className="text-muted-foreground text-sm">Loading coaching enquiries...</p>
        ) : null}

        <div className="space-y-4">
          {tabbedApplications.map((application) => (
            <details
              key={application.id}
              className="group bg-card text-card-foreground rounded-xl border"
              open={openApplicationIds.has(application.id)}
              onToggle={(event) => {
                const isOpen = event.currentTarget.open;
                setOpenApplicationIds((current) => {
                  const next = new Set(current);
                  if (isOpen) next.add(application.id);
                  else next.delete(application.id);
                  return next;
                });
              }}
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-lg">{application.applicantName}</CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {application.applicantEmail}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {application.status !== "converted" ? (
                          <Badge variant={badgeVariant(application.status)}>
                            {application.status.replaceAll("_", " ")}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          {application.offerKey
                            ? offerLabels[application.offerKey]
                            : tierLabels[application.tier] || application.tier}
                        </Badge>
                        {application.coachingProfile?.billingArrangement === "pro_bono" ? (
                          <Badge variant="secondary">Pro bono</Badge>
                        ) : null}
                        {application.coachingProfile?.billingStartsAt ? (
                          <Badge variant="outline">
                            Paid from {formatDateOnly(application.coachingProfile.billingStartsAt)}
                          </Badge>
                        ) : null}
                        {application.isLinkedUserCoachingClient ? (
                          <Badge variant="default">Linked coaching client</Badge>
                        ) : null}
                        {!application.userId ? (
                          <Badge variant="outline">No linked account</Badge>
                        ) : null}
                        {application.coachingProfile &&
                        application.coachingProfile.billingPhase !== "not_configured" ? (
                          <Badge
                            variant={
                              application.coachingProfile.billingPhase === "payment_problem"
                                ? "destructive"
                                : application.coachingProfile.billingPhase === "final_month"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {billingPhaseLabels[application.coachingProfile.billingPhase]}
                          </Badge>
                        ) : null}
                        {application.todos.map((todo) => (
                          <Badge
                            key={todo.id}
                            variant={todo.priority === "overdue" ? "destructive" : "secondary"}
                            className="gap-1"
                          >
                            {todo.priority === "overdue" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : null}
                            TODO: {todo.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-muted-foreground flex items-start gap-3 text-sm md:text-right">
                      <div>
                        <p>Submitted {formatDateTime(application.createdAt)}</p>
                        {application.reviewedAt ? (
                          <p className="mt-1">Reviewed {formatDateTime(application.reviewedAt)}</p>
                        ) : null}
                        {application.waitlistedAt ? (
                          <p className="mt-1">
                            Waitlisted {formatDateTime(application.waitlistedAt)}
                          </p>
                        ) : null}
                        {application.waitlistLeftAt ? (
                          <p className="mt-1">
                            Left waitlist {formatDateTime(application.waitlistLeftAt)}
                          </p>
                        ) : null}
                        {application.consultationScheduledAt ? (
                          <p className="mt-1">
                            Consultation {formatDateTime(application.consultationScheduledAt)}
                          </p>
                        ) : null}
                      </div>
                      <ChevronDown className="mt-1 h-5 w-5 transition-transform group-open:rotate-180" />
                    </div>
                  </div>
                </CardHeader>
              </summary>
              <CardContent className="space-y-5 border-t pt-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Enquiry answers
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

                    <details
                      className="rounded-lg border p-4"
                      open={application.consultationStatus !== "completed" ? true : undefined}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <span className="text-muted-foreground text-xs tracking-wide uppercase">
                          {application.consultationStatus === "completed"
                            ? `Consultation complete${application.consultationCompletedAt ? ` · ${formatDateTime(application.consultationCompletedAt)}` : ""}`
                            : "Consultation"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {application.consultationStatus === "completed"
                            ? application.consultationNotes
                              ? "Notes recorded · Edit"
                              : "Add notes"
                            : "Schedule and record"}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        <Input
                          type="datetime-local"
                          value={consultationDateDrafts[application.id] || ""}
                          onChange={(event) =>
                            setConsultationDateDrafts((current) => ({
                              ...current,
                              [application.id]: event.target.value,
                            }))
                          }
                          aria-label={`Consultation date for ${application.applicantName}`}
                        />
                        <Textarea
                          aria-label={`Private consultation notes for ${application.applicantName}`}
                          value={consultationNotesDrafts[application.id] || ""}
                          rows={4}
                          onChange={(event) =>
                            setConsultationNotesDrafts((current) => ({
                              ...current,
                              [application.id]: event.target.value,
                            }))
                          }
                          placeholder="Private consultation notes."
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            variant="outline"
                            disabled={
                              savingId === application.id || !consultationDateDrafts[application.id]
                            }
                            onClick={() =>
                              void saveApplication({
                                id: application.id,
                                status: "consultation_scheduled",
                                consultationStatus: "scheduled",
                              })
                            }
                          >
                            Mark scheduled
                          </Button>
                          <Button
                            variant="outline"
                            disabled={savingId === application.id}
                            onClick={() =>
                              void saveApplication({
                                id: application.id,
                                status: "consultation_completed",
                                consultationStatus: "completed",
                              })
                            }
                          >
                            Mark completed
                          </Button>
                        </div>
                      </div>
                    </details>

                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Recommended support
                      </p>
                      <Select
                        value={recommendationDrafts[application.id] || ""}
                        onValueChange={(value) =>
                          setRecommendationDrafts((current) => ({
                            ...current,
                            [application.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          aria-label={`Recommended support for ${application.applicantName}`}
                        >
                          <SelectValue placeholder="Choose a support level" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCoachingTiers.map((offer) => (
                            <SelectItem key={offer.id} value={offer.id}>
                              {offer.name} · {offer.priceLabel}
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

                    <details className="rounded-lg border p-4">
                      <summary className="text-muted-foreground cursor-pointer list-none text-xs tracking-wide uppercase [&::-webkit-details-marker]:hidden">
                        Client-facing decision note
                        {decisionDrafts[application.id]?.trim() ? " · Added" : " · Not added"}
                      </summary>
                      <Textarea
                        className="mt-3"
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
                    </details>

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

                      {application.status === "consultation_completed" ? (
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

                      {application.status === "consultation_completed" ||
                      application.status === "waitlisted" ? (
                        <>
                          <Button
                            disabled={savingId === application.id}
                            onClick={() =>
                              void saveApplication({ id: application.id, status: "offer_sent" })
                            }
                          >
                            {application.status === "waitlisted"
                              ? "Send offer from waiting list"
                              : "Send recommendation"}
                          </Button>
                          <Button
                            disabled={savingId === application.id}
                            onClick={() =>
                              void saveApplication({ id: application.id, status: "declined" })
                            }
                            variant="outline"
                          >
                            Decline enquiry
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

                      {application.status === "approved" || application.status === "offer_sent" ? (
                        <div className="text-muted-foreground space-y-3 rounded-lg border p-3 text-xs leading-relaxed">
                          <p>
                            Recommendation sent and awaiting client agreements and payment. A
                            reminder links them back to the website so everything stays attached to
                            their account.
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

                      {application.status === "consultation_completed" ||
                      application.status === "approved" ||
                      application.status === "offer_sent" ||
                      application.status === "waitlisted" ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm text-amber-950">Start pro-bono support</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            This bypasses Stripe and creates a pro-bono coaching arrangement. The
                            client receives a confirmation email. Use only when no payment should be
                            collected.
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
                            Start pro-bono support
                          </Button>
                        </div>
                      ) : null}

                      {application.userId && application.isLinkedUserCoachingClient ? (
                        <details
                          className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                          open={openClientManagementIds.has(application.id)}
                          onToggle={(event) => {
                            const isOpen = event.currentTarget.open;
                            setOpenClientManagementIds((current) => {
                              const next = new Set(current);
                              if (isOpen) next.add(application.id);
                              else next.delete(application.id);
                              return next;
                            });
                          }}
                        >
                          <summary className="cursor-pointer list-none text-sm font-medium text-amber-950 [&::-webkit-details-marker]:hidden">
                            Client management
                            {application.coachingProfile
                              ? ` · ${profileStatusLabels[application.coachingProfile.status] || application.coachingProfile.status}`
                              : ""}
                          </summary>
                          <div className="mt-4">
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
                                            value as
                                              | "onboarding"
                                              | "active"
                                              | "paused"
                                              | "completed"
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

                                {application.coachingProfile.billingArrangement === "pro_bono" ? (
                                  <div className="rounded-md border border-amber-200 bg-white/70 p-3">
                                    <p className="text-sm text-amber-950">
                                      {application.coachingProfile.billingStartsAt
                                        ? "Paid plan scheduled"
                                        : "Move to a paid plan"}
                                    </p>
                                    {application.coachingProfile.billingStartsAt ? (
                                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Stripe setup is complete. Pro-bono support continues until{" "}
                                        {formatDateOnly(
                                          application.coachingProfile.billingStartsAt
                                        )}
                                        , when the first paid billing period begins.
                                      </p>
                                    ) : application.coachingProfile.pendingPackageChange
                                        ?.requestType === "paid_start" ? (
                                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Payment setup requested for{" "}
                                        {offerLabels[
                                          application.coachingProfile.pendingPackageChange
                                            .toOfferKey
                                        ] ||
                                          application.coachingProfile.pendingPackageChange
                                            .toOfferKey}
                                        . Billing is scheduled to start{" "}
                                        {application.coachingProfile.pendingPackageChange
                                          .billingStartsAt
                                          ? formatDateOnly(
                                              application.coachingProfile.pendingPackageChange
                                                .billingStartsAt
                                            )
                                          : "on the agreed date"}
                                        .
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Choose the paid plan and the date billing should start. The
                                        client will receive an email and complete Stripe setup from
                                        their coaching dashboard.
                                      </p>
                                    )}
                                    {!application.coachingProfile.billingStartsAt ? (
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
                                            <SelectValue placeholder="Paid plan" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {activeCoachingTiers.map((offer) => (
                                              <SelectItem key={offer.id} value={offer.id}>
                                                {offer.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <div>
                                          <label
                                            className="mb-1 block text-xs text-amber-900"
                                            htmlFor={`paid-start-${application.id}`}
                                          >
                                            Billing start date
                                          </label>
                                          <Input
                                            id={`paid-start-${application.id}`}
                                            type="date"
                                            min={todayForDateInput()}
                                            value={paidStartDateDrafts[application.id] || ""}
                                            onChange={(event) =>
                                              setPaidStartDateDrafts((current) => ({
                                                ...current,
                                                [application.id]: event.target.value,
                                              }))
                                            }
                                          />
                                        </div>
                                        <Textarea
                                          value={packageNoteDrafts[application.id] || ""}
                                          rows={3}
                                          onChange={(event) =>
                                            setPackageNoteDrafts((current) => ({
                                              ...current,
                                              [application.id]: event.target.value,
                                            }))
                                          }
                                          placeholder="Optional note shown in the paid-plan email."
                                        />
                                        <Button
                                          size="sm"
                                          disabled={savingId === application.id}
                                          onClick={() => void requestPaidStart(application)}
                                        >
                                          <CreditCard className="mr-2 h-4 w-4" />
                                          Email paid-plan setup
                                        </Button>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="rounded-md border border-amber-200 bg-white/70 p-3">
                                    <p className="text-sm text-amber-950">Package change</p>
                                    {application.coachingProfile.pendingPackageChange ? (
                                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Pending client confirmation:{" "}
                                        {offerLabels[
                                          application.coachingProfile.pendingPackageChange
                                            .toOfferKey
                                        ] ||
                                          application.coachingProfile.pendingPackageChange
                                            .toOfferKey}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Ask the client to confirm a package move from their coaching
                                        dashboard.
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
                                          {activeCoachingTiers.map((offer) => (
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
                                )}
                              </div>
                            ) : null}
                            {application.coachingProfile?.billingArrangement === "paid" ||
                            application.coachingProfile?.billingStartsAt ? (
                              <>
                                {application.coachingProfile.billingPhase !== "active" ? (
                                  <div className="mb-3 rounded-md border border-amber-300 bg-white/70 p-3 text-xs leading-relaxed text-amber-900">
                                    <p className="font-medium">
                                      {billingPhaseLabels[
                                        application.coachingProfile.billingPhase
                                      ] || application.coachingProfile.billingPhase}
                                    </p>
                                    {application.coachingProfile.billingEndsAt ? (
                                      <p className="mt-1">
                                        Coaching is due to end{" "}
                                        {formatDateTime(application.coachingProfile.billingEndsAt)}.
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                                <p className="text-sm text-amber-950">Cancel coaching billing</p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                  Uses the agreed notice structure: the next Stripe payment is still
                                  taken and becomes the client's final coaching payment.
                                </p>
                                <Button
                                  className="mt-3 w-full"
                                  variant="outline"
                                  disabled={
                                    cancellingUserId === application.userId ||
                                    application.coachingProfile.billingPhase !== "active"
                                  }
                                  onClick={() => void scheduleClientCancellation(application)}
                                >
                                  {cancellingUserId === application.userId
                                    ? "Scheduling..."
                                    : "Schedule final payment cancellation"}
                                </Button>
                                <Button
                                  className="mt-2 w-full border-red-300 text-red-800 hover:bg-red-50"
                                  variant="outline"
                                  disabled={
                                    cancellingUserId === application.userId ||
                                    application.coachingProfile.billingPhase !== "active"
                                  }
                                  onClick={() => {
                                    setEndRenewalReason("");
                                    setEndRenewalApplication(application);
                                  }}
                                >
                                  Stop future payments now
                                </Button>
                                <p className="mt-2 text-xs leading-relaxed text-amber-800">
                                  Admin override: collects no further payments and leaves access in
                                  place until the end of the period already paid for. It does not
                                  refund an existing payment.
                                </p>
                              </>
                            ) : null}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </details>
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

      <Dialog
        open={Boolean(endRenewalApplication)}
        onOpenChange={(open) => {
          if (!open && !cancellingUserId) {
            setEndRenewalApplication(null);
            setEndRenewalReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop future coaching payments?</DialogTitle>
            <DialogDescription>
              {endRenewalApplication
                ? `${endRenewalApplication.applicantName} will not be charged again. Their access remains available until the end of the period already paid for.`
                : "The client will not be charged again."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-900">
              This does not refund payments already collected. The action is recorded in the admin
              audit log and the client receives a confirmation email.
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="end-renewal-reason">
                Reason for override
              </label>
              <Textarea
                id="end-renewal-reason"
                value={endRenewalReason}
                onChange={(event) => setEndRenewalReason(event.target.value)}
                rows={3}
                placeholder="For example: agreed exception due to a change in circumstances."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={Boolean(cancellingUserId)}
              onClick={() => setEndRenewalApplication(null)}
            >
              Keep billing active
            </Button>
            <Button
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={Boolean(cancellingUserId) || endRenewalReason.trim().length < 5}
              onClick={() => void stopFuturePayments()}
            >
              {cancellingUserId ? "Stopping payments..." : "Confirm and stop future payments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  CreditCard,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CoachingPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";
import { LegalAcceptanceChecklist } from "@/components/legal-acceptance-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CoachingDashboardDto } from "@/lib/api/types";
import type { ApiSuccess } from "@/lib/api/route";
import type { AcceptanceRequirementState } from "@/lib/legal/acceptance-service";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { useAuth } from "@/context/auth-context";
import { allCoachingTiers } from "@/data/marketing";

const tierLabels: Record<string, string> = {
  personal_programme: "Monthly Support",
  coached_plan: "Weekly Support",
  coaching: "1:1 Coaching",
  unsure: "To be recommended",
};

const offerLabels = Object.fromEntries(allCoachingTiers.map((offer) => [offer.id, offer.name]));
const offerPrices = Object.fromEntries(
  allCoachingTiers.map((offer) => [offer.id, offer.priceLabel])
);

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  follow_up_needed: "Follow-up needed",
  consultation_scheduled: "Consultation scheduled",
  consultation_completed: "Consultation completed",
  offer_sent: "Recommendation ready",
  waitlisted: "Waiting list",
  approved: "Approved",
  declined: "Declined",
  converted: "Active",
  withdrawn: "Withdrawn",
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  application_pending: "Enquiry in progress",
  not_a_client: "Not a client",
};

const everfitLabels: Record<string, string> = {
  not_started: "Not started",
  invite_sent: "Invite sent",
  connected: "Active",
  sync_issue: "Needs attention",
  closed: "Access closed",
};

const billingPhaseLabels: Record<string, string> = {
  active: "Billing active",
  cancellation_scheduled: "Cancellation scheduled",
  final_month: "Final month",
  completed: "Coaching completed",
  payment_problem: "Payment needs attention",
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

function formatDateOnly(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(pence / 100);
}

function statusVariant(value: string): "default" | "secondary" | "outline" | "destructive" {
  if (value === "declined" || value === "sync_issue") return "destructive";
  if (value === "active" || value === "connected" || value === "approved" || value === "offer_sent")
    return "default";
  if (value === "paused" || value === "completed") return "outline";
  return "secondary";
}

export function DashboardCoaching({ initialData }: { initialData?: CoachingDashboardDto | null }) {
  const searchParams = useSearchParams();
  const { refreshAccountProfile } = useAuth();
  const [data, setData] = useState<CoachingDashboardDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingLegalAcceptances, setPendingLegalAcceptances] = useState<
    AcceptanceRequirementState[]
  >([]);
  const [pendingLegalAction, setPendingLegalAction] = useState<
    "coaching_checkout" | "package_change" | null
  >(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [packageChangeLoading, setPackageChangeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [leaveWaitlistLoading, setLeaveWaitlistLoading] = useState(false);
  const [showLeaveWaitlistDialog, setShowLeaveWaitlistDialog] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{
    nextPaymentAt: string;
    endsAt: string;
  } | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<{
    status: "paid" | "processing" | "open";
    amountPence: number | null;
    currency: string | null;
    invoiceUrl: string | null;
  } | null>(null);
  const [checkoutReturnLoading, setCheckoutReturnLoading] = useState(false);

  const reloadCoaching = useCallback(async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/coaching", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load coaching.");
      const payload = (await response.json()) as ApiSuccess<CoachingDashboardDto>;
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load coaching.");
    } finally {
      if (options?.showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!initialData) setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/me/coaching", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load coaching.");
        const payload = (await response.json()) as ApiSuccess<CoachingDashboardDto>;
        if (active) setData(payload.data);
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

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void reloadCoaching();
    };
    const refreshOnFocus = () => void reloadCoaching();

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [reloadCoaching]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout !== "success" || !sessionId) return;

    let active = true;
    let attempts = 0;
    const verifyCheckout = async () => {
      attempts += 1;
      if (active) setCheckoutReturnLoading(true);
      try {
        const response = await fetch(
          `/api/me/coaching/checkout-status?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("We could not verify the payment yet.");
        const payload = (await response.json()) as ApiSuccess<{
          status: "paid" | "processing" | "open";
          amountPence: number | null;
          currency: string | null;
          invoiceUrl: string | null;
        }>;
        if (!active) return;
        setCheckoutReturn(payload.data);
        if (payload.data.status === "paid") {
          await reloadCoaching();
          return;
        }
      } catch {
        // Stripe webhooks can land a few seconds after the browser returns.
      } finally {
        if (active) setCheckoutReturnLoading(false);
      }
      if (active && attempts < 4) window.setTimeout(() => void verifyCheckout(), 2000);
    };

    void verifyCheckout();
    return () => {
      active = false;
    };
  }, [reloadCoaching, searchParams]);

  const recommendedOffer = useMemo(
    () => allCoachingTiers.find((offer) => offer.id === data?.application?.offerKey) || null,
    [data?.application?.offerKey]
  );
  const isRecommendationReady = Boolean(
    data?.application &&
    ["approved", "offer_sent"].includes(data.application.status) &&
    recommendedOffer
  );

  const nextAction = useMemo(() => {
    if (!data) return null;
    if (data.state === "not_a_client") {
      return {
        title: "Choose your next step",
        body: "Explore coaching options or start a conversation when you are ready.",
        primaryHref: "/coaching",
        primaryLabel: "Explore Coaching",
        secondaryHref: "/coaching/enquire",
        secondaryLabel: "Enquire",
      };
    }
    if (
      (data.state === "application_pending" ||
        data.state === "waitlisted" ||
        data.state === "withdrawn") &&
      data.application
    ) {
      if (data.application.status === "approved" || data.application.status === "offer_sent") {
        return {
          title: "Your coaching recommendation is ready",
          body: data.application.offerKey
            ? `Shruti recommends ${offerLabels[data.application.offerKey]} at ${offerPrices[data.application.offerKey]}. Review the agreements and complete payment when you are ready.`
            : "Review the recommendation and complete the agreements and payment when you are ready.",
          primaryHref: "",
          primaryLabel: "Start Coaching Payment",
          secondaryHref: "/contact",
          secondaryLabel: "Ask a Question",
        };
      }
      if (data.application.status === "consultation_scheduled") {
        return {
          title: "Your consultation is scheduled",
          body: data.application.consultationScheduledAt
            ? `Your consultation is booked for ${formatDateTime(data.application.consultationScheduledAt)}.`
            : "Your consultation has been arranged with Shruti.",
          primaryHref: "/dashboard/coaching",
          primaryLabel: "View Enquiry",
          secondaryHref: "/contact",
          secondaryLabel: "Ask a Question",
        };
      }
      if (data.application.status === "waitlisted") {
        const waitlistedAt = formatDateTime(data.application.waitlistedAt);
        return {
          title: "You are on the waiting list",
          body: waitlistedAt
            ? `You joined the coaching waiting list on ${waitlistedAt}. No payment is due until Shruti offers you a place.`
            : "You are on the coaching waiting list. No payment is due until Shruti offers you a place.",
          primaryHref: "",
          primaryLabel: "Leave Waiting List",
          secondaryHref: "/contact",
          secondaryLabel: "Ask a Question",
        };
      }
      if (data.application.status === "declined") {
        return {
          title: "Enquiry reviewed",
          body:
            data.application.decisionReason ||
            "Shruti has reviewed your enquiry and coaching is not the right fit at the moment.",
          primaryHref: "/coaching",
          primaryLabel: "Explore Coaching",
          secondaryHref: "/contact",
          secondaryLabel: "Ask a Question",
        };
      }
      if (data.application.status === "withdrawn") {
        return {
          title: "You left the waiting list",
          body: "You are no longer holding a waiting-list place. If you enquire again later, the new enquiry joins the end of the list.",
          primaryHref: "/coaching/enquire",
          primaryLabel: "Enquire Again",
          secondaryHref: "/contact",
          secondaryLabel: "Ask a Question",
        };
      }
      return {
        title: "Enquiry in progress",
        body: "Shruti has your enquiry and will keep you updated as you arrange and complete your consultation.",
        primaryHref: "/coaching/enquire",
        primaryLabel: "Review What You Sent",
        secondaryHref: "/contact",
        secondaryLabel: "Ask a Question",
      };
    }
    return {
      title: "Continue your coaching journey",
      body: "Use your dashboard to keep track of onboarding, billing and manual Everfit setup.",
      primaryHref: "/dashboard/coaching",
      primaryLabel: "Refresh Coaching Status",
      secondaryHref: "/contact",
      secondaryLabel: "Contact Shruti",
    };
  }, [data]);

  const requestCoachingCheckout = async () => {
    if (!data?.application?.id) return;
    const response = await fetch("/api/me/coaching/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: data.application.id }),
    });
    const payload = (await response.json().catch(() => null)) as {
      checkoutUrl?: string;
      message?: string;
      details?: { requiredAcceptances?: AcceptanceRequirementState[] };
    } | null;
    if (!response.ok || !payload?.checkoutUrl) {
      const requiredAcceptances = payload?.details?.requiredAcceptances || [];
      if (
        response.status === 409 &&
        requiredAcceptances.some(
          (item) =>
            item.type === "terms" ||
            item.type === "health_waiver" ||
            item.type === "coaching_agreement"
        )
      ) {
        setPendingLegalAcceptances(requiredAcceptances);
        setPendingLegalAction("coaching_checkout");
        throw new Error(
          "Updated legal agreements are required before coaching payment. Review them below, then continue again."
        );
      }
      throw new Error(payload?.message || "Failed to start coaching payment.");
    }
    return payload.checkoutUrl;
  };

  const startCoachingCheckout = async () => {
    if (!data?.application?.id) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const checkoutUrl = await requestCoachingCheckout();
      if (!checkoutUrl) throw new Error("Failed to start coaching payment.");
      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Failed to start coaching payment."
      );
      setCheckoutLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setBillingLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/dashboard/coaching" }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { portalUrl?: string };
        portalUrl?: string;
        error?: { message?: string };
        message?: string;
      } | null;
      const portalUrl = payload?.data?.portalUrl || payload?.portalUrl;
      if (!response.ok || !portalUrl) {
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to open billing portal."
        );
      }
      window.location.href = portalUrl;
    } catch (billingError) {
      setError(billingError instanceof Error ? billingError.message : "Failed to open billing.");
      setBillingLoading(false);
    }
  };

  const scheduleCoachingCancellation = async () => {
    setCancelLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/coaching/cancel", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { nextPaymentAt?: string; endsAt?: string };
        error?: { message?: string };
        message?: string;
      } | null;
      if (!response.ok || !payload?.data?.nextPaymentAt || !payload.data.endsAt) {
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to schedule cancellation."
        );
      }
      setCancellationResult({
        nextPaymentAt: payload.data.nextPaymentAt,
        endsAt: payload.data.endsAt,
      });
      setShowCancelDialog(false);
      await reloadCoaching();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Failed to schedule cancellation."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const confirmPackageChange = async () => {
    const requestId = data?.profile?.pendingPackageChange?.id;
    if (!requestId) return;
    setPackageChangeLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/coaching/package-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageChangeRequestId: requestId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: { tier?: string; offerKey?: string; checkoutUrl?: string };
        error?: {
          message?: string;
          details?: { requiredAcceptances?: AcceptanceRequirementState[] };
        };
        message?: string;
        details?: { requiredAcceptances?: AcceptanceRequirementState[] };
      } | null;
      if (!response.ok || !payload?.success) {
        const requiredAcceptances =
          payload?.error?.details?.requiredAcceptances ||
          payload?.details?.requiredAcceptances ||
          [];
        if (
          response.status === 409 &&
          requiredAcceptances.some(
            (item) =>
              item.type === "terms" ||
              item.type === "health_waiver" ||
              item.type === "coaching_agreement"
          )
        ) {
          setPendingLegalAcceptances(requiredAcceptances);
          setPendingLegalAction("package_change");
          throw new Error(
            "Updated legal agreements are required before updating your coaching plan. Review them below, then continue again."
          );
        }
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to confirm the coaching update."
        );
      }
      if (payload.data?.checkoutUrl) {
        window.location.assign(payload.data.checkoutUrl);
        return;
      }
      await reloadCoaching();
    } catch (packageError) {
      setError(
        packageError instanceof Error
          ? packageError.message
          : "Failed to confirm the coaching update."
      );
    } finally {
      setPackageChangeLoading(false);
    }
  };

  const leaveCoachingWaitlist = async () => {
    setLeaveWaitlistLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me/coaching/waitlist/leave", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { status?: string; waitlistLeftAt?: string | null };
        error?: { message?: string };
        message?: string;
      } | null;
      if (!response.ok || payload?.data?.status !== "withdrawn") {
        throw new Error(
          payload?.error?.message || payload?.message || "Failed to leave the waiting list."
        );
      }
      setData((current) =>
        current?.application
          ? {
              ...current,
              state: "withdrawn",
              application: {
                ...current.application,
                status: "withdrawn",
                waitlistLeftAt: payload.data?.waitlistLeftAt || new Date().toISOString(),
              },
            }
          : current
      );
      setShowLeaveWaitlistDialog(false);
    } catch (leaveError) {
      setError(
        leaveError instanceof Error ? leaveError.message : "Failed to leave the waiting list."
      );
    } finally {
      setLeaveWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Coaching - Private Studio">
        <LoadingRegion label="Loading coaching">
          <CoachingPageSkeleton />
        </LoadingRegion>
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
          description="Your recommendation, onboarding, billing and next coaching action in one place."
          actions={
            <Badge
              variant={
                data.profile?.billingPhase === "payment_problem"
                  ? "destructive"
                  : statusVariant(data.profile?.status || data.application?.status || data.state)
              }
            >
              {(data.profile?.billingPhase &&
                ["cancellation_scheduled", "final_month", "completed", "payment_problem"].includes(
                  data.profile.billingPhase
                ) &&
                billingPhaseLabels[data.profile.billingPhase]) ||
                statusLabels[data.profile?.status || data.application?.status || data.state] ||
                "Coaching"}
            </Badge>
          }
        />

        {searchParams.get("checkout") === "cancelled" ? (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Payment was cancelled</p>
                <p className="mt-1 text-amber-800">
                  Nothing was charged. Your recommendation is still here when you are ready.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {searchParams.get("checkout") === "success" ? (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {checkoutReturn?.status === "paid"
                    ? "Coaching payment confirmed"
                    : "Your payment is being confirmed"}
                </p>
                <p className="mt-1 text-green-800">
                  {checkoutReturn?.status === "paid"
                    ? `${checkoutReturn.amountPence ? `${formatCurrency(checkoutReturn.amountPence, checkoutReturn.currency || "GBP")} was paid. ` : ""}A confirmation email has been sent to you.`
                    : checkoutReturnLoading
                      ? "Checking the payment with Stripe now."
                      : "Stripe may take a few seconds to update this page. You do not need to pay again."}
                </p>
                {checkoutReturn?.invoiceUrl ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 font-medium underline"
                    href={checkoutReturn.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Stripe invoice <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {isRecommendationReady && recommendedOffer ? (
          <Card className="border-brand-accent/30 bg-brand-accent/5 overflow-hidden">
            <CardHeader className="space-y-3">
              <Badge className="w-fit">Shruti's recommendation</Badge>
              <div>
                <CardTitle className="font-serif text-3xl sm:text-4xl">
                  {recommendedOffer.name}
                </CardTitle>
                <p className="text-muted-foreground mt-2 text-base">
                  {recommendedOffer.tagline} · {recommendedOffer.priceLabel}
                </p>
              </div>
              <p className="max-w-3xl leading-relaxed">
                {data.application?.decisionReason || recommendedOffer.description}
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {recommendedOffer.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Button disabled={checkoutLoading} onClick={() => void startCoachingCheckout()}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {checkoutLoading
                    ? "Opening payment..."
                    : `Review agreements and start ${recommendedOffer.name}`}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Ask Shruti a question</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
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
                label="Enquiry"
                value={data.application ? statusLabels[data.application.status] : "Not submitted"}
                detail={
                  data.application
                    ? data.application.offerKey
                      ? offerLabels[data.application.offerKey]
                      : tierLabels[data.application.tier]
                    : "No coaching enquiry on file"
                }
              />
              <AppMetricCard
                label="Coaching delivery"
                value={
                  data.profile ? everfitLabels[data.profile.everfitConnectionStatus] : "Not started"
                }
                detail="Programmes, check-ins and messages are managed in Everfit"
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
                  ) : data.application?.status === "waitlisted" ? (
                    <Button variant="outline" onClick={() => setShowLeaveWaitlistDialog(true)}>
                      {nextAction?.primaryLabel}
                    </Button>
                  ) : data.application?.status === "approved" ||
                    data.application?.status === "offer_sent" ? (
                    <Button disabled={checkoutLoading} onClick={() => void startCoachingCheckout()}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {checkoutLoading ? "Opening payment..." : nextAction?.primaryLabel}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {pendingLegalAcceptances.length > 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-950">
                Review agreements before continuing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-amber-900">
              <p>
                This coaching action requires current Terms & Conditions, Health & Liability Waiver
                and Coaching Agreement acceptance. Read the linked documents, then continue to
                record your acceptance and finish the action.
              </p>
              <p className="flex flex-wrap gap-3">
                <Link className="underline" href="/terms">
                  Terms & Conditions
                </Link>
                <Link className="underline" href="/health-declaration">
                  Health Declaration
                </Link>
                <Link className="underline" href="/coaching-agreement">
                  Coaching Agreement
                </Link>
              </p>
              <LegalAcceptanceChecklist
                acceptances={pendingLegalAcceptances}
                surface={
                  pendingLegalAction === "package_change"
                    ? "coaching_package_change"
                    : "coaching_checkout"
                }
                busy={checkoutLoading || packageChangeLoading}
                onAccepted={async () => {
                  const action = pendingLegalAction;
                  await refreshAccountProfile();
                  setPendingLegalAcceptances([]);
                  setPendingLegalAction(null);
                  if (action === "package_change") await confirmPackageChange();
                  else await startCoachingCheckout();
                }}
              />
            </CardContent>
          </Card>
        ) : null}

        {data.profile?.pendingPackageChange ? (
          <Card className="border-brand-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="text-brand-accent h-5 w-5" />
                {data.profile.pendingPackageChange.requestType === "paid_start"
                  ? "Set up your paid plan"
                  : "Review package change"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 text-sm leading-relaxed">
                {data.profile.pendingPackageChange.requestType === "paid_start" ? (
                  <>
                    <p>
                      Shruti has invited you to move from pro-bono support to{" "}
                      {offerLabels[data.profile.pendingPackageChange.toOfferKey]}.
                    </p>
                    <p className="text-muted-foreground">
                      Complete the secure Stripe setup now. Billing is scheduled to start on{" "}
                      {formatDateOnly(data.profile.pendingPackageChange.billingStartsAt) ||
                        "the agreed date"}
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Shruti has suggested moving your coaching from{" "}
                      {data.profile.pendingPackageChange.fromOfferKey
                        ? offerLabels[data.profile.pendingPackageChange.fromOfferKey]
                        : tierLabels[data.profile.pendingPackageChange.fromTier]}{" "}
                      to {offerLabels[data.profile.pendingPackageChange.toOfferKey]}.
                    </p>
                    <p className="text-muted-foreground">
                      {data.profile.pendingPackageChange.effectiveMode === "immediate"
                        ? "This change is intended to take effect straight away after confirmation."
                        : "The new Stripe price will apply from your next invoice after confirmation."}
                    </p>
                  </>
                )}
                {data.profile.pendingPackageChange.note ? (
                  <p className="text-muted-foreground">
                    Note from Shruti: {data.profile.pendingPackageChange.note}
                  </p>
                ) : null}
              </div>
              <Button disabled={packageChangeLoading} onClick={() => void confirmPackageChange()}>
                {packageChangeLoading
                  ? "Continuing..."
                  : data.profile.pendingPackageChange.requestType === "paid_start"
                    ? "Set up paid plan"
                    : "Confirm package change"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {data.application ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="text-brand-accent h-5 w-5" />
                Enquiry and recommendation
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
                {data.application.offerKey ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {offerPrices[data.application.offerKey]}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Status</p>
                <p className="mt-1">{statusLabels[data.application.status]}</p>
                {data.application.decisionReason ? (
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {data.application.decisionReason}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Submitted</p>
                <p className="mt-1">{formatDateTime(data.application.createdAt)}</p>
                {data.application.waitlistedAt ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Waitlisted {formatDateTime(data.application.waitlistedAt)}
                  </p>
                ) : null}
                {data.application.waitlistLeftAt ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Left waiting list {formatDateTime(data.application.waitlistLeftAt)}
                  </p>
                ) : null}
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
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span>{tierLabels[data.profile.tier]}</span>
                      {data.profile.billingArrangement === "pro_bono" ? (
                        <Badge variant="secondary">Pro bono</Badge>
                      ) : null}
                      {data.profile.billingStartsAt ? (
                        <Badge variant="outline">
                          Paid from {formatDateOnly(data.profile.billingStartsAt)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Status</p>
                    <div className="mt-1">
                      <Badge variant={statusVariant(data.profile.status)}>
                        {(data.profile.billingPhase !== "active" &&
                          data.profile.billingPhase !== "not_configured" &&
                          billingPhaseLabels[data.profile.billingPhase]) ||
                          statusLabels[data.profile.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Everfit setup
                    </p>
                    <div className="mt-1">
                      <Badge variant={statusVariant(data.profile.everfitConnectionStatus)}>
                        {everfitLabels[data.profile.everfitConnectionStatus]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                    Coaching delivery
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your programme, check-ins, coaching-call arrangements and messages live in
                    Everfit. This dashboard keeps your account, billing and next administrative
                    actions together.
                  </p>
                </div>

                {(data.profile.billingArrangement === "paid" || data.profile.billingStartsAt) &&
                data.profile.billingCancellationRequestedAt ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-950">
                      {data.profile.billingPhase === "final_month"
                        ? "Final month"
                        : "Cancellation scheduled"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      {data.profile.billingFinalPaymentAt
                        ? `Your payment on ${formatDateTime(data.profile.billingFinalPaymentAt)} is scheduled as your final payment. `
                        : "No further coaching payments will be collected. "}
                      Coaching access continues until{" "}
                      {formatDateTime(data.profile.billingEndsAt) || "the end of your paid period"}.
                    </p>
                  </div>
                ) : null}

                {(data.profile.billingArrangement === "paid" || data.profile.billingStartsAt) &&
                cancellationResult &&
                !data.profile.billingCancellationRequestedAt ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-950">Cancellation scheduled</p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      Your next coaching payment on{" "}
                      {formatDateTime(cancellationResult.nextPaymentAt) || "the next billing date"}{" "}
                      will be your last. Coaching billing is scheduled to end on{" "}
                      {formatDateTime(cancellationResult.endsAt) || "the final period end"}.
                    </p>
                  </div>
                ) : null}
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
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/contact">
                      Contact Shruti
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                  {data.profile.everfitConnectionStatus === "removed" ? (
                    <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-sm">
                      Everfit access has been removed. Contact Shruti if you think you still need
                      access.
                    </div>
                  ) : (
                    <Button asChild variant="outline" className="w-full justify-between">
                      <a href="https://everfit.io/" target="_blank" rel="noreferrer">
                        Open Everfit
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {(data.profile.billingArrangement === "paid" || data.profile.billingStartsAt) &&
                  !data.profile.billingCancellationRequestedAt ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        disabled={billingLoading}
                        onClick={() => void openBillingPortal()}
                      >
                        {billingLoading ? "Opening billing..." : "Manage Coaching Billing"}
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-amber-300 text-amber-900 hover:bg-amber-50"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        Request Coaching Cancellation
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
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
                    Use this dashboard to track your enquiry, recommendation, onboarding and
                    billing.
                  </p>
                  <p className="text-muted-foreground">
                    Everfit remains the place where workouts and programming live. Shruti manages
                    that setup manually and this dashboard keeps your current status and next steps
                    together.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={showLeaveWaitlistDialog} onOpenChange={setShowLeaveWaitlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave the coaching waiting list?</DialogTitle>
            <DialogDescription>
              If you leave and enquire again later, the new enquiry will join the end of the waiting
              list.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            You will not lose your previous enquiry record, but you will no longer be holding a
            waiting-list place.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveWaitlistDialog(false)}>
              Stay on waiting list
            </Button>
            <Button
              className="bg-amber-700 text-white hover:bg-amber-800"
              disabled={leaveWaitlistLoading}
              onClick={() => void leaveCoachingWaitlist()}
            >
              {leaveWaitlistLoading ? "Leaving..." : "Leave waiting list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request coaching cancellation?</DialogTitle>
            <DialogDescription>
              Coaching has a one-month notice structure. If you continue, your next coaching payment
              will still be taken and will be your final payment. Access is scheduled to end after
              that final paid period.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            This schedules the coaching subscription in Stripe. Shruti manages Everfit delivery and
            access manually around the final payment and end date.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep coaching
            </Button>
            <Button
              className="bg-amber-700 text-white hover:bg-amber-800"
              disabled={cancelLoading}
              onClick={() => void scheduleCoachingCancellation()}
            >
              {cancelLoading ? "Scheduling..." : "Confirm cancellation request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

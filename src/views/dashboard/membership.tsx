"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { DashboardLayout } from "../../components/dashboard-layout";
import { MembershipPageSkeleton } from "../../components/dashboard-skeleton";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Gift,
  AlertTriangle,
  Clock,
  Infinity,
  Shield,
  Check,
  ArrowRight,
  Sparkles,
  Star,
  Crown,
} from "lucide-react";
import type { BillingHistoryItemDto, MembershipStateDto, PublicPricingDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import {
  buildCreditCheckoutReturnPaths,
  buildMembershipCheckoutReturnPaths,
} from "@/lib/billing/checkout-flow";
import {
  buildMembershipDisclosure,
  SUBSCRIPTION_DISCLOSURE_VERSION,
} from "@/lib/billing/subscription-disclosure";

type CheckoutResult = {
  checkoutUrl: string;
};

type PortalResult = {
  portalUrl: string;
};

type ChangePlanResult = {
  mode: "already_current" | "immediate" | "period_end";
};

type AcceptanceRequirementState = {
  type: string;
  surface: string;
  currentVersion: string;
  acceptedVersion: string | null;
  policyVersionId: string;
  acceptanceEventId: string | null;
  isCurrent: boolean;
};

type CheckoutErrorResponse = {
  message?: string;
  code?: string;
  requiredAcceptances?: AcceptanceRequirementState[];
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: {
      code?: string;
      requiredAcceptances?: AcceptanceRequirementState[];
    };
  };
};

function formatMembershipStatus(
  status: "active" | "paused" | "cancelled" | "expired" | "past_due"
) {
  if (status === "past_due") return "Payment issue";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Ended";
  if (status === "paused") return "Paused";
  return "Active";
}

function formatBillingHistoryStatus(status: BillingHistoryItemDto["status"]) {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return "Applied";
}

function formatAcceptanceLabel(type: string) {
  if (type === "terms") return "Terms & Conditions";
  if (type === "health_waiver") return "Health & Liability Waiver";
  if (type === "health_data") return "Health Data Consent";
  if (type === "recording_notice") return "Recording Notice";
  return "Legal agreement";
}

function extractCheckoutError(payload: CheckoutErrorResponse | null) {
  if (!payload) return { message: "Failed to start membership checkout." };

  const details = payload.error?.details;
  const code = payload.code || details?.code || payload.error?.code;
  const requiredAcceptances = payload.requiredAcceptances || details?.requiredAcceptances;
  const message =
    payload.message || payload.error?.message || "Failed to start membership checkout.";

  return { code, requiredAcceptances, message };
}

export function MembershipPage({
  initialState,
  initialHistory,
  initialPricing,
}: {
  initialState?: MembershipStateDto | null;
  initialHistory?: BillingHistoryItemDto[];
  initialPricing?: PublicPricingDto | null;
}) {
  const { acceptTermsAndHealth, acceptHealthDataConsent, refreshAccountProfile } = useAuth();
  const searchParams = useSearchParams();
  const hasServerData =
    initialState !== undefined && initialHistory !== undefined && initialPricing !== undefined;
  const [state, setState] = useState<MembershipStateDto | null>(initialState || null);
  const [history, setHistory] = useState<BillingHistoryItemDto[]>(initialHistory || []);
  const [historyLimit, setHistoryLimit] = useState(
    Math.min(100, Math.max(30, initialHistory?.length || 30))
  );
  const [loading, setLoading] = useState(!hasServerData);
  const [working, setWorking] = useState(false);
  const [historyWorking, setHistoryWorking] = useState(false);
  const [portalWorking, setPortalWorking] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonDetail, setCancelReasonDetail] = useState("");
  const [changePlanMessage, setChangePlanMessage] = useState("");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [pendingInterval, setPendingInterval] = useState<"monthly" | "annual" | null>(null);
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [pendingLegalAcceptances, setPendingLegalAcceptances] = useState<
    AcceptanceRequirementState[]
  >([]);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState<PublicPricingDto | null>(initialPricing || null);
  const membership = state?.membership || null;
  const hasActiveMembership = Boolean(membership?.accessActive);
  const checkoutState = searchParams.get("checkout");

  const totalCredits = state?.credits.balance || 0;
  const referralBalance = Math.floor((state?.referral.balancePence || 0) / 100);

  const monthlyPrice = pricing?.membershipDisplay?.movewellMonthly ?? 29;
  const annualPrice = pricing?.membershipDisplay?.movewellAnnual ?? 290;
  const trialDays = pricing?.membershipDisplay?.trialDays ?? 14;
  const credits1Price = pricing?.credits[1] ?? 9;
  const credits3Price = pricing?.credits[3] ?? 24;
  const credits10Price = pricing?.credits[10] ?? 70;
  const creditsExpiryDays = pricing?.creditsExpiryDays ?? 90;
  const preferredInterval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const disclosureRequested = searchParams.get("subscribe") === "1";
  const checkoutPurchase = searchParams.get("purchase");
  const checkoutError = searchParams.get("checkoutError") === "1";
  const checkoutBundle = searchParams.get("bundle");
  const checkoutInterval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const annualSavings = Math.max(0, monthlyPrice * 12 - annualPrice);
  const membershipUsagePercent =
    membership && membership.classesPerWeek > 0
      ? Math.min(
          100,
          Math.round((membership.classesUsedThisWeek / membership.classesPerWeek) * 100)
        )
      : 0;

  const creditExpiryInfo = useMemo(() => {
    const summary = state?.credits.summary || [];
    const dated = summary.filter((item) => Boolean(item.expiresAt));
    if (dated.length === 0)
      return { date: null as string | null, count: 0, daysLeft: null as number | null };

    const earliest = dated
      .map((item) => item.expiresAt as string)
      .sort((a, b) => (a > b ? 1 : -1))[0];
    const count = dated
      .filter((item) => item.expiresAt === earliest)
      .reduce((sum, item) => sum + item.remaining, 0);
    const daysLeft = Math.ceil((new Date(earliest).getTime() - Date.now()) / 86400000);

    return { date: earliest, count, daysLeft };
  }, [state?.credits.summary]);

  const load = useCallback(async (limit: number) => {
    const [membershipRes, historyRes, pricingRes] = await Promise.all([
      fetch("/api/me/membership", { cache: "no-store" }),
      fetch(`/api/me/billing-history?limit=${limit}`, { cache: "no-store" }),
      fetch("/api/public/pricing", { cache: "no-store" }),
    ]);

    if (!membershipRes.ok) throw new Error("Failed to load membership.");
    const membership = (await membershipRes.json()) as MembershipStateDto;
    const billingHistory = historyRes.ok
      ? ((await historyRes.json()) as BillingHistoryItemDto[])
      : [];
    const publicPricing = pricingRes.ok ? ((await pricingRes.json()) as PublicPricingDto) : null;

    setState(membership);
    setHistory(billingHistory);
    setHistoryLimit(limit);
    if (publicPricing) setPricing(publicPricing);
  }, []);

  const loadMoreBillingHistory = async () => {
    const nextLimit = Math.min(100, historyLimit + 30);
    setHistoryWorking(true);
    setError("");
    try {
      const res = await fetch(`/api/me/billing-history?limit=${nextLimit}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load billing history.");
      const billingHistory = (await res.json()) as BillingHistoryItemDto[];
      setHistory(billingHistory);
      setHistoryLimit(nextLimit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing history.");
    } finally {
      setHistoryWorking(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      setError("");
      if (!hasServerData) setLoading(true);
      try {
        await load(30);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load membership.");
      } finally {
        if (active && !hasServerData) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hasServerData, load]);

  useEffect(() => {
    if (!disclosureRequested || hasActiveMembership) return;
    setPendingInterval(preferredInterval);
    setShowDisclosure(true);
  }, [disclosureRequested, hasActiveMembership, preferredInterval]);

  const startMembershipCheckout = async (billingInterval: "monthly" | "annual") => {
    setPendingInterval(billingInterval);
    setDisclosureAccepted(false);
    setPendingLegalAcceptances([]);
    setError("");
    setShowDisclosure(true);
  };

  const requestMembershipCheckout = async () => {
    if (!pendingInterval) throw new Error("Choose a membership plan before continuing.");
    const res = await fetch("/api/me/membership/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "movewell",
        billingInterval: pendingInterval,
        disclosureAccepted: true,
        disclosureVersion: SUBSCRIPTION_DISCLOSURE_VERSION,
        ...buildMembershipCheckoutReturnPaths(pendingInterval),
      }),
    });

    const payload = (await res.json().catch(() => null)) as
      | CheckoutErrorResponse
      | CheckoutResult
      | null;
    if (!res.ok) {
      const checkoutError = extractCheckoutError(payload as CheckoutErrorResponse | null);
      if (
        res.status === 409 &&
        checkoutError.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
        Array.isArray(checkoutError.requiredAcceptances)
      ) {
        setPendingLegalAcceptances(checkoutError.requiredAcceptances);
        throw new Error(
          "Updated legal agreements are required before checkout. Review them below, then continue again."
        );
      }
      throw new Error(checkoutError.message);
    }

    return payload as CheckoutResult;
  };

  const resolvePendingLegalAcceptances = async () => {
    const needsTerms = pendingLegalAcceptances.some((item) => item.type === "terms");
    const needsHealthWaiver = pendingLegalAcceptances.some((item) => item.type === "health_waiver");
    const needsHealthData = pendingLegalAcceptances.some((item) => item.type === "health_data");
    const unsupportedAcceptances = pendingLegalAcceptances.filter(
      (item) =>
        item.type !== "terms" && item.type !== "health_waiver" && item.type !== "health_data"
    );

    if (unsupportedAcceptances.length > 0) {
      throw new Error("Some required agreements cannot be refreshed from this page yet.");
    }

    if (needsTerms || needsHealthWaiver) {
      await acceptTermsAndHealth(needsTerms, needsHealthWaiver);
    }

    if (needsHealthData) {
      await acceptHealthDataConsent();
    }

    await refreshAccountProfile();
    setPendingLegalAcceptances([]);
  };

  const continueToMembershipCheckout = async () => {
    if (!pendingInterval) return;
    setWorking(true);
    setError("");
    try {
      if (pendingLegalAcceptances.length > 0) {
        await resolvePendingLegalAcceptances();
      }
      const payload = await requestMembershipCheckout();
      window.location.href = payload.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start membership checkout.");
      setWorking(false);
    }
  };

  const startCreditsCheckout = async (bundleSize: 1 | 3 | 10) => {
    setWorking(true);
    setError("");
    try {
      const res = await fetch("/api/me/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleSize,
          ...buildCreditCheckoutReturnPaths(bundleSize),
        }),
      });
      if (!res.ok) throw new Error("Failed to start credits checkout.");
      const payload = (await res.json()) as CheckoutResult;
      window.location.href = payload.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start credits checkout.");
      setWorking(false);
    }
  };

  const cancelMembership = async (startReplacementPack = false) => {
    setWorking(true);
    setError("");
    try {
      const res = await fetch("/api/me/membership/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason,
          reasonDetail: cancelReasonDetail,
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel membership.");
      await load(historyLimit);
      setShowCancel(false);
      setCancelReason("");
      setCancelReasonDetail("");
      setWorking(false);
      if (startReplacementPack) {
        await startCreditsCheckout(3);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel membership.");
      setWorking(false);
    }
  };

  const resumeMembership = async () => {
    setWorking(true);
    setError("");
    try {
      const res = await fetch("/api/me/membership/resume", { method: "POST" });
      if (!res.ok) throw new Error("Failed to resume membership.");
      await load(historyLimit);
      setShowCancel(false);
      setWorking(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resume membership.");
      setWorking(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalWorking(true);
    setError("");
    try {
      const res = await fetch("/api/me/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/dashboard/membership" }),
      });
      if (!res.ok) throw new Error("Failed to open billing portal.");
      const payload = (await res.json()) as PortalResult;
      window.location.href = payload.portalUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open billing portal.");
      setPortalWorking(false);
    }
  };

  const changeMembershipInterval = async (billingInterval: "monthly" | "annual") => {
    setWorking(true);
    setError("");
    setChangePlanMessage("");
    try {
      const res = await fetch("/api/me/membership/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "movewell", billingInterval }),
      });
      if (!res.ok) throw new Error("Failed to change membership plan.");
      const payload = (await res.json()) as { success: true; data: ChangePlanResult };
      await load(historyLimit);
      setChangePlanMessage(
        payload.data.mode === "period_end"
          ? "Your monthly switch has been scheduled for the end of the paid annual period."
          : payload.data.mode === "already_current"
            ? "You are already on that billing interval."
            : "Your annual upgrade has been applied. Stripe will handle any prorated charge."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change membership plan.");
    } finally {
      setWorking(false);
    }
  };

  const priceWithDiscount = (basePrice: number) => {
    if (referralBalance <= 0) return `£${basePrice}`;
    const discounted = Math.max(0, basePrice - referralBalance);
    return (
      <span>
        <span className="text-muted-foreground mr-1 line-through">£{basePrice}</span>£{discounted}
      </span>
    );
  };

  const membershipDetail = membership
    ? membership.cancelAtPeriodEnd && membership.endsAt
      ? `Ends ${membership.endsAt}`
      : membership.compliance.trialEndsAt && membership.status === "active"
        ? `Trial ends ${membership.compliance.trialEndsAt}`
        : membership.accessActive
          ? `Renews ${membership.renewalDate || "-"}`
          : membership.endsAt
            ? `Ended ${membership.endsAt}`
            : formatMembershipStatus(membership.status)
    : "Choose monthly, annual, or class credits";

  const disclosure = useMemo(
    () => buildMembershipDisclosure(pendingInterval || preferredInterval),
    [pendingInterval, preferredInterval]
  );

  if (loading) {
    return (
      <DashboardLayout title="Membership & Credits - Private Studio">
        <MembershipPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!state) {
    return (
      <DashboardLayout title="Membership & Credits - Private Studio">
        <p className="text-muted-foreground">{error || "Could not load membership."}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Membership & Credits - Private Studio">
      <AppPageHeader
        eyebrow="Billing"
        title="Membership & Credits"
        description="Manage your plan, purchase credits, and view billing."
        className="mb-8"
      />

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {changePlanMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {changePlanMessage}
        </div>
      ) : null}

      <AppMetricGrid className="mb-8 lg:grid-cols-3">
        <AppMetricCard
          label="Membership"
          value={membership ? membership.label : "Pay as you go"}
          detail={membershipDetail}
        />
        <AppMetricCard
          label="Credits"
          value={totalCredits}
          detail={totalCredits === 1 ? "1 credit available" : `${totalCredits} credits available`}
        />
        <AppMetricCard
          label="Referral balance"
          value={`£${referralBalance}`}
          detail={
            referralBalance > 0
              ? "applies automatically at checkout"
              : "share your link to earn credit"
          }
        />
      </AppMetricGrid>

      {checkoutState === "success" ? (
        <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {checkoutPurchase === "membership"
            ? `Membership checkout completed. Stripe will confirm your ${checkoutInterval} membership and the dashboard will refresh with your access details.`
            : checkoutPurchase === "credits"
              ? `Credit checkout completed. Your ${checkoutBundle || "class"} credits will appear here as soon as Stripe confirms the payment.`
              : "Checkout completed. Your membership, credits, and billing history will refresh automatically."}
        </div>
      ) : null}

      {checkoutState === "cancelled" ? (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {checkoutPurchase === "membership"
            ? "Membership checkout was cancelled. Your current access was left unchanged and you can restart checkout below."
            : checkoutPurchase === "credits"
              ? "Credit checkout was cancelled. No credits were added or charged, and you can choose a pack below."
              : "Checkout was cancelled. Your current membership and credits were left unchanged."}
        </div>
      ) : null}

      {checkoutState === "retry" && checkoutError ? (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {checkoutPurchase === "credits"
            ? "We could not start credit checkout after sign-in. Choose the credit pack again below."
            : "We could not start checkout after sign-in. Review the option below and try again."}
        </div>
      ) : null}

      {referralBalance > 0 ? (
        <div className="border-brand-accent/20 bg-brand-accent/5 mb-8 flex items-start gap-3 rounded-lg border p-4">
          <Gift className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm">
              You have <span className="text-brand-accent">£{referralBalance}</span> referral
              balance.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {hasActiveMembership
                ? "Applies to your next renewal"
                : "Applies to your next purchase"}
            </p>
          </div>
        </div>
      ) : null}

      {membership && membership.plan !== "instructor" ? (
        <div className="bg-background mb-8 rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="text-primary h-5 w-5" />
            <h2 className="text-xl">Membership Status</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg">{membership.label}</p>
                <p className="text-muted-foreground text-sm">
                  £{Math.floor(membership.pricePence / 100)}/
                  {membership.billingInterval === "annual" ? "year" : "month"}
                  {membership.cancelAtPeriodEnd && membership.endsAt
                    ? ` · Ends ${membership.endsAt}`
                    : membership.renewalDate
                      ? ` · Renews ${membership.renewalDate}`
                      : membership.endsAt
                        ? ` · Ended ${membership.endsAt}`
                        : ""}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-brand-accent/30 bg-brand-accent/5 text-brand-accent"
              >
                {hasActiveMembership && membership.plan === "movewell" ? (
                  <>
                    <Infinity className="mr-1 h-3 w-3" />
                    Unlimited classes
                  </>
                ) : (
                  formatMembershipStatus(membership.status)
                )}
              </Badge>
            </div>

            {membership.status === "past_due" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Payment for your membership needs attention. Use the billing portal to update your
                card, review invoices, or recover access.
              </div>
            ) : null}

            {membership.cancelAtPeriodEnd && membership.endsAt ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Your membership is scheduled to end on {membership.endsAt}. You can keep using the
                studio until then, or resume renewal before that date.
              </div>
            ) : null}

            {membership.compliance.trialEndsAt && !membership.cancelAtPeriodEnd ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                Your free trial is active and is due to end on {membership.compliance.trialEndsAt}.
                If you do not cancel before then, the paid subscription starts automatically.
              </div>
            ) : null}

            {membership.compliance.inInitialCoolingOff &&
            membership.compliance.initialCoolingOffEndsAt ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Your initial 14-day cooling-off window is open until{" "}
                {membership.compliance.initialCoolingOffEndsAt}. If you cancel before then, your
                subscription ends immediately.
              </div>
            ) : null}

            {membership.compliance.inRenewalCoolingOff &&
            membership.compliance.renewalCoolingOffEndsAt ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Your renewal cooling-off window is open until{" "}
                {membership.compliance.renewalCoolingOffEndsAt}. If you cancel before then, we will
                process any refund required under consumer law.
              </div>
            ) : null}

            {!membership.accessActive && membership.status !== "past_due" ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                This membership is no longer active. You can restart the plan below or continue
                attending with credit packs.
              </div>
            ) : null}

            <div className="bg-secondary/20 rounded-lg p-4">
              <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Check className="text-brand-accent h-4 w-4" />
                  All class types included
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-brand-accent h-4 w-4" />
                  No cancellation penalties
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-brand-accent h-4 w-4" />
                  No penalties for no-shows
                </div>
                <div className="flex items-center gap-2">
                  <Star className="text-brand-accent h-4 w-4" />
                  Early access to programmes
                </div>
                {membership.billingInterval === "annual" ? (
                  <div className="bg-brand-accent/5 text-brand-accent flex items-center gap-2 rounded-md px-2 py-1.5 sm:col-span-2">
                    <Crown className="h-4 w-4" />
                    10% off all programmes & workshops
                  </div>
                ) : null}
              </div>
            </div>

            {membership.accessActive ? (
              <div className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly class usage</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {membership.plan === "movewell"
                        ? `${membership.classesUsedThisWeek} classes used this week. Membership access is unlimited, so this is a rhythm check rather than a cap.`
                        : `${membership.classesUsedThisWeek} of ${membership.classesPerWeek} weekly classes used.`}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {membership.classesUsedThisWeek}/{membership.classesPerWeek}
                  </Badge>
                </div>
                <div
                  className="bg-muted mt-4 h-2 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label="Weekly class usage"
                  aria-valuenow={membership.classesUsedThisWeek}
                  aria-valuemin={0}
                  aria-valuemax={membership.classesPerWeek}
                >
                  <div
                    className="bg-brand-accent h-full rounded-full"
                    style={{ width: `${membershipUsagePercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            {membership.accessActive && membership.billingInterval === "monthly" ? (
              <div className="border-brand-accent/20 bg-brand-accent/5 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Annual upgrade available</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Annual membership is £{annualPrice}/year and saves £{annualSavings} compared
                      with monthly billing.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void changeMembershipInterval("annual")}
                    disabled={working}
                  >
                    Upgrade to annual
                  </Button>
                </div>
              </div>
            ) : membership.accessActive && membership.billingInterval === "annual" ? (
              <div className="border-brand-accent/20 bg-brand-accent/5 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Annual savings active</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      You are saving £{annualSavings} compared with paying monthly for the year. You
                      can schedule a monthly switch for the end of the current paid period.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void changeMembershipInterval("monthly")}
                    disabled={working}
                  >
                    Schedule monthly switch
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void openBillingPortal()}
                disabled={portalWorking}
              >
                Manage billing details
              </Button>
              {membership.cancelAtPeriodEnd ? (
                <Button size="sm" onClick={() => void resumeMembership()} disabled={working}>
                  Resume renewal
                </Button>
              ) : membership.accessActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    setCancelReason("");
                    setCancelReasonDetail("");
                    setShowCancel(true);
                  }}
                >
                  Cancel membership
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!hasActiveMembership ? (
        <div className="bg-background border-primary mb-8 rounded-lg border-2 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="text-brand-accent h-5 w-5" />
            <h2 className="text-xl">Move Well Membership</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div
              className={`space-y-4 rounded-lg border p-5 ${
                preferredInterval === "monthly" ? "border-brand-accent/30 bg-brand-accent/5" : ""
              }`}
            >
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Monthly</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-bronze-text text-3xl">
                    {referralBalance > 0 ? (
                      <>
                        <span className="text-muted-foreground mr-1 text-xl line-through">
                          £{monthlyPrice}
                        </span>
                        £{Math.max(0, monthlyPrice - referralBalance)}
                      </>
                    ) : (
                      `£${monthlyPrice}`
                    )}
                  </span>
                  <span className="text-muted-foreground text-sm">/ month</span>
                </div>
                {referralBalance > 0 ? (
                  <p className="text-brand-accent mt-1 text-xs">
                    £{referralBalance} referral discount on first month
                  </p>
                ) : null}
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Infinity className="text-brand-accent h-4 w-4" />
                  Unlimited classes
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="text-brand-accent h-4 w-4" />
                  Penalty-free cancellation
                </li>
                <li className="flex items-center gap-2">
                  <Star className="text-brand-accent h-4 w-4" />
                  Early access to programmes
                </li>
              </ul>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => void startMembershipCheckout("monthly")}
                disabled={working}
              >
                Start Monthly
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div
              className={`relative space-y-4 rounded-lg border-2 p-5 ${
                preferredInterval === "annual"
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-brand-accent/30"
              }`}
            >
              <div className="absolute -top-3 right-4">
                <span className="bg-brand-accent text-micro inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-white">
                  <Crown className="h-3 w-3" />
                  Recommended
                </span>
              </div>

              <div>
                <p className="text-brand-accent mb-1 text-xs">Annual</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-bronze-text text-3xl">£{annualPrice}</span>
                  <span className="text-muted-foreground text-sm">/ year</span>
                </div>
                <p className="text-brand-accent mt-1 text-xs">
                  Save £{Math.max(0, monthlyPrice * 12 - annualPrice)} - 2 months free
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Infinity className="text-brand-accent h-4 w-4" />
                  Unlimited classes
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="text-brand-accent h-4 w-4" />
                  Penalty-free cancellation
                </li>
                <li className="flex items-center gap-2">
                  <Star className="text-brand-accent h-4 w-4" />
                  Early access to programmes
                </li>
                <li className="bg-brand-accent/5 text-brand-accent -mx-1 flex items-center gap-2 rounded px-1 py-1">
                  <Crown className="h-4 w-4" />
                  10% off programmes & workshops
                </li>
              </ul>

              <Button
                className="bg-brand-accent hover:bg-brand-accent/90 w-full text-white"
                onClick={() => void startMembershipCheckout("annual")}
                disabled={working}
              >
                Start Annual - Save £{Math.max(0, monthlyPrice * 12 - annualPrice)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-center text-xs">
            Every membership begins with {trialDays} days on us. Card details are collected now,
            first charge after trial unless cancelled.
          </p>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Before checkout you will be shown the key subscription terms separately and must
            acknowledge them explicitly.
          </p>
          <p className="text-muted-foreground mt-3 text-center text-xs leading-relaxed">
            By continuing to checkout, you agree to the{" "}
            <a href="/terms" className="text-primary underline">
              Terms & Conditions
            </a>{" "}
            and can review the{" "}
            <a href="/refund-policy" className="text-primary underline">
              Refund & Cancellation Policy
            </a>
            .
          </p>
        </div>
      ) : null}

      {showCancel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-membership-heading"
        >
          <div className="bg-background w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-xl">
            <h3 id="cancel-membership-heading" className="text-xl">
              Cancel your membership?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your membership will remain active until the renewal date. After that, you can still
              attend using credit packs.
            </p>
            {totalCredits > 0 ? (
              <p className="text-muted-foreground text-sm">
                You have {totalCredits} credit{totalCredits !== 1 ? "s" : ""} that will remain
                available.
              </p>
            ) : null}
            {referralBalance > 0 ? (
              <p className="text-muted-foreground text-sm">
                Your £{referralBalance} referral balance will carry over.
              </p>
            ) : null}
            <label className="space-y-2 text-sm">
              <span className="font-medium">Reason for cancelling</span>
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Select a reason</option>
                <option value="schedule_changed">My schedule has changed</option>
                <option value="budget">Budget or affordability</option>
                <option value="not_using_enough">I am not using it enough</option>
                <option value="switching_to_credits">I want to switch to credits</option>
                <option value="health_or_capacity">Health, energy, or capacity changed</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Anything else Shruti should know?</span>
              <textarea
                value={cancelReasonDetail}
                onChange={(event) => setCancelReasonDetail(event.target.value)}
                maxLength={500}
                rows={3}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                placeholder="Optional context"
              />
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => void cancelMembership(totalCredits === 0)}
                disabled={working || !cancelReason}
              >
                {totalCredits === 0 ? (
                  <>Cancel & Switch to 3-Class Pack ({priceWithDiscount(credits3Price)})</>
                ) : (
                  "Cancel Membership"
                )}
              </Button>
              {totalCredits === 0 ? (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => void cancelMembership()}
                  disabled={working || !cancelReason}
                >
                  Cancel without replacement
                </Button>
              ) : null}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCancel(false);
                  setCancelReason("");
                  setCancelReasonDetail("");
                }}
                disabled={working}
              >
                Keep my membership
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {hasActiveMembership ? (
        totalCredits > 0 ? (
          <div className="bg-background mb-8 rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="text-primary h-5 w-5" />
              <h2 className="text-xl">Remaining Credits</h2>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">
              You have {totalCredits} credit{totalCredits !== 1 ? "s" : ""} from before your
              membership. These still expire on their original date.
            </p>

            {creditExpiryInfo.date &&
            creditExpiryInfo.daysLeft !== null &&
            creditExpiryInfo.daysLeft <= 14 ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  {creditExpiryInfo.count} credit{creditExpiryInfo.count !== 1 ? "s" : ""}{" "}
                  {creditExpiryInfo.daysLeft <= 0
                    ? "expired today"
                    : creditExpiryInfo.daysLeft === 1
                      ? "will expire tomorrow"
                      : `will expire in ${creditExpiryInfo.daysLeft} days`}
                  .
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {state.credits.summary.map((group) => (
                <div
                  key={group.sourceId}
                  className="flex items-center justify-between border-b py-3 text-sm last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    <div>
                      <span>{group.sourceLabel}</span>
                      <p className="text-muted-foreground text-xs">
                        {group.expiresAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {group.expiresAt}
                          </span>
                        ) : (
                          "No expiry set"
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {group.remaining} credit{group.remaining !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null
      ) : (
        <div className="bg-background mb-8 rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="text-primary h-5 w-5" />
            <h2 className="text-xl">Class Credits</h2>
          </div>

          {creditExpiryInfo.date &&
          creditExpiryInfo.daysLeft !== null &&
          creditExpiryInfo.daysLeft <= 14 ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                {creditExpiryInfo.count} credit{creditExpiryInfo.count !== 1 ? "s" : ""}{" "}
                {creditExpiryInfo.daysLeft <= 0
                  ? "expired today"
                  : creditExpiryInfo.daysLeft === 1
                    ? "will expire tomorrow"
                    : `will expire in ${creditExpiryInfo.daysLeft} days`}
                . Credits expire {creditsExpiryDays} days from purchase and don't auto-renew.
              </p>
            </div>
          ) : null}

          {state.credits.summary.length > 0 ? (
            <div className="mb-6 space-y-3">
              {state.credits.summary.map((group) => (
                <div
                  key={group.sourceId}
                  className="flex items-center justify-between border-b py-3 text-sm last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    <div>
                      <span>{group.sourceLabel}</span>
                      <p className="text-muted-foreground text-xs">
                        {group.expiresAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {group.expiresAt}
                          </span>
                        ) : (
                          "No expiry set"
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {group.remaining} credit{group.remaining !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-6 text-sm">No class credits available.</p>
          )}

          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-3 text-sm">
              Purchase credits to attend any class. Cancel 4+ hours before to get your credit back.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void startCreditsCheckout(1)}
                disabled={working}
              >
                Single ({priceWithDiscount(credits1Price)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void startCreditsCheckout(3)}
                disabled={working}
              >
                3-Pack ({priceWithDiscount(credits3Price)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void startCreditsCheckout(10)}
                disabled={working}
              >
                10-Pack ({priceWithDiscount(credits10Price)})
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              All credits expire {creditsExpiryDays} days from purchase. No auto-renewal.
            </p>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Credit purchases are subject to the{" "}
              <a href="/terms" className="text-primary underline">
                Terms & Conditions
              </a>{" "}
              and the{" "}
              <a href="/refund-policy" className="text-primary underline">
                Refund & Cancellation Policy
              </a>
              .
            </p>
          </div>
        </div>
      )}

      <div className="bg-background mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Subscription Notices</h2>
        {membership ? (
          <div className="mb-5 space-y-2 text-sm">
            <p className="text-muted-foreground">
              Disclosure version: {membership.compliance.disclosureVersion || "Not recorded yet"}
            </p>
            {membership.compliance.disclosureAcceptedAt ? (
              <p className="text-muted-foreground">
                Disclosure acknowledged on {membership.compliance.disclosureAcceptedAt.slice(0, 10)}
              </p>
            ) : null}
            {membership.compliance.trialEndsAt ? (
              <p className="text-muted-foreground">
                Trial end: {membership.compliance.trialEndsAt}
              </p>
            ) : null}
            {membership.compliance.renewalCoolingOffEndsAt ? (
              <p className="text-muted-foreground">
                Renewal cooling-off ends: {membership.compliance.renewalCoolingOffEndsAt}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground mb-5 text-sm">
            Subscription notices and acknowledgements will appear here after you start a membership.
          </p>
        )}

        <div className="space-y-3 text-sm">
          {state.complianceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscription notices recorded yet.</p>
          ) : (
            state.complianceHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-foreground">{item.summary}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.eventAt.slice(0, 10)} · {item.channel} · {item.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-background rounded-lg border p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl">Billing History</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Charges, credits, refunds, and referral discounts from Stripe and internal records.
            </p>
          </div>
          <Badge variant="outline">{history.length} shown</Badge>
        </div>
        <div className="space-y-3 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No billing events yet.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-foreground">{item.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.createdAt.slice(0, 10)} · {formatBillingHistoryStatus(item.status)}
                  </p>
                  {item.invoiceUrl ? (
                    <a
                      href={item.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary mt-1 inline-flex text-xs underline"
                    >
                      View invoice
                    </a>
                  ) : null}
                </div>
                <span>£{(item.amountPence / 100).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
        {history.length >= historyLimit && historyLimit < 100 ? (
          <div className="mt-5 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMoreBillingHistory()}
              disabled={historyWorking}
            >
              {historyWorking ? "Loading..." : "Show more billing history"}
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={showDisclosure} onOpenChange={setShowDisclosure}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review subscription terms before checkout</DialogTitle>
            <DialogDescription>
              This summary is shown separately so the automatic renewal, reminder, cancellation, and
              cooling-off terms are clear before you enter the contract.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {pendingLegalAcceptances.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                  <div className="space-y-2">
                    <p className="font-medium">Updated agreements are required before checkout.</p>
                    <p className="text-amber-900/80">
                      This local account is missing the latest acceptance record for:
                    </p>
                    <ul className="space-y-1">
                      {pendingLegalAcceptances.map((item) => (
                        <li key={item.type} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
                          <span>{formatAcceptanceLabel(item.type)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-amber-900/80">
                      Continue again to record the current versions on your account, then checkout
                      will restart automatically.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                Key pre-contract information
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {disclosure.keyItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                Full subscription information
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {disclosure.fullItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={disclosureAccepted}
                onChange={(event) => setDisclosureAccepted(event.target.checked)}
                className="accent-brand-accent mt-1 h-4 w-4"
              />
              <span>{disclosure.acknowledgementLabel}</span>
            </label>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Version {disclosure.version}. You can also review the{" "}
              <a href="/terms" className="text-primary underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/refund-policy" className="text-primary underline">
                Refund & Cancellation Policy
              </a>
              .
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDisclosure(false);
                setPendingInterval(null);
                setPendingLegalAcceptances([]);
              }}
              disabled={working}
            >
              Not now
            </Button>
            <Button
              onClick={() => void continueToMembershipCheckout()}
              disabled={working || !disclosureAccepted}
            >
              {working
                ? pendingLegalAcceptances.length > 0
                  ? "Refreshing agreements..."
                  : "Opening checkout..."
                : pendingLegalAcceptances.length > 0
                  ? "Accept agreements and continue"
                  : "Acknowledge and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

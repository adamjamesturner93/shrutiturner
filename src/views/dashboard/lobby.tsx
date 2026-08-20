"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AppPageHeader } from "@/components/app-surface";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  Compass,
  CreditCard,
  HeartPulse,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { DashboardSummaryDto, OnboardingStateDto } from "@/lib/api/types";
import type { ApiSuccess } from "@/lib/api/route";
import {
  EMPTY_HEALTH_PROFILE,
  normalizeHealthProfileApiResponse,
  type HealthProfile,
} from "@/data/health-profile-data";
import { getApiErrorMessage } from "@/lib/api/client";
import { getGreeting } from "@/components/greeting";

type LegalAcceptanceResponse = {
  message?: string;
  code?: string;
  requiredAcceptances?: Array<{
    type: string;
  }>;
};

type OnboardingStep = Exclude<OnboardingStateDto["nextStep"], "complete">;

function resolveOnboardingStep(nextStep?: OnboardingStateDto["nextStep"] | null): OnboardingStep {
  if (!nextStep || nextStep === "complete") return "welcome";
  return nextStep;
}

export function DashboardLobby({ initialData }: { initialData?: DashboardSummaryDto | null }) {
  const {
    user,
    isAdmin,
    completeOnboarding,
    acceptTermsAndHealth,
    acceptHealthDataConsent,
    saveOnboardingSource,
    refreshAccountProfile,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [summary, setSummary] = useState<DashboardSummaryDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("welcome");
  const [heardAboutSource, setHeardAboutSource] = useState("");
  const [heardAboutDetail, setHeardAboutDetail] = useState("");
  const [legalTerms, setLegalTerms] = useState(false);
  const [legalHealth, setLegalHealth] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const onboardingFieldsInitialized = useRef(false);

  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/me/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard.");
        const payload = (await res.json()) as ApiSuccess<DashboardSummaryDto>;
        if (active) setSummary(payload.data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  useEffect(() => {
    if (!isOnboarding || isAdmin || !user) {
      onboardingFieldsInitialized.current = false;
      return;
    }

    setShowOnboarding(true);
    setProfileError("");
    setOnboardingStep(
      user.onboarding.nextStep === "welcome" && user.healthDeclarationStatus === "incomplete"
        ? "health"
        : resolveOnboardingStep(user.onboarding.nextStep)
    );

    if (onboardingFieldsInitialized.current) {
      return;
    }

    setProfileFirstName(user.firstName || "");
    setProfileDob(user.dob || "");
    setHeardAboutSource(user.heardAboutSource || "");
    setHeardAboutDetail(user.heardAboutDetail || "");
    setLegalTerms(Boolean(user.hasAgreedToTerms));
    setLegalHealth(Boolean(user.hasAgreedToHealth));
    onboardingFieldsInitialized.current = true;
  }, [isOnboarding, isAdmin, user]);

  const finishOnboarding = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
    setOnboardingStep("welcome");
    onboardingFieldsInitialized.current = false;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("onboarding");
    const query = params.toString();
    router.replace(query ? `/dashboard?${query}` : "/dashboard");
  };

  const handleProfileContinue = async () => {
    setProfileSubmitting(true);
    setProfileError("");

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileFirstName.trim(),
          lastName: "",
          dob: profileDob,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload, "Could not save profile details."));
      }

      const account = await refreshAccountProfile();
      setOnboardingStep(resolveOnboardingStep(account?.profile?.onboarding?.nextStep));
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error ? saveError.message : "Could not save profile details."
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleHealthSave = async (profile: HealthProfile, consentAccepted: boolean) => {
    if (
      consentAccepted &&
      (!user?.hasConsentedToHealthData || user.needsHealthDataConsentRefresh)
    ) {
      await acceptHealthDataConsent();
    }

    let response = await fetch("/api/me/health-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as LegalAcceptanceResponse | null;
      const requiresHealthDataRefresh =
        response.status === 409 &&
        payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
        payload.requiredAcceptances?.some((item) => item.type === "health_data");

      if (requiresHealthDataRefresh && consentAccepted) {
        await acceptHealthDataConsent();
        response = await fetch("/api/me/health-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      }
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as LegalAcceptanceResponse | null;
      if (
        response.status === 409 &&
        payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
        payload.requiredAcceptances?.some((item) => item.type === "health_data")
      ) {
        throw new Error(
          "Health data consent is required before saving this profile. Tick the consent box and try again."
        );
      }
      throw new Error(payload?.message || "Could not save health profile.");
    }

    const savedProfile = normalizeHealthProfileApiResponse(await response.json());
    const account = await refreshAccountProfile();
    setOnboardingStep(resolveOnboardingStep(account?.profile?.onboarding?.nextStep));
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            hasHealthProfile: true,
            healthDeclarationStatus: savedProfile.declarationStatus,
            healthDeclarationLastConfirmedAt: savedProfile.lastConfirmedAt,
            healthDeclarationNeedsReview: false,
          }
        : prev
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Studio Lobby - Shruti Turner">
        <LoadingRegion label="Loading your studio dashboard">
          <DashboardSkeleton />
        </LoadingRegion>
      </DashboardLayout>
    );
  }

  if (!summary) {
    return (
      <DashboardLayout title="Studio Lobby - Shruti Turner">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "No dashboard data available."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Studio Lobby - Shruti Turner">
      {showOnboarding && !isAdmin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-background max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border shadow-xl">
            {onboardingStep === "profile" ? (
              <div className="space-y-6 p-8">
                <div className="space-y-3 text-center">
                  <div className="bg-brand-plum/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                    <Shield className="text-brand-plum h-8 w-8" />
                  </div>
                  <h2 className="text-xl">Complete Your Profile</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Add your details once so the studio experience is set up correctly for you.
                  </p>
                </div>

                <div className="grid gap-3">
                  <label className="space-y-2 text-sm">
                    <span>What should I call you?</span>
                    <Input
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span>Date of birth</span>
                  <Input
                    type="date"
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                  <p className="text-muted-foreground text-xs">
                    You must be 18+ to use this service.
                  </p>
                </label>

                {profileError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{profileError}</p>
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  disabled={profileSubmitting || !profileFirstName.trim() || !profileDob}
                  onClick={() => void handleProfileContinue()}
                >
                  Save & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {onboardingStep === "legal" ? (
              <div className="space-y-6 p-8">
                <div className="space-y-3 text-center">
                  <div className="bg-brand-plum/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                    <Shield className="text-brand-plum h-8 w-8" />
                  </div>
                  <h2 className="text-xl">Before We Begin</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    To use the studio, please review and accept the current versions of the required
                    agreements.
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 rounded-lg border p-4">
                    <input
                      type="checkbox"
                      checked={legalTerms}
                      onChange={(e) => setLegalTerms(e.target.checked)}
                      className="accent-brand-accent mt-0.5"
                    />
                    <span className="text-sm leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary underline" target="_blank">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary underline" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border p-4">
                    <input
                      type="checkbox"
                      checked={legalHealth}
                      onChange={(e) => setLegalHealth(e.target.checked)}
                      className="accent-brand-accent mt-0.5"
                    />
                    <span className="text-sm leading-relaxed">
                      I confirm I have read and agree to the{" "}
                      <Link
                        href="/health-declaration"
                        className="text-primary underline"
                        target="_blank"
                      >
                        Health & Liability Waiver
                      </Link>
                      and I understand that I participate at my own risk
                    </span>
                  </label>
                </div>
                <Button
                  className="w-full"
                  disabled={!legalTerms || !legalHealth}
                  onClick={async () => {
                    await acceptTermsAndHealth(true, true);
                    const account = await refreshAccountProfile();
                    setOnboardingStep(
                      resolveOnboardingStep(account?.profile?.onboarding?.nextStep)
                    );
                  }}
                >
                  Accept & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {onboardingStep === "welcome" ? (
              <div className="space-y-6 p-8 text-center">
                <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                  <HeartPulse className="text-brand-accent h-8 w-8" />
                </div>
                <h2 className="text-2xl">Welcome, {user?.firstName || "there"}.</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your account is ready. Start with whatever feels manageable.
                </p>
                <div className="bg-secondary/30 text-muted-foreground space-y-3 rounded-lg p-4 text-left text-sm">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Track coaching status and next actions from one dashboard</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Keep your health profile and account details up to date</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Use Everfit for coaching delivery once Shruti has set you up</span>
                  </p>
                </div>
                <Button className="w-full" onClick={() => void finishOnboarding()}>
                  Enter Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={() => void finishOnboarding()}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Enter without the tour
                </button>
              </div>
            ) : null}

            {onboardingStep === "source" ? (
              <div className="space-y-6 p-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-xl">Where Did You Hear About Me?</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    This helps us understand how people find the studio.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { value: "friend", label: "A friend or family member" },
                    { value: "instagram", label: "Instagram" },
                    { value: "facebook", label: "Facebook" },
                    { value: "google", label: "Google search" },
                    { value: "health_professional", label: "GP or health professional" },
                    { value: "other", label: "Other" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <input
                        type="radio"
                        name="source"
                        value={option.value}
                        checked={heardAboutSource === option.value}
                        onChange={(e) => setHeardAboutSource(e.target.value)}
                        className="accent-brand-accent"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
                {heardAboutSource === "other" ? (
                  <Input
                    type="text"
                    placeholder="Please tell us more..."
                    value={heardAboutDetail}
                    onChange={(e) => setHeardAboutDetail(e.target.value)}
                  />
                ) : null}
                <Button
                  className="w-full"
                  disabled={!heardAboutSource}
                  onClick={async () => {
                    await saveOnboardingSource(heardAboutSource, heardAboutDetail);
                    const account = await refreshAccountProfile();
                    setOnboardingStep(
                      account?.profile?.healthDeclarationStatus === "incomplete"
                        ? "health"
                        : resolveOnboardingStep(account?.profile?.onboarding?.nextStep)
                    );
                  }}
                >
                  {user?.healthDeclarationStatus === "incomplete"
                    ? "Next: Tell Us About Your Body"
                    : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {onboardingStep === "health" ? (
              <div className="space-y-4 p-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-xl">Your Health Profile</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    This helps Shruti adapt every session for your body.
                  </p>
                </div>
                <HealthProfileEditor
                  profile={EMPTY_HEALTH_PROFILE}
                  onSave={handleHealthSave}
                  compact
                  initialConsentAccepted={Boolean(user?.hasConsentedToHealthData)}
                  onSkip={() => void finishOnboarding()}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        <AppPageHeader
          title={
            <>
              {getGreeting()}, {user?.firstName || "there"}.
            </>
          }
          description="A simple place to keep your 1:1 support, health context and account details up to date."
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl">Your next actions</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              The things that need your attention, in priority order.
            </p>
          </div>
          {summary.actions.length ? (
            <div className="grid gap-3">
              {summary.actions.map((action) => (
                <div
                  key={action.id}
                  className={`flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between ${
                    action.priority === "overdue"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {action.priority === "overdue" ? (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                    ) : (
                      <Compass className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                    )}
                    <div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{action.detail}</p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={action.href}>
                      {action.ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <CheckCircle2 className="h-5 w-5" />
              <p>You’re up to date. There is nothing you need to do right now.</p>
            </div>
          )}
        </section>

        {summary.upcoming.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl">Coming up</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Payments, bookings and important dates across your services.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summary.upcoming.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="bg-background rounded-xl border p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {item.amountPence ? (
                      <CreditCard className="text-primary h-5 w-5" />
                    ) : (
                      <CalendarDays className="text-primary h-5 w-5" />
                    )}
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm">{item.detail}</p>
                  <p className="mt-2 text-sm">
                    {new Date(item.at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: item.kind === "class" ? "2-digit" : undefined,
                      minute: item.kind === "class" ? "2-digit" : undefined,
                    })}
                    {item.amountPence
                      ? ` · ${new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: item.currency || "GBP",
                        }).format(item.amountPence / 100)}`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl">Your services</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Open a service to see its current status and details.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summary.services.map((service) => (
              <Link
                key={service.id}
                href={service.href}
                className="bg-background rounded-xl border p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="font-medium">{service.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm capitalize">{service.status}</p>
              </Link>
            ))}
            {!summary.services.some((service) => service.id === "retreats") ? (
              <Link
                href="/retreats"
                className="bg-background rounded-xl border p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-primary h-5 w-5" />
                  <h3 className="font-medium">Retreats</h3>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">Explore available retreats</p>
              </Link>
            ) : null}

            <Link
              href="/dashboard/health"
              className="bg-background rounded-xl border p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-medium">Health Profile</h3>
              <p className="text-muted-foreground mt-2 text-sm">Review your body context</p>
            </Link>
            <Link
              href="/dashboard/account"
              className="bg-background rounded-xl border p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-medium">Account details</h3>
              <p className="text-muted-foreground mt-2 text-sm">Contact, sign-in and agreements</p>
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

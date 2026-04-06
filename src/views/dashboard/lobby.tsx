"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  AppEmptyState,
  AppMetricCard,
  AppMetricGrid,
  AppPageHeader,
} from "@/components/app-surface";
import {
  Calendar,
  CreditCard,
  Gift,
  ArrowRight,
  CheckCircle,
  Shield,
  HeartPulse,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { DashboardSummaryDto, OnboardingStateDto } from "@/lib/api/types";
import { EMPTY_HEALTH_PROFILE, type HealthProfile } from "@/data/health-profile-data";
import { getGreeting } from "@/components/greeting";
import {
  getDashboardAccessCard,
  shouldPromptForHealthProfile,
  shouldPromptForHealthReview,
} from "@/views/dashboard/dashboard-view-model";

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
  const [profileLastName, setProfileLastName] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [healthActionPending, setHealthActionPending] = useState(false);
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
        const payload = (await res.json()) as DashboardSummaryDto;
        if (active) setSummary(payload);
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
    setProfileLastName(user.lastName || "");
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
          lastName: profileLastName.trim(),
          dob: profileDob,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Could not save profile details.");
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

    const savedProfile = (await response.json()) as HealthProfile;
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

  const handleHealthConfirm = async () => {
    setHealthActionPending(true);
    try {
      const response = await fetch("/api/me/health-profile", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not confirm health declaration.");
      }
      const payload = (await response.json()) as HealthProfile;
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              healthDeclarationLastConfirmedAt: payload.lastConfirmedAt,
              healthDeclarationNeedsReview: false,
            }
          : prev
      );
      await refreshAccountProfile();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Could not confirm health declaration."
      );
    } finally {
      setHealthActionPending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Studio Lobby - Shruti Turner">
        <DashboardSkeleton />
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

  const totalCredits = summary.credits.balance;
  const referralBalance = Math.floor(summary.referral.balancePence / 100);
  const accessCard = getDashboardAccessCard(summary.membership, totalCredits);
  const shouldShowHealthPrompt = shouldPromptForHealthProfile(
    summary.healthDeclarationStatus,
    user?.hasConsentedToHealthData,
    user?.needsHealthDataConsentRefresh
  );
  const shouldShowHealthReviewPrompt = shouldPromptForHealthReview(
    summary.healthDeclarationNeedsReview
  );

  const entitlementLabel = (value: "membership" | "credit" | "manual") => {
    if (value === "membership") return "Membership";
    if (value === "credit") return "Credit";
    return "Booked";
  };

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

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>First name</span>
                    <Input
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Last name</span>
                    <Input
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      autoComplete="family-name"
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
                  disabled={
                    profileSubmitting ||
                    !profileFirstName.trim() ||
                    !profileLastName.trim() ||
                    !profileDob
                  }
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
                      , and I understand that I participate at my own risk
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
                  Your Private Studio is ready. Start with whatever feels manageable.
                </p>
                <div className="bg-secondary/30 text-muted-foreground space-y-3 rounded-lg p-4 text-left text-sm">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Book any yoga, strength, or cardio class from your schedule</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Credits are used when you book</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Classes adapt to how you feel on the day</span>
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
          eyebrow="Private Studio"
          title={
            <>
              {getGreeting()}, {user?.firstName || "there"}.
            </>
          }
          description="Here's your training overview for this week."
          meta={
            <Badge className="border-white/15 bg-white/10 text-[rgba(250,250,248,0.96)] shadow-none">
              {accessCard.statusBadgeLabel}
            </Badge>
          }
        />

        {shouldShowHealthPrompt ? (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-amber-900">
                Complete your health declaration before you book or join classes.
              </p>
              <p className="mt-1 text-xs text-amber-800">
                You can tell Shruti about relevant context, or confirm that there is nothing
                relevant to share right now.
              </p>
            </div>
            <Link href="/dashboard/health">
              <Button variant="outline">Complete health declaration</Button>
            </Link>
          </div>
        ) : null}

        {!shouldShowHealthPrompt && shouldShowHealthReviewPrompt ? (
          <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-sky-900">Please review your health declaration.</p>
              <p className="mt-1 text-xs text-sky-800">
                Confirm nothing has changed, or update it with any new injuries, flare patterns, or
                recovery changes.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={healthActionPending}
                onClick={() => void handleHealthConfirm()}
              >
                {healthActionPending ? "Confirming..." : "Nothing has changed"}
              </Button>
              <Link href="/dashboard/health">
                <Button>Update declaration</Button>
              </Link>
            </div>
          </div>
        ) : null}

        {referralBalance > 0 ? (
          <div className="border-brand-accent/20 bg-brand-accent/5 flex items-start gap-3 rounded-lg border p-4">
            <Gift className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm">
                You have <span className="text-brand-accent">£{referralBalance}</span> referral
                balance.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {summary.membership
                  ? "Applies to your next renewal"
                  : "Applies to your next purchase"}
              </p>
            </div>
          </div>
        ) : null}

        <AppMetricGrid>
          <AppMetricCard
            label="Upcoming classes"
            value={summary.upcomingClasses.length}
            detail="scheduled"
          />
          <AppMetricCard
            label="Weekly bookings"
            value={summary.attendance.thisWeekBookedCount}
            detail="this week"
          />
          <AppMetricCard
            label={accessCard.label}
            value={accessCard.value}
            detail={accessCard.detail}
          />
          <AppMetricCard
            label="Referral balance"
            value={`£${referralBalance}`}
            detail={referralBalance > 0 ? "available now" : "share your link to earn credit"}
          />
        </AppMetricGrid>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">Upcoming Classes</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Your booked sessions and quickest route back into the schedule.
              </p>
            </div>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm">
                View Full Schedule
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {summary.upcomingClasses.length === 0 ? (
            <AppEmptyState
              title="Your schedule is clear"
              description="Browse the schedule and book your next class. Start with whatever feels manageable."
              action={
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/dashboard/schedule">
                    <Button>
                      Browse Schedule
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  {shouldShowHealthPrompt ? (
                    <Link href="/dashboard/health">
                      <Button variant="outline">Complete Health Profile</Button>
                    </Link>
                  ) : null}
                </div>
              }
            />
          ) : (
            <div className="space-y-3">
              {summary.upcomingClasses.map((booking) => (
                <Link
                  key={booking.bookingId}
                  href={`/dashboard/classes/${booking.classSlug}?sessionId=${encodeURIComponent(booking.sessionId)}`}
                  className="bg-background hover:bg-secondary/20 hover:border-brand-accent/30 block rounded-lg border p-4 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p>{booking.className}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(booking.startsAtUtc).toLocaleString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {entitlementLabel(booking.entitlementType)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl">Quick Actions</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Jump straight to the parts of the studio you use most.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/schedule"
              className="bg-background rounded-lg border p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                <Calendar className="text-primary h-5 w-5" />
                <h3 className="text-lg">Book Next Class</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Browse this week&apos;s schedule and find your next session.
              </p>
            </Link>

            <Link
              href="/dashboard/small-groups"
              className="bg-background rounded-lg border p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                <Users className="text-primary h-5 w-5" />
                <h3 className="text-lg">Small Group Programmes</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Explore your small group programmes and longer-term training blocks.
              </p>
            </Link>

            <Link
              href={summary.membership ? "/dashboard/referrals" : "/dashboard/membership"}
              className="bg-background rounded-lg border p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                {summary.membership ? (
                  <Gift className="text-primary h-5 w-5" />
                ) : (
                  <CreditCard className="text-primary h-5 w-5" />
                )}
                <h3 className="text-lg">
                  {summary.membership ? "Refer a Friend" : "View Memberships"}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {summary.membership
                  ? "Give £10, get £10. Share your referral link."
                  : "Compare monthly, annual, and credit options for the studio."}
              </p>
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

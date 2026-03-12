"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
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
import type { DashboardSummaryDto } from "@/lib/api/types";
import { EMPTY_HEALTH_PROFILE, type HealthProfile } from "@/data/health-profile-data";
import { getGreeting } from "@/components/greeting";

type OnboardingStep = "profile" | "legal" | "welcome" | "source" | "health";

export function DashboardLobby({ initialData }: { initialData?: DashboardSummaryDto | null }) {
  const {
    user,
    isAdmin,
    completeOnboarding,
    acceptTermsAndHealth,
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

  const needsProfileDetails = Boolean(user) && (!user?.firstName?.trim() || !user?.lastName?.trim() || !user?.dob);
  const needsLegalAgreement = Boolean(user) && (!user?.hasAgreedToTerms || !user?.hasAgreedToHealth);

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
    if (!isOnboarding || isAdmin || !user) return;

    setShowOnboarding(true);
    setProfileFirstName(user.firstName || "");
    setProfileLastName(user.lastName || "");
    setProfileDob(user.dob || "");
    setHeardAboutSource(user.heardAboutSource || "");
    setHeardAboutDetail(user.heardAboutDetail || "");
    setLegalTerms(Boolean(user.hasAgreedToTerms));
    setLegalHealth(Boolean(user.hasAgreedToHealth));
    setProfileError("");

    if (needsProfileDetails) {
      setOnboardingStep("profile");
      return;
    }
    if (needsLegalAgreement) {
      setOnboardingStep("legal");
      return;
    }
    if (user.heardAboutSource) {
      setOnboardingStep("health");
      return;
    }
    setOnboardingStep("welcome");
  }, [isOnboarding, isAdmin, user, needsProfileDetails, needsLegalAgreement]);

  const finishOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
    setOnboardingStep("welcome");
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

      await refreshAccountProfile();
      setOnboardingStep(needsLegalAgreement ? "legal" : "welcome");
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error ? saveError.message : "Could not save profile details."
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleHealthSave = async (profile: HealthProfile) => {
    await fetch("/api/me/health-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => null);
    finishOnboarding();
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
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#56344A]/10">
                    <Shield className="h-8 w-8 text-[#56344A]" />
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
                  <p className="text-muted-foreground text-xs">You must be 18+ to use this service.</p>
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
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#56344A]/10">
                    <Shield className="h-8 w-8 text-[#56344A]" />
                  </div>
                  <h2 className="text-xl">Before We Begin</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    To use the studio, please review and accept the following. This is a one-time
                    step.
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 rounded-lg border p-4">
                    <input
                      type="checkbox"
                      checked={legalTerms}
                      onChange={(e) => setLegalTerms(e.target.checked)}
                      className="mt-0.5 accent-[#4B5B32]"
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
                      className="mt-0.5 accent-[#4B5B32]"
                    />
                    <span className="text-sm leading-relaxed">
                      I confirm I have read and agree to the{" "}
                      <Link href="/health-declaration" className="text-primary underline" target="_blank">
                        Health Declaration
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
                    setOnboardingStep("welcome");
                  }}
                >
                  Accept & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {onboardingStep === "welcome" ? (
              <div className="space-y-6 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/10">
                  <HeartPulse className="h-8 w-8 text-[#4B5B32]" />
                </div>
                <h2 className="text-2xl">Welcome, {user?.firstName || "there"}.</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your Private Studio is ready. Start with whatever feels manageable.
                </p>
                <div className="bg-secondary/30 space-y-3 rounded-lg p-4 text-left text-sm text-muted-foreground">
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
                <Button className="w-full" onClick={() => setOnboardingStep("source")}>
                  Next: How Did You Hear About Us?
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={finishOnboarding}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Skip and continue
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
                    <label key={option.value} className="flex items-center gap-3 rounded-lg border p-3">
                      <input
                        type="radio"
                        name="source"
                        value={option.value}
                        checked={heardAboutSource === option.value}
                        onChange={(e) => setHeardAboutSource(e.target.value)}
                        className="accent-[#4B5B32]"
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
                    setOnboardingStep("health");
                  }}
                >
                  Next: Tell Us About Your Body
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="text-center">
                  <button
                    onClick={finishOnboarding}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    Skip and continue
                  </button>
                </div>
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
                  onSkip={finishOnboarding}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl">{getGreeting()}, {user?.firstName || "there"}.</h1>
          <p className="text-muted-foreground mt-2">Here&apos;s your training overview for this week.</p>
        </div>

        {referralBalance > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-4">
            <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4B5B32]" />
            <div>
              <p className="text-sm">
                You have <span className="text-[#4B5B32]">£{referralBalance}</span> referral balance.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {summary.membership ? "Applies to your next renewal" : "Applies to your next purchase"}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-0">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Upcoming Classes</span>
                <Calendar className="h-4 w-4" />
              </div>
              <p className="text-3xl">{summary.upcomingClasses.length}</p>
              <p className="text-muted-foreground mt-1 text-xs">scheduled</p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Weekly Bookings</span>
                <CheckCircle className="h-4 w-4" />
              </div>
              <p className="text-3xl">{summary.attendance.thisWeekBookedCount}</p>
              <p className="text-muted-foreground mt-1 text-xs">this week</p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {summary.membership ? "Membership" : "Class Credits"}
                </span>
                <CreditCard className="h-4 w-4" />
              </div>
              <p className={summary.membership ? "text-lg text-[#4B5B32]" : "text-3xl"}>
                {summary.membership ? "Active" : totalCredits}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {summary.membership
                  ? "all live classes included"
                  : totalCredits === 1
                    ? "1 credit available"
                    : `${totalCredits} credits available`}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Referral Balance</span>
                <Gift className="h-4 w-4" />
              </div>
              <p className="text-3xl">£{referralBalance}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {referralBalance > 0 ? "available now" : "share your link to earn credit"}
              </p>
            </CardContent>
          </Card>
        </div>

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
            <div className="bg-background space-y-4 rounded-lg border p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4B5B32]/10">
                <Calendar className="h-7 w-7 text-[#4B5B32]" />
              </div>
              <div>
                <p className="text-lg">Your schedule is clear</p>
                <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm leading-relaxed">
                  Browse the schedule and book your next class. Start with whatever feels manageable.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                <Link href="/dashboard/schedule">
                  <Button>
                    Browse Schedule
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard/health">
                  <Button variant="outline">Complete Health Profile</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.upcomingClasses.map((booking) => (
                <Link
                  key={booking.bookingId}
                  href={`/dashboard/classes/${booking.classSlug}?sessionId=${encodeURIComponent(booking.sessionId)}`}
                  className="bg-background block rounded-lg border p-4 transition-colors hover:border-[#4B5B32]/30 hover:bg-secondary/20"
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
              href="/dashboard/programs"
              className="bg-background rounded-lg border p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                <Users className="text-primary h-5 w-5" />
                <h3 className="text-lg">Programs</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Explore your small group programs and longer-term training blocks.
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
                <h3 className="text-lg">{summary.membership ? "Refer a Friend" : "View Memberships"}</h3>
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

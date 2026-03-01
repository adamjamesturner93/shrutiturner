"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import {
  Calendar,
  CreditCard,
  ArrowRight,
  Users,
  Gift,
  CheckCircle,
  Dumbbell,
  Heart,
  Zap,
  Clock,
  AlertTriangle,
  History,
  Lightbulb,
  Bookmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import { HealthProfileEditor } from "../../components/health-profile-editor";
import { EMPTY_HEALTH_PROFILE, type HealthProfile } from "../../data/health-profile-data";
import { getGreeting } from "../../components/greeting";
import { useI18n } from "../../lib/use-i18n";
import { classDetails } from "../../data/schedule-data";
import { BookClassButton } from "../../components/booking-modal";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";

export function DashboardLobby() {
  const {
    user,
    membership,
    bookings,
    totalCredits,
    membershipClassesRemaining,
    referralCode,
    referralBalance,
    referralCount,
    completeOnboarding,
    isAdmin,
    creditExpiryDate,
    creditsExpiringSoon,
    attendanceHistory,
    favouriteClasses,
    getAdaptiveSuggestion,
    isClassBooked,
  } = useAuth();
  const { fmtTimeStr, fmtDate } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "health">("welcome");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Show onboarding overlay when URL has ?onboarding=true
  useEffect(() => {
    if (isOnboarding) {
      setShowOnboarding(true);
    }
  }, [isOnboarding]);

  const handleViewSchedule = () => {
    completeOnboarding();
    setShowOnboarding(false);
    setOnboardingStep("welcome");
    navigate("/dashboard/schedule", { replace: true });
  };

  const handleHealthSave = (profile: HealthProfile) => {
    console.log("Health profile saved:", profile);
    handleViewSchedule();
  };

  const handleHealthSkip = () => {
    handleViewSchedule();
  };

  const typeIcon = (type: string) => {
    if (type === "Yoga") return <Heart className="w-4 h-4 text-[#4B5B32]" />;
    if (type === "HIIT") return <Zap className="w-4 h-4 text-orange-600" />;
    return <Dumbbell className="w-4 h-4 text-primary" />;
  };

  const adaptiveSuggestion = getAdaptiveSuggestion();

  if (isLoading) {
    return (
      <DashboardLayout title="My Studio" description="Loading your dashboard...">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Credit expiry countdown
  const daysUntilExpiry = creditExpiryDate
    ? Math.ceil((new Date(creditExpiryDate).getTime() - Date.now()) / 86400000)
    : null;

  // Quick-book favourites — get class details for the slugs
  const quickBookClasses = favouriteClasses
    .map((slug) => classDetails.find((c) => c.slug === slug))
    .filter(Boolean)
    .filter((c) => !isClassBooked(c!.slug))
    .slice(0, 3) as typeof classDetails;

  return (
    <DashboardLayout title="Studio Lobby - Shruti Turner">
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in">
            {onboardingStep === "welcome" ? (
              /* Step 1: Welcome */
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-[#4B5B32]" />
                </div>
                <h2 className="text-2xl">Welcome, {user?.firstName}.</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your Private Studio is ready. Here you can browse the schedule,
                  book classes, and manage your membership. Start with what feels
                  manageable.
                </p>
                <div className="space-y-3 text-left text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Book any yoga, strength, or HIIT class from the schedule</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Credits are used when you book — one per class</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Can't make it live? Replays are available for 7 days</span>
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => setOnboardingStep("health")}>
                  Next: Tell Us About Your Body
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={handleViewSchedule}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip and go to schedule
                </button>
              </div>
            ) : (
              /* Step 2: Health profile */
              <div className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-xl">Your Health Profile</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This helps Shruti adapt every session for your body. You can
                    always update this later from your dashboard.
                  </p>
                </div>
                <HealthProfileEditor
                  profile={EMPTY_HEALTH_PROFILE}
                  onSave={handleHealthSave}
                  compact
                  onSkip={handleHealthSkip}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-2">
          {getGreeting()}, {user?.firstName}.
        </h1>
        <p className="text-muted-foreground">
          Here's your training overview for this week.
        </p>
      </div>

      {/* Credit expiry warning */}
      {!isAdmin && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">
              {creditsExpiringSoon} credit{creditsExpiringSoon !== 1 ? "s" : ""}{" "}
              {daysUntilExpiry <= 0
                ? "expired today"
                : daysUntilExpiry === 1
                  ? "will expire tomorrow"
                  : `will expire in ${daysUntilExpiry} days`}
              .{" "}
              <Link href="/dashboard/schedule" className="underline">
                Book a class
              </Link>{" "}
              or{" "}
              <Link href="/dashboard/membership" className="underline">
                purchase more credits
              </Link>{" "}
              to extend your expiry window.
            </p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4 mb-8`}>
        <div className="bg-background border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Upcoming Classes</span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl">{bookings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">this week</p>
        </div>

        {isAdmin ? (
          <div className="bg-background border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Access</span>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg">Unlimited (instructor)</p>
            <p className="text-xs text-muted-foreground mt-1">all classes included</p>
          </div>
        ) : (
          <>
            {membership && (
              <div className="bg-background border rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Membership Classes</span>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-3xl">
                  {membershipClassesRemaining}
                  <span className="text-base text-muted-foreground">
                    {" "}
                    / {membership.classesPerWeek === 99 ? "Unlimited" : membership.classesPerWeek}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">remaining this week</p>
              </div>
            )}

            <div className="bg-background border rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Class Credits</span>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl">{totalCredits}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {creditExpiryDate && daysUntilExpiry !== null && daysUntilExpiry > 0
                  ? `expires in ${daysUntilExpiry}d`
                  : "available"}
              </p>
            </div>

            <div className="bg-background border rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Referral Balance</span>
                <Gift className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl">£{referralBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {referralBalance > 0
                  ? membership
                    ? "off next renewal"
                    : "off next purchase"
                  : `${referralCount} friends joined`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Quick Book — favourite classes */}
      {!isAdmin && quickBookClasses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Quick Book</h2>
            <span className="text-xs text-muted-foreground">Your most-booked classes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickBookClasses.map((cls) => (
              <div
                key={cls.slug}
                className="bg-background border rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    {typeIcon(cls.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.day} {fmtTimeStr(cls.time)}</p>
                  </div>
                </div>
                <BookClassButton classSlug={cls.slug} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Upcoming Classes</h2>
          <Link href="/dashboard/schedule">
            <Button variant="ghost" size="sm">
              View Full Schedule
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-background border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">No classes booked yet.</p>
            <Link href="/dashboard/schedule">
              <Button>
                Browse Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-background border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    {typeIcon(booking.classType)}
                  </div>
                  <div>
                    <p className="text-sm">{booking.className}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.day} at {fmtTimeStr(booking.time)} · {booking.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/classes/${booking.classSlug}`}>
                    <Button size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adaptive suggestion */}
      {adaptiveSuggestion && !isAdmin && (
        <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-5 mb-8 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              {adaptiveSuggestion.reason}{" "}
              <Link href={`/dashboard/classes/${adaptiveSuggestion.classSlug}`}
                className="text-primary hover:underline"
              >
                {adaptiveSuggestion.className} ({adaptiveSuggestion.day} {fmtTimeStr(adaptiveSuggestion.time)})
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 mb-8`}>
        <Link href="/dashboard/schedule"
          className="bg-background border rounded-lg p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg">{isAdmin ? "View Schedule" : "Book Next Class"}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "See today's schedule and upcoming classes."
              : "Browse this week's schedule and find your next session."}
          </p>
        </Link>

        <Link href="/dashboard/programs"
          className="bg-background border rounded-lg p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Small Group Programs</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "View your active and upcoming programmes."
              : "Join a focused cohort with specific skill outcomes."}
          </p>
        </Link>

        {!isAdmin && (
          <Link href="/dashboard/referrals"
            className="bg-background border rounded-lg p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="text-lg">Refer a Friend</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Give £10, get £10. Share your referral link.
            </p>
          </Link>
        )}
      </div>

      {/* Recent attendance history */}
      {!isAdmin && attendanceHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl">Recent Activity</h2>
          </div>
          <div className="bg-background border rounded-lg divide-y">
            {attendanceHistory.slice(0, 5).map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    {typeIcon(record.classType)}
                  </div>
                  <div>
                    <p className="text-sm">{record.className}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(record.date)} · {fmtTimeStr(record.time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {record.preClass?.flareToday && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                      Flare day
                    </span>
                  )}
                  {record.postClass && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      record.postClass.feeling === "great"
                        ? "bg-[#4B5B32]/10 text-[#4B5B32]"
                        : record.postClass.feeling === "good"
                          ? "bg-blue-50 text-blue-700"
                          : record.postClass.feeling === "okay"
                            ? "bg-secondary text-muted-foreground"
                            : "bg-amber-50 text-amber-700"
                    }`}>
                      {record.postClass.feeling}
                    </span>
                  )}
                  {!record.postClass && (
                    <span className="text-xs text-muted-foreground">
                      No feedback
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {attendanceHistory.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing 5 of {attendanceHistory.length} attended classes
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

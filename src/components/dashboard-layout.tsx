"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { ScrollToTop } from "./scroll-to-top";
import { IconHorizontal, IconOnly } from "./icon";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  HeartPulse,
  Shield,
  ArrowRight,
  Compass,
  CalendarDays,
} from "lucide-react";
import { Button } from "./ui/button";
import { SEO } from "./seo";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

type LegalGuardModalProps = {
  initialTermsChecked: boolean;
  initialHealthChecked: boolean;
  onAccept: () => Promise<void>;
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Studio Lobby", icon: LayoutDashboard, exact: true },
  { path: "/dashboard/coaching", label: "Coaching", icon: Compass },
  { path: "/dashboard/retreats", label: "Retreats", icon: CalendarDays },
  { path: "/dashboard/health", label: "Health Profile", icon: HeartPulse },
  { path: "/dashboard/account", label: "Account", icon: Settings },
];

function LegalGuardModal({
  initialTermsChecked,
  initialHealthChecked,
  onAccept,
}: LegalGuardModalProps) {
  const [legalTermsChecked, setLegalTermsChecked] = useState(initialTermsChecked);
  const [legalHealthChecked, setLegalHealthChecked] = useState(initialHealthChecked);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-background w-full max-w-lg rounded-lg border shadow-xl">
        <div className="space-y-6 p-8">
          <div className="space-y-3 text-center">
            <div className="bg-brand-plum/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Shield className="text-brand-plum h-8 w-8" />
            </div>
            <h2 className="text-xl">Legal Agreements Required</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              To continue using the studio, please review and accept the current versions of these
              agreements.
            </p>
          </div>
          <div className="space-y-3">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                legalTermsChecked
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-border hover:bg-secondary/30"
              }`}
            >
              <input
                type="checkbox"
                checked={legalTermsChecked}
                onChange={(e) => setLegalTermsChecked(e.target.checked)}
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
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                legalHealthChecked
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-border hover:bg-secondary/30"
              }`}
            >
              <input
                type="checkbox"
                checked={legalHealthChecked}
                onChange={(e) => setLegalHealthChecked(e.target.checked)}
                className="accent-brand-accent mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                I confirm I have read and agree to the{" "}
                <Link href="/health-declaration" className="text-primary underline" target="_blank">
                  Health & Liability Waiver
                </Link>
                and I understand that I participate in all classes and programmes at my own risk
              </span>
            </label>
          </div>
          <Button
            size="lg"
            className="w-full"
            disabled={!legalTermsChecked || !legalHealthChecked}
            onClick={onAccept}
          >
            Accept & Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            The current Terms & Conditions and Health & Liability Waiver are required to use the
            studio.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const {
    authStatus,
    isProfileLoading,
    isSigningOut,
    user,
    logout,
    isAdmin,
    isAuthenticated,
    acceptTermsAndHealth,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onboardingInProgress = searchParams.get("onboarding") === "true";
  const isDashboardBootstrapping =
    authStatus === "loading" ||
    isSigningOut ||
    (isAuthenticated && !isAdmin && (isProfileLoading || !user));

  const needsOnboarding = Boolean(user) && !user?.onboarding.isComplete;
  const needsLegalAgreement = Boolean(user) && user?.onboarding.missingSteps.includes("legal");
  const shouldShowLegalGuard =
    isAuthenticated &&
    needsLegalAgreement &&
    !isAdmin &&
    !onboardingInProgress &&
    pathname !== "/dashboard" &&
    pathname !== "/dashboard/account";

  useEffect(() => {
    if (
      !isDashboardBootstrapping &&
      isAuthenticated &&
      needsOnboarding &&
      !isAdmin &&
      !onboardingInProgress &&
      pathname === "/dashboard"
    ) {
      router.replace("/dashboard?onboarding=true");
    }
  }, [
    isDashboardBootstrapping,
    isAuthenticated,
    needsOnboarding,
    isAdmin,
    onboardingInProgress,
    pathname,
    router,
  ]);

  // Auth + profile guard: hold dashboard UI until session and member profile are hydrated.
  if (isDashboardBootstrapping) {
    return (
      <div className="bg-secondary/20 flex min-h-screen items-center justify-center p-4">
        <div className="bg-background w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
          <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <div className="animate-pulse">
              <IconOnly className="h-8 w-auto" />
            </div>
          </div>
          <h2 className="text-lg">Preparing your studio</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSigningOut ? "Signing out..." : "Loading your dashboard details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(
      `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
    return (
      <div className="bg-secondary/20 flex min-h-screen items-center justify-center p-4">
        <SEO title="Sign In Required - Shruti Turner" noIndex />
        <div className="bg-background w-full max-w-sm space-y-6 rounded-lg border p-8 text-center shadow-xl">
          <div className="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
            <LogOut className="text-primary h-7 w-7" />
          </div>
          <div>
            <h2 className="mb-2 text-xl">Sign In Required</h2>
            <p className="text-muted-foreground text-sm">
              You need to sign in to access your account.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/login?redirect=${returnUrl}`}>
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredNavItems = NAV_ITEMS;

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-surface flex min-h-screen">
      <ScrollToTop />
      <SEO title={title || "Dashboard - Shruti Turner"} description={description} noIndex />

      {/* Sidebar – Desktop */}
      <aside className="border-brand-white/10 text-brand-white fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] shadow-[0_24px_80px_rgba(46,31,51,0.28)] lg:flex">
        {/* Brand */}
        <div className="border-brand-white/10 border-b p-6">
          <Link href="/" className="block">
            <IconHorizontal
              tone="white"
              alt="Shruti Turner"
              className="h-10 w-auto transition-opacity hover:opacity-90"
            />
          </Link>
        </div>

        {/* User card */}
        {user && (
          <div className="border-brand-white/10 border-b p-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent-light text-brand-dark flex h-10 w-10 items-center justify-center rounded-full text-sm">
                {user.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive(item.path, item.exact)
                      ? "bg-brand-accent-light/20 text-brand-accent-light"
                      : "text-brand-white/70 hover:bg-brand-white/5 hover:text-brand-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin link (instructor only) */}
        {isAdmin && (
          <div className="px-3 pb-2">
            <Link
              href="/admin"
              className="bg-brand-accent-light/10 text-brand-accent-light hover:bg-brand-accent-light/20 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Instructor Dashboard</span>
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="border-brand-white/10 border-t p-4">
          <button
            onClick={handleLogout}
            className="text-brand-white/50 hover:text-brand-white flex w-full items-center gap-3 text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="border-brand-white/10 text-brand-white fixed inset-x-0 top-0 z-40 border-b bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] shadow-[0_18px_50px_rgba(46,31,51,0.22)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard">
            <IconHorizontal tone="white" alt="Shruti Turner" className="h-7 w-auto" />
          </Link>
          <div className="bg-brand-accent-light text-brand-dark flex h-8 w-8 items-center justify-center rounded-full text-xs">
            {user?.avatarInitials || "?"}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="text-brand-white absolute inset-y-0 left-0 flex w-72 flex-col bg-[linear-gradient(180deg,rgba(46,31,51,0.99),rgba(86,52,74,0.99))] shadow-[0_24px_70px_rgba(46,31,51,0.3)]">
            <div className="border-brand-white/10 flex items-center justify-between border-b p-4">
              <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
                <IconHorizontal tone="white" alt="Shruti Turner" className="h-7 w-auto" />
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <div className="border-brand-white/10 border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-accent-light text-brand-dark flex h-10 w-10 items-center justify-center rounded-full text-sm">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm">{user.firstName}</p>
                  </div>
                </div>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-3">
                {filteredNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                        isActive(item.path, item.exact)
                          ? "bg-brand-accent-light/20 text-brand-accent-light"
                          : "text-brand-white/70 hover:bg-brand-white/5"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {isAdmin && (
              <div className="px-3 pb-2">
                <Link
                  href="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="bg-brand-accent-light/10 text-brand-accent-light hover:bg-brand-accent-light/20 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>Instructor Dashboard</span>
                </Link>
              </div>
            )}
            <div className="border-brand-white/10 border-t p-4">
              <button
                onClick={handleLogout}
                className="text-brand-white/50 hover:text-brand-white flex w-full items-center gap-3 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen flex-1 pt-14 lg:ml-72 lg:pt-0">
        <div className="mx-auto max-w-7xl p-6 md:p-8 lg:p-10">{children}</div>
      </main>

      {/* Route-level legal agreement guard */}
      {shouldShowLegalGuard && (
        <LegalGuardModal
          key={`${user?.id}-${user?.hasAgreedToTerms}-${user?.hasAgreedToHealth}`}
          initialTermsChecked={Boolean(user?.hasAgreedToTerms)}
          initialHealthChecked={Boolean(user?.hasAgreedToHealth)}
          onAccept={() => acceptTermsAndHealth(true, true)}
        />
      )}
    </div>
  );
}

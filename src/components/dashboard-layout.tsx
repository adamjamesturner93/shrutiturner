"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { ScrollToTop } from "./scroll-to-top";
import { IconHorizontal, IconOnly } from "./icon";
import {
  LayoutDashboard,
  Settings,
  Globe,
  LogOut,
  Menu,
  Shield,
  ArrowRight,
  Compass,
  CalendarDays,
  BookOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import { SEO } from "./seo";
import { LoadingRegion } from "./loading-region";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Only for setup screens that render and enforce their own current legal agreements. */
  handlesLegalAgreements?: boolean;
}

type LegalGuardModalProps = {
  initialTermsChecked: boolean;
  initialHealthChecked: boolean;
  onAccept: () => Promise<void>;
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/dashboard/coaching", label: "Coaching", icon: Compass },
  { path: "/dashboard/programmes", label: "Programmes", icon: BookOpen },
  { path: "/dashboard/events", label: "Events", icon: CalendarDays },
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

export function DashboardLayout({
  children,
  title,
  description,
  handlesLegalAgreements = false,
}: DashboardLayoutProps) {
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
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onboardingInProgress = searchParams.get("onboarding") === "true";
  const isDashboardBootstrapping =
    authStatus === "loading" ||
    isSigningOut ||
    (isAuthenticated && !isAdmin && (isProfileLoading || !user));

  const [ownedNav, setOwnedNav] = useState<string[]>(["Dashboard", "Account"]);
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    fetch("/api/me/hub", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { nav: { label: string }[] } | null) => {
        if (active && data) setOwnedNav(data.nav.map((item) => item.label));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuthenticated, pathname]);
  const needsLegalAgreement = Boolean(user) && user?.onboarding.missingSteps.includes("legal");
  const shouldShowLegalGuard =
    !pathname.startsWith("/dashboard/programmes") &&
    !pathname.startsWith("/dashboard/events") &&
    isAuthenticated &&
    needsLegalAgreement &&
    !handlesLegalAgreements &&
    !isAdmin &&
    !onboardingInProgress &&
    pathname !== "/dashboard" &&
    pathname !== "/dashboard/account";

  // Auth + profile guard: hold dashboard UI until session and member profile are hydrated.
  if (isDashboardBootstrapping) {
    return (
      <LoadingRegion
        label={isSigningOut ? "Signing out" : "Preparing your private studio"}
        className="min-h-screen"
      >
        <div className="bg-secondary/20 flex min-h-screen items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
            <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <div className="animate-pulse">
                <IconOnly className="h-8 w-auto" />
              </div>
            </div>
            <h2 className="text-lg">Preparing your studio</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {isSigningOut ? "Signing out…" : "Loading your dashboard details…"}
            </p>
          </div>
        </div>
      </LoadingRegion>
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

  const filteredNavItems = NAV_ITEMS.filter((item) => ownedNav.includes(item.label));

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-surface flex min-h-screen">
      <a
        href="#studio-main"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded focus:p-3"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <SEO title={title || "Dashboard - Shruti Turner"} description={description} noIndex />

      {/* Sidebar – Desktop */}
      <aside className="border-brand-white/10 text-brand-white fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] shadow-[0_24px_80px_rgba(46,31,51,0.28)] lg:flex">
        {/* Brand */}
        <div className="border-brand-white/10 border-b p-6">
          <Link href="/" className="block">
            <IconHorizontal tone="white" alt="Shruti Turner" className="h-auto w-full max-w-60" />
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
        <nav aria-label="Studio" className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  aria-current={isActive(item.path, item.exact) ? "page" : undefined}
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
        <div className="px-3 pb-2">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="text-brand-white/80 hover:bg-brand-white/5 flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm"
          >
            <Globe aria-hidden="true" className="h-4 w-4" />
            Visit website
          </Link>
        </div>
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
            className="text-brand-white/80 hover:text-brand-white flex w-full items-center gap-3 text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="border-brand-white/10 text-brand-white fixed inset-x-0 top-0 z-40 border-b bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] shadow-[0_18px_50px_rgba(46,31,51,0.22)] lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <SheetTrigger asChild>
              <button
                aria-label="Open studio menu"
                className="flex h-9 w-9 items-center justify-center"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <Link href="/">
              <IconHorizontal tone="white" alt="Shruti Turner" className="h-7 w-auto" />
            </Link>
            <div className="bg-brand-accent-light text-brand-dark flex h-8 w-8 items-center justify-center rounded-full text-xs">
              {user?.avatarInitials || "?"}
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        <SheetContent
          side="left"
          className="text-brand-white w-72 gap-0 border-0 bg-[linear-gradient(180deg,rgba(46,31,51,0.99),rgba(86,52,74,0.99))]"
        >
          <SheetTitle className="sr-only">Studio navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Your bookings, coaching and account.
          </SheetDescription>
          <div className="border-brand-white/10 flex items-center justify-between border-b p-4">
            <Link href="/" onClick={() => setSidebarOpen(false)}>
              <IconHorizontal tone="white" alt="Shruti Turner" className="h-7 w-auto" />
            </Link>
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
          <nav aria-label="Studio mobile" className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    aria-current={isActive(item.path, item.exact) ? "page" : undefined}
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
          <div className="px-3 pb-2">
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="text-brand-white/80 hover:bg-brand-white/5 flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm"
            >
              <Globe aria-hidden="true" className="h-4 w-4" />
              Visit website
            </Link>
          </div>
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
              className="text-brand-white/80 hover:text-brand-white flex w-full items-center gap-3 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main
        id="studio-main"
        tabIndex={-1}
        className="min-h-screen min-w-0 flex-1 pt-14 lg:ml-72 lg:pt-0"
      >
        <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
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

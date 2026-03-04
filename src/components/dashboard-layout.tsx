import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useState } from "react";
import { useAuth } from "../context/auth-context";
import { ScrollToTop } from "./scroll-to-top";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Mountain,
  CreditCard,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  HeartPulse,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { SEO } from "./seo";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const NAV_ITEMS = [
  { path: "/dashboard", label: "Studio Lobby", icon: LayoutDashboard, exact: true },
  { path: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { path: "/dashboard/programs", label: "Programs", icon: Users },
  { path: "/dashboard/retreats", label: "Retreats", icon: Mountain },
  { path: "/dashboard/membership", label: "Membership", icon: CreditCard, memberOnly: true },
  { path: "/dashboard/referrals", label: "Referrals", icon: Gift, memberOnly: true },
  { path: "/dashboard/health", label: "Health Profile", icon: HeartPulse },
  { path: "/account", label: "Account", icon: Settings },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const {
    user,
    logout,
    membership,
    totalCredits,
    membershipClassesRemaining,
    referralBalance,
    isAdmin,
    isAuthenticated,
  } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard: redirect unauthenticated users to login
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
              You need to sign in to access your Private Studio.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/login?redirect=${returnUrl}`}>
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredNavItems = NAV_ITEMS.filter((item) => !item.memberOnly || !isAdmin);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="bg-secondary/20 flex min-h-screen">
      <ScrollToTop />
      <SEO title={title || "Dashboard - Shruti Turner"} description={description} noIndex />

      {/* Sidebar – Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#2E1F33] text-[#FAFAF8] lg:flex">
        {/* Brand */}
        <div className="border-b border-[#FAFAF8]/10 p-6">
          <Link href="/" className="text-lg tracking-tight transition-colors hover:text-[#B5C49B]">
            Shruti Turner
          </Link>
          <p className="mt-1 text-xs text-[#FAFAF8]/50">Private Studio</p>
        </div>

        {/* User card */}
        {user && (
          <div className="border-b border-[#FAFAF8]/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B5C49B] text-sm text-[#2E1F33]">
                {user.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-[#FAFAF8]/50">
                  {membership ? membership.label : "No plan"}
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
                      ? "bg-[#B5C49B]/20 text-[#B5C49B]"
                      : "text-[#FAFAF8]/70 hover:bg-[#FAFAF8]/5 hover:text-[#FAFAF8]"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Credit summary */}
        {!isAdmin && (
          <div className="border-t border-[#FAFAF8]/10 p-4">
            <div className="space-y-2 text-xs text-[#FAFAF8]/60">
              {membership && membership.plan !== "instructor" && (
                <div className="flex justify-between">
                  <span>Weekly classes left</span>
                  <span className="text-[#B5C49B]">{membershipClassesRemaining}</span>
                </div>
              )}
              {totalCredits > 0 && (
                <div className="flex justify-between">
                  <span>Class credits</span>
                  <span className="text-[#B5C49B]">{totalCredits}</span>
                </div>
              )}
              {referralBalance > 0 && (
                <div className="flex justify-between">
                  <span>Referral balance</span>
                  <span className="text-[#B5C49B]">£{referralBalance}</span>
                </div>
              )}
              {!membership && totalCredits === 0 && referralBalance === 0 && (
                <div className="flex justify-between">
                  <span>Credits</span>
                  <span className="text-[#FAFAF8]/40">0</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin link (instructor only) */}
        {isAdmin && (
          <div className="px-3 pb-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-md bg-[#B5C49B]/10 px-3 py-2.5 text-sm text-[#B5C49B] transition-colors hover:bg-[#B5C49B]/20"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Instructor Dashboard</span>
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-[#FAFAF8]/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 text-sm text-[#FAFAF8]/50 transition-colors hover:text-[#FAFAF8]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-[#FAFAF8]/10 bg-[#2E1F33] text-[#FAFAF8] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="text-sm tracking-tight">
            Private Studio
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B5C49B] text-xs text-[#2E1F33]">
            {user?.avatarInitials || "?"}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#2E1F33] text-[#FAFAF8]">
            <div className="flex items-center justify-between border-b border-[#FAFAF8]/10 p-4">
              <span className="text-sm">Private Studio</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <div className="border-b border-[#FAFAF8]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B5C49B] text-sm text-[#2E1F33]">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm">{user.firstName}</p>
                    <p className="text-xs text-[#FAFAF8]/50">
                      {membership ? membership.label : "No plan"}
                    </p>
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
                          ? "bg-[#B5C49B]/20 text-[#B5C49B]"
                          : "text-[#FAFAF8]/70 hover:bg-[#FAFAF8]/5"
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
                  className="flex items-center gap-3 rounded-md bg-[#B5C49B]/10 px-3 py-2.5 text-sm text-[#B5C49B] transition-colors hover:bg-[#B5C49B]/20"
                >
                  <Shield className="h-4 w-4" />
                  <span>Instructor Dashboard</span>
                </Link>
              </div>
            )}
            <div className="border-t border-[#FAFAF8]/10 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen flex-1 pt-14 lg:ml-64 lg:pt-0">
        <div className="max-w-6xl p-6 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}

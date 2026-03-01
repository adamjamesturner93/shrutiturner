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
  const { user, logout, membership, totalCredits, membershipClassesRemaining, referralBalance, isAdmin, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard: redirect unauthenticated users to login
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
        <SEO title="Sign In Required - Shruti Turner" noIndex />
        <div className="bg-background border rounded-lg shadow-xl max-w-sm w-full p-8 text-center space-y-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <LogOut className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl mb-2">Sign In Required</h2>
            <p className="text-sm text-muted-foreground">
              You need to sign in to access your Private Studio.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/login?redirect=${returnUrl}`}>
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">Create Account</Button>
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
    <div className="min-h-screen flex bg-secondary/20">
      <ScrollToTop />
      <SEO title={title || "Dashboard - Shruti Turner"} description={description} noIndex />

      {/* Sidebar – Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#2E1F33] text-[#FAFAF8] fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="p-6 border-b border-[#FAFAF8]/10">
          <Link href="/" className="text-lg tracking-tight hover:text-[#B5C49B] transition-colors">
            Shruti Turner
          </Link>
          <p className="text-xs text-[#FAFAF8]/50 mt-1">Private Studio</p>
        </div>

        {/* User card */}
        {user && (
          <div className="p-4 border-b border-[#FAFAF8]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B5C49B] text-[#2E1F33] flex items-center justify-center text-sm">
                {user.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[#FAFAF8]/50 truncate">
                  {membership ? membership.label : "No plan"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive(item.path, item.exact)
                      ? "bg-[#B5C49B]/20 text-[#B5C49B]"
                      : "text-[#FAFAF8]/70 hover:bg-[#FAFAF8]/5 hover:text-[#FAFAF8]"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Credit summary */}
        {!isAdmin && (
        <div className="p-4 border-t border-[#FAFAF8]/10">
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
            <Link href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm bg-[#B5C49B]/10 text-[#B5C49B] hover:bg-[#B5C49B]/20 transition-colors"
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Instructor Dashboard</span>
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-[#FAFAF8]/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#2E1F33] text-[#FAFAF8] border-b border-[#FAFAF8]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/dashboard" className="text-sm tracking-tight">
            Private Studio
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#B5C49B] text-[#2E1F33] flex items-center justify-center text-xs">
            {user?.avatarInitials || "?"}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-72 bg-[#2E1F33] text-[#FAFAF8] flex flex-col">
            <div className="p-4 border-b border-[#FAFAF8]/10 flex items-center justify-between">
              <span className="text-sm">Private Studio</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {user && (
              <div className="p-4 border-b border-[#FAFAF8]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B5C49B] text-[#2E1F33] flex items-center justify-center text-sm">
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
            <nav className="flex-1 py-4 overflow-y-auto">
              <ul className="space-y-1 px-3">
                {filteredNavItems.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive(item.path, item.exact)
                          ? "bg-[#B5C49B]/20 text-[#B5C49B]"
                          : "text-[#FAFAF8]/70 hover:bg-[#FAFAF8]/5"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {isAdmin && (
              <div className="px-3 pb-2">
                <Link href="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm bg-[#B5C49B]/10 text-[#B5C49B] hover:bg-[#B5C49B]/20 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Instructor Dashboard</span>
                </Link>
              </div>
            )}
            <div className="p-4 border-t border-[#FAFAF8]/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 md:p-8 lg:p-10 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

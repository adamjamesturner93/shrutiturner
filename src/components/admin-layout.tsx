import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { AdminGuardWrapper } from "./admin-guard";
import { useAuth } from "../context/auth-context";
import { ScrollToTop } from "./scroll-to-top";
import { SEO } from "./seo";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Mountain,
  Mail,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Shield,
  TrendingUp,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/classes", label: "Classes", icon: Calendar },
  { path: "/admin/programmes", label: "Programmes", icon: Dumbbell },
  { path: "/admin/members", label: "Members", icon: Users },
  { path: "/admin/retreats", label: "Retreats", icon: Mountain },
  { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { path: "/admin/business", label: "Business", icon: TrendingUp },
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <AdminGuardWrapper>
      <div className="flex min-h-screen bg-[#FAFAF8]">
        <ScrollToTop />
        <SEO title={title || "Admin - Shruti Turner"} description={description} noIndex />

        {/* Sidebar - Desktop */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#2E1F33] text-[#FAFAF8] lg:flex">
          {/* Brand */}
          <div className="border-b border-[#FAFAF8]/10 p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#B5C49B]" />
              <div>
                <Link
                  href="/admin"
                  className="text-lg tracking-tight transition-colors hover:text-[#B5C49B]"
                >
                  Shruti Turner
                </Link>
                <p className="text-xs text-[#FAFAF8]/50">Instructor Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => (
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

          {/* Bottom links */}
          <div className="space-y-2 border-t border-[#FAFAF8]/10 p-4">
            <Link
              href="/dashboard"
              className="flex w-full items-center gap-3 text-sm text-[#FAFAF8]/50 transition-colors hover:text-[#FAFAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Private Studio</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 text-sm text-[#FAFAF8]/50 transition-colors hover:text-[#FAFAF8]"
            >
              <LogOut className="h-4 w-4" />
              <span>Back to Site</span>
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="fixed inset-x-0 top-0 z-40 border-b border-[#FAFAF8]/10 bg-[#2E1F33] text-[#FAFAF8] lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#B5C49B]" />
              <span className="text-sm tracking-tight">Admin</span>
            </div>
            <div className="w-5" />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#2E1F33] text-[#FAFAF8]">
              <div className="flex items-center justify-between border-b border-[#FAFAF8]/10 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#B5C49B]" />
                  <span className="text-sm">Instructor Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                  {NAV_ITEMS.map((item) => (
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
              <div className="space-y-2 border-t border-[#FAFAF8]/10 p-4">
                <Link
                  href="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Private Studio</span>
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1 pt-14 lg:ml-64 lg:pt-0">
          <div className="max-w-7xl p-6 md:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </AdminGuardWrapper>
  );
}

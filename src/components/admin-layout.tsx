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
    <div className="min-h-screen flex bg-[#FAFAF8]">
      <ScrollToTop />
      <SEO
        title={title || "Admin - Shruti Turner"}
        description={description}
        noIndex
      />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#2E1F33] text-[#FAFAF8] fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="p-6 border-b border-[#FAFAF8]/10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B5C49B]" />
            <div>
              <Link
                href="/admin"
                className="text-lg tracking-tight hover:text-[#B5C49B] transition-colors"
              >
                Shruti Turner
              </Link>
              <p className="text-xs text-[#FAFAF8]/50">Instructor Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
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

        {/* Bottom links */}
        <div className="p-4 border-t border-[#FAFAF8]/10 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Private Studio</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Back to Site</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#2E1F33] text-[#FAFAF8] border-b border-[#FAFAF8]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B5C49B]" />
            <span className="text-sm tracking-tight">Admin</span>
          </div>
          <div className="w-5" />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 inset-y-0 w-72 bg-[#2E1F33] text-[#FAFAF8] flex flex-col">
            <div className="p-4 border-b border-[#FAFAF8]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#B5C49B]" />
                <span className="text-sm">Instructor Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              <ul className="space-y-1 px-3">
                {NAV_ITEMS.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
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
            <div className="p-4 border-t border-[#FAFAF8]/10 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Private Studio</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl">{children}</div>
      </main>
    </div>
    </AdminGuardWrapper>
  );
}

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Compass,
  MessageCircle,
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
  { path: "/admin/coaching", label: "Coaching", icon: Compass },
  { path: "/admin/programmes", label: "Programmes", icon: Dumbbell },
  { path: "/admin/members", label: "Members", icon: Users },
  { path: "/admin/retreats", label: "Retreats", icon: Mountain },
  { path: "/admin/blog-comments", label: "Blog Comments", icon: MessageCircle },
  { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { path: "/admin/business", label: "Business", icon: TrendingUp },
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AdminGuardWrapper>
      <div className="bg-brand-white flex min-h-screen">
        <ScrollToTop />
        <SEO title={title || "Admin - Shruti Turner"} description={description} noIndex />

        {/* Sidebar - Desktop */}
        <aside className="bg-brand-dark text-brand-white fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
          {/* Brand */}
          <div className="border-brand-white/10 border-b p-6">
            <div className="flex items-center gap-2">
              <Shield className="text-brand-accent-light h-5 w-5" />
              <div>
                <Link
                  href="/admin"
                  className="hover:text-brand-accent-light text-lg tracking-tight transition-colors"
                >
                  Shruti Turner
                </Link>
                <p className="text-brand-white/50 text-xs">Instructor Admin</p>
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

          {/* Bottom links */}
          <div className="border-brand-white/10 space-y-2 border-t p-4">
            <Link
              href="/dashboard"
              className="text-brand-white/50 hover:text-brand-white flex w-full items-center gap-3 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Private Studio</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-brand-white/50 hover:text-brand-white flex w-full items-center gap-3 text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Back to Site</span>
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="border-brand-white/10 bg-brand-dark text-brand-white fixed inset-x-0 top-0 z-40 border-b lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="text-brand-accent-light h-4 w-4" />
              <span className="text-sm tracking-tight">Admin</span>
            </div>
            <div className="w-5" />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="bg-brand-dark text-brand-white absolute inset-y-0 left-0 flex w-72 flex-col">
              <div className="border-brand-white/10 flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Shield className="text-brand-accent-light h-4 w-4" />
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
              <div className="border-brand-white/10 space-y-2 border-t p-4">
                <Link
                  href="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="text-brand-white/50 hover:text-brand-white flex w-full items-center gap-3 text-sm"
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

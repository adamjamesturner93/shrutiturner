"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AdminGuardWrapper } from "@/components/admin-guard";
import { useAuth } from "@/context/auth-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SEO } from "@/components/seo";
import { IconHorizontal } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Mail,
  Compass,
  MessageCircle,
  Menu,
  LogOut,
  ArrowLeft,
  TrendingUp,
  Shield,
  CalendarDays,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/coaching", label: "Coaching", icon: Compass },
  { path: "/admin/programmes", label: "Programmes", icon: CalendarDays },
  { path: "/admin/retreats", label: "Retreats & workshops", icon: CalendarDays },
  { path: "/admin/members", label: "Members", icon: Users },
  { path: "/admin/blog-comments", label: "Blog comments", icon: MessageCircle },
  { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { path: "/admin/business", label: "Business", icon: TrendingUp },
  { path: "/admin/audit", label: "Audit", icon: Shield },
];

export function AdminLayout({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      await logout();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const navigation = (
    <>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.path
              : pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-white/20 p-4">
        <Link href="/dashboard" className="flex min-h-11 items-center gap-3 text-sm text-white/90">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Private Studio
        </Link>
        <Link href="/" className="flex min-h-11 items-center gap-3 text-sm text-white/90">
          <ExternalLink aria-hidden="true" className="size-4" />
          View website
        </Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="flex min-h-11 w-full items-center gap-3 text-sm text-white/90 disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        {signOutError ? (
          <p role="alert" className="text-sm text-white">
            {signOutError}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <AdminGuardWrapper>
      <div className="admin-surface flex min-h-screen">
        <ScrollToTop />
        <SEO title={title || "Admin - Shruti Turner"} description={description} noIndex />
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-white focus:p-3 focus:text-black"
        >
          Skip to main content
        </a>
        <aside className="bg-brand-dark fixed inset-y-0 left-0 z-40 hidden w-72 flex-col text-white lg:flex">
          <div className="border-b border-white/20 p-6">
            <Link href="/admin">
              <IconHorizontal tone="white" alt="Shruti Turner admin" className="h-10 w-auto" />
            </Link>
            <p className="mt-2 text-xs text-white/80">Admin</p>
          </div>
          {navigation}
        </aside>
        <header className="bg-brand-dark fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-4 px-4 text-white lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-white hover:bg-white/10 hover:text-white"
                aria-label="Open admin navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-brand-dark w-72 max-w-[90vw] gap-0 text-white [&>button]:size-11 [&>button]:text-white"
            >
              <SheetHeader>
                <SheetTitle className="text-white">Admin navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Manage events, members and your business.
                </SheetDescription>
              </SheetHeader>
              {navigation}
            </SheetContent>
          </Sheet>
          <IconHorizontal tone="white" alt="Shruti Turner admin" className="h-7 w-auto" />
        </header>
        <main
          id="admin-main"
          tabIndex={-1}
          className="min-h-screen min-w-0 flex-1 pt-16 lg:ml-72 lg:pt-0"
        >
          <div className="mx-auto max-w-[92rem] p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuardWrapper>
  );
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shouldRedirectPublicPathInHolding } from "@/lib/site-stage";
import {
  getCanonicalProductionSiteUrl,
  shouldRedirectToCanonicalProductionHost,
} from "@/lib/app-url";
import { env, getAdminEmailAllowlist } from "@/lib/env";
import { isStaffAdminRole } from "@/lib/authz/roles";

const ADMIN_EMAILS = getAdminEmailAllowlist();

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  if (
    env.VERCEL_ENV === "production" &&
    shouldRedirectToCanonicalProductionHost(req.nextUrl.hostname)
  ) {
    const canonicalUrl = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      getCanonicalProductionSiteUrl()
    );
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (shouldRedirectPublicPathInHolding(pathname)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const isAuthed = Boolean(req.auth?.user);
  const user = req.auth?.user as { role?: string; email?: string | null } | undefined;
  const role =
    user?.role ||
    (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "owner_admin" : "student");

  if (!isAuthed && (pathname.startsWith("/dashboard") || pathname.startsWith("/account"))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!isStaffAdminRole(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shouldRedirectPublicPathInHolding } from "@/lib/site-stage";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "tech@thechronicyogini.com,shruti@shrutiturner.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  if (shouldRedirectPublicPathInHolding(pathname)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const isAuthed = Boolean(req.auth?.user);
  const user = req.auth?.user as { role?: string; email?: string | null } | undefined;
  const role =
    user?.role ||
    (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "admin" : "student");

  if (!isAuthed && (pathname.startsWith("/dashboard") || pathname.startsWith("/account"))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

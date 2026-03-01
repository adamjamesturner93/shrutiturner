"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Mail, Gift, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/auth-context";

/** Email addresses with instructor access (mirrors auth-context list) */
const ADMIN_EMAILS = ["shruti@shrutiturner.com"];

export function LoginPage() {
  const { isAuthenticated, isAdmin, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justLoggedIn = useRef(false);
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);

  const redirectTo = searchParams.get("redirect");
  const intent = searchParams.get("intent");
  const refCode = searchParams.get("ref");

  const [loginMethod, setLoginMethod] = useState<
    "passwordless" | "google" | null
  >(null);
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  // If user navigates to /login while already authenticated, redirect them.
  // The ref prevents this from firing right after the login handlers navigate.
  useEffect(() => {
    if (isAuthenticated && !justLoggedIn.current) {
      navigate(redirectTo || (isAdmin ? "/admin" : "/dashboard"), { replace: true });
    }
  }, [isAuthenticated, isAdmin, redirectTo, router]);

  const getPostLoginRedirect = (loginEmail: string) => {
    if (redirectTo) return redirectTo;
    if (ADMIN_EMAILS.includes(loginEmail.toLowerCase().trim())) return "/admin";
    return "/dashboard?onboarding=true";
  };

  const handlePasswordlessLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSent) {
      console.log("Sending code to:", email);
      setCodeSent(true);
    } else {
      console.log("Verifying code:", code);
      justLoggedIn.current = true;
      login(email);
      if (refCode) console.log("Applying referral code:", refCode);
      navigate(getPostLoginRedirect(email), { replace: true });
    }
  };

  const handleGoogleLogin = () => {
    console.log("Initiating Google login");
    justLoggedIn.current = true;
    login("google@example.com");
    if (refCode) console.log("Applying referral code:", refCode);
    navigate(getPostLoginRedirect("google@example.com"), { replace: true });
  };

  /** Demo shortcut — log in directly as the instructor */
  const handleInstructorDemo = () => {
    justLoggedIn.current = true;
    login("shruti@shrutiturner.com");
    navigate("/admin", { replace: true });
  };

  return (
    <Layout>
      <SEO
        title="Login - Shruti Turner"
        description="Access your personalized training programs, class schedules, and coaching resources."
        canonicalUrl="https://shrutiturner.com/login"
        noIndex
      />

      <section className="py-20 md:py-28 min-h-screen flex items-center">
        <div className="container mx-auto px-4 max-w-md">
          {/* Referral banner */}
          {refCode && (
            <div className="bg-[#4B5B32]/10 border border-[#4B5B32]/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Gift className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  £10 credit will be applied to your account after sign-up.
                </p>
              </div>
            </div>
          )}

          {/* Intent banner */}
          {intent === "book" && !refCode && (
            <div className="bg-secondary/50 border rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to complete your booking.
              </p>
            </div>
          )}

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl text-center">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center">
                Sign in to access your training programs and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!loginMethod ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setLoginMethod("passwordless")}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Continue with Email
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>
                      New here?{" "}
                      <Link
                        href={`/signup${refCode ? `?ref=${refCode}` : ""}`}
                        className="text-primary hover:underline"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              ) : loginMethod === "passwordless" ? (
                <form
                  onSubmit={handlePasswordlessLogin}
                  className="space-y-4"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setLoginMethod(null);
                      setCodeSent(false);
                      setEmail("");
                      setCode("");
                    }}
                    className="mb-4"
                  >
                    &larr; Back to options
                  </Button>

                  {!codeSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        Send Verification Code
                      </Button>

                      <p className="text-sm text-muted-foreground text-center">
                        We'll send a 6-digit code to your email
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <Input
                          id="code"
                          type="text"
                          placeholder="000000"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Code sent to {email}
                        </p>
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        Verify & Sign In
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCodeSent(false)}
                        className="w-full"
                      >
                        Resend code
                      </Button>
                    </>
                  )}
                </form>
              ) : null}
            </CardContent>
          </Card>

          {/* Demo login shortcuts (development only) */}
          <div className="mt-6 p-4 rounded-lg border border-dashed border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo shortcuts (development only)
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  justLoggedIn.current = true;
                  login("sarah.chen@example.com");
                  navigate("/dashboard", { replace: true });
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign in as Sarah (Member)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleInstructorDemo}
              >
                <Shield className="w-4 h-4 mr-2" />
                Sign in as Shruti (Instructor)
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

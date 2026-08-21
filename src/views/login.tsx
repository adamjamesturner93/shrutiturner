"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Gift, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";
import { IconHorizontal } from "@/components/icon";

export function LoginPage({
  redirectTo,
  intent,
  refCode,
  emailHint,
}: {
  redirectTo?: string | null;
  intent?: string | null;
  refCode?: string | null;
  emailHint?: string | null;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<"passwordless" | "google" | null>(null);
  const [email, setEmail] = useState(emailHint || "");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const referralClaimedRef = useRef(false);

  const buildPostLoginUrl = () => {
    const params = new URLSearchParams();
    const safeRedirect = sanitizeRedirectPath(redirectTo);
    if (safeRedirect) {
      params.set("redirect", safeRedirect);
    }
    if (refCode) {
      params.set("ref", refCode);
    }
    const query = params.toString();
    return query ? `/auth/post-login?${query}` : "/auth/post-login";
  };

  useEffect(() => {
    const claimAndRedirect = async () => {
      if (status !== "authenticated") return;
      if (refCode && !referralClaimedRef.current) {
        referralClaimedRef.current = true;
        await fetch("/api/referrals/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: refCode }),
        }).catch(() => null);
      }
      const destination =
        sanitizeRedirectPath(redirectTo) ||
        (isOwnerAdminRole(session?.user?.role) ? "/admin" : "/dashboard");
      router.replace(destination);
    };

    void claimAndRedirect();
  }, [redirectTo, refCode, router, session?.user?.role, status]);

  const handlePasswordlessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!codeSent) {
        if (!turnstileToken) {
          throw new Error("Please complete the verification challenge.");
        }
        const response = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, turnstileToken }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to send verification code.");
        }

        setCodeSent(true);
        return;
      }

      const result = await signIn("credentials", {
        email,
        authCode: code,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid or expired code. Please request a new code.");
      }

      window.location.assign(buildPostLoginUrl());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete sign-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const callbackUrl = buildPostLoginUrl();
    await signIn("google", { callbackUrl });
  };

  return (
    <Layout footerVariant="utility">
      <section className="flex-1">
        <div className="section-wash px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-4xl">
            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
              <div className="relative min-h-64 overflow-hidden rounded-[2rem] lg:min-h-[560px]">
                <Image
                  src="/images/shruti-climbing.jpeg"
                  alt="Shruti climbing at an indoor climbing wall"
                  fill
                  priority
                  sizes="(min-width: 1024px) 36vw, 100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="text-brand-white absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="text-brand-accent-light text-xs tracking-[0.28em] uppercase">
                    Client access
                  </p>
                  <h1 className="mt-3 text-3xl leading-tight md:text-4xl">Private Studio</h1>
                  <p className="text-brand-white/80 mt-3 max-w-sm leading-relaxed">
                    Sign in to access your coaching, health details and account tools.
                  </p>
                </div>
              </div>

              <div className="marketing-panel rounded-[2rem] px-6 py-7 md:px-8 md:py-8 lg:px-10">
                <div className="mx-auto w-full max-w-[420px]">
                  {refCode && (
                    <div className="border-brand-accent/20 bg-brand-accent/10 mb-6 flex items-start gap-3 rounded-[1.3rem] border p-4">
                      <Gift className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">Your free class gift will be added after sign-in.</p>
                      </div>
                    </div>
                  )}

                  {intent === "book" && !refCode && (
                    <div className="bg-secondary/50 mb-6 rounded-[1.3rem] border p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Sign in to complete your booking.
                      </p>
                    </div>
                  )}

                  <div className="mb-6">
                    <IconHorizontal className="h-10 w-auto" />
                  </div>

                  <div className="mb-8">
                    <p className="text-brand-accent text-xs tracking-[0.26em] uppercase">
                      Private Studio
                    </p>
                    <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">Sign in</h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                      Use your email or Google account to continue.
                    </p>
                  </div>
                  <div className="bg-bronze/60 mb-8 h-px w-16 rounded-full" />
                  {!loginMethod ? (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setLoginMethod("passwordless")}
                        variant="outline"
                        size="lg"
                        className="h-12 w-full justify-start px-4"
                      >
                        <Mail className="text-muted-foreground mr-3 h-5 w-5" />
                        Continue with Email
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background text-muted-foreground px-2">Or</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        size="lg"
                        className="h-12 w-full justify-start px-4"
                      >
                        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </Button>

                      <div className="text-muted-foreground mt-6 text-center text-sm">
                        First time here? You&apos;ll finish your profile inside the studio after
                        sign-in.
                      </div>
                    </div>
                  ) : loginMethod === "passwordless" ? (
                    <form onSubmit={handlePasswordlessLogin} className="space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod(null);
                          setCodeSent(false);
                          setEmail("");
                          setCode("");
                          setTurnstileToken("");
                          setError("");
                        }}
                        className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 text-sm transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to options
                      </button>

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

                          <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting || !turnstileToken}
                          >
                            {isSubmitting ? "Sending..." : "Send Verification Code"}
                          </Button>
                          <TurnstileWidget onTokenChange={setTurnstileToken} />

                          <p className="text-muted-foreground text-center text-sm">
                            We&apos;ll email you a 6-digit sign-in code.
                          </p>
                          <p className="text-muted-foreground text-center text-xs">
                            New to the studio? We&apos;ll set up your profile after verification.
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
                              onChange={(e) =>
                                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                              }
                              maxLength={6}
                              required
                            />
                            <p className="text-muted-foreground text-sm">Code sent to {email}</p>
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Verifying..." : "Continue"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setCodeSent(false);
                              setCode("");
                              setTurnstileToken("");
                            }}
                            className="w-full"
                          >
                            Resend code
                          </Button>
                        </>
                      )}

                      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
                    </form>
                  ) : null}

                  <p className="text-muted-foreground mt-8 text-center text-sm">
                    Use the same email whenever you come back.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

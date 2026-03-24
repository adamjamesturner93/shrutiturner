"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Mail, Gift, Info, Check, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { IconHorizontal, IconVertical } from "@/components/icon";

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function SignupPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [signupMethod, setSignupMethod] = useState<"email" | "google" | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    agreeToTerms: false,
    agreeToHealth: false,
  });
  const [dobError, setDobError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const referralClaimedRef = useRef(false);

  const buildPostSignupUrl = useCallback(() => {
    const params = new URLSearchParams({ onboarding: "1" });
    if (refCode) params.set("ref", refCode);
    return `/auth/post-login?${params.toString()}`;
  }, [refCode]);
  const waitForSession = async () => {
    for (let i = 0; i < 12; i += 1) {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as {
        user?: { email?: string | null } | null;
      } | null;
      if (data?.user?.email) return true;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
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
      router.replace(buildPostSignupUrl());
    };
    void claimAndRedirect();
  }, [buildPostSignupUrl, refCode, router, status]);

  const handleDobChange = (value: string) => {
    setFormData({ ...formData, dob: value });
    setDobError("");
    if (value && calculateAge(value) < 18) {
      setDobError(
        "You must be 18 or over to create an account. Shruti's insurance covers adults only."
      );
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.dob && calculateAge(formData.dob) < 18) {
      setDobError(
        "You must be 18 or over to create an account. Shruti's insurance covers adults only."
      );
      return;
    }

    if (!formData.dob) {
      setDobError("Date of birth is required for insurance purposes.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!codeSent) {
        if (!turnstileToken) {
          throw new Error("Please complete the verification challenge.");
        }
        const detectedTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            dob: formData.dob,
            timezone: detectedTimezone,
            dateFormat: "DD/MM/YYYY",
            refCode,
            turnstileToken,
            agreeToTerms: formData.agreeToTerms,
            agreeToHealth: formData.agreeToHealth,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          throw new Error(data.message || "Failed to create account.");
        }

        setCodeSent(true);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        authCode: code,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid or expired code. Please request a new code.");
      }

      const hasSession = await waitForSession();
      if (!hasSession) {
        throw new Error("Sign-up succeeded but session was not established. Please try again.");
      }

      router.replace(buildPostSignupUrl());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete sign-up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    await signIn("google", { callbackUrl: buildPostSignupUrl() });
  };

  return (
    <Layout>
      <SEO
        title="Sign Up - Shruti Turner"
        description="Create your account to access personalised training programmes, online classes, and expert coaching."
        canonicalUrl="https://shrutiturner.com/signup"
        noIndex
      />

      <section className="flex-1">
        <div className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-6 md:py-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-6 lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="marketing-grid text-brand-white relative overflow-hidden rounded-[2rem] px-6 py-7 shadow-[0_30px_80px_rgba(46,31,51,0.16)] md:px-8 md:py-8 lg:min-h-[620px]">
                <div className="relative z-10 flex h-full flex-col">
                  <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                    Join The Studio
                  </p>
                  <div className="mt-5 max-w-md space-y-5">
                    <div className="hidden lg:block [&>svg]:h-auto [&>svg]:w-52">
                      <IconVertical />
                    </div>
                    <div className="lg:hidden [&>svg]:h-9 [&>svg]:w-auto">
                      <IconHorizontal />
                    </div>
                    <h1 className="text-4xl leading-tight md:text-5xl">
                      Create an account that starts with context, not pressure.
                    </h1>
                    <p className="text-brand-white/78 text-lg leading-relaxed">
                      Join classes, coaching, and future bookings through a setup that respects
                      health history, capacity, and adult responsibility.
                    </p>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:mt-auto">
                    {[
                      "Personalised programmes for complex bodies",
                      "Online and in-person yoga plus strength classes",
                      "Supportive community without generic wellness language",
                    ].map((item) => (
                      <div
                        key={item}
                        className="border-brand-white/10 bg-brand-white/7 rounded-[1.3rem] border px-4 py-4 backdrop-blur-sm"
                      >
                        <div className="bg-brand-accent-light/18 text-brand-accent-light flex h-8 w-8 items-center justify-center rounded-full">
                          <Check className="h-4 w-4" />
                        </div>
                        <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-brand-white/12 mt-6 grid gap-3 border-t pt-5 sm:grid-cols-3">
                    {[
                      { value: "18+", label: "Adult-only registration for insurance cover" },
                      { value: "Live", label: "Classes, bookings, and coaching in one login" },
                      { value: "Clear", label: "Verification before anything goes live" },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-brand-accent-light text-sm tracking-[0.18em] uppercase">
                          {item.value}
                        </p>
                        <p className="text-brand-white/72 mt-2 text-sm leading-relaxed">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="marketing-panel rounded-[2rem] px-6 py-7 md:px-8 md:py-8 lg:px-10">
                <div className="mx-auto w-full max-w-[440px]">
                  {refCode && (
                    <div className="border-brand-accent/20 bg-brand-accent/10 mb-6 flex items-start gap-3 rounded-[1.3rem] border p-4">
                      <Gift className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">
                          £10 credit will be applied to your account after sign-up.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 lg:hidden [&>svg]:h-10 [&>svg]:w-auto">
                    <IconHorizontal />
                  </div>

                  <div className="mb-8">
                    <p className="text-brand-accent text-xs tracking-[0.26em] uppercase">
                      New here
                    </p>
                    <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
                      Create your account
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                      Start with a simple setup. We collect the basics we need for insurance,
                      booking, and safer support.
                    </p>
                  </div>
                  <div className="bg-bronze/60 mb-8 h-px w-16 rounded-full" />
                  {!signupMethod ? (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setSignupMethod("email")}
                        variant="outline"
                        size="lg"
                        className="h-12 w-full justify-start px-4"
                      >
                        <Mail className="text-muted-foreground mr-3 h-5 w-5" />
                        Sign up with Email
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
                        onClick={handleGoogleSignup}
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
                        Sign up with Google
                      </Button>

                      <div className="text-muted-foreground mt-6 text-center text-sm">
                        <p>
                          Already have an account?{" "}
                          <Link href="/login" className="text-primary hover:underline">
                            Sign in
                          </Link>
                        </p>
                      </div>
                    </div>
                  ) : signupMethod === "email" ? (
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSignupMethod(null);
                          setCodeSent(false);
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
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={(e) =>
                                  setFormData({ ...formData, firstName: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={(e) =>
                                  setFormData({ ...formData, lastName: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                              id="dob"
                              type="date"
                              value={formData.dob}
                              onChange={(e) => handleDobChange(e.target.value)}
                              max={new Date().toISOString().split("T")[0]}
                              required
                              className={dobError ? "border-red-500" : ""}
                            />
                            {dobError ? (
                              <p className="flex items-start gap-1.5 text-sm text-red-600">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                {dobError}
                              </p>
                            ) : (
                              <p className="text-muted-foreground text-xs">
                                Required for insurance. You must be 18 or over.
                              </p>
                            )}
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms"
                              checked={formData.agreeToTerms}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  agreeToTerms: checked as boolean,
                                })
                              }
                              required
                            />
                            <label
                              htmlFor="terms"
                              className="text-muted-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I agree to the{" "}
                              <Link href="/terms" className="text-primary hover:underline">
                                Terms & Conditions
                              </Link>{" "}
                              and{" "}
                              <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                            </label>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="health"
                              checked={formData.agreeToHealth}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  agreeToHealth: checked as boolean,
                                })
                              }
                              required
                            />
                            <label
                              htmlFor="health"
                              className="text-muted-foreground text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I confirm I have read and agree to the{" "}
                              <Link
                                href="/health-declaration"
                                className="text-primary hover:underline"
                                target="_blank"
                              >
                                Health & Liability Waiver
                              </Link>
                              , and I understand that I participate in all classes and programmes at
                              my own risk
                            </label>
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={
                              !formData.agreeToTerms ||
                              !formData.agreeToHealth ||
                              !!dobError ||
                              isSubmitting ||
                              !turnstileToken
                            }
                          >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                          </Button>
                          <TurnstileWidget onTokenChange={setTurnstileToken} />

                          <p className="text-muted-foreground text-center text-sm">
                            We'll send a 6-digit verification code to confirm your account
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
                            <p className="text-muted-foreground text-sm">
                              Code sent to {formData.email}
                            </p>
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Verifying..." : "Verify & Complete Sign Up"}
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
                            Change details / resend code
                          </Button>
                        </>
                      )}

                      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
                    </form>
                  ) : null}
                  <p className="text-muted-foreground mt-8 text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-brand-accent hover:text-brand-accent/80 underline"
                    >
                      Sign in instead
                    </Link>
                    .
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

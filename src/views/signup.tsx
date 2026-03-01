"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Mail, Gift, Info } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/auth-context";

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
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const refCode = searchParams.get("ref");

  const [signupMethod, setSignupMethod] = useState<"email" | "google" | null>(
    null
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    agreeToTerms: false,
  });
  const [dobError, setDobError] = useState("");

  const handleDobChange = (value: string) => {
    setFormData({ ...formData, dob: value });
    setDobError("");
    if (value) {
      const age = calculateAge(value);
      if (age < 18) {
        setDobError(
          "You must be 18 or over to create an account. Shruti's insurance covers adults only."
        );
      }
    }
  };

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
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
    // Auto-detect timezone from browser for new accounts
    const detectedTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";
    console.log("Creating account:", { ...formData, timezone: detectedTimezone });
    if (refCode) console.log("Applying referral code:", refCode);
    login(formData.email);
    navigate("/dashboard?onboarding=true", { replace: true });
  };

  const handleGoogleSignup = () => {
    console.log("Initiating Google signup");
    if (refCode) console.log("Applying referral code:", refCode);
    login("google@example.com");
    navigate("/dashboard?onboarding=true", { replace: true });
  };

  return (
    <Layout>
      <SEO
        title="Sign Up - Shruti Turner"
        description="Create your account to access personalized training programs, online classes, and expert coaching."
        canonicalUrl="https://shrutiturner.com/signup"
        noIndex={true}
      />

      <section className="py-20 md:py-28 min-h-screen flex items-center">
        <div className="container mx-auto px-4 max-w-md">
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

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl text-center">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-center">
                Join our community and start your strength journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!signupMethod ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setSignupMethod("email")}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Sign up with Email
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
                    onClick={handleGoogleSignup}
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
                    Sign up with Google
                  </Button>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSignupMethod(null)}
                    className="mb-4"
                  >
                    ← Back to options
                  </Button>

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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                      <p className="text-sm text-red-600 flex items-start gap-1.5">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {dobError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
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
                      className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!formData.agreeToTerms || !!dobError}
                  >
                    Create Account
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    We'll send you a verification email to confirm your account
                  </p>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

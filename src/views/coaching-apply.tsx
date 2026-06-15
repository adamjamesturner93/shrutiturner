"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Info, MessageCircle, Shield } from "lucide-react";
import { Layout } from "@/components/layout";
import { EditorialHero, MarketingSection, SectionHeading } from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  coachingApplicationQuestions,
  coachingApplicationTierOptions,
  type CoachingApplicationTier,
} from "@/data/coaching-application";

const DEFAULT_TIER: CoachingApplicationTier = "guided_training_plan";
const tierPayloadMap = Object.fromEntries(
  coachingApplicationTierOptions.map((option) => [option.value, option.payloadTier])
) as Record<CoachingApplicationTier, "personal_programme" | "coached_plan" | "coaching">;

function resolveTier(value: string | null): CoachingApplicationTier {
  const legacyTierMap: Record<string, CoachingApplicationTier> = {
    "coached-plan": "guided_training_plan",
    coaching: "one_to_one_coaching",
    unsure: DEFAULT_TIER,
  };
  if (value && value in legacyTierMap) {
    return legacyTierMap[value];
  }
  if (coachingApplicationTierOptions.some((option) => option.value === value)) {
    return value as CoachingApplicationTier;
  }
  return DEFAULT_TIER;
}

export function CoachingApplyPage() {
  const searchParams = useSearchParams();
  const { user, isCoachingClient, isAuthenticated } = useAuth();
  const [selectedTier, setSelectedTier] = useState<CoachingApplicationTier>(() =>
    resolveTier(searchParams.get("offer") || searchParams.get("tier"))
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreedToCoachingAgreement, setAgreedToCoachingAgreement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedTier(resolveTier(searchParams.get("offer") || searchParams.get("tier")));
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    setName((prev) => prev || `${user.firstName} ${user.lastName}`.trim());
    setEmail((prev) => prev || user.email);
  }, [user]);

  const visibleQuestions = useMemo(
    () =>
      coachingApplicationQuestions.filter(
        (question) => !question.tiers || question.tiers.includes(selectedTier)
      ),
    [selectedTier]
  );

  const requiredComplete =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    visibleQuestions.every(
      (question) => !question.required || (answers[question.id] || "").trim().length > 0
    ) &&
    agreedToCoachingAgreement;

  const coachingClientNotice = isCoachingClient
    ? "Your account is already marked as a 1:1 client. Use this form only if you are asking to change support level or restart support."
    : null;
  const staticHero = {
    eyebrow: "1:1 Application",
    heading: "Apply to work with Shruti.",
    body: "Use one form for all 1:1 offers. Choose the closest fit in the application and Shruti will confirm the right next step before any payment opens.",
    bullets: [
      "Application required before payment",
      "Reviewed personally within 48 hours",
      "Payment only opens after acceptance",
    ],
  };

  const submitApplication = async () => {
    if (!requiredComplete || isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const [applicantFirstName, ...rest] = name.trim().split(/\s+/);
      const applicantLastName = rest.join(" ");
      const response = await fetch("/api/coaching/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantFirstName,
          applicantLastName,
          applicantEmail: email,
          tier: tierPayloadMap[selectedTier],
          answers: {
            ...answers,
            offerKey: selectedTier,
          },
          isExistingCoachingClientSnapshot: isCoachingClient,
          agreedToCoachingAgreement,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to submit application.");
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEO
          title="1:1 Application Received - Shruti Turner"
          description="Your 1:1 application has been received."
          canonicalUrl="https://shrutiturner.co.uk/coaching/apply"
        />

        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-6 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
              <div className="marketing-grid text-brand-white overflow-hidden rounded-[2rem] px-6 py-8 md:px-8 md:py-9">
                <div className="relative z-10">
                  <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                    Application Received
                  </p>
                  <h1 className="mt-5 text-4xl leading-tight md:text-5xl">Thank you.</h1>
                  <p className="text-brand-white/80 mt-5 max-w-xl text-lg leading-relaxed">
                    Thanks for requesting to work with Shruti to support your health and wellbeing.
                    Look out for an email from Shruti within the next 48 hours. Don’t forget to
                    check your spam.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {["Reviewed manually", "Reply within 48 hours", "No automatic upsell"].map(
                      (item) => (
                        <div
                          key={item}
                          className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.3rem] border px-4 py-4 text-sm leading-relaxed"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="marketing-panel rounded-[2rem] px-6 py-8 md:px-8 md:py-9">
                <div className="bg-brand-accent/10 text-brand-accent flex h-16 w-16 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-3xl md:text-4xl">What happens next</h2>
                <ol className="text-muted-foreground mt-5 space-y-4 text-sm leading-relaxed">
                  <li>1. Shruti reviews the context you shared and the support you selected.</li>
                  <li>2. You receive a personal reply within 48 hours.</li>
                  <li>3. If it feels like a fit, your next step is explained clearly.</li>
                </ol>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/coaching">
                      Back to 1:1 Offers
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/blog">Read the Blog</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Apply for 1:1 Support - Shruti Turner"
        description="Apply for Shruti Turner's 1:1 offers, from training plans to high-touch 1:1 coaching."
        canonicalUrl="https://shrutiturner.co.uk/coaching/apply"
      />

      <EditorialHero
        eyebrow={staticHero.eyebrow}
        size="compact"
        title={staticHero.heading}
        description={staticHero.body}
        primaryCta={{ href: "#application-form", label: "Open Application" }}
        secondaryCta={{ href: "/coaching", label: "Back to 1:1 Offers" }}
        metrics={[
          {
            label: "Good For",
            detail:
              "People who need more nuance, more review or help choosing the right support level.",
          },
          {
            label: "Response",
            detail: "Applications are reviewed manually and usually answered within 48 hours.",
          },
          {
            label: "Tone",
            detail:
              "Low pressure, clear recommendations and no pushing you into more support than you need.",
          },
        ]}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
              <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                This support includes
              </p>
              <div className="mt-5 space-y-3">
                {staticHero.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.2rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />

      <MarketingSection id="application-form" className="section-wash" contentClassName="max-w-5xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="marketing-panel rounded-[1.85rem] p-6 md:p-7">
              <SectionHeading
                eyebrow="Before You Apply"
                title="Use this form before any 1:1 payment."
                description="1:1 support is application-led. If another offer is a better fit, Shruti will say so before sending any payment invitation."
              />
            </div>

            <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-2xl">What this application is for</h2>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                This form is for all 1:1 offers. Submitting it does not start a subscription,
                reserve a place or create a checkout session. Payment is invited only after admin
                acceptance.
              </p>
            </div>

            {isAuthenticated ? (
              <div className="border-brand-accent/20 bg-brand-accent/5 rounded-[1.75rem] border p-6">
                <div className="flex items-start gap-3">
                  <Info className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">
                    Signed in as <strong>{user?.email}</strong>. I have prefilled the basics to keep
                    this simpler.
                  </p>
                </div>
              </div>
            ) : null}

            {coachingClientNotice ? (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm leading-relaxed text-amber-900">{coachingClientNotice}</p>
              </div>
            ) : null}

            <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-2xl">What happens next</h2>
              <ol className="text-muted-foreground mt-5 space-y-3 text-sm leading-relaxed">
                <li>1. I review your application personally.</li>
                <li>2. I reply within 48 hours with the next best step.</li>
                <li>3. If it feels like a fit, you receive a secure payment invitation.</li>
                <li>4. After verified payment, your 1:1 support begins through Everfit.</li>
              </ol>
            </div>
          </div>

          <form
            className="marketing-panel space-y-8 rounded-[2rem] p-6 shadow-[0_24px_60px_rgba(46,31,51,0.08)] md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              void submitApplication();
            }}
          >
            <div className="space-y-4">
              <SectionHeading
                eyebrow="Application"
                title="Tell me what kind of support you need."
                description="Choose the closest fit. You do not need to get it perfect."
              />
              <div className="grid gap-3">
                {coachingApplicationTierOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-[1.5rem] border p-4 transition-colors ${
                      selectedTier === option.value
                        ? "border-brand-accent bg-brand-accent/5"
                        : "border-border hover:bg-secondary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={option.value}
                      checked={selectedTier === option.value}
                      onChange={() => setSelectedTier(option.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base">{option.title}</p>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-4 w-4 rounded-full border ${
                          selectedTier === option.value
                            ? "border-brand-accent bg-brand-accent"
                            : "border-muted-foreground/40"
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-brand-dark/10 bg-background grid gap-5 rounded-[1.75rem] border p-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-brand-dark/10 bg-background space-y-5 rounded-[1.75rem] border p-6">
              <div>
                <h3 className="text-xl">Application details</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Tell me what you need from training, what your week looks like and what kind of
                  support would help.
                </p>
              </div>
              {visibleQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id}>
                    {question.label}
                    {question.required ? " *" : ""}
                  </Label>
                  {question.type === "select" ? (
                    <select
                      id={question.id}
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      required={question.required}
                    >
                      <option value="">Select an option</option>
                      {question.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Textarea
                      id={question.id}
                      rows={question.id === "anythingElse" ? 4 : 5}
                      placeholder={question.placeholder}
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      required={question.required}
                    />
                  )}
                  {question.helpText ? (
                    <p className="text-muted-foreground text-xs">{question.helpText}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="border-brand-dark/10 bg-background space-y-4 rounded-[1.75rem] border p-5">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="coaching-agreement"
                  checked={agreedToCoachingAgreement}
                  onCheckedChange={(checked) => setAgreedToCoachingAgreement(checked === true)}
                />
                <label
                  htmlFor="coaching-agreement"
                  className="cursor-pointer text-sm leading-relaxed"
                >
                  I have read and agree to the{" "}
                  <Link
                    href="/coaching-agreement"
                    className="text-primary underline"
                    target="_blank"
                  >
                    1:1 Agreement
                  </Link>
                  . I also understand this application sits alongside the{" "}
                  <Link href="/terms" className="text-primary underline" target="_blank">
                    Terms & Conditions
                  </Link>
                  ,{" "}
                  <Link
                    href="/health-declaration"
                    className="text-primary underline"
                    target="_blank"
                  >
                    Health & Liability Waiver
                  </Link>
                  and{" "}
                  <Link href="/privacy" className="text-primary underline" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                This application is reviewed manually. It does not place you into a paid 1:1 offer
                automatically.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!requiredComplete || isSubmitting}
            >
              <MessageCircle className="h-5 w-5" />
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>

            {error ? (
              <div className="rounded-[1.3rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                I aim to respond within 48 hours. Application answers are used for fit, safety and
                support planning, not for Stripe metadata or analytics.
              </p>
            </div>
          </form>
        </div>
      </MarketingSection>
    </Layout>
  );
}

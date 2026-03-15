"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Info, MessageCircle, Shield } from "lucide-react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  coachingApplicationQuestions,
  coachingApplicationTierOptions,
  type CoachingApplicationTier,
} from "@/data/coaching-application";

const DEFAULT_TIER: CoachingApplicationTier = "coached-plan";
const tierPayloadMap: Record<CoachingApplicationTier, "coached_plan" | "coaching" | "unsure"> = {
  "coached-plan": "coached_plan",
  coaching: "coaching",
  unsure: "unsure",
};

const tierHighlights: Record<
  CoachingApplicationTier,
  { eyebrow: string; heading: string; body: string; bullets: string[] }
> = {
  "coached-plan": {
    eyebrow: "Coached Training Plan",
    heading: "Apply for a coached plan",
    body: "This route is for people who want tailored programming, regular written review, and structure that still leaves room for independent training.",
    bullets: [
      "Programming delivered with regular review and adaptation",
      "Move Well Membership included",
      "A lower-friction route than full 1:1 coaching",
    ],
  },
  coaching: {
    eyebrow: "Coaching",
    heading: "Apply for higher-touch support",
    body: "This route is for people who need closer oversight, more strategic adaptation, and a steadier accountability rhythm.",
    bullets: [
      "High-touch support and strategic review",
      "Programming and closer accountability",
      "Move Well Membership included",
    ],
  },
  unsure: {
    eyebrow: "Coaching Support",
    heading: "Apply and we will help you decide",
    body: "If you know you need more support but are not sure which level fits, this application gives enough context for a grounded recommendation.",
    bullets: [
      "Best if your needs are still taking shape",
      "A calm, low-pressure recommendation process",
      "Clear next steps within 48 hours",
    ],
  },
};

function resolveTier(value: string | null): CoachingApplicationTier {
  if (value === "coached-plan" || value === "coaching" || value === "unsure") {
    return value;
  }
  return DEFAULT_TIER;
}

export function CoachingApplyPage() {
  const searchParams = useSearchParams();
  const { user, membership, isCoachingClient, isAuthenticated } = useAuth();
  const [selectedTier, setSelectedTier] = useState<CoachingApplicationTier>(() =>
    resolveTier(searchParams.get("tier"))
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreedToCoachingAgreement, setAgreedToCoachingAgreement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedTier(resolveTier(searchParams.get("tier")));
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

  const memberNotice = membership
    ? "You already have Move Well Membership. If you move into a coaching tier that includes it, we will handle that transition for you."
    : null;

  const coachingClientNotice = isCoachingClient
    ? "Your account is already marked as a coaching client. Use this form only if you are asking to change support level or restart coaching."
    : null;
  const highlight = tierHighlights[selectedTier];

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
          answers,
          hasMoveWellMembershipSnapshot: Boolean(membership),
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
          title="Coaching Application Received - Shruti Turner"
          description="Your coaching application has been received."
          canonicalUrl="https://shrutiturner.com/coaching/apply"
        />

        <section className="py-20 md:py-28">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <div className="border-brand-accent/20 bg-brand-accent/5 mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border">
              <CheckCircle2 className="text-brand-accent h-9 w-9" />
            </div>
            <h1 className="mb-4 text-4xl md:text-5xl">Application Received</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
              Thanks. Your coaching application is in. We will review it personally and aim to reply
              within 48 hours with either follow-up questions or the next best step.
            </p>
            <div className="bg-secondary/20 mt-10 rounded-2xl border p-6 text-left">
              <h2 className="mb-3 text-xl">What happens next</h2>
              <ol className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                <li>1. We review the context you shared and the support level you selected.</li>
                <li>2. If needed, we follow up with a few clarifying questions.</li>
                <li>
                  3. If it looks like a fit, we outline next steps for onboarding and Everfit.
                </li>
              </ol>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/coaching">
                <Button size="lg">
                  Back to Coaching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/classes">
                <Button size="lg" variant="outline">
                  Explore Move Well Classes
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Apply for Coaching - Shruti Turner"
        description="Apply for coached support with Shruti Turner, from coached training plans to high-touch 1:1 coaching."
        canonicalUrl="https://shrutiturner.com/coaching/apply"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-brand-accent-light mb-4 text-sm tracking-[0.2em] uppercase">
            {highlight.eyebrow}
          </p>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">{highlight.heading}</h1>
          <p className="text-brand-accent-light mx-auto max-w-2xl text-xl leading-relaxed md:text-2xl">
            {highlight.body}
          </p>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="bg-secondary/20 rounded-2xl border p-6">
                <h2 className="mb-3 text-2xl">What this form is for</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This form is for higher-touch coaching enquiries only. If you want the
                  lower-friction self-serve plan, use the{" "}
                  <Link href="/coaching/personal-programme" className="text-primary underline">
                    Independent Training Plan
                  </Link>{" "}
                  path instead.
                </p>
              </div>

              {isAuthenticated ? (
                <div className="border-brand-accent/20 bg-brand-accent/5 rounded-2xl border p-6">
                  <div className="flex items-start gap-3">
                    <Info className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">
                      Signed in as <strong>{user?.email}</strong>. We have prefilled the basics to
                      keep this simple.
                    </p>
                  </div>
                </div>
              ) : null}

              {memberNotice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-sm leading-relaxed text-emerald-900">{memberNotice}</p>
                </div>
              ) : null}

              {coachingClientNotice ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-sm leading-relaxed text-amber-900">{coachingClientNotice}</p>
                </div>
              ) : null}

              <div className="bg-background rounded-2xl border p-6">
                <h3 className="mb-3 text-xl">What this support includes</h3>
                <ul className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                  {highlight.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-2xl border p-6">
                <h3 className="mb-3 text-xl">What happens next</h3>
                <ol className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                  <li>1. Shruti reviews your application personally.</li>
                  <li>2. We reply within 48 hours with the next best step.</li>
                  <li>3. If it feels like a fit, we move into onboarding and Everfit setup.</li>
                </ol>
              </div>
            </div>

            <form
              className="bg-background space-y-8 rounded-[2rem] border p-8 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void submitApplication();
              }}
            >
              <div className="space-y-3">
                <h2 className="text-2xl">Support level</h2>
                <p className="text-muted-foreground text-sm">
                  Choose the option that feels closest. You do not need to get it perfect.
                </p>
                <div className="grid gap-3">
                  {coachingApplicationTierOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
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

              <div className="grid gap-5 rounded-2xl border p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
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

              <div className="space-y-5 rounded-2xl border p-6">
                <div>
                  <h3 className="text-xl">Application details</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Tell us what you need from training, what feels complex right now, and what kind
                    of support would help.
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

              <div className="space-y-4 rounded-2xl border p-5">
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
                      Coaching Agreement
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
                    , and{" "}
                    <Link href="/privacy" className="text-primary underline" target="_blank">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  This application is reviewed manually. It does not place you into a paid coaching
                  tier automatically.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!requiredComplete || isSubmitting}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  We aim to respond within 48 hours. If the Independent Training Plan is the better
                  fit, we will say so clearly rather than upselling you into more support than you
                  need.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}

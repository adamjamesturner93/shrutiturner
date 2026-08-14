"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, CalendarDays, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { MarketingSection, SectionHeading } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const nextSteps = [
  {
    title: "Tell me a little about you",
    description:
      "Share what you’d like support with, what movement or training looks like for you now, and anything you think I should know.",
    icon: MessageCircle,
  },
  {
    title: "We have a 30-minute consultation",
    description:
      "We’ll talk through your goals, your body, your lifestyle and what kind of support would be most useful.",
    icon: CalendarDays,
  },
  {
    title: "I’ll recommend the right level of support",
    description:
      "If coaching feels like a good fit, I’ll explain which option I think would suit you best and why. There’s no pressure to decide there and then.",
    icon: Mail,
  },
] as const;

const ENQUIRY_CONSENT_TEXT =
  "I consent to Shruti Turner using the information in this form to respond to my enquiry. I understand this may include health or accessibility context I choose to share.";

export function CoachingEnquirePage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    support: "",
    movement: "",
    context: "",
    outcome: "",
    extra: "",
    referral: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent || !turnstileToken) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/coaching/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          consent,
          consentText: ENQUIRY_CONSENT_TEXT,
          turnstileToken,
          honeypot: website,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to send your enquiry.");
      }
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout footerVariant="utility">
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl text-center">
          <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
            Coaching enquiry
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl leading-tight md:text-6xl">
            Let’s find the right support for you.
          </h1>
          <p className="text-brand-white/80 mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
            You don’t need to know which level of coaching is right for you before getting in touch.
            Tell me a little about what you’re looking for, and we can work that out together.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 mt-8"
          >
            <Link href="#enquiry-form">
              See the enquiry form
              <ArrowDown className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingSection className="section-wash" compact>
        <SectionHeading
          title="What happens next"
          description="No need to choose a level of support before we’ve spoken."
          align="center"
        />
        <ol className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {nextSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="border-brand-dark/10 bg-background relative rounded-[1.65rem] border p-6 text-center"
              >
                <span className="bg-brand-accent text-brand-white mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-brand-accent mt-5 text-xs tracking-[0.18em] uppercase">
                  Step {index + 1}
                </p>
                <h2 className="mt-3 text-2xl leading-tight">{step.title}</h2>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </MarketingSection>

      <MarketingSection id="enquiry-form" className="section-divider" contentClassName="max-w-3xl">
        <div className="marketing-panel rounded-[2rem] p-6 shadow-[0_24px_60px_rgba(46,31,51,0.08)] md:p-9">
          <SectionHeading title="Tell me what you’d like support with." />

          {submitted ? (
            <div className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-7 text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-700" />
              <h2 className="mt-4 text-2xl">Thanks — your enquiry has been sent.</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                I’ll read it personally and get back to you within two working days. Please check
                your spam folder if you have not heard back.
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <p className="text-muted-foreground text-sm">Fields marked with * are required.</p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enquiry-name">Name *</Label>
                  <Input
                    id="enquiry-name"
                    name="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enquiry-email">Email *</Label>
                  <Input
                    id="enquiry-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-support">What would you like support with? *</Label>
                <Textarea
                  id="enquiry-support"
                  name="support"
                  rows={4}
                  required
                  value={formData.support}
                  onChange={(event) => setFormData({ ...formData, support: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-movement">
                  What does movement/training currently look like for you?
                </Label>
                <Textarea
                  id="enquiry-movement"
                  name="movement"
                  rows={4}
                  value={formData.movement}
                  onChange={(event) => setFormData({ ...formData, movement: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-context">
                  Is there anything about your health, body or circumstances you’d like me to know?
                </Label>
                <Textarea
                  id="enquiry-context"
                  name="context"
                  rows={4}
                  value={formData.context}
                  onChange={(event) => setFormData({ ...formData, context: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-outcome">
                  What would you most like to get from coaching? *
                </Label>
                <Textarea
                  id="enquiry-outcome"
                  name="outcome"
                  rows={4}
                  required
                  value={formData.outcome}
                  onChange={(event) => setFormData({ ...formData, outcome: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-extra">Anything else you’d like to tell me?</Label>
                <Textarea
                  id="enquiry-extra"
                  name="extra"
                  rows={3}
                  value={formData.extra}
                  onChange={(event) => setFormData({ ...formData, extra: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-referral">How did you hear about me? *</Label>
                <Input
                  id="enquiry-referral"
                  name="referral"
                  required
                  value={formData.referral}
                  onChange={(event) => setFormData({ ...formData, referral: event.target.value })}
                />
              </div>

              <div className="pointer-events-none absolute -left-[10000px]" aria-hidden="true">
                <Label htmlFor="enquiry-website">Website</Label>
                <Input
                  id="enquiry-website"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              <TurnstileWidget onTokenChange={setTurnstileToken} />

              <label className="text-muted-foreground flex items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                  className="accent-brand-accent mt-1 h-4 w-4 shrink-0"
                />
                <span>{ENQUIRY_CONSENT_TEXT}</span>
              </label>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!consent || !turnstileToken || submitting}
              >
                {submitting ? "Sending..." : "Send enquiry"}
              </Button>
              {error ? (
                <p className="rounded-[1.2rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </form>
          )}

          <div className="border-brand-dark/10 bg-brand-warm mt-8 rounded-[1.25rem] border p-5">
            <h3 className="text-xl">What happens after I enquire?</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              I’ll read your enquiry personally and get back to you within two working days to
              arrange a consultation or ask any questions I need to before we speak.
            </p>
          </div>

          <p className="text-muted-foreground mt-7 text-center text-sm">
            Looking for something other than coaching?{" "}
            <Link href="/contact" className="text-primary underline">
              Use the general contact page.
            </Link>
          </p>
        </div>
      </MarketingSection>
    </Layout>
  );
}

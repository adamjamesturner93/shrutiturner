"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Mail,
  MessageCircle,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PathCards,
  ProofBand,
  SectionHeading,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { servicePathCards } from "@/data/public-refresh";

const INTEREST_OPTIONS = [
  { value: "group-classes", label: "Move Well Classes (yoga, strength, cardio)" },
  { value: "1-1-training", label: "1:1 personal training" },
  { value: "small-group", label: "Small group programmes" },
  { value: "retreat", label: "Retreats" },
  { value: "general", label: "General question" },
  { value: "sliding-scale", label: "Sliding scale enquiry" },
  { value: "other", label: "Other" },
];

const HOW_FOUND_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "google", label: "Google search" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referred by a friend or professional" },
  { value: "blog", label: "Blog article" },
  { value: "other", label: "Other" },
];

const serviceIcons: Record<(typeof servicePathCards)[number]["icon"], LucideIcon> = {
  heart: Heart,
  user: User,
  sparkles: Sparkles,
};

const contactExpectations = [
  {
    label: "Reply Window",
    detail: "I read enquiries myself and usually reply within 2 working days.",
  },
  {
    label: "No Pitch",
    detail: "This is a conversation, not a funnel. If another route fits better, I will say so.",
  },
  {
    label: "Useful Detail",
    detail:
      "Accessibility, symptoms, uncertainty, and past bad experiences are all relevant context.",
  },
] as const;

const CONTACT_CONSENT_TEXT =
  "I consent to Shruti Turner using the information in this form to respond to my enquiry. I understand this may include health or accessibility context I choose to share.";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    interest: "",
    conditions: "",
    howFound: "",
    message: "",
    contactConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken || !formData.contactConsent) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          contactConsentText: CONTACT_CONSENT_TEXT,
          turnstileToken,
          honeypot: "",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to submit enquiry.");
      }

      setSubmitted(true);
      setTurnstileToken("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEO
          title="Enquiry Sent - Shruti Turner"
          description="Your enquiry has been submitted."
          noIndex
        />

        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-6 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
              <div className="marketing-grid text-brand-white overflow-hidden rounded-[2rem] px-6 py-8 md:px-8 md:py-9">
                <div className="relative z-10">
                  <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                    Message Received
                  </p>
                  <h1 className="mt-5 text-4xl leading-tight md:text-5xl">
                    Thank you, {formData.firstName || "there"}.
                  </h1>
                  <p className="text-brand-white/80 mt-5 max-w-xl text-lg leading-relaxed">
                    I read every enquiry personally. If this is about coaching, I may come back with
                    a couple of clarifying questions before suggesting the best next step.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      "Reply within 2 working days",
                      "No pressure or hard sell",
                      "Accessibility questions welcome",
                    ].map((item) => (
                      <div
                        key={item}
                        className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.3rem] border px-4 py-4 text-sm leading-relaxed"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="marketing-panel rounded-[2rem] px-6 py-8 md:px-8 md:py-9">
                <div className="mx-auto max-w-2xl">
                  <div className="bg-brand-accent/10 text-brand-accent flex h-16 w-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-6 text-3xl md:text-4xl">While you wait</h2>
                  <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                    If you want to keep exploring, these are the most useful next pages.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {servicePathCards.slice(0, 4).map((card) => {
                      const Icon = serviceIcons[card.icon];
                      return (
                        <Link
                          key={card.href}
                          href={card.href}
                          className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-5 transition-transform duration-300 hover:-translate-y-1"
                        >
                          <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 text-xl">{card.title}</h3>
                          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                            {card.detail}
                          </p>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild>
                      <Link href="/classes">
                        Explore Move Well Classes
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
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Contact & Enquiry - Shruti Turner"
        description="Get in touch to discuss 1:1 coaching, group classes, retreat information, or general questions. No hard sell, just honest conversation."
        keywords="contact Shruti Turner, fitness enquiry, coaching consultation, strength training enquiry"
        canonicalUrl="https://shrutiturner.co.uk/contact"
      />

      <EditorialHero
        eyebrow="Contact"
        size="compact"
        title={
          <>
            Start with a question,
            <span className="text-brand-accent-light"> not a sales call.</span>
          </>
        }
        description="If you want help choosing between classes, coaching, programmes, or retreats, tell me what feels unclear. You do not need to know the right service name before you reach out."
        primaryCta={{ href: "#contact-form", label: "Open Enquiry Form" }}
        secondaryCta={{ href: "/pricing", label: "View Pricing First" }}
        metrics={[
          {
            label: "Best For",
            detail:
              "Service questions, access needs, coaching fit, retreat suitability, or general context.",
          },
          {
            label: "Tone",
            detail: "Direct, low-pressure, and grounded in what your body actually needs.",
          },
          {
            label: "Reply",
            detail: "Usually within 2 working days, with follow-up only if more detail is useful.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/4.55] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="bg-brand-white/10 rounded-[1.15rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    Expect
                  </p>
                  <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                    Clarity on fit, pricing, and the next best route if you are still deciding.
                  </p>
                </div>
                <div className="bg-brand-accent-light/12 rounded-[1.15rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    Safe to mention
                  </p>
                  <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                    Symptoms, uncertainty, access needs, old injury stories, or bad past advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What happens when you reach out"
        description="The point of the contact page is to reduce friction, not create it. You should leave with a clearer route, even if that route is not the highest-touch option."
        items={[...contactExpectations]}
      />

      <MarketingSection id="contact-form" className="section-wash">
        <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          <div className="marketing-panel rounded-[2rem] p-6 shadow-[0_24px_60px_rgba(46,31,51,0.08)] md:p-8">
            <SectionHeading
              eyebrow="Enquiry Form"
              title="Tell me what you need help with."
              description="The more context you can share, the easier it is for me to point you toward the right next step."
            />

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">What are you interested in? *</Label>
                <Select
                  value={formData.interest}
                  onValueChange={(value) => setFormData({ ...formData, interest: value })}
                >
                  <SelectTrigger id="interest" className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Any conditions or context you want me to know?</Label>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Optional. For example: psoriatic arthritis, longer-term fatigue, hypermobility,
                  recovery from surgery, or uncertainty about what is safe right now.
                </p>
                <Input
                  id="conditions"
                  placeholder="Share anything useful before we talk"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="howFound">How did you find me?</Label>
                <Select
                  value={formData.howFound}
                  onValueChange={(value) => setFormData({ ...formData, howFound: value })}
                >
                  <SelectTrigger id="howFound" className="h-11">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {HOW_FOUND_OPTIONS.filter((option) => option.value).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your message *</Label>
                <Textarea
                  id="message"
                  rows={6}
                  placeholder="Tell me a bit about what you are looking for, what feels difficult right now, and what would be useful help."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <TurnstileWidget onTokenChange={setTurnstileToken} />
              </div>

              <label htmlFor="contactConsent" className="flex items-start gap-3 text-sm">
                <input
                  id="contactConsent"
                  type="checkbox"
                  checked={formData.contactConsent}
                  onChange={(e) => setFormData({ ...formData, contactConsent: e.target.checked })}
                  required
                  aria-describedby="contact-consent-copy"
                  className="accent-brand-accent mt-1 h-4 w-4 flex-shrink-0"
                />
                <span id="contact-consent-copy" className="text-muted-foreground leading-relaxed">
                  {CONTACT_CONSENT_TEXT}
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  !formData.interest || !formData.contactConsent || !turnstileToken || submitting
                }
              >
                {submitting ? "Sending..." : "Send Enquiry"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              {error ? (
                <div className="rounded-[1.3rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <p className="text-muted-foreground text-sm leading-relaxed">
                Your information stays private and is only used to reply to this enquiry.
              </p>
            </form>
          </div>

          <div className="space-y-6">
            <div className="marketing-panel rounded-[1.75rem] p-6 md:p-7">
              <div className="flex items-start gap-3">
                <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl">What to expect</h2>
                  <ul className="text-muted-foreground mt-5 space-y-4 text-sm leading-relaxed">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />I
                      reply personally rather than handing this to a generic inbox.
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                      If you are asking about coaching, I may follow up before recommending a tier.
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                      If another route fits better, I will point you there directly.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.06)]">
              <div className="flex items-start gap-3">
                <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl">Prefer email?</h2>
                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                    You can email{" "}
                    <a
                      href="mailto:tech@thechronicyogini.com"
                      className="text-primary font-medium underline decoration-2 underline-offset-3"
                    >
                      tech@thechronicyogini.com
                    </a>{" "}
                    directly if that is easier.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-brand-dark/10 bg-brand-warm/60 rounded-[1.75rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.06)]">
              <h2 className="text-2xl">Not sure what you need yet?</h2>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                These pages usually help people narrow the question before they reach out.
              </p>
              <div className="mt-5 grid gap-3">
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/classes">
                    Explore Move Well Classes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/coaching">
                    Compare Coaching Options
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/about">
                    Read About My Approach
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Ways To Work Together"
          title="If you are still deciding, start with the route that looks closest."
          description="These are the main entry points most people compare before they contact me."
          align="center"
        />
        <div className="mt-12">
          <PathCards
            items={servicePathCards.map((card) => ({
              ...card,
              icon: serviceIcons[card.icon],
            }))}
          />
        </div>
      </MarketingSection>
    </Layout>
  );
}

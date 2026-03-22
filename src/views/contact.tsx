"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Mail, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { TurnstileWidget } from "@/components/turnstile-widget";

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) return;
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
        <section className="flex min-h-[70vh] items-center py-20 md:py-28">
          <div className="container mx-auto max-w-lg space-y-6 px-4 text-center">
            <div className="space-y-6">
              <div className="border-brand-accent/20 mx-auto h-20 w-20 overflow-hidden rounded-full border-2">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1675186914580-94356f7c012c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJtJTIwcHJvZmVzc2lvbmFsJTIwd29tYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXQlMjBuYXR1cmFsJTIwbGlnaHR8ZW58MXx8fHwxNzczMDAzOTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Shruti Turner"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="text-brand-accent h-8 w-8" />
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl">Thank you, {formData.firstName || "there"}.</h1>
                <p className="text-muted-foreground leading-relaxed">
                  I read every enquiry personally and I'll get back to you within 2 working days. If
                  your enquiry is about 1:1 training, I may ask a few follow-up questions about your
                  conditions and goals before suggesting next steps.
                </p>
              </div>
              <blockquote className="text-muted-foreground border-brand-accent/30 mx-auto max-w-sm border-l-2 pl-4 text-left text-sm italic">
                "I know reaching out can feel like a big step, especially when you've had
                experiences where your body wasn't understood. There's no wrong question here."
                <span className="text-brand-accent mt-1 block text-xs not-italic">— Shruti</span>
              </blockquote>
              <div className="border-brand-accent/20 bg-brand-accent/5 space-y-3 rounded-lg border p-5 text-center">
                <p className="text-sm">While you wait, why not try a class?</p>
                <Link href="/login">
                  <Button className="bg-brand-accent text-brand-white hover:bg-brand-accent/90">
                    Start Your 14-Day Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-muted-foreground text-xs">No card required. Cancel anytime.</p>
              </div>
              <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
                <Link href="/classes">
                  <Button variant="outline">
                    Explore Move Well Classes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button variant="outline">Read the Blog</Button>
                </Link>
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
        canonicalUrl="https://shrutiturner.com/contact"
      />

      {/* Hero */}
      <section className="bg-brand-dark text-brand-white py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 text-4xl md:text-5xl">Get in Touch</h1>
          <p className="text-brand-accent-light text-xl leading-relaxed">
            Whether you have a specific question or want to explore how I can help, I'd love to hear
            from you. No pressure, no hard sell.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-12 md:grid-cols-5">
            {/* Form */}
            <div className="md:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">What are you interested in? *</Label>
                  <Select
                    value={formData.interest}
                    onValueChange={(v) => setFormData({ ...formData, interest: v })}
                  >
                    <SelectTrigger id="interest">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEREST_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Any conditions or context you'd like to share?</Label>
                  <p className="text-muted-foreground text-xs">
                    Optional. This helps me understand your situation before we chat. E.g. "I have
                    RA" or "recovering from knee surgery".
                  </p>
                  <Input
                    id="conditions"
                    placeholder="e.g. Psoriatic arthritis, chronic fatigue"
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howFound">How did you find me?</Label>
                  <Select
                    value={formData.howFound}
                    onValueChange={(v) => setFormData({ ...formData, howFound: v })}
                  >
                    <SelectTrigger id="howFound">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {HOW_FOUND_OPTIONS.filter((o) => o.value).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your message *</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell me a bit about what you're looking for..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <TurnstileWidget onTokenChange={setTurnstileToken} />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!formData.interest || !turnstileToken || submitting}
                >
                  {submitting ? "Sending..." : "Send Enquiry"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <p className="text-muted-foreground text-center text-xs">
                  Your information is kept private and never shared. I typically reply within 2
                  working days.
                </p>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-8 md:col-span-2">
              <div className="bg-secondary/30 space-y-4 rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-primary h-5 w-5" />
                  <h3 className="text-lg">What to expect</h3>
                </div>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>I'll reply within 2 working days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      For 1:1 enquiries, I may ask follow-up questions about your conditions before
                      recommending a plan
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>No obligation, no sales pitch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      If I'm not the right fit, I'll try to point you in the right direction
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-secondary/30 space-y-3 rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <Mail className="text-primary h-5 w-5" />
                  <h3 className="text-lg">Prefer email?</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  You can also email me directly at{" "}
                  <a
                    href="mailto:hello@shrutiturner.com"
                    className="text-primary font-medium underline decoration-2 underline-offset-3"
                  >
                    hello@shrutiturner.com
                  </a>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-3 text-lg">Not sure what you need?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  These pages might help you decide:
                </p>
                <div className="space-y-2">
                  <Link href="/classes" className="text-primary block text-sm hover:underline">
                    Explore class types &rarr;
                  </Link>
                  <Link href="/pricing" className="text-primary block text-sm hover:underline">
                    View full pricing &rarr;
                  </Link>
                  <Link href="/about" className="text-primary block text-sm hover:underline">
                    About my approach &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

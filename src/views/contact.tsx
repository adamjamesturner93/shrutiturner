"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Layout } from "@/components/layout";
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
import { usePlatformSettings } from "@/context/platform-settings-context";

const TOPIC_OPTIONS = [
  { value: "workshops-retreats-classes", label: "Workshops, retreats or classes" },
  { value: "accessibility", label: "Accessibility" },
  { value: "collaboration-speaking-content", label: "Collaboration, speaking or content" },
  { value: "existing-client-support", label: "Existing client support" },
  { value: "general", label: "General question or something else" },
] as const;

const CONTACT_CONSENT_TEXT =
  "I consent to Shruti Turner using the information in this form to respond to my enquiry. I understand this may include health or accessibility context I choose to share.";

function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return {
    firstName,
    // The existing contact contract requires both fields. Preserve single-name submissions.
    lastName: rest.join(" ") || firstName,
  };
}

export function ContactPage() {
  const { contactEmail } = usePlatformSettings();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    contactConsent: false,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!turnstileToken || !formData.contactConsent || !formData.topic) return;

    setSubmitting(true);
    setError("");

    try {
      const { firstName, lastName } = splitName(formData.name);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: formData.email,
          interest: formData.topic,
          message: formData.message,
          contactConsent: formData.contactConsent,
          contactConsentText: CONTACT_CONSENT_TEXT,
          turnstileToken,
          honeypot: "",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to send your message.");
      }

      setSubmitted(true);
      setTurnstileToken("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">Contact</p>
          <h1 className="mt-5 text-4xl leading-tight md:text-6xl">Get in touch.</h1>
          <p className="text-brand-white/80 mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
            Use this form for questions about workshops, retreats, accessibility, collaborations or
            anything else. If you’re interested in personal coaching, start with the dedicated{" "}
            <Link
              href="/coaching/enquire"
              className="text-brand-accent-light underline underline-offset-4"
            >
              coaching enquiry
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-wash px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          {submitted ? (
            <div
              className="marketing-panel rounded-[2rem] p-8 text-center shadow-[0_24px_60px_rgba(46,31,51,0.08)] md:p-12"
              aria-live="polite"
            >
              <CheckCircle2 className="text-brand-accent mx-auto h-12 w-12" />
              <h2 className="mt-6 text-3xl md:text-4xl">Thanks — your message has been sent.</h2>
              <p className="text-muted-foreground mx-auto mt-4 max-w-xl leading-relaxed">
                I usually reply within two working days. Please check your spam folder if you have
                not heard back.
              </p>
              <Button asChild variant="outline" className="mt-7">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          ) : (
            <div className="marketing-panel rounded-[2rem] p-6 shadow-[0_24px_60px_rgba(46,31,51,0.08)] md:p-9">
              <div>
                <p className="text-brand-accent text-xs tracking-[0.24em] uppercase">Message</p>
                <h2 className="mt-4 text-3xl md:text-4xl">What are you getting in touch about?</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  I usually reply within two working days.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name *</Label>
                  <Input
                    id="contact-name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-topic">What are you getting in touch about? *</Label>
                  <Select
                    value={formData.topic}
                    onValueChange={(topic) => setFormData({ ...formData, topic })}
                  >
                    <SelectTrigger id="contact-topic" className="w-full">
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPIC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message *</Label>
                  <Textarea
                    id="contact-message"
                    rows={7}
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    required
                  />
                </div>

                <TurnstileWidget onTokenChange={setTurnstileToken} />

                <label className="text-muted-foreground flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={formData.contactConsent}
                    onChange={(event) =>
                      setFormData({ ...formData, contactConsent: event.target.checked })
                    }
                    required
                    className="accent-brand-accent mt-1 h-4 w-4 shrink-0"
                  />
                  <span>{CONTACT_CONSENT_TEXT}</span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    !formData.topic || !formData.contactConsent || !turnstileToken || submitting
                  }
                >
                  {submitting ? "Sending..." : "Send message"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {error ? (
                  <p className="rounded-[1.2rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
              </form>
            </div>
          )}

          {contactEmail ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
              <Mail className="text-brand-accent h-5 w-5" />
              <p className="text-muted-foreground text-sm">
                Prefer email?{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-primary font-medium underline underline-offset-4"
                >
                  {contactEmail}
                </a>
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}

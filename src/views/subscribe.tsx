"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Calendar, Check, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function SubscribePage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !turnstileToken) return;
    setError(null);
    setSubmitting(true);

    const result = await submitNewsletterSignup({
      email,
      consent,
      marketingOptIn: consent,
      source: "subscribe",
      turnstileToken,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <Layout>
      <SEO
        title="Links & Newsletter - Shruti Turner"
        description="Move better. Hurt less. Train for life. Join the weekly newsletter and explore live adaptive yoga and strength classes for chronic illness."
        canonicalUrl="https://shrutiturner.com/subscribe"
      />

      <div className="bg-background flex min-h-[85vh] flex-col items-center px-4 py-16">
        <div className="mx-auto w-full max-w-md space-y-12">
          <div className="space-y-4 text-center">
            <div className="relative inline-block">
              <div className="relative z-10 mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-md md:h-28 md:w-28">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNDc0MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Shruti Turner profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 z-0 scale-125 rounded-full bg-[#B5C49B]/20 blur-xl" />
            </div>

            <div className="space-y-1">
              <h1 className="text-foreground text-2xl tracking-tight md:text-3xl">Shruti Turner</h1>
              <p className="font-medium text-[#849b5c]">PhD Biomechanics • Adaptive Coach</p>
            </div>

            <p className="text-muted-foreground px-4 pt-2 text-sm md:text-base">
              I help people with chronic illness and hypermobility build resilient bodies without burnout.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#2E1F33] p-6 text-[#FAFAF8] shadow-xl">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#B5C49B]/10 blur-3xl" />
            <div className="relative z-10 space-y-4">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-xl tracking-tight">The Weekly Move</h2>
                <p className="text-sm leading-relaxed text-[#FAFAF8]/80">
                  Join 2,000+ others getting weekly ideas on mobility, movement, and training longevity.
                </p>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    aria-label="Email address"
                    className="h-12 border-none bg-[#FAFAF8] text-base text-[#2E1F33] placeholder:text-[#2E1F33]/40"
                  />

                  <label className="group flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#B5C49B]"
                    />
                    <span className="text-sm leading-snug text-[#FAFAF8]/90 transition-colors group-hover:text-[#FAFAF8]">
                      I&apos;d like to receive the newsletter and occasional updates when new articles or classes are released.
                    </span>
                  </label>

                  <TurnstileWidget onTokenChange={setTurnstileToken} />

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full bg-[#B5C49B] text-base font-medium text-[#2E1F33] hover:bg-[#a5b48b]"
                    disabled={submitting || !consent || !turnstileToken}
                  >
                    {submitting ? "Submitting..." : "Get Free Updates"}
                  </Button>

                  {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}
                </form>
              ) : (
                <div className="animate-in fade-in zoom-in space-y-3 py-6 text-center duration-300">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B5C49B]/20">
                    <Check className="h-6 w-6 text-[#B5C49B]" />
                  </div>
                  <div>
                    <h3 className="text-lg">You&apos;re on the list!</h3>
                    <p className="text-sm text-[#FAFAF8]/70">Check your inbox for a confirmation email.</p>
                  </div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-[#B5C49B] hover:text-[#B5C49B]/80"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                      setConsent(false);
                      setTurnstileToken("");
                    }}
                  >
                    Use a different email
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-muted-foreground mb-4 text-center text-sm font-medium uppercase tracking-wider">
              Explore More
            </h2>

            <Link href="/schedule" className="group block">
              <div className="bg-card hover:bg-secondary/50 flex items-center rounded-xl border p-4 transition-all duration-200">
                <div className="text-primary bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 px-4">
                  <p className="text-foreground group-hover:text-primary font-medium transition-colors">Live Class Schedule</p>
                  <p className="text-muted-foreground text-xs">Adaptive yoga & strength</p>
                </div>
                <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-all group-hover:translate-x-1" />
              </div>
            </Link>

            <Link href="/classes/small-groups" className="group block">
              <div className="bg-card hover:bg-secondary/50 flex items-center rounded-xl border p-4 transition-all duration-200">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#9B6535]/10 text-[#9B6535]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 px-4">
                  <p className="text-foreground font-medium transition-colors group-hover:text-[#9B6535]">Small Group Programs</p>
                  <p className="text-muted-foreground text-xs">4-6 week focused cohorts</p>
                </div>
                <ArrowRight className="text-muted-foreground h-5 w-5 transition-all group-hover:translate-x-1 group-hover:text-[#9B6535]" />
              </div>
            </Link>

            <Link href="/pt" className="group block">
              <div className="bg-card hover:bg-secondary/50 flex items-center rounded-xl border p-4 transition-all duration-200">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#56344A]/10 text-[#56344A]">
                  <Check className="h-5 w-5" />
                </div>
                <div className="flex-1 px-4">
                  <p className="text-foreground font-medium transition-colors group-hover:text-[#56344A]">1:1 Personal Training</p>
                  <p className="text-muted-foreground text-xs">Fully personalised coaching</p>
                </div>
                <ArrowRight className="text-muted-foreground h-5 w-5 transition-all group-hover:translate-x-1 group-hover:text-[#56344A]" />
              </div>
            </Link>

            <Link href="/blog" className="group block">
              <div className="bg-card hover:bg-secondary/50 flex items-center rounded-xl border p-4 transition-all duration-200">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div className="flex-1 px-4">
                  <p className="text-foreground font-medium transition-colors group-hover:text-slate-900">Read the Blog</p>
                  <p className="text-muted-foreground text-xs">Articles on training longevity</p>
                </div>
                <ArrowRight className="text-muted-foreground h-5 w-5 transition-all group-hover:translate-x-1 group-hover:text-slate-900" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

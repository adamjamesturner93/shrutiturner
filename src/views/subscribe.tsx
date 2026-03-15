"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Download,
  Dumbbell,
  Facebook,
  GraduationCap,
  Heart,
  Instagram,
  Play,
  Sparkles,
  Users,
  Youtube,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

const GUIDE_BENEFITS = [
  "5 specific poses chosen for chronic illness and hypermobility",
  "Why each pose builds real strength, not just flexibility",
  "Modifications for flare days and low-energy sessions",
  "A printable reference card to keep by your mat",
];

const SOCIAL_LINKS = [
  { href: "https://youtube.com/@shrutiturner", label: "YouTube", icon: Youtube },
  { href: "https://instagram.com/shrutiturner", label: "Instagram", icon: Instagram },
  { href: "https://facebook.com/shrutiturner", label: "Facebook", icon: Facebook },
];

const LINKS = [
  {
    href: "/schedule",
    title: "Live Class Schedule",
    subtitle: "Adaptive yoga and strength from anywhere",
    icon: Calendar,
    colorClass: "text-primary bg-primary/10",
  },
  {
    href: "/coaching",
    title: "1:1 Coaching and Training Plans",
    subtitle: "Fully personalised support from £60/month",
    icon: Dumbbell,
    colorClass: "text-brand-plum bg-brand-plum/10",
  },
  {
    href: "/classes/small-groups",
    title: "Programmes and Themed Weeks",
    subtitle: "Focused cohorts and structured progression",
    icon: BookOpen,
    colorClass: "text-bronze-text bg-bronze-text/10",
  },
  {
    href: "/blog",
    title: "Read the Blog",
    subtitle: "Research-backed articles on training longevity",
    icon: Sparkles,
    colorClass: "text-primary bg-primary/10",
  },
];

export function SubscribePage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
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
      firstName,
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
        description="Move better. Hurt less. Train for life. Get a free yoga strength guide and join the weekly newsletter."
        canonicalUrl="https://shrutiturner.com/subscribe"
      />

      <div className="bg-background min-h-[85vh] px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-md space-y-10">
          <div className="space-y-4 text-center">
            <div className="relative inline-block">
              <div className="border-background relative z-10 mx-auto h-24 w-24 overflow-hidden rounded-full border-4 shadow-lg md:h-28 md:w-28">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNDc0MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Shruti Turner profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="bg-brand-accent-light/20 absolute inset-0 z-0 scale-125 rounded-full blur-xl" />
            </div>

            <div className="space-y-1">
              <h1 className="text-foreground text-2xl tracking-tight md:text-3xl">Shruti Turner</h1>
              <p className="text-brand-accent-muted font-medium">
                PhD Biomechanics • Adaptive Coach
              </p>
            </div>

            <p className="text-muted-foreground mx-auto max-w-xs text-sm md:text-base">
              Helping people with chronic illness and hypermobility build resilient bodies without
              burnout.
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <span className="bg-secondary/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                <GraduationCap className="h-3.5 w-3.5" />
                PhD Biomechanics
              </span>
              <span className="bg-secondary/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                <Users className="h-3.5 w-3.5" />
                2,000+ community
              </span>
              <span className="bg-secondary/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                <Heart className="h-3.5 w-3.5" />
                Living with PsA
              </span>
            </div>

            <div className="flex justify-center gap-3 pt-1">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow on ${social.label}`}
                  className="bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                >
                  <social.icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-brand-dark text-brand-white relative overflow-hidden rounded-2xl shadow-xl">
            <div className="bg-brand-accent-light/10 absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl" />
            <div className="bg-brand-plum/20 absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-3xl" />

            <div className="relative z-10 p-6 md:p-8">
              <div className="mb-4 flex justify-center">
                <span className="bg-brand-accent-light/20 text-brand-accent-light border-brand-accent-light/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Free Guide
                </span>
              </div>

              <div className="mb-5 flex justify-center">
                <div className="relative">
                  <div className="from-brand-accent-light/30 to-brand-accent-light/10 border-brand-accent-light/20 h-48 w-36 rotate-2 rounded-lg border bg-gradient-to-br p-4 shadow-lg md:h-52 md:w-40">
                    <div className="bg-brand-accent-light/30 mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full">
                      <Sparkles className="text-brand-accent-light h-5 w-5" />
                    </div>
                    <p className="text-brand-white/90 text-center text-xs leading-snug">
                      5 Yoga Poses
                      <br />
                      That Actually
                      <br />
                      Build Strength
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="bg-brand-white/10 h-1 w-full rounded-full" />
                      <div className="bg-brand-white/10 h-1 w-3/4 rounded-full" />
                      <div className="bg-brand-white/10 h-1 w-5/6 rounded-full" />
                    </div>
                  </div>
                  <div className="bg-brand-accent-light/5 border-brand-accent-light/10 absolute inset-0 -z-10 h-48 w-36 -rotate-3 rounded-lg border md:h-52 md:w-40" />
                </div>
              </div>

              <div className="mb-5 space-y-2 text-center">
                <h2 className="text-xl tracking-tight md:text-2xl">
                  5 Yoga Poses That Actually Build Strength
                </h2>
                <p className="text-brand-white/70 mx-auto max-w-xs text-sm leading-relaxed">
                  A free guide for bodies that need more than “just stretch”. Chosen specifically
                  for chronic illness and hypermobility.
                </p>
              </div>

              <ul className="mb-6 space-y-2.5">
                {GUIDE_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <div className="bg-brand-accent-light/20 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                      <Check className="text-brand-accent-light h-3 w-3" />
                    </div>
                    <span className="text-brand-white/90 leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                    aria-label="First name"
                    className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 h-12 border-none text-base"
                  />

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    aria-label="Email address"
                    className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 h-12 border-none text-base"
                  />

                  <label className="group flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="accent-brand-accent-light mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <span className="text-brand-white/80 group-hover:text-brand-white text-xs leading-snug transition-colors">
                      I&apos;d like to receive the newsletter and occasional updates about new
                      articles, classes, and offers. I can unsubscribe at any time.
                    </span>
                  </label>

                  <TurnstileWidget onTokenChange={setTurnstileToken} />

                  <Button
                    type="submit"
                    size="lg"
                    className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 h-12 w-full text-base font-medium"
                    disabled={submitting || !consent || !turnstileToken}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {submitting ? "Sending..." : "Send Me the Free Guide"}
                  </Button>

                  <p className="text-brand-white/50 text-center text-xs">
                    No spam. Unsubscribe anytime. Your data stays private.
                  </p>
                  {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}
                </form>
              ) : (
                <div className="animate-in fade-in zoom-in space-y-3 py-6 text-center duration-300">
                  <div className="bg-brand-accent-light/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                    <Check className="text-brand-accent-light h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg">Your guide is on its way!</h3>
                    <p className="text-brand-white/70 text-sm">
                      Check your inbox for the guide and confirmation email.
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="text-brand-accent-light hover:text-brand-accent-light/80 h-auto p-0"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                      setFirstName("");
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
            <h2 className="text-muted-foreground text-center text-sm font-medium tracking-wider uppercase">
              Latest on YouTube
            </h2>
            <a
              href="https://youtube.com/@shrutiturner"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <div className="bg-brand-dark/5 relative aspect-video">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZW5ndGglMjB0cmFpbmluZyUyMGNsYXNzfGVufDF8fHx8MTc3MTQ3NDIyNnww&ixlib=rb-4.1.0&q=80&w=800"
                    alt="Latest YouTube video thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                    <div className="bg-brand-white/90 group-hover:bg-brand-white flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all group-hover:scale-110">
                      <Play className="text-brand-dark ml-0.5 h-6 w-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-card p-4">
                  <p className="text-foreground group-hover:text-primary text-sm transition-colors">
                    Training With Chronic Illness: What Actually Works
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">12 min • New this week</p>
                </div>
              </div>
            </a>
          </div>

          <div className="space-y-3">
            <h2 className="text-muted-foreground mb-4 text-center text-sm font-medium tracking-wider uppercase">
              Explore More
            </h2>

            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="group block">
                <div className="bg-card hover:bg-secondary/50 flex items-center rounded-xl border p-4 transition-all duration-200">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${link.colorClass}`}
                  >
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 px-4">
                    <p className="text-foreground truncate font-medium transition-colors">
                      {link.title}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{link.subtitle}</p>
                  </div>
                  <ArrowRight className="text-muted-foreground h-5 w-5 flex-shrink-0 transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <p className="text-muted-foreground pb-4 text-center text-xs">
            Copyright Shruti Turner ·{" "}
            <Link href="/privacy" className="hover:text-foreground underline">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/unsubscribe" className="hover:text-foreground underline">
              Unsubscribe
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

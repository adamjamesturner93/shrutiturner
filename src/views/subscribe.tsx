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
import { MarketingSection, SectionHeading } from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { CANONICAL_LEAD_MAGNET, FREE_GUIDE_META_DESCRIPTION } from "@/lib/newsletter/lead-magnet";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

const GUIDE_BENEFITS = CANONICAL_LEAD_MAGNET.subscribeBenefits;

const SOCIAL_LINKS = [
  { href: "https://youtube.com/@TheChronicYogini", label: "YouTube", icon: Youtube },
  { href: "https://instagram.com/shrutiturner", label: "Instagram", icon: Instagram },
  { href: "https://facebook.com/profile.php?id=61556124191934", label: "Facebook", icon: Facebook },
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
        description={FREE_GUIDE_META_DESCRIPTION}
        canonicalUrl="https://shrutiturner.co.uk/subscribe"
      />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12">
            <div>
              <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                Newsletter + Free Guide
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl leading-[1.04] tracking-[-0.03em] md:text-[clamp(3rem,4.8vw,4.95rem)]">
                Build more strength with advice that understands fluctuating bodies.
              </h1>
              <p className="text-brand-white/80 mt-5 max-w-2xl text-lg leading-relaxed md:text-[1.2rem]">
                Get a practical guide, weekly training notes, and sharper coaching ideas for chronic
                illness, hypermobility, pain, and long-term capacity.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  Free guide download
                </span>
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  Useful weekly email
                </span>
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  Unsubscribe whenever you want
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: GraduationCap, label: "PhD Biomechanics" },
                  { icon: Users, label: "2,000+ community" },
                  { icon: Heart, label: "Living with PsA" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.label}
                      className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    >
                      <Icon className="text-brand-accent-light h-4 w-4" />
                      {item.label}
                    </span>
                  );
                })}
              </div>

              <p className="text-brand-white/72 mt-6 max-w-xl text-sm leading-relaxed">
                The first email sends the guide. After that you get practical notes on training with
                chronic illness and fluctuating capacity. No spam, no generic wellness filler.
              </p>

              <div className="mt-5 flex gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow on ${social.label}`}
                    className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 hover:bg-brand-white/14 hover:text-brand-white flex h-11 w-11 items-center justify-center rounded-full border transition-colors"
                  >
                    <social.icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>

            <div className="marketing-panel rounded-[1.9rem] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.18)] md:p-4">
              <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[1.5rem]">
                    <ImageWithFallback
                      src="/images/shruti.jpeg"
                      alt="Shruti Turner"
                      className="aspect-[4/4.3] h-full w-full object-cover"
                    />
                  </div>
                  <div className="border-brand-dark/10 bg-background rounded-[1.3rem] border px-4 py-4">
                    <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                      Inside the emails
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Training decisions, symptom-aware progressions, and honest notes on how to
                      keep building capacity without crashing.
                    </p>
                  </div>
                </div>

                <div className="bg-brand-dark text-brand-white relative overflow-hidden rounded-[1.6rem] px-5 py-6 md:px-6">
                  <div className="bg-brand-accent-light/10 absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <span className="border-brand-accent-light/20 bg-brand-accent-light/12 text-brand-accent-light inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs tracking-[0.18em] uppercase">
                      <Download className="h-3.5 w-3.5" />
                      Free Guide
                    </span>
                    <h2 className="mt-4 text-2xl leading-tight md:text-[1.9rem]">
                      {CANONICAL_LEAD_MAGNET.title}
                    </h2>
                    <p className="text-brand-white/76 mt-3 text-sm leading-relaxed md:text-base">
                      {CANONICAL_LEAD_MAGNET.cardDescription}
                    </p>

                    <ul className="mt-5 space-y-3">
                      {GUIDE_BENEFITS.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-3">
                          <div className="bg-brand-accent-light/20 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                            <Check className="text-brand-accent-light h-3.5 w-3.5" />
                          </div>
                          <span className="text-brand-white/88 text-sm leading-relaxed">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {!submitted ? (
                      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          required
                          aria-label="First name"
                          className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 h-11 border-none text-base"
                        />

                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          aria-label="Email address"
                          className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 h-11 border-none text-base"
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
                          className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 h-11 w-full text-base font-medium"
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
                      <div className="animate-in fade-in zoom-in border-brand-white/10 bg-brand-white/8 mt-6 space-y-3 rounded-[1.4rem] border p-5 text-center duration-300">
                        <div className="bg-brand-accent-light/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                          <Check className="text-brand-accent-light h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg">Your guide is on its way.</h3>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection className="section-wash" compact>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="marketing-panel rounded-[1.75rem] p-7">
            <SectionHeading
              eyebrow="What You’ll Get"
              title="Useful notes, not filler."
              description="Expect practical coaching emails, new article updates, and occasional offers when something genuinely new is open."
            />
          </div>

          <div className="grid gap-6">
            <a
              href="https://youtube.com/@TheChronicYogini"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="border-brand-dark/10 bg-background overflow-hidden rounded-[1.75rem] border shadow-[0_20px_50px_rgba(46,31,51,0.06)]">
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
                <div className="bg-card p-5">
                  <p className="text-foreground group-hover:text-primary text-sm transition-colors">
                    Training With Chronic Illness: What Actually Works
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">12 min • New this week</p>
                </div>
              </div>
            </a>

            <div className="grid gap-3 sm:grid-cols-2">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="group block">
                  <div className="bg-card hover:bg-secondary/50 border-brand-dark/10 flex h-full items-start rounded-[1.4rem] border p-4 shadow-[0_18px_40px_rgba(46,31,51,0.05)] transition-all duration-200">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${link.colorClass}`}
                    >
                      <link.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <p className="text-foreground leading-snug font-medium transition-colors">
                        {link.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {link.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0 transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </MarketingSection>
    </Layout>
  );
}

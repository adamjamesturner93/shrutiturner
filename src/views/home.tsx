"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  GraduationCap,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  JourneySection,
  MarketingSection,
  PathCards,
  PreFooterCtaSection,
  ProofBand,
  PullQuote,
  SectionHeading,
  StorySplit,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { blogPosts } from "@/data/blog-data";
import { homepageTestimonials, publicProofItems, servicePathCards } from "@/data/public-refresh";

const serviceIcons = {
  heart: Heart,
  users: Users,
  user: User,
  sparkles: Sparkles,
} as const;

export function HomePage() {
  const searchParams = useSearchParams();
  const recentPosts = blogPosts.slice(0, 3);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterTurnstileToken, setNewsletterTurnstileToken] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const signupCopy = useNewsletterSignupCopy();
  const verifiedState = searchParams.get("verified");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterError(null);
    setNewsletterSubmitting(true);

    const result = await submitNewsletterSignup({
      email: newsletterEmail,
      firstName: newsletterFirstName,
      marketingOptIn: newsletterConsent,
      consent: newsletterConsent,
      source: "homepage",
      turnstileToken: newsletterTurnstileToken,
    });

    setNewsletterSubmitting(false);

    if (!result.ok) {
      setNewsletterError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    setNewsletterSubmitted(true);
    setTimeout(() => {
      setNewsletterSubmitted(false);
      setNewsletterEmail("");
      setNewsletterFirstName("");
      setNewsletterConsent(false);
      setNewsletterTurnstileToken("");
    }, 3000);
  };

  return (
    <Layout>
      {verifiedState === "success" ? (
        <div className="bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="container mx-auto flex max-w-7xl items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Your email is confirmed. Check your inbox for the guide and future updates.
          </div>
        </div>
      ) : null}
      {verifiedState === "invalid" ? (
        <div className="bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <div className="container mx-auto flex max-w-7xl items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            That confirmation link has expired or is no longer valid. Subscribe again and we&apos;ll
            send a fresh email.
          </div>
        </div>
      ) : null}
      <SEO
        title="Shruti Turner - Strength & Yoga for Complex Bodies"
        description="Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies. Rehabilitation-informed training that builds capacity without pretending your body is simple."
        keywords="strength training chronic illness, yoga autoimmune disease, psoriatic arthritis coaching, rheumatoid arthritis exercise, chronic pain strength training, hypermobility yoga, adaptive fitness coaching"
        canonicalUrl="https://shrutiturner.com"
      />

      <EditorialHero
        eyebrow="Strength and Yoga for Complex Bodies"
        size="compact"
        title={
          <>
            Build strength that listens to your body,
            <span className="text-brand-accent-light"> not against it.</span>
          </>
        }
        description="Movement coaching for chronic illness, autoimmune conditions, pain, hypermobility, and bodies that do not follow tidy rules. Evidence-based, adaptation-friendly, and designed for long-term capacity."
        primaryCta={{ href: "/classes", label: "Explore Move Well Classes" }}
        secondaryCta={{ href: "/coaching", label: "See 1:1 Coaching" }}
        stats={[
          { value: "PhD", label: "Biomechanics and rehabilitation depth" },
          { value: "760+", label: "Hours of yoga training" },
          { value: "3", label: "Ways to work together each week" },
        ]}
        metrics={[
          {
            label: "Built For",
            detail: "People tired of being told to either push through or back off forever.",
          },
          {
            label: "Approach",
            detail:
              "Adaptive yoga, intelligent strength, and better decision-making under fluctuation.",
          },
          {
            label: "Difference",
            detail: "Lived experience plus research literacy, not generic wellness copy.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/5 relative overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/4.75] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner teaching strength and yoga coaching for complex bodies"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="grid gap-3 px-2 pt-4 md:grid-cols-2">
                <div className="bg-brand-white/10 rounded-[1.1rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    What clients need
                  </p>
                  <p className="text-brand-white/85 mt-2 text-sm leading-relaxed">
                    Permission to build capacity without pretending symptoms are irrelevant.
                  </p>
                </div>
                <div className="bg-brand-accent-light/12 rounded-[1.1rem] p-4 backdrop-blur-sm">
                  <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                    What changes
                  </p>
                  <p className="text-brand-white/85 mt-2 text-sm leading-relaxed">
                    More confidence loading joints, more trust in pacing, less boom and bust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="Why this feels different"
        description="You should be able to feel the difference early: clearer reasoning, smarter adaptations, and coaching that respects complexity without lowering ambition."
        items={[...publicProofItems]}
      />

      <StorySplit
        eyebrow="The Real Problem"
        title="Most fitness advice assumes your body is predictable."
        description="That is usually where the mismatch starts. Complex bodies do not need lower standards. They need better calibration."
        body={
          <div className="space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Generic programmes often fail because they only have two settings: push or rest. If
              your symptoms fluctuate, that creates an all-or-nothing relationship with movement.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "You get told to listen to your body, but not how to interpret what it is saying.",
                "You get taught modifications, but not progression that still feels ambitious.",
                "You get sympathy, but not a plan that helps you build real strength.",
                "You get wellness language, but not enough technical reasoning to trust it.",
              ].map((item) => (
                <div key={item} className="marketing-panel rounded-[1.4rem] px-5 py-5">
                  <p className="text-foreground text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        }
        aside={
          <div className="space-y-6">
            <PullQuote
              quote="You do not need to be protected from challenge. You need challenge that responds intelligently when your body changes."
              attribution="Shruti Turner"
            />
            <div className="border-brand-dark/10 bg-brand-warm rounded-[1.75rem] border p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                The coaching philosophy
              </p>
              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Understand first",
                    body: "Notice triggers, joint behaviour, fatigue patterns, and what challenge actually feels like.",
                    icon: BookOpen,
                  },
                  {
                    title: "Move with options",
                    body: "Use yoga and strength together to create regulation, awareness, and more movement choices.",
                    icon: Heart,
                  },
                  {
                    title: "Build capacity",
                    body: "Progress load gradually enough that your confidence grows alongside your tissue tolerance.",
                    icon: Dumbbell,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="bg-background flex items-start gap-4 rounded-[1.2rem] px-4 py-4"
                    >
                      <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg">{item.title}</h3>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        }
        className="section-divider"
      />

      <MarketingSection className="section-wash">
        <SectionHeading
          eyebrow="Who This Is For"
          title="For people who want strength, steadiness, and more room in their life."
          description="You might be managing chronic illness, autoimmune disease, hypermobility, pain, fatigue, or a longer injury story. The common thread is usually this: you are thoughtful, capable, and tired of being given oversimplified answers."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="marketing-panel rounded-[1.75rem] p-7 md:p-8">
            <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
              What you may be feeling
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "Frustrated by advice that treats flare days as failure.",
                "Unsure what safe loading is supposed to feel like.",
                "Ready for a coach who speaks to you like an intelligent adult.",
                "Looking for progress without the usual crash afterwards.",
              ].map((item) => (
                <div
                  key={item}
                  className="border-brand-dark/10 bg-background rounded-[1.2rem] border px-5 py-4 text-sm leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Bodies with nuance",
                body: "Arthritis, autoimmune conditions, hypermobility, pain, fatigue, and long-term recovery stories.",
              },
              {
                title: "Clients who research",
                body: "People who want recommendations to make sense biomechanically and practically.",
              },
              {
                title: "Progress without denial",
                body: "You still want ambition. You just do not want it built on pretending your body is simple.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <h3 className="text-2xl">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Ways To Work Together"
          title="Choose the level of structure and support your body needs right now."
          description="Start with classes to build rhythm. Choose small groups for accountability and focus. Move into coaching when you need the deepest strategy and support."
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

      <MarketingSection className="bg-brand-dark text-brand-white">
        <SectionHeading
          eyebrow="What It Looks Like"
          title="A better relationship with training is built in layers."
          description="The goal is not to be permanently careful. The goal is to become better at interpreting your body, choosing the right version of the work, and accumulating enough consistent reps that capacity grows."
          align="center"
          className="text-brand-white"
          eyebrowClassName="text-brand-accent-light"
          descriptionClassName="text-brand-white/80"
        />
        <div className="mt-12">
          <JourneySection
            steps={[
              {
                title: "Start where you are",
                description:
                  "Use classes, programming, or coaching that match your current bandwidth, not your fantasy bandwidth.",
              },
              {
                title: "Learn your signals",
                description:
                  "Understand the difference between useful challenge, symptom noise, and genuine overload.",
              },
              {
                title: "Accumulate consistency",
                description:
                  "Keep showing up across good days, average days, and flare days with appropriate versions of the work.",
              },
              {
                title: "Build more room",
                description:
                  "Over time, training feels less fragile and your life feels less organised around avoiding setbacks.",
              },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Client Voice"
              title="What people say when the coaching finally fits."
              description="The best response is not that classes feel easy. It is that they feel possible, specific, and worth coming back to."
            />
            <div className="text-brand-dark mt-8 flex items-center gap-3 text-sm">
              <MessageCircle className="h-4 w-4" />
              Testimonials below use approved representative phrasing and should be replaced with
              final client-approved quotes when available.
            </div>
          </div>
          <div className="grid gap-5">
            {homepageTestimonials.map((testimonial, index) => (
              <blockquote
                key={testimonial.quote}
                className={`rounded-[1.65rem] border p-7 shadow-[0_18px_45px_rgba(46,31,51,0.06)] ${
                  index === 1 ? "bg-brand-dark text-brand-white" : "bg-background"
                }`}
              >
                <p className="text-xl leading-relaxed">{testimonial.quote}</p>
                <footer
                  className={`mt-5 text-xs tracking-[0.18em] uppercase ${
                    index === 1 ? "text-brand-accent-light" : "text-brand-accent"
                  }`}
                >
                  {testimonial.attribution}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Learn With Me"
              title="Resources for people who like understanding the why."
              description="If you are the kind of person who reads before they buy, start here. The writing is part of the offer, not an afterthought."
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="border-brand-dark/10 bg-background flex h-full flex-col rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                  {post.tags[0] || "Article"}
                </p>
                <h3 className="mt-4 text-[1.7rem] leading-[1.1] tracking-[-0.02em]">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mt-4 flex-1 text-sm leading-relaxed">
                  {post.excerpt}
                </p>
                <Button asChild variant="link" className="text-brand-accent mt-5 px-0">
                  <Link href={`/blog/${post.id}`}>
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Stay In The Loop"
        title="Get thoughtful emails, not generic motivation."
        description={signupCopy.hookText}
        aside={
          <div className="marketing-panel rounded-[2rem] p-7 md:p-8">
            {!newsletterSubmitted ? (
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <Input
                  type="text"
                  value={newsletterFirstName}
                  onChange={(e) => setNewsletterFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  className="bg-background"
                />
                <Input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={signupCopy.formPlaceholder}
                  required
                  className="bg-background"
                />
                <TurnstileWidget onTokenChange={setNewsletterTurnstileToken} />
                <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="accent-brand-accent mt-1 h-4 w-4"
                    required
                  />
                  <span>I want emails about classes, coaching, resources, and updates.</span>
                </label>
                <p className="text-muted-foreground text-xs">{signupCopy.consentText}</p>
                {newsletterError ? <p className="text-sm text-red-600">{newsletterError}</p> : null}
                <Button
                  type="submit"
                  size="lg"
                  disabled={newsletterSubmitting || !newsletterConsent || !newsletterTurnstileToken}
                  className="bg-brand-dark hover:bg-brand-dark/90 text-brand-white w-full"
                >
                  {newsletterSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
                </Button>
              </form>
            ) : (
              <div className="bg-brand-dark text-brand-white rounded-[1.5rem] px-6 py-8 text-center">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  Confirmed
                </p>
                <p className="mt-4 text-2xl">{signupCopy.successMessage}</p>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <GraduationCap className="text-brand-accent-light mt-1 h-5 w-5" />
            <p className="text-brand-white/84 text-sm leading-relaxed">
              Expect nuance on movement, pacing, chronic illness, and strength training.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="text-brand-accent-light mt-1 h-5 w-5" />
            <p className="text-brand-white/84 text-sm leading-relaxed">
              No spam, no hustle language, and no pressure to become a different person.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="text-brand-accent-light mt-1 h-5 w-5" />
            <p className="text-brand-white/84 text-sm leading-relaxed">
              Useful when you want to keep learning before joining classes or coaching.
            </p>
          </div>
        </div>
      </PreFooterCtaSection>
    </Layout>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  GraduationCap,
  Heart,
  Shield,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
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
import { publicProofItems } from "@/data/public-refresh";
import { getPricingCoachingRows } from "@/lib/billing/pricing-page-model";
import type { BlogPostContent, TestimonialContent } from "@/lib/content";

interface HomePageProps {
  recentPosts: BlogPostContent[];
  testimonials: TestimonialContent[];
}

export function HomePage({ recentPosts, testimonials }: HomePageProps) {
  const searchParams = useSearchParams();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterTurnstileToken, setNewsletterTurnstileToken] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const signupCopy = useNewsletterSignupCopy();
  const verifiedState = searchParams.get("verified");
  const coachingRows = getPricingCoachingRows();

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
        title="Shruti Turner - Inclusive 1:1 Movement Support"
        description="Science-backed 1:1 movement support for adults with chronic illness, autoimmune conditions and injury recovery or prevention. Rehabilitation-informed training that builds capacity with care."
        keywords="strength training chronic illness, yoga autoimmune disease, psoriatic arthritis coaching, rheumatoid arthritis exercise, chronic pain strength training, hypermobility yoga, adaptive fitness coaching"
        canonicalUrl="https://shrutiturner.co.uk"
      />

      <EditorialHero
        eyebrow="Understanding | Movement | Strength"
        size="compact"
        title={
          <>
            Movement that works <span className="text-brand-accent-light">with your body</span>, not
            against it.
          </>
        }
        description="Evidence-informed 1:1 support for building strength, confidence and capacity when health, energy, pain or injury history mean generic plans fall short."
        primaryCta={{ href: "/coaching", label: "Explore 1:1 Offers" }}
        secondaryCta={{ href: "/coaching/apply", label: "Apply to Work Together" }}
        stats={[
          { value: "PhD", label: "Musculoskeletal rehabilitation" },
          { value: "460+", label: "Completed yoga and trauma-informed training hours" },
          {
            value: "L4",
            label: "Strength, nutrition, obesity, diabetes, low back pain and exercise referral",
          },
        ]}
        metrics={[
          {
            label: "Built For",
            detail:
              "People tired of trying to stick to standard fitness advice that doesn't work for them.",
          },
          {
            label: "Approach",
            detail: "Tailored movement, intelligent strength and better decision-making.",
          },
          {
            label: "Difference",
            detail: "Lived experience plus individualised, research backed approach.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/5 relative overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/4.75] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner hiking in the mountains"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        }
      />

      <div id="credentials">
        <ProofBand
          title="Why this feels different"
          description="Clearer reasoning, smarter adaptations and support that respects your health and life circumstances without underestimating your potential."
          items={[...publicProofItems]}
        />
      </div>

      <StorySplit
        eyebrow="The Real Problem"
        title="Most fitness advice assumes your body is predictable."
        description="That is usually where the mismatch starts. Chronic illness, autoimmune conditions and injury recovery do not need lower standards. They need better calibration."
        body={
          <div className="space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Generic programmes often fail because they don't account for fluctuating health
              circumstances, which can lead to an unhealthy relationship with movement.
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
              quote="We’re not weak or incapable because of our bodies. We need and deserve training that works with our body and not against it."
              attribution="Shruti Turner"
            />
            <div className="border-brand-dark/10 bg-brand-warm rounded-[1.75rem] border p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                The working philosophy
              </p>
              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Understand first",
                    body: "Notice triggers, joint behaviour, fatigue patterns and what healhy challenge actually feels like.",
                    icon: BookOpen,
                  },
                  {
                    title: "Move with options",
                    body: "Use different forms of movement (e.g. cardio, strength, yoga) together to create regulation, awareness and more movement choices.",
                    icon: Heart,
                  },
                  {
                    title: "Build strength",
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
          title="For people who want strength, capacity and longevity in their lives."
          description="You might be managing long-term conditions, pain, fatigue or recovering from injury. You are ready to understand your body, move with purpose and build strength with individual support that takes your circumstances seriously."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="marketing-panel rounded-[1.75rem] p-7 md:p-8">
            <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
              What you may be feeling
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "Frustrated by advice that makes flares feel like a failure.",
                "Unsure what safe loading is supposed to feel like.",
                "Looking for sustainable progress and longevity.",
                "Ready for a coach who treats you as a fully capable individual.",
                "Unable to understand what your body is trying to tell you.",
                "Wanting to do things you love but your body is holding you back.",
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
                body: "Arthritis, autoimmune conditions, hypermobility, pain, fatigue and long-term recovery.",
              },
              {
                title: "People who want to understand",
                body: "Individuals who want recommendations to make sense biomechanically and practically.",
              },
              {
                title: "Sustainable progress",
                body: "You have ambition and want to achieve it around your health, life and capacity.",
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
        <div className="border-brand-white/12 bg-brand-white/7 mt-8 grid gap-6 rounded-[1.6rem] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="bg-brand-accent-light/15 flex h-12 w-12 items-center justify-center rounded-2xl">
            <CalendarDays className="text-brand-accent-light h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl">Retreats for movement, rest and recovery.</h3>
            <p className="text-brand-white/72 mt-2 text-sm leading-relaxed">
              Small retreat experiences for people who want adaptive movement, thoughtful pacing and
              space to recover without pressure to perform wellness.
            </p>
          </div>
          <Button asChild variant="secondary" className="justify-between">
            <Link href="/retreats">
              Explore retreats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </MarketingSection>

      <MarketingSection id="work-with-me" className="bg-brand-dark text-brand-white">
        <SectionHeading
          eyebrow="Ways To Work Together"
          title="Choose the level of structure and support your body needs right now."
          description="Start with the 1:1 offer that looks closest to your current needs. Shruti reviews each application before payment to maximise your chances of thriving in the programme."
          align="center"
          eyebrowClassName="text-brand-accent-light"
          descriptionClassName="text-brand-white/78"
        />
        <div className="mt-12">
          <div className="border-brand-white/10 bg-brand-white/7 mt-10 overflow-hidden rounded-[1.6rem] border shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  1:1 offer comparison showing who each offer is for, what it is, inclusions, and
                  investment.
                </caption>
                <thead className="bg-brand-white/10 text-brand-white">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-medium">
                      Offer
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium">
                      Who&apos;s it for?
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium">
                      What is it?
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium">
                      Includes
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium">
                      Investment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-brand-white/10 divide-y">
                  {coachingRows.map((tier) => (
                    <tr key={tier.id}>
                      <th scope="row" className="px-5 py-5 align-top font-medium">
                        {tier.name}
                      </th>
                      <td className="text-brand-white/72 px-5 py-5 align-top">{tier.bestFor}</td>
                      <td className="text-brand-white/72 px-5 py-5 align-top">{tier.whatItIs}</td>
                      <td className="px-5 py-5 align-top">
                        <ul className="space-y-2">
                          {tier.features.map((feature) => (
                            <li key={feature} className="text-brand-white/72 flex gap-2">
                              <Check className="text-brand-accent-light mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="text-brand-white/88 px-5 py-5 align-top">{tier.priceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MarketingSection>

      {testimonials.length > 0 ? (
        <MarketingSection className="section-wash">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading eyebrow="Client Voice" title="What people say about working with me." />
            <div className="grid gap-5">
              {testimonials.map((testimonial, index) => (
                <blockquote
                  key={testimonial.id}
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
                    {[testimonial.authorName, testimonial.authorCondition]
                      .filter(Boolean)
                      .join(" - ")}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </MarketingSection>
      ) : null}

      <MarketingSection className="section-divider">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Learn With Me"
            title="Resources for people who like understanding the why."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="border-brand-dark/10 bg-background flex h-full flex-col rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <p className="text-brand-accent text-xs tracking-[0.18em] uppercase">
                  {post.tags[0] || "Article"}
                </p>
                <h3 className="mt-4 text-[clamp(1.35rem,2vw,1.9rem)] leading-tight [overflow-wrap:anywhere]">
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
                  <span>I want emails about 1:1 support, resources and updates.</span>
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
              Expect evidence based thoughts on movement, pacing, chronic illness and strength
              training.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="text-brand-accent-light mt-1 h-5 w-5" />
            <p className="text-brand-white/84 text-sm leading-relaxed">
              No spam, no hustle language and no pressure to become a different person.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="text-brand-accent-light mt-1 h-5 w-5" />
            <p className="text-brand-white/84 text-sm leading-relaxed">
              A touchpoint to keep up with latest blog posts, monthly developments and exclusive
              offers.
            </p>
          </div>
        </div>
      </PreFooterCtaSection>
    </Layout>
  );
}

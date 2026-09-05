"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import { Layout } from "@/components/layout";
import { MarketingSection } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { CANONICAL_LEAD_MAGNET } from "@/lib/newsletter/lead-magnet";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

const NEWSLETTER_BENEFITS = [
  "Practical explanations of movement, strength and wellbeing",
  "Ideas you can adapt to your goals, capacity and real life",
  "New articles and first access to retreats and workshops",
  `The welcome guide: ${CANONICAL_LEAD_MAGNET.title}`,
] as const;

export function SubscribePage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupState, setSignupState] = useState<"pending" | "subscribed">("pending");

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

    setSignupState(result.state || "pending");
    setSubmitted(true);
  };

  return (
    <Layout showFooterNewsletter={false}>
      <MarketingSection className="bg-background">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <div className="max-w-3xl">
            <p className="text-brand-accent mb-5 text-xs font-medium tracking-[0.3em] uppercase">
              Newsletter
            </p>
            <h1 className="text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl lg:text-6xl">
              Practical ideas for moving, training and feeling stronger.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
              Join my newsletter for evidence-informed notes on movement, strength and wellbeing,
              written to help you make confident choices for your body and real life.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="border-brand-dark/10 bg-brand-dark/5 overflow-hidden rounded-[2rem] border p-3 shadow-[0_24px_60px_rgba(46,31,51,0.1)]">
              <div className="aspect-[4/4.25] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner smiling while hiking in Patagonia"
                  className="h-full w-full object-cover object-[center_60%]"
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 38vw"
                />
              </div>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash section-divider">
        <div className="marketing-panel rounded-[2rem] p-5 md:p-8 lg:p-10">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
            <div className="py-2 lg:py-4">
              <p className="text-brand-accent text-xs font-medium tracking-[0.28em] uppercase">
                What you&apos;ll receive
              </p>
              <h2 className="mt-4 text-3xl leading-tight md:text-4xl">Useful notes, not filler.</h2>
              <p className="text-muted-foreground mt-5 text-base leading-relaxed md:text-lg">
                Expect practical coaching emails, new article updates and occasional offers when
                something genuinely new is open.
              </p>

              <ul className="mt-8 space-y-4">
                {NEWSLETTER_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="bg-brand-accent/10 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
                      <Check className="text-brand-accent h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-foreground leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="border-brand-dark/10 bg-background mt-8 flex items-start gap-4 rounded-[1.4rem] border p-5">
                <span className="bg-brand-accent/10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
                  <Download className="text-brand-accent h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">A free welcome guide</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    <span className="text-foreground italic">{CANONICAL_LEAD_MAGNET.title}</span>.{" "}
                    {CANONICAL_LEAD_MAGNET.cardDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-dark text-brand-white relative overflow-hidden rounded-[1.75rem] p-6 shadow-[0_24px_60px_rgba(46,31,51,0.16)] md:p-8 lg:p-9">
              <div className="bg-brand-accent-light/10 absolute -top-16 -right-12 h-44 w-44 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-brand-accent-light flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Newsletter + welcome guide
                </p>
                <p className="text-brand-white/78 mt-4 leading-relaxed">
                  Confirm your email and I&apos;ll send you the free guide{" "}
                  <span className="text-brand-white italic">{CANONICAL_LEAD_MAGNET.title}</span>,
                  followed by useful notes on movement, strength and wellbeing.
                </p>

                {!submitted ? (
                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                      <label htmlFor="subscribe-first-name" className="text-sm font-medium">
                        First name
                      </label>
                      <Input
                        id="subscribe-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your first name"
                        required
                        className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 mt-2 h-12 border-none text-base"
                      />
                    </div>

                    <div>
                      <label htmlFor="subscribe-email" className="text-sm font-medium">
                        Email address
                      </label>
                      <Input
                        id="subscribe-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        className="bg-brand-white text-brand-dark placeholder:text-brand-dark/40 mt-2 h-12 border-none text-base"
                      />
                    </div>

                    <label className="group flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="accent-brand-accent-light mt-0.5 h-5 w-5 flex-shrink-0"
                      />
                      <span className="text-brand-white/80 group-hover:text-brand-white text-sm leading-relaxed transition-colors">
                        I&apos;d like to receive the newsletter and occasional updates about new
                        articles, coaching and offers. I can unsubscribe at any time.
                      </span>
                    </label>

                    <TurnstileWidget
                      onTokenChange={setTurnstileToken}
                      className="border-brand-white/25 bg-brand-white/5 text-brand-white/72"
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 h-12 w-full text-base font-medium"
                      disabled={submitting || !consent || !turnstileToken}
                    >
                      {submitting ? "Joining..." : "Join the newsletter"}
                    </Button>

                    <p className="text-brand-white/55 text-center text-xs leading-relaxed">
                      No spam. Unsubscribe anytime. Your details are kept private.
                    </p>
                    {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}
                  </form>
                ) : (
                  <div className="animate-in fade-in zoom-in border-brand-white/10 bg-brand-white/8 mt-8 space-y-4 rounded-[1.4rem] border p-6 text-center duration-300">
                    <div className="bg-brand-accent-light/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                      <Check className="text-brand-accent-light h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl">
                        {signupState === "subscribed"
                          ? "You’re already subscribed."
                          : "Check your inbox."}
                      </h3>
                      <p className="text-brand-white/70 mt-2 text-sm leading-relaxed">
                        {signupState === "subscribed"
                          ? "Your email is already confirmed, so there’s nothing else you need to do."
                          : "Confirm your email to join the newsletter. Your free guide will arrive straight after confirmation."}
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
                        setSignupState("pending");
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
      </MarketingSection>
    </Layout>
  );
}

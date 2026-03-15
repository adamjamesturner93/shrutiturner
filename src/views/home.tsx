"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Heart,
  Users,
  User,
  Sparkles,
  GraduationCap,
  Award,
  Shield,
  Dumbbell,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { blogPosts } from "../data/blog-data";
import { useState } from "react";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function HomePage() {
  const recentPosts = blogPosts.slice(0, 3);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterTurnstileToken, setNewsletterTurnstileToken] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const signupCopy = useNewsletterSignupCopy();

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
      <SEO
        title="Shruti Turner - Strength & Yoga for Complex Bodies"
        description="Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies. Rehabilitation-informed training that builds capacity without pretending your body is simple."
        keywords="strength training chronic illness, yoga autoimmune disease, psoriatic arthritis coaching, rheumatoid arthritis exercise, chronic pain strength training, hypermobility yoga, adaptive fitness coaching"
        canonicalUrl="https://shrutiturner.com"
      />

      {/* Hero Section - Clear single CTA */}
      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="text-brand-accent-light text-lg">
                Understanding · Movement · Strength
              </div>
              <h1 className="text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Understand Your Body. Build Sustainable Strength.
              </h1>
              <p className="text-brand-white/90 text-xl leading-relaxed md:text-2xl">
                Movement coaching for complex bodies. I help people living with chronic illness,
                autoimmune conditions, and hypermobility build strength that listens to your body,
                not against it.
              </p>
              <p className="text-sm opacity-75">
                PhD Rehabilitation · MSc Biomedical Engineering · 760hr+ Yoga Training · Level 4
                S&C · CIMSPA
              </p>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Link href="/classes">
                  <Button
                    size="lg"
                    className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 px-8 text-lg"
                  >
                    Explore Move Well Classes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/coaching">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-brand-accent-light text-brand-accent-light hover:bg-brand-accent-light/10 bg-transparent px-8 text-lg"
                  >
                    1:1 Coaching
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-secondary/30 aspect-[3/4] overflow-hidden rounded">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1664673531303-c933ac4cee70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGZpdG5lc3MlMjBpbnN0cnVjdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNTkxOTA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Shruti Turner - Strength and Yoga Coach specialising in chronic illness and autoimmune conditions"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Trust Strip - EEAT */}
      <section className="bg-secondary/30 border-b py-6">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-muted-foreground flex items-center gap-2">
              <GraduationCap className="text-primary h-5 w-5" />
              <span className="text-sm">PhD Rehabilitation</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Award className="text-primary h-5 w-5" />
              <span className="text-sm">MSc Biomedical Engineering</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Heart className="text-primary h-5 w-5" />
              <span className="text-sm">760hr+ Yoga Training</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              <span className="text-sm">Level 4 S&C · CIMSPA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Early on the page */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-background border-primary space-y-4 rounded-lg border border-l-4 p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "Finally, a yoga teacher who understands that my body isn't just 'tight' — it's
                complex. The adaptations are intelligent, not patronising."
              </p>
              <p className="text-sm">— Sarah, Hypermobility EDS</p>
            </div>
            <div className="bg-background border-primary space-y-4 rounded-lg border border-l-4 p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "I've built more strength in 12 weeks than in years of trying generic programmes.
                Shruti actually gets what it's like to train with chronic illness."
              </p>
              <p className="text-sm">— James, Rheumatoid Arthritis</p>
            </div>
            <div className="bg-background border-primary space-y-4 rounded-lg border border-l-4 p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "The small group programme gave me the accountability I needed and a community that
                understands. No toxic positivity, just real support."
              </p>
              <p className="text-sm">— Elena, Chronic Fatigue</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs italic">
            [Placeholder testimonials — real testimonials to be added]
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl md:text-5xl">Who This Is For</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
              This is for adults living with chronic illness, autoimmune conditions, arthritis, and
              complex bodies who want strength and adventure — not restriction.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl">You might have:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>Psoriatic or rheumatoid arthritis</li>
                <li>Autoimmune conditions</li>
                <li>Chronic pain</li>
                <li>Hypermobility</li>
                <li>Long-term injury recovery</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">And you are:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>Intelligent and research-oriented</li>
                <li>Frustrated by generic fitness advice</li>
                <li>Tired of being told to "just rest"</li>
                <li>Burned by trainers or classes that didn't listen</li>
                <li>Ready to build genuine capacity</li>
                <li>Looking for evidence-based approaches</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Promise */}
      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-8 text-3xl leading-tight md:text-5xl">
            Train with your body, not against it.
          </h2>
          <p className="text-xl leading-relaxed opacity-90">
            This is not generic fitness. This is intelligent, evidence-based training for bodies
            that require nuance.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl md:text-5xl">My Coaching Philosophy</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
              Every decision I make is guided by three principles: understanding, movement, and
              strength.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Understanding",
                body: "Before we load, we listen. I help you understand your body, your triggers, and the difference between challenge and threat.",
                icon: BookOpen,
              },
              {
                title: "Movement",
                body: "Yoga and strength aren't opposites. They work together to build awareness, regulation, and movement choices that hold up in real life.",
                icon: Heart,
              },
              {
                title: "Strength",
                body: "Progressive load tolerance is built gradually and adapted intelligently, so you can get stronger without sliding into boom-and-bust training.",
                icon: Dumbbell,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-background rounded-lg border p-8 text-center">
                  <div className="bg-primary/10 mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full">
                    <Icon className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-4 text-2xl">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-8 text-center text-lg">
            You won&apos;t be pushed too hard, but you won&apos;t be held back by fear either.
          </p>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl md:text-5xl">Choose Your Path</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
              Start with classes to build trust. Add structure with a small group. Step into 1:1
              coaching when you need the deepest support.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Move Well Classes */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="bg-brand-accent/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Heart className="text-brand-accent h-6 w-6" />
              </div>
              <h3 className="text-xl">Move Well Membership</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Adaptive yoga and intelligent strength training designed for fluctuating capacity,
                with regular live classes and a flare-friendly structure.
              </p>
              <p className="text-bronze-text text-sm">From £29/month · 14-day trial</p>
              <Link href="/classes">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Explore Move Well Classes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Coaching */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <User className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">1:1 Coaching</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Three tiers of personalised support, from tailored programming to high-touch
                coaching for more complex needs.
              </p>
              <p className="text-bronze-text text-sm">From £60/month · Free enquiry</p>
              <Link href="/coaching">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Small Group Programmes */}
            <div className="bg-background border-primary group relative space-y-4 rounded-lg border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="absolute -top-3 right-4">
                <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-3 py-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  Limited
                </span>
              </div>
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Small Group Programmes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Structured multi-week cohorts for people who want deeper progression, stronger
                accountability, and more individual attention than regular classes provide.
              </p>
              <p className="text-bronze-text text-sm">From £120 per programme</p>
              <Link href="/classes/small-groups">
                <Button className="w-full">
                  View Programmes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Retreats */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="bg-brand-plum/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Sparkles className="text-brand-plum h-6 w-6" />
              </div>
              <h3 className="text-xl">Retreats</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                In-person weekend experiences combining rest, movement, and community for bodies
                that need more thought.
              </p>
              <p className="text-bronze-text text-sm">From £350 per retreat</p>
              <Link href="/retreats">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  View Retreats
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">Not Sure Which Is Right for You?</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Compare the options to find the best fit for your needs, budget, and goals.
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="bg-background w-full border-collapse overflow-hidden rounded-lg border">
              <thead>
                <tr className="bg-brand-dark text-brand-white">
                  <th className="p-4 text-left font-medium">Feature</th>
                  <th className="p-4 text-center font-medium">Move Well Classes</th>
                  <th className="border-brand-white/10 border-x p-4 text-center font-medium">
                    Small Group Programmes
                  </th>
                  <th className="p-4 text-center font-medium">Coaching</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Personalised programming</td>
                  <td className="p-4 text-center">
                    <span className="text-muted-foreground">Real-time modifications</span>
                  </td>
                  <td className="border-x p-4 text-center">
                    <span className="text-muted-foreground">Individual feedback each session</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-primary">
                      <Check className="mx-auto h-5 w-5" />
                    </span>
                    <span className="text-muted-foreground block text-xs">Tailored support</span>
                  </td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Group size</td>
                  <td className="p-4 text-center">Up to 20</td>
                  <td className="border-x p-4 text-center">Max 6</td>
                  <td className="p-4 text-center">Independent to 1:1</td>
                </tr>
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Schedule</td>
                  <td className="p-4 text-center">Flexible — attend any class</td>
                  <td className="border-x p-4 text-center">Fixed cohort times</td>
                  <td className="p-4 text-center">Self-serve or application-led</td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Duration</td>
                  <td className="p-4 text-center">Ongoing</td>
                  <td className="border-x p-4 text-center">4-6 week programmes</td>
                  <td className="p-4 text-center">Ongoing</td>
                </tr>
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Community</td>
                  <td className="p-4 text-center">
                    <Check className="text-primary mx-auto h-4 w-4" />
                  </td>
                  <td className="border-x p-4 text-center">
                    <Check className="text-primary mx-auto h-4 w-4" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="text-muted-foreground mx-auto h-4 w-4" />
                  </td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Between-session support</td>
                  <td className="p-4 text-center">
                    <X className="text-muted-foreground mx-auto h-4 w-4" />
                  </td>
                  <td className="border-x p-4 text-center">
                    <X className="text-muted-foreground mx-auto h-4 w-4" />
                  </td>
                  <td className="p-4 text-center">
                    <Check className="text-primary mx-auto h-4 w-4" />
                  </td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Starting from</td>
                  <td className="text-primary p-4 text-center">£7/class</td>
                  <td className="text-primary border-x p-4 text-center">£120/programme</td>
                  <td className="text-primary p-4 text-center">£60/month</td>
                </tr>
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Free trial</td>
                  <td className="text-muted-foreground p-4 text-center text-xs">
                    14-day membership trial
                  </td>
                  <td className="text-muted-foreground border-x p-4 text-center text-xs">N/A</td>
                  <td className="text-muted-foreground p-4 text-center text-xs">
                    Direct buy or application
                  </td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Best for</td>
                  <td className="text-muted-foreground p-4 text-center text-xs">
                    Regular practice, flexible schedule
                  </td>
                  <td className="text-muted-foreground border-x p-4 text-center text-xs">
                    Specific skill goals, accountability
                  </td>
                  <td className="text-muted-foreground p-4 text-center text-xs">
                    Complex needs, maximum support
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/pricing">
              <Button size="lg">
                View Full Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                Not Sure? Get in Touch
              </Button>
            </Link>
          </div>

          {/* Mobile Comparison Cards (visible < md, replaces table) */}
          <div className="mt-8 space-y-6 md:hidden">
            {[
              {
                title: "Move Well Classes",
                price: "From £7/class",
                features: [
                  { label: "Personalisation", value: "Real-time modifications" },
                  { label: "Group size", value: "Up to 20" },
                  { label: "Schedule", value: "Flexible — attend any class" },
                  { label: "Best for", value: "Regular practice, flexible schedule" },
                ],
                cta: { label: "Explore Move Well Classes", to: "/classes" },
                featured: false,
              },
              {
                title: "Small Group Programmes",
                price: "From £120/programme",
                features: [
                  { label: "Personalisation", value: "Individual feedback each session" },
                  { label: "Group size", value: "Max 6" },
                  { label: "Schedule", value: "Fixed cohort times" },
                  { label: "Best for", value: "Specific goals, accountability" },
                ],
                cta: { label: "View Programmes", to: "/classes/small-groups" },
                featured: false,
              },
              {
                title: "Coaching",
                price: "From £60/month",
                features: [
                  { label: "Personalisation", value: "Tailored plans and support tiers" },
                  { label: "Support", value: "Independent plan to 1:1" },
                  { label: "Delivery", value: "Website + Everfit" },
                  { label: "Best for", value: "Complex needs, maximum support" },
                ],
                cta: { label: "Explore Coaching", to: "/coaching" },
                featured: true,
              },
            ].map((option) => (
              <div
                key={option.title}
                className={`bg-background space-y-4 rounded-lg border p-6 ${
                  option.featured ? "border-primary border-2" : ""
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl">{option.title}</h3>
                  <span className="text-primary text-sm">{option.price}</span>
                </div>
                <div className="space-y-2">
                  {option.features.map((f) => (
                    <div key={f.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="ml-4 text-right">{f.value}</span>
                    </div>
                  ))}
                </div>
                <Link href={option.cta.to}>
                  <Button variant={option.featured ? "default" : "outline"} className="w-full">
                    {option.cta.label}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Shruti - First Person */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl">About Me</h2>
              <div className="text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  I'm Shruti Turner — a strength and yoga coach specialising in
                  rehabilitation-informed training for people with chronic illness and complex
                  bodies.
                </p>
                <p>
                  I live with psoriatic arthritis. I understand the frustration of generic fitness
                  advice that doesn't account for the reality of chronic conditions. I've been there
                  — told to "just rest" or offered patronising modifications that don't build real
                  strength.
                </p>
                <p>
                  My approach combines a PhD in Biomechanics and postgraduate rehabilitation
                  training with 760+ hours of yoga education and Level 4 strength and conditioning. This
                  isn't guesswork — it's evidence-based coaching for bodies that need more than
                  standard protocols.
                </p>
              </div>
              <Link href="/about">
                <Button variant="outline">
                  Read My Full Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-secondary/30 flex aspect-[3/4] items-center justify-center rounded">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNDc0MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Shruti Turner - strength and yoga coach with PhD Biomechanics, specialising in chronic illness"
                className="h-full w-full rounded object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="bg-secondary/20 py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2 text-3xl md:text-4xl">Latest from the Blog</h2>
              <p className="text-muted-foreground">
                Evidence-based articles for intelligent people who want nuance, not soundbites.
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-background space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary text-muted-foreground rounded px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg leading-tight">
                  <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="text-muted-foreground border-t pt-2 text-xs">{post.readTime}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Magnet / Email Capture - Dedicated section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <div className="bg-brand-dark text-brand-white space-y-6 rounded-lg p-8 md:p-12">
            <div className="bg-brand-accent-light/20 text-brand-accent-light inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <BookOpen className="h-4 w-4" />
              <span>Free Guide</span>
            </div>
            <h2 className="text-3xl leading-tight md:text-4xl">
              {signupCopy.leadMagnetTitle || "5 Yoga Poses That Actually Build Strength"}
            </h2>
            <p className="text-brand-white/80 text-lg leading-relaxed">
              A free guide for bodies that need more than generic stretching advice, plus
              research-backed articles on strength, movement, and chronic illness management.
            </p>
            {!newsletterSubmitted ? (
              <form className="mx-auto max-w-lg space-y-3" onSubmit={handleNewsletterSubmit}>
                <Input
                  type="text"
                  placeholder="First name"
                  value={newsletterFirstName}
                  onChange={(e) => setNewsletterFirstName(e.target.value)}
                  required
                  className="border-brand-white bg-brand-white text-brand-dark"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder={signupCopy.formPlaceholder}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="border-brand-white bg-brand-white text-brand-dark flex-1"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
                    disabled={
                      newsletterSubmitting || !newsletterConsent || !newsletterTurnstileToken
                    }
                  >
                    {newsletterSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
                  </Button>
                </div>
                <TurnstileWidget onTokenChange={setNewsletterTurnstileToken} />
                <label className="text-brand-white/70 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="accent-brand-accent-light mt-0.5 h-4 w-4"
                    required
                  />
                  <span>I want newsletter and update emails. I can unsubscribe anytime.</span>
                </label>
              </form>
            ) : (
              <div className="space-y-2 text-center">
                <p className="text-brand-accent-light text-lg">Your guide is on its way.</p>
                <p className="text-brand-white/70 text-sm">
                  Check your inbox for the guide and confirmation email.
                </p>
              </div>
            )}
            <p className="text-brand-white/50 text-sm">{signupCopy.consentText}</p>
            {newsletterError ? <p className="text-xs text-red-300">{newsletterError}</p> : null}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-5xl">
            Ready to Build Strength Without Pretending Your Body Is Simple?
          </h2>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90 px-8 text-lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Get in Touch
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent px-8 text-lg"
              >
                Explore Move Well Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Homepage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Shruti Turner",
              url: "https://shrutiturner.com",
              description:
                "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
            },
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Shruti Turner",
              url: "https://shrutiturner.com",
              sameAs: ["https://instagram.com/shrutiturner", "https://facebook.com/shrutiturner"],
              jobTitle: "Strength & Yoga Coach",
              description:
                "Strength and yoga coach with PhD Biomechanics, PGDip Rehabilitation, 650hr yoga training, and Level 4 PT. Specialises in rehabilitation-informed training for chronic illness and complex bodies. Living with psoriatic arthritis.",
              knowsAbout: [
                "Biomechanics",
                "Rehabilitation",
                "Chronic Illness",
                "Psoriatic Arthritis",
                "Adaptive Yoga",
                "Strength Training",
                "Pain Science",
              ],
            },
          ]),
        }}
      />
    </Layout>
  );
}

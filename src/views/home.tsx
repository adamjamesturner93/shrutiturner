"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Dumbbell,
  Heart,
  Users,
  User,
  Sparkles,
  GraduationCap,
  Award,
  Shield,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { blogPosts } from "../data/blog-data";
import { useState } from "react";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";

export function HomePage() {
  const recentPosts = blogPosts.slice(0, 3);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
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
      lists: ["newsletter"],
      consent: newsletterConsent,
      source: "homepage",
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
      setNewsletterConsent(false);
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
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="text-lg text-[#B5C49B]">Strength & Yoga Coach</div>
              <h1 className="text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Coaching for People Who Refuse to Be Fragile
              </h1>
              <p className="text-xl leading-relaxed text-[#FAFAF8]/90 md:text-2xl">
                I help people with chronic illness and autoimmune conditions build strength and
                capacity through rehabilitation-informed training that honours your body's
                complexity.
              </p>
              <p className="text-sm opacity-75">
                PhD Biomechanics · PGDip Rehab · 650hr Yoga · Level 4 PT
              </p>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Link href="/classes">
                  <Button
                    size="lg"
                    className="bg-[#B5C49B] px-8 text-lg text-[#2E1F33] hover:bg-[#a5b48b]"
                  >
                    Explore How I Can Help
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#B5C49B] bg-transparent px-8 text-lg text-[#B5C49B] hover:bg-[#B5C49B]/10"
                  >
                    About Shruti
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
              <span className="text-sm">PhD Biomechanics</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Award className="text-primary h-5 w-5" />
              <span className="text-sm">PGDip Rehabilitation</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Heart className="text-primary h-5 w-5" />
              <span className="text-sm">650hr Yoga Training</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              <span className="text-sm">Level 4 PT · CIMSPA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Early on the page */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "Finally, a yoga teacher who understands that my body isn't just 'tight' — it's
                complex. The adaptations are intelligent, not patronising."
              </p>
              <p className="text-sm">— Sarah, Hypermobility EDS</p>
            </div>
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "I've built more strength in 12 weeks than in years of trying generic programs.
                Shruti actually gets what it's like to train with chronic illness."
              </p>
              <p className="text-sm">— James, Rheumatoid Arthritis</p>
            </div>
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <p className="text-muted-foreground leading-relaxed italic">
                "The small group program gave me the accountability I needed and a community that
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
              <ul className="text-muted-foreground space-y-3">
                <li>- Psoriatic or rheumatoid arthritis</li>
                <li>- Autoimmune conditions</li>
                <li>- Chronic pain</li>
                <li>- Hypermobility</li>
                <li>- Long-term injury recovery</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">And you are:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>- Intelligent and research-oriented</li>
                <li>- Frustrated by generic fitness advice</li>
                <li>- Tired of being told to "just rest"</li>
                <li>- Ready to build genuine capacity</li>
                <li>- Looking for evidence-based approaches</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Promise */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-8 text-3xl leading-tight md:text-5xl">
            Build strength, capacity and resilience — without pretending your body is simple.
          </h2>
          <p className="text-xl leading-relaxed opacity-90">
            This is not generic fitness. This is intelligent, evidence-based training for bodies
            that require nuance.
          </p>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl md:text-5xl">Choose Your Path</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
              Whether you want guided classes, personalised 1:1 coaching, or an immersive retreat
              experience — there's a way in that suits you.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Yoga Classes */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4B5B32]/10">
                <Heart className="h-6 w-6 text-[#4B5B32]" />
              </div>
              <h3 className="text-xl">Yoga Classes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Rehabilitation-informed yoga that prioritises joint safety, stability, and nervous
                system regulation.
              </p>
              <p className="text-primary text-sm">From £9/class with a bundle</p>
              <Link href="/classes/yoga">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Explore Yoga
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Strength Classes */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Dumbbell className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Strength Classes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Evidence-based resistance training designed for bodies that need intelligent
                programming.
              </p>
              <p className="text-primary text-sm">From £9/class with a bundle</p>
              <Link href="/classes/strength">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Explore Strength
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* 1:1 Training */}
            <div className="bg-background group space-y-4 rounded-lg border p-6 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <User className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">1:1 Training</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Fully personalised programming designed around your specific conditions and goals.
              </p>
              <p className="text-primary text-sm">From £75/session</p>
              <Link href="/pt">
                <Button
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Small Groups */}
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
              <h3 className="text-xl">Small Groups</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Focused cohorts with specific goals. Maximum 6 people for personalised attention.
              </p>
              <p className="text-primary text-sm">From £120 per program</p>
              <Link href="/classes/small-groups">
                <Button className="w-full">
                  View Programs
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
                <tr className="bg-[#2E1F33] text-[#FAFAF8]">
                  <th className="p-4 text-left font-medium">Feature</th>
                  <th className="p-4 text-center font-medium">Group Classes</th>
                  <th className="border-x border-[#FAFAF8]/10 p-4 text-center font-medium">
                    Small Groups
                  </th>
                  <th className="p-4 text-center font-medium">1:1 Training</th>
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
                    <span className="text-muted-foreground block text-xs">Fully bespoke</span>
                  </td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Group size</td>
                  <td className="p-4 text-center">Up to 20</td>
                  <td className="border-x p-4 text-center">Max 6</td>
                  <td className="p-4 text-center">Just you</td>
                </tr>
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Schedule</td>
                  <td className="p-4 text-center">Flexible — attend any class</td>
                  <td className="border-x p-4 text-center">Fixed cohort times</td>
                  <td className="p-4 text-center">Arranged around you</td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Duration</td>
                  <td className="p-4 text-center">Ongoing</td>
                  <td className="border-x p-4 text-center">4-6 week programs</td>
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
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Replays available</td>
                  <td className="p-4 text-center">7 days</td>
                  <td className="border-x p-4 text-center">7 days</td>
                  <td className="p-4 text-center">N/A</td>
                </tr>
                <tr className="bg-secondary/20 border-t">
                  <td className="text-muted-foreground p-4">Starting from</td>
                  <td className="text-primary p-4 text-center">£9/class</td>
                  <td className="text-primary border-x p-4 text-center">£120/program</td>
                  <td className="text-primary p-4 text-center">£75/session</td>
                </tr>
                <tr className="border-t">
                  <td className="text-muted-foreground p-4">Free trial</td>
                  <td className="text-muted-foreground p-4 text-center text-xs">
                    14-day membership trial
                  </td>
                  <td className="text-muted-foreground border-x p-4 text-center text-xs">N/A</td>
                  <td className="text-muted-foreground p-4 text-center text-xs">Free enquiry</td>
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
                title: "Group Classes",
                price: "From £9/class",
                features: [
                  { label: "Personalisation", value: "Real-time modifications" },
                  { label: "Group size", value: "Up to 20" },
                  { label: "Schedule", value: "Flexible — attend any class" },
                  { label: "Replays", value: "7 days" },
                  { label: "Best for", value: "Regular practice, flexible schedule" },
                ],
                cta: { label: "View Schedule", to: "/schedule" },
                featured: false,
              },
              {
                title: "Small Groups",
                price: "From £120/program",
                features: [
                  { label: "Personalisation", value: "Individual feedback each session" },
                  { label: "Group size", value: "Max 6" },
                  { label: "Schedule", value: "Fixed cohort times" },
                  { label: "Replays", value: "7 days" },
                  { label: "Best for", value: "Specific goals, accountability" },
                ],
                cta: { label: "View Programs", to: "/classes/small-groups" },
                featured: false,
              },
              {
                title: "1:1 Training",
                price: "From £75/session",
                features: [
                  { label: "Personalisation", value: "Fully bespoke" },
                  { label: "Group size", value: "Just you" },
                  { label: "Schedule", value: "Arranged around you" },
                  { label: "Replays", value: "N/A" },
                  { label: "Best for", value: "Complex needs, maximum support" },
                ],
                cta: { label: "Get in Touch", to: "/contact" },
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
                  training with 650 hours of yoga education and Level 4 personal training. This
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
          <div className="space-y-6 rounded-lg bg-[#2E1F33] p-8 text-[#FAFAF8] md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#B5C49B]/20 px-4 py-2 text-sm text-[#B5C49B]">
              <BookOpen className="h-4 w-4" />
              <span>Free Guide</span>
            </div>
            <h2 className="text-3xl leading-tight md:text-4xl">
              {signupCopy.leadMagnetTitle || "5 Yoga Poses That Actually Build Strength"}
            </h2>
            <p className="text-lg leading-relaxed text-[#FAFAF8]/80">
              {signupCopy.popupDescription ||
                "Plus research-backed articles on strength, movement, and chronic illness management delivered to your inbox."}
            </p>
            {!newsletterSubmitted ? (
              <form
                className="mx-auto max-w-lg space-y-3"
                onSubmit={handleNewsletterSubmit}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder={signupCopy.formPlaceholder}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 border-[#FAFAF8] bg-[#FAFAF8] text-[#2E1F33]"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]"
                    disabled={newsletterSubmitting || !newsletterConsent}
                  >
                    {newsletterSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
                  </Button>
                </div>
                <label className="flex items-start gap-2 text-sm text-[#FAFAF8]/70">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#B5C49B]"
                    required
                  />
                  <span>
                    I consent to receiving marketing emails and understand I can unsubscribe at any
                    time.
                  </span>
                </label>
              </form>
            ) : (
              <p className="text-[#B5C49B]">{signupCopy.successMessage}</p>
            )}
            <p className="text-sm text-[#FAFAF8]/50">{signupCopy.consentText}</p>
            {newsletterError ? <p className="text-xs text-red-300">{newsletterError}</p> : null}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-5xl">
            Ready to Build Strength Without Pretending Your Body Is Simple?
          </h2>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-[#FAFAF8] px-8 text-lg text-[#4B5B32] hover:bg-[#FAFAF8]/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Get in Touch
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent px-8 text-lg text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                Explore Classes
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

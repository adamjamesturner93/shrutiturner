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

export function HomePage() {
  const recentPosts = blogPosts.slice(0, 3);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    console.log("Homepage newsletter signup:", newsletterEmail);
    setNewsletterSubmitted(true);
    setTimeout(() => {
      setNewsletterSubmitted(false);
      setNewsletterEmail("");
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
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="text-[#B5C49B] text-lg">
                Strength & Yoga Coach
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                Coaching for People Who Refuse to Be Fragile
              </h1>
              <p className="text-xl md:text-2xl text-[#FAFAF8]/90 leading-relaxed">
                I help people with chronic illness and autoimmune conditions
                build strength and capacity through rehabilitation-informed
                training that honours your body's complexity.
              </p>
              <p className="text-sm opacity-75">
                PhD Biomechanics · PGDip Rehab · 650hr Yoga · Level 4 PT
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/classes">
                  <Button
                    size="lg"
                    className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b] text-lg px-8"
                  >
                    Explore How I Can Help
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-[#B5C49B] text-[#B5C49B] hover:bg-[#B5C49B]/10 text-lg px-8"
                  >
                    About Shruti
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-secondary/30 aspect-[3/4] rounded overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1664673531303-c933ac4cee70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGZpdG5lc3MlMjBpbnN0cnVjdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNTkxOTA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Shruti Turner - Strength and Yoga Coach specialising in chronic illness and autoimmune conditions"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Trust Strip - EEAT */}
      <section className="border-b bg-secondary/30 py-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-sm">PhD Biomechanics</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm">PGDip Rehabilitation</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm">650hr Yoga Training</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">Level 4 PT · CIMSPA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Early on the page */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "Finally, a yoga teacher who understands that my body isn't just
                'tight' — it's complex. The adaptations are intelligent, not
                patronising."
              </p>
              <p className="text-sm">— Sarah, Hypermobility EDS</p>
            </div>
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "I've built more strength in 12 weeks than in years of trying
                generic programs. Shruti actually gets what it's like to train
                with chronic illness."
              </p>
              <p className="text-sm">— James, Rheumatoid Arthritis</p>
            </div>
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "The small group program gave me the accountability I needed and
                a community that understands. No toxic positivity, just real
                support."
              </p>
              <p className="text-sm">— Elena, Chronic Fatigue</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 italic">
            [Placeholder testimonials — real testimonials to be added]
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl mb-6">Who This Is For</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              This is for adults living with chronic illness, autoimmune
              conditions, arthritis, and complex bodies who want strength and
              adventure — not restriction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl">You might have:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>- Psoriatic or rheumatoid arthritis</li>
                <li>- Autoimmune conditions</li>
                <li>- Chronic pain</li>
                <li>- Hypermobility</li>
                <li>- Long-term injury recovery</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">And you are:</h3>
              <ul className="space-y-3 text-muted-foreground">
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
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl mb-8 leading-tight">
            Build strength, capacity and resilience — without pretending your
            body is simple.
          </h2>
          <p className="text-xl leading-relaxed opacity-90">
            This is not generic fitness. This is intelligent, evidence-based
            training for bodies that require nuance.
          </p>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl mb-6">Choose Your Path</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Whether you want guided classes, personalised 1:1 coaching, or an
              immersive retreat experience — there's a way in that suits you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Yoga Classes */}
            <div className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[#4B5B32]/10 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#4B5B32]" />
              </div>
              <h3 className="text-xl">Yoga Classes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rehabilitation-informed yoga that prioritises joint safety,
                stability, and nervous system regulation.
              </p>
              <p className="text-sm text-primary">From £9/class with a bundle</p>
              <Link href="/classes/yoga">
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Explore Yoga
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Strength Classes */}
            <div className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Strength Classes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Evidence-based resistance training designed for bodies that need
                intelligent programming.
              </p>
              <p className="text-sm text-primary">From £9/class with a bundle</p>
              <Link href="/classes/strength">
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Explore Strength
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* 1:1 Training */}
            <div className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">1:1 Training</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fully personalised programming designed around your specific
                conditions and goals.
              </p>
              <p className="text-sm text-primary">From £75/session</p>
              <Link href="/pt">
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Small Groups */}
            <div className="bg-background border-2 border-primary rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow relative group">
              <div className="absolute -top-3 right-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Limited
                </span>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Small Groups</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Focused cohorts with specific goals. Maximum 6 people for
                personalised attention.
              </p>
              <p className="text-sm text-primary">From £120 per program</p>
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
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              Not Sure Which Is Right for You?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Compare the options to find the best fit for your needs, budget,
              and goals.
            </p>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse bg-background border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#2E1F33] text-[#FAFAF8]">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-medium">
                    Group Classes
                  </th>
                  <th className="text-center p-4 font-medium border-x border-[#FAFAF8]/10">
                    Small Groups
                  </th>
                  <th className="text-center p-4 font-medium">1:1 Training</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-t">
                  <td className="p-4 text-muted-foreground">
                    Personalised programming
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-muted-foreground">
                      Real-time modifications
                    </span>
                  </td>
                  <td className="p-4 text-center border-x">
                    <span className="text-muted-foreground">
                      Individual feedback each session
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-primary">
                      <Check className="w-5 h-5 mx-auto" />
                    </span>
                    <span className="text-muted-foreground text-xs block">
                      Fully bespoke
                    </span>
                  </td>
                </tr>
                <tr className="border-t bg-secondary/20">
                  <td className="p-4 text-muted-foreground">Group size</td>
                  <td className="p-4 text-center">Up to 20</td>
                  <td className="p-4 text-center border-x">Max 6</td>
                  <td className="p-4 text-center">Just you</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 text-muted-foreground">Schedule</td>
                  <td className="p-4 text-center">
                    Flexible — attend any class
                  </td>
                  <td className="p-4 text-center border-x">
                    Fixed cohort times
                  </td>
                  <td className="p-4 text-center">
                    Arranged around you
                  </td>
                </tr>
                <tr className="border-t bg-secondary/20">
                  <td className="p-4 text-muted-foreground">Duration</td>
                  <td className="p-4 text-center">Ongoing</td>
                  <td className="p-4 text-center border-x">4-6 week programs</td>
                  <td className="p-4 text-center">Ongoing</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 text-muted-foreground">Community</td>
                  <td className="p-4 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="p-4 text-center border-x">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-4 h-4 mx-auto text-muted-foreground" />
                  </td>
                </tr>
                <tr className="border-t bg-secondary/20">
                  <td className="p-4 text-muted-foreground">
                    Between-session support
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-4 h-4 mx-auto text-muted-foreground" />
                  </td>
                  <td className="p-4 text-center border-x">
                    <X className="w-4 h-4 mx-auto text-muted-foreground" />
                  </td>
                  <td className="p-4 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 text-muted-foreground">
                    Replays available
                  </td>
                  <td className="p-4 text-center">7 days</td>
                  <td className="p-4 text-center border-x">7 days</td>
                  <td className="p-4 text-center">N/A</td>
                </tr>
                <tr className="border-t bg-secondary/20">
                  <td className="p-4 text-muted-foreground">Starting from</td>
                  <td className="p-4 text-center text-primary">
                    £9/class
                  </td>
                  <td className="p-4 text-center border-x text-primary">
                    £120/program
                  </td>
                  <td className="p-4 text-center text-primary">
                    £75/session
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 text-muted-foreground">Free trial</td>
                  <td className="p-4 text-center text-xs text-muted-foreground">
                    14-day membership trial
                  </td>
                  <td className="p-4 text-center border-x text-xs text-muted-foreground">
                    N/A
                  </td>
                  <td className="p-4 text-center text-xs text-muted-foreground">
                    Free enquiry
                  </td>
                </tr>
                <tr className="border-t bg-secondary/20">
                  <td className="p-4 text-muted-foreground">Best for</td>
                  <td className="p-4 text-center text-xs text-muted-foreground">
                    Regular practice, flexible schedule
                  </td>
                  <td className="p-4 text-center border-x text-xs text-muted-foreground">
                    Specific skill goals, accountability
                  </td>
                  <td className="p-4 text-center text-xs text-muted-foreground">
                    Complex needs, maximum support
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
          <div className="md:hidden space-y-6 mt-8">
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
                className={`bg-background border rounded-lg p-6 space-y-4 ${
                  option.featured ? "border-2 border-primary" : ""
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
                      <span className="text-right ml-4">{f.value}</span>
                    </div>
                  ))}
                </div>
                <Link href={option.cta.to}>
                  <Button
                    variant={option.featured ? "default" : "outline"}
                    className="w-full"
                  >
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
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl">About Me</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I'm Shruti Turner — a strength and yoga coach specialising in
                  rehabilitation-informed training for people with chronic
                  illness and complex bodies.
                </p>
                <p>
                  I live with psoriatic arthritis. I understand the frustration
                  of generic fitness advice that doesn't account for the reality
                  of chronic conditions. I've been there — told to "just rest"
                  or offered patronising modifications that don't build real
                  strength.
                </p>
                <p>
                  My approach combines a PhD in Biomechanics and postgraduate
                  rehabilitation training with 650 hours of yoga education and
                  Level 4 personal training. This isn't guesswork — it's
                  evidence-based coaching for bodies that need more than standard
                  protocols.
                </p>
              </div>
              <Link href="/about">
                <Button variant="outline">
                  Read My Full Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-secondary/30 aspect-[3/4] rounded flex items-center justify-center">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNDc0MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Shruti Turner - strength and yoga coach with PhD Biomechanics, specialising in chronic illness"
                className="w-full h-full object-cover rounded"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-20 md:py-28 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl mb-2">
                Latest from the Blog
              </h2>
              <p className="text-muted-foreground">
                Evidence-based articles for intelligent people who want nuance,
                not soundbites.
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-background border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg leading-tight">
                  <Link href={`/blog/${post.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {post.readTime}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Magnet / Email Capture - Dedicated section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-[#2E1F33] text-[#FAFAF8] rounded-lg p-8 md:p-12 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#B5C49B]/20 text-[#B5C49B] px-4 py-2 rounded-full text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Free Guide</span>
            </div>
            <h2 className="text-3xl md:text-4xl leading-tight">
              5 Yoga Poses That Actually Build Strength
            </h2>
            <p className="text-lg text-[#FAFAF8]/80 leading-relaxed">
              Plus research-backed articles on strength, movement, and chronic
              illness management delivered to your inbox.
            </p>
            {!newsletterSubmitted ? (
              <form
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
                onSubmit={handleNewsletterSubmit}
              >
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 bg-[#FAFAF8] text-[#2E1F33] border-[#FAFAF8]"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]"
                >
                  Get Free Guide
                </Button>
              </form>
            ) : (
              <p className="text-[#B5C49B]">
                You're subscribed! Check your inbox.
              </p>
            )}
            <p className="text-sm text-[#FAFAF8]/50">
              No spam. Unsubscribe anytime. Your data is private.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-5xl leading-tight">
            Ready to Build Strength Without Pretending Your Body Is Simple?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90 text-lg px-8"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Get in Touch
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10 text-lg px-8"
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
              sameAs: [
                "https://instagram.com/shrutiturner",
                "https://facebook.com/shrutiturner",
              ],
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
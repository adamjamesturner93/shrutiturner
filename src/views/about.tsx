"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Award,
  Heart,
  BookOpen,
  Users,
  Shield,
  MessageCircle,
} from "lucide-react";

export function AboutPage() {
  return (
    <Layout>
      <SEO
        title="About Shruti Turner - PhD Biomechanics, Strength & Yoga Coach"
        description="Shruti Turner is a strength and yoga coach with a PhD in Biomechanics, PGDip Rehabilitation, 650hr yoga training, and Level 4 PT qualification. Living with psoriatic arthritis, she specialises in evidence-based coaching for chronic illness and complex bodies."
        keywords="Shruti Turner, strength coach chronic illness, yoga teacher autoimmune, PhD biomechanics coach, psoriatic arthritis coach, rehabilitation informed yoga"
        canonicalUrl="https://shrutiturner.com/about"
      />

      {/* Hero */}
      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h1 className="text-4xl leading-tight md:text-5xl">About Shruti</h1>
              <p className="text-brand-accent-light text-xl leading-relaxed">
                Strength and yoga coach specialising in rehabilitation-informed training for people
                with chronic illness and complex bodies.
              </p>
              <p className="text-brand-white/80 text-lg leading-relaxed">
                I live with psoriatic arthritis. I understand what it's like to train with
                unpredictable capacity, chronic pain, and the fear of making things worse. This work
                isn't just my profession — it's personal.
              </p>
            </div>
            <div className="aspect-[3/4] overflow-hidden rounded">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1676578732408-134d55bc408d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHlvZ2ElMjBpbnN0cnVjdG9yJTIwcG9ydHJhaXQlMjBzdHVkaW98ZW58MXx8fHwxNzcxNzcwNDIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Shruti Turner - Strength and Yoga Coach specialising in chronic illness and complex bodies"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-3xl md:text-4xl">My Story</h2>
          <div className="text-muted-foreground space-y-6 leading-relaxed">
            <p>
              I was diagnosed with psoriatic arthritis while completing my PhD in Biomechanics.
              Overnight, my relationship with movement changed. The body I'd relied on for years
              became unpredictable — some days I could train hard, other days I could barely open a
              jar.
            </p>
            <p>
              I tried generic fitness programmes. I tried yoga classes. I tried physiotherapy.
              Nothing accounted for the reality of living with a fluctuating chronic condition. The
              fitness industry told me to "push through." Yoga teachers told me to "listen to my
              body" without giving me the tools to understand what my body was actually saying.
            </p>
            <p>
              So I built something different. I combined my academic background in biomechanics and
              rehabilitation with extensive yoga training and personal training qualifications. I
              created an approach that doesn't pretend complex bodies are simple — one that uses
              evidence-based programming, respects symptom fluctuations, and builds genuine strength
              and capacity.
            </p>
            <p>
              Today, I work with people who have autoimmune conditions, chronic pain, hypermobility,
              and other complex health challenges. My clients are intelligent, research-oriented
              people who are frustrated by generic advice and ready for something that actually
              works for their bodies.
            </p>
          </div>
        </div>
      </section>

      {/* Qualifications & Credentials - EEAT */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl md:text-4xl">Qualifications & Credentials</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center">
            My approach is grounded in academic research and professional training. Here's what
            underpins my practice.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <GraduationCap className="text-primary h-5 w-5" />
                </div>
                <h3 className="text-xl">PhD Biomechanics</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Doctoral research in biomechanics providing deep understanding of human movement,
                joint mechanics, tissue loading, and musculoskeletal function. This informs every
                program I design.
              </p>
              <p className="text-muted-foreground text-sm italic">
                [Placeholder: University name and thesis title to be added]
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Award className="text-primary h-5 w-5" />
                </div>
                <h3 className="text-xl">PGDip Rehabilitation</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Postgraduate Diploma in Rehabilitation, providing clinical understanding of injury
                recovery, chronic condition management, and evidence-based rehabilitation
                principles.
              </p>
              <p className="text-muted-foreground text-sm italic">
                [Placeholder: Institution to be added]
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Heart className="text-primary h-5 w-5" />
                </div>
                <h3 className="text-xl">650-Hour Yoga Teacher Training</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Comprehensive yoga teacher training (650 hours) with specific focus on therapeutic
                applications, anatomy, and adaptive practice for complex bodies. Yoga Alliance
                registered.
              </p>
              <p className="text-muted-foreground text-sm italic">
                [Placeholder: Training school and Yoga Alliance registration number to be added]
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Shield className="text-primary h-5 w-5" />
                </div>
                <h3 className="text-xl">Level 4 Personal Trainer</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Level 4 qualification in personal training — the highest standard in the UK.
                Includes specialisms in exercise referral and working with long-term health
                conditions. CIMSPA registered.
              </p>
              <p className="text-muted-foreground text-sm italic">
                [Placeholder: CIMSPA registration number to be added]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Approach */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-3xl md:text-4xl">My Approach</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-brand-accent/10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <BookOpen className="text-brand-accent h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-xl">Evidence Over Dogma</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I don't follow fitness trends or yoga dogma. Every recommendation I make is
                  grounded in research — biomechanics, pain science, exercise physiology, and
                  rehabilitation evidence. If the science changes, my practice changes with it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-brand-accent/10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Heart className="text-brand-accent h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-xl">Lived Experience Matters</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Having psoriatic arthritis means I don't just understand chronic illness
                  intellectually — I live it. I know what it's like to cancel plans because of a
                  flare, to second-guess every training decision, and to mourn the body you used to
                  have. This shapes how I work with every client.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-brand-accent/10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Users className="text-brand-accent h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-xl">Respect, Not Pity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I treat my clients as intelligent adults who happen to have complex health
                  conditions. No toxic positivity, no patronising language, no "gentle exercise" as
                  a consolation prize. You deserve real strength training, real yoga, and real
                  results — adapted intelligently for your body.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Affiliations Placeholder */}
      <section className="bg-secondary/20 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl">Professional Affiliations</h2>
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-8">
            <div className="space-y-2 text-center">
              <div className="bg-background mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                <Shield className="text-primary/50 h-8 w-8" />
              </div>
              <p className="text-sm">CIMSPA Registered</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="bg-background mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                <Heart className="text-primary/50 h-8 w-8" />
              </div>
              <p className="text-sm">Yoga Alliance</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="bg-background mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                <GraduationCap className="text-primary/50 h-8 w-8" />
              </div>
              <p className="text-sm">REPs Registered</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="bg-background mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                <Award className="text-primary/50 h-8 w-8" />
              </div>
              <p className="text-sm">First Aid Certified</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-6 text-center text-xs italic">
            [Placeholder: Real logos and registration numbers to be added]
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-4xl">Ready to Work Together?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Whether you're interested in 1:1 coaching, group classes, or a retreat, I'd love to hear
            from you.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Explore Move Well Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Person Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Shruti Turner",
            url: "https://shrutiturner.com",
            sameAs: ["https://instagram.com/shrutiturner", "https://facebook.com/shrutiturner"],
            jobTitle: "Strength & Yoga Coach",
            description:
              "Strength and yoga coach specialising in rehabilitation-informed training for people with chronic illness, autoimmune conditions, and complex bodies. PhD Biomechanics.",
            knowsAbout: [
              "Biomechanics",
              "Rehabilitation",
              "Chronic Illness Management",
              "Psoriatic Arthritis",
              "Adaptive Yoga",
              "Strength Training",
              "Pain Science",
              "Hypermobility",
            ],
            hasCredential: [
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "degree",
                name: "PhD Biomechanics",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "diploma",
                name: "PGDip Rehabilitation",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "650-Hour Yoga Teacher Training",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "Level 4 Personal Trainer",
              },
            ],
          }),
        }}
      />
    </Layout>
  );
}

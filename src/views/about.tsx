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
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl leading-tight">
                About Shruti
              </h1>
              <p className="text-xl text-[#B5C49B] leading-relaxed">
                Strength and yoga coach specialising in rehabilitation-informed
                training for people with chronic illness and complex bodies.
              </p>
              <p className="text-lg text-[#FAFAF8]/80 leading-relaxed">
                I live with psoriatic arthritis. I understand what it's like to
                train with unpredictable capacity, chronic pain, and the fear of
                making things worse. This work isn't just my profession — it's
                personal.
              </p>
            </div>
            <div className="aspect-[3/4] rounded overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1676578732408-134d55bc408d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHlvZ2ElMjBpbnN0cnVjdG9yJTIwcG9ydHJhaXQlMjBzdHVkaW98ZW58MXx8fHwxNzcxNzcwNDIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Shruti Turner - Strength and Yoga Coach specialising in chronic illness and complex bodies"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl mb-8">My Story</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              I was diagnosed with psoriatic arthritis while completing my PhD in
              Biomechanics. Overnight, my relationship with movement changed. The
              body I'd relied on for years became unpredictable — some days I
              could train hard, other days I could barely open a jar.
            </p>
            <p>
              I tried generic fitness programs. I tried yoga classes. I tried
              physiotherapy. Nothing accounted for the reality of living with a
              fluctuating chronic condition. The fitness industry told me to "push
              through." Yoga teachers told me to "listen to my body" without
              giving me the tools to understand what my body was actually saying.
            </p>
            <p>
              So I built something different. I combined my academic background in
              biomechanics and rehabilitation with extensive yoga training and
              personal training qualifications. I created an approach that doesn't
              pretend complex bodies are simple — one that uses evidence-based
              programming, respects symptom fluctuations, and builds genuine
              strength and capacity.
            </p>
            <p>
              Today, I work with people who have autoimmune conditions, chronic
              pain, hypermobility, and other complex health challenges. My clients
              are intelligent, research-oriented people who are frustrated by
              generic advice and ready for something that actually works for their
              bodies.
            </p>
          </div>
        </div>
      </section>

      {/* Qualifications & Credentials - EEAT */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl text-center mb-4">
            Qualifications & Credentials
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            My approach is grounded in academic research and professional
            training. Here's what underpins my practice.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background border rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl">PhD Biomechanics</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Doctoral research in biomechanics providing deep understanding of
                human movement, joint mechanics, tissue loading, and
                musculoskeletal function. This informs every program I design.
              </p>
              <p className="text-sm text-muted-foreground italic">
                [Placeholder: University name and thesis title to be added]
              </p>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl">PGDip Rehabilitation</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Postgraduate Diploma in Rehabilitation, providing clinical
                understanding of injury recovery, chronic condition management,
                and evidence-based rehabilitation principles.
              </p>
              <p className="text-sm text-muted-foreground italic">
                [Placeholder: Institution to be added]
              </p>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl">650-Hour Yoga Teacher Training</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Comprehensive yoga teacher training (650 hours) with specific
                focus on therapeutic applications, anatomy, and adaptive practice
                for complex bodies. Yoga Alliance registered.
              </p>
              <p className="text-sm text-muted-foreground italic">
                [Placeholder: Training school and Yoga Alliance registration
                number to be added]
              </p>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl">Level 4 Personal Trainer</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Level 4 qualification in personal training — the highest standard
                in the UK. Includes specialisms in exercise referral and working
                with long-term health conditions. CIMSPA registered.
              </p>
              <p className="text-sm text-muted-foreground italic">
                [Placeholder: CIMSPA registration number to be added]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Approach */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl mb-8">My Approach</h2>
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-[#4B5B32]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <BookOpen className="w-5 h-5 text-[#4B5B32]" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Evidence Over Dogma</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I don't follow fitness trends or yoga dogma. Every
                  recommendation I make is grounded in research — biomechanics,
                  pain science, exercise physiology, and rehabilitation evidence.
                  If the science changes, my practice changes with it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-[#4B5B32]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Heart className="w-5 h-5 text-[#4B5B32]" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Lived Experience Matters</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Having psoriatic arthritis means I don't just understand
                  chronic illness intellectually — I live it. I know what it's
                  like to cancel plans because of a flare, to second-guess every
                  training decision, and to mourn the body you used to have.
                  This shapes how I work with every client.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-[#4B5B32]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-5 h-5 text-[#4B5B32]" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Respect, Not Pity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I treat my clients as intelligent adults who happen to have
                  complex health conditions. No toxic positivity, no patronising
                  language, no "gentle exercise" as a consolation prize. You
                  deserve real strength training, real yoga, and real results —
                  adapted intelligently for your body.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Affiliations Placeholder */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl text-center mb-8">
            Professional Affiliations
          </h2>
          <div className="flex flex-wrap justify-center gap-8 items-center text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-background border rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">CIMSPA Registered</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-background border rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">Yoga Alliance</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-background border rounded-lg flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">REPs Registered</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-background border rounded-lg flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">First Aid Certified</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6 italic">
            [Placeholder: Real logos and registration numbers to be added]
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl leading-tight">
            Ready to Work Together?
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Whether you're interested in 1:1 coaching, group classes, or a
            retreat, I'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90"
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
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                Explore Classes
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
            sameAs: [
              "https://instagram.com/shrutiturner",
              "https://facebook.com/shrutiturner",
            ],
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
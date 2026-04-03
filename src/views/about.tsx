"use client";

import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  Heart,
  MessageCircle,
  Shield,
  Users,
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
import { publicProofItems } from "@/data/public-refresh";

export function AboutPage() {
  return (
    <Layout>
      <SEO
        title="About Shruti Turner - PhD Biomechanics, Strength & Yoga Coach"
        description="Shruti Turner is a strength and yoga coach with a PhD in Biomechanics, PGDip Rehabilitation, 650hr yoga training, and Level 4 PT qualification. Living with psoriatic arthritis, she specialises in evidence-based coaching for chronic illness and complex bodies."
        keywords="Shruti Turner, strength coach chronic illness, yoga teacher autoimmune, PhD biomechanics coach, psoriatic arthritis coach, rehabilitation informed yoga"
        canonicalUrl="https://shrutiturner.com/about"
      />

      <EditorialHero
        eyebrow="About Shruti"
        size="compact"
        title={
          <>
            A coach shaped by both
            <span className="text-brand-accent-light"> biomechanics</span> and
            <span className="text-brand-accent-light"> lived experience.</span>
          </>
        }
        description="I work with people whose bodies need more nuance than the fitness industry usually offers. That perspective comes from research, clinical study, coaching practice, and living with psoriatic arthritis myself."
        primaryCta={{ href: "/contact", label: "Get In Touch" }}
        secondaryCta={{ href: "/classes", label: "Explore Classes" }}
        stats={[
          { value: "PhD", label: "Biomechanics" },
          { value: "PGDip", label: "Rehabilitation" },
          { value: "650+", label: "Yoga teacher training hours" },
        ]}
        metrics={[
          {
            label: "Perspective",
            detail:
              "Academic depth, coaching practice, and day-to-day lived experience with fluctuation.",
          },
          {
            label: "Clients",
            detail:
              "People with chronic illness, hypermobility, pain, arthritis, and longer recovery histories.",
          },
          {
            label: "Promise",
            detail: "Respect, precision, and real progression instead of fragile-feeling fitness.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1676578732408-134d55bc408d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHlvZ2ElMjBpbnN0cnVjdG9yJTIwcG9ydHJhaXQlMjBzdHVkaW98ZW58MXx8fHwxNzcxNzcwNDIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Shruti Turner portrait"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="bg-brand-accent-light/12 mt-3 rounded-[1.2rem] p-4 backdrop-blur-sm">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  The lens I teach through
                </p>
                <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                  Complex bodies deserve technical clarity without losing warmth, ambition, or
                  honesty about what fluctuating symptoms feel like.
                </p>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What underpins the work"
        description="The point of credentials here is not status. It is trust: the advice should be grounded enough to withstand scrutiny and practical enough to hold up in real life."
        items={[...publicProofItems]}
      />

      <StorySplit
        eyebrow="My Story"
        title="This work became personal while I was finishing my PhD."
        description="A diagnosis of psoriatic arthritis changed how I understood movement, effort, recovery, and the limits of generic advice."
        body={
          <div className="text-muted-foreground space-y-5 leading-relaxed">
            <p>
              I was diagnosed while completing my PhD in Biomechanics. Very quickly, the body I had
              relied on became less predictable. Some days I could train well. Some days opening a
              jar felt like a meaningful task.
            </p>
            <p>
              I tried the routes most people try. Generic fitness plans. Yoga classes. Professional
              help that had good intentions but could not fully account for fluctuating symptoms,
              pain, fatigue, and the psychology of not trusting your body.
            </p>
            <p>
              The fitness industry often tells people like us to either push through or become
              perpetually cautious. Neither option is good enough. My work grew out of building a
              third route: precise, adaptive, evidence-based training that still treats strength and
              progress as real goals.
            </p>
          </div>
        }
        aside={
          <div className="space-y-6">
            <PullQuote
              quote="Lived experience does not replace evidence. It changes the questions you know to ask."
              attribution="Shruti Turner"
            />
            <div className="border-brand-dark/10 bg-brand-warm rounded-[1.75rem] border p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                What clients usually notice
              </p>
              <div className="mt-5 space-y-4">
                {[
                  "The language is direct and not patronising.",
                  "Modifications are framed as strategy, not consolation.",
                  "The programming is ambitious without being reckless.",
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
          </div>
        }
        className="section-divider"
      />

      <MarketingSection className="section-wash">
        <SectionHeading
          eyebrow="Credentials"
          title="Academic training and professional qualifications."
          description="The details matter because they shape how I think about loading, tissue behaviour, recovery, pain, and adaptation."
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              title: "PhD Biomechanics",
              body: "Doctoral research informing how I think about human movement, loading, and musculoskeletal behaviour.",
              footnote: "[Placeholder: University name and thesis title to be added]",
              icon: GraduationCap,
            },
            {
              title: "PGDip Rehabilitation",
              body: "Postgraduate rehabilitation training shaping how I approach recovery, capacity building, and clinical nuance.",
              footnote: "[Placeholder: Institution to be added]",
              icon: Award,
            },
            {
              title: "650-Hour Yoga Training",
              body: "Extensive teacher training with emphasis on anatomy, therapeutic application, and adaptive practice.",
              footnote: "[Placeholder: Training school and registration number to be added]",
              icon: Heart,
            },
            {
              title: "Level 4 Personal Trainer",
              body: "Advanced PT qualification supporting exercise referral, long-term condition awareness, and coaching practice.",
              footnote: "[Placeholder: CIMSPA registration number to be added]",
              icon: Shield,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="border-brand-dark/10 bg-background rounded-[1.7rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl">{item.title}</h3>
                <p className="text-muted-foreground mt-4 leading-relaxed">{item.body}</p>
                <p className="text-muted-foreground mt-4 text-sm italic">{item.footnote}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="How I Work"
              title="Evidence over dogma. Respect over pity."
              description="The values are simple, but the application is precise."
            />
          </div>
          <div className="grid gap-5">
            {[
              {
                title: "Evidence over dogma",
                body: "Recommendations are grounded in biomechanics, pain science, strength principles, and rehabilitation thinking. If the evidence changes, the practice should change too.",
                icon: BookOpen,
              },
              {
                title: "Lived experience matters",
                body: "Living with psoriatic arthritis changes how I understand uncertainty, grief, adaptation, and the emotional cost of not trusting your body.",
                icon: Heart,
              },
              {
                title: "Respect, not pity",
                body: "Clients are treated like intelligent adults who deserve real strength work, real yoga, and thoughtful progression.",
                icon: Users,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="border-brand-dark/10 bg-background rounded-[1.6rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl">{item.title}</h3>
                      <p className="text-muted-foreground mt-3 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Work together"
        title="If you want coaching that feels thoughtful, direct, and technically grounded, start here."
        description="Classes, coaching, and retreats all come from the same core belief: complex bodies deserve more intelligent movement support than they usually receive."
        actions={[
          {
            href: "/contact",
            label: "Get in touch",
            icon: MessageCircle,
            iconPosition: "start",
          },
          {
            href: "/coaching",
            label: "Explore coaching",
            icon: ArrowRight,
          },
        ]}
      />

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

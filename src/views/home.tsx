"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Youtube } from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  SectionHeading,
} from "@/components/marketing/sections";
import { WellbeingVenn } from "@/components/marketing/wellbeing-venn";
import { Button } from "@/components/ui/button";
import type { TestimonialContent } from "@/lib/content";

interface HomePageProps {
  testimonials: TestimonialContent[];
}

export function HomePage({ testimonials }: HomePageProps) {
  const searchParams = useSearchParams();
  const verifiedState = searchParams.get("verified");

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
      <EditorialHero
        eyebrow="Rehabilitation | Fitness | Wellbeing"
        size="compact"
        title={
          <>
            Movement that works <span className="text-brand-accent-light">with your body</span>, not
            against it.
          </>
        }
        description={
          <div className="space-y-3">
            <p>
              I work with adults who want to move, train and feel stronger, but don&apos;t feel
              standard fitness approaches quite work for them.
            </p>
            <p>
              I bring together rehabilitation, fitness and wellbeing to personalise training to work
              with your body and lifestyle.
            </p>
          </div>
        }
        primaryCta={{ href: "/coaching", label: "Work with me" }}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/5 relative overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/4.75] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti-deadlift.jpeg"
                  alt="Shruti Turner deadlifting a barbell in a gym"
                  className="h-full w-full object-cover object-[center_48%]"
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              </div>
            </div>
          </div>
        }
      />

      <MarketingSection className="section-wash">
        <SectionHeading
          eyebrow="Is This You?"
          title="A different approach for bodies and lives that need more nuance."
          description="You might recognise yourself in one or more of these."
          align="center"
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Your body needs a different approach.",
              body: "Pain, injury, health conditions or changing capacity make generic plans feel like a poor fit.",
              className: "border-brand-accent/20 bg-brand-accent/5",
            },
            {
              title: "Fitness doesn’t feel built for you.",
              body: "Gyms, classes or standard programmes can feel intimidating, rigid or inaccessible.",
              className: "border-bronze/20 bg-bronze/5",
            },
            {
              title: "Your life doesn’t fit a perfect routine.",
              body: "Work, stress, energy and responsibilities mean you need something flexible enough to work in real life.",
              className: "border-brand-gold/25 bg-brand-gold/5",
            },
          ].map((item) => (
            <article
              key={item.title}
              className={`rounded-[1.6rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)] ${item.className}`}
            >
              <h3 className="text-2xl leading-tight">{item.title}</h3>
              <p className="text-muted-foreground mt-4 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
        <div
          className="border-brand-dark/10 bg-brand-dark text-brand-white mx-auto mt-10 flex aspect-video w-full max-w-5xl items-center justify-center rounded-[1.75rem] border p-8 text-center shadow-[0_24px_60px_rgba(46,31,51,0.12)]"
          role="img"
          aria-label="Placeholder for a video about who Shruti works with"
        >
          <div>
            <div className="bg-brand-accent-light/15 text-brand-accent-light mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Youtube className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-5 text-2xl">Video coming soon</p>
            <p className="text-brand-white/65 mt-2 text-sm">
              A short introduction to who I work with and how I can support you will appear here.
            </p>
          </div>
        </div>
        <div className="border-brand-dark/10 bg-brand-dark text-brand-white mt-8 grid gap-6 rounded-[1.6rem] border p-6 shadow-[0_20px_60px_rgba(46,31,51,0.14)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="bg-brand-accent-light/15 flex h-12 w-12 items-center justify-center rounded-2xl">
            <CalendarDays className="text-brand-accent-light h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl">Retreats and Workshops for movement, rest and recovery.</h3>
            <p className="text-brand-white/72 mt-2 text-sm leading-relaxed">
              Small retreat experiences for people who want flexible movement options, thoughtful
              pacing and space to recover without pressure to perform wellness.
            </p>
          </div>
          <Button asChild variant="secondary" className="justify-between">
            <Link href="/retreats">
              Explore retreats and workshops
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </MarketingSection>

      <MarketingSection className="bg-background section-divider">
        <SectionHeading
          eyebrow="How It Comes Together"
          title="Rehabilitation, fitness and wellbeing overlap."
          description="Explore each area to see how it shapes my approach to personalising movement and training."
          align="center"
        />
        <div className="mt-10">
          <WellbeingVenn />
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-dark text-brand-white">
        <div className="grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div className="border-brand-white/10 bg-brand-white/5 mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] border p-3 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
            <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem]">
              <ImageWithFallback
                src="/images/shruti.jpeg"
                alt="Shruti Turner hiking in Patagonia"
                className="h-full w-full object-cover object-[center_62%]"
              />
            </div>
          </div>

          <div>
            <p className="text-brand-accent-light text-xs tracking-[0.28em] uppercase">
              Meet Shruti
            </p>
            <h2 className="mt-4 text-3xl leading-tight md:text-5xl">
              Researcher. Personal Trainer. Yoga Teacher.
            </h2>
            <p className="text-brand-white/78 mt-5 text-lg leading-relaxed">
              Person with a complicated body of her own.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Rehabilitation",
                  body: "PhD and further research in rehabilitation.",
                },
                {
                  title: "Fitness",
                  body: "Personal training, strength & conditioning and exercise referral.",
                },
                {
                  title: "Wellbeing",
                  body: "Yoga, trauma-informed practice and lived experience of adapting movement around fluctuating capacity.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-brand-white/10 bg-brand-white/6 rounded-[1.25rem] border p-5"
                >
                  <h3 className="text-brand-accent-light text-lg">{item.title}</h3>
                  <p className="text-brand-white/72 mt-3 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 mt-8"
            >
              <Link href="/about">
                Meet Shruti
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </MarketingSection>

      {testimonials.length > 0 ? (
        <MarketingSection className="bg-brand-warm">
          <SectionHeading
            eyebrow="Client Experiences"
            title="What it can feel like when support fits."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <blockquote
                key={testimonial.id}
                className={`flex h-full flex-col rounded-[1.65rem] border p-7 shadow-[0_18px_45px_rgba(46,31,51,0.06)] ${index === 1 ? "bg-brand-dark text-brand-white" : "bg-background"
                  }`}
              >
                <p className="flex-1 text-xl leading-relaxed">{testimonial.quote}</p>
                <footer
                  className={`mt-5 text-sm font-medium ${index === 1 ? "text-brand-white/72" : "text-muted-foreground"
                    }`}
                >
                  — {testimonial.authorName}
                </footer>
              </blockquote>
            ))}
          </div>
        </MarketingSection>
      ) : null}

      <PreFooterCtaSection
        compact
        className="-mb-24"
        title="Not sure what kind of support you need?"
        description="You don't need to choose a programme before we talk. Tell me what you're working towards and what's getting in the way, and we'll work out the right level of support together."
        actions={[
          {
            href: "/coaching",
            label: "Explore coaching",
            icon: ArrowRight,
          },
        ]}
      />
    </Layout>
  );
}

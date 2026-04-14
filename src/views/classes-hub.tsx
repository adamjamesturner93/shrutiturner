"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  Dumbbell,
  Heart,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
  StorySplit,
} from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classesProofItems } from "@/data/public-refresh";
import type { ClassDefinitionContent } from "@/lib/content";
import type { PublicThemedWeek } from "@/lib/themed-weeks/service";

interface ClassesHubPageProps {
  yogaClasses: ClassDefinitionContent[];
  strengthClasses: ClassDefinitionContent[];
  themedWeeks: PublicThemedWeek[];
}

export function ClassesHubPage({ yogaClasses, strengthClasses, themedWeeks }: ClassesHubPageProps) {
  const nextThemedWeeks = themedWeeks.slice(0, 2);

  return (
    <Layout>
      <SEO
        title="Move Well Classes - Adaptive Yoga & Strength Training - Shruti Turner"
        description="Move Well Classes are live online adaptive yoga and intelligent strength sessions for complex bodies. Evidence-based classes that build capacity without burnout."
        keywords="move well classes, online yoga classes, online strength training, adaptive yoga, intelligent training, yoga for chronic illness"
        canonicalUrl="https://shrutiturner.co.uk/classes"
      />

      <EditorialHero
        eyebrow="Move Well Classes"
        size="compact"
        title={
          <>
            Live classes for bodies that need
            <span className="text-brand-accent-light"> nuance, not noise.</span>
          </>
        }
        description="Adaptive yoga and intelligent strength training taught live online. Built for fluctuating capacity, careful progression, and people who still want to feel strong."
        primaryCta={{ href: "/schedule", label: "View Schedule" }}
        secondaryCta={{ href: "/pricing", label: "See Pricing" }}
        stats={[
          { value: "4", label: "Class types across the week" },
          { value: "Live", label: "Real-time coaching and adaptation" },
          { value: "14", label: "Day trial on membership" },
        ]}
        metrics={[
          {
            label: "Yoga",
            detail: "Awareness, regulation, mobility, and steadier movement options.",
          },
          {
            label: "Strength",
            detail: "Load tolerance, confidence, and more support for daily life.",
          },
          {
            label: "Delivery",
            detail: "Join from home with options for flare days, average days, and stronger days.",
          },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="aspect-[4/5] overflow-hidden rounded-[1.4rem]">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1630225758612-8c511aad6c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjB3b21hbiUyMHlvZ2ElMjBtYXQlMjBhZGFwdGl2ZXxlbnwxfHx8fDE3NzE1Mjk4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Adaptive yoga class designed for complex bodies"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-brand-white/10 flex-1 rounded-[1.35rem] p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      What changes here
                    </p>
                    <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                      You are not asked to keep up. You are taught how to scale well and still make
                      progress.
                    </p>
                  </div>
                  <div className="bg-brand-accent-light/12 flex-1 rounded-[1.35rem] p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Membership mood
                    </p>
                    <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                      Consistency, not punishment. Good teaching, good pacing, and no performance
                      theatre.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="Why members stay"
        description="The offer is not just a timetable. It is a better way of staying in a movement practice when your body is not consistent."
        items={[...classesProofItems]}
      />

      <StorySplit
        eyebrow="The Experience"
        title="You do not need another generic workout."
        description="Most people do not come here because they need motivation. They come because they need classes that account for reality."
        body={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Burnout from swinging between overdoing it and avoiding movement entirely.",
                "Fear that loading a joint will create a setback you cannot afford.",
                "Frustration with classes where modifications feel like an afterthought.",
                "The sense that your body is more complicated than most teachers are prepared for.",
              ].map((item) => (
                <div key={item} className="marketing-panel rounded-[1.3rem] px-5 py-5">
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="border-brand-dark/10 bg-brand-warm rounded-[1.5rem] border px-6 py-6">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">In practice</p>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Classes are coached live so you can respond to what your body is doing on the day,
                not what a programme designer imagined weeks ago.
              </p>
            </div>
          </div>
        }
        aside={
          <div className="space-y-4">
            {[
              {
                title: "Rehab-informed",
                body: "The class design starts from joint behaviour, regulation, and symptom variability, not aesthetics.",
                icon: Heart,
              },
              {
                title: "Evidence-based",
                body: "Biomechanics, pain science, and strength principles are translated into teaching that still feels human.",
                icon: TrendingUp,
              },
              {
                title: "Actually adaptive",
                body: "Scaling down is not the only option. You get multiple ways to keep participating intelligently.",
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
                >
                  <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl">{item.title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        }
        className="section-divider"
      />

      <MarketingSection className="section-wash">
        <SectionHeading
          eyebrow="Yoga And Strength"
          title="These disciplines support each other."
          description="Yoga builds awareness and regulation. Strength work builds capacity and confidence. Together they create a movement practice that feels steadier in real life."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "Awareness before load",
              body: "Yoga helps you notice where you are, which makes loading choices clearer and safer.",
            },
            {
              title: "Strength protects flexibility",
              body: "Especially in hypermobile or painful bodies, range without support can feel vulnerable.",
            },
            {
              title: "Both can scale",
              body: "A class can meet you on a flare day without pretending the long-term goal disappeared.",
            },
            {
              title: "Regulation matters",
              body: "Building physical capacity is easier when the nervous system is not already overwhelmed.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-brand-dark/10 bg-background rounded-[1.65rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
            >
              <h3 className="text-2xl">{item.title}</h3>
              <p className="text-muted-foreground mt-4 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="grid gap-16">
          <div>
            <SectionHeading
              eyebrow="Explore The Classes"
              title="Choose the doorway that feels most useful right now."
              description="Some members come for calmer mobility and regulation. Others come to rebuild strength. Most end up wanting both."
              align="center"
            />
          </div>

          <div id="yoga" className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="overflow-hidden rounded-[2rem]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1654613412232-10aaf36df8a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmV0Y2hpbmclMjB5b2dhJTIwY2FsbSUyMG1pbmRmdWwlMjBtb3ZlbWVudHxlbnwxfHx8fDE3NzMzMjQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Mindful adaptive yoga class"
                className="h-full min-h-[22rem] w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Heart className="text-brand-accent h-5 w-5" />
                <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">Yoga classes</p>
              </div>
              <h2 className="mt-4 text-3xl md:text-4xl">
                Adaptive practice, not mainstream yoga with edits.
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
                These sessions prioritise joint safety, proprioception, regulation, and movement
                options that make sense for complex bodies.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Joint-safe movement patterns",
                  "Real-time adaptations for fatigue and flare days",
                  "Support for hypermobility and symptom-sensitive pacing",
                  "A calmer route into confidence and consistency",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex items-start gap-3 text-sm leading-relaxed"
                  >
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {yogaClasses.map((card) => (
                  <Link
                    key={card.id}
                    href={`/classes/${card.slug}`}
                    className="border-brand-dark/10 bg-background rounded-[1.4rem] border p-5 shadow-[0_16px_36px_rgba(46,31,51,0.05)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl">{card.name}</h3>
                      <Badge variant="outline">{card.level}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {card.shortDescription}
                    </p>
                    <p className="text-muted-foreground mt-4 text-xs">
                      {card.day} · {card.time} · {card.duration}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div id="strength" className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
            <div className="overflow-hidden rounded-[2rem] lg:order-2">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwd29tYW4lMjBhdCUyMGhvbWV8ZW58MXx8fHwxNzEwODQ5NzQ3fDA&ixlib=rb-4.0.3&q=80&w=1080"
                alt="Online strength session"
                className="h-full min-h-[22rem] w-full object-cover"
              />
            </div>
            <div className="lg:order-1">
              <div className="flex items-center gap-3">
                <Dumbbell className="text-brand-accent h-5 w-5" />
                <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                  Strength classes
                </p>
              </div>
              <h2 className="mt-4 text-3xl md:text-4xl">
                Strength that makes daily life feel less fragile.
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
                Classes focus on progressive load tolerance, pacing, and clearer movement choices so
                you can build confidence instead of bracing for the next setback.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Progressive loading that respects symptom variability",
                  "Options for limited equipment and home setups",
                  "Clear cueing around effort, pacing, and recovery",
                  "A stronger, less fearful relationship with resistance work",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex items-start gap-3 text-sm leading-relaxed"
                  >
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {strengthClasses.map((card) => (
                  <Link
                    key={card.id}
                    href={`/classes/${card.slug}`}
                    className="border-brand-dark/10 bg-background rounded-[1.4rem] border p-5 shadow-[0_16px_36px_rgba(46,31,51,0.05)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl">{card.name}</h3>
                      <Badge variant="outline">{card.level}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {card.shortDescription}
                    </p>
                    <p className="text-muted-foreground mt-4 text-xs">
                      {card.day} · {card.time} · {card.duration}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MarketingSection>

      {nextThemedWeeks.length > 0 ? (
        <MarketingSection className="bg-brand-warm">
          <SectionHeading
            eyebrow="Current Focus"
            title="Themed weeks for members who want extra structure."
            description="Occasional focused blocks add a little more guidance around a specific theme without changing the core weekly rhythm."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {nextThemedWeeks.map((week) => (
              <article
                key={week.id}
                className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">Themed week</p>
                <h3 className="mt-4 text-2xl">{week.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {week.shortDescription}
                </p>
                <p className="text-muted-foreground mt-4 text-sm">
                  Best for: <span className="text-foreground">{week.audience}</span>
                </p>
                <Button
                  asChild
                  className="bg-brand-dark text-brand-white hover:bg-brand-dark/90 mt-6"
                >
                  <Link href={week.ctaHref}>
                    {week.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </MarketingSection>
      ) : null}

      <PreFooterCtaSection
        eyebrow="Ready to join"
        title="Start with the timetable. Then choose the rhythm that feels sustainable."
        description="Membership is ideal if you want weekly consistency. Credit packs are there if you need more flexibility."
        actions={[
          {
            href: "/schedule",
            label: "View schedule",
            icon: Calendar,
            iconPosition: "start",
          },
          {
            href: "/pricing",
            label: "Compare pricing",
            icon: Video,
            iconPosition: "start",
            variant: "secondary",
          },
        ]}
      />
    </Layout>
  );
}

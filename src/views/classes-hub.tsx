"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  Dumbbell,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import type { ClassDefinitionContent } from "@/lib/content";
import type { PublicThemedWeek } from "@/lib/themed-weeks/service";

interface ClassesHubPageProps {
  yogaClasses: ClassDefinitionContent[];
  strengthClasses: ClassDefinitionContent[];
  themedWeeks: PublicThemedWeek[];
}

export function ClassesHubPage({ yogaClasses, strengthClasses, themedWeeks }: ClassesHubPageProps) {
  return (
    <Layout>
      <SEO
        title="Move Well Classes - Adaptive Yoga & Strength Training - Shruti Turner"
        description="Move Well Classes are live online adaptive yoga and intelligent strength sessions for complex bodies. Evidence-based classes that build capacity without burnout."
        keywords="move well classes, online yoga classes, online strength training, adaptive yoga, intelligent training, yoga for chronic illness"
        canonicalUrl="https://shrutiturner.com/classes"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Move Well Classes</h1>
          <p className="text-brand-accent-light mb-8 text-xl leading-relaxed md:text-2xl">
            Live online classes combining adaptive yoga and intelligent strength training. For
            complex bodies that deserve more than generic fitness.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                View Schedule
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">
            You Don&apos;t Need Another Generic Workout
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl">You&apos;re dealing with:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>Burnout from pushing too hard or resting too much</li>
                <li>Fear of injury or symptom flares</li>
                <li>Plateauing because nothing accounts for your reality</li>
                <li>Confusion about what safe actually means</li>
                <li>Feeling fragile when you want to feel strong</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">You need:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>Training that adapts to unpredictable capacity</li>
                <li>Evidence-based progression that builds genuine strength</li>
                <li>Intelligent modifications, not just easier options</li>
                <li>A coach who understands complex bodies from experience</li>
                <li>Community that gets it</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-3xl md:text-4xl">
            This Isn&apos;t Just Another Online Class
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-xl leading-relaxed">
            I&apos;m not just another yoga teacher or PT. I live with psoriatic arthritis, so these
            classes are built around fluctuating capacity, not in spite of it.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-background rounded-lg border p-6">
              <h3 className="mb-3 text-lg">Rehab-Informed</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Not mainstream yoga with modifications. A fundamentally different approach that
                prioritises joint safety and nervous system regulation.
              </p>
            </div>
            <div className="bg-background rounded-lg border p-6">
              <h3 className="mb-3 text-lg">Evidence-Based</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                PhD-level understanding of biomechanics, pain science, and progressive overload
                applied to real bodies with real limitations.
              </p>
            </div>
            <div className="bg-background rounded-lg border p-6">
              <h3 className="mb-3 text-lg">Lived Experience</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                I train with arthritis, fatigue, and unpredictable symptoms. Every class reflects
                what actually works in messy reality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl md:text-4xl">Why Yoga + Strength?</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-lg leading-relaxed">
            These aren&apos;t separate disciplines bolted together. They reinforce each other to build
            awareness, resilience, and sustainable strength.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Awareness Before Load",
                body: "Yoga develops body awareness and proprioception so strength work feels safer, clearer, and more connected.",
              },
              {
                title: "Strength Protects Flexibility",
                body: "Flexibility without strength is vulnerability, especially in hypermobile and complex bodies.",
              },
              {
                title: "Both Scale to You",
                body: "Both disciplines can be adapted intelligently, whether you need more support today or more challenge next month.",
              },
              {
                title: "Nervous System Regulation",
                body: "The combination helps you build physical capacity while respecting the regulation needs that chronic illness often brings.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-background rounded-lg border p-6">
                <h3 className="mb-3 text-xl">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="yoga" className="scroll-mt-20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Heart className="text-primary h-6 w-6" />
            <h2 className="text-3xl md:text-5xl">Yoga Classes</h2>
          </div>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed">
            Rehabilitation-informed yoga for bodies that need intelligent, adaptive practice, not
            just modifications.
          </p>

          <div className="mb-12 grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1630225758612-8c511aad6c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjB3b21hbiUyMHlvZ2ElMjBtYXQlMjBhZGFwdGl2ZXxlbnwxfHx8fDE3NzE1Mjk4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Adaptive yoga"
                className="h-[300px] w-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl">Not mainstream yoga with modifications</h3>
              <p className="text-muted-foreground leading-relaxed">
                Adaptive yoga starts with a different premise: what does this body need, and how do
                we work with its reality?
              </p>
              <ul className="space-y-2">
                {[
                  "Joint-safe movement patterns",
                  "Nervous system regulation",
                  "Proprioception and stability for hypermobility",
                  "Real-time adaptations for flares and fatigue",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {yogaClasses.map((card) => (
              <Link
                key={card.id}
                href={`/schedule/${card.slug}`}
                className="bg-background rounded-lg border p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg">{card.name}</h3>
                  <Badge variant="outline">{card.level}</Badge>
                </div>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {card.shortDescription}
                </p>
                <p className="text-muted-foreground text-xs">
                  {card.day} · {card.time} · {card.duration}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="strength" className="bg-secondary/20 scroll-mt-20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Dumbbell className="text-primary h-6 w-6" />
            <h2 className="text-3xl md:text-5xl">Strength Classes</h2>
          </div>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed">
            Progressive resistance training for bodies that need intelligent programming, not
            generic workouts.
          </p>

          <div className="mb-12 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-2xl">Intelligent strength for complex bodies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These classes use evidence-based progressive overload adapted for bodies with
                fluctuating baseline capacity and symptom-responsive needs.
              </p>
              <div className="bg-background rounded-lg border p-5">
                <h4 className="mb-3 text-sm">What makes this different</h4>
                <ul className="space-y-2">
                  {[
                    "Progressive but adaptive",
                    "Evidence-based biomechanics and pain science",
                    "Real-time scaling instead of all-or-nothing training",
                  ].map((item) => (
                    <li key={item} className="text-muted-foreground flex items-start gap-2 text-sm">
                      <TrendingUp className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwd29tZW58ZW58MXx8fHwxNzcxNTI5NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Strength training"
                className="h-[300px] w-full object-cover"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {strengthClasses.map((card) => (
              <Link
                key={card.id}
                href={`/schedule/${card.slug}`}
                className="bg-background rounded-lg border p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-base">{card.name}</h3>
                  <Badge variant="outline">
                    {card.type === "HIIT" ? "Conditioning" : card.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {card.shortDescription}
                </p>
                <p className="text-muted-foreground text-xs">
                  {card.day} · {card.time} · {card.duration}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="themed-weeks" className="scroll-mt-20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20 mb-4">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Included with membership and credits
            </Badge>
            <h2 className="mb-4 text-3xl md:text-5xl">Themed Weeks</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
              Focused health topics woven through the Move Well timetable for a short period, with a
              clear lens but without the commitment of a full programme.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 xl:grid-cols-3">
            {themedWeeks.map((week) => (
              <div
                key={week.slug}
                className="bg-background border-brand-accent/30 flex flex-col rounded-lg border-2"
              >
                <div className="bg-brand-accent h-2" />
                <div className="flex flex-1 flex-col space-y-5 p-8">
                  <div>
                    <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20 mb-3">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Themed Week
                    </Badge>
                    <h3 className="text-2xl">{week.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{week.shortDescription}</p>
                  <div className="bg-brand-accent/5 border-brand-accent/20 rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <Video className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">Short-term focus inside your regular class rhythm</p>
                        <p className="text-muted-foreground mt-1 text-xs">{week.audience}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link href={week.ctaHref}>
                      <Button className="bg-brand-accent hover:bg-brand-accent/90 w-full text-white">
                        {week.ctaLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="border-brand-plum/20 bg-brand-plum/5 rounded-xl border-2 p-8 md:p-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-brand-plum/10 text-brand-plum flex h-10 w-10 items-center justify-center rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <Badge className="bg-brand-plum/10 text-brand-plum border-brand-plum/20">
                <Sparkles className="mr-1 h-3 w-3" />
                Limited Spots
              </Badge>
            </div>
            <h2 className="mb-3 text-2xl md:text-3xl">
              Want More Structure? Try a Small Group Programme
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              Small group programmes are 4-6 week multi-session offers with a specific outcome,
              tighter cohort size, and stronger accountability than regular classes.
            </p>
            <Link href="/classes/small-groups">
              <Button className="bg-brand-plum hover:bg-brand-plum/90 text-white">
                View Programmes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">What You&apos;ll Build</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              "Reduced pain",
              "Improved stability",
              "Better function",
              "Body confidence",
              "Nervous system regulation",
              "Resilience",
            ].map((title) => (
              <div key={title} className="space-y-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Check className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Intelligent training that translates into more confidence and more usable capacity
                  in everyday life.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-center text-3xl md:text-4xl">How It Works</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-xl leading-relaxed">
            Everything happens in your browser, with booking, joining, and account management in one
            place.
          </p>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Choose your plan",
                desc: "Start with membership or credits depending on how you like to train.",
              },
              {
                step: 2,
                title: "Book your classes",
                desc: "Use the schedule to choose the class types and times that fit your week.",
              },
              {
                step: 3,
                title: "Join from anywhere",
                desc: "Live classes run directly in your browser with a simple, flare-friendly setup.",
              },
              {
                step: 4,
                title: "Train around real life",
                desc: "Membership and booking rules are designed to be forgiving when symptoms change.",
              },
              {
                step: 5,
                title: "Build consistency at your pace",
                desc: "Focus on capacity, confidence, and long-term strength instead of all-or-nothing momentum.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-background flex items-start gap-6 rounded-lg border p-6"
              >
                <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-2 text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl md:text-4xl">Ready to Start Training?</h2>
          <p className="mb-8 text-lg opacity-90">
            Single class £9 · 3-pack £24 · membership from £29/month
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                View Schedule
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

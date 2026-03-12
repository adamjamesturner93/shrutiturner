"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { Check, Calendar, TrendingUp } from "lucide-react";
import type { ClassDefinitionContent, TestimonialContent } from "@/lib/content";

interface ClassesStrengthPageProps {
  classDefinitions?: ClassDefinitionContent[];
  testimonials?: TestimonialContent[];
}

export function ClassesStrengthPage({
  classDefinitions = [],
  testimonials = [],
}: ClassesStrengthPageProps) {
  return (
    <Layout>
      <SEO
        title="Online Strength Training Classes - Adaptive Strength for Complex Bodies - Shruti Turner"
        description="Live online strength training classes designed for chronic illness and autoimmune conditions. Progressive, evidence-based resistance training that builds capacity without burnout."
        keywords="online strength training UK, strength training chronic illness, adaptive strength classes, bodyweight strength progression, strength training autoimmune"
        canonicalUrl="https://shrutiturner.com/classes/strength"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Online Strength Training</h1>
          <p className="mb-8 text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
            Progressive resistance training designed for bodies that need intelligent programming,
            not generic workouts.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                View Schedule
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-[#B5C49B] bg-transparent text-[#B5C49B] hover:bg-[#B5C49B]/10"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-16 overflow-hidden rounded-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwd29tZW58ZW58MXx8fHwxNzcxNTI5NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Woman doing strength training"
              className="h-[400px] w-full object-cover"
            />
          </div>

          <h2 className="mb-12 text-center text-3xl md:text-5xl">
            Intelligent Strength Training for Complex Bodies
          </h2>

          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <p className="text-muted-foreground mb-6 text-xl leading-relaxed">
                Generic strength programs don't work when your baseline capacity fluctuates, when
                inflammation flares unpredictably, or when "just push through" causes crashes.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                These classes use evidence-based progressive overload adapted for bodies that need
                symptom-responsive programming. You'll build genuine capacity without aggravating
                your conditions.
              </p>
            </div>

            <div className="bg-secondary/20 rounded-lg border p-6">
              <h3 className="mb-4 text-xl">What Makes This Different</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Progressive but adaptive</strong> — structured progression that respects
                    symptom fluctuations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Evidence-based</strong> — PhD-level understanding of biomechanics and
                    pain science
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Real-time modifications</strong> — scaled live for your current
                    capacity, not just "easier options"
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Class Definitions */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-3 text-center text-3xl md:text-5xl">Class Styles</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center">
            Current strength formats from the CMS, presented in the same structure used across the
            public class pages.
          </p>

          {classDefinitions.length > 0 ? (
            <div className="space-y-5">
              {classDefinitions.map((cls, index) => (
                <div
                  key={cls.id}
                  className="bg-background grid gap-5 rounded-xl border p-6 md:grid-cols-[1fr_auto]"
                >
                  <div className="space-y-3">
                    <p className="text-primary text-xs uppercase tracking-wide">
                      Format {index + 1}
                    </p>
                    <h3 className="text-2xl">{cls.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{cls.shortDescription}</p>
                    <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border px-3 py-1">{cls.duration}</span>
                      <span className="rounded-full border px-3 py-1">{cls.level}</span>
                      <span className="rounded-full border px-3 py-1">Progressive scaling included</span>
                    </div>
                  </div>
                  <Link href={`/schedule/${cls.slug}`}>
                    <Button variant="outline" className="w-full md:w-auto">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              No strength class templates are currently published in Contentful.
            </p>
          )}

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              All classes include real-time modifications. Can't make it live? Replays available for
              7 days.
            </p>
            <Link href="/schedule">
              <Button size="lg">
                See Full Weekly Schedule
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Who This Is For</h2>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="bg-secondary/20 space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You have chronic conditions that need intelligent programming</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>Generic programs don't account for your fluctuating capacity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want to build strength, not just "stay active"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You value evidence-based progression</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You refuse to be treated as fragile</span>
                </li>
              </ul>
            </div>

            <div className="bg-secondary/20 space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">This is NOT for you if:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>You want bodybuilding or aesthetic-focused training</li>
                <li>You're looking for quick fixes or dramatic transformations</li>
                <li>You want hardcore, aggressive programming</li>
                <li>You're not willing to work within your body's limitations</li>
                <li>You expect linear, predictable progress</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">What You'll Build</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Functional Strength</h3>
              <p className="text-muted-foreground leading-relaxed">
                Capacity for activities that matter in your life—carrying shopping, playing with
                kids, maintaining independence.
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Reduced Pain</h3>
              <p className="text-muted-foreground leading-relaxed">
                Research shows resistance training reduces pain and inflammation in chronic
                conditions, including arthritis and fibromyalgia.
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Bone Density</h3>
              <p className="text-muted-foreground leading-relaxed">
                Progressive loading improves bone mineral density—crucial for people on long-term
                steroids or with osteoporosis risk.
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Metabolic Health</h3>
              <p className="text-muted-foreground leading-relaxed">
                Muscle mass improves insulin sensitivity, metabolic rate, and overall metabolic
                health.
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Confidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Feeling capable in your body changes everything. Strength training builds genuine
                self-efficacy.
              </p>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-6">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Resilience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Greater capacity to handle life stress, symptom flares, and unexpected challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">What Students Say</h2>

          {testimonials.length > 0 ? (
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary/20 border-primary space-y-4 rounded-lg border border-l-4 p-6"
                >
                  <p className="text-muted-foreground leading-relaxed italic">"{item.quote}"</p>
                  <p className="text-sm">
                    — {item.authorName}
                    {item.authorCondition ? `, ${item.authorCondition}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              No strength testimonials are currently published in Contentful.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-4xl">Ready to Build Genuine Strength?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Join live classes designed for bodies that need intelligent programming, not generic
            workouts.
          </p>
          <p className="mb-4 text-sm opacity-70">Single class £9 · 3-pack £24 · Membership from £29/month</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
                View Schedule
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
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

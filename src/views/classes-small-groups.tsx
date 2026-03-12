"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { ArrowRight, Users, Calendar, Sparkles, Check } from "lucide-react";
import type { ClassDefinitionContent, TestimonialContent } from "@/lib/content";

interface ClassesSmallGroupsPageProps {
  classDefinitions?: ClassDefinitionContent[];
  testimonials?: TestimonialContent[];
}

export function ClassesSmallGroupsPage({
  classDefinitions = [],
  testimonials = [],
}: ClassesSmallGroupsPageProps) {
  return (
    <Layout>
      <SEO
        title="Small Group Programs - Focused Skill Progression - Shruti Turner"
        description="4-6 week small group fitness programs (max 6 people) focused on specific skills like press-ups, handstands, and shoulder health. Personalized attention with community support."
        keywords="small group fitness online, online strength course, 4 week yoga program, small group training chronic illness"
        canonicalUrl="https://shrutiturner.com/classes/small-groups"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#B5C49B]/20 px-4 py-2 text-sm text-[#B5C49B]">
            <Sparkles className="h-4 w-4" />
            <span>Limited to 6 people per cohort</span>
          </div>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Small Group Programs</h1>
          <p className="mb-8 text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
            4-6 week focused programs with specific skill outcomes. Small cohorts mean personalized
            attention and genuine community support.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                View All Programs
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

      {/* Why Small Groups */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Why Small Groups Work</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Users className="text-primary h-8 w-8" />
              <h3 className="text-xl">Personalized Attention</h3>
              <p className="text-muted-foreground leading-relaxed">
                With only 6 people, you get individual feedback and modifications every session—not
                possible in larger classes.
              </p>
            </div>

            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Sparkles className="text-primary h-8 w-8" />
              <h3 className="text-xl">Clear Progression</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each program has a specific skill outcome. You're not just "doing workouts"—you're
                building toward something tangible.
              </p>
            </div>

            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Check className="text-primary h-8 w-8" />
              <h3 className="text-xl">Real Community</h3>
              <p className="text-muted-foreground leading-relaxed">
                Small cohorts create genuine connection. You'll train with the same people for 4-6
                weeks, building accountability and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Programs */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Current Programs</h2>

          {classDefinitions.length > 0 ? (
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
              {classDefinitions.map((program) => (
                <div
                  key={program.id}
                  className="bg-background overflow-hidden rounded-lg border-2 transition-shadow hover:shadow-lg"
                >
                  <div className="space-y-6 p-8">
                    <div>
                      <h3 className="mb-2 text-2xl">{program.name}</h3>
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <span>{program.duration}</span>
                        <span>•</span>
                        <span>{program.level}</span>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {program.shortDescription}
                    </p>

                    <Link href={`/schedule/${program.slug}`}>
                      <Button>
                        View Program
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                No small-group class templates are currently published in Contentful.
              </p>
              <Link href="/">
                <Button variant="outline" size="lg">
                  Join Newsletter for Early Access
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                1
              </div>
              <div>
                <h3 className="mb-2 text-lg">Choose Your Program</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Select the skill you want to build. Each program has clear outcomes and defined
                  timelines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                2
              </div>
              <div>
                <h3 className="mb-2 text-lg">Join Your Cohort</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Meet your cohort (maximum 6 people) for 2 live sessions per week at scheduled
                  times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                3
              </div>
              <div>
                <h3 className="mb-2 text-lg">Get Individual Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Small group size means I can give you personalized cues, modifications, and
                  progressions every session.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                4
              </div>
              <div>
                <h3 className="mb-2 text-lg">Build Your Skill</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Over 4-6 weeks, you'll progress toward your skill goal with structured,
                  intelligent programming that respects your body's reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Who This Is For</h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You have a specific skill you want to build</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You value personalized feedback and attention</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want community and accountability</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You prefer structured progression over open classes</span>
                </li>
              </ul>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">✗ This is NOT for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>• You want drop-in flexibility (try regular classes)</li>
                <li>• You're not ready to commit to a schedule</li>
                <li>• You prefer training solo</li>
                <li>• You want general fitness, not specific skills</li>
              </ul>
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
                <div key={item.id} className="bg-secondary/20 space-y-4 rounded-lg border p-6">
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
              No small-group testimonials are currently published in Contentful.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-4xl">Ready to Build a Specific Skill?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Limited spots mean you get genuine attention. Small cohorts fill quickly.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
                View Current Programs
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAFAF8] bg-transparent text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                Join Newsletter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

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
        title="Small Group Programmes - Focused Skill Progression - Shruti Turner"
        description="Multi-week small group programmes with specific skill outcomes, structured progression, and genuine individual attention for complex bodies."
        keywords="small group fitness online, online strength course, small group training chronic illness, focused training programme"
        canonicalUrl="https://shrutiturner.com/classes/small-groups"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="bg-brand-accent-light/20 text-brand-accent-light mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Limited to 6 people per cohort</span>
          </div>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Small Group Programmes</h1>
          <p className="text-brand-accent-light mb-8 text-xl leading-relaxed md:text-2xl">
            Multi-week small cohort training with a specific outcome, stronger accountability, and
            more structure than regular classes.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="#current-programmes">
              <Button
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                View Current Programmes
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-accent-light text-brand-accent-light hover:bg-brand-accent-light/10 bg-transparent"
              >
                Back to Move Well Classes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl md:text-5xl">Why a Programme?</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed">
            Move Well Classes are ideal for ongoing practice. Programmes are for the season when you
            want a tighter container, a fixed group, and a more deliberate build toward one goal.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Users className="text-primary h-8 w-8" />
              <h3 className="text-xl">Personalised Attention</h3>
              <p className="text-muted-foreground leading-relaxed">
                With only 6 people, you get more individual feedback, coaching cues, and progression
                support in every session.
              </p>
            </div>

            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Sparkles className="text-primary h-8 w-8" />
              <h3 className="text-xl">Clear Progression</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each programme is built around a specific theme or skill outcome. You are not just
                attending classes, you are moving through a structured block.
              </p>
            </div>

            <div className="bg-secondary/20 space-y-4 rounded-lg border p-6">
              <Check className="text-primary h-8 w-8" />
              <h3 className="text-xl">Accountability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Small cohorts create momentum. You train with the same people over several weeks,
                which makes showing up and progressing much easier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="current-programmes" className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Current Programmes</h2>

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
                        View Programme
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
                No small-group programmes are currently published in Contentful.
              </p>
              <Link href="/">
                <Button variant="outline" size="lg">
                  Join Newsletter for Early Access
                </Button>
              </Link>
            </div>
          )}

          <p className="text-muted-foreground mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed">
            New programme blocks are announced through the newsletter and schedule updates. If the
            current cohort is not the right fit, keep an eye out for the next intake.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                1
              </div>
              <div>
                <h3 className="mb-2 text-lg">Choose Your Programme</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pick the programme that matches the skill, theme, or training outcome you want to
                  work toward next.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                2
              </div>
              <div>
                <h3 className="mb-2 text-lg">Commit to the Cohort</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Each programme runs across a fixed block, with scheduled sessions and a stable
                  group so progression can build week by week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                3
              </div>
              <div>
                <h3 className="mb-2 text-lg">Get More Individual Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The smaller group size allows more tailored cueing, clearer progressions, and a
                  stronger sense of accountability than a standard class format.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium">
                4
              </div>
              <div>
                <h3 className="mb-2 text-lg">Carry It Back Into Your Regular Practice</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use your programme block to build capacity, then bring that confidence back into
                  Move Well Classes and the rest of your training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Who This Is For</h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">This is for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want a specific outcome rather than open-ended drop-ins</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You value accountability and a small, familiar cohort</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You are happy committing to a set schedule for a few weeks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want more structure and feedback than regular classes provide</span>
                </li>
              </ul>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">This is not the best fit if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>• You want maximum flexibility week to week</li>
                <li>• You are looking for general practice rather than a focused block</li>
                <li>• You prefer to dip in and out rather than commit to a cohort</li>
                <li>• You would be better served by regular Move Well Classes first</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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

      <section className="bg-brand-accent text-brand-white py-20 md:py-24">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h2 className="text-3xl leading-tight md:text-4xl">Ready to Go Deeper?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            If you want a more structured block than weekly classes can give you, a small group
            programme is the next step.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="#current-programmes">
              <Button
                size="lg"
                className="bg-brand-white text-brand-accent hover:bg-brand-white/90"
              >
                View Current Programmes
                <Calendar className="ml-2 h-5 w-5" />
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
    </Layout>
  );
}

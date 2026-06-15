"use client";

import { Layout } from "../components/layout";
import { PreFooterCtaSection } from "../components/marketing/sections";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { Check, Calendar } from "lucide-react";
import type { ClassDefinitionContent, TestimonialContent } from "@/lib/content/types";

interface ClassesYogaPageProps {
  classDefinitions?: ClassDefinitionContent[];
  testimonials?: TestimonialContent[];
}

export function ClassesYogaPage({
  classDefinitions = [],
  testimonials = [],
}: ClassesYogaPageProps) {
  return (
    <Layout>
      <SEO
        title="Online Yoga Classes - Inclusive Adaptive Yoga - Shruti Turner"
        description="Live online adaptive yoga classes for chronic illness, autoimmune conditions and hypermobility. Rehabilitation-informed yoga that prioritizes safety, stability and nervous system regulation."
        keywords="online yoga classes UK, adaptive yoga online, yoga for chronic illness, yoga for hypermobility, rehabilitation yoga online, therapeutic yoga classes"
        canonicalUrl="https://shrutiturner.co.uk/classes/yoga"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Online Yoga Classes</h1>
          <p className="mb-8 text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
            Rehabilitation-informed yoga for people who need intelligent, adaptive practice, not
            just modifications.
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

      {/* What Makes This Different */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Image Section */}
          <div className="mb-16 overflow-hidden rounded-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1630225758612-8c511aad6c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjB3b21hbiUyMHlvZ2ElMjBtYXQlMjBhZGFwdGl2ZXxlbnwxfHx8fDE3NzE1Mjk4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Woman practicing adaptive yoga"
              className="h-[400px] w-full object-cover"
            />
          </div>

          <h2 className="mb-12 text-center text-3xl md:text-5xl">
            Not Mainstream Yoga With Modifications
          </h2>

          <div className="mx-auto max-w-3xl space-y-12">
            <div className="space-y-4">
              <h3 className="text-2xl">A Different Premise Entirely</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most yoga modifications are just "easier versions" of poses designed for different
                bodies. Adaptive yoga starts with a different premise: what does <em>this</em> body
                need and how do we work with its reality?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you have chronic pain, arthritis, hypermobility, or fatigue, standard yoga can do
                more harm than good—even with modifications. These classes are fundamentally
                different.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Safety First, Always</h3>
              <p className="text-muted-foreground leading-relaxed">
                No pushing into end-range flexibility. No "breathe through the pain." No assumptions
                that mobility equals health. Every practice prioritizes joint stability and tissue
                safety—especially crucial for hypermobile, arthritic, or chronically inflamed
                bodies.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Nervous System Regulation</h3>
              <p className="text-muted-foreground leading-relaxed">
                For people with chronic conditions, nervous system dysregulation is common.
                Practices are designed to help your nervous system find regulation, which has real
                impacts on pain perception, fatigue and symptom management.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Function Over Aesthetics</h3>
              <p className="text-muted-foreground leading-relaxed">
                The goal isn't achieving a particular shape or getting "more flexible." It's
                improving your capacity for movement that matters in your daily life—getting up from
                the floor, reaching overhead, maintaining stability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Who This Is For</h2>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You have chronic pain, arthritis, or autoimmune conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You're hypermobile and need stability, not more flexibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>Mainstream yoga classes have left you feeling dismissed or injured</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want nervous system regulation, not just stretching</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You value evidence-based approaches over spiritual platitudes</span>
                </li>
              </ul>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">This is NOT for you if:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>You want intense, athletic-style yoga flows</li>
                <li>You're looking for spiritual or religious practices</li>
                <li>You want to achieve advanced poses for social media</li>
                <li>You're seeking a quick flexibility fix</li>
                <li>You're not willing to work slowly and intelligently</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Class Definitions */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-3 text-center text-3xl md:text-5xl">Class Styles</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center">
            These are the yoga formats currently running in the timetable. Each session is adapted
            live for symptom changes, pain levels and energy fluctuations.
          </p>

          {classDefinitions.length > 0 ? (
            <div className="space-y-5">
              {classDefinitions.map((cls, index) => (
                <div
                  key={cls.id}
                  className="bg-background grid gap-5 rounded-xl border p-6 md:grid-cols-[1fr_auto]"
                >
                  <div className="space-y-3">
                    <p className="text-primary text-xs tracking-wide uppercase">
                      Format {index + 1}
                    </p>
                    <h3 className="text-2xl">{cls.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{cls.shortDescription}</p>
                    <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border px-3 py-1">{cls.duration}</span>
                      <span className="rounded-full border px-3 py-1">{cls.level}</span>
                      <span className="rounded-full border px-3 py-1">
                        Live adaptations included
                      </span>
                    </div>
                  </div>
                  <Link href={`/classes/${cls.slug}`}>
                    <Button variant="outline" className="w-full md:w-auto">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              No yoga class templates are currently published in Contentful.
            </p>
          )}

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              All classes include real-time modifications for your current capacity. Can't make it
              live? Join another scheduled session that suits your week.
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

      {/* Benefits */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Outcomes You Can Expect</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Reduced Pain</h3>
              <p className="text-muted-foreground leading-relaxed">
                Through nervous system regulation and safe movement patterns that reduce joint
                stress and inflammation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Improved Stability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Especially important when hypermobility means strength and control matter more than
                flexibility.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Better Function</h3>
              <p className="text-muted-foreground leading-relaxed">
                Movement capacity that translates to easier daily activities and improved quality of
                life.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Nervous System Regulation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tools to help manage the stress response that amplifies chronic pain and fatigue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Body Confidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Learning to trust your body again after chronic illness has eroded that trust.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Check className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl">Practical Skills</h3>
              <p className="text-muted-foreground leading-relaxed">
                Techniques you can use independently to manage symptoms and improve well-being.
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
              No yoga testimonials are currently published in Contentful.
            </p>
          )}
        </div>
      </section>

      <PreFooterCtaSection
        layout="centered"
        title="Ready to Experience Yoga That Works With Your Body?"
        description="Join live classes with clear pacing, thoughtful teaching and room to adapt. All levels welcome, all bodies respected."
        actions={[
          {
            href: "/schedule",
            label: "View Schedule",
            icon: Calendar,
          },
          {
            href: "/pricing",
            label: "View Pricing",
            variant: "secondary",
          },
        ]}
      >
        <p className="text-sm opacity-70">
          Single class £9 · 3-pack £24 · Membership from £35/month
        </p>
      </PreFooterCtaSection>
    </Layout>
  );
}

"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, Users, Calendar, Sparkles, Check } from "lucide-react";
import { useI18n } from "../lib/use-i18n";

export function ClassesSmallGroupsPage() {
  const { fmtDate } = useI18n();
  // Mock programs - in production from CMS/database
  const programs = [
    {
      id: "press-up-progression",
      title: "Press-Up Progression",
      duration: "4 weeks",
      startDate: "2025-03-10",
      spots: 6,
      spotsRemaining: 3,
      description: "Build your first full press-up (or improve your current capacity) with intelligent, adaptive progression.",
      outcomes: [
        "Learn proper push-up mechanics",
        "Build shoulder and core stability",
        "Progress from wall/box to floor press-ups",
        "Understand how to scale for flares",
      ],
      price: "£120",
      level: "All levels",
    },
    {
      id: "shoulder-resilience",
      title: "Shoulder Resilience & Mobility",
      duration: "6 weeks",
      startDate: "2025-03-17",
      spots: 6,
      spotsRemaining: 2,
      description: "Build durable, pain-free shoulders through targeted strength and controlled mobility work.",
      outcomes: [
        "Reduce shoulder pain and clicking",
        "Improve overhead capacity",
        "Build rotator cuff strength",
        "Better shoulder stability for yoga/life",
      ],
      price: "£165",
      level: "All levels",
    },
  ];

  return (
    <Layout>
      <SEO
        title="Small Group Programs - Focused Skill Progression - Shruti Turner"
        description="4-6 week small group fitness programs (max 6 people) focused on specific skills like press-ups, handstands, and shoulder health. Personalized attention with community support."
        keywords="small group fitness online, online strength course, 4 week yoga program, small group training chronic illness"
        canonicalUrl="https://shrutiturner.com/classes/small-groups"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-[#B5C49B]/20 text-[#B5C49B] px-4 py-2 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Limited to 6 people per cohort</span>
          </div>
          <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
            Small Group Programs
          </h1>
          <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed mb-8">
            4-6 week focused programs with specific skill outcomes. Small cohorts mean personalized attention and genuine community support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                View All Programs
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#B5C49B] text-[#B5C49B] hover:bg-[#B5C49B]/10"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Small Groups */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Why Small Groups Work
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <Users className="w-8 h-8 text-primary" />
              <h3 className="text-xl">Personalized Attention</h3>
              <p className="text-muted-foreground leading-relaxed">
                With only 6 people, you get individual feedback and modifications every session—not possible in larger classes.
              </p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="text-xl">Clear Progression</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each program has a specific skill outcome. You're not just "doing workouts"—you're building toward something tangible.
              </p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <Check className="w-8 h-8 text-primary" />
              <h3 className="text-xl">Real Community</h3>
              <p className="text-muted-foreground leading-relaxed">
                Small cohorts create genuine connection. You'll train with the same people for 4-6 weeks, building accountability and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Programs */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Current Programs
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-background border-2 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-8 space-y-6">
                  {program.spotsRemaining <= 2 && (
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
                      <Sparkles className="w-3 h-3" />
                      Only {program.spotsRemaining} spots left
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl mb-2">{program.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{program.duration}</span>
                      <span>•</span>
                      <span>Starts {fmtDate(program.startDate)}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {program.description}
                  </p>

                  <div>
                    <h4 className="text-sm font-medium mb-3">What You'll Achieve:</h4>
                    <ul className="space-y-2">
                      {program.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-2xl font-medium">{program.price}</p>
                      <p className="text-xs text-muted-foreground">
                        {program.spots - program.spotsRemaining} of {program.spots} spots filled
                      </p>
                    </div>
                    <Link href="/login">
                      <Button>
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              New programs announced monthly. Join the newsletter to get early access.
            </p>
            <Link href="/">
              <Button variant="outline" size="lg">
                Join Newsletter for Early Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            How It Works
          </h2>

          <div className="space-y-6">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                1
              </div>
              <div>
                <h3 className="text-lg mb-2">Choose Your Program</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Select the skill you want to build. Each program has clear outcomes and defined timelines.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                2
              </div>
              <div>
                <h3 className="text-lg mb-2">Join Your Cohort</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Meet your cohort (maximum 6 people) for 2 live sessions per week at scheduled times.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                3
              </div>
              <div>
                <h3 className="text-lg mb-2">Get Individual Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Small group size means I can give you personalized cues, modifications, and progressions every session.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                4
              </div>
              <div>
                <h3 className="text-lg mb-2">Build Your Skill</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Over 4-6 weeks, you'll progress toward your skill goal with structured, intelligent programming that respects your body's reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Who This Is For
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You have a specific skill you want to build</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You value personalized feedback and attention</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You want community and accountability</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You prefer structured progression over open classes</span>
                </li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✗ This is NOT for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• You want drop-in flexibility (try regular classes)</li>
                <li>• You're not ready to commit to a schedule</li>
                <li>• You prefer training solo</li>
                <li>• You want general fitness, not specific skills</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl leading-tight">
            Ready to Build a Specific Skill?
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Limited spots mean you get genuine attention. Small cohorts fill quickly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
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
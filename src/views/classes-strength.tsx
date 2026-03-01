"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, Check, Calendar, TrendingUp } from "lucide-react";

export function ClassesStrengthPage() {
  return (
    <Layout>
      <SEO
        title="Online Strength Training Classes - Adaptive Strength for Complex Bodies - Shruti Turner"
        description="Live online strength training classes designed for chronic illness and autoimmune conditions. Progressive, evidence-based resistance training that builds capacity without burnout."
        keywords="online strength training UK, strength training chronic illness, adaptive strength classes, bodyweight strength progression, strength training autoimmune"
        canonicalUrl="https://shrutiturner.com/classes/strength"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
            Online Strength Training
          </h1>
          <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed mb-8">
            Progressive resistance training designed for bodies that need intelligent programming, not generic workouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule">
              <Button size="lg" className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]">
                View Schedule
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

      {/* Philosophy Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-16 rounded-lg overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwd29tZW58ZW58MXx8fHwxNzcxNTI5NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Woman doing strength training"
              className="w-full h-[400px] object-cover"
            />
          </div>

          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Intelligent Strength Training for Complex Bodies
          </h2>

          <div className="space-y-8 max-w-3xl mx-auto">
            <div>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                Generic strength programs don't work when your baseline capacity fluctuates,
                when inflammation flares unpredictably, or when "just push through" causes crashes.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                These classes use evidence-based progressive overload adapted for bodies that need
                symptom-responsive programming. You'll build genuine capacity without aggravating
                your conditions.
              </p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6">
              <h3 className="text-xl mb-4">What Makes This Different</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Progressive but adaptive</strong> — structured progression that respects symptom fluctuations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Evidence-based</strong> — PhD-level understanding of biomechanics and pain science
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>Real-time modifications</strong> — scaled live for your current capacity, not just "easier options"
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Class Types */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Class Types
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-2xl">Strength Foundations</h3>
              <p className="text-sm text-muted-foreground">45 minutes • Beginner-Friendly</p>
              <p className="text-muted-foreground leading-relaxed">
                Introduction to strength training principles for complex bodies. Build foundational
                movement patterns and progressive capacity.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Bodyweight and light resistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Focus on form and control</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Building confidence</span>
                </li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-2xl">Strength Progression</h3>
              <p className="text-sm text-muted-foreground">45-60 minutes • Intermediate</p>
              <p className="text-muted-foreground leading-relaxed">
                For those with established strength practice. Progressive loading with dumbbells,
                bands, and bodyweight progressions.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Structured progressive overload</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Skill progressions (e.g., push-ups, rows)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Building robust capacity</span>
                </li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-2xl">Chair-Based Strength</h3>
              <p className="text-sm text-muted-foreground">30-40 minutes • Adaptive</p>
              <p className="text-muted-foreground leading-relaxed">
                Effective strength training using a chair for support. Perfect for high-fatigue days,
                mobility limitations, or building from baseline.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Seated and supported exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Low barrier to entry</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Genuine strength work, not "gentle exercise"</span>
                </li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-2xl">HIIT for Complex Bodies</h3>
              <p className="text-sm text-muted-foreground">30-45 minutes • Intermediate</p>
              <p className="text-muted-foreground leading-relaxed">
                Modified high-intensity intervals adapted for chronic conditions. Scalable intensity
                with proper rest ratios.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Time-efficient cardiovascular work</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Symptom-responsive intensity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Built-in recovery periods</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              All classes include real-time modifications. Can't make it live? Replays available for 7 days.
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
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Who This Is For
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-secondary/20 border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You have chronic conditions that need intelligent programming</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Generic programs don't account for your fluctuating capacity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You want to build strength, not just "stay active"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You value evidence-based progression</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You refuse to be treated as fragile</span>
                </li>
              </ul>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✗ This is NOT for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• You want bodybuilding or aesthetic-focused training</li>
                <li>• You're looking for quick fixes or dramatic transformations</li>
                <li>• You want hardcore, aggressive programming</li>
                <li>• You're not willing to work within your body's limitations</li>
                <li>• You expect linear, predictable progress</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            What You'll Build
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Functional Strength</h3>
              <p className="text-muted-foreground leading-relaxed">
                Capacity for activities that matter in your life—carrying shopping, playing with kids,
                maintaining independence.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Reduced Pain</h3>
              <p className="text-muted-foreground leading-relaxed">
                Research shows resistance training reduces pain and inflammation in chronic conditions,
                including arthritis and fibromyalgia.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Bone Density</h3>
              <p className="text-muted-foreground leading-relaxed">
                Progressive loading improves bone mineral density—crucial for people on long-term
                steroids or with osteoporosis risk.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Metabolic Health</h3>
              <p className="text-muted-foreground leading-relaxed">
                Muscle mass improves insulin sensitivity, metabolic rate, and overall metabolic health.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Confidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Feeling capable in your body changes everything. Strength training builds genuine
                self-efficacy.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
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
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            What Students Say
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "I've built more strength in 12 weeks than in years of trying generic programs. Shruti actually gets what it's like to train with chronic illness."
              </p>
              <p className="text-sm">— James, Rheumatoid Arthritis</p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "The modifications aren't patronizing 'easier options'—they're intelligent scaling that still builds strength. Finally, programming that respects my body."
              </p>
              <p className="text-sm">— Rachel, Lupus</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl leading-tight">
            Ready to Build Genuine Strength?
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Join live classes designed for bodies that need intelligent programming, not generic workouts.
          </p>
          <p className="text-sm opacity-70 mb-4">
            Drop-in from £12 · Bundles from £9/class · Unlimited from £79/month
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
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
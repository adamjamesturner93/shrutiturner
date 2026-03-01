"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Users, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function ClassesHubPage() {
  return (
    <Layout>
      <SEO
        title="Online Classes - Adaptive Yoga & Strength Training - Shruti Turner"
        description="Live online yoga and strength classes designed for complex bodies. Adaptive, evidence-based training that builds capacity without burnout."
        keywords="online yoga classes, online strength training, adaptive yoga, intelligent training, yoga for chronic illness"
        canonicalUrl="https://shrutiturner.com/classes"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
            Build Resilient Bodies Without Burnout
          </h1>
          <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed mb-8">
            Live online classes combining adaptive yoga and intelligent strength
            training. For people who refuse to be fragile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule">
              <Button
                size="lg"
                className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]"
              >
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

      {/* The Problem */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            You Don't Need Another Generic Workout
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="text-xl">You're dealing with:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>
                    Burnout from pushing too hard or resting too much
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>Fear of injury or symptom flares</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>
                    Plateauing because nothing accounts for your reality
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>Confusion about what "safe" actually means</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>Feeling fragile when you want to feel strong</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">You need:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[#4B5B32] mt-1">+</span>
                  <span>
                    Training that adapts to unpredictable capacity
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4B5B32] mt-1">+</span>
                  <span>
                    Evidence-based progression that builds genuine strength
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4B5B32] mt-1">+</span>
                  <span>
                    Intelligent modifications, not just "easier options"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4B5B32] mt-1">+</span>
                  <span>
                    A coach who understands complex bodies from experience
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4B5B32] mt-1">+</span>
                  <span>Community that gets it</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy/Differentiation */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl text-center mb-8">
            This Isn't Just Another Online Class
          </h2>
          <p className="text-xl text-center text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
            I'm not just another yoga teacher or PT. I have psoriatic arthritis.
            I've lived the frustration of programs that don't account for
            fluctuating capacity, patronising modifications, and being told to
            "just rest."
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-background border rounded-lg p-6 space-y-3">
              <h3 className="text-lg">Rehab-Informed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Not mainstream yoga with modifications. A fundamentally different
                approach prioritising joint safety and nervous system regulation.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-3">
              <h3 className="text-lg">Evidence-Based</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PhD-level understanding of biomechanics, pain science, and
                progressive overload applied to real bodies with real
                limitations.
              </p>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-3">
              <h3 className="text-lg">Lived Experience</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I train with arthritis, fatigue, and unpredictable flares. Every
                program I design reflects what actually works in messy reality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Cards */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            Choose Your Path
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Yoga Classes */}
            <div className="bg-background border-2 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-secondary relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZGFwdGl2ZSUyMHlvZ2ElMjBjbGFzc3xlbnwxfHx8fDE3NzE1Mjk1NDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Adaptive yoga class"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl">Yoga Classes</h3>
                <p className="text-muted-foreground">
                  Stability-focused yoga that builds strength without
                  aggravating symptoms.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>- Joint-safe movement patterns</li>
                  <li>- Nervous system regulation</li>
                  <li>- Real-time adaptations</li>
                </ul>
                <Link href="/classes/yoga">
                  <Button className="w-full">
                    Explore Yoga
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Strength Classes */}
            <div className="bg-background border-2 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-secondary relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwd29tZW58ZW58MXx8fHwxNzcxNTI5NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Strength training class"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl">Strength Classes</h3>
                <p className="text-muted-foreground">
                  Progressive resistance training designed for bodies that need
                  intelligent programming.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>- Evidence-based progression</li>
                  <li>- Symptom-responsive scaling</li>
                  <li>- Build genuine capacity</li>
                </ul>
                <Link href="/classes/strength">
                  <Button className="w-full">
                    Explore Strength
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Small Groups */}
            <div className="bg-background border-2 border-primary rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Limited Spots
                </span>
              </div>
              <div className="aspect-[4/3] bg-secondary relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGdyb3VwJTIwZml0bmVzc3xlbnwxfHx8fDE3NzE1Mjk1NDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Small group training"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl">Small Group Programs</h3>
                <p className="text-muted-foreground">
                  4-6 week cohorts with specific goals. Maximum 6 people for
                  personalised attention.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>- Focused skill progression</li>
                  <li>- Supportive community</li>
                  <li>- Accountability & feedback</li>
                </ul>
                <Link href="/classes/small-groups">
                  <Button className="w-full">
                    View Programs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl text-center mb-4">
            How It Works
          </h2>
          <p className="text-xl text-center text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
            Everything happens in your browser — no apps to download, no complicated setup.
          </p>

          <div className="space-y-6">
            <div className="bg-background border rounded-lg p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="text-lg mb-2">Choose Your Plan</h3>
                <p className="text-muted-foreground">
                  Start with a 14-day free membership trial, buy a drop-in or class bundle,
                  or go straight to monthly. No commitment needed to try a class.
                </p>
              </div>
            </div>

            <div className="bg-background border rounded-lg p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                2
              </div>
              <div>
                <h3 className="text-lg mb-2">Book Your Classes</h3>
                <p className="text-muted-foreground">
                  Browse the schedule, filter by type, and book classes that suit
                  your current capacity and goals.
                </p>
              </div>
            </div>

            <div className="bg-background border rounded-lg p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                3
              </div>
              <div>
                <h3 className="text-lg mb-2">Join from Anywhere</h3>
                <p className="text-muted-foreground">
                  When it's class time, click "Join" from your Private Studio. You'll
                  enter a live session directly in your browser — camera on or off, your choice.
                  I can see you for real-time form cues, but you're never on the spot.
                </p>
              </div>
            </div>

            <div className="bg-background border rounded-lg p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                4
              </div>
              <div>
                <h3 className="text-lg mb-2">Catch the Replay If You Need To</h3>
                <p className="text-muted-foreground">
                  Every class is recorded. If you can't make it live — or if it's a flare day
                  and you'd rather do it in your own time — replays are available in your
                  Private Studio for 7 days.
                </p>
              </div>
            </div>

            <div className="bg-background border rounded-lg p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                5
              </div>
              <div>
                <h3 className="text-lg mb-2">Progress at Your Pace</h3>
                <p className="text-muted-foreground">
                  Build consistency, capacity, and confidence. No pressure, no
                  judgment, just intelligent training that meets you where you are today.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#2E1F33] text-[#FAFAF8] rounded-lg p-6 text-center">
            <p className="text-sm text-[#FAFAF8]/80">
              <span className="text-[#B5C49B]">All you need:</span>{" "}
              A device with a browser (phone, tablet, or laptop), enough space to move,
              and whatever equipment is listed for the class (usually just a mat and optional resistance band).
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            What People Are Saying
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "Finally, a yoga teacher who understands that my body isn't just
                'tight' — it's complex. The adaptations are intelligent, not
                patronising."
              </p>
              <p className="text-sm">- Sarah, Hypermobility EDS</p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "I've built more strength in 12 weeks than in years of trying
                generic programs. Shruti actually gets what it's like to train
                with chronic illness."
              </p>
              <p className="text-sm">- James, Rheumatoid Arthritis</p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "The small group program gave me the accountability I needed and
                a community that understands. No toxic positivity, just real
                support."
              </p>
              <p className="text-sm">- Maya, Chronic Fatigue</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl">Ready to Start Training?</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Your body deserves intelligent training, not generic workouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule">
              <Button
                size="lg"
                className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90"
              >
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
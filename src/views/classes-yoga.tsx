"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, Check, Calendar } from "lucide-react";

export function ClassesYogaPage() {
  return (
    <Layout>
      <SEO
        title="Online Yoga Classes - Adaptive Yoga for Complex Bodies - Shruti Turner"
        description="Live online adaptive yoga classes for chronic illness, autoimmune conditions, and hypermobility. Rehabilitation-informed yoga that prioritizes safety, stability, and nervous system regulation."
        keywords="online yoga classes UK, adaptive yoga online, yoga for chronic illness, yoga for hypermobility, rehabilitation yoga online, therapeutic yoga classes"
        canonicalUrl="https://shrutiturner.com/classes/yoga"
      />
      
      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
            Online Yoga Classes
          </h1>
          <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed mb-8">
            Rehabilitation-informed yoga for bodies that need intelligent, adaptive practice—not just modifications.
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

      {/* What Makes This Different */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Image Section */}
          <div className="mb-16 rounded-lg overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1630225758612-8c511aad6c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjB3b21hbiUyMHlvZ2ElMjBtYXQlMjBhZGFwdGl2ZXxlbnwxfHx8fDE3NzE1Mjk4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Woman practicing adaptive yoga"
              className="w-full h-[400px] object-cover"
            />
          </div>

          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Not Mainstream Yoga With Modifications
          </h2>

          <div className="space-y-12 max-w-3xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-2xl">A Different Premise Entirely</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most yoga modifications are just "easier versions" of poses
                designed for different bodies. Adaptive yoga starts with a
                different premise: what does <em>this</em> body need, and how do
                we work with its reality?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you have chronic pain, arthritis, hypermobility, or fatigue, standard yoga can do more harm than good—even with modifications. These classes are fundamentally different.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Safety First, Always</h3>
              <p className="text-muted-foreground leading-relaxed">
                No pushing into end-range flexibility. No "breathe through the
                pain." No assumptions that mobility equals health. Every practice
                prioritizes joint stability and tissue safety—especially crucial
                for hypermobile, arthritic, or chronically inflamed bodies.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Nervous System Regulation</h3>
              <p className="text-muted-foreground leading-relaxed">
                For people with chronic conditions, nervous system dysregulation
                is common. Practices are designed to help your nervous system
                find regulation, which has real impacts on pain perception,
                fatigue, and symptom management.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Function Over Aesthetics</h3>
              <p className="text-muted-foreground leading-relaxed">
                The goal isn't achieving a particular shape or getting "more
                flexible." It's improving your capacity for movement that matters
                in your daily life—getting up from the floor, reaching overhead,
                maintaining stability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Who This Is For
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✓ This is for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    You have chronic pain, arthritis, or autoimmune conditions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You're hypermobile and need stability, not more flexibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Mainstream yoga classes have left you feeling dismissed or injured
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You want nervous system regulation, not just stretching</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>You value evidence-based approaches over spiritual platitudes</span>
                </li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-8 space-y-4">
              <h3 className="text-xl">✗ This is NOT for you if:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• You want intense, athletic-style yoga flows</li>
                <li>• You're looking for spiritual or religious practices</li>
                <li>• You want to achieve advanced poses for social media</li>
                <li>• You're seeking a quick flexibility fix</li>
                <li>• You're not willing to work slowly and intelligently</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Class Types / Outcomes */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Class Types & What to Expect
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <h3 className="text-xl">Adaptive Yoga Flow</h3>
              <p className="text-sm text-muted-foreground">60 minutes</p>
              <p className="text-muted-foreground leading-relaxed">
                Gentle, stability-focused movement prioritizing joint safety and control. Suitable for all levels.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Joint-safe movement patterns</li>
                <li>• Real-time adaptations for flares</li>
                <li>• Nervous system regulation focus</li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <h3 className="text-xl">Restorative Yoga</h3>
              <p className="text-sm text-muted-foreground">60 minutes</p>
              <p className="text-muted-foreground leading-relaxed">
                Deeply restful practice for nervous system recovery. Perfect for high-fatigue days or post-flare recovery.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Passive, supported poses</li>
                <li>• Vagal tone regulation</li>
                <li>• Breath work integration</li>
              </ul>
            </div>

            <div className="bg-background border rounded-lg p-6 space-y-4">
              <h3 className="text-xl">Yoga for Hypermobility</h3>
              <p className="text-sm text-muted-foreground">60 minutes</p>
              <p className="text-muted-foreground leading-relaxed">
                Strength-focused yoga for hypermobile joints. Control and stability prioritized over flexibility.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Joint stabilization exercises</li>
                <li>• Proprioception training</li>
                <li>• EDS/HSD-appropriate progressions</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              All classes include real-time modifications for your current capacity. Can't make it live? Replays available for 7 days.
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
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-5xl mb-12 text-center">
            Outcomes You Can Expect
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Reduced Pain</h3>
              <p className="text-muted-foreground leading-relaxed">
                Through nervous system regulation and safe movement patterns that
                reduce joint stress and inflammation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Improved Stability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Especially important for hypermobile bodies that need strength
                and control more than flexibility.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Better Function</h3>
              <p className="text-muted-foreground leading-relaxed">
                Movement capacity that translates to easier daily activities and
                improved quality of life.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Nervous System Regulation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tools to help manage the stress response that amplifies chronic
                pain and fatigue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Body Confidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Learning to trust your body again after chronic illness has
                eroded that trust.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl">Practical Skills</h3>
              <p className="text-muted-foreground leading-relaxed">
                Techniques you can use independently to manage symptoms and
                improve well-being.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            What Students Say
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "Finally, a yoga teacher who understands that my body isn't just 'tight'—it's complex. The adaptations are intelligent, not patronizing."
              </p>
              <p className="text-sm">— Sarah, Hypermobility EDS</p>
            </div>

            <div className="bg-secondary/20 border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "For the first time, yoga doesn't leave me feeling worse. Shruti actually understands what it's like to train with chronic illness."
              </p>
              <p className="text-sm">— Maya, Rheumatoid Arthritis</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl leading-tight">
            Ready to Experience Yoga That Works With Your Body?
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Join live classes or catch the replays. All levels welcome, all bodies respected.
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
"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export function CoachingApplyPage() {
  return (
    <Layout>
      <SEO
        title="Apply for Coaching - Shruti Turner"
        description="Apply for coached support with Shruti Turner, from coached training plans to high-touch 1:1 coaching."
        canonicalUrl="https://shrutiturner.com/coaching/apply"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Apply for Coaching</h1>
          <p className="text-brand-accent-light mx-auto max-w-2xl text-xl leading-relaxed md:text-2xl">
            A calm, low-pressure application so we can understand what your body needs and which
            level of support fits best.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="bg-secondary/20 rounded-lg border p-6">
                <h2 className="mb-3 text-2xl">What we&apos;ll ask</h2>
                <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
                  <li>Your goals and what you want training to support</li>
                  <li>The conditions or symptoms you are managing</li>
                  <li>Your current training experience and confidence</li>
                  <li>The support level you think you need right now</li>
                  <li>Availability, scheduling, and whether you already use Move Well</li>
                </ul>
              </div>
              <div className="bg-brand-accent/5 border-brand-accent/20 rounded-lg border p-6">
                <h3 className="mb-2 text-xl">What happens next</h3>
                <ol className="text-muted-foreground space-y-3 text-sm">
                  <li>1. Shruti reviews your application personally.</li>
                  <li>
                    2. You receive a reply with either follow-up questions or a consultation invite.
                  </li>
                  <li>3. If it feels like a fit, onboarding and Everfit setup begin.</li>
                </ol>
              </div>
            </div>

            <form className="bg-background space-y-6 rounded-xl border p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-tier">Which support tier are you interested in?</Label>
                <Input
                  id="support-tier"
                  placeholder="Coached Training Plan, 1:1 Coaching, or not sure yet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">
                  What conditions or health challenges are you managing? *
                </Label>
                <Textarea id="conditions" rows={4} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">What are you hoping to achieve through coaching? *</Label>
                <Textarea id="goals" rows={4} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">What is your current training experience?</Label>
                <Textarea id="experience" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-needs">
                  What kind of support do you think you need right now?
                </Label>
                <Textarea id="support-needs" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">
                  Anything we should know about your schedule or availability?
                </Label>
                <Textarea id="availability" rows={3} />
              </div>

              <Button type="submit" size="lg" className="w-full">
                <MessageCircle className="mr-2 h-5 w-5" />
                Submit Application
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                By submitting this form, you agree to being contacted about coaching services. Your
                information stays confidential.
              </p>
            </form>
          </div>

          <div className="mt-12 text-center">
            <Link href="/coaching">
              <Button variant="outline">
                Back to Coaching Options
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

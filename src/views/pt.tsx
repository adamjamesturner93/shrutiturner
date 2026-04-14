"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function PTPage() {
  return (
    <Layout>
      <SEO
        title="1:1 Personal Training for Complex Bodies - Shruti Turner"
        description="Personalized strength and movement programming designed for people with chronic illness and autoimmune conditions. Evidence-based coaching that adapts to your symptoms."
        keywords="personal training chronic illness, 1:1 strength coaching, personal trainer autoimmune disease, chronic pain personal training"
        canonicalUrl="https://shrutiturner.co.uk/pt"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">
            1:1 Personal Training for Complex Bodies
          </h1>
          <p className="mb-8 text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
            Fully personalized strength and movement programming designed around your specific
            condition, symptoms, and goals.
          </p>
          <div className="inline-block rounded-lg bg-[#FAFAF8]/10 p-4">
            <p className="mb-2 text-sm opacity-90">Personalised to You</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="text-lg">From £75 / session</span>
            </div>
            <Link
              href="/pricing"
              className="mt-2 inline-block text-sm text-[#B5C49B] hover:underline"
            >
              View full pricing & submit an enquiry →
            </Link>
          </div>
        </div>
      </section>

      {/* Why 1:1 Coaching */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-16 overflow-hidden rounded-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1541612093005-d099de26e36d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmVuZ3RoJTIwdHJhaW5pbmclMjBjaHJvbmljJTIwaWxsbmVzc3xlbnwxfHx8fDE3NzE1Mjk4Njd8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Woman doing strength training"
              className="h-[400px] w-full object-cover"
              loading="lazy"
            />
          </div>

          <h2 className="mb-12 text-center text-3xl md:text-5xl">Why 1:1 Coaching</h2>

          <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-2xl">Fully Personalized</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not group classes with modifications. Not generic templates. Every aspect of your
                program is designed specifically for your body, conditions, current capacity, and
                goals.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Programs include optimal-day training plus modified versions for moderate and
                difficult days—removing decision fatigue when symptoms flare.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl">What You Get</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">Comprehensive initial assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Three-tier programming (optimal/moderate/survival days)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Regular 1:1 sessions (frequency based on package)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Ongoing app-based support and check-ins
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Continuous program adaptation based on your response
                  </span>
                </li>
              </ul>
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
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>Group classes don't account for your specific needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You need programming that adapts to unpredictable symptoms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You want one-on-one accountability and support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You have complex conditions requiring specialized knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>You're ready to invest in long-term capacity building</span>
                </li>
              </ul>
            </div>

            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">✗ This is NOT for you if:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>• You want quick fixes or dramatic transformations</li>
                <li>• You're not ready to commit to consistent work</li>
                <li>• You prefer group training environments</li>
                <li>• You're looking for generic fitness programming</li>
                <li>• Budget constraints make group classes more suitable</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mx-auto max-w-2xl">
              <strong>Not sure if 1:1 is right for you?</strong> Try{" "}
              <Link href="/classes" className="text-primary underline">
                group classes
              </Link>{" "}
              or{" "}
              <Link href="/classes/small-groups" className="text-primary underline">
                small group programs
              </Link>{" "}
              first. You can always upgrade later.
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-6 text-3xl md:text-5xl">Apply for 1:1 Coaching</h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Fill out this application to start a conversation. I review all applications
              personally and respond within 48 hours.
            </p>
          </div>

          <form className="bg-secondary/10 space-y-6 rounded-lg border p-8">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">
                What chronic conditions or health challenges are you managing? *
              </Label>
              <Textarea
                id="conditions"
                rows={4}
                placeholder="e.g., Rheumatoid arthritis, chronic fatigue, hypermobility..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">
                What's your current experience with strength training?
              </Label>
              <Textarea
                id="experience"
                rows={3}
                placeholder="Complete beginner, some experience, regularly train..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What are you hoping to achieve through coaching? *</Label>
              <Textarea
                id="goals"
                rows={4}
                placeholder="e.g., Reduce pain, build capacity for daily activities, prepare for hiking..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenges">
                What are your biggest challenges with training or movement right now?
              </Label>
              <Textarea
                id="challenges"
                rows={4}
                placeholder="e.g., Fatigue limits consistency, don't know how to modify around pain..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">Anything else you'd like me to know?</Label>
              <Textarea id="additional" rows={3} />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Submit Enquiry
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              By submitting this form, you agree to being contacted about coaching services. Your
              information is kept confidential.
            </p>
          </form>

          {/* What happens next */}
          <div className="bg-secondary/20 mt-8 space-y-4 rounded-lg border p-6">
            <h3 className="text-center text-xl">What Happens Next</h3>
            <div className="mx-auto max-w-md space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                  1
                </div>
                <p className="text-muted-foreground pt-1 text-sm">
                  I review your enquiry personally within 48 hours
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                  2
                </div>
                <p className="text-muted-foreground pt-1 text-sm">
                  I respond with questions or a proposal tailored to your needs
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                  3
                </div>
                <p className="text-muted-foreground pt-1 text-sm">
                  We arrange an initial conversation (no obligation, no hard sell)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="bg-[#4B5B32] py-16 text-[#FAFAF8]">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-lg leading-relaxed opacity-90">
            "Coaching spots are limited to ensure each client receives the attention and expertise
            they deserve. Enquiries are reviewed on a rolling basis."
          </p>
        </div>
      </section>
    </Layout>
  );
}

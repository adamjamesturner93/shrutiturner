"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Crown,
  Dumbbell,
  GraduationCap,
  MessageCircle,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import {
  applicationJourney,
  coachingFaqs,
  coachingTiers,
  personalProgrammeJourney,
} from "@/data/marketing";

const tierIcon = {
  "independent-plan": ClipboardList,
  "coached-plan": Users,
  coaching: GraduationCap,
} as const;

export function CoachingPage() {
  return (
    <Layout>
      <SEO
        title="Coaching - Shruti Turner"
        description="Three tiers of personalised support for complex bodies, from tailored programming to high-touch 1:1 coaching."
        keywords="coaching chronic illness, personal training complex bodies, everfit coaching, training plan chronic pain"
        canonicalUrl="https://shrutiturner.com/coaching"
      />

      <section className="bg-brand-dark text-brand-white py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-brand-accent-light mb-4 text-sm tracking-[0.2em] uppercase">
            1:1 Support
          </p>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">
            Coaching Built Around
            <br />
            <span className="text-brand-accent-light">Your Body</span>
          </h1>
          <p className="text-brand-white/80 mx-auto mb-10 max-w-2xl text-xl leading-relaxed md:text-2xl">
            Three levels of personalised support, from tailored programming you follow independently
            to a full coaching partnership for complex bodies.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#tiers">
              <Button
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                Explore Options
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/coaching/apply">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white/30 text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b py-16 md:py-20">
        <div className="container mx-auto grid max-w-5xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl md:text-4xl">
              Not generic fitness.
              <br />
              Not just modifications.
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Every plan is designed around your conditions, symptoms, current capacity, and how
              those variables change across the month.
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Programmes include optimal-day, moderate-day, and survival-day options so symptom
              fluctuations do not force you into an all-or-nothing relationship with training.
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
                <Dumbbell className="mr-1.5 h-3.5 w-3.5" />
                Three-tier programming
              </Badge>
              <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
                <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                Everfit delivery
              </Badge>
              <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Condition-aware
              </Badge>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1654613412232-10aaf36df8a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmV0Y2hpbmclMjB5b2dhJTIwY2FsbSUyMG1pbmRmdWwlMjBtb3ZlbWVudHxlbnwxfHx8fDE3NzMzMjQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Mindful movement session"
              className="h-[350px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="tiers" className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl md:text-5xl">Choose Your Level of Support</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Each tier includes expert programming. The difference is how much live coaching,
              review, and strategic support you need.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {coachingTiers.map((tier) => {
              const Icon = tierIcon[tier.id];
              const highlighted = tier.id === "coached-plan";
              const highest = tier.id === "coaching";

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border-2 p-7 md:p-8 ${
                    highlighted
                      ? "border-brand-accent/40 bg-brand-accent/5 shadow-lg"
                      : highest
                        ? "border-brand-dark/30"
                        : "border-border/60"
                  }`}
                >
                  {highlighted ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-accent text-brand-white inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        Most Popular
                      </span>
                    </div>
                  ) : null}
                  {highest ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-dark text-brand-white inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs">
                        <Crown className="h-3.5 w-3.5" />
                        Highest Support
                      </span>
                    </div>
                  ) : null}

                  <div className="mb-6">
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                        highlighted
                          ? "bg-brand-accent text-brand-white"
                          : highest
                            ? "bg-brand-dark text-brand-white"
                            : "bg-bronze/10 text-bronze-text"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl">{tier.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm italic">{tier.tagline}</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-brand-dark text-2xl">{tier.priceLabel}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{tier.priceNote}</p>
                  </div>

                  <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge className="bg-secondary text-foreground border-border text-xs">
                      {tier.supportLevel === "async"
                        ? "Async Support"
                        : tier.supportLevel === "moderate"
                          ? "Live + Async"
                          : "Highest Touch"}
                    </Badge>
                    {tier.includesMembership ? (
                      <Badge className="bg-brand-accent/10 text-brand-accent border-brand-accent/20 text-xs">
                        Move Well Included
                      </Badge>
                    ) : null}
                  </div>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tier.ctaHref}>
                    <Button
                      size="lg"
                      variant={highlighted || highest ? "default" : "outline"}
                      className={`w-full ${
                        highlighted
                          ? "bg-brand-accent hover:bg-brand-accent/90 text-brand-white"
                          : highest
                            ? "bg-brand-dark hover:bg-brand-dark/90 text-brand-white"
                            : ""
                      }`}
                    >
                      {tier.purchaseModel === "application" ? (
                        <MessageCircle className="mr-2 h-4 w-4" />
                      ) : null}
                      {tier.ctaLabel}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Not sure which tier is right for you?{" "}
              <Link href="/coaching/apply?tier=unsure" className="text-primary underline">
                Apply and we&apos;ll figure it out together
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-14 text-center text-3xl md:text-5xl">How It Works</h2>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-bronze/10 text-bronze-text flex h-10 w-10 items-center justify-center rounded-lg">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl">Independent Training Plan</h3>
                  <p className="text-muted-foreground text-xs">Self-serve purchase</p>
                </div>
              </div>
              <div className="space-y-4">
                {personalProgrammeJourney.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="bg-bronze text-brand-white flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                      {step.step}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm">{step.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-brand-dark/10 text-brand-dark flex h-10 w-10 items-center justify-center rounded-lg">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl">Coached Plan & 1:1 Coaching</h3>
                  <p className="text-muted-foreground text-xs">Application-based</p>
                </div>
              </div>
              <div className="space-y-4">
                {applicationJourney.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="bg-brand-dark text-brand-white flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm">
                      {step.step}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm">{step.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-brand-accent/5 border-brand-accent/20 rounded-2xl border p-8 md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <div className="bg-brand-accent/10 text-brand-accent mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm">
                  <Smartphone className="h-4 w-4" />
                  Training App
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl">Your Programme Lives in Everfit</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Everfit is where your workouts, habit tracking, and check-ins live. The website
                  remains the main service hub, while Everfit handles the day-to-day training
                  experience.
                </p>
                <ul className="space-y-2">
                  {[
                    "Workout delivery with video demonstrations",
                    "Training logs and progress tracking",
                    "Habit tracking and check-ins",
                    "Direct messaging with Shruti",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <Check className="text-brand-accent h-4 w-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1591311630200-ffa9120a540f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwYXBwJTIwd29ya291dCUyMHBsYW4lMjBwcm9ncmFtbWluZ3xlbnwxfHx8fDE3NzMzMjQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Everfit style training workflow"
                  className="h-[280px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-5xl">Who This Is For</h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="flex items-center gap-2 text-xl">
                <Check className="text-brand-accent h-5 w-5" />
                This is for you if:
              </h3>
              <ul className="text-muted-foreground space-y-3">
                {[
                  "Group classes don't account for your specific needs",
                  "You need programming that adapts to unpredictable symptoms",
                  "You want expert guidance from someone who understands complex bodies",
                  "You have multiple conditions requiring specialist knowledge",
                  "You're ready to invest in long-term capacity building",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background space-y-4 rounded-lg border p-8">
              <h3 className="text-xl">This is not the best fit if:</h3>
              <ul className="text-muted-foreground list-disc space-y-3 pl-5">
                <li>You want quick fixes or dramatic transformations</li>
                <li>You are not ready to commit to consistent work</li>
                <li>You prefer group training environments only</li>
                <li>You want generic programming rather than specialist support</li>
                <li>Budget constraints make classes the better fit right now</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-3xl md:text-5xl">Common Questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {coachingFaqs.map((faq) => (
              <AccordionItem
                key={faq.slug}
                value={faq.slug}
                className="bg-background rounded-lg border px-6"
              >
                <AccordionTrigger className="text-left text-sm hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-brand-dark text-brand-white py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Sparkles className="text-brand-accent-light mx-auto mb-4 h-8 w-8" />
          <h2 className="mb-4 text-3xl md:text-4xl">Ready to Train Smarter?</h2>
          <p className="text-brand-white/70 mx-auto mb-8 max-w-xl">
            Whether you want expert programming to follow independently or a full coaching
            partnership, every option starts with understanding your body.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/coaching/apply">
              <Button
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                Apply for Coached Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/coaching/personal-programme">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-white/30 text-brand-white hover:bg-brand-white/10 bg-transparent"
              >
                Independent Training Plan
              </Button>
            </Link>
          </div>
          <p className="text-brand-white/40 mt-6 text-sm">
            Coaching spots are limited to protect the quality of support.
          </p>
        </div>
      </section>
    </Layout>
  );
}
